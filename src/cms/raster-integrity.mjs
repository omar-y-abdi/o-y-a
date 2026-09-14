import { HttpError } from './http.mjs';

const invalid = () => { throw new HttpError(422, 'Bilden är skadad eller ofullständig. Exportera en ny bild och försök igen.'); };
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
  return (crc ^ 0xffffffff) >>> 0;
}

// Check container completeness before calling a decoder, which may otherwise
// repair truncated inputs. Codec decoding itself belongs to the Images binding.
export function checkRasterContainer(bytes, info) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (at, size) => String.fromCharCode(...bytes.subarray(at, at + size));
  const end = bytes.length;
  const need = (at, size) => { if (at < 0 || size < 0 || at + size > end) invalid(); };
  let frames = 1;
  if (info.mime === 'image/png') {
    let offset = 8, data = false, finished = false;
    while (offset < end) {
      need(offset, 12);
      const size = view.getUint32(offset), type = text(offset + 4, 4);
      need(offset, size + 12);
      if (offset === 8 && (type !== 'IHDR' || size !== 13) || offset !== 8 && type === 'IHDR') invalid();
      if (crc32(bytes.subarray(offset + 4, offset + 8 + size)) !== view.getUint32(offset + 8 + size)) invalid();
      if (type === 'IDAT' && size) data = true;
      if (type === 'acTL') { if (size !== 8) invalid(); frames = view.getUint32(offset + 8); }
      offset += size + 12;
      if (type === 'IEND') { if (size || offset !== end) invalid(); finished = true; break; }
    }
    if (!data || !finished) invalid();
  } else if (info.mime === 'image/jpeg') {
    if (end < 4 || view.getUint16(0) !== 0xffd8 || view.getUint16(end - 2) !== 0xffd9) invalid();
  } else if (info.mime === 'image/webp') {
    if (view.getUint32(4, true) + 8 !== end || text(8, 4) !== 'WEBP') invalid();
    let offset = 12, picture = false; frames = 0;
    while (offset < end) {
      need(offset, 8); const size = view.getUint32(offset + 4, true), type = text(offset, 4);
      need(offset, 8 + size + (size & 1));
      if (['VP8 ', 'VP8L', 'ANMF'].includes(type) && size) picture = true;
      if (type === 'ANMF') frames++;
      offset += 8 + size + (size & 1);
    }
    if (!picture) invalid(); frames = Math.max(1, frames);
  } else if (info.mime === 'image/gif') {
    need(0, 13); let offset = 13 + (bytes[10] & 128 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
    need(0, offset); frames = 0; let finished = false;
    const subBlocks = () => {
      while (true) { need(offset, 1); const size = bytes[offset++]; if (!size) return; need(offset, size); offset += size; }
    };
    while (offset < end) {
      const kind = bytes[offset++];
      if (kind === 0x3b) { finished = true; break; }
      if (kind === 0x21) { need(offset++, 1); subBlocks(); }
      else if (kind === 0x2c) {
        need(offset, 9); const flags = bytes[offset + 8]; offset += 9;
        if (flags & 128) offset += 3 * 2 ** ((flags & 7) + 1);
        need(offset, 1); if (bytes[offset] < 2 || bytes[offset] > 8) invalid(); offset++;
        subBlocks(); frames++;
      } else invalid();
    }
    if (!frames || !finished || offset !== end) invalid();
  } else if (info.mime === 'image/avif') {
    let offset = 0, metadata = false, picture = false;
    while (offset < end) {
      need(offset, 8); let size = view.getUint32(offset); const type = text(offset + 4, 4); let header = 8;
      if (size === 1) { need(offset, 16); size = Number(view.getBigUint64(offset + 8)); header = 16; }
      if (size === 0) size = end - offset;
      if (!Number.isSafeInteger(size) || size < header) invalid(); need(offset, size);
      if (type === 'meta' && size > header) metadata = true;
      if (type === 'mdat' && size > header) picture = true;
      offset += size;
    }
    if (!metadata || !picture) invalid();
  }
  if (frames < 1 || frames > 256 || frames * info.width * info.height > 32000000) throw new HttpError(422, 'Animationen är för stor. Max 256 bildrutor och 32 megapixlar totalt.');
}

export async function decodeRaster(env, bytes, info) {
  checkRasterContainer(bytes, info);
  if (!env.CMS_IMAGES) throw new HttpError(503, 'Bildkontrollen saknar CMS_IMAGES. Ingen okontrollerad bild har sparats.');
  // output(), not info(), forces codec decoding. Keep original immutable bytes;
  // this tiny derivative is validation only. Production also decodes animation.
  try {
    const output = await env.CMS_IMAGES.input(new Blob([bytes]).stream()).transform({ width: 1, height: 1 }).output({ format: 'image/webp', anim: true });
    const response = output.response();
    if (!response.ok) throw new Error('CMS_IMAGES_SERVICE');
    const reader = response.body.getReader(), header = new Uint8Array(12); let size = 0;
    try {
      for (;;) {
        const part = await reader.read(); if (part.done) break;
        if (size < header.length) header.set(part.value.subarray(0, header.length - size), size);
        size += part.value.byteLength;
        if (size > 1024 * 1024) { await reader.cancel(); throw new Error('CMS_IMAGES_OUTPUT_LIMIT'); }
      }
    } finally { reader.releaseLock(); }
    if (size < 12) throw new Error('CMS_IMAGES_EMPTY_OUTPUT');
    if (String.fromCharCode(...header.subarray(0, 4)) !== 'RIFF' || String.fromCharCode(...header.subarray(8)) !== 'WEBP' || new DataView(header.buffer).getUint32(4, true) + 8 !== size) throw new Error('CMS_IMAGES_INVALID_OUTPUT');
  } catch (error) {
    // Never misreport missing configuration, quota, or service outages as a
    // damaged user file. Those errors use the normal correlated 503 path.
    if (error.code === 9520) throw new HttpError(422, 'Bildformatet stöds inte av den konfigurerade bildtjänsten. Exportera bilden som PNG eller JPEG.');
    if ([9412, 9413].includes(error.code) || /corrupt|invalid.*image|truncat|premature|decode|pngload|jpegload|webpload|heifload|libpng read error/i.test(error.message ?? '')) invalid();
    throw error;
  }
}
