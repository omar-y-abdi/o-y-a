import { test, beforeAll as before, afterAll as after } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { validateProject } from '../src/cms/project.mjs';

let runtime, token;
before(async () => { runtime = await cmsRuntime(); token = await runtime.token(); });
after(async () => runtime?.close());
const origin = 'https://omaryusuf.se';
const request = (path, options = {}) => runtime.mf.dispatchFetch(origin + path, options);
const admin = (path, data) => request('/admin/api/' + path, {
  ...(data === undefined ? {} : { method: 'POST', body: JSON.stringify(data) }),
  headers: { 'Cf-Access-Jwt-Assertion': token, Origin: origin, 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
});
function extraPage(markup = '') {
  const project = structuredClone(initial);
  project.pages.push({ ...seed.blank, id: 'review-page', sourceId: 'blank', path: '/review/nested/', html: seed.blank.html.replace('</main>', markup + '</main>') });
  return project;
}
async function save(project) {
  const state = await (await admin('state')).json();
  const response = await admin('save', { project, baseVersion: state.version, requestId: crypto.randomUUID() });
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}

test('R3: script-sensitive noscript markup is rejected before publication', async () => {
  const payload = '<noscript><p title="</noscript><img src=/review-missing-image onerror=window.__review_mxss=1>">safe</p></noscript>';
  const response = await admin('validate', { project: extraPage(payload) });
  assert.equal(response.status, 422, 'Forbidden browser DOM must never be accepted, even when CSP blocks execution.');
});

test('R8: database-only pages canonicalize extensionless URLs, queries and HEAD requests', async () => {
  await save(extraPage());
  for (const method of ['GET', 'HEAD']) {
    const response = await request('/review/nested?from=review', { method, redirect: 'manual' });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('Location'), origin).href, origin + '/review/nested/?from=review');
    assert.equal((await request('/review/nested/?from=review', { method })).status, 200);
  }
  assert.equal((await request('/review/absent')).status, 404);
  assert.equal((await request('/apple-touch-icon.png')).status, 200);
});

test('R9: extensionless and own-origin links cannot bypass page reference validation', () => {
  for (const href of ['/does-not-exist', 'https://omaryusuf.se/does-not-exist', '/om?x=1#absent-fragment']) {
    assert.throws(() => validateProject(extraPage(`<a href="${href}">Broken destination</a>`), seed), /saknas|mål/);
  }
});

test('R10: stale metadata writes cannot reverse another tab archive', async () => {
  const id = crypto.randomUUID();
  const upload = await request('/admin/api/upload', { method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': token, Origin: origin, 'Content-Type': 'application/octet-stream', 'X-CMS-Request': '1', 'X-CMS-Upload-Id': id, 'X-CMS-Filename': 'review.png' }, body: await readFile('public/mail/omar-smile.png') });
  assert.equal(upload.status, 201);
  const fields = { name: 'Review image', alt: '', baseVersion: 0 };
  assert.equal((await admin('assets/' + id, { ...fields, archived: true })).status, 200);
  assert.equal((await admin('assets/' + id, { ...fields, name: 'Stale rename', archived: false })).status, 409);
  const archived = await (await admin('assets?state=archived')).json();
  assert.equal(archived.items.find(asset => asset.id === id)?.archived, true);
});

test('R11: removing a dialog label cannot leave a dangling accessible-name reference', () => {
  const project = structuredClone(initial);
  const page = project.pages[0];
  const before = page.html;
  page.html = page.html.replace(/<h2\b[^>]*id="privacy-title"[^>]*>[\s\S]*?<\/h2>/, '');
  assert.notEqual(page.html, before);
  assert.throws(() => validateProject(project, seed, initial), /privacy-title|referens|mål|namn/);
});

test('R13: cached facts and fresh validation agree after a template contract changes', () => {
  const upgraded = structuredClone(seed);
  const main = upgraded.pages[0].contracts.find(contract => contract.attrs.id === 'main');
  main.attrs['aria-label'] = 'New release contract';
  assert.throws(() => validateProject(structuredClone(initial), upgraded), /funktionsattribut/);
  assert.throws(() => validateProject(structuredClone(initial), upgraded, initial), /funktionsattribut/);
});

test('R5: accepted large card libraries fit hosted D1 byte limits and remain complete', async () => {
  const project = structuredClone(initial);
  project.cards = Array.from({ length: 1200 }, (_, index) => ({
    id: `capacity-${index}`, flavor: ['kind', 'joke', 'pause', 'roast'][index % 4], text: `Vinst ${index}`,
    design: { html: `<section><p data-card-text>Vinst ${index}</p><p>${'åäö'.repeat(400)}</p></section>`, css: '', project: null },
  }));
  const saved = await save(project);
  const rows = await runtime.db.prepare('SELECT path, length(CAST(html AS BLOB)) + length(CAST(css AS BLOB)) + length(CAST(meta AS BLOB)) AS bytes FROM cms_rendered WHERE version = ?').bind(saved.version).all();
  for (const row of rows.results) assert.ok(row.bytes < 1900000, `${row.path}: ${row.bytes} bytes exceeds safe hosted row budget`);
  const cards = await (await request('/data/cards.json')).json();
  assert.equal(cards.length, 1200);
  assert.equal(cards.at(-1).id, 'capacity-1199');
});
