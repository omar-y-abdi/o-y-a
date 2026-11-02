import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, parseFragment, serialize } from 'parse5';
import { initial, legacyInitial, seed, built } from '../.generated/cms-seed.mjs';
import { publicBuilt } from '../.generated/cms-public.mjs';
import { stripNodeKeys } from '../src/cms/public-html.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { composePage, frameCss } from '../src/cms/frame.mjs';
import { toFrameProject, toLegacyProject } from '../src/cms/frame-converter.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { fontCss, themeCss } from '../src/cms/theme.mjs';
import { digest, publicationChunks, readSite } from '../src/cms/store.mjs';
import { publicContent } from '../src/cms/render.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
import { frameMigration } from '../scripts/cms-migrate-frame.mjs';
import { baseInitial, baseSeed, baseValidate, basePublish } from './helpers/base-worker.mjs';
import { legacyFrameIdentities, footerId } from './helpers/frame-identities.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

const keys = html => elements(parseFragment(html, { scriptingEnabled: false })).filter(node => attribute(node, 'data-cms-node') !== undefined);
function identity(html) {
  const tree = parseFragment(html, { scriptingEnabled: false });
  for (const node of elements(tree)) node.attrs = node.attrs.filter(attr => attr.name !== 'data-cms-node');
  return serialize(tree);
}
const publicNodes = html => elements(parse(html, { scriptingEnabled: false }));

test('C4 strips only real editor attributes, preserving source bytes, noscript content and public markers', () => {
  const source = `<header DATA-CMS-NODE='frame' id="top-link" data-cms-frame-id="frame-style">Å 🚲</header>\n<main data-cms-node=main><p title='data-cms-node="literal"'>Text data-cms-node="kept"</p><!-- <b data-cms-node="comment"> --><textarea data-cms-node="input">&lt;i data-cms-node="text"&gt;</textarea><svg data-cms-node="svg"><path data-cms-node="path" d="M0 0"></path></svg><noscript><p data-cms-node="fallback" class="note">Utan skript</p></noscript></main>`;
  const expected = `<header id="top-link" data-cms-frame-id="frame-style">Å 🚲</header>\n<main><p title='data-cms-node="literal"'>Text data-cms-node="kept"</p><!-- <b data-cms-node="comment"> --><textarea>&lt;i data-cms-node="text"&gt;</textarea><svg><path d="M0 0"></path></svg><noscript><p class="note">Utan skript</p></noscript></main>`;
  assert.equal(stripNodeKeys(source), expected);
  assert.equal(stripNodeKeys(expected), expected);
  assert.equal(keys(stripNodeKeys(source)).length, 0);
  assert.equal(stripNodeKeys('<main id="main">Ingen nyckel</main>'), '<main id="main">Ingen nyckel</main>');
});

test('C4 projection adds no combined frame-and-main node limit', () => {
  const frame = '<i data-cms-node="frame"></i>'.repeat(7000);
  const main = '<b data-cms-node="body"></b>'.repeat(7000);
  assert.equal(stripNodeKeys(frame + '<main>' + main + '</main>'), '<i></i>'.repeat(7000) + '<main>' + '<b></b>'.repeat(7000) + '</main>');
});

test('C4 public game descriptor is current-build markup without private editor definitions or state growth', () => {
  assert.deepEqual(Object.keys(publicBuilt).sort(), ['main', 'skiftPage', 'styles']);
  assert.deepEqual(publicBuilt.styles, built.styles);
  assert.equal(publicBuilt.main, built.main);
  assert.deepEqual(Object.keys(publicBuilt.skiftPage).sort(), ['bodyClass', 'description', 'html', 'id', 'name', 'noindex', 'path', 'template', 'title']);
  assert.equal(keys(publicBuilt.skiftPage.html).length, 0);
  assert.ok(keys(seed.skiftPage.html).length > 0);
  assert.ok(seed.skiftPage.contracts.length > 0);
  assert.equal(identity(publicBuilt.skiftPage.html), identity(seed.skiftPage.html));
  assert.deepEqual(elements(parseFragment(publicBuilt.skiftPage.html)).map(node => attribute(node, 'id')), elements(parseFragment(seed.skiftPage.html)).map(node => attribute(node, 'id')));
  assert.ok(!Object.hasOwn(built, 'skiftPage'));
  assert.ok(!Object.hasOwn(built, 'html'));
});

