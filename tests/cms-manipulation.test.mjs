import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFragment, serialize } from 'parse5';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { normalizeStoredProject, refreshDevelopers } from '../src/cms/shared-content.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { hasSignatureKeys, migrateKeys, rekeyHtml, validateCss, VALIDATION_POLICY } from '../src/cms/validation.mjs';
import { normalizeClientProject } from '../src/cms/api.mjs';
import { normalizeSkiftProject } from '../src/cms/skift.mjs';
import { positionalKeys } from '../scripts/legacy-keys.mjs';
import LEGACY_KEYS from '../src/cms/legacy-keys.json' with { type: 'json' };
import { projectChanges, validateProjectChanges, applyProjectChanges } from '../src/cms/project-changes.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

// A1b manipulation suite. Every case runs on the three server paths that take
// page HTML from a client: full Save, delta Save and recovery.
// Raw v185 is production data with positional keys; `base` is its studio copy.
const v185 = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const base = normalizeStoredProject(v185, seed, initial);
const opts = { origins: ['https://omaryusuf.se'] };
const ATTRIBUTE = /Ett skyddat funktionsattribut har ändrats\./;
const LABEL = /Samtyckesknappens text är låst\./;
const NAME = /Samtyckesknappens tillgängliga namn är låst\./;
const NAMESPACE = /Ett funktionselement har bytt namnrymd\./;

const has = (node, name, value) => attribute(node, name) !== undefined && (value === undefined || attribute(node, name) === value);
const hasClass = (node, name) => (attribute(node, 'class') ?? '').split(/\s+/).includes(name);
const setAttr = (node, name, value) => { const item = node.attrs.find(a => a.name === name); if (item) item.value = value; else node.attrs.push({ name, value }); };
const detach = node => { const list = node.parentNode.childNodes; list.splice(list.indexOf(node), 1); return node; };
const insertBefore = (ref, node) => { const list = ref.parentNode.childNodes; list.splice(list.indexOf(ref), 0, node); node.parentNode = ref.parentNode; };
const prepend = (parent, node) => { parent.childNodes.unshift(node); node.parentNode = parent; };
const textOf = node => node.childNodes.filter(child => child.nodeName === '#text').map(child => child.value).join('');
const setText = (node, value) => { node.childNodes = [{ nodeName: '#text', value, parentNode: node }]; };
const consent = nodes => nodes.filter(node => has(node, 'data-consent'));
const swap = (x, y, name) => { const a = attribute(x, name), b = attribute(y, name); setAttr(x, name, b); setAttr(y, name, a); };
const fragment = html => parseFragment(html).childNodes[0];
// Re-parsed, a <button> inside <svg> stays in the SVG namespace (no breakout from foreign content).
const svgWrap = node => { const svg = fragment('<svg></svg>'); insertBefore(node, svg); svg.childNodes.push(detach(node)); node.parentNode = svg; };
// Move a node's children, text included, into a new element: the visible label stays the same.
const wrap = (node, html) => { const inner = fragment(html); inner.childNodes = node.childNodes; inner.childNodes.forEach(child => { child.parentNode = inner; }); inner.parentNode = node; node.childNodes = [inner]; };

function edit(project, path, change) {
  return { ...project, pages: project.pages.map(page => {
    if (page.path !== path) return page;
    const tree = parseFragment(page.html, { scriptingEnabled: true });
    change(elements(tree));
    return { ...page, html: serialize(tree) };
  }) };
}

