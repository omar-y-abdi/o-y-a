import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { validateProject } from '../src/cms/project.mjs';
// Namespace import: without the new exports each test fails on its own.
import * as shared from '../src/cms/shared-content.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { Draft } from '../src/cms/client/draft.mjs';

// Production head v185 (decoded project JSON): /developers/ is the untouched
// seed copy from before the current template, and no page knows SKIFT yet.
const v185 = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const developers = project => project.pages.find(page => page.id === 'developers');
const UPDATED = 'API-versioner och kodexempel';

test('A1a: the fixture /developers/ matches the listed v185 fingerprint and a one-character edit does not', () => {
  // Published cyrb53 reference values pin the hash function itself.
  for (const [text, hash] of [['a', 7929297801672961], ['b', 8684336938537663], ['revenge', 4051478007546757], ['revenue', 8309097637345594]]) assert.deepEqual(shared.fingerprint(text), { length: text.length, hash });
  const html = developers(v185).html;
  assert.deepEqual(shared.STALE_DEVELOPERS_HTML, [shared.fingerprint(html)]);
  assert.deepEqual(shared.fingerprint(html), { length: 15246, hash: 8298929461772957 });
  const template = { id: 'developers', html: '<main id="main"><h1>Mall</h1></main>' };
  assert.notEqual(shared.refreshDevelopersPage(developers(v185), template), developers(v185));
  const edited = { ...developers(v185), html: (html[0] === '<' ? '>' : '<') + html.slice(1) };
  assert.equal(edited.html.length, html.length);
  assert.notEqual(shared.fingerprint(edited.html).hash, shared.fingerprint(html).hash);
  assert.equal(shared.refreshDevelopersPage(edited, template), edited, 'A one-character edit is not a known seed copy');
});

test('A1a: v185 normalizes, validates as a save and keeps every owner page', () => {
  const untouched = structuredClone(v185);
  const normalized = shared.normalizeStoredProject(v185, seed, initial);
  assert.deepEqual(normalized.pages.map(page => page.id), v185.pages.map(page => page.id), 'Studio lists the same 15 pages');
  assert.equal(normalized.pages.length, 15);
  const page = developers(normalized);
  assert.ok(page.html.includes(UPDATED), 'Untouched /developers/ is served from the current template');
  assert.ok(!developers(v185).html.includes(UPDATED), 'The fixture predates the updated section');
  assert.equal(page.facts, undefined, 'Stale facts are not reused for the new HTML');
  for (const key of ['name', 'title', 'description', 'css', 'path']) assert.equal(page[key], developers(v185)[key], key);
  for (const other of normalized.pages.filter(item => item.id !== 'developers')) assert.match(other.html, /data-skift-link/, other.path);
  assert.ok(!normalized.pages.some(item => item.id === 'skift' || item.path === '/play/skift/'), 'SKIFT is code-owned');
  const saved = validateProject(normalized, seed);
  assert.equal(saved.pages.length, 15);
  assert.doesNotThrow(() => validateProject(normalized, seed, saved));
  assert.deepEqual(shared.normalizeStoredProject(saved, seed, initial).pages.map(item => item.html), saved.pages.map(item => item.html), 'A saved copy is never replaced again');
  assert.deepEqual(v185, untouched, 'Normalization does not mutate the stored revision');
});

test('A1a: an edited /developers/ is kept and still fails loudly on validation', () => {
  const edited = structuredClone(v185);
  developers(edited).html = developers(edited).html.replace('</main>', '<p>Ägarens tillägg.</p></main>');
  assert.throws(() => validateProject(shared.normalizeStoredProject(edited, seed, initial), seed), { status: 422 });
});

