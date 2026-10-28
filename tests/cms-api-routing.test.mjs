import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { nodeWorker, nodeCms } from './helpers/cms-node.mjs';
import { initial } from '../.generated/cms-seed.mjs';
import { readSite } from '../src/cms/store.mjs';
import { handleEmailAdmin } from '../src/cms/email-api.mjs';
import { errorResponse } from '../src/cms/http.mjs';
import { ADMIN_CSP } from '../src/cms/render.mjs';

const origin = 'https://omaryusuf.se';
const identity = { email: 'owner@example.test', subject: 'routing-fixture' };
const MIB = 1024 * 1024;
const genericWrites = [
  ['cpu-migration', 4096], ['migrate-frame', 4096], ['managed-svg', 16 * MIB],
  ['asset-usage', 1024], ['asset-metadata', 16 * MIB], ['asset-lifecycle', 16 * MIB],
  ['replace-resource', 16 * MIB], ['recover', 16 * MIB], ['validate', 8 * MIB],
  ['preview', 8 * MIB], ['save', 8 * MIB],
];
const mailWrites = [
  ['contact', 8192], ['mail/test', MIB], ['mail/send', MIB],
  ['mail/cancel', 1024], ['mail/attachment-remove', 1024], ['mail/attachment', null],
];
const writeHeaders = { Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' };
const messages = {
  method: 'Den här åtgärden kräver POST.', origin: 'Begäran måste komma från den inloggade editorn.',
  type: 'Begäran har fel innehållstyp.', missing: 'Åtgärden finns inte.', storage: 'Studions lagring är inte tillgänglig.',
  size: 'Innehållet är för stort.', json: 'Innehållet måste vara giltig JSON i UTF-8.',
};
let runtime, token, app, local;
before(async () => {
  runtime = await cmsRuntime({ project: initial });
  token = await runtime.token();
  app = await nodeWorker();
  local = await nodeCms(initial, app, 1);
});
after(async () => { local?.close(); await runtime?.close(); });

function request(path, { method = 'POST', headers = {}, body = '{' } = {}) {
  return new Request(origin + path, {
    method, headers: { ...writeHeaders, 'Cf-Access-Jwt-Assertion': 'cpu-test', ...headers },
    ...(!['GET', 'HEAD'].includes(method) && body !== undefined ? { body, ...(body instanceof ReadableStream ? { duplex: 'half' } : {}) } : {}),
  });
}
function real(path, { method = 'GET', headers = {}, body } = {}) {
  return runtime.mf.dispatchFetch(origin + path, { method, headers: { ...writeHeaders, 'Cf-Access-Jwt-Assertion': token, ...headers }, ...(body === undefined ? {} : { body }) });
}
async function rejected(response, status, message) {
  const body = await response.text();
  assert.equal(response.status, status, body);
  const data = JSON.parse(body);
  assert.equal(data.error, message);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return data;
}
function blockedEnvironment() {
  const effects = [];
  const stop = name => { effects.push(name); throw new Error(`Unexpected ${name}`); };
  return { effects, env: { CMS_DB: { prepare: () => stop('D1') }, CMS_MEDIA: { put: () => stop('R2 put'), delete: () => stop('R2 delete') } } };
}
async function mail(request, env, effects) {
  try {
    return await handleEmailAdmin(request, env, {
      identity, url: new URL(request.url), now: () => Date.parse('2026-10-28T12:00:00Z'),
      head: async () => { effects.push('head'); throw new Error('Unexpected head'); },
      transport: async () => { effects.push('provider'); throw new Error('Unexpected provider'); },
    });
  } catch (error) { return errorResponse(error, 'mail'); }
}

test('signed Worker keeps Access ahead of shell, every admin write family and unknown routes', async () => {
  const paths = ['/admin', '/admin/', '/admin/api', '/admin/assets/absent.mjs', '/admin/api/state', '/admin/api/absent', ...genericWrites.map(([path]) => '/admin/api/' + path), '/admin/api/upload', ...mailWrites.map(([path]) => '/admin/api/' + path)];
  for (const path of paths) {
    const response = await real(path, { method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': '', Origin: 'https://other.test', 'Content-Type': 'text/plain' }, body: '{' });
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('content-security-policy'), ADMIN_CSP);
    assert.doesNotMatch(await response.text(), /owner@example|schemaVersion|Unexpected/);
  }
});

test('Worker rejects encoded admin path variants before authentication and preserves HEAD stripping', async () => {
  const paths = ['/%61dmin/api/state', '/admin/api/%73tate', '/admin/api/revision/%30', '/admin/api/revision/%2F0', '/admin/api/revision/%2530', '/admin//api/state', '/admin/api/revision/0%5C'];
  for (const path of paths) for (const method of ['GET', 'HEAD', 'POST']) {
    const response = await real(path, { method, headers: { 'Cf-Access-Jwt-Assertion': '' }, ...(method === 'POST' ? { body: '{' } : {}) });
    assert.equal(response.status, 400, `${method} ${path}`);
    // This pre-admin branch returns before the ordinary admin HEAD handling.
    // Check its status here; ordinary admin HEAD/body behavior is pinned below.
    if (method !== 'HEAD') assert.equal((await response.json()).error, 'Non-canonical path');
  }
  for (const path of ['/admin/api/state', '/admin/api/history', '/admin/api/revision/0', '/admin/api/absent', '/admin/api/mail/send']) {
    const get = await real(path), head = await real(path, { method: 'HEAD' });
    assert.equal(head.status, get.status, path);
    assert.equal(await head.text(), '', path);
    for (const header of ['content-type', 'cache-control', 'content-security-policy', 'x-robots-tag']) assert.equal(head.headers.get(header), get.headers.get(header), `${path} ${header}`);
    await get.arrayBuffer();
  }
});

test('real Worker dispatches every read family and keeps history/query validation', async () => {
  const cases = [
    ['state?unused=value', data => assert.equal(data.version, 1)],
    ['history', data => assert.deepEqual(data.items.map(item => item.version), [1])],
    ['assets?state=active&kind=image', data => { assert.deepEqual(data.items, []); assert.equal(data.total, 0); }],
    ['cpu-migration', data => { assert.equal(data.version, 1); assert.equal(data.actor, identity.email); }],
    ['contact', data => assert.equal(data.master, 'missing')],
    ['mail/sent', data => assert.deepEqual(data.items, [])],
  ];
  for (const [path, check] of cases) {
    const response = await real('/admin/api/' + path, { headers: { Origin: '', 'X-CMS-Request': '', 'Content-Type': '' } });
    assert.equal(response.status, 200, path);
    check(await response.json());
  }
  await rejected(await real('/admin/api/managed-svg?id=absent'), 404, 'Resursen har ingen redigerbar SVG-källa.');
  await rejected(await real('/admin/api/mail/status?id=absent'), 404, 'Utskicket finns inte i listan.');
  for (const cursor of ['0', '-1', '1.5', 'wrong', '9007199254740992']) await rejected(await real('/admin/api/history?before=' + cursor), 400, 'Historikmarkören är ogiltig.');
});

test('real Worker keeps revision strings distinct before numeric lookup, including oversized numbers', async () => {
  for (const [suffix, status, version] of [['0', 200, 0], ['00', 404], ['01', 200, 1], ['1', 200, 1], ['0001?unused=value', 200, 1], ['2', 404], ['9'.repeat(30), 404], ['-1', 404], ['+1', 404], ['1.0', 404], ['1/', 404], ['1/suffix', 404], ['', 404]]) {
    const response = await real('/admin/api/revision/' + suffix);
    assert.equal(response.status, status, suffix);
    const data = await response.json();
    if (status === 200) {
      assert.equal(data.version, version);
      if (suffix === '0') { assert.equal(data.createdAt, null); assert.deepEqual(data.project, initial); }
    } else assert.equal(data.error, /^\d+$/.test(suffix) ? 'Versionen finns inte.' : messages.missing);
  }
  // This range has no ingress safe-integer policy: preserve the actual D1
  // lookup/error contract, rather than inventing a 400 during route extraction.
  const overflow = '9'.repeat(400);
  let expected;
  try { expected = await readSite(runtime.db, Number(overflow)) ? 200 : 404; }
  catch { expected = 503; }
  const response = await real('/admin/api/revision/' + overflow);
  assert.equal(response.status, expected);
  if (expected === 404) assert.equal((await response.json()).error, 'Versionen finns inte.');
  else { assert.equal(expected, 503); assert.ok(response.headers.get('x-request-id')); assert.doesNotMatch(await response.text(), /Infinity|SELECT|cms_revisions/); }
});

test('every generic write retains method, origin and type guards before parsing or mutation', async () => {
  for (const [path] of [...genericWrites, ['upload']]) {
    const type = path === 'upload' ? 'application/octet-stream' : 'application/json';
    const cases = [
      ['PUT', {}, 405, messages.method], ['DELETE', {}, 405, messages.method], ['OPTIONS', {}, 405, messages.method],
      ['POST', { Origin: 'https://other.test' }, 403, messages.origin], ['POST', { 'X-CMS-Request': '' }, 403, messages.origin],
      ['POST', { 'Sec-Fetch-Site': 'cross-site' }, 403, messages.origin], ['POST', { 'Sec-Fetch-Site': 'same-site' }, 403, messages.origin],
      ['POST', { 'Content-Type': 'text/plain' }, 415, messages.type],
    ];
    for (const [method, headers, status, message] of cases) {
      const input = request('/admin/api/' + path, { method, headers: { 'Content-Type': type, ...headers } });
      local.queries.length = 0;
      const response = await app.fetch(input, local.env);
      await rejected(response, status, message);
      assert.equal(response.headers.get('allow'), null, `${method} ${path}`);
      assert.equal(input.bodyUsed, false, `${method} ${path}`);
      assert.deepEqual(local.queries, [], `${method} ${path}`);
    }
    // Actual signed workerd ingress must enforce the same origin boundary.
    await rejected(await real('/admin/api/' + path, { method: 'POST', headers: { Origin: 'https://other.test', 'Content-Type': type }, body: '{' }), 403, messages.origin);
  }
});

test('generic unknown routes and read paths retain write-check precedence without consuming a body', async () => {
  for (const path of ['absent', 'state', 'history', 'revision/1', 'assets', 'contact/', 'mail']) {
    for (const [method, headers, status, message] of [
      ['POST', {}, 404, messages.missing], ['POST', { Origin: 'https://other.test' }, 403, messages.origin],
      ['POST', { 'Content-Type': 'text/plain' }, 415, messages.type], ['PATCH', {}, 405, messages.method],
    ]) {
      const input = request('/admin/api/' + path, { method, headers });
      local.queries.length = 0;
      await rejected(await app.fetch(input, local.env), status, message);
      assert.equal(input.bodyUsed, false, `${method} ${path}`);
      assert.deepEqual(local.queries, [], `${method} ${path}`);
    }
  }
  for (const path of [...genericWrites.map(([path]) => path), 'upload']) {
    if (['cpu-migration', 'managed-svg'].includes(path)) continue;
    await rejected(await real('/admin/api/' + path), 404, messages.missing);
  }
});

test('D1 presence precedes generic dispatch, while authenticated shell and contact settings remain available', async () => {
  const calls = [], env = { ASSETS: { fetch: async input => { calls.push(input.url); return new Response('asset fixture'); } } };
  for (const path of ['/admin', '/admin/', '/admin/api', '/admin/assets/editor.mjs']) {
    const input = request(path);
    assert.equal(await (await app.fetch(input, env)).text(), 'asset fixture');
    assert.equal(input.bodyUsed, false);
  }
  assert.deepEqual(calls, ['/admin', '/admin/', '/admin/api', '/admin/assets/editor.mjs'].map(path => origin + path));
  for (const path of ['state', 'absent', 'save', 'upload', 'mail/absent', 'mail/send', 'contact/']) for (const method of ['GET', 'POST', 'PATCH']) {
    const input = request('/admin/api/' + path, { method, headers: { Origin: 'https://other.test' } });
    await rejected(await app.fetch(input, env), 503, messages.storage);
    assert.equal(input.bodyUsed, false);
  }
  const contact = await app.fetch(request('/admin/api/contact', { method: 'GET' }), env);
  assert.equal(contact.status, 200);
  assert.equal((await contact.json()).master, 'missing');
  await rejected(await app.fetch(request('/admin/api/contact'), env), 503, messages.storage);
});

test('direct mail adapter preserves known-write guards and unknown-route precedence', async () => {
  for (const [path, limit] of mailWrites) {
    const type = limit === null ? 'application/octet-stream' : 'application/json';
    for (const [method, headers, status, message] of [
      ['PATCH', {}, 405, messages.method], ['POST', { Origin: 'https://other.test' }, 403, messages.origin],
      ['POST', { 'X-CMS-Request': '' }, 403, messages.origin], ['POST', { 'Sec-Fetch-Site': 'cross-site' }, 403, messages.origin],
      ['POST', { 'Content-Type': 'text/plain' }, 415, messages.type],
      ...(path === 'contact' ? [] : [['GET', {}, 405, messages.method], ['HEAD', {}, 405, messages.method]]),
    ]) {
      const { env, effects } = blockedEnvironment();
      const input = request('/admin/api/' + path, { method, headers: { 'Content-Type': type, ...headers } });
      await rejected(await mail(input, env, effects), status, message);
      assert.equal(input.bodyUsed, false, `${method} ${path}`);
      assert.deepEqual(effects, []);
    }
  }
  for (const path of ['mail/absent', 'mail/sent', 'mail/status']) for (const method of ['POST', 'PATCH']) {
    const { env, effects } = blockedEnvironment();
    const input = request('/admin/api/' + path, { method, headers: { Origin: 'https://other.test', 'Content-Type': 'text/plain' } });
    await rejected(await mail(input, env, effects), 404, messages.missing);
    assert.equal(input.bodyUsed, false);
    assert.deepEqual(effects, []);
  }
  for (const method of ['GET', 'HEAD']) {
    const { env, effects } = blockedEnvironment();
    await rejected(await mail(request('/admin/api/mail/absent', { method }), env, effects), 404, messages.missing);
    assert.deepEqual(effects, []);
  }
  for (const method of ['GET', 'HEAD']) {
    const effects = [], response = await mail(request('/admin/api/contact', { method }), {}, effects);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).master, 'missing', 'The internal adapter does not strip HEAD; the Worker owns that boundary');
    assert.deepEqual(effects, []);
  }
});