// [path, mutation, expected]: true = accepted, a RegExp = 422 with that message, false = any 422.
const CASES = {
  'R1 swap data-consent deny/allow on the banner, keys and texts kept': ['/om/', E => { const [d, a] = consent(E); swap(d, a, 'data-consent'); }, ATTRIBUTE],
  'R2 swap data-consent deny/allow in the dialog, keys and texts kept': ['/om/', E => { const [, , d, a] = consent(E); swap(d, a, 'data-consent'); }, ATTRIBUTE],
  'R3 swap data-consent and keys: the allow button says "Bara nödvändiga"': ['/om/', E => { const [d, a] = consent(E); swap(d, a, 'data-consent'); swap(d, a, 'data-cms-node'); }, LABEL],
  'R4 swap only the banner labels': ['/om/', E => { const [d, a] = consent(E); const td = textOf(d); setText(d, textOf(a)); setText(a, td); }, LABEL],
  'R5 reorder the banner buttons and swap their labels': ['/om/', E => { const [d, a] = consent(E); const td = textOf(d); setText(d, textOf(a)); setText(a, td); insertBefore(d, detach(a)); }, LABEL],
  'R6 swap only the banner keys': ['/om/', E => { const [d, a] = consent(E); swap(d, a, 'data-cms-node'); }, ATTRIBUTE],
  // Codex b1d #3: [1] is the banner allow button, [3] the dialog allow button.
  'N1 aria-label "Bara nödvändiga" on the banner allow button': ['/om/', E => { setAttr(consent(E)[1], 'aria-label', 'Bara nödvändiga'); }, NAME],
  'N2 aria-label "Bara nödvändiga" on the dialog allow button': ['/om/', E => { setAttr(consent(E)[3], 'aria-label', 'Bara nödvändiga'); }, NAME],
  'N3 aria-hidden on a span around the banner allow label': ['/om/', E => { wrap(consent(E)[1], '<span aria-hidden="true"></span>'); }, NAME],
  'N4 aria-hidden on a span around the dialog allow label': ['/om/', E => { wrap(consent(E)[3], '<span aria-hidden="true"></span>'); }, NAME],
  'N5 hidden on a span around the banner allow label': ['/om/', E => { wrap(consent(E)[1], '<span hidden></span>'); }, NAME],
  'N6 title on the banner allow button': ['/om/', E => { setAttr(consent(E)[1], 'title', 'Bara nödvändiga'); }, NAME],
  'N7 title on the dialog allow button': ['/om/', E => { setAttr(consent(E)[3], 'title', 'Bara nödvändiga'); }, NAME],
  'N8 role on the dialog deny button': ['/om/', E => { setAttr(consent(E)[2], 'role', 'presentation'); }, NAME],
  'N9 aria-description on the banner deny button': ['/om/', E => { setAttr(consent(E)[0], 'aria-description', 'Tillåt statistik'); }, NAME],
  'N10 an image with alt inside the banner allow button': ['/om/', E => { const button = consent(E)[1]; button.childNodes.push(Object.assign(fragment('<img src="/favicon.svg" alt="Bara nödvändiga">'), { parentNode: button })); }, NAME],
  'N12 a label around the banner allow button': ['/om/', E => { const button = consent(E)[1], label = fragment('<label>Bara nödvändiga </label>'); insertBefore(button, label); label.childNodes.push(detach(button)); button.parentNode = label; }, NAME],
  'N13 a label for the dialog allow button': ['/om/', E => { const button = consent(E)[3]; setAttr(button, 'id', 'consent-allow'); prepend(E.find(n => has(n, 'id', 'main')), fragment('<label for="consent-allow">Bara nödvändiga</label>')); }, NAME],
  'N14 inert on the banner deny button': ['/om/', E => { setAttr(consent(E)[0], 'inert', ''); }, NAME],
  'N15 inert on a span around the dialog allow label': ['/om/', E => { wrap(consent(E)[3], '<span inert></span>'); }, NAME],
  'N16 tabindex="-1" on the dialog deny button': ['/om/', E => { setAttr(consent(E)[2], 'tabindex', '-1'); }, NAME],
  'N17 a <div inert> around the banner deny button': ['/om/', E => { const button = consent(E)[0], div = fragment('<div inert></div>'); insertBefore(button, div); div.childNodes.push(detach(button)); button.parentNode = div; }, NAME],
  'N18 style="display:none" on the dialog deny button': ['/om/', E => { setAttr(consent(E)[2], 'style', 'display:none'); }, NAME],
  'N19 hidden on the existing actions row around the dialog allow button': ['/om/', E => { setAttr(consent(E)[3].parentNode, 'hidden', ''); }, NAME],
  'N20 a plain <div> around the banner deny button': ['/om/', E => { const button = consent(E)[0], div = fragment('<div></div>'); insertBefore(button, div); div.childNodes.push(detach(button)); button.parentNode = div; }, true],
  'N21 an <svg> around the banner deny button and the dialog allow button': ['/om/', E => { for (const button of [consent(E)[0], consent(E)[3]]) svgWrap(button); }, NAMESPACE],
  'N11 a plain span around the banner allow label': ['/om/', E => { wrap(consent(E)[1], '<span></span>'); }, true],
  'T01 remove data-back-top': ['/om/', E => { const n = E.find(n => has(n, 'data-back-top')); n.attrs = n.attrs.filter(a => a.name !== 'data-back-top'); }, false],
  'T02 remove hidden from the consent banner': ['/om/', E => { const n = E.find(n => has(n, 'data-consent-banner')); n.attrs = n.attrs.filter(a => a.name !== 'hidden'); }, false],
  'T03 duplicate the banner allow button': ['/om/', E => { const n = E.find(n => has(n, 'data-consent', 'allow')); insertBefore(n, fragment('<button data-consent="allow">Tillåt statistik</button>')); }, false],
  'T04 add data-consent to the footer block': ['/om/', E => { E.find(n => hasClass(n, 'footer-main')).attrs.push({ name: 'data-consent', value: 'allow' }); }, false],
  'T05 move the SKIFT link into the footer': ['/om/', E => { const link = detach(E.find(n => has(n, 'data-skift-link'))); insertBefore(E.find(n => hasClass(n, 'footer-main')), link); }, false],
  'T06 move the privacy button into main': ['/om/', E => { const button = detach(E.find(n => has(n, 'data-privacy-open'))); prepend(E.find(n => has(n, 'id', 'main')), button); }, false],
  'T07 add an action to the contact form': ['/kontakt/', E => { E.find(n => n.tagName === 'form').attrs.push({ name: 'action', value: '/api/contact' }); }, false],
  'T08 remove novalidate from the contact form': ['/kontakt/', E => { const f = E.find(n => n.tagName === 'form'); f.attrs = f.attrs.filter(a => a.name !== 'novalidate'); }, false],
  'T09 remove required from the name field': ['/kontakt/', E => { const i = E.find(n => has(n, 'id', 'contact-name')); i.attrs = i.attrs.filter(a => a.name !== 'required'); }, false],
  'T10 add an input to the contact form': ['/kontakt/', E => { E.find(n => n.tagName === 'form').childNodes.push(Object.assign(fragment('<input name="x">'), { parentNode: E.find(n => n.tagName === 'form') })); }, false],
  'T11 rename the first contact field': ['/kontakt/', E => { E.find(n => n.tagName === 'input' && attribute(n, 'name')).attrs.find(a => a.name === 'name').value = 'renamed'; }, false],
  'T12 reorder deny/allow with their labels': ['/om/', E => { const [d, a] = consent(E); insertBefore(d, detach(a)); }, true],
  'T13 swap the banner allow button with the dialog allow button': ['/om/', E => { const [x, y] = E.filter(n => has(n, 'data-consent', 'allow')); const xs = x.parentNode.childNodes, ys = y.parentNode.childNodes, xp = x.parentNode; xs[xs.indexOf(x)] = y; ys[ys.indexOf(y)] = x; x.parentNode = y.parentNode; y.parentNode = xp; }, false],
  'T14 insert a div at the top of main': ['/om/', E => { prepend(E.find(n => has(n, 'id', 'main')), fragment('<div>ny</div>')); }, true],
};

