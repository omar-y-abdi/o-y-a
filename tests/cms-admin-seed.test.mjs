import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { build } from 'esbuild';
import { built, seedAsset } from '../.generated/cms-build.mjs';
import { seed, initial, built as originalBuilt, legacyInitial } from '../.generated/cms-seed.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { seedRuntime } from './helpers/seed-runtime.mjs';
import { nodeWorker, nodeCms } from './helpers/cms-node.mjs';
import { readSite, publishSite } from '../src/cms/store.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
import { frameMigration } from '../scripts/cms-migrate-frame.mjs';
import { prepareCpuArtifact, readCpuSource, stageCpuArtifact } from '../scripts/cms-cpu-artifact.mjs';
import { cpuMigrationStatus } from '../src/cms/cpu-migration.mjs';
import { baseInitial, baseSeed, baseValidate, basePublish } from './helpers/base-worker.mjs';

const bytes = await readFile('dist' + seedAsset.path);
const hash = value => createHash('sha256').update(value).digest('hex');
const changedDefinitions = JSON.parse(bytes.toString());
const description = changedDefinitions.initial.pages[0].description;
assert.match(description, /^[\x20-\x7e]/, 'The corruption fixture changes one ASCII character without changing UTF-8 length');
changedDefinitions.initial.pages[0].description = (description[0] === 'X' ? 'Y' : 'X') + description.slice(1);
const changedBytes = Buffer.from(JSON.stringify(changedDefinitions));
const origin = 'https://omaryusuf.se';
const freshLoader = async () => (await import(`../src/cms/admin-seed.mjs?fixture=${crypto.randomUUID()}`)).loadAdminSeed;
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const successful = async response => { assert.equal(response.status, 200, await response.clone().text()); return response.json(); };
const request = (path, token, body) => new Request(origin + path, {
  headers: { 'Cf-Access-Jwt-Assertion': token, Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
});
const realGet = (runtime, path, token) => runtime.mf.dispatchFetch(origin + path, { headers: { 'Cf-Access-Jwt-Assertion': token } });

test('build seed bytes are exact and protected, while Worker imports only small descriptors', async () => {
  assert.deepEqual(built, originalBuilt);
  assert.equal(bytes.toString(), JSON.stringify({ seed, initial }));
  assert.deepEqual(seedAsset, { path: `/admin/seed.${hash(bytes)}.json`, sha256: hash(bytes), bytes: bytes.length, studioKey: seed.studioKey });
  assert.ok(!seed.staticPaths.some(path => /^\/admin\/seed\./.test(path)));
  assert.ok(!built.adminAssets.includes(seedAsset.path), 'Definition data is not an immutable browser code asset');
  const bundle = await build({ entryPoints: ['src/worker.mjs'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', metafile: true });
  assert.ok(Object.keys(bundle.metafile.inputs).some(path => path.endsWith('.generated/cms-build.mjs')));
  assert.ok(Object.keys(bundle.metafile.inputs).every(path => !path.endsWith('.generated/cms-seed.mjs')));
  assert.ok(!bundle.outputFiles[0].text.includes('legacyInitial ='));
});

test('immutable loader owns each cold attempt, retains first completed data and retries failures', async () => {
  const load = await freshLoader(), ready = deferred();
  const calls = [];
  let fail = true;
  const env = { ASSETS: { fetch: async input => {
    calls.push(input);
    await ready.promise;
    if (fail) throw new Error('controlled binding failure');
    return new Response(bytes);
  } } };
  const first = load(env), second = load(env);
  assert.notEqual(first, second);
  ready.resolve();
  const results = await Promise.allSettled([first, second]);
  assert.ok(results.every(item => item.status === 'rejected' && item.reason.message === 'controlled binding failure'));
  assert.equal(calls.length, 2, 'Both cold callers own an independent read');
  fail = false;
  const [definitions, concurrent] = await Promise.all([load(env), load(env)]);
  assert.deepEqual(definitions, { seed, initial });
  assert.equal(concurrent, definitions, 'The first completed plain definitions remain the shared copy');
  assert.equal(await load({ ASSETS: { fetch() { throw new Error('Warm cache fetched again'); } } }), definitions);
  assert.equal(calls.length, 4, 'Two failed cold reads, two successful cold reads, then no warm read');
  for (const input of calls) {
    assert.equal(input.url, 'https://assets.local' + seedAsset.path);
    assert.equal(input.method, 'GET');
    assert.deepEqual([...input.headers], []);
    assert.equal(input.body, null);
  }
  const another = await freshLoader(), rejectLate = deferred();
  const failing = another({ ASSETS: { fetch: async () => { await rejectLate.promise; throw new Error('late failure'); } } });
  const good = await another({ ASSETS: { fetch: async () => new Response(bytes) } });
  rejectLate.resolve();
  await assert.rejects(failing, /late failure/);
  assert.equal(await another({ ASSETS: { fetch() { throw new Error('Late failure poisoned the successful copy'); } } }), good);
});

test('status, declared/actual sizes, corruption and stream failures dispose bodies and never poison retry', async () => {
  for (const mode of ['status', 'declared', 'oversize', 'truncated', 'corrupt', 'stream']) {
    const load = await freshLoader();
    let canceled = 0, pulled = 0;
    const failure = new Error('controlled stream failure');
    const body = new ReadableStream({
      pull(controller) {
        pulled++;
        if (mode === 'stream') throw failure;
        if (pulled > 1) { controller.close(); return; }
        controller.enqueue(mode === 'oversize' ? Buffer.concat([bytes, Buffer.from('x')])
          : mode === 'truncated' ? bytes.subarray(1)
          : mode === 'corrupt' ? Buffer.from('x'.repeat(bytes.length)) : bytes);
      },
      cancel() { canceled++; if (mode === 'status') throw new Error('Cleanup failure must not replace status failure'); },
    }, { highWaterMark: 0 });
    const response = new Response(body, { status: mode === 'status' ? 404 : 200, headers: mode === 'declared' ? { 'Content-Length': String(bytes.length + 1) } : {} });
    await assert.rejects(load({ ASSETS: { fetch: async () => response } }), error => {
      assert.equal(error.status, undefined, 'Internal failures must not carry caller 400/413 status');
      if (mode === 'status') assert.equal(error.message, 'CMS_SEED_STATUS');
      if (mode === 'stream') assert.equal(error, failure);
      return true;
    });
    assert.equal(body.locked, false, mode);
    if (['status', 'declared'].includes(mode)) assert.equal(pulled, 0, mode);
    if (['status', 'declared', 'oversize'].includes(mode)) assert.equal(canceled, 1, mode);
    assert.deepEqual(await load({ ASSETS: { fetch: async () => new Response(bytes) } }), { seed, initial }, mode);
  }
});

test('equal-length valid seed JSON with unchanged build key still requires the exact digest', async () => {
  assert.equal(changedBytes.length, bytes.length);
  assert.deepEqual(changedDefinitions.seed, seed);
  assert.deepEqual(Object.keys(changedDefinitions), ['seed', 'initial']);
  assert.equal(changedDefinitions.initial.schemaVersion, initial.schemaVersion);
  assert.notEqual(changedDefinitions.initial.pages[0].description, initial.pages[0].description);
  assert.notEqual(hash(changedBytes), seedAsset.sha256);
  const load = await freshLoader();
  await assert.rejects(load({ ASSETS: { fetch: async () => new Response(changedBytes) } }), { message: 'CMS_SEED_IDENTITY' });
  assert.deepEqual(await load({ ASSETS: { fetch: async () => new Response(bytes) } }), { seed, initial });
});

test('a compiled asset identity still requires fatal UTF-8, JSON and matching build definitions', async () => {
  // Change the test build descriptor too, so malformed data reaches parsing
  // instead of merely repeating the already-covered checksum rejection.
  for (const content of [Buffer.from([0xc3, 0x28]), Buffer.from('{'), Buffer.from(JSON.stringify({ seed: { studioKey: 'wrong', pages: [] }, initial: { schemaVersion: 2, pages: [] } }))]) {
    const bundle = await build({ entryPoints: ['src/cms/admin-seed.mjs'], bundle: true, write: false, format: 'esm', platform: 'browser', plugins: [{ name: 'seed-fixture-identity', setup(builder) {
      builder.onLoad({ filter: /cms-build\.mjs$/ }, () => ({ contents: `export const seedAsset=${JSON.stringify({ ...seedAsset, sha256: hash(content), bytes: content.length })}`, loader: 'js' }));
    } }] });
    const { loadAdminSeed } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}#${crypto.randomUUID()}`);
    await assert.rejects(loadAdminSeed({ ASSETS: { fetch: async () => new Response(content) } }));
  }
});

test('signed Worker authenticates direct seed and state requests before any definition read', async () => {
  const calls = [];
  const runtime = await cmsRuntime({ assetFetch: async (input, next) => { calls.push(input.url); return next(); } });
  try {
    const owner = await runtime.token();
    for (const token of ['', 'invalid', await runtime.token({}, 0), await runtime.token({ email: 'other@example.test' })]) {
      for (const path of [seedAsset.path, '/admin/api/state']) for (const method of ['GET', 'HEAD']) {
        const response = await runtime.mf.dispatchFetch(origin + path, { method, headers: { 'Cf-Access-Jwt-Assertion': token } });
        assert.equal(response.status, 401);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.doesNotMatch(await response.text(), /schemaVersion|legacy-key|frameContracts/);
      }
    }
    assert.deepEqual(calls, []);
    const direct = await realGet(runtime, seedAsset.path, owner);
    assert.equal(direct.status, 200);
    assert.equal(direct.headers.get('cache-control'), 'no-store');
    assert.deepEqual(Buffer.from(await direct.arrayBuffer()), bytes);
    const head = await runtime.mf.dispatchFetch(origin + seedAsset.path, { method: 'HEAD', headers: { 'Cf-Access-Jwt-Assertion': owner } });
    assert.equal(head.status, 200); assert.equal(await head.text(), '');
    assert.equal(head.headers.get('cache-control'), 'no-store');
    const state = await successful(await realGet(runtime, '/admin/api/state', owner));
    assert.deepEqual(state.built, originalBuilt);
    assert.deepEqual(state.definitions, seed.pages);
    assert.deepEqual(state.frameContracts, seed.frame.contracts);
    assert.deepEqual(state.project, initial);
    assert.equal(calls.filter(url => url === 'https://assets.local' + seedAsset.path).length, 1, 'Direct asset reads did not pre-populate the parsed loader');
  } finally { await runtime.close(); }
});

test('signed Worker rejects a corrupt seed as internal503 and retries without changing state', async () => {
  let corrupt = true, reads = 0;
  const runtime = await cmsRuntime({ assetFetch: async (input, next) => {
    if (input.url === 'https://assets.local' + seedAsset.path) { reads++; if (corrupt) return new Response(changedBytes); }
    return next();
  } });
  try {
    const token = await runtime.token();
    const failed = await realGet(runtime, '/admin/api/state', token);
    assert.equal(failed.status, 503); assert.equal(failed.headers.get('cache-control'), 'no-store');
    assert.ok((await failed.json()).requestId);
    assert.equal((await runtime.db.prepare('SELECT version FROM cms_head WHERE id=1').first()).version, 0);
    corrupt = false;
    assert.deepEqual((await successful(await realGet(runtime, '/admin/api/state', token))).project, initial);
    assert.equal(reads, 2);
  } finally { await runtime.close(); }
});

test('real workerd cold concurrency and binding failure retry use actual asset bytes', { timeout: 30_000 }, async () => {
  const entered = deferred(), release = deferred(), secondEntered = deferred();
  let attempts = 0, fail = true;
  const runtime = await seedRuntime({ observe: async path => { if (path === '/second') secondEntered.resolve(); }, assetFetch: async (input, next) => {
    if (input.url === 'https://assets.local' + seedAsset.path) {
      attempts++; entered.resolve(); await release.promise;
      assert.equal(input.headers.get('Cookie'), null);
      assert.equal(input.headers.get('Cf-Access-Jwt-Assertion'), null);
      if (fail) return new Response('unavailable', { status: 503 });
    }
    return next();
  } });
  try {
    const get = path => runtime.mf.dispatchFetch(runtime.url + path);
    const first = get('/first'), second = get('/second');
    await Promise.all([entered.promise, secondEntered.promise]);
    release.resolve();
    const results = await Promise.all([first, second]);
    for (const response of results) {
      assert.equal(response.status, 503);
      assert.ok(response.headers.get('x-request-id'));
      assert.doesNotMatch(await response.text(), /CMS_SEED|unavailable/);
    }
    assert.equal(attempts, 2, 'Each concurrent cold request owns its failed read');
    fail = false;
    assert.deepEqual(await successful(await get('/retry')), { seed, initial });
    assert.deepEqual(await successful(await get('/warm')), { seed, initial });
    assert.equal(attempts, 3, 'One later success is reused by the warm request');
  } finally { release.resolve(); await runtime.close(); }
});

test('aborting the first real HTTP caller cannot strand another seed waiter or future requests', { timeout: 30_000 }, async () => {
  const entered = deferred(), release = deferred(), secondEntered = deferred();
  let attempts = 0;
  const runtime = await seedRuntime({ observe: async path => { if (path === '/second') secondEntered.resolve(); }, assetFetch: async (input, next) => {
    if (input.url === 'https://assets.local' + seedAsset.path) { attempts++; entered.resolve(); await release.promise; }
    return next();
  } });
  let first;
  try {
    const aborted = new Promise(resolve => {
      first = httpRequest(runtime.url + '/first', { agent: false }, response => { response.resume(); resolve('response'); });
      first.on('error', () => resolve('aborted')); first.end();
    });
    await entered.promise;
    const second = runtime.mf.dispatchFetch(runtime.url + '/second');
    await secondEntered.promise;
    first.destroy();
    assert.equal(await aborted, 'aborted');
    release.resolve();
    const result = await second;
    assert.ok([200, 503].includes(result.status), await result.clone().text());
    if (result.status === 200) assert.deepEqual(await result.json(), { seed, initial });
    else assert.ok((await result.json()).requestId, 'An interrupted load fails through the normal recoverable boundary');
    assert.deepEqual(await successful(await runtime.mf.dispatchFetch(runtime.url + '/retry')), { seed, initial });
    assert.equal(attempts, 2, 'Both cold requests own their reads; the future request reuses completed definitions');
  } finally { first?.destroy(); release.resolve(); await runtime.close(); }
});

test('first handler completion without waitUntil cannot retain stranded request-owned seed I/O', { timeout: 30_000 }, async t => {
  const entered = deferred(), release = deferred(), endFirst = deferred(), secondEntered = deferred();
  let attempts = 0;
  const record = (phase, state) => console.log('SEED_OWNER_PHASE ' + JSON.stringify({ phase, state, attempts }));
  async function phase(name, run) {
    record(name, 'started');
    t.signal.throwIfAborted();
    let abort;
    const interrupted = new Promise((_, reject) => {
      abort = () => reject(new Error(`Seed owner phase ${name} interrupted by test deadline`, { cause: t.signal.reason }));
      t.signal.addEventListener('abort', abort, { once: true });
    });
    try {
      const value = await Promise.race([Promise.resolve().then(run), interrupted]);
      record(name, 'completed');
      return value;
    } catch (error) { record(name, 'failed'); throw error; }
    finally { t.signal.removeEventListener('abort', abort); }
  }
  const runtime = await seedRuntime({
    observe: async path => {
      record('handler ' + path, 'acknowledged');
      if (path === '/abandon') await endFirst.promise;
      if (path === '/second') secondEntered.resolve();
    },
    assetFetch: async (_input, next) => {
      attempts++; record('asset', 'entered'); entered.resolve(); await release.promise;
      record('asset', 'released'); return next();
    },
  });
  try {
    const first = runtime.mf.dispatchFetch(runtime.url + '/abandon');
    // Observe failures immediately even if an earlier phase is still blocked.
    first.catch(error => record('first response', 'rejected: ' + error.message));
    await phase('asset entry', () => entered.promise);
    const second = runtime.mf.dispatchFetch(runtime.url + '/second');
    second.catch(error => record('second response', 'rejected: ' + error.message));
    await phase('second handler entry', () => secondEntered.promise);
    endFirst.resolve();
    const firstResponse = await phase('first response', () => first);
    assert.equal(await phase('first body', () => firstResponse.text()), 'handler-ended', 'Owning handler returned its full response without waitUntil');
    release.resolve();
    const result = await phase('second response', () => second);
    const body = await phase('second body', () => result.json());
    assert.ok([200, 503].includes(result.status), JSON.stringify(body));
    if (result.status === 200) assert.deepEqual(body, { seed, initial });
    else assert.ok(body.requestId);
    assert.deepEqual(await phase('future request and body', async () => successful(await runtime.mf.dispatchFetch(runtime.url + '/retry'))), { seed, initial });
    assert.equal(attempts, 2, 'Owner completion cannot strand or restart the other request\'s independent read');
  } finally {
    endFirst.resolve(); release.resolve();
    record('dispose', 'started');
    await runtime.close();
    record('dispose', 'completed');
  }
});

test('missing definitions preserve seedless refusals, history, migration controls and mail receipts', async () => {
  const app = await nodeWorker(), runtime = await nodeCms(initial, app, 1);
  let seedReads = 0;
  runtime.env.ASSETS.fetch = async input => {
    if (new URL(input.url).pathname === seedAsset.path) { seedReads++; throw new Error('Seed is deliberately unavailable'); }
    return new Response('shell fixture');
  };
  globalThis.cmsAuthCalls = [];
  try {
    const cases = [
      ['/admin/', undefined, 200], ['/admin/api/history', undefined, 200],
      ['/admin/api/history?before=0', undefined, 400], ['/admin/api/assets', undefined, 200],
      ['/admin/api/revision/00', undefined, 404], ['/admin/api/revision/99', undefined, 404],
      ['/admin/api/absent', undefined, 404], ['/admin/api/absent', {}, 404],
      ['/admin/api/save', {}, 422], ['/admin/api/preview', {}, 422], ['/admin/api/asset-usage', {}, 422],
      ['/admin/api/migrate-frame', {}, 422], ['/admin/api/cpu-migration', undefined, 200],
      ['/admin/api/cpu-migration', {}, 422], ['/admin/api/contact', undefined, 200], ['/admin/api/mail/sent', undefined, 200],
    ];
    for (const [path, body, status] of cases) {
      const before = globalThis.cmsAuthCalls.length, response = await runtime.fetch(path, body);
      assert.equal(response.status, status, `${path}: ${await response.clone().text()}`);
      assert.equal(globalThis.cmsAuthCalls.length, before + 1, 'One authoritative auth call per request');
      await response.arrayBuffer();
    }
    const id = crypto.randomUUID();
    for (const [prefix, path, extra] of [['mail/', 'mail/send', {}], ['mail-test/', 'mail/test', { template: 'receipt' }]]) {
      runtime.sqlite.prepare('INSERT INTO cms_mail_receipts(request_id,resend_id,scheduled_at,sender,created_at) VALUES(?,?,NULL,?,?)').run(prefix + id, prefix + 'confirmed-id', 'sender@example.test', new Date().toISOString());
      assert.equal((await successful(await runtime.fetch('/admin/api/' + path, { requestId: id, ...extra }))).id, prefix + 'confirmed-id');
    }
    assert.equal(seedReads, 0);
    for (const path of ['/admin/api/state', '/admin/api/revision/0', '/admin/api/revision/1']) {
      const response = await runtime.fetch(path);
      assert.equal(response.status, 503);
      assert.ok((await response.json()).requestId);
    }
    assert.equal(seedReads, 3, 'Each failed load can retry instead of caching rejection');
    assert.equal((await readSite(runtime.db)).version, 1);
  } finally { delete globalThis.cmsAuthCalls; runtime.close(); }
});

test('full/delta/frame migration and actual BASE receipts replay before missing seed after a later Save', async () => {
  const runtime = await cmsRuntime();
  try {
    const historical = baseValidate(structuredClone(baseInitial), baseSeed), oldId = crypto.randomUUID();
    await basePublish(runtime.db, { project: historical, baseVersion: 0, requestId: oldId, actor: runtime.email });
    const headers = { 'Cf-Access-Jwt-Assertion': await runtime.token(), Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/json' };
    const call = body => runtime.mf.dispatchFetch(runtime.url + '/admin/api/save', { method: 'POST', headers, body: JSON.stringify(body) });
    const { project: _converted, ...migration } = frameMigration({ version: 1, project: historical }, seed, { origin: runtime.url });
    const migrate = { ...migration, requestId: crypto.randomUUID() };
    assert.equal((await successful(await runtime.mf.dispatchFetch(runtime.url + '/admin/api/migrate-frame', { method: 'POST', headers, body: JSON.stringify(migrate) }))).version, 2);
    const state = await successful(await runtime.mf.dispatchFetch(runtime.url + '/admin/api/state', { headers }));
    const full = { project: state.project, baseVersion: 2, requestId: crypto.randomUUID() };
    assert.equal((await successful(await call(full))).version, 3);
    const edited = structuredClone(state.project); edited.pages[0].description += ' Ny beskrivning.';
    const delta = { changes: projectChanges(state.project, edited), baseVersion: 3, requestId: crypto.randomUUID() };
    assert.equal((await successful(await call(delta))).version, 4);
    // Fresh module gives this path no previously loaded definitions. The real
    // D1 receipts came from actual BASE/current workerd publications above.
    const app = await nodeWorker();
    let seedReads = 0;
    const env = { CMS_DB: runtime.db, ASSETS: { fetch() { seedReads++; throw new Error('No seed after deployment'); } } };
    for (const body of [full, delta, { project: historical, baseVersion: 0, requestId: oldId }]) {
      const saved = await successful(await app.fetch(request('/admin/api/save', 'cpu-test', body), env));
      assert.equal(saved.replayed, true);
    }
    assert.equal((await successful(await app.fetch(request('/admin/api/migrate-frame', 'cpu-test', migrate), env))).replayed, true);
    assert.equal(seedReads, 0);
    assert.equal((await readSite(runtime.db)).version, 4);
    const refused = await app.fetch(request('/admin/api/save', 'cpu-test', { ...full, project: edited }), env);
    assert.equal(refused.status, 409);
    assert.equal(seedReads, 0);
  } finally { await runtime.close(); }
});

test('valid CPU migration commit and replay use the compiled key without loading definitions', async () => {
  const app = await nodeWorker(), runtime = await nodeCms(initial, app, 1);
  const context = { seed, initial }, authority = { buildKey: seed.studioKey, origin, actor: 'owner@example.test' };
  let reads = 0;
  runtime.env.ASSETS.fetch = async () => { reads++; throw new Error('Commit must not load definitions'); };
  try {
    const status = await cpuMigrationStatus(runtime.db, authority);
    const artifact = await prepareCpuArtifact(await readCpuSource(runtime.db, 1), status, context);
    await stageCpuArtifact(runtime.db, artifact, context, { readToday: 0, writtenToday: 0 });
    const body = { operationId: artifact.operationId, artifactHash: artifact.artifactHash, action: 'commit' };
    assert.equal((await successful(await runtime.fetch('/admin/api/cpu-migration', body))).state, 'committed');
    assert.equal((await successful(await runtime.fetch('/admin/api/cpu-migration', body))).replayed, true);
    assert.equal(reads, 0);
    assert.equal((await readSite(runtime.db)).version, 1);
  } finally { runtime.close(); }
});

test('public canonical pages/game/data never load seed, while legacy fallback fails clearly and retries', async () => {
  const app = await nodeWorker(), runtime = await nodeCms(initial, app, 1);
  let reads = 0, available = false;
  runtime.env.ASSETS.fetch = async input => {
    assert.equal(new URL(input.url).pathname, seedAsset.path);
    reads++;
    return available ? new Response(bytes) : new Response('not available', { status: 404 });
  };
  try {
    for (const path of ['/', '/play/skift/', '/data/cards.json', '/data/runtime.json', '/sitemap.xml', '/cms-public/v1/home.css']) {
      const response = await app.fetch(new Request(origin + path), runtime.env);
      assert.equal(response.status, 200, path); await response.arrayBuffer();
    }
    assert.equal(reads, 0);
    await publishSite(runtime.db, { project: legacyInitial, baseVersion: 1, requestId: crypto.randomUUID(), actor: 'owner@example.test' });
    const failed = await app.fetch(new Request(origin + '/'), runtime.env);
    assert.equal(failed.status, 503); assert.equal(failed.headers.get('cache-control'), 'no-store');
    assert.doesNotMatch(await failed.text(), /CMS_SEED|not available|schemaVersion/);
    assert.equal(reads, 1);
    available = true;
    assert.equal((await app.fetch(new Request(origin + '/'), runtime.env)).status, 200);
    assert.equal(reads, 2);
  } finally { runtime.close(); }
});

test('shared build definitions remain unchanged through state, Save, validate, recovery and warm auth', async () => {
  const app = await nodeWorker(), runtime = await nodeCms(null, app);
  let reads = 0;
  runtime.env.ASSETS.fetch = async () => { reads++; return new Response(bytes); };
  globalThis.cmsAuthCalls = [];
  try {
    assert.deepEqual((await successful(await runtime.fetch('/admin/api/state'))).project, initial);
    const edit = structuredClone(initial); edit.pages[0].description += ' Ägarens ändring.';
    assert.equal((await successful(await runtime.fetch('/admin/api/save', { project: edit, baseVersion: 0, requestId: crypto.randomUUID() }))).version, 1);
    await successful(await runtime.fetch('/admin/api/validate', { project: edit }));
    await successful(await runtime.fetch('/admin/api/recover', { project: edit }));
    const reset = await successful(await runtime.fetch('/admin/api/revision/0'));
    assert.deepEqual(reset.project, initial, 'A later request cannot see mutations of the shared initial project');
    const state = await successful(await runtime.fetch('/admin/api/state'));
    assert.deepEqual(state.definitions, seed.pages); assert.deepEqual(state.blank, seed.blank);
    assert.equal(reads, 1);
    assert.equal(globalThis.cmsAuthCalls.length, 6, 'Seed caching never caches authentication');
  } finally { delete globalThis.cmsAuthCalls; runtime.close(); }
});
