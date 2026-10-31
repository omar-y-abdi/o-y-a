import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { decodePng, rasterNoise } from './helpers/raster-noise.mjs';

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length);
  head.write(type, 4, 'latin1');
  return Buffer.concat([head, data, Buffer.alloc(4)]); // The decoder does not read the CRC.
}

function paeth(left, up, corner) {
  const estimate = left + up - corner, a = Math.abs(estimate - left), b = Math.abs(estimate - up), c = Math.abs(estimate - corner);
  return a <= b && a <= c ? left : b <= c ? up : corner;
}

// Each row uses the next filter, so a decoder must implement all five.
function encode({ width, height, channels, pixels, depth = 8, interlace = 0 }) {
  const stride = width * channels, rows = [];
  for (let row = 0; row < height; row++) {
    const filter = row % 5, encoded = Buffer.alloc(stride + 1);
    encoded[0] = filter;
    for (let index = 0; index < stride; index++) {
      const at = row * stride + index, left = index >= channels ? pixels[at - channels] : 0, up = row ? pixels[at - stride] : 0, corner = row && index >= channels ? pixels[at - stride - channels] : 0;
      encoded[index + 1] = pixels[at] - [0, left, up, (left + up) >> 1, paeth(left, up, corner)][filter];
    }
    rows.push(encoded);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = depth;
  header[9] = channels === 4 ? 6 : 2;
  header[12] = interlace;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
}

const image = (channels = 3, width = 8, height = 11) => {
  const pixels = Buffer.alloc(width * height * channels);
  for (let index = 0; index < pixels.length; index++) pixels[index] = (index * 37 + (index >> 3) * 11) % 200 + 20;
  return { width, height, channels, pixels };
};
const changed = (source, edits) => {
  const pixels = Buffer.from(source.pixels);
  for (const [at, delta] of edits) pixels[at] += delta;
  return encode({ ...source, pixels });
};

test('decodes RGB and RGBA through all five filters', () => {
  for (const channels of [3, 4]) {
    const source = image(channels);
    assert.deepEqual(decodePng(encode(source)), source);
  }
});

test('refuses formats a screenshot does not use', () => {
  assert.throws(() => decodePng(encode({ ...image(), interlace: 1 })), /Unsupported PNG/);
  assert.throws(() => decodePng(encode({ ...image(), depth: 16 })), /Unsupported PNG/);
});

test('isolated rounding of up to 16 pixels is noise', () => {
  const source = image(), base = encode(source);
  assert.equal(rasterNoise(base, base), true);
  assert.equal(rasterNoise(base, changed(source, [[0, 1]])), true);
  assert.equal(rasterNoise(base, changed(source, [[0, 1], [1, -1], [2, 1]])), true, 'All channels of one pixel count once');
  assert.equal(rasterNoise(base, changed(source, Array.from({ length: 16 }, (_, pixel) => [pixel * 3, 1]))), true);
});

test('a 17th pixel, a larger delta or another size is a real difference', () => {
  const source = image(), base = encode(source);
  assert.equal(rasterNoise(base, changed(source, Array.from({ length: 17 }, (_, pixel) => [pixel * 3, 1]))), false);
  assert.equal(rasterNoise(base, changed(source, [[0, 2]])), false);
  assert.equal(rasterNoise(base, encode(image(3, 8, 12))), false);
  assert.equal(rasterNoise(base, encode(image(4))), false);
});