const paths = {
  save: project => validateProject(structuredClone(project), seed, structuredClone(base), opts),
  delta: project => validateProject(applyProjectChanges(structuredClone(base), validateProjectChanges(projectChanges(base, project))), seed, structuredClone(base), opts),
  recover: project => validateProject(structuredClone(project), seed, null, { ...opts, publication: false }),
};
function expectOutcome(run, expected, label) {
  if (expected === true) return assert.doesNotThrow(run, label);
  assert.throws(run, error => error.status === 422 && (expected === false || expected.test(error.message)), label);
}

test('A1b: the unchanged v185 studio copy saves on every path', () => {
  assert.doesNotThrow(() => paths.save(base));
  assert.doesNotThrow(() => paths.recover(base));
});

for (const [label, [path, change, expected]] of Object.entries(CASES)) {
  test(`A1b manipulation ${label}`, () => {
    const project = edit(base, path, change);
    for (const [name, run] of Object.entries(paths)) expectOutcome(() => run(project), expected, `${label} (${name})`);
  });
}

// Stored facts let a page skip validateHtml while its HTML is unchanged. Facts proven
// under policy 3 predate the consent lock, so they must not vouch for a locked button.
function cachedBaseline(change, expected, oldPolicies) {
  const stored = validateProject(structuredClone(base), seed, structuredClone(base), opts);
  const forged = edit(stored, '/om/', change);
  const page = forged.pages.find(item => item.path === '/om/');
  const contracts = (seed.pages.find(item => item.id === page.id) ?? seed.pages.find(item => item.id === page.sourceId) ?? seed.blank).contracts;
  const baseline = policy => ({ ...forged, pages: forged.pages.map(item => item === page ? { ...item, facts: { ...item.facts, validationKey: JSON.stringify([policy, contracts, true]) } } : item) });
  // Control: facts under the current policy are trusted, so the old key alone is what forces the check.
  assert.doesNotThrow(() => validateProject(structuredClone(forged), seed, baseline(VALIDATION_POLICY), opts));
  for (const policy of oldPolicies) {
    const old = baseline(policy);
    assert.throws(() => validateProject(structuredClone(forged), seed, structuredClone(old), opts), expected, `full Save (${policy})`);
    const draft = structuredClone(old); draft.pages.find(item => item.path === '/').description = 'Ändrad på en annan sida.';
    assert.throws(() => validateProject(applyProjectChanges(structuredClone(old), validateProjectChanges(projectChanges(old, draft))), seed, structuredClone(old), opts), expected, `delta Save (${policy})`);
    assert.throws(() => validateProject(structuredClone(forged), seed, structuredClone(old), { ...opts, publication: false }), expected, `recovery against a stored baseline (${policy})`);
  }
}
test('A1b: a stored page accepted under the old validation policy is checked again on every path', () => {
  cachedBaseline(E => { setAttr(consent(E)[0], 'inert', ''); }, NAME, ['cms-policy-3-canonical-editor-widget-preview', 'cms-policy-4-consent-lock']);
});
test('A1b: a stored page with an svg-wrapped consent button, accepted under policy 4, is checked again on every path', () => {
  cachedBaseline(E => { svgWrap(consent(E)[0]); }, NAMESPACE, ['cms-policy-4-consent-lock']);
});

