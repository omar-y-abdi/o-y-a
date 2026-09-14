export const SITE_ORIGIN = 'https://omaryusuf.se';
const RESERVED = new Set(['admin', 'login', 'api', 'assets', 'media', 'data', 'cdn-cgi', 'cms-public', 'social', 'mail']);

export function canonicalPagePath(path) {
  if (RESERVED.has(path.split('/')[1])) return null;
  if (path === '/404.html') return path;
  if (path.endsWith('/index.html')) return path.slice(0, -10);
  if (path.endsWith('/')) return path;
  return path.split('/').at(-1).includes('.') ? null : path + '/';
}

export function resolveSiteLink(href, pagePath, origins = [SITE_ORIGIN]) {
  const url = new URL(href, SITE_ORIGIN + pagePath);
  if (!new Set([SITE_ORIGIN, 'https://www.omaryusuf.se', ...origins]).has(url.origin)) return { kind: 'external' };
  const path = canonicalPagePath(url.pathname);
  return { kind: path ? 'page' : 'resource', path: path ?? url.pathname, hash: decodeURIComponent(url.hash.slice(1)) };
}
