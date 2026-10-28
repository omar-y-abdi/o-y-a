import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from 'node:zlib';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { initial } from '../.generated/cms-seed.mjs';
import { digest, publishSite, readSite } from '../src/cms/store.mjs';
import { inspectAsset } from '../src/cms/media-files.mjs';
import { stripExistingMedia } from '../scripts/cms-strip-media.mjs';

function legacyJpeg() {
  const tiff = Buffer.alloc(56);
  tiff.write('II'); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4); tiff.writeUInt16LE(2, 8);
  tiff.writeUInt16LE(0x0112, 10); tiff.writeUInt16LE(3, 12); tiff.writeUInt32LE(1, 14); tiff.writeUInt16LE(6, 18);
  tiff.writeUInt16LE(0x8825, 22); tiff.writeUInt16LE(4, 24); tiff.writeUInt32LE(1, 26); tiff.writeUInt32LE(38, 30);
  tiff.writeUInt16LE(1, 38); tiff.writeUInt16LE(1, 40); tiff.writeUInt16LE(2, 42); tiff.writeUInt32LE(2, 44); tiff.write('N\0', 48);
  const payload = Buffer.concat([Buffer.from('Exif\0\0'), tiff]);
  const segment = Buffer.from([255, 225, (payload.length + 2) >> 8, (payload.length + 2) & 255]);
  const base = Buffer.from(rasterFixtures.jpeg, 'base64');
  return Buffer.concat([base.subarray(0, 2), segment, payload, base.subarray(2)]);
}
function pngMetadata(type, data) {
  const base = Buffer.from(rasterFixtures.png, 'base64');
  const body = Buffer.concat([Buffer.from(type), data]);
  const size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([base.subarray(0, 33), size, body, crc, base.subarray(33)]);
}

async function fixture(run, bytes = legacyJpeg(), extension = 'jpg') {
  const runtime = await cmsRuntime();
  try {
    const id = crypto.randomUUID(), key = `${id}.${extension}`, bucket = await runtime.mf.getR2Bucket('CMS_MEDIA');
    const info = inspectAsset(bytes);
    await bucket.put(key, bytes);
    await runtime.db.prepare('INSERT INTO cms_media(id,object_key,name,mime,bytes,width,height,alt,sha256,created_at,validation_version) VALUES(?,?,?,?,?,?,?,?,?,?,1)').bind(id, key, `Original.${extension}`, info.mime, bytes.length, info.width, info.height, 'Originalets alt', await digest(bytes), new Date().toISOString()).run();
    const project = structuredClone(initial);
    project.pages[0].html = project.pages[0].html.replace('</main>', `<img src="/media/${key}" alt="Originalets alt"></main>`);
    await publishSite(runtime.db, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
    const cookie = 'CF_Authorization=' + await runtime.token(), writes = [];
    const request = async (path, init = {}) => {
      if (init.method === 'POST') writes.push(path);
      return runtime.mf.dispatchFetch(runtime.url + path, { ...init, headers: { Cookie: cookie, Origin: runtime.url, 'X-CMS-Request': '1', ...init.headers } });
    };
    await run({ runtime, id, key, bucket, bytes, request, writes });
  } finally { await runtime.close(); }
}

test('A13 existing: dry-run writes nothing; apply verifies a new key before Save, preserves originals and resumes idempotently', async () => fixture(async ({ runtime, key, bucket, bytes, request, writes }) => {
  const before = await readSite(runtime.db);
  const dry = await stripExistingMedia(request, { log() {} });
  assert.equal(dry.planned, 1);
  assert.equal(writes.length, 0);
  assert.equal((await readSite(runtime.db)).version, before.version);
  const result = await stripExistingMedia(request, { apply: true, log() {} });
  assert.equal(result.replacements, 1);
  assert.equal(result.version, before.version + 1);
  const saved = await readSite(runtime.db);
  assert.ok(!saved.project.pages[0].html.includes(`/media/${key}`));
  const newKey = saved.project.pages[0].html.match(/\/media\/([0-9a-f-]{36}\.jpg)/)[1];
  assert.notEqual(newKey, key);
  const cleaned = Buffer.from(await (await bucket.get(newKey)).arrayBuffer());
  assert.equal(cleaned.readUInt16BE(20), 1, 'minimal Exif has one entry');
  assert.equal(cleaned.readUInt16BE(22), 0x0112);
  assert.equal(cleaned.readUInt16BE(30), 6, 'Orientation survives');
  const base = Buffer.from(rasterFixtures.jpeg, 'base64');
  assert.deepEqual(cleaned.subarray(-(base.length - 2)), base.subarray(2), 'image segments and pixels stay identical');
  assert.deepEqual(Buffer.from(await (await bucket.get(key)).arrayBuffer()), bytes);
  assert.ok((await readSite(runtime.db, before.version)).project.pages[0].html.includes(`/media/${key}`));
  const count = (await runtime.db.prepare('SELECT count(*) AS n FROM cms_media').first()).n;
  const again = await stripExistingMedia(request, { apply: true, log() {} });
  assert.equal(again.replacements, 0);
  assert.equal(again.version, saved.version);
  assert.equal((await runtime.db.prepare('SELECT count(*) AS n FROM cms_media').first()).n, count);
}));

test('A13 existing: failed readback never repoints the head or overwrites the original', async () => fixture(async ({ runtime, key, bucket, bytes, request, writes }) => {
  const broken = (path, init) => path.startsWith('/media/') && path !== `/media/${key}` ? Promise.resolve(new Response('damaged derivative')) : request(path, init);
  await assert.rejects(stripExistingMedia(broken, { apply: true, log() {} }), /verification/);
  assert.equal((await readSite(runtime.db)).version, 1);
  assert.equal(writes.includes('/admin/api/save'), false);
  assert.deepEqual(Buffer.from(await (await bucket.get(key)).arrayBuffer()), bytes);
}));

test('A13 existing: PNG text metadata is removed under a new key without changing any pixel chunks', async () => fixture(async ({ runtime, key, bucket, bytes, request }) => {
  const result = await stripExistingMedia(request, { apply: true, log() {} });
  assert.equal(result.replacements, 1);
  const state = await readSite(runtime.db);
  const newKey = state.project.pages[0].html.match(/\/media\/([0-9a-f-]{36}\.png)/)[1];
  assert.notEqual(newKey, key);
  assert.deepEqual(Buffer.from(await (await bucket.get(newKey)).arrayBuffer()), Buffer.from(rasterFixtures.png, 'base64'));
  assert.deepEqual(Buffer.from(await (await bucket.get(key)).arrayBuffer()), bytes);
}, pngMetadata('tEXt', Buffer.from('Comment\0Stockholm')), 'png'));

test('A13 premise guard: PNG eXIf stops all writes until the upload cleaner can preserve Orientation', async () => fixture(async ({ runtime, request, writes }) => {
  await assert.rejects(stripExistingMedia(request, { apply: true, log() {} }), /PNG eXIf.*Orientation/);
  assert.equal(writes.length, 0);
  assert.equal((await readSite(runtime.db)).version, 1);
}, pngMetadata('eXIf', legacyJpeg().subarray(12, 68)), 'png'));

test('A13 premise guard: WebP/AVIF are not declared metadata-free by a no-op cleaner', async () => {
  for (const format of ['webp', 'avif']) await fixture(async ({ request, writes }) => {
    await assert.rejects(stripExistingMedia(request, { apply: true, log() {} }), /Metadata stripping needs review/);
    assert.equal(writes.length, 0);
  }, Buffer.from(rasterFixtures[format], 'base64'), format);
});
