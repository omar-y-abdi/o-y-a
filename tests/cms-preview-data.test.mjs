import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewData } from '../src/client/previewdata.mjs';
import { createDeck, sharedCard } from '../src/client/cards.mjs';
const data={schemaVersion:1,cards:[{id:'one',flavor:'kind',text:'A win',design:{html:'<p data-card-text></p>',css:''}}],runtime:{'welcome':'Preview text'}};
function fixture(value=data){
  const node={textContent:JSON.stringify(value)};
  return {URL:'about:srcdoc',body:{dataset:{cmsPreview:'true'}},head:{querySelectorAll:()=>[node]},querySelectorAll:()=>[node],defaultView:{frameElement:{hasAttribute:()=>true,ownerDocument:{location:{pathname:'/admin/'}}}}};
}
test('R15: only one schema-checked head record in a studio-owned srcdoc frame is a preview source',()=>{
  assert.deepEqual(previewData(fixture()),data);
  for(const modify of [
    doc=>doc.URL='https://omaryusuf.se/',doc=>doc.body.dataset.cmsPreview='false',doc=>doc.defaultView.frameElement=null,
    doc=>doc.defaultView.frameElement.hasAttribute=()=>false,doc=>doc.defaultView.frameElement.ownerDocument.location.pathname='/workshop/',
    doc=>doc.head.querySelectorAll=()=>[],doc=>doc.querySelectorAll=()=>[{},{}],doc=>doc.head.querySelectorAll=()=>[{textContent:'invalid JSON'}],
  ]){const doc=fixture();modify(doc);assert.equal(previewData(doc),null);}
  for(const value of [{...data,schemaVersion:2},{...data,cards:{}},{...data,cards:[{id:'x',flavor:'bad',text:'x'}]},{...data,runtime:[]},{...data,runtime:{x:{html:'unsafe'}}},{...data,cards:[{id:'x',text:'x',flavor:'kind',design:{html:5,css:''}}]}])assert.equal(previewData(fixture(value)),null);
});

test('preview card loading matches public lifecycle semantics',async()=>{
  const cards=[
    {id:'active',flavor:'kind',text:'Active',state:'active'},
    {id:'archived',flavor:'kind',text:'Archived',state:'archived'},
    {id:'trash',flavor:'kind',text:'Trash',state:'trash'},
  ];
  assert.equal(createDeck(cards,()=>0)('kind')?.id,'active');
  assert.equal((await sharedCard('archived',cards,async()=>{throw new Error('unexpected fetch')}))?.id,'archived');
  assert.equal(await sharedCard('trash',cards,async()=>{throw new Error('unexpected fetch')}),null);
});
