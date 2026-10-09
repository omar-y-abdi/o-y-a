import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { initial, seed, built } from '../.generated/cms-seed.mjs';
import { normalizeStoredProject } from '../src/cms/shared-content.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { renderPage } from '../src/cms/render.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import * as requireProjectChanges from '../src/cms/project-changes.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { preAgentFooterProject, footerHook } from './helpers/pre-agent-footer.mjs';

const legacy = await preAgentFooterProject();
let runtime;
before(async () => { runtime = await cmsRuntime(); });
after(async () => { await runtime?.close(); });
async function request(path, data) {
  return runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { Cookie: 'CF_Authorization=' + await runtime.token(), Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
async function publishLegacy() {
  const previous = await readSite(runtime.db);
  const published = await publishSite(runtime.db, { project: structuredClone(legacy), baseVersion: previous?.version ?? 0, requestId: crypto.randomUUID(), actor: runtime.email });
  return published.version;
}

test('pre-agent footer state upgrades its link, page and protected identities without changing owner data', () => {
  const original = structuredClone(legacy);
  assert.ok(!Object.hasOwn(original.pages[0], 'contracts'), 'Simulated stored CMS project must not contain ephemeral template contracts');
  const normalized = normalizeStoredProject(legacy, seed, initial);
  assert.doesNotThrow(() => validateProject(normalized, seed));
  assert.ok(normalized.pages.some(page => page.path === '/developers/'));
  const home = normalized.pages.find(page => page.path === '/');
  assert.match(home.html, /href="\/developers\/"[^>]*data-cms-node=/);
  assert.equal(footerHook(home), footerHook(initial.pages[0]));
  assert.equal(home.css, original.pages[0].css);
  assert.equal(home.description, original.pages[0].description);
  assert.match(home.html, /id="owner-footer"/);
  assert.deepEqual(legacy, original, 'Reads must not mutate the stored revision.');
  assert.deepEqual(normalizeStoredProject(normalized, seed, initial), normalized, 'Upgrade is idempotent.');
});

test('migration moves key-based CSS with the old control and refuses forged functional bindings', () => {
  const input = structuredClone(legacy);
  const oldKey = footerHook(input.pages[0]);
  const nextKey = footerHook(initial.pages[0]);
  input.pages[0].css += `[data-cms-node="${oldKey}"]{letter-spacing:1px}`;
  const upgraded = normalizeStoredProject(input, seed, initial);
  assert.ok(upgraded.pages[0].css.includes(`[data-cms-node="${nextKey}"]`));
  assert.ok(!upgraded.pages[0].css.includes(`[data-cms-node="${oldKey}"]`));
  const migrated = renderPage(upgraded.pages[0], built, {
    version: 7, migratedCss: upgraded.pages[0].css !== input.pages[0].css,
  });
  assert.match(migrated, /home\.css\?footer=1/, 'Changed CSS selectors must bypass the old immutable URL');
  const forged = structuredClone(input);
  forged.pages[0].html = forged.pages[0].html.replace('data-privacy-open=""', 'data-privacy-open="" data-contact-form=""');
  assert.throws(() => validateProject(normalizeStoredProject(forged, seed, initial), seed), /kopplingar|funktions|attribut/);
});

test('publication never inserts a second developer link after an intentional CMS edit or removal', () => {
  const edited = structuredClone(initial.pages[0]);
  edited.html = edited.html.replace(/<a href="\/developers\/"[^>]*>För utvecklare<\/a>/, '<a href="/om/" data-cms-node="owner-doc-link">Teknisk information</a>');
  const rendered = renderPage(edited, built, { version: 1 });
  assert.match(rendered, /Teknisk information/);
  assert.ok(!rendered.includes('href="/developers/"'), 'Public rendering must match authored HTML, not reinsert a hidden extra link.');
});

test('real old D1 revision can be read, edited, saved, reloaded, previewed and restored under current contracts', async () => {
  const version = await publishLegacy();
  const stateResponse = await request('state');
  assert.equal(stateResponse.status, 200, await stateResponse.clone().text());
  const state = await stateResponse.json();
  assert.match(state.project.pages[0].html, /href="\/developers\/"/);
  assert.ok(state.project.pages.some(page => page.path === '/developers/'));
  assert.equal((await readSite(runtime.db)).version, version, 'Reading the editor must not publish a migration.');
  assert.deepEqual((await readSite(runtime.db)).project, legacy);
  state.project.pages[0].html = state.project.pages[0].html.replace('För utvecklare</a>', 'Utvecklardokumentation</a>');
  state.project.pages[0].description = 'Edited in the CMS after upgrade.';
  const preview = await request('preview', { project: state.project, pageId: 'home' });
  assert.equal(preview.status, 200, await preview.clone().text());
  assert.match((await preview.json()).html, /Utvecklardokumentation/);
  const saved = await request('save', { project: state.project, baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(saved.status, 200, await saved.clone().text());
  const reload = await (await request('state')).json();
  assert.match(reload.project.pages[0].html, /Utvecklardokumentation/);
  const live = await runtime.mf.dispatchFetch(runtime.url + '/');
  assert.match(await live.text(), /Utvecklardokumentation/);
  const old = await request('revision/' + version);
  assert.equal(old.status, 200, await old.clone().text());
  const restored = (await old.json()).project;
  const restore = await request('save', { project: restored, baseVersion: reload.version, requestId: crypto.randomUUID() });
  assert.equal(restore.status, 200, await restore.clone().text());
  assert.equal((await readSite(runtime.db, version)).project.pages[0].description, legacy.pages[0].description);
  assert.equal((await checkCompatibility(runtime.db, { seed, initial })).compatible, true);
});

test('legacy backup validation and recovery use the same footer upgrade as the editor', async () => {
  for (const path of ['validate', 'recover']) {
    const response = await request(path, { project: legacy });
    assert.equal(response.status, 200, await response.clone().text());
    const body = await response.json();
    assert.match(body.project.pages[0].html, /href="\/developers\/"/);
    assert.ok(body.project.pages.some(page => page.path === '/developers/'));
  }
});

test('incremental CMS saves accept a migrated footer page without relaxing unknown fields', () => {
  const { projectChanges, validateProjectChanges, applyProjectChanges } = requireProjectChanges;
  const current = validateProject(normalizeStoredProject(legacy, seed, initial), seed);
  const changed = structuredClone(current);
  changed.pages[0].html = changed.pages[0].html.replace('För utvecklare</a>', 'Utvecklardokumentation</a>');
  const changes = projectChanges(current, changed);
  assert.ok(changes.pages.upsert.some(page => page.footerVersion === 1));
  assert.deepEqual(applyProjectChanges(current, validateProjectChanges(changes)).pages[0].html, changed.pages[0].html);
  const forged = structuredClone(changes);
  forged.pages.upsert[0].footerVersion = 2;
  assert.throws(() => validateProjectChanges(forged));
});
test('unmodified custom CMS pages retain their original cache-stable CSS paths', () => {
  const original = structuredClone(initial.pages.find(page => page.id === 'home'));
  original.id = 'review-clone';
  original.path = '/review-clone/';
  original.template = 'custom';
  original.css = '#review-clone{letter-spacing:1px}';
  const html = renderPage(original, built, { version: 8 });
  assert.match(html, /href="\/cms-public\/v8\/review-clone\.css"/);
  assert.ok(!html.includes('review-clone.css?footer='), 'A nonmigrated resource must keep its existing URL');
});