// An old tab or browser draft holds raw v185 HTML: positional keys only.
const oldDraft = () => { const draft = structuredClone(v185); draft.pages[0].description = 'Ändrad i en gammal flik.'; return draft; };
// The one server ingress for client projects (api.mjs): A1a refresh, then the frozen e5592bc map.
const fromClient = project => normalizeClientProject(project, seed);
const oldR1 = () => edit(oldDraft(), '/om/', E => { const [d, a] = consent(E); swap(d, a, 'data-consent'); });

test('A1b: the frozen map and rekeyHtml put every contract key of raw v185 on the same node', () => {
  // Both the client ingress and the stored read path run the A1a refresh first.
  const refreshed = refreshDevelopers(v185, seed), mapped = migrateKeys(refreshed, LEGACY_KEYS);
  const keysOf = html => elements(parseFragment(html, { scriptingEnabled: true })).map(node => attribute(node, 'data-cms-node') ?? null);
  for (const [index, page] of refreshed.pages.entries()) {
    const definition = seed.pages.find(item => item.id === page.id) ?? seed.pages.find(item => item.id === page.sourceId) ?? seed.blank;
    const contract = new Set(definition.contracts.flatMap(item => [item.key, item.spanKey].filter(Boolean)));
    const view = html => keysOf(html).map(key => contract.has(key) ? key : null);
    const viaMap = view(mapped.pages[index].html);
    assert.deepEqual(viaMap, view(rekeyHtml(page.html)), page.path);
    // v185 predates the SKIFT links: the read path inserts them.
    for (const key of contract) if (!key.startsWith('skift-nav')) assert.ok(viaMap.includes(key), `${page.path} lacks ${key}`);
  }
});

test('A1b transition: an old tab saves through the frozen e5592bc map, and R1 still fails', () => {
  assert.doesNotThrow(() => validateProject(fromClient(oldDraft()), seed, base, opts));
  assert.throws(() => validateProject(fromClient(oldR1()), seed, base, opts), ATTRIBUTE);
  assert.throws(() => validateProject(oldDraft(), seed, base, opts), { status: 422 }, 'Without migration positional keys do not match');
});

