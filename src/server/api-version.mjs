// The portfolio has one real public API major version. Existing clients may
// omit the header; a different explicit major version is not silently accepted.
export const API_MAJOR_VERSION = '1';
const VERSIONED_READ_PATHS = new Set(['/data/cards.json', '/data/runtime.json']);

export function isVersionedApiPath(pathname) {
  return pathname === '/api' ||
    pathname.startsWith('/api/') ||
    VERSIONED_READ_PATHS.has(pathname) ||
    /^\/data\/cards\/[a-z0-9-]{1,80}\.json$/.test(pathname);
}

export function rejectUnsupportedApiVersion(request) {
  const requested = request.headers.get('API-Version');
  if (requested === null || requested === API_MAJOR_VERSION) return null;
  return Response.json({
    error: 'Unsupported API version',
    code: 'UNSUPPORTED_API_VERSION',
    hint: 'Use API-Version: 1 or omit this header. Read /developers/ and /openapi.json.',
  }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
}

export function withApiVersion(response) {
  const headers = new Headers(response.headers);
  headers.set('API-Version', API_MAJOR_VERSION);
  const vary = headers.get('Vary');
  if (!vary) headers.set('Vary', 'API-Version');
  else if (!vary.split(',').some(field => field.trim().toLowerCase() === 'api-version'))
    headers.set('Vary', vary + ', API-Version');
  const policy = '</developers/>; rel="deprecation"; type="text/html"';
  const links = headers.get('Link');
  if (!links) headers.set('Link', policy);
  else if (!links.includes('rel="deprecation"')) headers.set('Link', links + ', ' + policy);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
