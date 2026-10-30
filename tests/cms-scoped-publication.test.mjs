import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
import { publicationChunks, publishSite, readSite, renderProof, reusableRows } from '../src/cms/store.mjs';
import { resolveResources, resourceReferences } from '../src/cms/resources.mjs';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';
import { nodeCms, nodeWorker } from './helpers/cms-node.mjs';

const RENDER_KEY = 'render-test';
const actor = 'owner@example.test';
const origins = ['https://omaryusuf.se'];
const FONT = '6f1d6e5e-2c1a-4b7e-9d1e-7a3c2b1f0e11';
const IMAGE = '9a2c4b6d-1e3f-4a5b-8c7d-0e9f1a2b3c4d';
const ADDED_PATH = '/scoped-added/';

const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const base = validateProject(normalizeStoredProject(structuredClone(raw), seed, initial), seed, undefined, { origins });
const worker = await nodeWorker();

const pagesOf = paths => paths.filter(path => path.startsWith('/'));
const cardsOf = paths => paths.filter(path => path.startsWith('@card/'));
const pagePaths = project => project.pages.map(page => page.path).sort();
const renderedRows = (runtime, version = 187) => runtime.sqlite.prepare('SELECT path, html, css, meta FROM cms_rendered WHERE version = ? ORDER BY path').all(version);
const manifestMeta = (runtime, version) => JSON.parse(runtime.sqlite.prepare("SELECT meta FROM cms_rendered WHERE version=? AND path='@manifest'").get(version).meta);
const editAbout = (draft, label) => { const page = draft.pages.find(item => item.path === '/om/'); page.html = page.html.replace('</main>', `<p>${label}</p></main>`); };

function insertMedia(runtime) {
  for (const [id, extension, mime] of [[FONT, 'woff2', 'font/woff2'], [IMAGE, 'png', 'image/png']]) {
    runtime.sqlite.prepare('INSERT INTO cms_media(id,object_key,name,mime,bytes,sha256,created_at,validation_version) VALUES(?,?,?,?,1,?,?,1)').run(id, `${id}.${extension}`, `${extension} fixture`, mime, 'a'.repeat(64), '2026-10-11T00:00:00.000Z');
  }
}

// Version 186 is a canonical head whose rows were published with the render proof.
async function publishedBase(project = base) {
  const runtime = await nodeCms(raw, null);
  insertMedia(runtime);
  await publishSite(runtime.db, { project, baseVersion: 185, requestId: crypto.randomUUID(), actor, studioKey: seed.studioKey, renderKey: RENDER_KEY });
  return runtime;
}

function edited(project, mutate) {
  const draft = structuredClone(project);
  mutate(draft);
  return validateProject(draft, seed, undefined, { origins });
}

function addedPage(draft) {
  const { facts: _facts, ...copy } = structuredClone(draft.pages.find(page => page.path === '/om/'));
  return { ...copy, id: 'scoped-added', path: ADDED_PATH, name: 'Tillagd sida', title: 'Tillagd sida' };
}

// One Save with reuse and one without, from identical bases. Rows must match byte for byte.
async function compare(baseProject, next, { beforeReuse = () => {} } = {}) {
  const reuse = await publishedBase(baseProject), full = await publishedBase(baseProject);
  try {
    beforeReuse(reuse);
    const references = resourceReferences(next);
    const resources = await resolveResources(reuse.db, next);
    const reuseFrom = { version: 186, project: baseProject };
    const reused = await reusableRows(reuse.db, next, reuseFrom, resources, references, renderProof(RENDER_KEY));
    const rendered = publicationChunks(next, resources, references, { reused }).flat().map(row => row.path);
    const requestId = crypto.randomUUID();
    await publishSite(reuse.db, { project: next, baseVersion: 186, requestId, actor, studioKey: seed.studioKey, renderKey: RENDER_KEY, reuseFrom });
    await publishSite(full.db, { project: next, baseVersion: 186, requestId, actor, studioKey: seed.studioKey, renderKey: RENDER_KEY });
    assert.ok(renderedRows(full).length > 0);
    assert.deepEqual(renderedRows(reuse), renderedRows(full));
    return { reused, rendered, paths: renderedRows(reuse).map(row => row.path) };
  } finally { reuse.close(); full.close(); }
}

test('a page text edit renders only that page', async () => {
  const next = edited(base, draft => { const page = draft.pages.find(item => item.path === '/om/'); page.html = page.html.replace('</main>', '<p>Scoped edit.</p></main>'); });
  const { reused, rendered } = await compare(base, next);
  assert.ok(reused?.paths.size > 0);
  assert.deepEqual(pagesOf(rendered), ['/om/']);
  assert.deepEqual(cardsOf(rendered), []);
});

