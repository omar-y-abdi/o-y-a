import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { seed, legacyInitial } from '../.generated/cms-seed.mjs';
import { frameMigration } from '../scripts/cms-migrate-frame.mjs';
import { pruneRendered } from '../scripts/cms-prune-rendered.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

test('B8: head migration and reverse are guarded by source version and hash', async () => {
  const project = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  const snapshot = { version: 185, project };
  const intent = frameMigration(snapshot, seed);
  assert.equal(intent.expectedVersion, 185);
  assert.match(intent.expectedHash, /^[a-f0-9]{64}$/);
  assert.equal(intent.project.schemaVersion, 2);
  assert.throws(() => frameMigration(snapshot, seed, { expectedVersion: 184 }), /matchar inte/);
  assert.throws(() => frameMigration(snapshot, seed, { expectedHash: '0'.repeat(64) }), /matchar inte/);
  const reverse = frameMigration({ version: 186, project: intent.project }, seed, { reverse: true });
  assert.equal(reverse.project.schemaVersion, 1);
  assert.equal(reverse.project.pages.length, 15);
  assert.ok(reverse.project.pages.every(page => page.html.includes('site-footer')));
  assert.throws(() => frameMigration({ version: 186, project: intent.project }, seed), /redan/);
});

test('B8: migration endpoint publishes one transaction, rejects stale hashes, replays and reverses for code rollback', async () => {
  const runtime = await cmsRuntime();
  try {
    const legacy = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
    await publishSite(runtime.db, { project: legacy, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
    const cookie = `CF_Authorization=${await runtime.token()}`;
    const post = body => runtime.mf.dispatchFetch(runtime.url + '/admin/api/migrate-frame', { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify(body) });
    const envelope = (intent, requestId = crypto.randomUUID()) => { const { project: _project, ...body } = intent; return { ...body, requestId }; };
    const intent = frameMigration(await readSite(runtime.db), seed);
    const bad = await post({ ...envelope(intent), expectedHash: '0'.repeat(64) });
    assert.equal(bad.status, 409);
    assert.equal((await readSite(runtime.db)).version, 1);
    const divergent = await post({ ...envelope(intent), projectHash: '0'.repeat(64) });
    assert.equal(divergent.status, 409);
    assert.equal((await readSite(runtime.db)).version, 1);
    const bodies = [envelope(intent), envelope(intent)];
    const responses = await Promise.all(bodies.map(post));
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
    const winner = responses.findIndex(response => response.status === 200);
    const saved = await responses[winner].json();
    assert.equal(saved.version, 2);
    const replay = await post(bodies[winner]);
    assert.equal(replay.status, 200, await replay.clone().text());
    assert.equal((await replay.json()).replayed, true);
    assert.equal((await runtime.db.prepare('SELECT count(*) AS total FROM cms_revisions').first()).total, 2);
    assert.equal((await runtime.db.prepare("SELECT count(*) AS total FROM cms_rendered WHERE version=2 AND path='@frame'").first()).total, 1);
    const migrated = await readSite(runtime.db);
    assert.equal(migrated.project.schemaVersion, 2);
    assert.ok(migrated.project.pages.every(page => !page.html.includes('<footer')));
    const reverse = frameMigration(migrated, seed, { reverse: true });
    const rolledBack = await post(envelope(reverse));
    assert.equal(rolledBack.status, 200, await rolledBack.clone().text());
    const restored = await readSite(runtime.db);
    assert.equal(restored.version, 3);
    assert.equal(restored.project.schemaVersion, 1);
    assert.ok(restored.project.pages.every(page => page.html.includes('<footer')));
    assert.equal((await runtime.db.prepare("SELECT count(*) AS total FROM cms_rendered WHERE version=3 AND path='@frame'").first()).total, 0);
    assert.equal((await readSite(runtime.db, 2)).project.schemaVersion, 2, 'Rollback adds a revision and keeps the migrated history');
    assert.equal((await post(envelope(reverse))).status, 409, 'A reverse migration cannot run twice');
  } finally { await runtime.close(); }
});

test('B8: a full Save committed before the format change replays its canonical legacy hash', async () => {
  const runtime = await cmsRuntime();
  try {
    const requestId = crypto.randomUUID();
    assert.equal(legacyInitial.pages[0].facts.references, undefined, 'Legacy payload hashes keep the preceding facts shape');
    await publishSite(runtime.db, { project: legacyInitial, baseVersion: 0, requestId, actor: runtime.email });
    const cookie = `CF_Authorization=${await runtime.token()}`;
    const save = id => runtime.mf.dispatchFetch(runtime.url + '/admin/api/save', { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify({ project: legacyInitial, baseVersion: id === requestId ? 0 : 1, requestId: id }) });
    const replay = await save(requestId);
    assert.equal(replay.status, 200, await replay.clone().text());
    assert.equal((await replay.json()).replayed, true);
    assert.equal((await readSite(runtime.db)).version, 1);
    const next = await save(crypto.randomUUID());
    assert.equal(next.status, 200, await next.clone().text());
    assert.equal((await readSite(runtime.db)).project.schemaVersion, 2);
    assert.equal((await readSite(runtime.db)).version, 2);
  } finally { await runtime.close(); }
});

test('B8/A17/C1: pruning rendered history preserves raw migration CAS and reverse conversion', async () => {
  const runtime = await cmsRuntime();
  try {
    const legacy = structuredClone(legacyInitial);
    legacy.pages[0].project = { components: false };
    const save = (project, baseVersion) => publishSite(runtime.db, { project, baseVersion, requestId: crypto.randomUUID(), actor: runtime.email });
    await save(legacy, 0);
    await save(legacy, 1);
    const source = await readSite(runtime.db, undefined, { raw: true });
    const intent = frameMigration(source, seed);
    assert.equal((await readSite(runtime.db)).project.pages[0].project, null, 'Ordinary reads discard unused editor metadata');
    const now = Date.now() + 26 * 3600000;
    const prune = () => pruneRendered(sql => runtime.db.prepare(sql).all(), { apply: true, now: () => now, log() {} });
    const count = async version => (await runtime.db.prepare("SELECT count(*) AS n FROM cms_rendered WHERE version=? AND path NOT IN ('@resources','@email')").bind(version).first()).n;
    assert.ok((await prune()).rowsDeleted > 0);
    assert.equal(await count(1), 0);
    assert.ok(await count(2) > 0, 'The head keeps its rendered rows');
    assert.deepEqual((await readSite(runtime.db, undefined, { raw: true })).project, source.project);
    const cookie = `CF_Authorization=${await runtime.token()}`;
    const migrate = intent => {
      const { project: _project, ...body } = intent;
      return runtime.mf.dispatchFetch(runtime.url + '/admin/api/migrate-frame', { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify({ ...body, requestId: crypto.randomUUID() }) });
    };
    const forward = await migrate(intent);
    assert.equal(forward.status, 200, await forward.clone().text());
    const migrated = await readSite(runtime.db);
    assert.equal(migrated.version, 3);
    await save(migrated.project, 3);
    await prune();
    assert.equal(await count(3), 0, 'Even the historical @frame row may expire');
    assert.ok(await count(4) > 0);
    const reverse = frameMigration(await readSite(runtime.db, undefined, { raw: true }), seed, { reverse: true });
    const rollback = await migrate(reverse);
    assert.equal(rollback.status, 200, await rollback.clone().text());
    const restored = await readSite(runtime.db);
    assert.equal(restored.version, 5);
    assert.equal(restored.project.schemaVersion, 1);
    assert.ok(restored.project.pages.every(page => page.html.includes('<footer')));
    assert.equal((await readSite(runtime.db, 3)).project.schemaVersion, 2);
    assert.deepEqual((await readSite(runtime.db, 1, { raw: true })).project, legacy, 'Pruning leaves every compressed revision available');
  } finally { await runtime.close(); }
});
