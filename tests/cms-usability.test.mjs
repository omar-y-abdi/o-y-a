import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { transitionAsset, transitionBuiltinAsset, updateBuiltinAsset } from '../src/cms/assets.mjs';
import { publishSite, readPublicData, readSite } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';

let runtime, cookie;
before(async () => { runtime = await cmsRuntime(); cookie = 'CF_Authorization=' + await runtime.token(); });
after(async () => runtime?.close());
const get = path => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { headers: { Cookie: cookie } });
const post = (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify(body) });
async function upload(name='fixture.png') {
  const id=crypto.randomUUID(), bytes=Buffer.from(rasterFixtures.png,'base64');
  const response=await runtime.mf.dispatchFetch(runtime.url+'/admin/api/upload',{method:'POST',headers:{Cookie:cookie,Origin:runtime.url,'X-CMS-Request':'1','Content-Type':'application/octet-stream','X-CMS-Upload-Id':id,'X-CMS-Filename':encodeURIComponent(name)},body:bytes});
  assert.equal(response.status,201,await response.clone().text());
  return response.json();
}


function builtinRaceDb({ initial = null, latest }) {
  let reads = 0;
  return {
    prepare(sql) {
      return {
        bind() { return this; },
        async first() {
          if (!sql.startsWith('SELECT * FROM cms_builtin_resource_state')) throw new Error(`Unexpected first: ${sql}`);
          return reads++ === 0 ? initial : latest;
        },
        async run() {
          if (!sql.startsWith('UPDATE cms_builtin_resource_state') && !sql.startsWith('INSERT')) throw new Error(`Unexpected run: ${sql}`);
          return { meta: { changes: 0 } };
        },
      };
    },
  };
}

test('built-in metadata CAS rejects a write lost between read and update', async () => {
  const builtin={id:'builtin-icon',src:'/icon.png',name:'Icon',alt:'',mime:'image/png'};
  const latest={source_path:builtin.src,version:1,name:'Other tab',alt:'',archived_at:null,trashed_at:null,deleted_at:null,managed_asset_id:null};
  await assert.rejects(updateBuiltinAsset(builtinRaceDb({initial:{...latest,version:0,name:null},latest}),builtin,{baseVersion:0,name:'My rename'}),error=>error.status===409);
});

test('built-in lifecycle CAS rejects a concurrent first-state insert', async () => {
  const builtin={id:'builtin-icon',src:'/icon.png',name:'Icon',alt:'',mime:'image/png'};
  const latest={source_path:builtin.src,version:1,name:null,alt:null,archived_at:new Date().toISOString(),trashed_at:null,deleted_at:null,managed_asset_id:null};
  const project={pages:[],cards:[],theme:{fontFamily:'Arial'},resources:{}};
  await assert.rejects(transitionBuiltinAsset(builtinRaceDb({initial:null,latest}),builtin,{action:'archive',baseVersion:0,project}),error=>error.status===409);
});

test('media lifecycle is CAS-safe and supports archive restore trash and delete', async () => {
  const asset=await upload('Lifecycle.png');
  const state=await (await get('state')).json();
  let version=asset.version;
  for (const action of ['archive','restore','trash']) {
    const response=await post('asset-lifecycle',{id:asset.id,action,baseVersion:version,baseSiteVersion:state.version,project:state.project});
    assert.equal(response.status,200,await response.clone().text());
    const result=await response.json(); version=result.asset.version;
  }
  const stale=await post('asset-lifecycle',{id:asset.id,action:'restore',baseVersion:asset.version,project:state.project});
  assert.equal(stale.status,409);
  const deleted=await post('asset-lifecycle',{id:asset.id,action:'delete',baseVersion:version,baseSiteVersion:state.version,project:state.project});
  assert.equal(deleted.status,200,await deleted.clone().text());
  assert.equal((await deleted.json()).deleted,true);
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_media WHERE id=?').bind(asset.id).first(),null);
  assert.equal(await (await runtime.mf.getR2Bucket('CMS_MEDIA')).head(asset.src.slice(7)),null);
});

