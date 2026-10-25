import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyEditorDraft } from '../src/cms/client/legacy.mjs';
import { legacyInitial } from '../.generated/cms-seed.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

test('R18: legacy recovery retains the exact original, removes all secondary representations and keeps content',()=>{
  const original={pages:[{html:'<h1>Visible text</h1>',css:'h1{color:red}',project:{pages:{}}},{html:'Other page',project:{pages:[{component:'Divergent text'}]}}],cards:[{text:'A win',design:{html:'<p data-card-text></p>',css:'',project:{components:false}}}]};
  const before=structuredClone(original), recovered=legacyEditorDraft(original);
  assert.deepEqual(original,before);assert.notEqual(recovered,original);
  for(const page of recovered.pages)assert.equal(page.project,null);
  assert.equal(recovered.cards[0].design.project,null);
  assert.equal(recovered.pages[0].html,before.pages[0].html);assert.equal(recovered.pages[0].css,before.pages[0].css);
  assert.equal(legacyEditorDraft(recovered),null);
});

test('B8/R18: state and revision retain the original editor export outside the canonical frame project',async()=>{
  const runtime=await cmsRuntime();
  try {
    const original=structuredClone(legacyInitial);
    original.pages[0].project={components:[{tagName:'p',content:'Older editor text'}]};
    await publishSite(runtime.db,{project:original,baseVersion:0,requestId:crypto.randomUUID(),actor:runtime.email});
    const cookie='CF_Authorization='+await runtime.token();
    const get=path=>runtime.mf.dispatchFetch(runtime.url+'/admin/api/'+path,{headers:{Cookie:cookie}});
    for(const path of ['state','revision/1']){
      const response=await get(path);assert.equal(response.status,200,await response.clone().text());
      const state=await response.json();
      assert.deepEqual(state.legacyProject,original);
      assert.equal(state.project.schemaVersion,2);
      assert.ok(state.project.pages.every(page=>page.project===null));
      assert.ok(state.project.pages.every(page=>!page.html.includes('<footer')));
    }
    original.pages[0].project={components:false};
    const rejected=await runtime.mf.dispatchFetch(runtime.url+'/admin/api/recover',{method:'POST',headers:{Cookie:cookie,Origin:runtime.url,'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({project:original})});
    assert.equal(rejected.status,422);
    assert.match(await rejected.text(),/Editorprojektets struktur/);
  } finally { await runtime.close(); }
});