// stripNodeKeys removes the key itself. Frame keys reach public bytes only because
// a ">" stops composePage's nav regex, so that page loses its aria-current.
for (const [name, mutate] of [
  ['stylesheet', page => { page.css += '.scoped-css-edit{margin:0}'; }],
  ['title', page => { page.title = 'Ändrad titel'; }],
  ['frame ID', page => { page.frameIds['f-n0'][1] = 'scoped-skip-link'; }],
  ['frame key', page => { page.frameKeys['f-n12'] = 'scoped>nav'; }],
]) test(`a page ${name} edit renders only that page`, async () => {
  const next = edited(base, draft => mutate(draft.pages.find(page => page.path === '/om/')));
  const { rendered } = await compare(base, next);
  assert.deepEqual(pagesOf(rendered), ['/om/']);
  assert.deepEqual(cardsOf(rendered), []);
});

test('adding a page renders only the new page', async () => {
  const next = edited(base, draft => draft.pages.push(addedPage(draft)));
  const { reused, rendered } = await compare(base, next);
  assert.ok(reused?.paths.size > 0);
  assert.deepEqual(pagesOf(rendered), [ADDED_PATH]);
});

test('removing a page renders no page', async () => {
  const withAdded = edited(base, draft => draft.pages.push(addedPage(draft)));
  const next = edited(withAdded, draft => { draft.pages = draft.pages.filter(page => page.path !== ADDED_PATH); });
  const { rendered, paths } = await compare(withAdded, next);
  assert.deepEqual(pagesOf(rendered), []);
  assert.ok(!paths.includes(ADDED_PATH));
});

test('reordering pages renders no page', async () => {
  const next = edited(base, draft => { draft.pages.reverse(); });
  const { rendered, paths } = await compare(base, next);
  assert.deepEqual(pagesOf(rendered), []);
  assert.ok(paths.includes('@manifest'));
});

test('changing a page path renders only that page and drops the old path', async () => {
  const withAdded = edited(base, draft => draft.pages.push(addedPage(draft)));
  const next = edited(withAdded, draft => { draft.pages.find(page => page.path === ADDED_PATH).path = '/scoped-moved/'; });
  const { rendered, paths } = await compare(withAdded, next);
  assert.deepEqual(pagesOf(rendered), ['/scoped-moved/']);
  assert.ok(!paths.includes(ADDED_PATH));
});

test('a frame edit renders every page', async () => {
  const next = edited(base, draft => { draft.frame = { ...draft.frame, css: `${draft.frame.css}.scoped-frame-edit{margin:0}` }; });
  const { reused, rendered } = await compare(base, next);
  assert.equal(reused, null);
  assert.deepEqual(pagesOf(rendered).sort(), pagePaths(base));
});

test('a frame HTML edit renders every page', async () => {
  const next = edited(base, draft => { draft.frame.html = draft.frame.html.replace('Thanks for stopping by.', 'En ny avslutning.'); });
  const { reused, rendered } = await compare(base, next);
  assert.equal(reused, null);
  assert.deepEqual(pagesOf(rendered).sort(), pagePaths(base));
});

test('a theme edit renders no page', async () => {
  const next = edited(base, draft => { draft.theme = { ...draft.theme, radius: draft.theme.radius + 1 }; });
  const { reused, rendered, paths } = await compare(base, next);
  assert.ok(reused?.paths.size > 0);
  assert.deepEqual(pagesOf(rendered), []);
  assert.ok(paths.includes('@theme'));
});

test('a font added on one page renders every page', async () => {
  const next = edited(base, draft => { draft.pages[0].css += `.scoped-font{font-family:cms-font-${FONT}}`; });
  const { reused, rendered } = await compare(base, next);
  assert.equal(reused, null);
  assert.deepEqual(pagesOf(rendered).sort(), pagePaths(base));
});

test('a resource change renders every page', async () => {
  const next = edited(base, draft => { draft.resources = { ...draft.resources, social: `/media/${IMAGE}.png` }; });
  const { reused, rendered } = await compare(base, next);
  assert.equal(reused, null);
  assert.deepEqual(pagesOf(rendered).sort(), pagePaths(base));
});

test('a card edit renders only that card', async () => {
  const id = base.cards[0].id;
  const next = edited(base, draft => { draft.cards[0].text = 'Ändrad vinst.'; });
  const { reused, rendered } = await compare(base, next);
  assert.ok(reused?.paths.size > 0);
  assert.deepEqual(pagesOf(rendered), []);
  assert.deepEqual(cardsOf(rendered), [`@card/${id}`]);
});

