// The callers retain their API-specific JSON/error contracts. This primitive
// only reads bounded bytes; a missing stream is distinct from an empty stream.
export class BodyTooLarge extends RangeError {
  constructor(declared = false) {
    super('Body too large');
    this.declared = declared;
  }
}

export async function readBounded(request, limit) {
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit)) throw new BodyTooLarge(true);
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new BodyTooLarge(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
