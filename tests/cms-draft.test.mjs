import test from 'node:test';
import assert from 'node:assert/strict';
import { Draft } from '../src/cms/client/draft.mjs';

test('a save response acknowledges its exact snapshot without erasing edits made during the request', () => {
  const original = { title: 'Original' }, sent = { title: 'Sent' }, newer = { title: 'Newer' };
  const draft = new Draft(original, 0);
  draft.change(sent); draft.pendingSave = { project: sent, requestId: 'request' };
  draft.change(newer); draft.acknowledge(sent, 1);
  assert.equal(draft.project, newer);
  assert.equal(draft.saved, sent);
  assert.equal(draft.dirty, true);
  assert.equal(draft.pendingSave, null);
  assert.equal(draft.undo(), true);
  assert.equal(draft.project, sent);
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