test('permanent media deletion keeps an owned tombstone when R2 deletion fails', async () => {
  const asset=await upload('Delete ordering.png');
  const state=await (await get('state')).json();
  const trashed=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,baseSiteVersion:state.version,project:state.project});
  assert.equal(trashed.status,200,await trashed.clone().text());
  const trashedAsset=(await trashed.json()).asset;
  let observed;
  await assert.rejects(
    transitionAsset({
      CMS_DB:runtime.db,
      CMS_MEDIA:{delete:async()=>{
        observed=await runtime.db.prepare('SELECT * FROM cms_media WHERE id=?').bind(asset.id).first();
        throw new Error('simulated R2 failure');
      }},
    },{id:asset.id,action:'delete',baseVersion:trashedAsset.version,baseSiteVersion:state.version,project:state.project}),
    /simulated R2 failure/,
  );
  assert.equal(observed.id,asset.id);
  assert.ok(observed.deleting_at);
  const reserved=await runtime.db.prepare('SELECT * FROM cms_media WHERE id=?').bind(asset.id).first();
  assert.equal(reserved.deleting_at,observed.deleting_at);
  assert.ok(reserved.trashed_at);
});

test('duplicate permanent deletes cannot resurrect metadata while the first R2 delete is in flight', async () => {
  const asset=await upload('Concurrent delete.png');
  const state=await (await get('state')).json();
  const trashed=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,baseSiteVersion:state.version,project:state.project});
  assert.equal(trashed.status,200,await trashed.clone().text());
  const trashedAsset=(await trashed.json()).asset;
  const bucket=await runtime.mf.getR2Bucket('CMS_MEDIA');
  let enter,release;
  const entered=new Promise(resolve=>{enter=resolve});
  const gate=new Promise(resolve=>{release=resolve});
  let first=true;
  const blockedBucket={delete:async key=>{if(first){first=false;enter();await gate;}return bucket.delete(key);}};
  const firstDelete=transitionAsset({CMS_DB:runtime.db,CMS_MEDIA:blockedBucket},{id:asset.id,action:'delete',baseVersion:trashedAsset.version,baseSiteVersion:state.version,project:state.project});
  await entered;
  const secondDelete=transitionAsset({CMS_DB:runtime.db,CMS_MEDIA:bucket},{id:asset.id,action:'delete',baseVersion:trashedAsset.version,baseSiteVersion:state.version,project:state.project});
  let second,secondError;
  try { second=await secondDelete; } catch (error) { secondError=error; } finally { release(); }
  const firstResult=await firstDelete;
  assert.equal(secondError,undefined);
  assert.equal(second.deleted,true);
  assert.equal(firstResult.deleted,true);
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_media WHERE id=?').bind(asset.id).first(),null);
  assert.equal(await bucket.head(asset.src.slice(7)),null);
});

test('trashed media cannot be reintroduced by a stale save', async () => {
  const asset=await upload('Stale save.png');
  const state=await (await get('state')).json();
  const stale=structuredClone(state.project);
  stale.pages[0].html=stale.pages[0].html.replace('</main>',`<img src="${asset.src}" alt="Stale"></main>`);
  const trashed=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,baseSiteVersion:state.version,project:state.project});
  assert.equal(trashed.status,200,await trashed.clone().text());
  const saved=await post('save',{project:stale,baseVersion:state.version,requestId:crypto.randomUUID()});
  assert.equal(saved.status,422,await saved.clone().text());
  assert.equal((await (await get('state')).json()).version,state.version);
});

test('stale project version cannot trash an asset after another tab publishes a new reference', async () => {
  const asset=await upload('Stale trash.png');
  const state=await (await get('state')).json();
  const used=structuredClone(state.project);
  used.pages[0].html=used.pages[0].html.replace('</main>',`<img src="${asset.src}" alt="Used"></main>`);
  const saved=await post('save',{project:used,baseVersion:state.version,requestId:crypto.randomUUID()});
  assert.equal(saved.status,200,await saved.clone().text());
  const trashed=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,baseSiteVersion:state.version,project:state.project});
  assert.equal(trashed.status,409,await trashed.clone().text());
  const row=await runtime.db.prepare('SELECT trashed_at FROM cms_media WHERE id=?').bind(asset.id).first();
  assert.equal(row.trashed_at,null);
  const latest=await (await get('state')).json();
  const clean=structuredClone(latest.project);
  clean.pages[0].html=clean.pages[0].html.replace(`<img src="${asset.src}" alt="Used">`,'');
  const cleanup=await post('save',{project:clean,baseVersion:latest.version,requestId:crypto.randomUUID()});
  assert.equal(cleanup.status,200,await cleanup.clone().text());
});