test('every JSON write preserves its declared byte limit and fatal parser before domain work', async () => {
  for (const [path, limit] of [...genericWrites, ...mailWrites.filter(([, limit]) => limit !== null)]) {
    let pulls = 0;
    const stream = new ReadableStream({ pull(controller) { if (pulls++) controller.close(); else controller.enqueue(new TextEncoder().encode('{')); } }, { highWaterMark: 0 });
    const input = request('/admin/api/' + path, { headers: { 'Content-Length': String(limit + 1) }, body: stream });
    const { env, effects } = blockedEnvironment();
    try {
      await rejected(await app.fetch(input, env), 413, messages.size);
      assert.equal(pulls, 0, path);
      assert.equal(input.bodyUsed, false, path);
      assert.deepEqual(effects, [], path);
    } finally { await stream.cancel(); }
    for (const body of ['{', Uint8Array.of(0xc3, 0x28)]) {
      const malformed = request('/admin/api/' + path, { headers: { 'Content-Type': 'Application/JSON; charset=utf-8', 'Content-Length': String(limit) }, body });
      await rejected(await app.fetch(malformed, env), 400, messages.json);
      assert.equal(malformed.bodyUsed, true);
      assert.deepEqual(effects, []);
    }
    const absent = new Request(origin + '/admin/api/' + path, { method: 'POST', headers: { ...writeHeaders, 'Cf-Access-Jwt-Assertion': 'cpu-test' } });
    await rejected(await app.fetch(absent, env), 400, 'Innehåll saknas.');
    await rejected(await app.fetch(request('/admin/api/' + path, { body: '' }), env), 400, messages.json);
    assert.deepEqual(effects, []);
  }
});

