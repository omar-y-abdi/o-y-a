import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Draft } from '../src/cms/client/draft.mjs';
import { applyProjectChanges } from '../src/cms/project-changes.mjs';

test('a save response acknowledges its exact snapshot without erasing edits made during the request', () => {
  const original = { schemaVersion: 1, pages: [{ id: 'home', path: '/', title: 'Original', html: '<main><h1>Original</h1></main>', css: '' }], cards: [], runtime: {}, theme: {}, resources: {}, sharedContent: {} };
  const sent = structuredClone(original), newer = structuredClone(original);
  sent.pages[0].title = 'Sent'; newer.pages[0].title = 'Newer';
  const draft = new Draft(original, 0);
  draft.change(sent); const pending = draft.beginSave(), submittedSnapshot = draft.pendingSnapshot;
  draft.change(newer); draft.acknowledge(submittedSnapshot, 1, pending);
  assert.equal(draft.project, newer);
  assert.deepEqual(draft.saved, sent);
  assert.equal(draft.dirty, true);
  assert.equal(draft.pendingSave, null);
  assert.equal(draft.undo(), true);
  assert.deepEqual(draft.project, sent);
  assert.equal(draft.dirty, false);
  assert.equal(draft.redo(), true);
  assert.equal(draft.project, newer);
});

test('grouped typing undoes as one edit while a new edit invalidates the redo branch', () => {
  const draft = new Draft({ text: '' }, 3);
  draft.change({ text: 'H' }, 'text');
  draft.change({ text: 'Hej' }, 'text');
  draft.undo(); assert.equal(draft.project.text, '');
  draft.change({ text: 'Nytt' }, 'text');
  assert.equal(draft.redo(), false);
  assert.equal(draft.project.text, 'Nytt');
});

test('beginSave captures changed page as a compact intent without the full saved project', () => {
  const saved = {
    schemaVersion: 1,
    pages: [{ id: 'home', path: '/', title: 'Start', html: '<main><h1>Start</h1></main>', css: '', facts: { validationKey: 'server-only', ids: ['main'], links: [] } }],
    cards: [], runtime: {}, theme: {}, resources: {}, sharedContent: {},
  };
  const draft = new Draft(saved, 12);
  const changed = structuredClone(saved);
  changed.pages[0].html = '<main><h1>Updated</h1></main>';
  draft.change(changed);
  const pending = draft.beginSave();
  assert.equal(pending.project, undefined, 'pending request must not serialize the full project');
  assert.equal(pending.baseVersion, 12);
  assert.match(pending.requestId, /^[0-9a-f-]{36}$/);
  assert.deepEqual(pending.changes.pages.upsert.map(page => page.id), ['home']);
  assert.equal(pending.changes.pages.upsert[0].html, changed.pages[0].html);
  assert.equal(pending.changes.pages.upsert[0].facts, undefined, 'server-owned facts are excluded from the wire intent');
  const newer = structuredClone(changed); newer.pages[0].title = 'Changed while pending';
  draft.change(newer);
  assert.equal(draft.beginSave(), pending, 'unknown outcome reuses the exact request while newer edits stay local');
  draft.acknowledge(draft.pendingSnapshot, 13, pending);
  assert.deepEqual(draft.saved, changed);
  assert.equal(draft.project, newer);
  assert.equal(draft.dirty, true);
  const followup = draft.beginSave();
  assert.notEqual(followup.requestId, pending.requestId);
  assert.deepEqual(followup.changes.pages.upsert.map(page => page.id), ['home']);
  assert.equal(followup.changes.pages.upsert[0].title, newer.pages[0].title);
});

test('version-zero bootstrap uses an immutable full snapshot and reuses it for retry', () => {
  const saved = { schemaVersion: 1, pages: [{ id: 'home', path: '/', title: 'Start', html: '<main><h1>Start</h1></main>', css: '' }], cards: [], runtime: {}, theme: {}, resources: {}, sharedContent: {} };
  const draft = new Draft(saved, 0), submitted = structuredClone(saved);
  submitted.pages[0].title = 'First publication';
  draft.change(submitted);
  const pending = draft.beginSave();
  const exactPayload = JSON.stringify(pending);
  assert.deepEqual(pending.project, submitted, 'the mutable version-zero base is pinned by a complete submitted project');
  assert.equal(pending.changes, undefined);

  const newer = structuredClone(submitted); newer.pages[0].description = 'Later edit';
  draft.change(newer);
  assert.equal(draft.beginSave(), pending, 'an unknown bootstrap outcome retries the same full payload and ID');
  assert.equal(JSON.stringify(pending), exactPayload);
  assert.deepEqual(pending.project, submitted);
});

