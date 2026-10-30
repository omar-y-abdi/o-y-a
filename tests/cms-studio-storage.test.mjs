import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { readStudioHead, readStudioVersion, textParts, STUDIO_TEXT_CHUNK } from '../src/cms/studio-store.mjs';
import { nodeWorker, nodeCms } from './helpers/cms-node.mjs';

const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const project = validateProject(normalizeStoredProject(structuredClone(raw), seed, initial), seed, undefined, { origins: ['https://omaryusuf.se'] });
const worker = await nodeWorker();
const save = (runtime, baseVersion, next = project, options = {}) => publishSite(runtime.db, { project: next, baseVersion, requestId: crypto.randomUUID(), actor: 'owner@example.test', studioKey: seed.studioKey, ...options });

test('canonical state serves trusted JSON without revision BLOBs or whole-project parsing; assets remain current', async () => {
  assert.match(seed.studioKey, /^[0-9a-f]{64}$/);
  const runtime = await nodeCms(raw, worker);
  try {
    await save(runtime, 185);
    const parse = JSON.parse, stringify = JSON.stringify;
    runtime.queries.length = 0; runtime.blobSizes.length = 0;
    let response;
    try {
      JSON.parse = (text, ...args) => { assert.ok(!(text.length > 100000 && text.includes('"pages"')), 'state parsed a full project'); return parse(text, ...args); };
      JSON.stringify = (value, ...args) => { assert.ok(!value?.pages && !value?.project?.pages, 'state serialized a full project'); return stringify(value, ...args); };
      response = await runtime.fetch('/admin/api/state');
    } finally { JSON.parse = parse; JSON.stringify = stringify; }
    assert.equal(response.status, 200, await response.clone().text());
    const state = await response.json();
    assert.deepEqual(state.project, project);
    assert.equal(state.version, 186);
    assert.deepEqual(runtime.blobSizes, []);
    assert.ok(runtime.queries.every(sql => !/\bcms_revisions\b/.test(sql)), 'state read the revision table');
    assert.equal(runtime.queries.filter(sql => /cms_studio_heads|cms_revision_resource_index/.test(sql)).length, 1, 'canonical text and reference inventory use one storage round trip');
    const builtin = state.assets.find(asset => asset.builtin && asset.src);
    assert.ok(builtin);
    await runtime.db.prepare('INSERT INTO cms_builtin_resource_state(source_path,version,name,alt,updated_at) VALUES(?,1,?,?,?)').bind(builtin.src, 'Nytt namn utan Save', 'Ny alternativtext', new Date().toISOString()).run();
    const updated = await (await runtime.fetch('/admin/api/state')).json();
    assert.equal(updated.assets.find(asset => asset.id === builtin.id).name, 'Nytt namn utan Save');
    assert.equal(updated.assets.find(asset => asset.id === builtin.id).alt, 'Ny alternativtext');
    assert.deepEqual(updated.project, project);
    assert.equal(updated.version, 186);
    runtime.blobSizes.length = 0;
    assert.deepEqual((await readSite(runtime.db, 185, { raw: true })).project, raw);
    assert.ok(runtime.blobSizes.length, 'history still reads the original compressed revision');
  } finally { runtime.close(); }
});

