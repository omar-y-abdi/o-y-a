import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { replaceResource, resourceReferences, resourceCatalog } from '../src/cms/resources.mjs';
import { publicationChunks, PUBLIC_BIND_LIMIT, PUBLIC_ROW_LIMIT, publishSite, readPublicData } from '../src/cms/store.mjs';
import { uploadAsset } from '../src/cms/assets.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { acknowledgment } from '../src/server/emails.mjs';
import { defaultResources } from '../src/content/resources.mjs';
import { Draft } from '../src/cms/client/draft.mjs';
import { ApiError } from '../src/cms/client/api.mjs';

let runtime;
before(async()=>{ runtime=await cmsRuntime(); });
after(async()=>runtime?.close());
const bytes=value=>Buffer.byteLength(value);
async function responseStatus(promise) {
 const response=await promise;
 try { return response.status; }
 finally { await response.body?.cancel().catch(()=>{}); }
}


test('R4: definitive errors discard a rejected attempt; unknown outcomes replay immutable bytes',()=>{
 for(const status of [0,200,408,500,502,503,504,400,401,403,409,413,415,422,429]){
  const draft=new Draft({text:'old'},3); draft.change({text:'sent'});const attempt=draft.beginSave();
  draft.change({text:'new'});draft.rejectSave(new ApiError('failure',status));const next=draft.beginSave();
  if(status>=400&&status<500&&status!==408){assert.notEqual(next.requestId,attempt.requestId);assert.equal(next.project.text,'new');}
  else {assert.equal(next,attempt);assert.equal(next.project.text,'sent');}
 }
});

test('R2: incomplete safe drafts recover, while browser-active HTML and unsafe CSS still fail',()=>{
 const draft=structuredClone(initial);draft.pages[0].title='';draft.pages[0].description='valuable work';
 draft.pages[0].html=draft.pages[0].html.replace('</main>','<a href="/unfinished-link">Work in progress</a></main>');
 assert.throws(()=>validateProject(draft,seed));
 assert.equal(validateProject(draft,seed,null,{publication:false}).pages[0].title,'');
 for(const property of ['html','css']){
  const unsafe=structuredClone(draft); unsafe.pages[0][property]+=property==='html'?'<img src=x onerror=alert(1)>':'body{background:url(https://evil.example/x)}';
  assert.throws(()=>validateProject(unsafe,seed,null,{publication:false}));
 }
});

test('R6: typed font and image replacement covers CSS escapes and editor DTOs without rewriting literal prose',()=>{
 const old={id:crypto.randomUUID(),mime:'font/woff2'};old.src=`/media/${old.id}.woff2`;
 const next={id:crypto.randomUUID(),mime:'font/woff2'};next.src=`/media/${next.id}.woff2`;
 const name=`cms-font-${old.id}`,newName=`cms-font-${next.id}`;
 const project={theme:{fontFamily:name},resources:defaultResources,cards:[],pages:[{html:`<main><p style='font-family:"${name}"'>Literal ${name}</p></main>`,css:`.heading{font-family:"${name}"}.escaped{font-family:"\\63 ms-font-${old.id}"}.literal::before{content:"${name}"}`,project:{pages:[{component:{tagName:'p',style:{'font-family':name},components:[{type:'textnode',content:`Literal ${name}`}]} } ]}}]};
 const replaced=replaceResource(project,old,next).project;
 assert.equal(replaced.theme.fontFamily,newName);
 assert.match(replaced.pages[0].html,new RegExp(newName));assert.match(replaced.pages[0].html,new RegExp('Literal '+name));
 assert.match(replaced.pages[0].css,new RegExp('content:"'+name+'"'));assert.ok(!replaced.pages[0].css.includes('font-family:"'+name+'"'));
 assert.equal(replaced.pages[0].project.pages[0].component.style['font-family'],newName);
 assert.equal(replaced.pages[0].project.pages[0].component.components[0].content,'Literal '+name);
 assert.equal(resourceReferences(replaced).has(old.src),false);assert.equal(resourceReferences(replaced).has(next.src),true);
});

