import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { migrateCmsDb } from './helpers/cms-runtime.mjs';
import { pruneRendered } from '../scripts/cms-prune-rendered.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';

const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response("test"); } };', compatibilityDate: '2026-09-11', d1Databases: ['CMS_DB'] }));
after(() => mf.dispose());
const db = await mf.getD1Database('CMS_DB');
await migrateCmsDb(db);
const now = Date.parse('2026-10-25T12:00:00Z');
const log = () => {};
const versionsPerDelete = [];
const query = async sql => {
  if (sql.startsWith('DELETE')) versionsPerDelete.push(sql.match(/version IN \(([^)]+)\)/)[1].split(',').length);
  return db.prepare(sql).all();
};

test('A17 cleanup: dry-run, exact 24 h boundary, twenty-version pages, budget stop and resumable apply', async () => {
  for (let version = 1; version <= 44; version++) {
    const createdAt = new Date(now - (version === 44 ? 24 : 48) * 3600000).toISOString();
    await db.prepare('INSERT INTO cms_revisions(version,request_id,base_version,actor,created_at,payload_hash,project,manifest,summary) VALUES(?,?,?,?,?,?,?,?,?)').bind(version, `revision-${version}`, version - 1, '', createdAt, '', new Uint8Array([0]), '[]', '').run();
    for (const path of ['/', '@cards', '@resources', '@email']) await db.prepare('INSERT INTO cms_rendered(version,path,html) VALUES(?,?,?)').bind(version, path, '{}').run();
  }
  await db.prepare('UPDATE cms_head SET version=44 WHERE id=1').run();
  const rowCount = async () => (await db.prepare('SELECT count(*) AS n FROM cms_rendered').first()).n;
  const before = await rowCount();
  assert.deepEqual(await pruneRendered(query, { now: () => now, log }), { rowsDeleted: 0, rowsWritten: 0, writtenToday: 0 });
  assert.equal(await rowCount(), before);
  assert.equal(versionsPerDelete.length, 0);
  const beforeBoundary = [];
  await pruneRendered(query, { now: () => now - 1, log: message => beforeBoundary.push(message) });
  assert.match(beforeBoundary[0], /84 eligible rows/, 'one millisecond before 24 h, version 43 is retained');
  await pruneRendered(query, { apply: true, writtenToday: 89999, maxBatches: 10, now: () => now, log });
  assert.equal(await rowCount(), before, 'budget stop happens before a DELETE');
  const first = await pruneRendered(query, { apply: true, now: () => now, log });
  assert.equal(first.rowsDeleted, 40);
  assert.ok(first.rowsWritten >= first.rowsDeleted);
  assert.deepEqual(versionsPerDelete, [20]);
  const second = await pruneRendered(query, { apply: true, writtenToday: first.rowsWritten, maxBatches: 10, now: () => now, log });
  assert.equal(first.rowsDeleted + second.rowsDeleted, 86, 'version 43 expired exactly 24 h after replacement');
  assert.deepEqual(versionsPerDelete, [20, 20, 3]);
  assert.equal((await db.prepare("SELECT count(*) AS n FROM cms_rendered WHERE path IN ('@resources','@email')").first()).n, 88);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM cms_rendered WHERE version=44').first()).n, 4);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM cms_revisions').first()).n, 44);
  assert.equal((await pruneRendered(query, { apply: true, now: () => now, log })).rowsDeleted, 0);
});

test('A17: an ordinary Save prunes at most one expired version even with a historical backlog', async () => {
  for (let version = 45; version <= 66; version++) {
    await db.prepare('INSERT INTO cms_revisions(version,request_id,base_version,actor,created_at,payload_hash,project,manifest,summary) VALUES(?,?,?,?,?,?,?,?,?)').bind(version, `revision-${version}`, version - 1, '', '2020-01-01T00:00:00.000Z', '', new Uint8Array([0]), '[]', '').run();
    for (const path of ['/', '@cards', '@resources', '@email']) await db.prepare('INSERT INTO cms_rendered(version,path,html) VALUES(?,?,?)').bind(version, path, '{}').run();
  }
  await db.prepare('UPDATE cms_head SET version=66 WHERE id=1').run();
  const count = async () => (await db.prepare('SELECT count(*) AS n FROM cms_rendered WHERE version<=66').first()).n;
  const before = await count();
  await publishSite(db, { project: initial, baseVersion: 66, requestId: crypto.randomUUID(), actor: 'owner@example.test' });
  assert.equal(await count(), before - 2);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM cms_rendered WHERE version=45').first()).n, 4);
});

test('A17 cleanup: an ahead-of-time operator clock cannot shorten the database retention window', async () => {
  const nativeNow = Date.now;
  Date.now = () => nativeNow() + 72 * 3600000;
  try {
    await pruneRendered(query, { apply: true, maxBatches: 10, log });
    assert.equal((await db.prepare('SELECT count(*) AS n FROM cms_rendered WHERE version=66').first()).n, 4, 'version 66 was only just replaced');
  } finally { Date.now = nativeNow; }
});
