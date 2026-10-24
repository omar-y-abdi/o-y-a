import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from 'node:zlib';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { cleanRaster } from '../src/cms/raster-integrity.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';

// Fixtures are built from the generated 16x16 fixtures plus bytes made here; no binary files.
const runtime = await cmsRuntime();
after(() => runtime.close());
const cookie = 'CF_Authorization=' + await runtime.token();
const fixture = format => Buffer.from(rasterFixtures[format], 'base64');

async function upload(bytes) {
  const response = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/upload', { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/octet-stream', 'X-CMS-Upload-Id': crypto.randomUUID(), 'X-CMS-Filename': 'fixture.bin' }, body: bytes });
  assert.equal(response.status, 201, await response.clone().text());
  const asset = await response.json();
  const stored = await (await runtime.mf.getR2Bucket('CMS_MEDIA')).get(asset.src.slice('/media/'.length));
  return { asset, stored: Buffer.from(await stored.arrayBuffer()) };
}

const jpegSegment = (marker, payload) => Buffer.concat([Buffer.from([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 255]), payload]);
const withSegments = (jpeg, ...segments) => Buffer.concat([jpeg.subarray(0, 2), ...segments, jpeg.subarray(2)]);
// Little-endian Exif: IFD0 = Orientation(6) + GPS pointer (0x8825) -> GPS IFD with GPSLatitudeRef.
function gpsExif(orientation) {
  const tiff = Buffer.alloc(8 + 2 + 24 + 4 + 2 + 12 + 4);
  tiff.write('II', 0, 'ascii'); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(2, 8);
  tiff.writeUInt16LE(0x0112, 10); tiff.writeUInt16LE(3, 12); tiff.writeUInt32LE(1, 14); tiff.writeUInt16LE(orientation, 18);
  tiff.writeUInt16LE(0x8825, 22); tiff.writeUInt16LE(4, 24); tiff.writeUInt32LE(1, 26); tiff.writeUInt32LE(38, 30);
  tiff.writeUInt16LE(1, 38); tiff.writeUInt16LE(1, 40); tiff.writeUInt16LE(2, 42); tiff.writeUInt32LE(2, 44); tiff.write('N\0', 48, 'latin1');
  return Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
}
// Segments before the scan, as [marker, payload] pairs.
function headerSegments(jpeg) {
  const found = [];
  for (let at = 2; jpeg[at + 1] !== 0xda; at += 2 + jpeg.readUInt16BE(at + 2)) found.push([jpeg[at + 1], jpeg.subarray(at + 4, at + 2 + jpeg.readUInt16BE(at + 2))]);
  return found;
}
function exifTags(payload) {
  const little = payload.toString('latin1', 6, 8) === 'II', u16 = at => little ? payload.readUInt16LE(6 + at) : payload.readUInt16BE(6 + at);
  const ifd = little ? payload.readUInt32LE(10) : payload.readUInt32BE(10), count = u16(ifd);
  return Array.from({ length: count }, (_, index) => ({ tag: u16(ifd + 2 + index * 12), value: u16(ifd + 2 + index * 12 + 8) }));
}

test('A13: JPEG with trailing bytes is accepted and stored up to EOI; FFD9 inside an APP segment is not the end', async () => {
  const base = fixture('jpeg');
  // APP2 carries FF D9 in its payload, as MPF/ICC data may; the trailer is a motion-photo style video with another FF D9.
  const app2 = jpegSegment(0xe2, Buffer.from([0x41, 0xff, 0xd9, 0x42]));
  const clean = withSegments(base, app2);
  const trailer = Buffer.concat([Buffer.from('\0\0\0\x18ftypmp42', 'latin1'), Buffer.from([0xff, 0xd9, 1, 2, 3])]);
  const { stored } = await upload(Buffer.concat([clean, trailer]));
  assert.deepEqual(stored, clean);
  assert.deepEqual(stored.subarray(-2), Buffer.from([0xff, 0xd9]));
  assert.deepEqual((await upload(Buffer.concat([base, Buffer.from([0])]))).stored, base);
});

test('A13: PNG with data after IEND and GIF with data after the trailer are stored trimmed', async () => {
  for (const format of ['png', 'gif']) {
    const base = fixture(format);
    assert.deepEqual((await upload(Buffer.concat([base, Buffer.from('trailing data')]))).stored, base, format);
  }
});

test('A13: JPEG GPS IFD, XMP and APP13 are dropped; Orientation survives as the only Exif entry', async () => {
  const base = fixture('jpeg');
  const xmp = jpegSegment(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>Stockholm</x:xmpmeta>', 'latin1'));
  const photoshop = jpegSegment(0xed, Buffer.from('Photoshop 3.0\0secret', 'latin1'));
  const original = withSegments(base, jpegSegment(0xe1, gpsExif(6)), xmp, photoshop);
  assert.ok(exifTags(headerSegments(original)[0][1]).some(entry => entry.tag === 0x8825), 'fixture must contain a GPS pointer');
  const { asset, stored } = await upload(original);
  const segments = headerSegments(stored);
  assert.equal(segments.filter(([marker]) => marker === 0xed).length, 0);
  const exifs = segments.filter(([marker]) => marker === 0xe1);
  assert.equal(exifs.length, 1);
  assert.deepEqual(exifTags(exifs[0][1]), [{ tag: 0x0112, value: 6 }]);
  assert.equal(stored.includes('Stockholm'), false);
  assert.equal(stored.includes('secret'), false);
  // Orientation=6 is kept, so the displayed image is unchanged: same stored dimensions as an upload without metadata.
  assert.equal(asset.width, 16);
  assert.equal(asset.height, 16);
  assert.deepEqual(stored.subarray(stored.length - (base.length - 2)), base.subarray(2));
});

test('A13: JPEG without Orientation ends up with no Exif at all', async () => {
  const base = fixture('jpeg');
  const gpsOnly = gpsExif(1); gpsOnly.writeUInt16LE(0x0111, 6 + 10);
  const { stored } = await upload(withSegments(base, jpegSegment(0xe1, gpsOnly)));
  assert.deepEqual(stored, base);
});

test('A13: PNG eXIf, tEXt, iTXt and zTXt chunks are dropped, other chunks stay', async () => {
  const base = fixture('png');
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), Buffer.from(data, 'latin1')]), out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const metadata = ['eXIf', 'tEXt', 'iTXt', 'zTXt'].map(type => chunk(type, 'Comment\0Stockholm'));
  const withMetadata = Buffer.concat([base.subarray(0, 33), ...metadata, base.subarray(33)]);
  const { stored } = await upload(withMetadata);
  assert.deepEqual(stored, base);
});

test('A13: fill bytes before a restart marker or before EOI do not end the scan early', () => {
  const sos = jpegSegment(0xda, Buffer.from([0, 0]));
  for (const scan of [[0xaa, 0xff, 0xff, 0xd0, 0xbb, 0xff, 0xd9], [0xaa, 0xbb, 0xff, 0xff, 0xd9]]) {
    const input = Buffer.concat([Buffer.from([0xff, 0xd8]), sos, Buffer.from(scan)]);
    assert.deepEqual(Buffer.from(cleanRaster(input, { mime: 'image/jpeg' })), Buffer.concat([input.subarray(0, 2), sos, Buffer.from(scan)]));
  }
});
