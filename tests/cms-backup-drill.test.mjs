import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { seed, initial } from '../.generated/cms-seed.mjs';
import { validateProject, validateProjectWithReferences } from '../src/cms/project.mjs';
import { uploadAsset } from '../src/cms/assets.mjs';
import { publishSite, readSite, digest } from '../src/cms/store.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { readStudioHead } from '../src/cms/studio-store.mjs';

// A file-based restore into a SECOND real D1/R2 instance, not an in-memory
// project clone. Hosted account snapshots still need the documented drill.
test('operations: D1 plus retained R2 backup restores current and historical publications with the matching Worker',{ timeout: 60000 },async()=>{
  const [source,target]=await Promise.all([cmsRuntime(),cmsRuntime()]);
  const directory=await mkdtemp(join(tmpdir(),'cms-drill-'));
  try {
    const bucket=await source.mf.getR2Bucket('CMS_MEDIA');
    const bytes=Buffer.from(rasterFixtures.png,'base64');
    const image=await uploadAsset({CMS_DB:source.db,CMS_MEDIA:bucket,CMS_IMAGES:await source.mf.getImagesBinding('CMS_IMAGES')},{id:crypto.randomUUID(),name:'Drill.png',alt:'A square',bytes});
    const original=structuredClone(initial);original.pages[0].html=original.pages[0].html.replace('</main>',`<img src="${image.src}" alt="A square"></main>`);
    const first=validateProjectWithReferences(original,seed,undefined,{origins:[source.url]});
    await publishSite(source.db,{project:first.project,references:first.references,baseVersion:0,requestId:crypto.randomUUID(),actor:'owner@example.test',studioKey:seed.studioKey,previewFrame:first.frame,origin:source.url});
    const next=structuredClone(original);next.pages[0].description='Recovered publication';
    const second=validateProjectWithReferences(next,seed,undefined,{origins:[source.url]});
    await publishSite(source.db,{project:second.project,references:second.references,baseVersion:1,requestId:crypto.randomUUID(),actor:'owner@example.test',studioKey:seed.studioKey,previewFrame:second.frame,origin:source.url});
    const tables={};
    for(const name of ['cms_head','cms_revisions','cms_rendered','cms_media','cms_revision_resource_indexed','cms_revision_resource_index','cms_studio_heads','cms_studio_text','cms_preview_facts']){
      const {results}=await source.db.prepare(`SELECT * FROM ${name}`).all();
      if(name==='cms_revisions')for(const row of results)row.project=Buffer.from(row.project).toString('base64');
      tables[name]=results;
    }
    assert.ok(tables.cms_preview_facts.length>0,'backup includes real persisted frame/page proofs');
    const objects=[];let cursor;
    do {
      const list=await bucket.list({cursor});
      for(const item of list.objects){const object=await bucket.get(item.key);const content=new Uint8Array(await object.arrayBuffer());objects.push({key:item.key,bytes:Buffer.from(content).toString('base64'),sha256:await digest(content)});}
      cursor=list.truncated?list.cursor:undefined;
    }while(cursor);
    await writeFile(join(directory,'backup.json'),JSON.stringify({format:1,tables,objects}));
    const saved=JSON.parse(await readFile(join(directory,'backup.json'),'utf8'));
    await target.db.prepare('DELETE FROM cms_head').run();
    for(const name of ['cms_media','cms_revisions','cms_rendered','cms_head','cms_revision_resource_indexed','cms_revision_resource_index','cms_studio_heads','cms_studio_text','cms_preview_facts'])for(const row of saved.tables[name]){
      const keys=Object.keys(row), values=keys.map(key=>name==='cms_revisions'&&key==='project'?new Uint8Array(Buffer.from(row[key],'base64')):row[key]);
      await target.db.prepare(`INSERT INTO ${name} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).bind(...values).run();
    }
    const restoredBucket=await target.mf.getR2Bucket('CMS_MEDIA');
    for(const object of saved.objects){const content=Buffer.from(object.bytes,'base64');assert.equal(await digest(content),object.sha256);await restoredBucket.put(object.key,content);}
    assert.deepEqual(await readSite(target.db),await readSite(source.db));
    assert.deepEqual(await readStudioHead(target.db,seed.studioKey),await readStudioHead(source.db,seed.studioKey));
    assert.deepEqual((await target.db.prepare('SELECT * FROM cms_preview_facts ORDER BY target').all()).results,(await source.db.prepare('SELECT * FROM cms_preview_facts ORDER BY target').all()).results);
    assert.deepEqual(await readSite(target.db,1),await readSite(source.db,1));
    assert.equal((await checkCompatibility(target.db,{seed,initial})).compatible,true);
    assert.deepEqual(Buffer.from(await (await target.mf.dispatchFetch(target.url+image.src)).arrayBuffer()),bytes);
    const cookie='CF_Authorization='+await target.token();
    const historical=await readSite(target.db,1);
    const response=await target.mf.dispatchFetch(target.url+'/admin/api/save',{method:'POST',headers:{Cookie:cookie,Origin:target.url,'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({project:historical.project,baseVersion:2,requestId:crypto.randomUUID()})});
    assert.equal(response.status,200,await response.clone().text());
    assert.equal((await response.json()).version,3);
    const expected=validateProject(historical.project,seed,undefined,{origins:[target.url]});
    assert.deepEqual((await readSite(target.db)).project,expected);
    assert.deepEqual(JSON.parse((await readStudioHead(target.db,seed.studioKey)).parts.join('')),expected);
    assert.deepEqual((await readSite(target.db,1)).project,historical.project,'new origin-bound facts never rewrite historical content');
    const publicPage=await target.mf.dispatchFetch(target.url+'/');assert.equal(publicPage.status,200);assert.ok((await publicPage.text()).includes(image.src));
  } finally {await Promise.all([source.close(),target.close()]);await rm(directory,{recursive:true,force:true});}
});