test('canonical publication preserves CAS, replay identity, foreign keys and complete rollback', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    assert.equal(runtime.sqlite.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    const requestId = crypto.randomUUID();
    const first = await save(runtime, 185, project, { requestId });
    const before = await readStudioHead(runtime.db, seed.studioKey);
    assert.equal(before.version, 186);
    assert.deepEqual(JSON.parse(before.parts.join('')), project);
    assert.equal((await save(runtime, 185, project, { requestId })).version, first.version);
    assert.deepEqual(await readStudioHead(runtime.db, seed.studioKey), before);
    const changed = structuredClone(project); changed.pages[0].title += ' Ändring';
    await assert.rejects(save(runtime, 185, changed, { requestId }), { status: 409 });
    await assert.rejects(save(runtime, 185, changed), { status: 409 });
    assert.deepEqual(await readStudioHead(runtime.db, seed.studioKey), before);
    runtime.sqlite.exec("CREATE TRIGGER fail_studio_text BEFORE INSERT ON cms_studio_text BEGIN SELECT RAISE(ABORT,'studio write failed'); END");
    await assert.rejects(save(runtime, 186, changed), /studio write failed/);
    assert.deepEqual(await readStudioHead(runtime.db, seed.studioKey), before);
    assert.equal((await readSite(runtime.db)).version, 186);
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_revisions').get().n, 2);
    runtime.sqlite.exec('DROP TRIGGER fail_studio_text');
    const attempts = await Promise.allSettled([changed, project].map(candidate => save(runtime, 186, candidate)));
    assert.equal(attempts.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal(attempts.find(item => item.status === 'rejected').reason.status, 409);
    const latest = await readStudioHead(runtime.db, seed.studioKey);
    assert.equal(latest.version, 187);
    assert.deepEqual(JSON.parse(latest.parts.join('')), (await readSite(runtime.db)).project);
    for (const table of ['cms_studio_heads', 'cms_studio_text']) assert.deepEqual(runtime.sqlite.prepare(`SELECT DISTINCT version FROM ${table}`).all().map(row => row.version), [187]);
    assert.deepEqual(runtime.sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { runtime.close(); }
});

test('API full and delta Save write matching canonical text and replay without replacing a later head', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const body = { project, baseVersion: 185, requestId: crypto.randomUUID() };
    const first = await runtime.fetch('/admin/api/save', body);
    assert.equal(first.status, 200, await first.clone().text());
    assert.equal((await readStudioHead(runtime.db, seed.studioKey)).version, 186);
    const page = { ...project.pages[0], description: 'Delta utan förlorad sidram' };
    delete page.facts;
    const delta = { changes: { pages: { upsert: [page], remove: [] } }, baseVersion: 186, requestId: crypto.randomUUID() };
    const second = await runtime.fetch('/admin/api/save', delta);
    assert.equal(second.status, 200, await second.clone().text());
    const latest = await readStudioHead(runtime.db, seed.studioKey);
    assert.equal(latest.version, 187);
    for (const attempt of [body, delta]) {
      const replay = await runtime.fetch('/admin/api/save', attempt);
      assert.equal(replay.status, 200, await replay.clone().text());
      assert.equal((await replay.json()).replayed, true);
      assert.deepEqual(await readStudioHead(runtime.db, seed.studioKey), latest);
    }
    assert.equal(runtime.sqlite.prepare('SELECT request_format FROM cms_revisions WHERE version=186').get().request_format, 'full-v1');
    assert.equal(runtime.sqlite.prepare('SELECT request_format FROM cms_revisions WHERE version=187').get().request_format, 'delta-v1');
  } finally { runtime.close(); }
});

test('different build, absent schema and cache invalidation use legacy reads; corrupt present storage is surfaced', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await save(runtime, 185);
    assert.equal(await readStudioHead(runtime.db, 'different-build'), null);
    await runtime.db.prepare("UPDATE cms_studio_heads SET build_key='older-build'").run();
    runtime.blobSizes.length = 0;
    const fallback = await runtime.fetch('/admin/api/state');
    assert.equal(fallback.status, 200, await fallback.clone().text());
    assert.deepEqual((await fallback.json()).project, project);
    assert.ok(runtime.blobSizes.length);
    await runtime.db.prepare('UPDATE cms_studio_heads SET build_key=?').bind(seed.studioKey).run();
    await runtime.db.prepare('DELETE FROM cms_studio_text WHERE part=0').run();
    assert.equal((await runtime.fetch('/admin/api/state')).status, 503);
    await save(runtime, 186);
    await runtime.db.prepare('DELETE FROM cms_revision_resource_indexed WHERE version=187').run();
    assert.equal((await runtime.fetch('/admin/api/state')).status, 503);
    await save(runtime, 187, project, { studioKey: undefined });
    assert.equal(await readStudioVersion(runtime.db, 187), null);
    assert.equal(await readStudioHead(runtime.db, seed.studioKey), null);
    assert.equal((await runtime.fetch('/admin/api/state')).status, 200);
  } finally { runtime.close(); }
  const oldSchema = await nodeCms(raw, worker, 185, { migrationLimit: 11 });
  try {
    const response = await oldSchema.fetch('/admin/api/state');
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await response.json()).project.schemaVersion, 2);
  } finally { oldSchema.close(); }
});

test('canonical chunks retain Unicode boundaries and bounded D1 values', () => {
  const text = 'a'.repeat(STUDIO_TEXT_CHUNK - 1) + '🙂'.repeat(STUDIO_TEXT_CHUNK) + 'åäö';
  const parts = textParts(text);
  assert.ok(parts.length > 1);
  assert.equal(parts.map(part => new TextDecoder().decode(new TextEncoder().encode(part))).join(''), text);
  assert.ok(parts.every(part => Buffer.byteLength(part) <= 128 * 1024));
});