test('binary upload checks retain metadata/master/declared-length precedence without reading a file', async () => {
  const cases = [
    ['upload', {}, { 'X-CMS-Filename': '%', 'Content-Length': String(10 * MIB + 1) }, 400, 'Filens uppgifter kunde inte läsas.'],
    ['upload', {}, { 'X-CMS-Filename': 'a.png', 'Content-Length': String(10 * MIB + 1) }, 413, messages.size],
    ['mail/attachment', {}, {}, 503, 'Huvudnyckeln saknas.'],
    ['mail/attachment', { CONTACT_HASH_SECRET: 'm'.repeat(48) }, {}, 411, 'Filens storlek saknas.'],
    ['mail/attachment', { CONTACT_HASH_SECRET: 'm'.repeat(48) }, { 'Content-Length': String(30 * MIB + 1) }, 413, 'Bilagan får vara högst 30 MB.'],
    ['mail/attachment', { CONTACT_HASH_SECRET: 'm'.repeat(48) }, { 'Content-Length': '1', 'X-CMS-Filename': '%' }, 400, 'Filens uppgifter kunde inte läsas.'],
  ];
  for (const [path, values, headers, status, message] of cases) {
    const { env, effects } = blockedEnvironment();
    const input = request('/admin/api/' + path, { headers: { 'Content-Type': 'application/octet-stream', ...headers }, body: Uint8Array.of(1) });
    await rejected(await app.fetch(input, { ...env, ...values }), status, message);
    assert.equal(input.bodyUsed, false, path);
    assert.deepEqual(effects, []);
  }
});