test('A1b transition: an old draft recovers through the frozen e5592bc map, and R1 still fails', () => {
  const recovered = validateProject(fromClient(oldDraft()), seed, null, { ...opts, publication: false });
  assert.throws(() => validateProject(fromClient(oldR1()), seed, null, { ...opts, publication: false }), ATTRIBUTE);
  const changed = projectChanges(base, recovered).pages.upsert.map(page => page.id);
  assert.deepEqual(changed, ['home']);
});

test('A1b: migrateKeys takes its map from the frozen e5592bc build by template lineage, never from the draft', () => {
  assert.equal(migrateKeys(base, LEGACY_KEYS), base, 'Signature-keyed drafts are returned as they are');
  const forged = oldDraft();
  forged.pages[0].html = forged.pages[0].html.replace(/data-cms-node="n\d+"/, 'data-cms-node="kforged"');
  assert.equal(migrateKeys(forged, LEGACY_KEYS).pages[0].html, forged.pages[0].html, 'A draft that names a signature key is not migrated');
  // As validateProject picks contracts: page id, then sourceId, then blank.
  const about = oldDraft().pages.find(page => page.id === 'about');
  const migrated = page => migrateKeys({ pages: [page] }, LEGACY_KEYS).pages[0].html;
  assert.notEqual(migrated(about), about.html);
  assert.equal(migrated({ ...about, id: crypto.randomUUID(), sourceId: 'about' }), migrated(about), 'An unsaved copy follows its source template');
  assert.equal(migrated({ ...about, id: 'constructor', sourceId: '__proto__' }), migrated({ ...about, id: 'x', sourceId: 'blank' }), 'Prototype names fall back to blank');
});

// What an e5592bc studio tab held: raw v185 plus the SKIFT links its read path
// inserted (fixed keys), positional keys otherwise; /developers/ as A1a serves it.
const oldTab = normalizeSkiftProject(refreshDevelopers(structuredClone(v185), seed), seed);
const legacyPaths = {
  save: project => validateProject(fromClient(structuredClone(project)), seed, structuredClone(base), opts),
  // The old client sends changes against its own positional snapshot.
  delta: project => validateProject(fromClient(applyProjectChanges(structuredClone(base), validateProjectChanges(projectChanges(oldTab, project)))), seed, structuredClone(base), opts),
  recover: project => validateProject(fromClient(structuredClone(project)), seed, null, { ...opts, publication: false }),
};
for (const [label, [path, change, expected]] of Object.entries(CASES)) {
  test(`A1b manipulation through positional keys ${label}`, () => {
    const project = edit(oldTab, path, change);
    assert.ok(!project.pages.find(page => page.path === path).html.includes('data-cms-node="k'), 'The case runs on positional keys');
    for (const [name, run] of Object.entries(legacyPaths)) expectOutcome(() => run(project), expected, `${label} (${name}, positional)`);
  });
}

