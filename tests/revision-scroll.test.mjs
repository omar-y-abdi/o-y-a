import assert from 'node:assert/strict';
import test from 'node:test';
import { CheckFailure, waitScrollSettled, waitAtTop, fikaCommentCandidates } from './helpers/revision-scroll.mjs';

function trace(offsets) {
  const values = offsets[Symbol.iterator]();
  let current, now = 0, reads = 0;
  return {
    page: { evaluate(expression) {
      assert.equal(expression, 'scrollY');
      const next = values.next();
      if (!next.done) current = next.value;
      reads++;
      return current;
    } },
    timer: { now: () => now, sleep: async ms => { now += ms; } },
    get reads() { return reads; },
  };
}

test('scroll: one-pixel steps are not settled', async () => {
  const sample = trace([4, 3, 2, 1, 0, 0, 0, 0]);
  assert.equal(await waitScrollSettled(sample.page, sample), 0);
  assert.equal(sample.reads, 8);
});

test('scroll: fractional position is not truncated to zero', async () => {
  const sample = trace([0.75, 0.75, 0.75, 0.75]);
  assert.equal(await waitScrollSettled(sample.page, sample), 0.75);
});

test('scroll: continuous one-pixel motion times out', async () => {
  const sample = trace(Array.from({ length: 100 }, (_, index) => index));
  await assert.rejects(waitScrollSettled(sample.page, { ...sample, timeout: 500 }), CheckFailure);
});

for (const [name, values] of [['permanent one-pixel offset', [1]], ['fractional offset', [0.75]], ['rebound after touching zero', [0, 1]]]) {
  test(`scroll: top rejects ${name}`, async () => {
    const sample = trace(values);
    await assert.rejects(waitAtTop(sample.page, { ...sample, timeout: 500 }), CheckFailure);
  });
}

test('scroll: top accepts only stable exact zero', async () => {
  const sample = trace([3, 2, 1, 0, 0, 0, 0, 0]);
  assert.equal(await waitAtTop(sample.page, sample), 0);
});

for (const [name, seconds, expected] of [
  ['measured five seconds requires target comment', 5, ['äggklocka']],
  ['slightly late real time accepts correct near comment', 5.3, ['Lagom bryggt']],
  ['late time requires pour-another comment', 5.7, ['påtår']],
]) test(`fika: ${name}`, () => assert.deepEqual(fikaCommentCandidates(seconds), new Set(expected)));

test('fika: rounding boundaries allow adjacent valid categories only', () => {
  assert.deepEqual(fikaCommentCandidates(5.15), new Set(['äggklocka', 'Lagom bryggt']));
  assert.deepEqual(fikaCommentCandidates(5.6), new Set(['Lagom bryggt', 'påtår']));
});
