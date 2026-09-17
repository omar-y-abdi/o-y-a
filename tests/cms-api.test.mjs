import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

let runtime, authorization;
before(async () => { runtime = await cmsRuntime(); authorization = await runtime.token(); });
after(async () => { await runtime?.close(); });
const url = 'https://omaryusuf.se';
const call = (path, options = {}) => runtime.mf.dispatchFetch(url + path, options);
const admin = (path, data, headers = {}) => call('/admin/api/' + path, { ...(data === undefined ? {} : { method: 'POST', body: JSON.stringify(data) }), headers: { 'Cf-Access-Jwt-Assertion': authorization, Origin: url, 'Content-Type': 'application/json', 'X-CMS-Request': '1', ...headers } });

test('Worker blocks unauthenticated admin HTML, bundles and APIs without exposing owner details', async () => {
  for (const path of ['/admin/', '/admin/api/state', '/admin/assets/missing.mjs']) {
    const response = await call(path);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.doesNotMatch(await response.text(), /owner@example|cms-local-tests|schemaVersion/);
  }
  const outsider = await call('/admin/api/state', { headers: { 'Cf-Access-Jwt-Assertion': await runtime.token({ email: 'someone@example.test' }) } });
  assert.equal(outsider.status, 401);
  assert.equal((await call('/login/')).status, 200);
  for (const path of ['/%61dmin/', '/admin%2findex.html', '/admin//index.html']) assert.equal((await call(path)).status, 400);
});

test('Worker validates write origin, media type and request marker before processing drafts', async () => {
  for (const [headers, expected] of [[{ Origin: 'https://evil.test' }, 403], [{ 'X-CMS-Request': '' }, 403], [{ 'Content-Type': 'text/plain' }, 415], [{ 'Sec-Fetch-Site': 'cross-site' }, 403]]) {
    const response = await admin('save', {}, headers);
    assert.equal(response.status, expected);
  }
});

test('ephemeral local browser origin is correctly bound after Worker setup', async () => {
  const response = await fetch(runtime.url + '/admin/api/state', { headers: { 'Cf-Access-Jwt-Assertion': authorization } });
  assert.equal(response.status, 200);
});

test('real Worker publishes a complete draft, new page and theme, then serves persisted HTML with enforced CSP', async () => {
  const state = await (await admin('state')).json();
  assert.equal(state.version, 0);
  assert.ok(state.built.studio);
  const project = state.project;
  project.pages[0].html = project.pages[0].html.replace('</main>', '<p>Publicerad E2E-markör</p></main>');
  project.theme.blue = '#123456';
  project.cards[0].text = 'En sparad vinst från riktig Worker.';
  project.pages.push({ ...state.blank, id: 'new-public-page', sourceId: 'blank', path: '/en-ny-ide/', name: 'Ny idé' });
  const payload = { project, baseVersion: 0, requestId: crypto.randomUUID() };
  const saved = await admin('save', payload);
  assert.equal(saved.status, 200, await saved.clone().text());
  assert.equal((await saved.json()).version, 1);
  const publicPage = await call('/');
  assert.equal(publicPage.status, 200);
  assert.match(await publicPage.text(), /Publicerad E2E-markör/);
  assert.equal(publicPage.headers.get('X-CMS-Version'), '1');
  assert.equal(publicPage.headers.get('Cache-Control'), 'no-store');
  assert.doesNotMatch(publicPage.headers.get('Content-Security-Policy'), /unsafe-eval/);
  assert.match(await (await call('/cms-public/v1/home.css')).text(), /--blue:#123456/);
  assert.equal((await call('/en-ny-ide/')).status, 200);
  assert.equal((await call('/login/')).status, 200, 'Publishing must not hide the public login route');
  assert.equal((await (await call('/data/cards.json')).json())[0].text, project.cards[0].text);
  assert.match(await (await call('/sitemap.xml')).text(), /en-ny-ide/);
  const replay = await admin('save', payload);
  assert.equal((await replay.json()).version, 1);
  const stale = await admin('save', { ...payload, requestId: crypto.randomUUID() });
  assert.equal(stale.status, 409);
  assert.equal((await (await admin('history')).json()).items.length, 1);
});

test('preview accepts a validated draft, isolates side effects, and rejects injected code before rendering', async () => {
  const { project } = await (await admin('state')).json();
  const good = await admin('preview', { project, pageId: 'home' });
  assert.equal(good.status, 200, await good.clone().text());
  const { html } = await good.json();
  assert.match(html, /data-cms-preview="true"/);
  assert.match(html, /id="cms-preview-data"/);
  assert.match(html, /Publicerad E2E-markör/);
  const win = await admin('preview', { project, cardId: project.cards[0].id });
  assert.equal(win.status, 200);
  assert.match((await win.json()).html, /id="cms-win-preview"/);
  project.pages[0].html += '<img src="/social/omar-yusuf.png" onerror="alert(1)" alt="">';
  assert.equal((await admin('preview', { project, pageId: 'home' })).status, 422);
  assert.equal((await admin('save', { project, baseVersion: 1, requestId: crypto.randomUUID() })).status, 422);
  assert.equal((await (await admin('state')).json()).version, 1);
});
