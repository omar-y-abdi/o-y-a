import { test } from 'vitest';
import assert from 'node:assert/strict';
import { applyWinAction, exportWinPackage, filterWins, planWinImport } from '../src/cms/client/win-bulk.mjs';

const cards=[
 {id:'a',flavor:'kind',text:'A'}, {id:'b',flavor:'kind',text:'B'},
 {id:'c',flavor:'joke',text:'C'}, {id:'d',flavor:'pause',text:'D'}, {id:'e',flavor:'roast',text:'E'},
];

test('filter and batch action operate on selected IDs without mutating source',()=>{
  assert.deepEqual(filterWins(cards,{state:'active',flavor:'kind'}).map(c=>c.id),['a','b']);
  const result=applyWinAction(cards,new Set(['a']),'archive');
  assert.equal(result.find(c=>c.id==='a').state,'archived');
  assert.equal(cards[0].state,undefined);
});

test('batch action is atomic and refuses to remove the last active flavor card',()=>{
  assert.throws(()=>applyWinAction(cards,new Set(['c']),'trash'),/kategori/i);
  const trashed=cards.map(c=>c.id==='c'?{...c,state:'trash'}:c);
  assert.throws(()=>applyWinAction(trashed,new Set(['c']),'delete'),/kategori/i);
});

test('export package is versioned and records referenced media without inlining binaries',()=>{
  const designed=[...cards,{id:'f',flavor:'kind',text:'F',design:{html:'<div><img src="/media/11111111-1111-4111-8111-111111111111.png"><span data-card-text></span></div>',css:'background:url(/media/22222222-2222-4222-8222-222222222222.webp)'}}];
  const pkg=exportWinPackage(designed,new Set(['f']));
  assert.equal(pkg.format,'omar-wins/v1');
  assert.equal(pkg.cards.length,1);
  assert.deepEqual(pkg.resources,['/media/11111111-1111-4111-8111-111111111111.png','/media/22222222-2222-4222-8222-222222222222.webp']);
});

test('import validates the whole package, resources and collision policy before mutating',()=>{
  const pkg={format:'omar-wins/v1',cards:[{id:'a',flavor:'kind',text:'replacement'},{id:'new-card',flavor:'kind',text:'new'}],resources:[]};
  assert.equal(planWinImport(cards,pkg,{collision:'skip',availableResources:new Set()}).imported,1);
  const replaced=planWinImport(cards,pkg,{collision:'replace',availableResources:new Set()});
  assert.equal(replaced.cards.find(c=>c.id==='a').text,'replacement');
  assert.throws(()=>planWinImport(cards,{...pkg,resources:['/media/missing.png']},{collision:'skip',availableResources:new Set()}),/sakna/i);
});
