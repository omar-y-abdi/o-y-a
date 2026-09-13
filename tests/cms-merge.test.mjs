import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProjects } from '../src/cms/client/merge.mjs';
const base = () => ({ schemaVersion: 1, pages: [{ id: 'home', html: 'old', css: 'old', project: { old: true } }, { id: 'about', html: 'about' }], cards: [{ id: 'win', text: 'old' }], theme: { blue: '#123456', fontFamily: 'Arial' }, runtime: { hello: 'Hej' } });

test('disjoint tab changes merge without losing either page, card or setting', () => {
  const before = base(), mine = base(), theirs = base();
  mine.pages[0] = { id: 'home', html: 'mine', css: 'mine', project: { mine: true } };
  mine.cards.push({ id: 'new', text: 'New' });
  theirs.pages[1].html = 'theirs'; theirs.theme.blue = '#abcdef';
  const result = mergeProjects(before, mine, theirs);
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual(result.project.pages, [mine.pages[0], theirs.pages[1]]);
  assert.equal(result.project.cards.at(-1).text, 'New');
  assert.equal(result.project.theme.blue, '#abcdef');
});

test('same-page edits and delete-versus-edit conflicts are explicit, never mixed into a corrupt page', () => {
  const before = base(), mine = base(), theirs = base();
  mine.pages[0].html = 'mine'; theirs.pages[0].css = 'theirs';
  mine.cards = []; theirs.cards[0].text = 'theirs';
  const result = mergeProjects(before, mine, theirs);
  assert.deepEqual(result.conflicts, ['pages:home', 'cards:win']);
  assert.deepEqual(result.project.pages[0], mine.pages[0]);
  assert.deepEqual(result.project.cards, []);
});

test('identical edits and non-overlapping deletions need no conflict confirmation', () => {
  const before = base(), mine = base(), theirs = base();
  mine.pages.pop(); mine.runtime.hello = 'Hallå'; theirs.runtime.hello = 'Hallå';
  const result = mergeProjects(before, mine, theirs);
  assert.deepEqual(result.conflicts, []);
  assert.equal(result.project.pages.length, 1);
});
