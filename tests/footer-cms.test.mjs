import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { legacyInitial as initial, seed as frameSeed, built } from '../.generated/cms-seed.mjs';
const seed = frameSeed.legacy;
import { normalizeStoredProject } from '../src/cms/legacy-project.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { renderPage } from '../src/cms/render.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { normalizeFooterPage } from '../src/cms/legacy-project.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import * as requireProjectChanges from '../src/cms/project-changes.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { preAgentFooterProject, footerHook } from './helpers/pre-agent-footer.mjs';
import { chooseFrame } from '../src/cms/frame-converter.mjs';

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
  assert.doesNotThrow(() => validateProject(normalized, frameSeed));
  assert.ok(normalized.pages.some(page => page.path === '/developers/'));
  const home = normalized.pages.find(page => page.path === '/');
  // A1b: the inserted link needs no key; the editor gives it one on load.
  assert.match(home.html, /<a href="\/developers\/">För utvecklare<\/a>/);
  assert.equal(footerHook(home), footerHook(initial.pages[0]));
  assert.equal(home.css, original.pages[0].css);
  assert.equal(home.description, original.pages[0].description);
  assert.match(home.html, /id="owner-footer"/);
  assert.deepEqual(legacy, original, 'Reads must not mutate the stored revision.');
  assert.deepEqual(normalizeStoredProject(normalized, seed, initial), normalized, 'Upgrade is idempotent.');
});

test('migration refuses key-based CSS and forged functional bindings', () => {
  const input = structuredClone(legacy);
  // A1b: identities are signature keys, so owner CSS may not select them.
  const keyed = structuredClone(input);
  keyed.pages[0].css += `[data-cms-node="${footerHook(input.pages[0])}"]{letter-spacing:1px}`;
  const upgraded = normalizeStoredProject(keyed, seed, initial);
  assert.equal(upgraded.pages[0].css, keyed.pages[0].css, 'Reads never rewrite stored CSS');
  assert.throws(() => validateProject(upgraded, frameSeed), { status: 422, message: /nodnycklar/ });
  const forged = structuredClone(input);
  forged.pages[0].html = forged.pages[0].html.replace('data-privacy-open=""', 'data-privacy-open="" data-contact-form=""');
  assert.throws(() => validateProject(normalizeStoredProject(forged, seed, initial), frameSeed), /kopplingar|funktions|attribut/);
});

test('publication never inserts a second developer link after an intentional CMS edit or removal', () => {
  const edited = structuredClone(initial.pages[0]);
  edited.html = edited.html.replace(/<a href="\/developers\/"[^>]*>För utvecklare<\/a>/, '<a href="/om/" data-cms-node="owner-doc-link">Teknisk information</a>');
  const rendered = renderPage(edited, built, { version: 1 });
  assert.match(rendered, /Teknisk information/);
  assert.ok(!rendered.includes('href="/developers/"'), 'Public rendering must match authored HTML, not reinsert a hidden extra link.');
});

test('a new blank page keeps an owner-removed developer link removed on Save', () => {
  // Built exactly as src/cms/client/app.mjs newPage builds it from seed.blank.
  const content = seed.blank;
  const created = { ...content, id: crypto.randomUUID(), path: '/utan-lank/', sourceId: content.sourceId ?? content.id, name: 'Utan länk', title: 'Utan länk | Omar Yusuf', description: 'Tankar, idéer och nyfikenhet från Omar Yusuf. Utan länk.', noindex: false };
  delete created.contracts;
  created.html = created.html.replace(/<a href="\/developers\/"[^>]*>För utvecklare<\/a>/, '');
  assert.ok(!created.html.includes('href="/developers/"'));
  const saved = validateProject({ ...structuredClone(initial), pages: [...structuredClone(initial.pages), created] }, frameSeed);
  assert.ok(!saved.pages.find(page => page.path === '/utan-lank/').html.includes('href="/developers/"'));
});

