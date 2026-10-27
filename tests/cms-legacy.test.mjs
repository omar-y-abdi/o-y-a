import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync } from 'node:zlib';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { initial, legacyInitial, seed } from '../.generated/cms-seed.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

test('C1: v1-v3 editor metadata is discarded on read without changing the stored revision or HTML/CSS', async () => {
  for (const version of [1, 2, 3]) {
    const original = structuredClone(initial);
    original.pages[0].project = { pages: { obsolete: true } };
    const bytes = gzipSync(JSON.stringify(original));
    const db = { prepare: () => ({ bind() { return this; }, first: async () => ({ version, project: bytes }) }) };
    const state = await readSite(db, version);
    assert.equal(state.project.pages[0].project, null);
    assert.equal(state.project.pages[0].html, original.pages[0].html);
    assert.equal(state.project.pages[0].css, original.pages[0].css);
    assert.doesNotThrow(() => validateProject(state.project, seed));
    assert.deepEqual(JSON.parse(gunzipSync(bytes)), original);
  }
});

test('C1: unused editor JSON is never validated, persisted or a source of content', () => {
  const project = structuredClone(initial);
  project.pages[0].project = { pages: { obsolete: true }, script: 'not content' };
  project.cards[0].design = { html: '<div data-card-text>Vinst</div>', css: '', project: { components: false } };
  const result = validateProject(project, seed);
  assert.equal(result.pages[0].project, null);
  assert.equal(result.pages[0].html, initial.pages[0].html);
  assert.equal(result.cards[0].design.project, null);
  assert.equal(result.cards[0].design.html, '<div data-card-text="">Vinst</div>');
});

test('C1/B8: legacy state, revision and recovery use canonical frame HTML without rewriting stored editor metadata',async()=>{
  const runtime=await cmsRuntime();
  try {
    const original=structuredClone(legacyInitial);
    original.pages[0].project={components:[{tagName:'p',content:'Older editor text'}]};
    await publishSite(runtime.db,{project:original,baseVersion:0,requestId:crypto.randomUUID(),actor:runtime.email});
    const stored=structuredClone(original);
    const cookie='CF_Authorization='+await runtime.token();
    const get=path=>runtime.mf.dispatchFetch(runtime.url+'/admin/api/'+path,{headers:{Cookie:cookie}});
    let canonical;
    for(const path of ['state','revision/1']){
      const response=await get(path);assert.equal(response.status,200,await response.clone().text());
      const state=await response.json();
      assert.equal(Object.hasOwn(state,'legacyProject'),false);
      assert.equal(state.project.schemaVersion,2);
      assert.ok(state.project.frame.html.includes('<footer'));
      assert.ok(state.project.pages.every(page=>page.project===null));
      assert.ok(state.project.pages.every(page=>!page.html.includes('<footer')));
      if(canonical) assert.deepEqual(state.project,canonical);
      canonical=state.project;
    }
    original.pages[0].project={components:false};
    const recovered=await runtime.mf.dispatchFetch(runtime.url+'/admin/api/recover',{method:'POST',headers:{Cookie:cookie,Origin:runtime.url,'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({project:original})});
    assert.equal(recovered.status,200,await recovered.clone().text());
    assert.deepEqual((await recovered.json()).project,validateProject(canonical,seed,undefined,{publication:false}));
    assert.deepEqual((await readSite(runtime.db,1,{raw:true})).project,stored);
  } finally { await runtime.close(); }
});