test('A14: stored SKIFT pages are dropped and a CMS page cannot take the game address', () => {
  assert.ok(!initial.pages.some(page => page.id === 'skift'));
  const stored = structuredClone(initial);
  stored.pages.push({ ...structuredClone(developers(initial)), id: 'skift', path: '/play/skift/', sourceId: 'skift', name: 'SKIFT' });
  assert.ok(!shared.normalizeStoredProject(stored, seed, initial).pages.some(page => page.id === 'skift'));
  assert.ok(!validateProject(stored, seed).pages.some(page => page.id === 'skift'));
  const custom = structuredClone(initial);
  custom.pages.push({ ...structuredClone(seed.blank), id: 'custom-game', sourceId: 'blank', path: '/play/skift/' });
  assert.throws(() => validateProject(custom, seed), /Adressen \/play\/skift\/ används redan/);
  const copy = structuredClone(initial);
  copy.pages.push({ ...structuredClone(developers(initial)), id: 'game-copy', path: '/spel-kopia/', sourceId: 'skift' });
  assert.throws(() => validateProject(copy, seed), /Spelets sida kan inte redigeras i studion/);
});

let runtime;
before(async () => { runtime = await cmsRuntime(); });
after(async () => { await runtime?.close(); });
async function admin(path, data) {
  return runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, {
    method: data ? 'POST' : 'GET',
    headers: { Cookie: 'CF_Authorization=' + await runtime.token(), Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}

test('A1a + A14: published v185 serves every page, opens the studio, saves, restores and keeps SKIFT on the build', async () => {
  await publishSite(runtime.db, { project: v185, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
  for (const page of v185.pages) {
    const response = await runtime.mf.dispatchFetch(runtime.url + page.path);
    assert.equal(response.status, page.path === '/404.html' ? 404 : 200, page.path);
    assert.equal(response.headers.get('x-cms-version'), '1', page.path);
  }
  const live = await (await runtime.mf.dispatchFetch(runtime.url + '/developers/')).text();
  assert.ok(live.includes(UPDATED), 'Public /developers/ uses the updated copy');
  const stateResponse = await admin('state');
  assert.equal(stateResponse.status, 200, await stateResponse.clone().text());
  const state = await stateResponse.json();
  assert.equal(state.project.pages.length, 15);
  assert.ok(developers(state.project).html.includes(UPDATED), 'Studio page list holds the updated /developers/');
  assert.equal((await readSite(runtime.db)).project.pages.length, 15, 'Read must not publish');
  const edited = structuredClone(state.project);
  edited.pages[0].description = 'Ägarens beskrivning efter v185.';
  const draft = new Draft(state.project, state.version);
  draft.change(edited);
  const save = await admin('save', draft.beginSave());
  assert.equal(save.status, 200, await save.clone().text());
  const game = await runtime.mf.dispatchFetch(runtime.url + '/play/skift/');
  assert.equal(game.status, 200);
  assert.equal(game.headers.get('x-cms-version'), null, 'SKIFT never comes from D1');
  assert.equal(await game.text(), await readFile('dist/play/skift/index.html', 'utf8'));
  assert.ok(!(await readSite(runtime.db)).project.pages.some(page => page.id === 'skift'), 'Save does not persist SKIFT');
  assert.ok((await (await runtime.mf.dispatchFetch(runtime.url + '/developers/')).text()).includes(UPDATED));
  const historical = await (await admin('revision/1')).json();
  const restored = await admin('save', { project: historical.project, baseVersion: 2, requestId: crypto.randomUUID() });
  assert.equal(restored.status, 200, await restored.clone().text());
  assert.equal((await checkCompatibility(runtime.db, { seed, initial })).compatible, true);
});

test('A1a: a public read-time migration failure serves the stored page instead of 503', async () => {
  const drifted = structuredClone(v185);
  // One byte off the known seed: not replaced, and invalid under current contracts.
  developers(drifted).html = developers(drifted).html.replace('</main>', '<p>Ägarens tillägg.</p></main>');
  const { version } = await readSite(runtime.db);
  await publishSite(runtime.db, { project: drifted, baseVersion: version, requestId: crypto.randomUUID(), actor: runtime.email });
  const response = await runtime.mf.dispatchFetch(runtime.url + '/developers/');
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Ägarens tillägg\./);
  assert.ok(!body.includes(UPDATED));
  assert.equal((await admin('state')).status, 422, 'Studio reads still report the incompatible page');
});