test('C4 publication removes keys after alias projection, preserves generated ID selectors and leaves raw/legacy representations intact', () => {
  const project = validateProject(toFrameProject(legacyFrameIdentities(legacyInitial), seed), seed);
  const canonicalFooter = footerId(project.frame.html);
  project.frame.css += `#${canonicalFooter}{border-top:2px solid #123456}`;
  const checked = validateProject(project, seed), before = JSON.stringify(checked);
  const rows = publicationChunks(checked).flat(), fonts = fontCss(checked);
  let projectedMarker = false;
  for (const page of checked.pages) {
    const composed = composePage(checked.frame, page), row = rows.find(item => item.path === page.path);
    assert.equal(row.meta.frameVersion, 2);
    assert.equal(keys(row.html).length, 0, page.path);
    assert.equal(identity(row.html), identity(composed), page.path);
    assert.equal(footerId(row.html), footerId(composed), page.path);
    assert.equal(row.css, fonts + frameCss(checked.frame, page) + page.css, page.path);
    if (composed.includes('data-cms-frame-id=')) {
      projectedMarker = true;
      const marker = attribute(elements(parseFragment(composed)).find(node => attribute(node, 'data-cms-frame-id')), 'data-cms-frame-id');
      assert.ok(row.html.includes(`data-cms-frame-id="${marker}"`));
      assert.ok(row.css.includes('data-cms-frame-id'));
    }
  }
  assert.equal(projectedMarker, true, 'The fixture exercises a styled historically idless frame node');
  assert.equal(keys(rows.find(row => row.path === '@frame').html).length, 0);
  assert.equal(JSON.stringify(checked), before, 'Projection never changes raw input or request identity');
  for (const legacy of [legacyInitial, validateProject(toLegacyProject(checked, seed), seed)]) {
    for (const row of publicationChunks(legacy).flat().filter(row => row.path.startsWith('/'))) {
      assert.equal(row.meta.frameVersion, undefined);
      assert.equal(row.html, legacy.pages.find(page => page.path === row.path).html);
      assert.ok(keys(row.html).length > 0, 'Legacy reader and coordinated reverse keep their keys');
    }
  }
});