test('R6/R7: font and all global resource slots publish registered immutable objects and restore older assignments',async()=>{
 const env={CMS_DB:runtime.db,CMS_MEDIA:await runtime.mf.getR2Bucket('CMS_MEDIA'),CMS_IMAGES:await runtime.mf.getImagesBinding('CMS_IMAGES')};
 const font=await uploadAsset(env,{id:crypto.randomUUID(),bytes:new Uint8Array(await readFile('tests/fixtures/dm-sans-latin-400-normal.woff2')),name:'Font.woff2'});
 const image=await uploadAsset(env,{id:crypto.randomUUID(),bytes:new Uint8Array(await readFile('public/social/omar-yusuf.png')),name:'Image.png',alt:'Versioned alt'});
 const original=validateProject(structuredClone(initial),seed);const project=structuredClone(original);
 project.theme.fontFamily=`cms-font-${font.id}`;project.resources=Object.fromEntries(Object.keys(defaultResources).map(key=>[key,image.src]));
 const first=await publishSite(runtime.db,{project,baseVersion:0,requestId:crypto.randomUUID(),actor:'owner@example.test'});
 for(const asset of [font,image])assert.equal(await responseStatus(runtime.mf.dispatchFetch('https://omaryusuf.se'+asset.src)),200);
 const head=await (await runtime.mf.dispatchFetch('https://omaryusuf.se/')).text();
 assert.match(head,new RegExp('rel="apple-touch-icon" href="'+image.src+'"'));const style=await (await runtime.mf.dispatchFetch(`https://omaryusuf.se/cms-public/v${first.version}/home.css`)).text();assert.match(style,new RegExp('font-family:"cms-font-'+font.id+'"'));
 const slots=(await readPublicData(runtime.db,'resources')).value;
 assert.match(acknowledgment({resources:slots}).html,new RegExp(image.src));assert.match(acknowledgment({resources:slots}).html,/Versioned alt/);
 assert.equal(slots.social.width,1200);assert.equal(slots.social.height,630);
 await publishSite(runtime.db,{project:original,baseVersion:first.version,requestId:crypto.randomUUID(),actor:'owner@example.test'});
 assert.equal((await readPublicData(runtime.db,'resources')).value.icon.src,defaultResources.icon);
 assert.equal(await responseStatus(runtime.mf.dispatchFetch('https://omaryusuf.se'+image.src)),200,'Historical media must remain available');
});

test('R5: UTF-8 rows and JSON bind chunks have independent enforced byte budgets',()=>{
 const project={theme:{},cards:[],runtime:{},pages:[{path:'/',html:'漢'.repeat(Math.floor(PUBLIC_ROW_LIMIT/3)),css:''}]};
 assert.throws(()=>publicationChunks(project),error=>error.status===413);
 project.pages=Array.from({length:10},(_,i)=>({path:`/${i}/`,html:'漢'.repeat(130000),css:''}));
 const chunks=publicationChunks(project);assert.ok(chunks.length>1);
 for(const chunk of chunks)assert.ok(bytes(JSON.stringify(chunk))<=PUBLIC_BIND_LIMIT);
 assert.ok(chunks.length+8<50,'Publication must fit even the Free D1 query budget');
});

test('resource catalog keeps built-in identity separate from a replacement slot value',()=>{
  const builtin={id:'builtin-social',builtin:true,slot:'social',src:'/social/original.png',name:'Social',alt:'Edited alt',mime:'image/png',width:1200,height:630,version:4,state:'active'};
  const upload={id:'123e4567-e89b-42d3-a456-426614174000',src:'/media/123e4567-e89b-42d3-a456-426614174000.png',name:'Replacement',alt:'Upload alt',mime:'image/png',width:100,height:100,state:'active'};
  const project={resources:{...defaultResources,social:upload.src}};
  const result=resourceCatalog({assets:[builtin]},[upload],project);
  const stable=result.find(asset=>asset.id===builtin.id);
  assert.equal(stable.src,'/social/original.png');
  assert.equal(stable.alt,'Edited alt');
  assert.equal(stable.version,4);
});
