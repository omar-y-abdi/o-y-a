import { layout } from '../templates/layout.mjs';
import { CSP } from '../csp.mjs';
import { escape } from '../templates/components.mjs';
import { themeCss, fontCss } from './theme.mjs';
import { readPublicPage, readPublicData } from './store.mjs';
import { canonicalPagePath } from './routes.mjs';
import { routes } from '../content/site.mjs';
import { normalizeFooterPage, normalizeSkiftPage, refreshDevelopersPage } from './legacy-project.mjs';
import { isSkiftPath } from './skift.mjs';
import { composePage, legacySeed } from './frame.mjs';
import { reportFailure } from './diagnostics.mjs';

export const ADMIN_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
const safeStyle = css => css.replaceAll('<', '\\3c ');

export function renderWinPreview(card, project, built) {
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Förhandsvisning av liten vinst</title><style>${safeStyle(fontCss(project))}body{margin:24px;background:#f4f5ee}#cms-win-preview{max-width:600px;margin:auto}</style><script type="application/json" id="cms-preview-data">${JSON.stringify({ schemaVersion: 1, cards: [card], runtime: {} }).replaceAll('<', '\\u003c')}</script><script type="module" src="${built.preview}"></script></head><body data-cms-preview="true"><div id="cms-win-preview"></div></body></html>`;
}

export function renderPage(page, built, { version, preview, project, runtimeJson = page.runtimeJson, resources = page.resources, resourceOrigin } = {}) {
  let base = layout(page, '', { css: built.styles[page.template] ?? built.styles.home, main: built.main, resources, resourceOrigin });
  if (preview) base = base.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  const attributes = `id="top" class="${escape(page.bodyClass)}" data-page="${escape(page.path)}" data-cms-version="${version ?? 0}"${preview ? ' data-cms-preview="true"' : ''}`;
  const html = composePage(project?.frame, page).replace(/<footer\b[^>]*class="[^"]*\bsite-footer\b[^"]*"[^>]*>[\s\S]*?<\/footer>/g, footer => footer.replace(/(<span\b[^>]*>© )\d{4}( Omar Yusuf<\/span>)/, (_all, before, after) => before + new Date().getUTCFullYear() + after));
  let result = base.replace(/<body\b[^>]*>[\s\S]*<\/body>/, () => `<body ${attributes}>${html}</body>`);
  const styles = preview ? `<style>${safeStyle(themeCss(project.theme) + fontCss(project) + (project.frame?.css ?? '') + page.css)}</style>` : `<link rel="stylesheet" href="/cms-public/v${version}/${page.id}.css">`;
  const fixture = preview ? `<script type="application/json" id="cms-preview-data">${JSON.stringify({ schemaVersion: 1, cards: project.cards, runtime: project.runtime }).replaceAll('<', '\\u003c')}</script><script type="module" src="${built.preview}"></script>` : runtimeJson === undefined ? '' : `<script type="application/json" id="cms-runtime">${runtimeJson.replaceAll('<', '\\u003c')}</script>`;
  return result.replace('</head>', () => `${styles}${fixture}</head>`);
}

export async function publicContent(request, env, built, seed = {}) {
  if (!env.CMS_DB) return null;
  const url = new URL(request.url);
  if (url.pathname === '/login' || url.pathname.startsWith('/login/')) return null;
  const style = url.pathname.match(/^\/cms-public\/v(\d+)\/([a-zA-Z0-9-]+)\.css$/);
  if (style) {
    const [page, theme] = await Promise.all([
      env.CMS_DB.prepare('SELECT css, html, meta FROM cms_rendered WHERE version = ? AND json_extract(meta, \'$.id\') = ?').bind(Number(style[1]), style[2]).first(),
      env.CMS_DB.prepare("SELECT html FROM cms_rendered WHERE version = ? AND path = '@theme'").bind(Number(style[1])).first(),
    ]);
    if (!page || !theme) return new Response('Not found', { status: 404 });
    return new Response(themeCss(JSON.parse(theme.html)) + page.css, { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  }
  const exactCard = url.pathname.match(/^\/data\/cards\/([a-z0-9-]{1,80})\.json$/);
  if (exactCard) {
    const row = await readPublicPage(env.CMS_DB, `@card/${exactCard[1]}`);
    if (!row?.html) return Response.json({error:'Card not found',code:'NOT_FOUND',hint:'Read /data/cards.json for published card IDs.'}, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return Response.json(JSON.parse(row.html), { headers: { 'Cache-Control': 'no-store', 'X-CMS-Version': String(row.version) } });
  }
  if (['/data/cards.json', '/data/runtime.json'].includes(url.pathname)) {
    const data = await readPublicData(env.CMS_DB, url.pathname.includes('cards') ? 'cards' : 'runtime');
    return data ? Response.json(data.value, { headers: { 'Cache-Control': 'no-store', 'X-CMS-Version': String(data.version) } }) : null;
  }
  if (url.pathname === '/sitemap.xml') {
    const data = await readPublicData(env.CMS_DB, 'manifest');
    if (!data) return null;
    const published = data.value.filter(p => !p.noindex).map(p => p.path);
    // Preserve existing CMS publishing decisions. The new static developers
    // page is absent from manifests created before this deployment.
    for (const path of ['/developers/', '/play/skift/']) {
      const added = routes.find(page => page.path === path);
      if (added && !added.noindex && !data.value.some(entry => entry.path === path)) published.push(path);
    }
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${published.map(path => `<url><loc>https://omaryusuf.se${path}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'no-store' } });
  }
  const canonical = canonicalPagePath(url.pathname);
  if (!canonical) return null;
  // The game is code-owned: its build is served even if a revision stored it.
  if (isSkiftPath(canonical)) {
    const frame = await readPublicPage(env.CMS_DB, '@frame');
    if (!frame?.html || !seed.skiftPage) return null;
    const page = { ...seed.skiftPage, html: composePage(frame, seed.skiftPage), resources: frame.resources, runtimeJson: frame.runtimeJson };
    return new Response(renderPage(page, built, { version: frame.version, resourceOrigin: url.origin }), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-CMS-Version': String(frame.version) } });
  }
  const state = await readPublicPage(env.CMS_DB, canonical);
  // An existing CMS database may not contain pages added in a later deploy.
  // Keep the new public documentation reachable via the built static asset.
  if (canonical === '/developers/' && state?.page === null) return null;
  if (!state) return null;
  if (state.page !== null && url.pathname !== canonical) {
    url.pathname = canonical;
    return new Response(null, { status: 307, headers: { Location: url.href, 'Cache-Control': 'no-store' } });
  }
  const missing = state.page === null || url.pathname === '/404.html';
  const page = state.page === null ? await readPublicPage(env.CMS_DB, '/404.html') : state;
  if (!page || page.page === null) return new Response('Sidan finns inte.', { status: 404 });
  const legacy = legacySeed(seed);
  const definition = legacy.pages?.find(item => item.id === page.id || item.id === page.sourceId) ?? legacy.blank;
  let normalized = page;
  // Read-time migrations must not take a published page offline. Serve the
  // stored page and report; Save and validation keep failing loudly.
  try { if (page.frameVersion !== 2) normalized = normalizeSkiftPage(normalizeFooterPage(refreshDevelopersPage(page, legacy.footerPage)), definition); }
  catch (error) { reportFailure(error, 'public'); }
  return new Response(renderPage(normalized, built, { version: page.version, resourceOrigin: url.origin }), { status: missing ? 404 : 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': CSP, 'X-CMS-Version': String(page.version) } });
}