test('C4 actual BASE publication, full/delta Save, recovery, restore and frame rollback retain raw identities and replay', async () => {
  const runtime = await cmsRuntime();
  try {
    const original = baseValidate(legacyFrameIdentities(baseInitial), baseSeed, baseInitial), oldId = crypto.randomUUID();
    await basePublish(runtime.db, { project: original, baseVersion: 0, requestId: oldId, actor: runtime.email });
    const blob = await runtime.db.prepare('SELECT project FROM cms_revisions WHERE version=1').first();
    const headers = { 'Cf-Access-Jwt-Assertion': await runtime.token(), Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/json' };
    const call = (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { headers, ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }) });
    const successful = async response => { assert.equal(response.status, 200, await response.clone().text()); return response.json(); };
    const state = await successful(await call('state'));
    assert.equal(state.project.schemaVersion, 2);
    const full = { project: state.project, baseVersion: 1, requestId: crypto.randomUUID() };
    const first = await successful(await call('save', full));
    assert.equal(first.version, 2);
    assert.equal((await runtime.db.prepare('SELECT payload_hash FROM cms_revisions WHERE request_id=?').bind(full.requestId).first()).payload_hash, await digest(JSON.stringify({ baseVersion: full.baseVersion, project: full.project })));
    const head = await successful(await call('state'));
    assert.ok(keys(head.project.frame.html).length > 0);
    assert.ok(head.project.pages.every(page => keys(page.html).length > 0));
    assert.deepEqual(head.built, built, 'Public game markup does not enter the state descriptor');
    const seedForbidden = () => { throw new Error('Canonical public read reached the editor seed'); };
    for (const page of head.project.pages) {
      const response = await publicContent(new Request(runtime.url + page.path), { CMS_DB: runtime.db }, publicBuilt, seedForbidden);
      assert.equal(response.status, page.path === '/404.html' ? 404 : 200);
      assert.equal(publicNodes(await response.text()).filter(node => attribute(node, 'data-cms-node') !== undefined).length, 0, page.path);
      const css = await publicContent(new Request(`${runtime.url}/cms-public/v2/${page.id}.css`), { CMS_DB: runtime.db }, publicBuilt, seedForbidden);
      assert.equal(css.status, 200);
      assert.equal(await css.text(), themeCss(head.project.theme) + fontCss(head.project) + frameCss(head.project.frame, page) + page.css);
    }
    const currentGame = { ...publicBuilt, skiftPage: { ...publicBuilt.skiftPage, html: publicBuilt.skiftPage.html.replace('</main>', '<p id="next-build-marker">Ny spelversion</p></main>') } };
    const gameResponse = await publicContent(new Request(runtime.url + '/play/skift/'), { CMS_DB: runtime.db }, currentGame, seedForbidden);
    assert.equal(gameResponse.status, 200);
    const game = await gameResponse.text(), gameNodes = publicNodes(game);
    assert.ok(game.includes('Ny spelversion'));
    assert.equal(gameNodes.filter(node => attribute(node, 'data-cms-node') !== undefined).length, 0);
    for (const id of ['start-button', 'main', 'mobile-menu']) assert.equal(gameNodes.filter(node => attribute(node, 'id') === id).length, 1, id);
    assert.equal((await readSite(runtime.db)).version, 2, 'New build content never republishes the owner frame');

    const changed = structuredClone(head.project), home = changed.pages.find(page => page.path === '/');
    home.html = home.html.replace('</main>', '<p data-cms-node="u-c4-added">Nyckeln finns bara i studion</p></main>');
    const delta = { changes: projectChanges(head.project, changed), baseVersion: 2, requestId: crypto.randomUUID() };
    assert.equal((await successful(await call('save', delta))).version, 3);
    const live = await (await runtime.mf.dispatchFetch(runtime.url + '/')).text();
    assert.ok(live.includes('<p>Nyckeln finns bara i studion</p>'));
    const saved = await readSite(runtime.db, 3, { raw: true });
    assert.ok(saved.project.pages.find(page => page.path === '/').html.includes('data-cms-node="u-c4-added"'));
    assert.equal((await successful(await call('save', full))).version, 2);
    assert.equal((await successful(await call('save', delta))).replayed, true);
    assert.equal((await readSite(runtime.db)).version, 3);
    const history = await readSite(runtime.db, 2, { raw: true });
    const recovered = await successful(await call('recover', { project: history.project, pendingSave: full }));
    assert.deepEqual(recovered.pendingSave, full);
    assert.ok(keys(recovered.project.frame.html).length > 0);
    assert.equal((await successful(await call('save', { project: recovered.project, baseVersion: 3, requestId: crypto.randomUUID() }))).version, 4);
    assert.ok(!(await (await runtime.mf.dispatchFetch(runtime.url + '/')).text()).includes('Nyckeln finns bara i studion'));

    for (const reverse of [true, false]) {
      const intent = frameMigration(await readSite(runtime.db, undefined, { raw: true }), seed, { reverse, origin: runtime.url });
      const { project: _project, ...envelope } = intent;
      const result = await successful(await call('migrate-frame', { ...envelope, requestId: crypto.randomUUID() }));
      assert.equal(result.version, reverse ? 5 : 6);
      const rows = await runtime.db.prepare("SELECT html,meta FROM cms_rendered WHERE version=? AND path LIKE '/%'").bind(result.version).all();
      assert.ok(rows.results.length > 0);
      for (const row of rows.results) assert.equal(keys(row.html).length > 0, reverse, 'Only coordinated legacy rollback retains public keys');
      const raw = await readSite(runtime.db, undefined, { raw: true });
      assert.ok(raw.project.pages.every(page => keys(page.html).length > 0));
      if (!reverse) assert.ok(keys(raw.project.frame.html).length > 0);
    }
    const oldReplay = await successful(await call('save', { project: original, baseVersion: 0, requestId: oldId }));
    assert.equal(oldReplay.version, 1);
    assert.equal(oldReplay.replayed, true);
    assert.equal((await readSite(runtime.db)).version, 6);
    assert.deepEqual(await runtime.db.prepare('SELECT project FROM cms_revisions WHERE version=1').first(), blob, 'Historical compressed bytes stay exact');
    assert.deepEqual((await readSite(runtime.db, 1, { raw: true })).project, original);
  } finally { await runtime.close(); }
});

test('C4 does not make internal-key CSS an authoring interface on Save, validate or backup recovery', async () => {
  const runtime = await cmsRuntime();
  try {
    const headers = { 'Cf-Access-Jwt-Assertion': await runtime.token(), Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' };
    for (const selector of ['[data-cms-node]', '[DATA-CMS-NODE]', '[d\\61 ta-cms-node]', '[data-cms-frame-id]']) {
      const project = structuredClone(initial);
      project.pages[0].css = `${selector}{color:#123456}`;
      for (const path of ['save', 'validate', 'recover']) {
        const response = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { method: 'POST', headers, body: JSON.stringify({ project, ...(path === 'save' ? { baseVersion: 0, requestId: crypto.randomUUID() } : {}) }) });
        assert.equal(response.status, 422, `${path} ${selector}: ${await response.clone().text()}`);
        assert.match((await response.json()).error, /nodnycklar/);
      }
    }
    assert.equal(await readSite(runtime.db), null);
  } finally { await runtime.close(); }
});