test('current and retained history references block destructive media deletion', async () => {
  const asset=await upload('Used.png');
  const state=await (await get('state')).json();
  const used=structuredClone(state.project);
  used.pages[0].html=used.pages[0].html.replace('</main>',`<img src="${asset.src}" alt="Used"></main>`);
  const blocked=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,baseSiteVersion:state.version,project:used});
  assert.equal(blocked.status,409);
  const save=await post('save',{project:used,baseVersion:state.version,requestId:crypto.randomUUID()});
  assert.equal(save.status,200,await save.clone().text());
  const clean=structuredClone((await (await get('state')).json()).project);
  clean.pages[0].html=clean.pages[0].html.replace(`<img src="${asset.src}" alt="Used">`,'');
  const save2=await post('save',{project:clean,baseVersion:state.version+1,requestId:crypto.randomUUID()});
  assert.equal(save2.status,200,await save2.clone().text());
  const usage=await (await post('asset-usage',{id:asset.id,project:clean})).json();
  assert.equal(usage.currentReferences,0); assert.ok(usage.historyReferences>=1);
  const trashed=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,baseSiteVersion:state.version+2,project:clean});
  assert.equal(trashed.status,200,await trashed.clone().text());
  const trashedAsset=(await trashed.json()).asset;
  const deleted=await post('asset-lifecycle',{id:asset.id,action:'delete',baseVersion:trashedAsset.version,baseSiteVersion:state.version+2,project:clean});
  assert.equal(deleted.status,409);
});

test('built-in resources persist lifecycle and metadata state', async () => {
  const state=await (await get('state')).json();
  const builtin=state.assets.find(asset=>asset.builtin && asset.slot==='social');
  assert.ok(builtin);
  const archived=await post('asset-lifecycle',{id:builtin.id,action:'archive',baseVersion:builtin.version,project:state.project});
  assert.equal(archived.status,200,await archived.clone().text());
  const reloaded=await (await get('state')).json();
  assert.equal(reloaded.assets.find(asset=>asset.id===builtin.id).state,'archived');
  const restored=(await (await post('asset-lifecycle',{id:builtin.id,action:'restore',baseVersion:(await archived.json()).asset.version,project:state.project})).json()).asset;
  const metadata=await post('asset-metadata',{id:builtin.id,baseVersion:restored.version,name:'Delningsbild redigerad',alt:'Ny alttext'});
  assert.equal(metadata.status,200,await metadata.clone().text());
  const metadataResult=await metadata.json();
  assert.equal(metadataResult.asset.name,'Delningsbild redigerad');
  assert.equal(metadataResult.asset.alt,'Ny alttext');
  const metadataReload=await (await get('state')).json();
  assert.equal(metadataReload.assets.find(asset=>asset.id===builtin.id).alt,'Ny alttext');
  const published=await post('save',{project:metadataReload.project,baseVersion:metadataReload.version,requestId:crypto.randomUUID()});
  assert.equal(published.status,200,await published.clone().text());
  const publicResources=await readPublicData(runtime.db,'resources');
  assert.equal(publicResources.value.social.alt,'Ny alttext');
  const blocked=await post('asset-lifecycle',{id:builtin.id,action:'trash',baseVersion:metadataResult.asset.version,baseSiteVersion:metadataReload.version+1,project:state.project});
  assert.equal(blocked.status,409);
});

test('built-in permanent deletion is terminal and destructive transitions are site-version CAS aware', async () => {
  const head=await runtime.db.prepare('SELECT version FROM cms_head WHERE id=1').first();
  const builtin={id:'builtin-unused-test',src:'/unused-review-test.png',name:'Unused',alt:'',mime:'image/png',builtin:true};
  const project={pages:[],cards:[],theme:{fontFamily:'Arial'},resources:{}};
  const trashed=await transitionBuiltinAsset(runtime.db,builtin,{action:'trash',baseVersion:0,baseSiteVersion:head.version,project});
  const deleted=await transitionBuiltinAsset(runtime.db,builtin,{action:'delete',baseVersion:trashed.asset.version,baseSiteVersion:head.version,project});
  assert.equal(deleted.deleted,true);
  await assert.rejects(
    transitionBuiltinAsset(runtime.db,builtin,{action:'restore',baseVersion:trashed.asset.version+1,project}),
    error=>error.status===409 && /Permanent/.test(error.message),
  );
  const staleBuiltin={id:'builtin-stale-test',src:'/stale-review-test.png',name:'Stale',alt:'',mime:'image/png',builtin:true};
  await publishSite(runtime.db,{project:initial,baseVersion:head.version,requestId:crypto.randomUUID(),actor:'owner@example.test'});
  await assert.rejects(
    transitionBuiltinAsset(runtime.db,staleBuiltin,{action:'trash',baseVersion:0,baseSiteVersion:head.version,project}),
    error=>error.status===409,
  );
});

