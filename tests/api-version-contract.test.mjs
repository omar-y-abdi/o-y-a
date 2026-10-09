import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const origin = 'https://omaryusuf.se';
const local = () => ({ ASSETS: { fetch: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/data/cards.json') return Response.json([{id:'k1',flavor:'kind',text:'Test'}]);
  if (path === '/') return new Response('<main><h1>Omar Yusuf</h1></main>', { headers: { 'Content-Type':'text/html; charset=utf-8' }});
  return new Response('Not found',{status:404});
} } });
const worker = async () => (await import('../src/worker.mjs')).default;

test('document all seven real operations with a typed, optional major API-Version header', () => {
  const doc = JSON.parse(readFileSync('dist/openapi.json','utf8'));
  const operations = Object.entries(doc.paths).flatMap(([path, methods]) =>
    Object.entries(methods).filter(([method]) => ['get','post'].includes(method))
      .map(([method, op]) => ({ path, method, op })));
  assert.equal(operations.length, 7);
  for (const {path,method,op} of operations) {
    const param = op.parameters?.find(p => p.name === 'API-Version' && p.in === 'header');
    assert.ok(param, method+' '+path+' must have API-Version');
    assert.equal(param.required,false);
    assert.deepEqual(param.schema?.enum,['1']);
    assert.equal(param.schema?.type,'string');
    assert.ok(param.description?.length > 40);
    for(const response of Object.values(op.responses)) {
      assert.equal(response.headers?.['API-Version']?.schema?.const,'1',method+' '+path);
    }
  }
  assert.match(doc.info.description,/deprecat|version/i);
});

test('the public read API defaults to v1, honours an explicit v1 and echoes the effective version', async () => {
  const app=await worker();
  for(const path of ['/api/config','/api/contact/config','/data/cards.json']) {
    for(const sent of [null,'1']) {
      const headers=sent?{'API-Version':sent}:{};
      const response=await app.fetch(new Request(origin+path,{headers}),local());
      assert.equal(response.status,200,path);
      assert.equal(response.headers.get('API-Version'),'1',path);
      assert.match(response.headers.get('Vary'),/\bAPI-Version\b/);
      assert.ok(response.headers.get('Link')?.includes('rel="deprecation"'));
      assert.ok((await response.json())!==undefined);
    }
  }
});

test('unsupported API versions get structured errors without invoking an API operation', async () => {
  const app=await worker();
  let touched=0;
  const bindings=local();
  bindings.ASSETS.fetch=async()=>{ touched++; throw new Error('should not access assets'); };
  for(const path of ['/api/config','/api/contact','/api/event','/data/cards.json']) {
    const response=await app.fetch(new Request(origin+path,{headers:{'API-Version':'2'}}),bindings);
    assert.equal(response.status,400,path);
    const body=await response.json();
    assert.equal(body.code,'UNSUPPORTED_API_VERSION');
    assert.ok(typeof body.hint==='string' && body.hint.includes('1'));
    assert.equal(response.headers.get('API-Version'),'1');
  }
  assert.equal(touched,0);
});

test('versioned HEAD stays empty and HTML/admin requests do not acquire an API version', async()=>{
  const app=await worker();
  const head=await app.fetch(new Request(origin+'/api/config',{method:'HEAD',headers:{'API-Version':'1'}}),local());
  assert.equal(head.status,200);
  assert.equal(head.headers.get('API-Version'),'1');
  assert.equal(await head.text(),'');
  const homepage=await app.fetch(new Request(origin+'/',{headers:{Accept:'text/html'}}),local());
  assert.equal(homepage.headers.has('API-Version'),false);
});

test('real agent instructions and developer portal describe v1, deprecation policy and callable examples',()=>{
  const llms=readFileSync('dist/llms.txt','utf8');
  assert.match(llms,/## When to use this site/);
  assert.match(llms,/\/openapi\.json/);
  assert.match(llms,/\/projekt\/furl\//);
  const html=readFileSync('dist/developers/index.html','utf8');
  assert.match(html,/API-Version/);
  assert.match(html,/Deprecation/);
  assert.match(html,/Sunset/);
  assert.match(html,/curl/);
});

test('homepage discovers genuine human and machine API documentation through RFC 8631 Link relations',async()=>{
  const app=await worker();
  for(const accept of ['text/html','text/markdown']){
    const response=await app.fetch(new Request(origin+'/',{headers:{Accept:accept}}),local());
    const link=response.headers.get('Link')||'';
    assert.match(link,/<\/developers\/>; rel="service-doc"; type="text\/html"/);
    assert.match(link,/<\/openapi.json>; rel="service-desc"; type="application\/json"/);
  }
});
