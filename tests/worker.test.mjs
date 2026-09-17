import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const origin = 'https://omaryusuf.se';
async function worker() {
  assert.ok(existsSync('src/worker.mjs'), 'Cloudflare worker must exist');
  return (await import('../src/worker.mjs')).default;
}
const request = (body, more = {}) => new Request(origin + '/api/event', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: 'oy_privacy=v1.allow', 'X-OY-Consent': 'v1', ...more }, body: typeof body === 'string' ? body : JSON.stringify(body) });
function env() { const points = []; return { points, ANALYTICS_ENABLED:'true', ANALYTICS: { writeDataPoint(point) { points.push(point); } }, ASSETS: { fetch: async () => new Response('<h1>Page</h1>', { headers: { 'Content-Type': 'text/html' } }) } }; }
test('edge accepts only a consented known event and stores no identity', async () => {
  const app = await worker(); const bindings = env();
  const response = await app.fetch(request({ event: 'joy', page: '/verkstad/' }), bindings);
  assert.equal(response.status, 204);
  assert.deepEqual(bindings.points, [{ blobs: ['/verkstad/', 'joy'], doubles: [1], indexes: ['site'] }]);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('edge refuses unknown data, origins, missing consent and privacy signals', async () => {
  const app = await worker();
  for (const [body, headers] of [
    [{ event:'joy',page:'/verkstad/',email:'private@example.com'}, {}],
    [{ event:'joy',page:'/?email=private@example.com'}, {}],
    [{ event:'arbitrary',page:'/'}, {}],
    [{ event:'joy',page:'/'}, { Origin:'https://evil.example' }],
    [{ event:'joy',page:'/'}, { Cookie:'oy_privacy=v1.deny' }],
    [{ event:'joy',page:'/'}, { 'Sec-GPC':'1' }],
    [{ event:'joy',page:'/'}, { DNT:'1' }],
    [{ event:'joy',page:'/'}, { 'X-OY-Consent':'' }],
    ['{broken json', {}], ['x'.repeat(400), {}],
  ]) {
    const bindings = env(); const response = await app.fetch(request(body, headers), bindings);
    assert.ok(response.status >= 400, `Unexpected acceptance: ${JSON.stringify(body)}`);
    assert.equal(bindings.points.length, 0);
  }
});
test('stats do not silently succeed without a dataset', async () => {
  const app = await worker(); const response = await app.fetch(request({event:'joy',page:'/'}), {});
  assert.equal(response.status, 503);
});
test('WWW and HTTP redirect to one canonical HTTPS origin, path and query preserved', async () => {
  const app = await worker();
  for (const url of ['https://www.omaryusuf.se/verkstad/?kort=k01','http://omaryusuf.se/verkstad/?kort=k01']) {
    const response = await app.fetch(new Request(url), env());
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), origin + '/verkstad/?kort=k01');
  }
});
test('unknown hosts cannot act as a canonical open redirect', async () => {
  const app = await worker(); const response = await app.fetch(new Request('https://evil.example/contact'), env());
  assert.equal(response.status, 421);
});
test('asset responses receive security headers without losing status', async () => {
  const app = await worker(); const bindings = env(); bindings.ASSETS.fetch = async () => new Response('Not found', { status:404 });
  const response = await app.fetch(new Request(origin + '/missing'), bindings);
  assert.equal(response.status, 404);
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('streaming event body is bounded without trusting Content-Length', async () => {
  const app = await worker();
  const make = data => new Request(origin+'/api/event', {
    method:'POST',duplex:'half',
    headers:{Origin:origin,'Content-Type':'application/json',Cookie:'oy_privacy=v1.allow','X-OY-Consent':'v1'},
    body:new ReadableStream({start(controller){for(const chunk of data)controller.enqueue(new TextEncoder().encode(chunk));controller.close();}}),
  });
  const bindings=env();
  const oversized=await app.fetch(make(['{"event":"joy","page":"/', 'x'.repeat(300), '"}']),bindings);
  assert.equal(oversized.status,413);
  assert.equal(bindings.points.length,0);
  const valid=await app.fetch(make(['{"event":"joy",','"page":"/"}']),bindings);
  assert.equal(valid.status,204);
});

test('API methods, content type and duplicate consent cookies fail closed', async () => {
  const app=await worker();
  for (const [url, method, expected] of [
    ['/api/event','GET',405],['/api/config','POST',405],['/','POST',405],['/','DELETE',405],
  ]) {
    const response=await app.fetch(new Request(origin+url,{method}),env());
    assert.equal(response.status,expected);
    assert.ok(response.headers.get('Allow'));
  }
  for(const headers of [
    {'Content-Type':'text/plain'},
    {Cookie:'oy_privacy=v1.allow; oy_privacy=v1.deny'},
    {Origin:''},
  ]) {
    const bindings=env();
    const response=await app.fetch(request({event:'joy',page:'/'},headers),bindings);
    assert.ok(response.status>=400);
    assert.equal(bindings.points.length,0);
  }
});

test('HEAD, asset faults, map leaks and analytics faults have safe responses', async () => {
  const app=await worker();const bindings=env();
  const head=await app.fetch(new Request(origin+'/',{method:'HEAD'}),bindings);
  assert.equal(await head.text(),'');
  assert.equal(head.status,200);
  const config=await app.fetch(new Request(origin+'/api/config'),{});
  assert.deepEqual(await config.json(),{analytics:false});
  for(const path of ['/.env','/.git/config','/assets/main.mjs.map']) {
    const response=await app.fetch(new Request(origin+path),bindings);
    assert.equal(response.status,404);
  }
  bindings.ASSETS.fetch=async()=>{throw new Error('private internal detail');};
  const response=await app.fetch(new Request(origin+'/'),bindings);
  assert.equal(response.status,503);
  assert.ok(!(await response.text()).includes('private'));
  bindings.ANALYTICS.writeDataPoint=()=>{throw new Error('dataset internal detail');};
  assert.equal((await app.fetch(request({event:'joy',page:'/'}),bindings)).status,503);
});

test('an analytics binding alone never enables collection without the explicit launch flag', async () => {
  const app=await worker();const bindings=env();delete bindings.ANALYTICS_ENABLED;
  const config=await app.fetch(new Request(origin+'/api/config'),bindings);
  assert.deepEqual(await config.json(),{analytics:false});
  const response=await app.fetch(request({event:'joy',page:'/'}),bindings);
  assert.equal(response.status,503);
  assert.equal(bindings.points.length,0);
});

test('direct custom 404 page keeps an error status even when the asset binding serves the file as 200', async () => {
  const app=await worker();const bindings=env();
  for(const method of ['GET','HEAD']) {
    const response=await app.fetch(new Request(origin+'/404.html',{method}),bindings);
    assert.equal(response.status,404);
    if(method === 'HEAD') assert.equal(await response.text(),'');
    else assert.equal(await response.text(),'<h1>Page</h1>');
  }
  bindings.ASSETS.fetch=async()=>new Response('Unavailable',{status:503});
  assert.equal((await app.fetch(new Request(origin+'/404.html'),bindings)).status,503);
});
