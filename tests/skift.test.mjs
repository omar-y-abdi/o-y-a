import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseFragment, serialize } from 'parse5';
import { initial, seed, built } from '../.generated/cms-seed.mjs';
import { routes } from '../src/content/site.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { normalizeStoredProject } from '../src/cms/shared-content.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { Draft } from '../src/cms/client/draft.mjs';

function withoutGame(project) {
  const legacy = structuredClone(project);
  for (const key of Object.keys(legacy.runtime)) if (key.startsWith('runtime.skift.')) delete legacy.runtime[key];
  legacy.pages = legacy.pages.filter(page => page.path !== '/play/skift/');
  for (const page of legacy.pages) {
    const tree = parseFragment(page.html);
    const visit = node => {
      node.childNodes = node.childNodes?.filter(child => !child.attrs?.some(attr => ['data-skift-link', 'data-skift-mobile-link'].includes(attr.name)));
      for (const child of node.childNodes ?? []) visit(child);
    };
    visit(tree); page.html = serialize(tree);
  }
  return legacy;
}

test('every public page links to a built, dedicated SKIFT page', async () => {
  assert.ok(routes.some(page => page.path === '/play/skift/'));
  for (const page of routes) {
    const html = await readFile(page.noindex ? 'dist/404.html' : `dist${page.path}index.html`, 'utf8');
    assert.match(html, /class="shift-link"[^>]*href="\/play\/skift\/"/);
    assert.match(html, /Starta ditt arbetsskift/);
    const tree = parseFragment(html);
    const navs = [];
    const visit = node => { if (node.tagName === 'nav') navs.push(node); for (const child of node.childNodes ?? []) visit(child); };
    visit(tree);
    for (const name of ['primary-nav', 'mobile-menu']) {
      const nav = navs.find(node => node.attrs.some(attr => attr.name === 'class' && attr.value === name));
      const links = nav.childNodes.filter(node => node.tagName === 'a').map(node => node.attrs.find(attr => attr.name === 'href')?.value);
      assert.equal(links[links.indexOf('/verkstad/') + 1], '/play/skift/', 'Game link must immediately follow Lek en stund');
    }
  }
});

