import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gateFailures } from '../scripts/cms-pull-release.mjs';

test('B8: historical exceptions require exact expected errors and never cover the head', () => {
  const result = { revisions: [
    { version: 1, compatible: false, error: 'Ursprungligt fel.' },
    { version: 84, compatible: false, error: 'Ett nytt konverteringsfel.' },
    { version: 185, compatible: false, error: 'Huvudets fel.' },
  ] };
  const allow = new Map([[1, 'Ursprungligt fel.'], [84, 'Ursprungligt fel.'], [185, 'Huvudets fel.']]);
  assert.deepEqual(gateFailures(result, 185, allow).map(item => item.version), [84, 185]);
  assert.deepEqual(gateFailures(result, 185).map(item => item.version), [1, 84, 185]);
  assert.throws(() => gateFailures(result, 185, new Set([1, 84])), /expected errors/);
});

test('B8: each of the nine historical versions has its own exact error comparison', () => {
  const versions = [1, 2, 3, 4, 84, 85, 86, 87, 88];
  const expected = new Map(versions.map(version => [version, `Registrerat testfel för v${version}.`]));
  const revisions = versions.map(version => ({ version, compatible: false, error: expected.get(version) }));
  const head = { version: 185, compatible: true };
  assert.deepEqual(gateFailures({ revisions: [...revisions, head] }, 185, expected), []);
  for (const version of versions) {
    const changed = revisions.map(item => item.version === version ? { ...item, error: 'Nytt konverteringsfel.' } : item);
    assert.deepEqual(gateFailures({ revisions: [...changed, head] }, 185, expected).map(item => item.version), [version]);
  }
});
