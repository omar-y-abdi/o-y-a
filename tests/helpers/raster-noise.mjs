import { inflateSync } from 'node:zlib';

const CHANNELS = { 2: 3, 6: 4 };
const NOISE_PIXELS = 16;

function paeth(left, up, corner) {
  const estimate = left + up - corner, a = Math.abs(estimate - left), b = Math.abs(estimate - up), c = Math.abs(estimate - corner);
  return a <= b && a <= c ? left : b <= c ? up : corner;
}

function predict(filter, left, up, corner) {
  switch (filter) {
    case 0: return 0;
    case 1: return left;
    case 2: return up;
    case 3: return (left + up) >> 1;
    case 4: return paeth(left, up, corner);
    default: throw new Error(`Unknown PNG filter ${filter}`);
  }
}

// The 8-bit, non-interlaced RGB(A) a browser screenshot produces.
export function decodePng(buffer) {
  const compressed = [];
  let header;
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset), type = buffer.toString('latin1', offset + 4, offset + 8), data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') header = data;
    if (type === 'IDAT') compressed.push(data);
    offset += 12 + length;
  }
  const width = header.readUInt32BE(0), height = header.readUInt32BE(4), channels = CHANNELS[header[9]];
  if (header[8] !== 8 || !channels || header[12] !== 0) throw new Error('Unsupported PNG format');
  const packed = inflateSync(Buffer.concat(compressed)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row++) {
    const filter = packed[row * (stride + 1)], source = row * (stride + 1) + 1, target = row * stride;
    for (let index = 0; index < stride; index++) {
      const hasLeft = index >= channels, left = hasLeft ? pixels[target + index - channels] : 0;
      const up = row ? pixels[target + index - stride] : 0, corner = row && hasLeft ? pixels[target + index - stride - channels] : 0;
      pixels[target + index] = packed[source + index] + predict(filter, left, up, corner);
    }
  }
  return { width, height, channels, pixels };
}

// Two captures of one version have differed by 7 pixels, 1 per channel, on an
// anti-aliased corner, cause unproven. Owner decision: up to 16 such pixels pass.
// Anything larger stays a real difference.
export function rasterNoise(left, right) {
  const a = decodePng(left), b = decodePng(right);
  if (a.width !== b.width || a.height !== b.height || a.channels !== b.channels) return false;
  let changed = 0;
  for (let pixel = 0; pixel < a.pixels.length; pixel += a.channels) {
    let differs = false;
    for (let channel = 0; channel < a.channels; channel++) {
      const delta = Math.abs(a.pixels[pixel + channel] - b.pixels[pixel + channel]);
      if (delta > 1) return false;
      differs ||= delta === 1;
    }
    if (differs && ++changed > NOISE_PIXELS) return false;
  }
  return true;
}