// A14: the game page is code-owned, so the CMS register never holds it, while
// the navigation links on CMS pages keep their protected target.
test('SKIFT stays out of the CMS page register while its navigation links stay protected', () => {
  const project = structuredClone(initial);
  assert.ok(!project.pages.some(page => page.id === 'skift' || page.path === '/play/skift/'), 'Game must not appear in the CMS page register');
  assert.doesNotThrow(() => validateProject(project, seed));
  const redirected = structuredClone(project);
  redirected.pages[0].html = redirected.pages[0].html.replace(/(<a class="shift-link" href=")\/play\/skift\//, '$1/om/');
  assert.throws(() => validateProject(redirected, seed), /skyddat/);
});

test('old CMS state gains the game navigation, not a stored game page, without changing owner content or identities', () => {
  const legacy = withoutGame(initial);
  legacy.pages[0].description = 'Ägarens beskrivning';
  // A1b: owner CSS may not select editor keys, so use an ordinary selector.
  legacy.pages[0].css = '.site-header{color:#123456}';
  legacy.runtime['runtime.skift.sv.footer'] = 'Ägarens äldre skifttext.';
  const untouched = structuredClone(legacy);
  const upgraded = normalizeStoredProject(legacy, seed, initial);
  assert.ok(!upgraded.pages.some(page => page.path === '/play/skift/'), 'A14: the game page is code-owned');
  assert.match(upgraded.pages[0].html, /data-skift-link/);
  assert.equal(upgraded.pages[0].description, 'Ägarens beskrivning');
  assert.equal(upgraded.pages[0].css, untouched.pages[0].css);
  assert.equal(upgraded.runtime['runtime.skift.sv.footer'], 'Ägarens äldre skifttext.');
  assert.deepEqual(legacy, untouched);
  assert.deepEqual(normalizeStoredProject(upgraded, seed, initial), upgraded);
  assert.doesNotThrow(() => validateProject(upgraded, seed));
  const forged = withoutGame(initial);
  forged.pages[0].html = forged.pages[0].html.replace('data-motion-toggle=""', 'data-motion-toggle="" data-contact-form=""');
  assert.throws(() => normalizeStoredProject(forged, seed, initial), /koppling|funktion|attribut/);
});

test('legacy navigation migration rejects excessive nesting with a bounded validation error', () => {
  const legacy = withoutGame(initial);
  legacy.pages[0].html += '<div>'.repeat(8000) + '</div>'.repeat(8000);
  assert.throws(() => normalizeStoredProject(legacy, seed, initial), { status: 422, message: /för många eller för djupt nästlade/ });
});

test('partial navigation upgrades retain owner labels and reject forged identities in both menus', () => {
  for (const marker of ['data-skift-link', 'data-skift-mobile-link']) {
    const project = structuredClone(initial);
    const anchor = new RegExp(`<a\\b[^>]*${marker}=""[^>]*>[\\s\\S]*?</a>`);
    project.pages[0].html = project.pages[0].html.replace(anchor, '').replaceAll('Starta ditt arbetsskift', 'Ägarens spellänk');
    const normalized = normalizeStoredProject(project, seed, initial);
    assert.match(normalized.pages[0].html, new RegExp(marker));
    assert.match(normalized.pages[0].html, /Ägarens spellänk/);
    assert.doesNotThrow(() => validateProject(normalized, seed));
    const forged = structuredClone(initial);
    forged.pages[0].html = forged.pages[0].html.replace(anchor, match => match.replace(/data-cms-node="[^"]+"/, 'data-cms-node="forged-nav"'));
    assert.throws(() => validateProject(forged, seed), /koppling|funktion|attribut/);
  }
});

test('adding SKIFT navigation preserves a custom shared footer from a pre-shared-content backup', () => {
  const legacy = withoutGame(initial);
  const custom = 'Ägarens egen sidfot.';
  for (const page of legacy.pages) page.html = page.html.replace(/(<p\b[^>]*data-cms-shared="footer.tagline"[^>]*>)[\s\S]*?(<\/p>)/, '$1' + custom + '$2');
  delete legacy.sharedContent;
  const upgraded = normalizeStoredProject(legacy, seed, initial);
  assert.equal(upgraded.sharedContent['footer.tagline'], custom);
  assert.ok(!upgraded.sharedContentConflicts);
  assert.ok(!upgraded.pages.some(page => page.id === 'skift'), 'A14: no game page inherits the footer');
  assert.doesNotThrow(() => validateProject(upgraded, seed));
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

test('old D1 publication serves the built game and real assets; game texts survive save and restore', async () => {
  const legacy = withoutGame(initial);
  await publishSite(runtime.db, { project: legacy, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
  const publicHome = await runtime.mf.dispatchFetch(runtime.url + '/');
  assert.match(await publicHome.text(), /data-skift-link/);
  const build = await readFile('dist/play/skift/index.html', 'utf8');
  const game = await runtime.mf.dispatchFetch(runtime.url + '/play/skift/');
  assert.equal(game.status, 200);
  assert.equal(game.headers.get('x-cms-version'), null, 'A14: the game is served from the build');
  assert.equal(await game.text(), build);
  assert.match(game.headers.get('content-security-policy'), /media-src 'self' blob:/);
  assert.doesNotMatch(publicHome.headers.get('content-security-policy'), /media-src/);
  const gameHash = createHash('sha256').update(await readFile('dist/play/skift/assets/app.js')).digest('hex').slice(0, 12);
  for (const [path, type] of [[`assets/app.js?v=${gameHash}`, /javascript/], ['audio/shift.mp3', /audio\/mpeg/], ['audio/dash.wav', /audio\/wav|audio\/x-wav/]]) {
    const response = await runtime.mf.dispatchFetch(runtime.url + '/play/skift/' + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), type);
    assert.equal(response.headers.get('cache-control'), path.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400');
  }
  const state = await (await admin('state')).json();
  assert.equal(typeof state.project.runtime['runtime.skift.sv.intro'], 'string', 'New landing texts must be editable before the first migrated Save');
  assert.equal((await readSite(runtime.db)).project.pages.length, legacy.pages.length, 'Read must not publish');
  assert.ok(!state.project.pages.some(page => page.id === 'skift'), 'A14: the studio does not list the game page');
  state.project.runtime['runtime.skift.sv.intro'] = 'CMS-intro för skiftet.';
  const draft = new Draft((await (await admin('state')).json()).project, state.version);
  draft.change(state.project);
  const save = await admin('save', draft.beginSave());
  assert.equal(save.status, 200, await save.clone().text());
  assert.equal((await (await runtime.mf.dispatchFetch(runtime.url + '/data/runtime.json')).json())['runtime.skift.sv.intro'], 'CMS-intro för skiftet.');
  const live = await runtime.mf.dispatchFetch(runtime.url + '/play/skift/');
  assert.equal(live.headers.get('x-cms-version'), null, 'A14: Save never moves the game into D1');
  assert.equal(await live.text(), build);
  assert.ok(!(await readSite(runtime.db)).project.pages.some(page => page.id === 'skift'));
  assert.equal((await checkCompatibility(runtime.db, { seed, initial })).compatible, true);
  const reload = await (await admin('state')).json();
  assert.equal(reload.project.runtime['runtime.skift.sv.intro'], 'CMS-intro för skiftet.');
  const historical = await (await admin('revision/1')).json();
  const restored = await admin('save', { project: historical.project, baseVersion: reload.version, requestId: crypto.randomUUID() });
  assert.equal(restored.status, 200, await restored.clone().text());
  assert.ok(!(await (await admin('state')).json()).project.pages.some(page => page.id === 'skift'));
});
