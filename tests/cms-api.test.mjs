import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { publishSite } from '../src/cms/store.mjs';

let runtime, authorization;
before(async () => { runtime = await cmsRuntime(); authorization = await runtime.token(); });
after(async () => { await runtime?.close(); });
const url = 'https://omaryusuf.se';
const call = (path, options = {}) => runtime.mf.dispatchFetch(url + path, options);
const admin = (path, data, headers = {}) => call('/admin/api/' + path, { ...(data === undefined ? {} : { method: 'POST', body: JSON.stringify(data) }), headers: { 'Cf-Access-Jwt-Assertion': authorization, Origin: url, 'Content-Type': 'application/json', 'X-CMS-Request': '1', ...headers } });
async function versionedState() {
  let state = await (await admin('state')).json();
  if (state.version === 0) {
    const bootstrap = await admin('save', { project: state.project, baseVersion: 0, requestId: crypto.randomUUID() });
    assert.equal(bootstrap.status, 200, await bootstrap.clone().text());
    state = await (await admin('state')).json();
  }
  return state;
}

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

test('real Worker atomically applies one Draft change set across page, card, runtime, and theme', async () => {
  const state = await versionedState();
  const next = structuredClone(state.project);
  const page = next.pages.find(item => item.path === '/');
  page.html = page.html.replace('</main>', '<p>Compact API delta</p></main>');
  const card = next.cards.find(item => !item.design);
  card.text += ' delta';
  const runtimeKey = Object.keys(next.runtime)[0];
  next.runtime[runtimeKey] += ' delta';
  next.theme.blue = '#654321';
  const pageDelta = { ...page };
  delete pageDelta.facts;
  const payload = { baseVersion: state.version, requestId: crypto.randomUUID(), changes: {
    pages: { upsert: [pageDelta], remove: [] }, cards: { upsert: [card], remove: [] }, runtime: next.runtime, theme: next.theme,
  } };
  const fullBodyBytes = Buffer.byteLength(JSON.stringify({ project: next, baseVersion: state.version, requestId: payload.requestId }));
  const changeBodyBytes = Buffer.byteLength(JSON.stringify(payload));
  assert.ok(changeBodyBytes < fullBodyBytes / 2, `change body ${changeBodyBytes}B must be materially smaller than full body ${fullBodyBytes}B`);

  const responses = await Promise.all([admin('save', payload), admin('save', payload)]);
  for (const response of responses) assert.equal(response.status, 200, await response.clone().text());
  const versions = await Promise.all(responses.map(response => response.json().then(result => result.version)));
  assert.equal(versions[0], versions[1], 'parallel identical intents publish once');
  const publishedVersion = versions[0];
  assert.equal(publishedVersion, state.version + 1);
  const wrongReplay = structuredClone(payload); wrongReplay.changes.theme.blue = '#654322';
  assert.equal((await admin('save', wrongReplay)).status, 409, 'same request id cannot replay different intent');
  assert.equal((await admin('save', { ...payload, requestId: crypto.randomUUID() })).status, 409, 'stale base is rejected');
  const current = await (await admin('state')).json();
  assert.equal(current.project.pages.find(item => item.id === page.id).html, page.html);
  assert.equal(current.project.cards.find(item => item.id === card.id).text, card.text);
  assert.equal(current.project.runtime[runtimeKey], next.runtime[runtimeKey]);
  assert.equal(current.project.theme.blue, next.theme.blue);
  assert.match(await (await call('/')).text(), /Compact API delta/);
  assert.match(await (await call(`/cms-public/v${publishedVersion}/home.css`)).text(), /--blue:#654321/);
  assert.equal((await (await call('/data/cards.json')).json()).find(item => item.id === card.id).text, card.text);

  const invalid = structuredClone(payload);
  invalid.baseVersion = current.version; invalid.requestId = crypto.randomUUID();
  invalid.changes.pages.upsert[0].title = '';
  assert.equal((await admin('save', invalid)).status, 422, 'invalid correction leaves the published version unchanged');
  const corrected = structuredClone(payload);
  corrected.baseVersion = current.version; corrected.requestId = crypto.randomUUID();
  corrected.changes.pages.upsert[0].description += ' corrected';
  const correctedResponse = await admin('save', corrected);
  assert.equal(correctedResponse.status, 200, await correctedResponse.clone().text());

  const beforeOrder = await (await admin('state')).json();
  const removedPage = beforeOrder.project.pages.find(item => item.id === 'new-public-page');
  const removedCard = beforeOrder.project.cards.at(-1);
  const pageOrder = beforeOrder.project.pages.filter(item => item.id !== removedPage.id).map(item => item.id).reverse();
  const cardOrder = beforeOrder.project.cards.filter(item => item.id !== removedCard.id).map(item => item.id).reverse();
  const ordered = await admin('save', { baseVersion: beforeOrder.version, requestId: crypto.randomUUID(), changes: {
    pages: { upsert: [], remove: [removedPage.id], order: pageOrder },
    cards: { upsert: [], remove: [removedCard.id], order: cardOrder },
  } });
  assert.equal(ordered.status, 200, await ordered.clone().text());
  const orderedState = await (await admin('state')).json();
  assert.deepEqual(orderedState.project.pages.map(item => item.id), pageOrder);
  assert.deepEqual(orderedState.project.cards.map(item => item.id), cardOrder);
  const unknownRemoval = await admin('save', { baseVersion: orderedState.version, requestId: crypto.randomUUID(), changes: { pages: { remove: ['missing-page'] } } });
  assert.equal(unknownRemoval.status, 422, 'removing an unknown identity is rejected');
  assert.equal((await (await admin('state')).json()).version, orderedState.version);

  const recovery = await admin('recover', { project: next, pendingSave: payload });
  assert.equal(recovery.status, 200, await recovery.clone().text());
  assert.deepEqual((await recovery.json()).pendingSave, payload, 'recovery keeps the original retry intent');
  const legacyRecovery = await admin('recover', { project: next, pendingSave: { project: next, baseVersion: current.version, requestId: crypto.randomUUID() } });
  assert.equal(legacyRecovery.status, 200, await legacyRecovery.clone().text(), 'legacy backup shape remains accepted without a body baseVersion');

  const historical = await (await admin(`revision/${state.version}`)).json();
  assert.deepEqual(historical.project.pages.map(item => item.id), state.project.pages.map(item => item.id));
  const latest = await (await admin('state')).json();
  const restored = await admin('save', { project: historical.project, baseVersion: latest.version, requestId: crypto.randomUUID() });
  assert.equal(restored.status, 200, await restored.clone().text());
  const restoredState = await (await admin('state')).json();
  assert.deepEqual(restoredState.project.pages.map(item => item.id), historical.project.pages.map(item => item.id));
  assert.deepEqual(restoredState.project.cards.map(item => item.id), historical.project.cards.map(item => item.id));
});

test('concurrent identical publications commit one revision without duplicate side effects', { timeout: 10_000 }, async () => {
  const before = await (await admin('state')).json();
  const baseVersion = before.version, targetVersion = baseVersion + 1;
  const requestId = crypto.randomUUID();
  const project = structuredClone(before.project);
  project.pages[0].title = 'Concurrent idempotency regression';
  const database = runtime.db;
  const batch = database.batch.bind(database);
  let callers = 0, release;
  const barrier = new Promise(resolve => { release = resolve; });
  const synchronizedDb = new Proxy(database, {
    get(target, property) {
      if (property === 'batch') return async statements => {
        if (++callers === 2) release();
        await barrier;
        return batch(statements);
      };
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const attempt = () => publishSite(synchronizedDb, {
    project, baseVersion, requestId, actor: 'owner@example.test',
  });

  const settled = await Promise.allSettled([attempt(), attempt()]);
  assert.deepEqual(settled.map(result => result.status), ['fulfilled', 'fulfilled'], JSON.stringify(settled.map(result => result.reason?.message)));
  const [first, second] = settled.map(result => result.value);
  assert.equal(first.version, targetVersion);
  assert.equal(second.version, targetVersion);
  assert.equal(first.createdAt, second.createdAt);

  const revision = await database.prepare('SELECT count(*) AS count FROM cms_revisions WHERE request_id = ?').bind(requestId).first();
  const rendered = await database.prepare('SELECT count(*) AS count FROM cms_rendered WHERE version = ?').bind(targetVersion).first();
  const indexed = await database.prepare('SELECT count(*) AS count FROM cms_revision_resource_indexed WHERE version = ?').bind(targetVersion).first();
  assert.equal(revision.count, 1);
  assert.ok(rendered.count > 0);
  assert.equal(indexed.count, 1);
});

test('save reuses server-derived font references for media checks, indexing, and page versus card rendering', async () => {
  const state = await versionedState();
  const pageFont = crypto.randomUUID(), cardFont = crypto.randomUUID();
  for (const id of [pageFont, cardFont]) await runtime.db.prepare('INSERT INTO cms_media(id, object_key, name, mime, bytes, width, height, alt, sha256, created_at, validation_version) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, `${id}.woff2`, 'QA font', 'font/woff2', 128, null, null, '', `test-${id}`, new Date().toISOString(), 1).run();

  const next = structuredClone(state.project);
  next.theme.fontFamily = `cms-font-${pageFont}`;
  const card = next.cards.find(item => item.state !== 'trash');
  card.design = { html: '<section><p data-card-text></p></section>', css: `p{font-family:"cms-font-${cardFont}"}`, project: null };
  const { facts: _facts, ...savedCard } = card;
  const changes = { theme: next.theme, cards: { upsert: [savedCard] } };
  const injected = await admin('save', { baseVersion: state.version, requestId: crypto.randomUUID(), changes, references: [['/forged-from-client.png', 99]] });
  assert.equal(injected.status, 422, await injected.clone().text());
  assert.equal((await (await admin('state')).json()).version, state.version);

  const response = await admin('save', { baseVersion: state.version, requestId: crypto.randomUUID(), changes });
  assert.equal(response.status, 200, await response.clone().text());
  const { version } = await response.json();

  const indexed = await runtime.db.prepare('SELECT src, reference_count FROM cms_revision_resource_index WHERE version=? AND src IN (?,?) ORDER BY src')
    .bind(version, `/media/${pageFont}.woff2`, `/media/${cardFont}.woff2`).all();
  assert.equal(indexed.results.length, 2);
  assert.ok(indexed.results.every(row => row.reference_count >= 1));
  assert.equal(await runtime.db.prepare('SELECT src FROM cms_revision_resource_index WHERE version=? AND src=?').bind(version, '/forged-from-client.png').first(), null);

  const home = await runtime.db.prepare("SELECT css FROM cms_rendered WHERE version=? AND path='/'").bind(version).first();
  assert.ok(home.css.includes(`@font-face{font-family:"cms-font-${pageFont}"`), home.css);
  const cardRow = await runtime.db.prepare('SELECT html FROM cms_rendered WHERE version=? AND path=?').bind(version, `@card/${card.id}`).first();
  const cardCss = JSON.parse(cardRow.html).design.css;
  assert.ok(cardCss.includes(`@font-face{font-family:"cms-font-${cardFont}"`), cardCss);
  assert.ok(!cardCss.includes(pageFont), cardCss);

  const legacyFont = crypto.randomUUID();
  await runtime.db.prepare('INSERT INTO cms_media(id, object_key, name, mime, bytes, width, height, alt, sha256, created_at, validation_version) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(legacyFont, `${legacyFont}.woff2`, 'Legacy save font', 'font/woff2', 128, null, null, '', `test-${legacyFont}`, new Date().toISOString(), 1).run();
  next.theme.fontFamily = `cms-font-${legacyFont}`;
  const legacy = await admin('save', { project: next, baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(legacy.status, 200, await legacy.clone().text());
  const legacyVersion = await legacy.json();
  assert.ok(await runtime.db.prepare('SELECT src FROM cms_revision_resource_index WHERE version=? AND src=?').bind(legacyVersion.version, `/media/${legacyFont}.woff2`).first());
});

test('recovery preserves an omitted delta array for exact committed-save replay', async () => {
  const before = await versionedState();
  const candidate = structuredClone(before.project);
  candidate.pages[0].title = 'Recovery keeps exact retry payload';
  const { facts: _serverFacts, ...page } = candidate.pages[0];
  const attempt = {
    baseVersion: before.version,
    requestId: crypto.randomUUID(),
    changes: { pages: { upsert: [page] } },
  };

  const committed = await admin('save', attempt);
  assert.equal(committed.status, 200, await committed.clone().text());
  const commit = await committed.json();
  const recovered = await admin('recover', { project: candidate, pendingSave: attempt });
  assert.equal(recovered.status, 200, await recovered.clone().text());
  const recoveredBody = await recovered.json();
  assert.deepEqual(recoveredBody.pendingSave, attempt);
  assert.equal(Object.hasOwn(recoveredBody.pendingSave.changes.pages, 'remove'), false);

  const replay = await admin('save', recoveredBody.pendingSave);
  assert.equal(replay.status, 200, await replay.clone().text());
  const replayResult = await replay.json();
  assert.equal(replayResult.version, commit.version);
  assert.equal(replayResult.replayed, true);
  assert.equal((await (await admin('state')).json()).version, commit.version);
});

test('version-zero deltas are rejected while legacy full-snapshot recovery remains supported', { timeout: 15_000 }, async () => {
  const isolated = await cmsRuntime();
  try {
    const token = await isolated.token();
    const request = (path, data) => isolated.mf.dispatchFetch(url + '/admin/api/' + path, {
      method: 'POST', body: JSON.stringify(data),
      headers: { 'Cf-Access-Jwt-Assertion': token, Origin: url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
    });
    const state = await (await isolated.mf.dispatchFetch(url + '/admin/api/state', { headers: { 'Cf-Access-Jwt-Assertion': token } })).json();
    assert.equal(state.version, 0);
    const page = { ...state.project.pages[0], title: 'Unpinned v0 change' }; delete page.facts;
    const pending = { baseVersion: 0, requestId: crypto.randomUUID(), changes: { pages: { upsert: [page] } } };
    const save = await request('save', pending);
    assert.equal(save.status, 422, await save.clone().text());
    const deltaRecovery = await request('recover', { project: state.project, pendingSave: pending });
    assert.equal(deltaRecovery.status, 422, await deltaRecovery.clone().text());
    const legacyPending = { project: state.project, baseVersion: 0, requestId: crypto.randomUUID() };
    const legacyRecovery = await request('recover', { project: state.project, pendingSave: legacyPending });
    assert.equal(legacyRecovery.status, 200, await legacyRecovery.clone().text());
    assert.deepEqual((await legacyRecovery.json()).pendingSave, legacyPending);
  } finally { await isolated.close(); }
});
