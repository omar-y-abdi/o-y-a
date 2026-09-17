import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createDeck, sharedCard } from '../src/client/cards.mjs';
import { readFileSync } from 'node:fs';
const CARDS=JSON.parse(readFileSync('public/data/cards.json','utf8'));
test('each category exhausts its full shuffled deck before repeating', () => {
  for (const flavor of ['kind','pause','joke','roast']) {
    const next=createDeck(CARDS,()=>0.4), size=CARDS.filter(c=>c.flavor===flavor).length;
    const ids = new Set(); let previous;
    for(let i=0;i<size;i++){const c=next(flavor,previous);assert.ok(!ids.has(c.id));ids.add(c.id);previous=c.id;}
    assert.notEqual(next(flavor,previous).id,previous);
  }
});
test('pop tempo classifies fast and slow intervals without treating the first click as speed', async () => {
  assert.ok(existsSync('src/client/playlogic.mjs'));
  const { bubbleComment }=await import('../src/client/playlogic.mjs');
  assert.notEqual(bubbleComment([100,250,400],5),bubbleComment([100,6000,12000],5));
  assert.equal(bubbleComment([100000],11),'Ingen brådska.');
});
test('fika uses milliseconds and preserves exact target', async () => {
  assert.ok(existsSync('src/client/playlogic.mjs'));
  const { fikaResult }=await import('../src/client/playlogic.mjs');
  assert.equal(fikaResult(5000).seconds,'5,00');
  assert.notEqual(fikaResult(1000).comment,fikaResult(10000).comment);
});

test('shared card lookup keeps archived direct links addressable without querying when card is local', async () => {
  const archived={id:'archived-card',flavor:'kind',text:'Still addressable',state:'archived'};
  let calls=0;
  assert.equal(await sharedCard(archived.id,[archived],async()=>{calls++;throw new Error('unexpected fetch')}),archived);
  assert.equal(calls,0);
  const remote=await sharedCard('archived-remote',[],async url=>{calls++;assert.equal(url,'/data/cards/archived-remote.json');return Response.json(archived);});
  assert.deepEqual(remote,archived);
  assert.equal(calls,1);
  assert.equal(await sharedCard('../unsafe',[],async()=>{throw new Error('unexpected fetch')}),null);
});
