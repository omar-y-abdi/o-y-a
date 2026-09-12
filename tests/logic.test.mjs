import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

async function cards() {
  assert.ok(existsSync('src/client/cards.mjs'), 'Card model must exist');
  const module = await import('../src/client/cards.mjs');
  const CARDS = JSON.parse((await import('node:fs')).readFileSync('public/data/cards.json','utf8'));
  return { CARDS, getCard:id=>module.getCard(id,CARDS), nextCard:(flavor,previous,random)=>module.createDeck(CARDS,random)(flavor,previous) };
}
test('cards have stable unique public IDs and no untrusted lookup', async () => {
  const { CARDS, getCard } = await cards();
  assert.equal(new Set(CARDS.map(c => c.id)).size, CARDS.length);
  for (const c of CARDS) assert.deepEqual(getCard(c.id), c);
  for (const id of ['__proto__', 'constructor', '<script>', null, '', 'k1'.repeat(200)]) assert.equal(getCard(id), null);
  assert.ok(CARDS.every(c => c.text.length < 130 && !c.text.includes('—')));
});
test('cycling stays in category and avoids immediate repeats', async () => {
  const { CARDS, nextCard } = await cards();
  for (const flavor of ['kind', 'joke', 'pause']) {
    let previous = null;
    for (let i = 0; i < 30; i++) {
      const next = nextCard(flavor, previous, () => i / 30);
      assert.equal(next.flavor, flavor);
      assert.notEqual(next.id, previous);
      previous = next.id;
    }
  }
  assert.ok(CARDS.includes(nextCard('unknown', null, () => 0)));
  assert.ok(CARDS.includes(nextCard('kind', null, () => NaN)));
});
test('consent parser only accepts exact versioned choices', async () => {
  assert.ok(existsSync('src/client/privacy.mjs'), 'Privacy model must exist');
  const { readConsent, consentCookie } = await import('../src/client/privacy.mjs');
  assert.equal(readConsent('x=1; oy_privacy=v1.allow'), 'allow');
  assert.equal(readConsent('oy_privacy=v1.deny; x=2'), 'deny');
  for (const cookie of ['', 'oy_privacy=allow', 'oy_privacy=v2.allow', 'xoy_privacy=v1.allow', 'oy_privacy=v1.allowX', 'oy_privacy=v1.allow; oy_privacy=v1.deny']) assert.equal(readConsent(cookie), null);
  assert.match(consentCookie('allow', true), /Secure/);
  assert.match(consentCookie('deny', true), /Max-Age=15552000/);
  assert.throws(() => consentCookie('maybe', true));
});
