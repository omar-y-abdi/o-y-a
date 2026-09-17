import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { seed, initial } from '../.generated/cms-seed.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { errorResponse } from '../src/cms/http.mjs';
import worker from '../src/worker.mjs';
import { uploadAsset } from '../src/cms/assets.mjs';
import { readFile } from 'node:fs/promises';

let runtime;
before(async()=>{runtime=await cmsRuntime();});
after(async()=>runtime?.close());

test('R13: release rehearsal checks current and all retained revisions, then accepts an explicit compatible migration',async()=>{
  for(let version=0;version<2;version++)await publishSite(runtime.db,{project:validateProject(structuredClone(initial),seed),baseVersion:version,requestId:crypto.randomUUID(),actor:'owner@example.test'});
  assert.deepEqual((await checkCompatibility(runtime.db,{seed,initial})).revisions.map(row=>row.version),[0,2,1]);
  const upgraded=structuredClone(seed);
  upgraded.pages[0].contracts.find(item=>item.attrs.id==='main').attrs['aria-label']='Release contract';
  const incompatible=await checkCompatibility(runtime.db,{seed:upgraded,initial});
  assert.equal(incompatible.compatible,false);assert.equal(incompatible.revisions.filter(item=>!item.compatible).length,3);
  const migrated=structuredClone(initial);
  migrated.pages[0].html=migrated.pages[0].html.replace('id="main"','id="main" aria-label="Release contract"');
  const baseline=validateProject(migrated,upgraded);
  assert.doesNotThrow(()=>validateProject(structuredClone(migrated),upgraded,baseline));
  assert.doesNotThrow(()=>validateProject(structuredClone(migrated),upgraded));
});

test('diagnosis: injected D1 and R2 failures emit correlated codes, never request or driver secrets',async()=>{
  const captured=[];const originalError=console.error;console.error=value=>captured.push(JSON.parse(value));
  const secret='JWT_SECRET owner-private@example.test draft-private';
  try {
    const badDb={prepare(){throw new Error('D1_ERROR '+secret);}};
    const response=await worker.fetch(new Request('https://omaryusuf.se/?secret='+secret),{CMS_DB:badDb});
    assert.equal(response.status,503);assert.equal(response.headers.get('X-Request-ID'),captured[0].requestId);assert.equal(captured[0].code,'storage-d1');
    const png=new Uint8Array(await readFile('public/mail/omar-smile.png'));
    let failure;
    try{await uploadAsset({CMS_DB:runtime.db,CMS_IMAGES:await runtime.mf.getImagesBinding('CMS_IMAGES'),CMS_MEDIA:{put(){throw new Error('R2_ERROR '+secret);}}},{id:crypto.randomUUID(),bytes:png,name:secret+'.png'});}catch(error){failure=error;}
    const uploadResponse=errorResponse(failure,'upload');
    assert.equal(uploadResponse.status,503);assert.equal(uploadResponse.headers.get('X-Request-ID'),captured[1].requestId);assert.equal(captured[1].operation,'upload');assert.equal(captured[1].code,'storage-r2');
    assert.ok(!JSON.stringify(captured).includes('SECRET')&&!JSON.stringify(captured).includes('@')&&!JSON.stringify(captured).includes('draft-private'));
    assert.ok(!(await uploadResponse.text()).includes(secret));
  } finally {console.error=originalError;}
});