test('real old D1 revision can be read, edited, saved, reloaded, previewed and restored under current contracts', async () => {
  const version = await publishLegacy();
  const stateResponse = await request('state');
  assert.equal(stateResponse.status, 200, await stateResponse.clone().text());
  const state = await stateResponse.json();
  if (state.project.frameConflicts?.length) state.project = chooseFrame(state.project, state.project.frameConflicts[0].options.find(option => option.value.css.includes('282px')).value);
  assert.match(state.project.frame.html, /href="\/developers\/"/);
  assert.ok(state.project.pages.some(page => page.path === '/developers/'));
  assert.equal((await readSite(runtime.db)).version, version, 'Reading the editor must not publish a migration.');
  assert.deepEqual((await readSite(runtime.db)).project, legacy);
  state.project.frame.html = state.project.frame.html.replace('För utvecklare</a>', 'Utvecklardokumentation</a>');
  state.project.pages[0].description = 'Edited in the CMS after upgrade.';
  const preview = await request('preview', { project: state.project, pageId: 'home' });
  assert.equal(preview.status, 200, await preview.clone().text());
  assert.match((await preview.json()).html, /Utvecklardokumentation/);
  const saved = await request('save', { project: state.project, baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(saved.status, 200, await saved.clone().text());
  const reload = await (await request('state')).json();
  assert.match(reload.project.frame.html, /Utvecklardokumentation/);
  const live = await runtime.mf.dispatchFetch(runtime.url + '/');
  assert.match(await live.text(), /Utvecklardokumentation/);
  const old = await request('revision/' + version);
  assert.equal(old.status, 200, await old.clone().text());
  let restored = (await old.json()).project;
  if (restored.frameConflicts?.length) restored = chooseFrame(restored, restored.frameConflicts[0].options.find(option => option.value.css.includes('282px')).value);
  const restore = await request('save', { project: restored, baseVersion: reload.version, requestId: crypto.randomUUID() });
  assert.equal(restore.status, 200, await restore.clone().text());
  assert.equal((await readSite(runtime.db, version)).project.pages[0].description, legacy.pages[0].description);
  assert.equal((await checkCompatibility(runtime.db, { seed: frameSeed, initial })).compatible, true);
});

test('a pre-PR #10 draft or backup is rejected with 422, so it stays in the browser', async () => {
  // Client projects map through the frozen e5592bc keys only; the PR #10 remap
  // is not chained in. Every key after the removed link is off by one.
  const head = await readSite(runtime.db);
  for (const [path, body] of [['validate', { project: legacy }], ['recover', { project: legacy, pendingSave: null }], ['save', { project: legacy, baseVersion: head?.version ?? 0, requestId: crypto.randomUUID() }]]) {
    const response = await request(path, body);
    assert.equal(response.status, 422, `${path}: ${await response.clone().text()}`);
  }
  assert.equal((await readSite(runtime.db))?.version, head?.version, 'Nothing is published');
});

test('an unmarked positional /integritet/ gets the developer link in its footer nav, not in legal-actions', async () => {
  const privacy = legacy.pages.find(page => page.path === '/integritet/');
  assert.equal(privacy.footerVersion, undefined);
  assert.match(privacy.html, /data-cms-node="n\d+"/);
  assert.ok(!privacy.html.includes('data-cms-node="k'), 'The fixture carries e5592bc positional keys');
  const placement = nodes => {
    const actions = nodes.find(node => (attribute(node, 'class') ?? '').split(/\s+/).includes('legal-actions'));
    const nav = nodes.find(node => node.tagName === 'nav' && attribute(node, 'aria-label') === 'Sidfotsmeny');
    assert.ok(elements(actions).some(node => attribute(node, 'data-privacy-open') !== undefined), 'The first privacy button sits in legal-actions');
    assert.equal(attribute(nav.childNodes[0], 'href'), '/developers/');
    assert.equal(nodes.filter(node => attribute(node, 'href') === '/developers/').length, 1);
  };
  const migrated = normalizeFooterPage(privacy);
  assert.equal(migrated.footerVersion, 1);
  placement(elements(parse(`<body>${migrated.html}</body>`)));
  // The stored read path and the public read path give the same footer.
  placement(elements(parse(`<body>${normalizeStoredProject(legacy, seed, initial).pages.find(page => page.path === '/integritet/').html}</body>`)));
  await publishLegacy();
  const live = await runtime.mf.dispatchFetch(runtime.url + '/integritet/');
  assert.equal(live.status, 200);
  placement(elements(parse(await live.text())));
  // A current build's unmarked page (signature keys) is left as it is.
  const current = { ...structuredClone(initial.pages.find(page => page.path === '/integritet/')), footerVersion: undefined };
  current.html = current.html.replace(/<a href="\/developers\/"[^>]*>För utvecklare<\/a>/, '');
  assert.equal(normalizeFooterPage(current), current);
});

test('incremental CMS saves accept a migrated footer page without relaxing unknown fields', () => {
  const { projectChanges, validateProjectChanges, applyProjectChanges } = requireProjectChanges;
  const current = validateProject(normalizeStoredProject(legacy, seed, initial), frameSeed);
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
});
