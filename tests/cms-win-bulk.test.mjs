import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyWinAction, exportWinPackage, filterWins, planWinImport, WIN_BATCH_ACTIONS } from '../src/cms/client/win-bulk.mjs';

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

test('export manifest includes uploaded fonts referenced through cms-font family names',()=>{
  const id='123e4567-e89b-42d3-a456-426614174000';
  const designed=[...cards,{id:'font-card',flavor:'kind',text:'Font',design:{html:'<div data-card-text></div>',css:`.ticket{font-family:cms-font-${id}}`}}];
  const pkg=exportWinPackage(designed,new Set(['font-card']));
  assert.deepEqual(pkg.resources,[`/media/${id}.woff2`]);
  assert.throws(()=>planWinImport(cards,pkg,{collision:'skip',availableResources:new Set()}),/sakna/i);
});

test('batch action registry is the canonical metadata and transform source',()=>{
  assert.deepEqual(Object.keys(WIN_BATCH_ACTIONS),['archive','restore','trash','delete','category','export']);
  assert.equal(WIN_BATCH_ACTIONS.archive.label,'Arkivera');
  assert.equal(WIN_BATCH_ACTIONS.export.kind,'export');
  const archived=applyWinAction(cards,new Set(['a']),'archive');
  assert.equal(archived.find(card=>card.id==='a').state,'archived');
});
