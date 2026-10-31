import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { representativeCards } from './helpers/card-corpus.mjs';

const bank = JSON.parse(await readFile(new URL('../public/data/cards.json', import.meta.url), 'utf8'));
const lengths = bank.map(card => card.text.length);

test('representative corpus picks 24 unique cards', () => {
  const picked = representativeCards(bank);
  assert.equal(picked.length, 24);
  assert.equal(new Set(picked.map(card => card.id)).size, 24);
});

test('representative corpus is deterministic and keeps bank order', () => {
  const first = representativeCards(bank).map(card => card.id);
  assert.deepEqual(representativeCards(bank).map(card => card.id), first);
  const positions = first.map(id => bank.findIndex(card => card.id === id));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('representative corpus covers every flavor', () => {
  const picked = new Set(representativeCards(bank).map(card => card.flavor));
  assert.deepEqual([...picked].sort(), [...new Set(bank.map(card => card.flavor))].sort());
});

test('representative corpus includes the longest and shortest texts', () => {
  const picked = representativeCards(bank).map(card => card.text.length);
  assert.ok(picked.includes(Math.max(...lengths)));
  assert.ok(picked.includes(Math.min(...lengths)));
});

test('representative corpus returns a bank of exactly its size whole', () => {
  const small = bank.slice(0, 24);
  assert.deepEqual(representativeCards(small), small);
});

test('representative corpus rejects a size it cannot satisfy', () => {
  assert.throws(() => representativeCards(bank, bank.length + 1), RangeError);
  assert.throws(() => representativeCards(bank, 2), RangeError);
});
