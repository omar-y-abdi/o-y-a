import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyInitial as initial, seed as frameSeed } from '../.generated/cms-seed.mjs';
const seed = frameSeed.legacy;
import { validateProject } from '../src/cms/project.mjs';
import { normalizeStoredProject } from '../src/cms/legacy-project.mjs';

// Retained schema-1 contract, used by reverse migration and legacy restores.
// The plan row names cases A-F without listing them; these are derived from its "Verifierat" list and
// "fall B och D sparar 200": A baseline, B tagline change + new page, C two-tab merge, D tagline change
// alone, E tagline node removed or duplicated, F unknown shared key. Schema-2
// composition and studio flows are covered by cms-frame and cms-review-browser.
const KEY = 'footer.tagline';
const TAGLINE = new RegExp(`(<p\\b[^>]*data-cms-shared="${KEY.replace('.', '\\.')}"[^>]*>)[\\s\\S]*?(</p>)`, 'g');
const withTagline = (html, value) => html.replace(TAGLINE, (_all, open, close) => open + value + close);
const retag = (project, value) => ({ ...project, sharedContent: { ...project.sharedContent, [KEY]: value }, pages: project.pages.map(page => ({ ...page, html: withTagline(page.html, value) })) });
const newPage = (html = seed.blank.html) => ({ ...structuredClone(seed.blank), id: 'ny-sida-id', path: '/ny-sida/', sourceId: seed.blank.id, name: 'Ny sida', title: 'Ny sida | Omar Yusuf', description: 'Tankar om en ny sida.', noindex: false, html });
const withoutContracts = page => { const { contracts: _contracts, ...rest } = page; return rest; };

test('A: the untouched project validates and carries the tagline once per page', () => {
  const project = validateProject(structuredClone(initial), frameSeed);
  assert.ok(project.pages.length > 1);
  for (const page of project.pages) assert.equal(page.html.split(`data-cms-shared="${KEY}"`).length - 1, 1, page.path);
});

test('B: a changed tagline plus a new page from the old template is 422 until the value is re-applied to every page', () => {
  const changed = retag(structuredClone(initial), 'Ny rad.');
  const created = { ...changed, pages: [...changed.pages, withoutContracts(newPage())] };
  assert.throws(() => validateProject(structuredClone(created), frameSeed), { status: 422, message: /skiljer sig mellan sidor/ });
  const reapplied = retag(created, 'Ny rad.');
  assert.equal(validateProject(reapplied, frameSeed).sharedContent[KEY], 'Ny rad.');
});

test('C: a merged project whose pages carry two taglines is 422 until the merged value is re-applied', () => {
  const merged = retag(structuredClone(initial), 'Min rad.');
  merged.pages[1] = { ...merged.pages[1], html: withTagline(merged.pages[1].html, 'Deras rad.') };
  assert.throws(() => validateProject(structuredClone(merged), frameSeed), { status: 422, message: /skiljer sig mellan sidor/ });
  assert.equal(validateProject(retag(merged, 'Min rad.'), frameSeed).sharedContent[KEY], 'Min rad.');
});

test('D: a tagline change on every page saves', () => {
  const project = validateProject(retag(structuredClone(initial), 'Bara en ny rad.'), frameSeed);
  assert.ok(project.pages.every(page => page.html.includes('Bara en ny rad.')));
});

test('E: a page that loses the tagline node, or duplicates it, is 422', () => {
  const lost = structuredClone(initial);
  lost.pages[0] = { ...lost.pages[0], html: lost.pages[0].html.replace(` data-cms-shared="${KEY}"`, '') };
  assert.throws(() => validateProject(lost, frameSeed), { status: 422, message: /exakt en gång/ });
  const doubled = structuredClone(initial);
  doubled.pages[0] = { ...doubled.pages[0], html: doubled.pages[0].html.replace(TAGLINE, (all) => all + all) };
  assert.throws(() => validateProject(doubled, frameSeed), { status: 422 });
});

test('F: a page that names an unknown shared key is 422 and a stored project without the key is normalized from its pages', () => {
  const unknown = structuredClone(initial);
  unknown.pages[0] = { ...unknown.pages[0], html: unknown.pages[0].html.replace(`data-cms-shared="${KEY}"`, 'data-cms-shared="footer.other"') };
  assert.throws(() => validateProject(unknown, frameSeed), { status: 422, message: /okänd gemensam innehållsplats/ });
  const stored = structuredClone(initial);
  delete stored.sharedContent;
  assert.equal(normalizeStoredProject(stored, seed, initial).sharedContent[KEY], initial.sharedContent[KEY]);
});
