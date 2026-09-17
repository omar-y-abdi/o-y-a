import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyEditorDraft } from '../src/cms/client/legacy.mjs';

test('R18: legacy recovery retains the exact original, removes all secondary representations and keeps content',()=>{
  const original={pages:[{html:'<h1>Visible text</h1>',css:'h1{color:red}',project:{pages:{}}},{html:'Other page',project:{pages:[{component:'Divergent text'}]}}],cards:[{text:'A win',design:{html:'<p data-card-text></p>',css:'',project:{components:false}}}]};
  const before=structuredClone(original), recovered=legacyEditorDraft(original);
  assert.deepEqual(original,before);assert.notEqual(recovered,original);
  for(const page of recovered.pages)assert.equal(page.project,null);
  assert.equal(recovered.cards[0].design.project,null);
  assert.equal(recovered.pages[0].html,before.pages[0].html);assert.equal(recovered.pages[0].css,before.pages[0].css);
  assert.equal(legacyEditorDraft(recovered),null);
});