test('a card flavor edit renders only that card', async () => {
  const id = base.cards[0].id;
  const next = edited(base, draft => { draft.cards[0].flavor = 'joke'; });
  const { rendered } = await compare(base, next);
  assert.deepEqual(pagesOf(rendered), []);
  assert.deepEqual(cardsOf(rendered), [`@card/${id}`]);
});

test('moving a card to trash removes its public row', async () => {
  const id = base.cards[0].id;
  const next = edited(base, draft => { draft.cards[0].state = 'trash'; });
  const { rendered, paths } = await compare(base, next);
  assert.deepEqual(pagesOf(rendered), []);
  assert.deepEqual(cardsOf(rendered), []);
  assert.ok(!paths.includes(`@card/${id}`));
});

test('a card design edit renders only that card', async () => {
  const id = base.cards[0].id;
  const designed = edited(base, draft => { draft.cards[0].design = { html: '<div><p data-card-text>Ändrad vinst.</p></div>', css: '.scoped-card{color:red}' }; });
  const next = edited(designed, draft => { draft.cards[0].design.css = '.scoped-card{color:blue}'; });
  const { reused, rendered } = await compare(designed, next);
  assert.ok(reused?.paths.size > 0);
  assert.deepEqual(pagesOf(rendered), []);
  assert.deepEqual(cardsOf(rendered), [`@card/${id}`]);
});

test('a card returning from trash is rendered, not copied', async () => {
  const id = base.cards[0].id;
  const trashed = edited(base, draft => { draft.cards[0].state = 'trash'; });
  const next = edited(trashed, draft => { draft.cards[0].state = 'active'; });
  const { rendered, paths } = await compare(trashed, next);
  assert.deepEqual(cardsOf(rendered), [`@card/${id}`]);
  assert.ok(paths.includes(`@card/${id}`));
});

test('a path reused by another page id is rendered, not copied', async () => {
  const withAdded = edited(base, draft => draft.pages.push(addedPage(draft)));
  const next = edited(withAdded, draft => { draft.pages.find(page => page.path === ADDED_PATH).id = 'scoped-replacement'; });
  const { rendered } = await compare(withAdded, next);
  assert.deepEqual(pagesOf(rendered), [ADDED_PATH]);
});

test('an email edit renders no page', async () => {
  const next = edited(base, draft => { draft.email = structuredClone(DEFAULT_EMAIL); draft.email.templates.receipt.subject = 'Ändrad'; });
  const { rendered, paths } = await compare(base, next);
  assert.deepEqual(pagesOf(rendered), []);
  assert.ok(rendered.includes('@email'));
  assert.ok(paths.includes('@email'));
});

async function reusableFor(runtime, project, renderKey = RENDER_KEY) {
  return reusableRows(runtime.db, project, { version: 186, project: base }, await resolveResources(runtime.db, project), resourceReferences(project), renderProof(renderKey));
}

test('reuse is refused for another render key', async () => {
  const runtime = await publishedBase();
  try {
    assert.ok(await reusableFor(runtime, base));
    assert.equal(await reusableFor(runtime, base, 'other-render'), null);
  } finally { runtime.close(); }
});

test('reuse is refused for a proof written in another render year', async () => {
  const runtime = await publishedBase();
  try {
    assert.ok(await reusableFor(runtime, base));
    runtime.sqlite.prepare("UPDATE cms_rendered SET meta=? WHERE version=186 AND path='@manifest'").run(JSON.stringify({ renderKey: `${RENDER_KEY}:${new Date().getUTCFullYear() - 1}` }));
    assert.equal(await reusableFor(runtime, base), null);
  } finally { runtime.close(); }
});

test('reuse is refused for schema 1 projects', async () => {
  const runtime = await publishedBase();
  try {
    assert.ok(await reusableFor(runtime, base));
    assert.equal(await reusableFor(runtime, { ...base, schemaVersion: 1 }), null);
  } finally { runtime.close(); }
});

// The reverse migration publishes such a head; readCurrentProject then converts it to schema 2.
test('reuse is refused for a schema 1 head that carries the proof', async () => {
  const runtime = await publishedBase(raw);
  try {
    assert.equal(manifestMeta(runtime, 186).renderKey, renderProof(RENDER_KEY));
    assert.equal(await reusableFor(runtime, base), null);
  } finally { runtime.close(); }
});

