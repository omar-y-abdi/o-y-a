import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { routes } from '../src/content/site.mjs';
import { preparePage } from '../src/cms/validation.mjs';
import { validateProject, defaultTheme, themeCss } from '../src/cms/project.mjs';

const pages = await Promise.all(routes.map(async page => ({ ...page, id: page.template, ...preparePage(await readFile(page.noindex ? 'dist/404.html' : `dist${page.path}index.html`, 'utf8')), css: '', project: null })));
const seed = { schemaVersion: 1, pages, cards: JSON.parse(await readFile('public/data/cards.json', 'utf8')), runtime: {}, theme: defaultTheme };

test('every existing source page and win card form a valid initial CMS project', () => {
  const result = validateProject(structuredClone(seed), seed);
  assert.equal(result.pages.length, routes.length);
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
