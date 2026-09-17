import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { publishSite, readSite, readPublicPage, readHistory, retainedResourceUsage } from '../src/cms/store.mjs';
import { defaultTheme } from '../src/cms/project.mjs';
import { migrateCmsDb } from './helpers/cms-runtime.mjs';

const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response("test"); } };', compatibilityDate: '2026-09-11', d1Databases: ['CMS_DB'] }));
after(() => mf.dispose());
const db = await mf.getD1Database('CMS_DB');
await migrateCmsDb(db);
const project = text => ({ schemaVersion: 1, pages: [{ id: 'home', path: '/', name: 'Hem', title: 'Omar Yusuf', description: 'En portfolio.', template: 'home', bodyClass: 'page-home', html: `<main id="main"><h1>${text}</h1></main>`, css: '', project: null }], cards: [{ id: 'k01', flavor: 'kind', text }], runtime: {}, theme: defaultTheme });
let revision = 0;

test('unpublished database has an explicit empty state', async () => {
  assert.equal(await readSite(db), null);
  assert.equal(await readPublicPage(db, '/'), null);
});

test('a durable publication is immediately visible to a separate public read', async () => {
  const result = await publishSite(db, { project: project('Första'), baseVersion: revision, requestId: crypto.randomUUID(), actor: 'owner@example.test' });
  revision = result.version;
  assert.equal(revision, 1);
  const state = await readSite(db);
  assert.equal(state.project.pages[0].html, '<main id="main"><h1>Första</h1></main>');
  assert.match((await readPublicPage(db, '/')).html, /Första/);
});

test('simultaneous tabs cannot both overwrite the same base revision', async () => {
  const baseVersion = revision;
  const attempts = await Promise.allSettled(['Flik A', 'Flik B'].map(text => publishSite(db, { project: project(text), baseVersion, requestId: crypto.randomUUID(), actor: 'owner@example.test' })));
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  const failure = attempts.find(result => result.status === 'rejected');
  assert.equal(failure.reason.status, 409);
  revision = (await readSite(db)).version;
  assert.equal(revision, baseVersion + 1);
});

test('retrying a committed request is idempotent but reusing its ID for different content fails', async () => {
  const requestId = crypto.randomUUID();
  const input = { project: project('Bekräftad'), baseVersion: revision, requestId, actor: 'owner@example.test' };
  const first = await publishSite(db, input);
  const retry = await publishSite(db, input);
  assert.equal(first.version, retry.version);
  revision = first.version;
  await assert.rejects(publishSite(db, { ...input, project: project('Annat innehåll') }), error => error.status === 409);
  assert.equal((await readSite(db)).version, revision);
});

test('history restore produces a new revision and preserves intervening history', async () => {
  const old = await readSite(db, 1);
  const restored = await publishSite(db, { project: old.project, baseVersion: revision, requestId: crypto.randomUUID(), actor: 'owner@example.test' });
  revision = restored.version;
  assert.match((await readPublicPage(db, '/')).html, /Första/);
  const history = await readHistory(db);
  assert.equal(history.items.length, revision);
  assert.equal(history.items[0].version, revision);
  assert.ok(history.items.some(item => item.version === 3));
  assert.match((await readSite(db, 3)).project.pages[0].html, /Bekräftad/);
});

test('a failed D1 statement rolls back the revision and every rendered page', async () => {
  const before = await readSite(db);
  const invalid = project('Får inte synas');
  invalid.pages.push({ ...invalid.pages[0], id: 'duplicate-path' });
  await assert.rejects(publishSite(db, { project: invalid, baseVersion: revision, requestId: crypto.randomUUID(), actor: 'owner@example.test' }));
  const afterFailure = await readSite(db);
  assert.equal(afterFailure.version, before.version);
  assert.equal(afterFailure.project.pages[0].html, before.project.pages[0].html);
  assert.equal((await readHistory(db)).items.length, revision);
});


test('new revisions persist an indexed resource manifest used by historical usage checks', async () => {
  const current = await readSite(db);
  const next = project('Indexerad');
  next.pages[0].html = '<main id="main"><h1>Indexerad</h1><img src="/favicon.png" alt=""></main>';
  const saved = await publishSite(db, { project: next, baseVersion: current.version, requestId: crypto.randomUUID(), actor: 'owner@example.test' });
  revision = saved.version;
  const indexed = await db.prepare('SELECT reference_count FROM cms_revision_resource_index WHERE version=? AND src=?').bind(saved.version, '/favicon.png').first();
  assert.equal(indexed.reference_count, 1);
  assert.ok(await db.prepare('SELECT version FROM cms_revision_resource_indexed WHERE version=?').bind(saved.version).first());
  assert.ok((await retainedResourceUsage(db, '/favicon.png')) >= 1);
});

test('an absent page in a published revision is distinct from an unpublished site', async () => {
  const page = await readPublicPage(db, '/missing/');
  assert.equal(page.version, revision);
  assert.equal(page.page, null);
});
