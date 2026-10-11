import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { HttpError, readBytes } from '../src/cms/http.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { seed } from '../.generated/cms-seed.mjs';
import { Draft } from '../src/cms/client/draft.mjs';
import { ApiError } from '../src/cms/client/api.mjs';
let runtime, cookie;
before(async()=>{runtime=await cmsRuntime();cookie='CF_Authorization='+await runtime.token();});
after(()=>runtime?.close());
const headers=()=>({Cookie:cookie,Origin:runtime.url,'Content-Type':'application/json','X-CMS-Request':'1'});
const request=attempt=>runtime.mf.dispatchFetch(runtime.url+'/admin/api/save',{method:'POST',headers:headers(),body:JSON.stringify(attempt)});
const state=async()=>(await runtime.mf.dispatchFetch(runtime.url+'/admin/api/state',{headers:headers()})).json();

const MAX_SAVE_JSON_BYTES = 8 * 1024 * 1024;

// The real Worker can reject an oversized Content-Length before the client has
// uploaded the body. A full 8 MiB undici upload races that early HTTP 413:
// Workerd may close the socket while undici is still writing (ECONNRESET).
// HTTP/1.1 Expect: 100-continue exercises the genuine authenticated endpoint
// while proving that the size guard rejects before any oversized bytes are sent.
async function rejectOversizedUpload(attempt) {
  const size = Buffer.byteLength(JSON.stringify(attempt));
  assert.ok(size > MAX_SAVE_JSON_BYTES, 'Fixture must exceed the real request limit');
  return new Promise((resolve, reject) => {
    const client = httpRequest(runtime.url+'/admin/api/save', {
      method: 'POST',
      headers: { ...headers(), 'Content-Length': String(size), Expect: '100-continue' },
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.once('error', reject);
      response.once('end', () => {
        client.destroy();
        resolve(new Response(Buffer.concat(chunks), { status: response.statusCode }));
      });
    });
    client.once('continue', () => client.destroy(new Error('Oversized upload unexpectedly accepted with HTTP 100 Continue')));
    client.once('error', reject);
    client.setTimeout(10000, () => client.destroy(new Error('Oversized upload rejection timed out')));
    client.flushHeaders();
  });
}

// The header-first integration test above is complemented by the actual
// streaming byte-limit test, including absent Content-Length and cancellation.
test('R4: streaming request bodies reject bytes over the limit without unbounded reads', async () => {
  const megabyte = new Uint8Array(1024 * 1024);
  let pulls = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      pulls++;
      controller.enqueue(megabyte);
    },
    cancel() { cancelled = true; },
  });
  const request = new Request('https://example.test/admin/api/save', {
    method: 'POST', body, duplex: 'half',
  });
  await assert.rejects(readBytes(request, MAX_SAVE_JSON_BYTES), error =>
    error instanceof HttpError && error.status === 413);
  assert.equal(cancelled, true, 'Over-limit stream must be cancelled');
  assert.ok(pulls <= 10, 'Server must stop consuming the oversized stream promptly');
});

for(const boundary of ['request-content-length','compressed-revision'])test(`R4: real ${boundary} rejection permits a corrected save and exact replay`,async()=>{
  const before=await state(), project=structuredClone(before.project);
  if(boundary==='request-content-length')project.pages[0].html='x'.repeat(8*1024*1024);
  else {
    const {contracts: _serverTemplateContracts, footerMigration: _temporaryMigrationContract, ...blankPage}=seed.blank;
    for(let i=0;i<5;i++)project.pages.push({...blankPage,id:`large-${i}`,sourceId:'blank',path:`/large-${i}/`,html:seed.blank.html.replace('</main>',`<p>${randomBytes(330000).toString('base64')}</p></main>`)});
  }
  const draft=new Draft(before.project,before.version);draft.change(project);const rejected=draft.beginSave();
  const response = boundary==='request-content-length'
    ? await rejectOversizedUpload(rejected)
    : await request(rejected);
  assert.equal(response.status,413,await response.clone().text());
  assert.equal((await state()).version,before.version);
  draft.rejectSave(new ApiError(await response.text(),response.status));
  assert.equal(draft.pendingSave,null,'A recovered draft must not resurrect a definitively rejected attempt');
  const repairedProject=structuredClone(before.project);repairedProject.pages[0].description+=' corrected';draft.change(repairedProject);
  const repaired=draft.beginSave();assert.notEqual(repaired.requestId,rejected.requestId);
  const first=await request(repaired);assert.equal(first.status,200,await first.clone().text());
  const second=await request(repaired);assert.equal(second.status,200,await second.clone().text());
  assert.equal((await first.json()).version,before.version+1);assert.equal((await second.json()).version,before.version+1);
  assert.equal((await state()).version,before.version+1);
});
