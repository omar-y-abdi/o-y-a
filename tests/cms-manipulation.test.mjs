import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFragment, serialize } from 'parse5';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { normalizeStoredProject } from '../src/cms/shared-content.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { migrateKeys, validateCss } from '../src/cms/validation.mjs';
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

// An old tab or browser draft holds raw v185 HTML: positional keys only.
const oldDraft = () => { const draft = structuredClone(v185); draft.pages[0].description = 'Ändrad i en gammal flik.'; return draft; };
const oldR1 = () => edit(oldDraft(), '/om/', E => { const [d, a] = consent(E); swap(d, a, 'data-consent'); });

test('A1b transition: an old tab saves through its base revision, and R1 still fails', () => {
  assert.doesNotThrow(() => validateProject(migrateKeys(oldDraft(), v185), seed, base, opts));
  assert.throws(() => validateProject(migrateKeys(oldR1(), v185), seed, base, opts), ATTRIBUTE);
  assert.throws(() => validateProject(oldDraft(), seed, base, opts), { status: 422 }, 'Without migration positional keys do not match');
});

test('A1b transition: an old draft recovers through its base revision, and R1 still fails', () => {
  const recovered = validateProject(migrateKeys(oldDraft(), v185), seed, null, { ...opts, publication: false });
  assert.throws(() => validateProject(migrateKeys(oldR1(), v185), seed, null, { ...opts, publication: false }), ATTRIBUTE);
  // /developers/ is read from the current template (A1a), so the old draft's stale copy differs too.
  const changed = projectChanges(base, recovered).pages.upsert.map(page => page.id).filter(id => id !== 'developers');
  assert.deepEqual(changed, ['home']);
});

test('A1b: migrateKeys takes its map from the base, never from the draft', () => {
  assert.equal(migrateKeys(base, v185), base, 'Signature-keyed drafts are returned as they are');
  const draft = oldDraft();
  assert.equal(migrateKeys(draft, null), draft);
  const forged = oldDraft();
  forged.pages[0].html = forged.pages[0].html.replace(/data-cms-node="n\d+"/, 'data-cms-node="kforged"');
  assert.equal(migrateKeys(forged, v185).pages[0].html, forged.pages[0].html, 'A draft that names a signature key is not migrated');
});

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
  // Recovery maps through the base revision the client names.
  const recovered = await admin('recover', { project: oldDraft(), pendingSave: null, baseVersion: version });
  assert.equal(recovered.status, 200, await recovered.clone().text());
  const recoveredR1 = await admin('recover', { project: r1, pendingSave: null, baseVersion: version });
  assert.equal(recoveredR1.status, 422);
  assert.match(await recoveredR1.text(), ATTRIBUTE);
  const unmapped = await admin('recover', { project: oldDraft(), pendingSave: null });
  assert.equal(unmapped.status, 422, 'A draft without a known base cannot be migrated');
});