test('central errors retain sanitized operation labels and mail keeps table/uncertainty outcomes', async t => {
  const logs = [];
  t.mock.method(console, 'error', line => logs.push(JSON.parse(line)));
  const secret = 'SQLITE_ERROR private-draft-and-key';
  const env = { CMS_DB: { prepare() { throw new Error(secret); } } };
  for (const [path, method, body, operation] of [['state', 'GET', undefined, 'state'], ['asset-usage', 'POST', JSON.stringify({ id: crypto.randomUUID() }), 'admin']]) {
    const response = await app.fetch(request('/admin/api/' + path, { method, body }), env);
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.equal(response.headers.get('x-request-id'), data.requestId);
    assert.match(data.requestId, /^[0-9a-f-]{36}$/);
    assert.doesNotMatch(JSON.stringify(data), /SQLITE|private-draft|key/);
    assert.deepEqual(logs.at(-1), { event: 'cms_failure', requestId: data.requestId, operation, code: 'storage-d1' });
  }
  const effects = [], input = () => request('/admin/api/mail/send', { body: JSON.stringify({ requestId: crypto.randomUUID(), intentVersion: 2 }) });
  await rejected(await mail(input(), { CMS_DB: { prepare() { throw new Error('no such table: cms_mail_receipts'); } } }, effects), 503, 'Mejltabellerna saknas. Kör databasens migrering.');
  const pending = { resend_id: null, created_at: '2026-10-28T11:00:00Z', scheduled_at: null, sender: 'fixture' };
  const existing = { CMS_DB: { prepare() { return { bind() { return this; }, first: async () => pending }; } } };
  const response = await mail(input(), existing, effects);
  assert.equal(response.status, 422);
  assert.equal((await response.json()).details?.uncertain, true);
  assert.deepEqual(effects, []);
});