test('late acknowledgement rebases an in-flight history restore on its owner only', () => {
  const base = { schemaVersion: 1, pages: [{ id: 'home', path: '/', title: 'Base', html: '<main><h1>Base</h1></main>', css: '' }], cards: [], runtime: {}, theme: {}, resources: {}, sharedContent: {} };
  const owner = new Draft(base, 4), submitted = structuredClone(base), restored = structuredClone(base);
  submitted.pages[0].title = 'Submitted'; restored.pages[0].title = 'Historical';
  owner.change(submitted);
  const pending = owner.beginSave(), submittedSnapshot = owner.pendingSnapshot;
  owner.change(restored);
  owner.restorePending(null);
  owner.acknowledge(submittedSnapshot, 5, pending);
  assert.equal(owner.project, restored, 'late acknowledgement leaves history restore draft intact');
  assert.deepEqual(owner.saved, submitted);
  assert.equal(owner.version, 5);
  assert.equal(owner.dirty, true);

  const replacedOwner = new Draft(base, 8), replacementSave = structuredClone(base);
  replacementSave.pages[0].title = 'Late response';
  replacedOwner.change(replacementSave);
  const replacementPending = replacedOwner.beginSave();
  const active = new Draft(restored, 12);
  replacedOwner.acknowledge(replacementSave, 9, replacementPending);
  assert.equal(active.project, restored);
  assert.equal(active.version, 12, 'acknowledging a replaced owner cannot alter the active Draft');
});

test('an in-flight save keeps an immutable submitted snapshot when draft objects mutate in place', () => {
  const base = { schemaVersion: 1, pages: [{ id: 'home', path: '/', title: 'Base', html: '<main><h1>Base</h1></main>', css: '' }], cards: [], runtime: {}, theme: {}, resources: {}, sharedContent: {} };
  const draft = new Draft(base, 2), edited = structuredClone(base);
  edited.pages[0].title = 'Submitted';
  draft.change(edited);
  const pending = draft.beginSave();
  const submitted = structuredClone(draft.pendingSnapshot);
  const exactWire = JSON.stringify(pending);

  edited.pages[0].title = 'Edited in place while pending';
  assert.equal(JSON.stringify(pending), exactWire, 'the replay payload is immutable after dispatch');
  assert.deepEqual(draft.pendingSnapshot, submitted, 'acknowledgement snapshot is independent of mutable draft objects');
  draft.acknowledge(draft.pendingSnapshot, 3, pending);

  assert.deepEqual(draft.saved, submitted);
  assert.equal(draft.project.pages[0].title, 'Edited in place while pending');
  assert.equal(draft.dirty, true, 'in-place edits made after dispatch remain unsaved');
});

test('recovered pending intent replays exactly and acknowledges only its captured snapshot', () => {
  const base = { schemaVersion: 1, pages: [{ id: 'home', path: '/', title: 'Base', html: '<main><h1>Base</h1></main>', css: '' }], cards: [], runtime: {}, theme: {}, resources: {}, sharedContent: {} };
  const sent = structuredClone(base); sent.pages[0].title = 'Pending';
  const source = new Draft(base, 6); source.change(sent);
  const pending = source.beginSave();
  const later = structuredClone(sent); later.pages[0].description = 'Newer local edit';
  const recovered = new Draft(base, 6); recovered.change(later); recovered.restorePending(pending);
  assert.equal(recovered.beginSave(), pending);
  const submitted = applyProjectChanges(base, pending.changes);
  recovered.acknowledge(submitted, 7, pending);
  assert.equal(recovered.project, later);
  assert.equal(recovered.saved.pages[0].title, 'Pending');
  assert.equal(recovered.saved.pages[0].description, undefined);
  assert.equal(recovered.dirty, true);
});
