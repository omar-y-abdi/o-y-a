import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { inspectAsset, uploadAsset, listAssets, assetResponse } from '../src/cms/assets.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { defaultTheme } from '../src/cms/theme.mjs';
import { migrateCmsDb } from './helpers/cms-runtime.mjs';

const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response("test"); } };', compatibilityDate: '2026-09-11', d1Databases: ['CMS_DB'], r2Buckets: ['CMS_MEDIA'], images: { binding: 'CMS_IMAGES' } }));
after(() => mf.dispose());
const env = { CMS_DB: await mf.getD1Database('CMS_DB'), CMS_MEDIA: await mf.getR2Bucket('CMS_MEDIA'), CMS_IMAGES: await mf.getImagesBinding('CMS_IMAGES') };
await migrateCmsDb(env.CMS_DB);
const png = new Uint8Array(await readFile('public/social/omar-yusuf.png'));

test('actual file signature and dimensions determine stored content type', () => {
  assert.deepEqual(inspectAsset(png), { mime: 'image/png', extension: 'png', width: 1200, height: 630 });
  for (const bytes of [new TextEncoder().encode('<svg onload="alert(1)"></svg>'), new TextEncoder().encode('<script>alert(1)</script>'), new Uint8Array([1, 2, 3])]) assert.throws(() => inspectAsset(bytes));
  const bomb = png.slice();
  new DataView(bomb.buffer).setUint32(16, 100000);
  assert.throws(() => inspectAsset(bomb));
});

test('upload stores an immutable R2 object and recoverable metadata', async () => {
  const id = crypto.randomUUID();
  const asset = await uploadAsset(env, { id, bytes: png, name: 'Testbild.png', alt: 'Gul figur på blå botten' });
  assert.equal(asset.src, `/media/${id}.png`);
  assert.equal(asset.width, 1200);
  assert.equal((await listAssets(env.CMS_DB)).some(item => item.id === id), true);
  const stored = await env.CMS_MEDIA.get(`${id}.png`);
  assert.deepEqual(new Uint8Array(await stored.arrayBuffer()), png);
  const retry = await uploadAsset(env, { id, bytes: png, name: 'Testbild.png', alt: 'Gul figur på blå botten' });
  assert.equal(retry.id, asset.id);
  const other = new Uint8Array(await readFile('public/apple-touch-icon.png'));
  await assert.rejects(uploadAsset(env, { id, bytes: other, name: 'Annan.png', alt: 'Annan' }), error => error.status === 409);
});

test('unpublished uploads are private; a published asset supports HEAD and immutable caching', async () => {
  const id = crypto.randomUUID();
  await uploadAsset(env, { id, bytes: png, name: 'Privat utkast.png', alt: '' });
  const url = `https://omaryusuf.se/media/${id}.png`;
  assert.equal((await assetResponse(new Request(url), env)).status, 404);
  await env.CMS_DB.prepare('UPDATE cms_media SET published_at = ? WHERE id = ?').bind(new Date().toISOString(), id).run();
  const publicImage = await assetResponse(new Request(url), env);
  assert.equal(publicImage.status, 200);
  assert.equal(publicImage.headers.get('Content-Type'), 'image/png');
  assert.match(publicImage.headers.get('Cache-Control'), /immutable/);
  const head = await assetResponse(new Request(url, { method: 'HEAD' }), env);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  assert.equal(head.headers.get('Content-Length'), String(png.byteLength));
});

test('publication exposes only rendered references, not unused private files in an editor registry', async () => {
  const used = crypto.randomUUID(), unused = crypto.randomUUID();
  await uploadAsset(env, { id: used, bytes: png, name: 'Använd.png', alt: 'Använd bild' });
  await uploadAsset(env, { id: unused, bytes: png, name: 'Privat.png', alt: 'Privat bild' });
  const project = { schemaVersion: 1, theme: defaultTheme, runtime: {}, cards: [], pages: [{ id: 'home', path: '/', html: `<main><img src="/media/${used}.png" alt="Använd"></main>`, css: '', project: { assets: [{ src: `/media/${unused}.png` }] } }] };
  await publishSite(env.CMS_DB, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: 'owner@example.test' });
  assert.equal((await assetResponse(new Request(`https://omaryusuf.se/media/${used}.png`), env)).status, 200);
  assert.equal((await assetResponse(new Request(`https://omaryusuf.se/media/${unused}.png`), env)).status, 404);
  project.theme = { ...defaultTheme, fontFamily: `cms-font-${crypto.randomUUID()}` };
  await assert.rejects(publishSite(env.CMS_DB, { project, baseVersion: 1, requestId: crypto.randomUUID(), actor: 'owner@example.test' }), error => error.status === 422);
  assert.equal((await readSite(env.CMS_DB)).version, 1);
});

test('trashed fonts do not consume the active 64-font quota', async () => {
  const now = new Date().toISOString();
  for (let index = 0; index < 64; index += 1) {
    const id = crypto.randomUUID();
    await env.CMS_DB.prepare('INSERT INTO cms_media(id,object_key,name,mime,bytes,width,height,alt,sha256,created_at,archived_at,version,validation_version,trashed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id, `${id}.woff2`, `Trashed ${index}`, 'font/woff2', 48, null, null, '', 'x'.repeat(64), now, null, 0, 1, now).run();
  }
  const id = crypto.randomUUID();
  const bytes = new Uint8Array(48);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode('wOF2'), 0);
  view.setUint32(8, 48);
  view.setUint16(12, 1);
  view.setUint32(16, 100);
  const asset = await uploadAsset(env, { id, bytes, name: 'Active.woff2', alt: '' });
  assert.equal(asset.mime, 'font/woff2');
  assert.equal(asset.state, 'active');
});

test('active and archived media pages keep lifecycle index query plans', async () => {
  for (const filter of ['trashed_at IS NULL AND archived_at IS NULL', 'trashed_at IS NULL AND archived_at IS NOT NULL']) {
    const plan = await env.CMS_DB.prepare(`EXPLAIN QUERY PLAN SELECT * FROM cms_media WHERE ${filter} AND (? = 0 OR mime LIKE 'image/%') AND (instr(lower(name),lower(?)) > 0 OR instr(lower(mime),lower(?)) > 0) AND (? = '' OR created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC, id DESC LIMIT 61`)
      .bind(0, '', '', '', '', '', '').all();
    const details = plan.results.map(row => row.detail);
    assert.ok(details.some(detail => detail.includes('cms_media_lifecycle')), details.join('\n'));
    assert.ok(details.every(detail => !detail.startsWith('SCAN cms_media')), details.join('\n'));
  }
});
