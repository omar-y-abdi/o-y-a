import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { normalizeStoredProject } from '../src/cms/shared-content.mjs';

// A3 phase 0, server contract behind the client's reapplySharedContentClient (app.mjs `reapplyShared`).
// The plan row names cases A-F without listing them; these are derived from its "Verifierat" list and
// "fall B och D sparar 200": A baseline, B tagline change + new page, C two-tab merge, D tagline change
// alone, E tagline node removed or duplicated, F unknown shared key. The client half (the DOM function) runs
// in tests/cms-review-browser.py. "Delete a page names every page" belongs to project.mjs:79 (group G3).
const KEY = 'footer.tagline';
const TAGLINE = new RegExp(`(<p\\b[^>]*data-cms-shared="${KEY.replace('.', '\\.')}"[^>]*>)[\\s\\S]*?(</p>)`, 'g');
const withTagline = (html, value) => html.replace(TAGLINE, (_all, open, close) => open + value + close);
const retag = (project, value) => ({ ...project, sharedContent: { ...project.sharedContent, [KEY]: value }, pages: project.pages.map(page => ({ ...page, html: withTagline(page.html, value) })) });
const newPage = (html = seed.blank.html) => ({ ...structuredClone(seed.blank), id: 'ny-sida-id', path: '/ny-sida/', sourceId: seed.blank.id, name: 'Ny sida', title: 'Ny sida | Omar Yusuf', description: 'Tankar om en ny sida.', noindex: false, html });
const withoutContracts = page => { const { contracts: _contracts, ...rest } = page; return rest; };

test('A: the untouched project validates and carries the tagline once per page', () => {
  const project = validateProject(structuredClone(initial), seed);
  assert.ok(project.pages.length > 1);
  for (const page of project.pages) assert.equal(page.html.split(`data-cms-shared="${KEY}"`).length - 1, 1, page.path);
});

test('B: a changed tagline plus a new page from the old template is 422 until the value is re-applied to every page', () => {
  const changed = retag(structuredClone(initial), 'Ny rad.');
  const created = { ...changed, pages: [...changed.pages, withoutContracts(newPage())] };
  assert.throws(() => validateProject(structuredClone(created), seed), { status: 422, message: /skiljer sig mellan sidor/ });
  const reapplied = retag(created, 'Ny rad.');
  assert.equal(validateProject(reapplied, seed).sharedContent[KEY], 'Ny rad.');
});

test('C: a merged project whose pages carry two taglines is 422 until the merged value is re-applied', () => {
  const merged = retag(structuredClone(initial), 'Min rad.');
  merged.pages[1] = { ...merged.pages[1], html: withTagline(merged.pages[1].html, 'Deras rad.') };
  assert.throws(() => validateProject(structuredClone(merged), seed), { status: 422, message: /skiljer sig mellan sidor/ });
  assert.equal(validateProject(retag(merged, 'Min rad.'), seed).sharedContent[KEY], 'Min rad.');
});

test('D: a tagline change on every page saves', () => {
  const project = validateProject(retag(structuredClone(initial), 'Bara en ny rad.'), seed);
  assert.ok(project.pages.every(page => page.html.includes('Bara en ny rad.')));
});

test('E: a page that loses the tagline node, or duplicates it, is 422', () => {
  const lost = structuredClone(initial);
  lost.pages[0] = { ...lost.pages[0], html: lost.pages[0].html.replace(` data-cms-shared="${KEY}"`, '') };
  assert.throws(() => validateProject(lost, seed), { status: 422, message: /exakt en gång/ });
  const doubled = structuredClone(initial);
  doubled.pages[0] = { ...doubled.pages[0], html: doubled.pages[0].html.replace(TAGLINE, (all) => all + all) };
  assert.throws(() => validateProject(doubled, seed), { status: 422 });
});

test('F: a page that names an unknown shared key is 422 and a stored project without the key is normalized from its pages', () => {
  const unknown = structuredClone(initial);
  unknown.pages[0] = { ...unknown.pages[0], html: unknown.pages[0].html.replace(`data-cms-shared="${KEY}"`, 'data-cms-shared="footer.other"') };
  assert.throws(() => validateProject(unknown, seed), { status: 422, message: /okänd gemensam innehållsplats/ });
  const stored = structuredClone(initial);
  delete stored.sharedContent;
  assert.equal(normalizeStoredProject(stored, seed, initial).sharedContent[KEY], initial.sharedContent[KEY]);
});
