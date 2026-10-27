import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { publishSite, readSite, readPublicPage, readPublicData } from '../src/cms/store.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { updateBuiltinAsset } from '../src/cms/assets.mjs';
import { handleContact } from '../src/server/contact.mjs';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';

const runtime = await cmsRuntime();
after(() => runtime.close());
const db = runtime.db;
const save = (project, baseVersion) => publishSite(db, { project, baseVersion, requestId: crypto.randomUUID(), actor: runtime.email });
const count = async version => (await db.prepare("SELECT count(*) AS n FROM cms_rendered WHERE version = ? AND path NOT IN ('@resources','@email')").bind(version).first()).n;

test('A17: retention starts at replacement; stale publications delete nothing; historical receipts stay byte-identical', async () => {
  const project = structuredClone(initial);
  project.email = structuredClone(DEFAULT_EMAIL);
  project.email.templates.receipt.subject = 'Sparat kvitto';
  const builtin = seed.assets.find(asset => asset.src === '/mail/omar-smile.gif');
  assert.ok(builtin, 'customize an actual receipt resource');
  await updateBuiltinAsset(db, builtin, { baseVersion: 0, alt: 'Alt från den öppna fliken' });
  await save(project, 0);
  const originalCount = await count(1);
  assert.ok(originalCount > 0);
  await db.prepare('UPDATE cms_revisions SET created_at = ? WHERE version = 1').bind(new Date(Date.now() - 72 * 3600000).toISOString()).run();

  const env = { CMS_DB: db, CONTACT_TO: 'owner@example.test', RESEND_API_KEY: 'fixture-key', TURNSTILE_SECRET_KEY: 'fixture-secret', TURNSTILE_SITE_KEY: 'fixture-site', CONTACT_HASH_SECRET: 'x'.repeat(32), CONTACT_RATE_LIMIT: { limit: async () => ({ success: true }) } };
  const data = { name: 'Besökare', email: 'visitor@example.test', message: 'Hej', website: '', token: 'challenge', submission: crypto.randomUUID(), contentVersion: 1 };
  const request = () => new Request('https://omaryusuf.se/api/contact', { method: 'POST', headers: { Origin: 'https://omaryusuf.se', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify(data) });
  let pinned, key, delivered = 0, loseResponse = true;
  const provider = async (url, init) => {
    if (String(url).includes('siteverify')) return Response.json({ success: true, hostname: 'omaryusuf.se', action: 'contact' });
    const incomingKey = init.headers['Idempotency-Key'];
    if (pinned !== undefined && (init.body !== pinned || incomingKey !== key)) return Response.json({ name: 'invalid_idempotent_request' }, { status: 409 });
    if (pinned === undefined) { pinned = init.body; key = incomingKey; delivered++; }
    if (loseResponse) { loseResponse = false; throw new Error('accepted, response lost'); }
    return Response.json({ data: JSON.parse(init.body).map((_, index) => ({ id: `mail-${index}` })) });
  };
  assert.equal((await handleContact(request(), env, provider)).status, 503);
  assert.match(pinned, /Alt från den öppna fliken/);
  assert.match(pinned, /Sparat kvitto/);
  await save(initial, 1);
  await db.prepare('UPDATE cms_revisions SET created_at = ? WHERE version = 2').bind(new Date(Date.now() - 23 * 3600000).toISOString()).run();
  await save(initial, 2);
  assert.equal(await count(1), originalCount, 'old creation time must not shorten the replacement window');
  assert.equal((await runtime.mf.dispatchFetch(runtime.url + '/cms-public/v1/home.css')).status, 200);
  await db.prepare('UPDATE cms_revisions SET created_at = ? WHERE version = 2').bind(new Date(Date.now() - 24 * 3600000 - 60000).toISOString()).run();
  const before = await db.prepare('SELECT version,path FROM cms_rendered ORDER BY version,path').all();
  await assert.rejects(save(initial, 1), { status: 409 });
  assert.deepEqual((await db.prepare('SELECT version,path FROM cms_rendered ORDER BY version,path').all()).results, before.results);
  await save(initial, 3);
  assert.equal(await count(1), 0);
  assert.equal(await count(2), originalCount);
  assert.equal(await count(3), originalCount);
  assert.equal((await runtime.mf.dispatchFetch(runtime.url + '/cms-public/v1/home.css')).status, 404);
  assert.equal((await runtime.mf.dispatchFetch(runtime.url + '/cms-public/v3/home.css')).status, 200);
  for (const version of [1, 2, 3, 4]) for (const path of ['@resources', '@email']) assert.ok(await db.prepare('SELECT html FROM cms_rendered WHERE version=? AND path=?').bind(version, path).first());
  assert.equal((await handleContact(request(), env, provider)).status, 200);
  assert.equal(delivered, 1);
  assert.equal((await readPublicPage(db, '/')).version, 4);
  for (const name of ['cards', 'runtime', 'manifest']) assert.equal((await readPublicData(db, name)).version, 4);
  const old = await readSite(db, 1);
  assert.doesNotThrow(() => validateProject(old.project, seed));
  await db.prepare('UPDATE cms_revisions SET created_at = ? WHERE version = 3').bind(new Date(Date.now() - 48 * 3600000).toISOString()).run();
  const retained = await db.prepare('SELECT version,path FROM cms_rendered ORDER BY version,path').all();
  await db.exec("CREATE TRIGGER reject_fixture_head BEFORE UPDATE ON cms_head BEGIN SELECT RAISE(ABORT, 'fixture head failure'); END;");
  try {
    await assert.rejects(save(initial, 4), /fixture head failure/);
    assert.equal((await readSite(db)).version, 4);
    assert.deepEqual((await db.prepare('SELECT version,path FROM cms_rendered ORDER BY version,path').all()).results, retained.results, 'a later failure rolls back the prune too');
  } finally { await db.exec('DROP TRIGGER reject_fixture_head'); }
  const cookie = 'CF_Authorization=' + await runtime.token();
  const recovered = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/recover', { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify({ project: old.project, pendingSave: null }) });
  assert.equal(recovered.status, 200, await recovered.clone().text());
  const restored = await save((await recovered.json()).project, 4);
  assert.equal(restored.version, 5);
  for (const path of ['/', '/sitemap.xml', '/data/cards.json', '/data/runtime.json', `/data/cards/${initial.cards[0].id}.json`]) {
    const response = await runtime.mf.dispatchFetch(runtime.url + path);
    assert.equal(response.status, 200, path);
    await response.body?.cancel();
  }
});
