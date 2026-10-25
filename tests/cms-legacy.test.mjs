import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync } from 'node:zlib';
import { readSite } from '../src/cms/store.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';

test('C1: v1-v3 editor metadata is discarded on read without changing the stored revision or HTML/CSS', async () => {
  for (const version of [1, 2, 3]) {
    const original = structuredClone(initial);
    original.pages[0].project = { pages: { obsolete: true } };
    const bytes = gzipSync(JSON.stringify(original));
    const db = { prepare: () => ({ bind() { return this; }, first: async () => ({ version, project: bytes }) }) };
    const state = await readSite(db, version);
    assert.equal(state.project.pages[0].project, null);
    assert.equal(state.project.pages[0].html, original.pages[0].html);
    assert.equal(state.project.pages[0].css, original.pages[0].css);
    assert.doesNotThrow(() => validateProject(state.project, seed));
    assert.deepEqual(JSON.parse(gunzipSync(bytes)), original);
  }
});

test('C1: unused editor JSON is never validated, persisted or a source of content', () => {
  const project = structuredClone(initial);
  project.pages[0].project = { pages: { obsolete: true }, script: 'not content' };
  project.cards[0].design = { html: '<div data-card-text>Vinst</div>', css: '', project: { components: false } };
  const result = validateProject(project, seed);
  assert.equal(result.pages[0].project, null);
  assert.equal(result.pages[0].html, initial.pages[0].html);
  assert.equal(result.cards[0].design.project, null);
  assert.equal(result.cards[0].design.html, '<div data-card-text="">Vinst</div>');
});