test('reuse is refused when the base rows lack the manifest proof', async () => {
  const runtime = await publishedBase();
  try {
    assert.ok(await reusableFor(runtime, base));
    runtime.sqlite.prepare("UPDATE cms_rendered SET meta='{}' WHERE version=186 AND path='@manifest'").run();
    assert.equal(await reusableFor(runtime, base), null);
  } finally { runtime.close(); }
});

test('the render proof is written only on the manifest row, and only when a render key is given', async () => {
  const keyed = await publishedBase();
  const plain = await nodeCms(raw, null);
  insertMedia(plain);
  try {
    assert.deepEqual(JSON.parse(keyed.sqlite.prepare("SELECT meta FROM cms_rendered WHERE version=186 AND path='@manifest'").get().meta), { renderKey: `${RENDER_KEY}:${new Date().getUTCFullYear()}` });
    await publishSite(plain.db, { project: base, baseVersion: 185, requestId: crypto.randomUUID(), actor, studioKey: seed.studioKey });
    assert.equal(plain.sqlite.prepare("SELECT meta FROM cms_rendered WHERE version=186 AND path='@manifest'").get().meta, '{}');
  } finally { keyed.close(); plain.close(); }
});

test('a page whose base row is missing is rendered, not copied', async () => {
  const next = structuredClone(base);
  const { reused, rendered } = await compare(base, next, { beforeReuse: runtime => runtime.sqlite.prepare("DELETE FROM cms_rendered WHERE version=186 AND path='/om/'").run() });
  assert.ok(reused?.paths.size > 0);
  assert.ok(!reused.paths.has('/om/'));
  assert.deepEqual(pagesOf(rendered), ['/om/']);
});

test('a card whose base row is missing is rendered, not copied', async () => {
  const path = `@card/${base.cards[0].id}`;
  const { reused, rendered } = await compare(base, structuredClone(base), { beforeReuse: runtime => runtime.sqlite.prepare('DELETE FROM cms_rendered WHERE version=186 AND path=?').run(path) });
  assert.ok(reused?.paths.size > 0);
  assert.ok(!reused.paths.has(path));
  assert.deepEqual(cardsOf(rendered), [path]);
});

test('a Save that loses the head race writes no rows for its version', async () => {
  const first = edited(base, draft => { const page = draft.pages.find(item => item.path === '/om/'); page.html = page.html.replace('</main>', '<p>Första.</p></main>'); });
  const second = edited(base, draft => { const page = draft.pages.find(item => item.path === '/om/'); page.html = page.html.replace('</main>', '<p>Andra.</p></main>'); });
  const candidates = [first, second];
  const runtime = await publishedBase();
  try {
    const reuseFrom = { version: 186, project: base };
    const results = await Promise.allSettled(candidates.map(project => publishSite(runtime.db, { project, baseVersion: 186, requestId: crypto.randomUUID(), actor, studioKey: seed.studioKey, renderKey: RENDER_KEY, reuseFrom })));
    const winner = results.findIndex(result => result.status === 'fulfilled');
    assert.notEqual(winner, -1);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(results[1 - winner].reason.status, 409);
    const expected = await publishedBase();
    try {
      await publishSite(expected.db, { project: candidates[winner], baseVersion: 186, requestId: crypto.randomUUID(), actor, studioKey: seed.studioKey, renderKey: RENDER_KEY });
      assert.deepEqual(renderedRows(runtime), renderedRows(expected));
    } finally { expected.close(); }
  } finally { runtime.close(); }
});

// composePage reads the year once per rendered page; a publication's proof reads it once.
async function yearReads(run, year = (_read, actual) => actual) {
  const { getUTCFullYear } = Date.prototype;
  let reads = 0;
  Date.prototype.getUTCFullYear = function () { return year(reads++, getUTCFullYear.call(this)); };
  try { await run(); } finally { Date.prototype.getUTCFullYear = getUTCFullYear; }
  return reads;
}

test('a Save crossing into a new year keeps the proof of the rows it copied', async () => {
  const runtime = await publishedBase();
  try {
    const next = edited(base, draft => editAbout(draft, 'Över nyår'));
    const proof = renderProof(RENDER_KEY);
    await yearReads(() => publishSite(runtime.db, { project: next, baseVersion: 186, requestId: crypto.randomUUID(), actor, studioKey: seed.studioKey, renderKey: RENDER_KEY, reuseFrom: { version: 186, project: base } }), (read, year) => read ? year + 1 : year);
    assert.equal(manifestMeta(runtime, 187).renderKey, proof);
  } finally { runtime.close(); }
});

