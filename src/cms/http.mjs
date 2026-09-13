export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function errorResponse(error) {
  if (error instanceof HttpError) return json({ error: error.message, ...(error.details ? { details: error.details } : {}) }, error.status);
  return json({ error: 'Tjänsten kunde inte slutföra ändringen. Ditt utkast finns kvar.' }, 503);
}

export function requireWriteRequest(request, contentType = 'application/json') {
  if (request.method !== 'POST') throw new HttpError(405, 'Den här åtgärden kräver POST.');
  const origin = new URL(request.url).origin;
  const site = request.headers.get('Sec-Fetch-Site');
  if (request.headers.get('Origin') !== origin || request.headers.get('X-CMS-Request') !== '1' || (site && site !== 'same-origin')) {
    throw new HttpError(403, 'Begäran måste komma från den inloggade editorn.');
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== contentType) {
    throw new HttpError(415, 'Begäran har fel innehållstyp.');
  }
}

export async function readBytes(request, limit) {
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > limit)) throw new HttpError(413, 'Innehållet är för stort.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Innehåll saknas.');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, 'Innehållet är för stort.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

export async function readJson(request, limit = 4 * 1024 * 1024) {
  const bytes = await readBytes(request, limit);
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new HttpError(400, 'Innehållet måste vara giltig JSON i UTF-8.'); }
}
