import { test, afterAll as after, beforeAll as before } from 'vitest';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { transitionAsset, transitionBuiltinAsset, updateBuiltinAsset } from '../src/cms/assets.mjs';

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
    const response=await post('asset-lifecycle',{id:asset.id,action,baseVersion:version,project:state.project});
    assert.equal(response.status,200,await response.clone().text());
    const result=await response.json(); version=result.asset.version;
  }
  const stale=await post('asset-lifecycle',{id:asset.id,action:'restore',baseVersion:asset.version,project:state.project});
  assert.equal(stale.status,409);
  const deleted=await post('asset-lifecycle',{id:asset.id,action:'delete',baseVersion:version,project:state.project});
  assert.equal(deleted.status,200,await deleted.clone().text());
  assert.equal((await deleted.json()).deleted,true);
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_media WHERE id=?').bind(asset.id).first(),null);
  assert.equal(await (await runtime.mf.getR2Bucket('CMS_MEDIA')).head(asset.src.slice(7)),null);
});

test('permanent media deletion removes live D1 metadata before R2 and restores it if R2 deletion fails', async () => {
  const asset=await upload('Delete ordering.png');
  const state=await (await get('state')).json();
  const trashed=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,project:state.project});
  assert.equal(trashed.status,200,await trashed.clone().text());
  const trashedAsset=(await trashed.json()).asset;
  let observed;
  await assert.rejects(
    transitionAsset({
      CMS_DB:runtime.db,
      CMS_MEDIA:{delete:async()=>{
        observed={
          live:await runtime.db.prepare('SELECT id FROM cms_media WHERE id=?').bind(asset.id).first(),
          queued:await runtime.db.prepare('SELECT id FROM cms_media_delete_queue WHERE id=?').bind(asset.id).first(),
        };
        throw new Error('simulated R2 failure');
      }},
    },{id:asset.id,action:'delete',baseVersion:trashedAsset.version,project:state.project}),
    /simulated R2 failure/,
  );
  assert.equal(observed.live,null);
  assert.equal(observed.queued.id,asset.id);
  const restored=await runtime.db.prepare('SELECT * FROM cms_media WHERE id=?').bind(asset.id).first();
  assert.equal(restored.version,trashedAsset.version);
  assert.ok(restored.trashed_at);
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_media_delete_queue WHERE id=?').bind(asset.id).first(),null);
});

test('current and retained history references block destructive media deletion', async () => {
  const asset=await upload('Used.png');
  const state=await (await get('state')).json();
  const used=structuredClone(state.project);
  used.pages[0].html=used.pages[0].html.replace('</main>',`<img src="${asset.src}" alt="Used"></main>`);
  const blocked=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,project:used});
  assert.equal(blocked.status,409);
  const save=await post('save',{project:used,baseVersion:0,requestId:crypto.randomUUID()});
  assert.equal(save.status,200,await save.clone().text());
  const clean=structuredClone((await (await get('state')).json()).project);
  clean.pages[0].html=clean.pages[0].html.replace(`<img src="${asset.src}" alt="Used">`,'');
  const save2=await post('save',{project:clean,baseVersion:1,requestId:crypto.randomUUID()});
  assert.equal(save2.status,200,await save2.clone().text());
  const usage=await (await post('asset-usage',{id:asset.id,project:clean})).json();
  assert.equal(usage.currentReferences,0); assert.ok(usage.historyReferences>=1);
  const trashed=await post('asset-lifecycle',{id:asset.id,action:'trash',baseVersion:asset.version,project:clean});
  assert.equal(trashed.status,200,await trashed.clone().text());
  const trashedAsset=(await trashed.json()).asset;
  const deleted=await post('asset-lifecycle',{id:asset.id,action:'delete',baseVersion:trashedAsset.version,project:clean});
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
  const blocked=await post('asset-lifecycle',{id:builtin.id,action:'trash',baseVersion:metadataResult.asset.version,project:state.project});
  assert.equal(blocked.status,409);
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

test('managed SVG source is owner-only, sanitized, immutable in R2 and CAS-safe', async () => {
  const state=await (await get('state')).json();
  const icon=state.assets.find(asset=>asset.builtin&&asset.slot==='icon');
  assert.equal(icon.editableSrc,'/favicon.svg');
  const opened=await get('managed-svg?id='+encodeURIComponent(icon.id));
  assert.equal(opened.status,200,await opened.clone().text());
  const original=await opened.json();
  assert.match(original.svg,/^<svg/); assert.equal(original.version,icon.version);
  const changed=original.svg.replace('#ffda44','#00aa88');
  const saved=await post('managed-svg',{id:icon.id,baseVersion:original.version,svg:changed});
  assert.equal(saved.status,200,await saved.clone().text());
  const result=await saved.json(); assert.equal(result.asset.version,original.version+1); assert.match(result.svg,/#00aa88/);
  assert.ok(result.asset.managedAssetId);
  const object=await (await runtime.mf.getR2Bucket('CMS_MEDIA')).get(`managed-svg/${result.asset.managedAssetId}.svg`);
  assert.ok(object); assert.match(await object.text(),/#00aa88/);
  const stale=await post('managed-svg',{id:icon.id,baseVersion:original.version,svg:changed});
  assert.equal(stale.status,409);
  const unsafe=await post('managed-svg',{id:icon.id,baseVersion:result.asset.version,svg:'<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>'});
  assert.equal(unsafe.status,422);
  assert.equal((await runtime.mf.dispatchFetch(runtime.url+`/media/${result.asset.managedAssetId}.svg`)).status,404);
});