test('pre-shared-content retained revisions normalize through state preview revision and restore-save', async () => {
  const legacyRuntime=await cmsRuntime();
  try {
    const legacyCookie='CF_Authorization='+await legacyRuntime.token();
    const legacy=structuredClone(initial);
    delete legacy.sharedContent;
    legacy.pages=legacy.pages.map(page=>({...page,html:page.html.replace(/ data-cms-shared="footer\.tagline"/g,'')}));
    await publishSite(legacyRuntime.db,{project:legacy,baseVersion:0,requestId:crypto.randomUUID(),actor:'owner@example.test'});
    const api=(path,options={})=>legacyRuntime.mf.dispatchFetch(legacyRuntime.url+'/admin/api/'+path,{...options,headers:{Cookie:legacyCookie,...options.headers}});
    const stateResponse=await api('state');
    assert.equal(stateResponse.status,200,await stateResponse.clone().text());
    const state=await stateResponse.json();
    assert.ok(state.project.sharedContent['footer.tagline']);
    assert.ok(state.project.pages.every(page=>page.html.includes('data-cms-shared="footer.tagline"')));
    const preview=await api('preview',{method:'POST',headers:{Origin:legacyRuntime.url,'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({project:state.project,pageId:state.project.pages[0].id})});
    assert.equal(preview.status,200,await preview.clone().text());
    const revisionResponse=await api('revision/1');
    assert.equal(revisionResponse.status,200,await revisionResponse.clone().text());
    const revision=await revisionResponse.json();
    assert.ok(revision.project.sharedContent['footer.tagline']);
    assert.ok(revision.project.pages.every(page=>page.html.includes('data-cms-shared="footer.tagline"')));
    const saved=await api('save',{method:'POST',headers:{Origin:legacyRuntime.url,'Content-Type':'application/json','X-CMS-Request':'1'},body:JSON.stringify({project:revision.project,baseVersion:1,requestId:crypto.randomUUID()})});
    assert.equal(saved.status,200,await saved.clone().text());
  } finally { await legacyRuntime.close(); }
});

test('published deck exposes active cards only while exact archived IDs remain addressable', async () => {
  const state=await (await get('state')).json();
  const project=structuredClone(state.project);
  const archived=project.cards.find(card=>card.flavor==='kind');
  const trashed=project.cards.find(card=>card.flavor==='joke');
  archived.state='archived'; trashed.state='trash';
  const response=await post('save',{project,baseVersion:state.version,requestId:crypto.randomUUID()});
  assert.equal(response.status,200,await response.clone().text());
  const cards=await (await runtime.mf.dispatchFetch(runtime.url+'/data/cards.json')).json();
  assert.ok(!cards.some(card=>card.id===archived.id));
  assert.ok(!cards.some(card=>card.id===trashed.id));
  assert.equal((await runtime.mf.dispatchFetch(runtime.url+`/data/cards/${archived.id}.json`)).status,200);
  assert.equal((await runtime.mf.dispatchFetch(runtime.url+`/data/cards/${trashed.id}.json`)).status,404);
});

test('managed SVG save is staged, derivative-backed, reconciled and CAS-safe', async () => {
  const state=await (await get('state')).json();
  const icon=state.assets.find(asset=>asset.builtin&&asset.slot==='icon');
  assert.equal(icon.editableSrc,'/favicon.svg');
  const opened=await get('managed-svg?id='+encodeURIComponent(icon.id));
  assert.equal(opened.status,200,await opened.clone().text());
  const original=await opened.json();
  assert.match(original.svg,/^<svg/); assert.equal(original.version,icon.version);
  const changed=original.svg.replace('#ffda44','#00aa88');
  const operationId=crypto.randomUUID();
  const staged=await post('managed-svg',{action:'stage',id:icon.id,operationId,baseVersion:original.version,svg:changed});
  assert.equal(staged.status,200,await staged.clone().text());
  const stagedResult=await staged.json();
  assert.equal(stagedResult.operation.state,'staged');
  assert.match(stagedResult.svg,/#00aa88/);
  const beforeFinalize=await (await get('managed-svg?id='+encodeURIComponent(icon.id))).json();
  assert.equal(beforeFinalize.version,original.version);
  assert.equal(beforeFinalize.asset.managedAssetId,original.asset.managedAssetId);
  const object=await (await runtime.mf.getR2Bucket('CMS_MEDIA')).get(`managed-svg/${stagedResult.operation.managedAssetId}.svg`);
  assert.ok(object); assert.match(await object.text(),/#00aa88/);

  const derivative=await upload('Managed derivative.png');
  const prepared=await post('managed-svg',{action:'prepare',id:icon.id,operationId,derivativeId:derivative.id});
  assert.equal(prepared.status,200,await prepared.clone().text());
  assert.equal((await prepared.json()).operation.state,'prepared');
  const stillCanonical=await (await get('managed-svg?id='+encodeURIComponent(icon.id))).json();
  assert.equal(stillCanonical.version,original.version);

  const finalized=await post('managed-svg',{action:'finalize',id:icon.id,operationId,project:state.project});
  assert.equal(finalized.status,200,await finalized.clone().text());
  const result=await finalized.json();
  assert.equal(result.operation.state,'committed');
  assert.equal(result.asset.version,original.version+1);
  assert.equal(result.asset.managedAssetId,stagedResult.operation.managedAssetId);
  assert.equal(result.project.resources.icon,derivative.src);
  const pending=await (await get('managed-svg?id='+encodeURIComponent(icon.id))).json();
  assert.equal(pending.operation.id,operationId);
  assert.equal(pending.operation.state,'committed');

  const completed=await post('managed-svg',{action:'complete',id:icon.id,operationId});
  assert.equal(completed.status,200,await completed.clone().text());
  assert.equal((await completed.json()).operation.state,'completed');
  const reopened=await (await get('managed-svg?id='+encodeURIComponent(icon.id))).json();
  assert.equal(reopened.operation,null);
  assert.match(reopened.svg,/#00aa88/);

  const stale=await post('managed-svg',{action:'stage',id:icon.id,operationId:crypto.randomUUID(),baseVersion:original.version,svg:changed});
  assert.equal(stale.status,409);
  const unsafe=await post('managed-svg',{action:'stage',id:icon.id,operationId:crypto.randomUUID(),baseVersion:result.asset.version,svg:'<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>'});
  assert.equal(unsafe.status,422);
  assert.equal((await runtime.mf.dispatchFetch(runtime.url+`/media/${result.asset.managedAssetId}.svg`)).status,404);
});

test('managed SVG canonical state does not advance when prepare/finalize cannot complete', async () => {
  const state=await (await get('state')).json();
  const icon=state.assets.find(asset=>asset.builtin&&asset.slot==='emailStatic');
  const original=await (await get('managed-svg?id='+encodeURIComponent(icon.id))).json();
  const operationId=crypto.randomUUID();
  const staged=await post('managed-svg',{action:'stage',id:icon.id,operationId,baseVersion:original.version,svg:original.svg.replace('#ffda44','#112233')});
  assert.equal(staged.status,200,await staged.clone().text());
  const invalidPrepare=await post('managed-svg',{action:'prepare',id:icon.id,operationId,derivativeId:crypto.randomUUID()});
  assert.equal(invalidPrepare.status,404);
  assert.equal((await (await get('managed-svg?id='+encodeURIComponent(icon.id))).json()).version,original.version);

  const derivative=await upload('Prepared but stale.png');
  assert.equal((await post('managed-svg',{action:'prepare',id:icon.id,operationId,derivativeId:derivative.id})).status,200);
  const metadata=await post('asset-metadata',{id:icon.id,baseVersion:original.version,name:'Concurrent SVG label'});
  assert.equal(metadata.status,200,await metadata.clone().text());
  const staleFinalize=await post('managed-svg',{action:'finalize',id:icon.id,operationId,project:state.project});
  assert.equal(staleFinalize.status,409);
  const canonical=await (await get('managed-svg?id='+encodeURIComponent(icon.id))).json();
  assert.equal(canonical.asset.name,'Concurrent SVG label');
  assert.equal(canonical.asset.managedAssetId,original.asset.managedAssetId);
});
