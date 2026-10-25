import assert from 'node:assert/strict';
import test from 'node:test';
import { historicalErrors } from '../scripts/cms-release-errors.mjs';

const inventory = () => Object.fromEntries([1, 2, 3, 4, 84, 85, 86, 87, 88].map(version => [version, `Recorded error ${version}: quotes " and newline\nremain exact.`]));

test('manual historical inventory preserves exact messages', () => {
  const expected = inventory();
  assert.deepEqual(historicalErrors(JSON.stringify(expected)), expected);
});

test('manual historical inventory fails closed on missing, malformed or broadened exceptions', () => {
  const missing = inventory(); delete missing[84];
  for (const source of ['', 'invalid JSON', 'null', '[]', '{}', JSON.stringify(missing), JSON.stringify({ ...inventory(), 89: 'extra' }), JSON.stringify({ ...inventory(), 1: '' }), JSON.stringify({ ...inventory(), 1: '  ' }), JSON.stringify({ ...inventory(), 1: 413 })]) {
    assert.throws(() => historicalErrors(source), undefined, source);
  }
});