test('A1b: validateCss rejects data-cms-node selectors in every form, but not #id', () => {
  const forms = ['[data-cms-node]{color:red}', '[DATA-CMS-NODE="k1"]{color:red}', '[data-cms-\\6e ode]{color:red}', '[*|data-cms-node]{color:red}', '[|data-cms-node]{color:red}', ':is([data-cms-node]){color:red}', ':not([data-cms-node="n1"]){color:red}', 'p:has([data-cms-node]){color:red}', '@media (min-width:1px){[data-cms-node="n2"]{color:red}}'];
  for (const css of forms) assert.throws(() => validateCss(css), { status: 422, message: /nodnycklar/ }, css);
  assert.doesNotThrow(() => validateCss('#data-cms-node,.data-cms-node,[data-theme]{color:red}'));
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
async function publishRaw() {
  const head = await readSite(runtime.db);
  return (await publishSite(runtime.db, { project: v185, baseVersion: head?.version ?? 0, requestId: crypto.randomUUID(), actor: runtime.email })).version;
}

test('A1b transition over the API: old Save, replay, delta and recover', async () => {
  let version = await publishRaw();
  const r1 = oldR1();
  // Delta Save from an old tab: positional keys in the changed page only.
  const r1Delta = await admin('save', { changes: projectChanges(v185, r1), baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(r1Delta.status, 422);
  assert.match(await r1Delta.text(), ATTRIBUTE);
  const delta = await admin('save', { changes: projectChanges(v185, oldDraft()), baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(delta.status, 200, await delta.clone().text());
  // Full Save from an old tab, then the same pendingSave replayed.
  version = await publishRaw();
  const r1Full = await admin('save', { project: r1, baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(r1Full.status, 422);
  const body = { project: oldDraft(), baseVersion: version, requestId: crypto.randomUUID() };
  const saved = await admin('save', body);
  assert.equal(saved.status, 200, await saved.clone().text());
  const replay = await admin('save', body);
  assert.equal(replay.status, 200, await replay.clone().text());
  const replayed = await replay.json();
  assert.equal(replayed.replayed, true);
  assert.equal(replayed.version, (await saved.json()).version);
  // A1a: the old tab's stale /developers/ is replaced by the current template, not stored.
  const keysAside = html => html.replace(/ data-cms-node="[^"]*"/g, '');
  const storedDevelopers = (await readSite(runtime.db)).project.pages.find(page => page.id === 'developers');
  assert.equal(keysAside(storedDevelopers.html), keysAside(seed.footerPage.html));
  // Recovery needs no base revision: the map is frozen.
  const recovered = await admin('recover', { project: oldDraft(), pendingSave: null });
  assert.equal(recovered.status, 200, await recovered.clone().text());
  const recoveredR1 = await admin('recover', { project: r1, pendingSave: null });
  assert.equal(recoveredR1.status, 422);
  assert.match(await recoveredR1.text(), ATTRIBUTE);
});

test('A1b over the API: an accessible name on a consent button fails delta Save and recover', async () => {
  const version = await publishRaw();
  assert.equal((await admin('save', { changes: projectChanges(v185, oldDraft()), baseVersion: version, requestId: crypto.randomUUID() })).status, 200, 'The untouched draft saves');
  assert.equal((await admin('recover', { project: oldDraft(), pendingSave: null })).status, 200, 'The untouched draft recovers');
  for (const index of [1, 3]) {
    const forged = edit(oldDraft(), '/om/', E => { setAttr(consent(E)[index], 'aria-label', 'Bara nödvändiga'); });
    const saved = await admin('save', { changes: projectChanges(v185, forged), baseVersion: await publishRaw(), requestId: crypto.randomUUID() });
    assert.equal(saved.status, 422, `save ${index}`);
    assert.match(await saved.text(), NAME);
    const recovered = await admin('recover', { project: forged, pendingSave: null });
    assert.equal(recovered.status, 422, `recover ${index}`);
    assert.match(await recovered.text(), NAME);
  }
});

test('A1b over the API: recovery with an unknown or deleted base revision migrates', async () => {
  await publishRaw();
  const missing = 999999;
  assert.equal(await readSite(runtime.db, missing), null);
  const named = await admin('recover', { project: oldDraft(), pendingSave: null, baseVersion: missing });
  assert.equal(named.status, 200, await named.clone().text());
  // A legacy full pendingSave is checked on its own, and kept as sent.
  const pendingSave = { project: oldDraft(), baseVersion: missing, requestId: crypto.randomUUID() };
  const legacy = await admin('recover', { project: oldDraft(), pendingSave });
  assert.equal(legacy.status, 200, await legacy.clone().text());
  assert.deepEqual((await legacy.json()).pendingSave, pendingSave);
  const forged = await admin('recover', { project: oldDraft(), pendingSave: { ...pendingSave, project: oldR1() } });
  assert.equal(forged.status, 422);
  assert.match(await forged.text(), ATTRIBUTE);
});

test("A1b over the API: one old tab saves twice, the second time on the first Save's version", async () => {
  for (const mode of ['delta', 'full']) {
    const version = await publishRaw();
    const request = (before, after, baseVersion) => ({ ...(mode === 'delta' ? { changes: projectChanges(before, after) } : { project: after }), baseVersion, requestId: crypto.randomUUID() });
    const first = oldDraft();
    const firstSave = await admin('save', request(v185, first, version));
    assert.equal(firstSave.status, 200, `${mode}: ${await firstSave.clone().text()}`);
    const next = (await firstSave.json()).version;
    assert.ok(hasSignatureKeys((await readSite(runtime.db, next)).project.pages[0].html), 'The first Save stores signature keys');
    // The tab acknowledges its own positional snapshot and edits another page.
    const second = edit(first, '/om/', E => { const h1 = E.find(node => node.tagName === 'h1'); h1.childNodes.push({ nodeName: '#text', value: ' Andra sparningen', parentNode: h1 }); });
    const secondSave = await admin('save', request(first, second, next));
    assert.equal(secondSave.status, 200, `${mode}: ${await secondSave.clone().text()}`);
    assert.match((await readSite(runtime.db)).project.pages.find(page => page.path === '/om/').html, /Andra sparningen/);
  }
});

test('A1b over the API: unsaved new and duplicated pages in an old draft save and recover', async () => {
  // Built as e5592bc newPage built them: from its blank (positional keys, no
  // footerVersion) or from a copy of a draft page, with a UUID id and sourceId.
  const { contracts: _contracts, footerVersion: _marker, ...blank } = structuredClone(seed.blank);
  const draft = oldDraft(), about = draft.pages.find(page => page.id === 'about');
  draft.pages.push(
    { ...blank, html: positionalKeys(seed.blank.html), id: crypto.randomUUID(), path: '/ny-gammal-sida/', sourceId: 'blank', name: 'Ny gammal sida', title: 'Ny gammal sida | Omar Yusuf', description: 'En osparad sida i en gammal flik.', noindex: false },
    { ...structuredClone(about), id: crypto.randomUUID(), path: '/om-kopia/', sourceId: about.sourceId ?? about.id, name: 'Om kopia', title: 'Om kopia | Omar Yusuf', description: 'En osparad kopia i en gammal flik.', noindex: false });
  assert.ok(draft.pages.slice(-2).every(page => /data-cms-node="n\d+"/.test(page.html) && !hasSignatureKeys(page.html)));
  let version = await publishRaw();
  const delta = await admin('save', { changes: projectChanges(v185, draft), baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(delta.status, 200, await delta.clone().text());
  version = await publishRaw();
  const full = await admin('save', { project: draft, baseVersion: version, requestId: crypto.randomUUID() });
  assert.equal(full.status, 200, await full.clone().text());
  const recovered = await admin('recover', { project: draft, pendingSave: null });
  assert.equal(recovered.status, 200, await recovered.clone().text());
  // The copy keeps its source's contracts: R1 on it still fails.
  const forged = { ...draft, pages: draft.pages.map((page, index) => index === draft.pages.length - 1 ? edit({ pages: [page] }, page.path, E => { const [d, a] = consent(E); swap(d, a, 'data-consent'); }).pages[0] : page) };
  const forgedSave = await admin('save', { project: forged, baseVersion: (await readSite(runtime.db)).version, requestId: crypto.randomUUID() });
  assert.equal(forgedSave.status, 422);
  assert.match(await forgedSave.text(), ATTRIBUTE);
});

test('A1b over the API: the cases through positional keys on preview, validate and resource endpoints', async () => {
  await publishRaw();
  const ids = { '/om/': 'about', '/kontakt/': 'contact' };
  for (const [label, [path, change, expected]] of Object.entries(CASES)) {
    const project = edit(oldTab, path, change);
    for (const [name, body] of [['preview', { project, pageId: ids[path] }], ['validate', { project }]]) {
      const response = await admin(name, body), text = await response.text();
      assert.equal(response.status, expected === true ? 200 : 422, `${label} (${name}): ${text}`);
      if (expected instanceof RegExp) assert.match(text, expected, `${label} (${name})`);
    }
  }
  const r1 = edit(oldTab, '/om/', E => { const [d, a] = consent(E); swap(d, a, 'data-consent'); });
  const rejected = await admin('asset-lifecycle', { id: seed.assets[0].id, project: r1, action: 'archive', baseVersion: 0 });
  assert.equal(rejected.status, 422);
  assert.match(await rejected.text(), ATTRIBUTE);
  const history = await admin('asset-usage', { id: seed.assets[0].id });
  assert.equal(history.status, 200, await history.clone().text());
});
