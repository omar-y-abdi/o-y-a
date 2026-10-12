import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('SKIFT supports ordinary CMS metadata and styles while protecting runtime DOM', () => {
  const project = structuredClone(initial);
  const game = project.pages.find(page => page.path === '/play/skift/');
  assert.ok(game, 'Game must appear in the CMS page register');
  game.name = 'Mitt skift'; game.title = 'Mitt skift | Omar Yusuf';
  game.description = 'En egen beskrivning från CMS.';
  game.css = '.hero-copy h1{color:#123456}';
  const saved = validateProject(project, seed).pages.find(page => page.id === 'skift');
  assert.equal(saved.title, game.title); assert.equal(saved.css, game.css);
  const redirected = structuredClone(project);
  redirected.pages[0].html = redirected.pages[0].html.replace(/(<a class="shift-link" href=")\/play\/skift\//, '$1/om/');
  assert.throws(() => validateProject(redirected, seed), /skyddat/);
  game.html = game.html.replace('id="world"', 'id="broken-world"');
  assert.throws(() => validateProject(project, seed), /skyddat|funktion/);
});

test('old CMS state gains the game and navigation without changing owner content or identities', () => {
  const legacy = withoutGame(initial);
  legacy.pages[0].description = 'Ägarens beskrivning';
  legacy.pages[0].css = '[data-cms-node="n0"]{color:#123456}';
  const untouched = structuredClone(legacy);
  const upgraded = normalizeStoredProject(legacy, seed, initial);
  assert.ok(upgraded.pages.some(page => page.path === '/play/skift/'));
  assert.match(upgraded.pages[0].html, /data-skift-link/);
  assert.equal(upgraded.pages[0].description, 'Ägarens beskrivning');
  assert.equal(upgraded.pages[0].css, untouched.pages[0].css);
  assert.deepEqual(legacy, untouched);
  assert.deepEqual(normalizeStoredProject(upgraded, seed, initial), upgraded);
  assert.doesNotThrow(() => validateProject(upgraded, seed));
  const forged = withoutGame(initial);
  forged.pages[0].html = forged.pages[0].html.replace('data-motion-toggle=""', 'data-motion-toggle="" data-contact-form=""');
  assert.throws(() => normalizeStoredProject(forged, seed, initial), /koppling|funktion|attribut/);
});

test('adding SKIFT preserves a custom shared footer from a pre-shared-content backup', () => {
  const legacy = withoutGame(initial);
  const custom = 'Ägarens egen sidfot.';
  for (const page of legacy.pages) page.html = page.html.replace(/(<p\b[^>]*data-cms-shared="footer.tagline"[^>]*>)[\s\S]*?(<\/p>)/, '$1' + custom + '$2');
  delete legacy.sharedContent;
  const upgraded = normalizeStoredProject(legacy, seed, initial);
  assert.equal(upgraded.sharedContent['footer.tagline'], custom);
  assert.ok(!upgraded.sharedContentConflicts);
  assert.match(upgraded.pages.find(page => page.id === 'skift').html, /Ägarens egen sidfot/);
  assert.doesNotThrow(() => validateProject(upgraded, seed));
});

test('new game HTML is revalidated after inheriting an owner footer that collides with game IDs', () => {
  const legacy = withoutGame(initial);
  const footer = '<span id="world">Ägarens sidfot.</span>';
  legacy.sharedContent['footer.tagline'] = footer;
  for (const page of legacy.pages) {
    delete page.facts;
    page.html = page.html.replace(/(<p\b[^>]*data-cms-shared="footer.tagline"[^>]*>)[\s\S]*?(<\/p>)/, '$1' + footer + '$2');
  }
  const upgraded = normalizeStoredProject(legacy, seed, initial);
  assert.throws(() => validateProject(upgraded, seed, upgraded), /ID:t world används flera gånger/);
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

test('old D1 publication serves the game and real assets; CMS edits survive save and restore', async () => {
  const legacy = withoutGame(initial);
  await publishSite(runtime.db, { project: legacy, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
  const publicHome = await runtime.mf.dispatchFetch(runtime.url + '/');
  assert.match(await publicHome.text(), /data-skift-link/);
  const game = await runtime.mf.dispatchFetch(runtime.url + '/play/skift/');
  assert.equal(game.status, 200);
  assert.match(await game.text(), /id="world"/);
  assert.match(game.headers.get('content-security-policy'), /media-src 'self' blob:/);
  assert.doesNotMatch(publicHome.headers.get('content-security-policy'), /media-src/);
  for (const [path, type] of [['assets/app.js', /javascript/], ['audio/shift.mp3', /audio\/mpeg/], ['audio/dash.wav', /audio\/wav|audio\/x-wav/]]) {
    const response = await runtime.mf.dispatchFetch(runtime.url + '/play/skift/' + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), type);
    assert.doesNotMatch(response.headers.get('cache-control') ?? '', /immutable/);
  }
  const state = await (await admin('state')).json();
  assert.equal(typeof state.project.runtime['runtime.skift.sv.intro'], 'string', 'New landing texts must be editable before the first migrated Save');
  assert.equal((await readSite(runtime.db)).project.pages.length, legacy.pages.length, 'Read must not publish');
  const page = state.project.pages.find(page => page.id === 'skift');
  assert.ok(page); page.title = 'CMS-skift | Omar Yusuf'; page.css = '.hero-copy h1{color:#123456}';
  const preview = await admin('preview', { project: state.project, pageId: 'skift' });
  assert.equal(preview.status, 200, await preview.clone().text());
  assert.match((await preview.json()).html, /CMS-skift/);
  const draft = new Draft((await (await admin('state')).json()).project, state.version);
  draft.change(state.project);
  const save = await admin('save', draft.beginSave());
  assert.equal(save.status, 200, await save.clone().text());
  const live = await runtime.mf.dispatchFetch(runtime.url + '/play/skift/');
  assert.match(await live.text(), /CMS-skift/);
  assert.equal((await checkCompatibility(runtime.db, { seed, initial })).compatible, true);
  const reload = await (await admin('state')).json();
  assert.equal(reload.project.pages.find(page => page.id === 'skift').css, '.hero-copy h1{color:#123456}');
  const historical = await (await admin('revision/1')).json();
  const restored = await admin('save', { project: historical.project, baseVersion: reload.version, requestId: crypto.randomUUID() });
  assert.equal(restored.status, 200, await restored.clone().text());
  assert.ok((await (await admin('state')).json()).project.pages.some(page => page.id === 'skift'));
});