async function accepted(response) {
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}

// The studio's Save: read the head, edit one page, send only the change.
async function deltaSave(runtime, label) {
  const state = await accepted(await runtime.fetch('/admin/api/state'));
  const draft = structuredClone(state.project);
  editAbout(draft, label);
  return accepted(await runtime.fetch('/admin/api/save', { changes: projectChanges(state.project, draft), baseVersion: state.version, requestId: crypto.randomUUID() }));
}

// Everything a handler binds on env.CMS_DB, so a test sees what it really writes.
function recordBinds(runtime) {
  const { prepare } = runtime.db, bound = [];
  runtime.db.prepare = sql => {
    const statement = prepare(sql), { bind } = statement;
    statement.bind = (...args) => { bound.push({ sql, args }); return bind.apply(statement, args); };
    return statement;
  };
  return bound;
}
const renderedPaths = bound => bound.filter(({ sql }) => sql.includes("json_extract(value, '$.path')")).flatMap(({ args }) => JSON.parse(args[1]).map(row => row.path));
const copiedPaths = bound => bound.filter(({ sql }) => sql.includes('SELECT ?, path, html, css, meta FROM cms_rendered')).flatMap(({ args }) => JSON.parse(args[2]));

async function assertFullRender(runtime, version) {
  const { project } = await readSite(runtime.db, version);
  const full = publicationChunks(project, await resolveResources(runtime.db, project), resourceReferences(project), { proof: manifestMeta(runtime, version).renderKey }).flat();
  assert.deepEqual(renderedRows(runtime, version).map(row => ({ ...row, meta: JSON.parse(row.meta) })), JSON.parse(JSON.stringify(full)).sort((left, right) => left.path < right.path ? -1 : 1));
}

test('consecutive delta Saves through the real handler copy every unchanged row', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    assert.equal((await deltaSave(runtime, 'Första')).version, 186);
    assert.match(manifestMeta(runtime, 186).renderKey ?? '', /:\d{4}$/, 'The handler must publish the render proof');
    const bound = recordBinds(runtime);
    for (const [version, label] of [[187, 'Andra'], [188, 'Tredje']]) {
      const expected = renderedRows(runtime, version - 1).map(row => row.path).filter(path => path !== '/om/' && /^(?:\/|@card\/)/.test(path));
      bound.length = 0;
      assert.equal((await deltaSave(runtime, label)).version, version);
      assert.deepEqual(pagesOf(renderedPaths(bound)), ['/om/']);
      assert.deepEqual(cardsOf(renderedPaths(bound)), []);
      assert.deepEqual(copiedPaths(bound).sort(), expected.sort());
    }
    await assertFullRender(runtime, 188);
  } finally { runtime.close(); }
});

// A new studio key without a new render key leaves the head outside readStudioHead.
test('a schema 2 head with the proof but no current studio copy is reused byte for byte', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await deltaSave(runtime, 'Bas');
    runtime.sqlite.prepare("UPDATE cms_studio_heads SET build_key = 'earlier-build' WHERE version = 186").run();
    const { project } = await accepted(await runtime.fetch('/admin/api/state'));
    assert.equal(await yearReads(async () => accepted(await runtime.fetch('/admin/api/validate', { project }))), 1, 'Validate reuses every row');
    const bound = recordBinds(runtime);
    assert.equal((await deltaSave(runtime, 'Utan kopia')).version, 187);
    assert.deepEqual(pagesOf(renderedPaths(bound)), ['/om/']);
    await assertFullRender(runtime, 187);
  } finally { runtime.close(); }
});

test('Validate through the real handler reuses the head and still counts it', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await deltaSave(runtime, 'Bas');
    const state = await accepted(await runtime.fetch('/admin/api/state'));
    const draft = structuredClone(state.project);
    editAbout(draft, 'Ej sparad');
    assert.equal(await yearReads(async () => accepted(await runtime.fetch('/admin/api/validate', { project: state.project }))), 1, 'Only the proof reads the year');
    assert.equal(await yearReads(async () => accepted(await runtime.fetch('/admin/api/validate', { project: draft }))), 2, 'Only the edited page composes');
    // A copied row counts its stored bytes, so the limit still sees the whole publication.
    runtime.sqlite.prepare('UPDATE cms_rendered SET html = html || ? WHERE version = ? AND path = ?').run(' '.repeat(17 * 1024 * 1024), state.version, `@card/${state.project.cards[0].id}`);
    assert.equal((await runtime.fetch('/admin/api/validate', { project: draft })).status, 413);
  } finally { runtime.close(); }
});
