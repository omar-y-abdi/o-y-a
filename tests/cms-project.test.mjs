import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { routes } from '../src/content/site.mjs';
import { preparePage } from '../src/cms/validation.mjs';
import { validateProject, defaultTheme, themeCss } from '../src/cms/project.mjs';
import { normalizeStoredProject } from '../src/cms/shared-content.mjs';
import { initial, seed as generatedSeed } from '../.generated/cms-seed.mjs';

const pages = await Promise.all(routes.map(async page => ({ ...page, id: page.template, ...preparePage(await readFile(page.noindex ? 'dist/404.html' : `dist${page.path}index.html`, 'utf8')), css: '', project: null })));
const staticPaths = (await readdir('dist', { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => '/' + `${entry.parentPath}/${entry.name}`.replace(/^dist\//, ''));
const seed = { schemaVersion: 1, pages, cards: JSON.parse(await readFile('public/data/cards.json', 'utf8')), runtime: {}, theme: defaultTheme, staticPaths };

test('every existing source page and win card form a valid initial CMS project', () => {
  const result = validateProject(structuredClone(seed), seed);
  // A14: the code-owned SKIFT route is served from the build, not the CMS.
  assert.equal(result.pages.length, routes.filter(page => page.path !== '/play/skift/').length);
  assert.equal(result.cards.length, seed.cards.length);
});

test('new pages publish alongside existing pages with editable metadata', () => {
  const project = structuredClone(seed);
  project.pages.push({ id: 'new-page', path: '/ny-sida/', name: 'Ny sida', title: 'Ny sida | Omar Yusuf', description: 'En ny plats för tankar och projekt.', template: 'custom', bodyClass: 'page-custom', html: '<main id="main"><h1>Nya saker</h1><p>Hej världen.</p></main>', css: 'h1{color:#234ce7}', project: null });
  assert.equal(validateProject(project, seed).pages.at(-1).path, '/ny-sida/');
});

test('duplicate routes, missing home, lost h1, unsafe metadata and broken references are rejected', () => {
  for (const mutate of [p => p.pages.push({ ...p.pages[0], id: 'duplicate' }), p => p.pages.shift(), p => p.pages[0].html = p.pages[0].html.replace(/<h1\b/g, '<h2').replaceAll('</h1>', '</h2>'), p => p.pages[0].title = '', p => p.pages[0].html = p.pages[0].html.replace('href="#byggen"', 'href="#missing-section"')]) {
    const project = structuredClone(seed); mutate(project);
    assert.throws(() => validateProject(project, seed));
  }
});

test('win IDs remain unique, every visible category remains usable, and card designs cannot execute code', () => {
  for (const mutate of [p => p.cards.push(p.cards[0]), p => p.cards = p.cards.filter(card => card.flavor !== 'kind'), p => p.cards[0].text = '', p => p.cards[0].design = { html: '<script>bad()</script>', css: '', project: null }]) {
    const project = structuredClone(seed); mutate(project);
    assert.throws(() => validateProject(project, seed));
  }
});

test('global theme accepts known colors and fonts and rejects CSS injection', () => {
  assert.match(themeCss(defaultTheme), /--butter:#fff0b3/);
  const project = structuredClone(seed);
  project.theme.fontFamily = 'Arial; background:url(https://evil.test)';
  assert.throws(() => validateProject(project, seed));
});

test('win lifecycle defaults legacy cards to active and requires an active card in every flavor', () => {
  const normalized=validateProject(structuredClone(seed),seed);
  assert.ok(normalized.cards.every(card=>card.state==='active'));
  const project=structuredClone(seed);
  for(const card of project.cards)if(card.flavor==='kind')card.state='archived';
  assert.throws(()=>validateProject(project,seed),/kategori/i);
});

test('trusted shared footer defaults and publication rejects divergent or missing linked instances', () => {
  const sharedSeed={...seed,sharedContent:{'footer.tagline':'Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.'}};
  const project=structuredClone(sharedSeed);
  const normalized=validateProject(project,sharedSeed);
  assert.equal(normalized.sharedContent['footer.tagline'],sharedSeed.sharedContent['footer.tagline']);
  const divergent=structuredClone(normalized);
  divergent.pages[0].html=divergent.pages[0].html.replace('Lite hjärna. Lite hjärta.','Annan text.');
  assert.throws(()=>validateProject(divergent,sharedSeed),/gemensam/i);
  const unlinked=structuredClone(normalized);
  unlinked.pages[0].html=unlinked.pages[0].html.replace(' data-cms-shared="footer.tagline"','');
  assert.throws(()=>validateProject(unlinked,sharedSeed),/gemensam/i);
});

test('trusted source pages mark the footer tagline as one shared slot', () => {
  for(const page of pages) assert.match(page.html,/data-cms-shared="footer.tagline"/);
});

test('required shared slot is enforced once per page rather than by global count',()=>{
  const sharedSeed={...seed,sharedContent:{'footer.tagline':'Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.'}};
  const project=validateProject(structuredClone(sharedSeed),sharedSeed);
  const broken=structuredClone(project);
  const marker=' data-cms-shared="footer.tagline"';
  broken.pages[1].html=broken.pages[1].html.replace(marker,'');
  const duplicate=broken.pages[0].html.match(/<p[^>]*data-cms-shared="footer.tagline"[^>]*>[\s\S]*?<\/p>/)[0].replaceAll(/\sdata-cms-node="[^"]+"/g,'');
  broken.pages[0].html=broken.pages[0].html.replace('</footer>',duplicate+'</footer>');
  assert.throws(()=>validateProject(broken,sharedSeed),/alla sidor/i);
});

test('A7: a rejected page names itself, and a message that already holds the path is left alone', () => {
  const project = structuredClone(seed);
  const page = project.pages.find(item => item.path === '/om/');
  page.name = 'Människan';
  page.html = page.html.replace('</main>', '<a href="javascript:alert(1)">x</a></main>');
  assert.throws(() => validateProject(project, seed), error => error.status === 422 && error.message === 'Människan: Länken har en otillåten adress.');
  page.name = '';
  assert.throws(() => validateProject(project, seed), error => error.status === 422 && error.message === '/om/: Länken har en otillåten adress.');
  const duplicate = structuredClone(seed);
  duplicate.pages.push({ ...duplicate.pages[0], id: 'duplicate', name: 'Kopia' });
  assert.throws(() => validateProject(duplicate, seed), error => error.status === 422 && error.message === `Adressen ${duplicate.pages[0].path} används redan.`);
});

test('A9: a page title of 160 characters validates and 161 is rejected', () => {
  const project = structuredClone(seed);
  project.pages[0].title = 'a'.repeat(160);
  assert.doesNotThrow(() => validateProject(structuredClone(project), seed));
  project.pages[0].title = 'a'.repeat(161);
  assert.throws(() => validateProject(project, seed), error => error.status === 422 && /Sidtitel saknas eller har ogiltig längd/.test(error.message));
});

test('A3: deleting a page that others link to gives one 422 naming every linking page', async () => {
  const stored = normalizeStoredProject(JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8')), generatedSeed, initial);
  const project = structuredClone(stored);
  project.pages = project.pages.filter(page => page.path !== '/integritet/');
  const linking = project.pages.filter(page => page.html.includes('href="/integritet/"')).map(page => page.path);
  assert.ok(linking.length >= 10, 'The legal page is linked from most pages');
  assert.throws(() => validateProject(project, generatedSeed), error => error.status === 422 && linking.every(path => error.message.includes(` på ${path} går till en sida som saknas`)));
});
