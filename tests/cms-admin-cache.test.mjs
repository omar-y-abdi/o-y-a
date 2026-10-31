import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { built } from '../.generated/cms-seed.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { nodeWorker } from './helpers/cms-node.mjs';
import { ADMIN_CSP } from '../src/cms/render.mjs';

const origin = 'https://omaryusuf.se';
const immutable = 'private, max-age=31536000, immutable';
let runtime, token;
before(async () => { runtime = await cmsRuntime(); token = await runtime.token(); });
after(async () => { await runtime?.close(); });
const fetchAdmin = (path, method = 'GET', authorization = token) => runtime.mf.dispatchFetch(origin + path, {
  method, headers: { 'Cf-Access-Jwt-Assertion': authorization },
});
function headers(response, policy) {
  assert.equal(response.headers.get('cache-control'), policy);
  assert.equal(response.headers.get('content-security-policy'), ADMIN_CSP);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
}

test('immutable admin inventory is the sorted exact build graph, styles and copied vendor', async () => {
  const graph = JSON.parse(await readFile('.generated/cms-metafile.json', 'utf8'));
  const vendor = JSON.parse(await readFile('.generated/cms-vendor.json', 'utf8'));
  const expected = [
    ...Object.keys(graph.outputs).filter(path => path.endsWith('.mjs')).map(path => '/' + path.replace(/^dist\//, '')),
    built.css, built.vendorCss, vendor.path,
  ].sort();
  assert.deepEqual(built.adminAssets, expected);
  assert.equal(new Set(built.adminAssets).size, built.adminAssets.length);
  const files = await readdir('dist/admin/assets', { recursive: true, withFileTypes: true });
  const actual = files.filter(file => file.isFile() && /\.(?:mjs|css)$/.test(file.name)).map(file => '/' + `${file.parentPath}/${file.name}`.replace(/^dist\//, '')).sort();
  assert.deepEqual(built.adminAssets, actual, 'Every shipped studio code/style file must be inventoried');
  for (const path of [built.css, built.vendorCss]) {
    const hash = createHash('sha256').update(await readFile('dist' + path)).digest('hex').slice(0, 12);
    assert.ok(path.endsWith(`.${hash}.css`), path);
  }
  const vendorHash = createHash('sha256').update(await readFile(vendor.source)).update(await readFile(vendor.source + '.map')).digest('hex').slice(0, 12);
  assert.equal(vendor.path, `/admin/assets/grapes-${vendorHash}/grapes.min.mjs`);
  assert.ok(built.adminAssets.includes(built.studio));
  assert.ok(built.adminAssets.includes(built.preview));
  assert.ok(!built.adminAssets.includes(built.loginCss));
});

test('real signed Worker serves every inventoried asset privately immutable with unchanged bytes and HEAD', async () => {
  for (const path of built.adminAssets) {
    const get = await fetchAdmin(path);
    assert.equal(get.status, 200, path);
    headers(get, immutable);
    assert.deepEqual(Buffer.from(await get.arrayBuffer()), await readFile('dist' + path), path);
    const head = await fetchAdmin(path, 'HEAD');
    assert.equal(head.status, 200, path);
    headers(head, immutable);
    assert.equal(await head.text(), '');
    assert.equal(head.headers.get('content-type'), get.headers.get('content-type'));
  }
  const query = await fetchAdmin(built.studio + '?fixture=1');
  assert.equal(query.status, 200);
  headers(query, immutable);
  assert.deepEqual(Buffer.from(await query.arrayBuffer()), await readFile('dist' + built.studio));
});

test('real Worker keeps Access failures, mutable content, guessed assets and writes no-store', async () => {
  for (const path of built.adminAssets) for (const method of ['GET', 'HEAD']) {
    const response = await fetchAdmin(path, method, '');
    assert.equal(response.status, 401, path);
    headers(response, 'no-store');
    if (method === 'HEAD') assert.equal(await response.text(), '');
    else assert.doesNotMatch(await response.text(), /owner@example|schemaVersion|grapesjs/);
  }
  const outsider = await fetchAdmin(built.studio, 'GET', await runtime.token({ email: 'other@example.test' }));
  assert.equal(outsider.status, 401);
  headers(outsider, 'no-store');
  await outsider.arrayBuffer();
  for (const [path, status] of [
    ['/admin/', 200], ['/admin/api/state', 200],
    ['/admin/seed.json', 404], ['/admin/assets/unhashed.mjs', 404], ['/admin/assets/unknown.0123456789ab.mjs', 404],
    ['/admin/assets/grapes-0123456789ab/grapes.min.mjs', 404], ['/admin/api/absent', 404],
  ]) {
    const response = await fetchAdmin(path);
    assert.equal(response.status, status, path);
    headers(response, 'no-store');
    await response.arrayBuffer();
  }
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await fetchAdmin(built.studio, method);
    headers(response, 'no-store');
    await response.arrayBuffer();
  }
});

test('cache admission depends on successful reads and exact build membership, never filename shape', async () => {
  // Real signed Access is covered above. This existing Worker seam controls
  // asset status/body so a platform 404 cannot accidentally prove the guard.
  const app = await nodeWorker();
  for (const path of [built.studio, '/admin/assets/unhashed.mjs', '/admin/assets/unknown.0123456789ab.mjs']) {
    for (const method of ['GET', 'HEAD', 'POST']) for (const status of [200, 206, 301, 304, 404, 503]) {
      const response = await app.fetch(new Request(origin + path, { method, headers: { 'Cf-Access-Jwt-Assertion': 'cpu-test' } }), {
        ASSETS: { fetch: async () => new Response(status === 304 ? null : 'asset', { status }) },
      });
      assert.equal(response.status, status);
      headers(response, path === built.studio && method !== 'POST' && status === 200 ? immutable : 'no-store');
      assert.equal(await response.text(), method === 'HEAD' || status === 304 ? '' : 'asset');
    }
  }
});