const revisionInputs = ['0', '00', '01', '0001', '1?query=yes', '9'.repeat(30), '9'.repeat(400), '-1', '+1', '1.0', '1/', '1/suffix', '', '%30', '%2F0', '%2530', '１', '0#hash'].map(value => '/admin/api/revision/' + value);
revisionInputs.push('/admin//api/revision/1', '/admin/api/revision/../1', '/ADMIN/api/revision/1');
const nativeRevisionProbe = function (inputs) {
  const pattern = new URLPattern({ pathname: '/admin/api/revision/:version(\\d+)' });
  return inputs.map(input => {
    const pathname = new URL(input, 'https://omaryusuf.se').pathname;
    return { pathname, previous: pathname.match(/^\/admin\/api\/revision\/(\d+)$/)?.[1] ?? null, native: pattern.exec({ pathname })?.pathname.groups.version ?? null };
  });
};
test('candidate native revision pattern preserves the existing pathname matcher in Node and workerd', async () => {
  const expected = nativeRevisionProbe(revisionInputs);
  for (const row of expected) assert.equal(row.native, row.previous, row.pathname);
  const probe = new Miniflare(convertV4MiniflareOptions({
    host: '127.0.0.1', port: 0, modules: true, compatibilityDate: '2026-09-11',
    script: `const probe = ${nativeRevisionProbe.toString()}; export default { async fetch(request) { return Response.json(probe(await request.json())); } };`,
  }));
  try {
    const response = await probe.dispatchFetch('https://probe.test/', { method: 'POST', body: JSON.stringify(revisionInputs) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expected);
  } finally { await probe.dispose(); }
});
