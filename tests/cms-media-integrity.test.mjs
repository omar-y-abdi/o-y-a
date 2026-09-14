import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from 'node:zlib';
import { digest } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { decodeRaster } from '../src/cms/raster-integrity.mjs';
import { inspectAsset } from '../src/cms/assets.mjs';
import { initial } from '../.generated/cms-seed.mjs';

const runtime = await cmsRuntime();
after(() => runtime.close());
const cookie = 'CF_Authorization=' + await runtime.token();
async function upload(bytes, id = crypto.randomUUID()) {
  const response = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/upload', { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/octet-stream', 'X-CMS-Upload-Id': id, 'X-CMS-Filename': 'fixture.png' }, body: bytes });
  return { response, id };
}
async function submit(project) {
  const state = await (await runtime.mf.dispatchFetch(runtime.url+'/admin/api/state',{headers:{Cookie:cookie}})).json();
  return runtime.mf.dispatchFetch(runtime.url+'/admin/api/save',{method:'POST',headers:{Cookie:cookie,Origin:runtime.url,'X-CMS-Request':'1','Content-Type':'application/json'},body:JSON.stringify({project,baseVersion:state.version,requestId:crypto.randomUUID()})});
}

test('R16: header-only PNG is rejected before registration or R2 storage', async () => {
  const bytes=Buffer.from('89504e470d0a1a0a0000000d494844520000000200000002080600000000000000','hex');
  const {response,id}=await upload(bytes);
  assert.equal(response.status,422,await response.text());
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_media WHERE id=?').bind(id).first(),null);
  assert.equal(await (await runtime.mf.getR2Bucket('CMS_MEDIA')).head(id+'.png'),null);
});

for(const [format,base64] of Object.entries(rasterFixtures)) {
  test(`R16: genuine ${format} decodes, preserves bytes and publishes; truncated container is rejected`,async()=>{
    const bytes=Buffer.from(base64,'base64');
    const {response}=await upload(bytes);assert.equal(response.status,201,await response.clone().text());
    const asset=await response.json();const project=structuredClone(initial);
    project.pages[0].html=project.pages[0].html.replace('</main>',`<img src="${asset.src}" alt="A red square"></main>`);
    const saved=await submit(project);assert.equal(saved.status,200,await saved.text());
    const publicImage=await runtime.mf.dispatchFetch(runtime.url+asset.src);
    assert.equal(publicImage.status,200);assert.deepEqual(Buffer.from(await publicImage.arrayBuffer()),bytes);
    const rejected=await upload(bytes.subarray(0,bytes.length-2));assert.equal(rejected.response.status,422,await rejected.response.text());
  });
}

test('R16: a PNG with intact container but corrupt compressed data must not pass header validation',async()=>{
  const bytes=Buffer.from(rasterFixtures.png,'base64');let offset=8;
  while(offset<bytes.length){const size=bytes.readUInt32BE(offset);if(bytes.toString('ascii',offset+4,offset+8)==='IDAT'){bytes[offset+8]^=0xff;bytes.writeUInt32BE(crc32(bytes.subarray(offset+4,offset+8+size)),offset+8+size);break;}offset+=size+12;}
  const {response}=await upload(bytes);assert.equal(response.status,422,await response.text());
});


test('R16: legacy unverified images are checked before promotion, not grandfathered in',async()=>{
  for(const valid of [false,true]){
    const id=crypto.randomUUID(), key=id+'.png';
    const bytes=valid?Buffer.from(rasterFixtures.png,'base64'):Buffer.from('89504e470d0a1a0a0000000d494844520000000200000002080600000000000000','hex');
    await (await runtime.mf.getR2Bucket('CMS_MEDIA')).put(key,bytes);
    await runtime.db.prepare('INSERT INTO cms_media(id,object_key,name,mime,bytes,width,height,alt,sha256,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,key,'Legacy','image/png',bytes.length,valid?16:2,valid?16:2,'A square',await digest(bytes),new Date().toISOString()).run();
    const project=structuredClone(initial);project.pages[0].html=project.pages[0].html.replace('</main>',`<img src="/media/${key}" alt="Legacy square"></main>`);
    const response=await submit(project);assert.equal(response.status,valid?200:422,await response.text());
    const stored=await runtime.db.prepare('SELECT validation_version,published_at FROM cms_media WHERE id=?').bind(id).first();
    assert.equal(stored.validation_version,valid?1:0);assert.equal(Boolean(stored.published_at),valid);
  }
});


test('R16: decoder configuration, quota and service errors are not blamed on the uploaded image',async()=>{
  const bytes=Buffer.from(rasterFixtures.png,'base64'), info=inspectAsset(bytes);
  await assert.rejects(decodeRaster({},bytes,info),error=>error.status===503);
  for(const code of [9401,9422,9432,9529]){
    const original=Object.assign(new Error('Images service unavailable'),{code});
    const env={CMS_IMAGES:{input(){return {transform(){return {output(){throw original;}};}};}}};
    await assert.rejects(decodeRaster(env,bytes,info),error=>error===original);
  }
});
