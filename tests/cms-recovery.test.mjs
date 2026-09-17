import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftBackup, readDraftBackup } from '../src/cms/client/recovery.mjs';

test('draft backup schema 2 carries managed SVG recovery while legacy schema remains readable', () => {
  const previous = globalThis.location;
  globalThis.location = { origin: 'https://example.test' };
  try {
    const managedSvg = { id: 'builtin-icon', version: 3, svg: '<svg viewBox="0 0 10 10"><g transform="translate(1 0)"></g></svg>', operation: null };
    const backup = draftBackup({ pages: [] }, 4, null, managedSvg);
    assert.equal(backup.schemaVersion, 2);
    assert.deepEqual(readDraftBackup(backup).managedSvg, managedSvg);
    assert.deepEqual(readDraftBackup({ format: 'oy-portfolio-draft', schemaVersion: 1, project: { pages: [] }, baseVersion: 1 }).project, { pages: [] });
    assert.throws(() => readDraftBackup({ ...backup, managedSvg: { ...managedSvg, version: -1 } }), /SVG-utkast/);
  } finally {
    if (previous === undefined) delete globalThis.location;
    else globalThis.location = previous;
  }
});
