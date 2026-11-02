import { handleContact, contactConfig } from './server/contact.mjs';
import { readConsent } from './client/privacy.mjs';
import { routes } from './content/site.mjs';
import { CSP, SKIFT_CSP } from './csp.mjs';
import { built, renderKey, seedAsset } from '../.generated/cms-build.mjs';
import { publicBuilt } from '../.generated/cms-public.mjs';
import { loadAdminSeed } from './cms/admin-seed.mjs';
import { handleAdmin } from './cms/api.mjs';
import { assetResponse } from './cms/media-files.mjs';
import { serveMailFile } from './cms/email-api.mjs';
import { maintainMailFiles } from './cms/mail-files.mjs';
import { ADMIN_CSP, publicContent } from './cms/render.mjs';
import { isSkiftPath } from './cms/skift.mjs';
import { errorResponse } from './cms/http.mjs';
import { reportFailure } from './cms/diagnostics.mjs';
import { negotiatePublicPage } from './server/markdown.mjs';
import { isVersionedApiPath, rejectUnsupportedApiVersion, withApiVersion } from './server/api-version.mjs';
import { BodyTooLarge, readBounded } from './api/http.mjs';

const PAGES = new Set(routes.filter(page => !page.noindex).map(page => page.path));
const ADMIN_ASSETS = new Set(built.adminAssets);
const EVENTS = new Set(['page_view','joy','bubble_complete','project_open']);
const CANONICAL = 'https://omaryusuf.se';
const MAX_BODY_BYTES = 256;
const TRUST_ALIASES = new Map([['/about','/om/'],['/contact','/kontakt/'],['/privacy','/integritet/']]);
const ERROR_GUIDANCE = {
  'Method not allowed': ['METHOD_NOT_ALLOWED', 'Use an HTTP method listed in the Allow response header.'],
  'Origin or consent missing': ['CONSENT_REQUIRED', 'Use the first-party webpage with an explicit analytics consent choice.'],
  'Consent required': ['CONSENT_REQUIRED', 'Enable consent in the webpage; privacy signals always take precedence.'],
  'JSON required': ['UNSUPPORTED_MEDIA_TYPE', 'Send Content-Type: application/json.'],
  'Body too large': ['PAYLOAD_TOO_LARGE', 'Send a request body of no more than 256 bytes.'],
  'Invalid event': ['INVALID_EVENT', 'Send a valid UTF-8 JSON object with event and page.'],
  'Unknown event data': ['INVALID_EVENT', 'Only predefined event names and known page paths are accepted.'],
  'Analytics not configured': ['SERVICE_UNAVAILABLE', 'Analytics are optional and currently disabled.'],
  'Analytics unavailable': ['SERVICE_UNAVAILABLE', 'Do not retry automatically; analytics are optional.'],
  'Unknown host': ['UNKNOWN_HOST', 'Use https://omaryusuf.se.'],
  'Non-canonical path': ['NON_CANONICAL_PATH', 'Use a decoded canonical URL without duplicate separators.'],
  'Unknown public API endpoint': ['NOT_FOUND', 'See /openapi.json or /developers/ for documented public routes.'],
};
function secure(response, https = true, policy = CSP) {
  const result = new Response(response.body, response);
  const headers = result.headers;
  headers.set('Content-Security-Policy', policy === ADMIN_CSP ? policy : headers.get('Content-Security-Policy') || policy);
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('X-Frame-Options','DENY');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  if (https) headers.set('Strict-Transport-Security','max-age=31536000');
  return result;
}
function json(data, status = 200, extra = {}) {
  const details = status >= 400 && typeof data?.error === 'string'
    ? ERROR_GUIDANCE[data.error] ?? ['REQUEST_REJECTED', 'Check the request and the public API documentation.']
    : null;
  return Response.json(details ? {...data, code:details[0], hint:details[1]} : data,
    { status, headers:{'Cache-Control':'no-store', ...extra} });
}
function isLocalPreview(url, env) {
  return url.origin === env.PREVIEW_ORIGIN && ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
}
async function eventResponse(request, env, url) {
  if (request.method !== 'POST') return json({error:'Method not allowed'},405,{Allow:'POST'});
  if (request.headers.get('Origin') !== url.origin || request.headers.get('X-OY-Consent') !== 'v1') return json({error:'Origin or consent missing'},403);
  if (request.headers.get('Sec-GPC') === '1' || request.headers.get('DNT') === '1' || readConsent(request.headers.get('Cookie') || '') !== 'allow') return json({error:'Consent required'},403);
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({error:'JSON required'},415);
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(request,MAX_BODY_BYTES) ?? new Uint8Array())); }
  catch (error) { return json({error:error instanceof BodyTooLarge && error.declared ? 'Body too large' : 'Invalid event'},error instanceof RangeError ? 413 : 400); }
  if (!data || Array.isArray(data) || typeof data !== 'object' || Object.keys(data).length !== 2 || !EVENTS.has(data.event) || !PAGES.has(data.page)) return json({error:'Unknown event data'},400);
  if (!env.ANALYTICS || env.ANALYTICS_ENABLED !== 'true') return json({error:'Analytics not configured'},503);
  try { env.ANALYTICS.writeDataPoint({blobs:[data.page,data.event],doubles:[1],indexes:['site']}); }
  catch { return json({error:'Analytics unavailable'},503); }
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
export default {
  async scheduled(_controller, env) {
    await maintainMailFiles(env);
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    const local = isLocalPreview(url,env);
    const stage = env.CMS_STAGE === 'true' && url.protocol === 'https:' && url.origin === env.CMS_ORIGIN;
    if (!local && !stage && !['omaryusuf.se','www.omaryusuf.se'].includes(url.hostname)) return secure(json({error:'Unknown host'},421));
    if (!local && (url.protocol !== 'https:' || url.hostname === 'www.omaryusuf.se' || url.port)) {
      return secure(new Response(null,{status:308,headers:{Location:CANONICAL+url.pathname+url.search}}));
    }
    if (url.pathname.includes('%') || url.pathname.includes('\\') || url.pathname.includes('//')) return secure(json({error:'Non-canonical path'},400),url.protocol === 'https:');
    if (['GET','HEAD'].includes(request.method) && TRUST_ALIASES.has(url.pathname)) {
      return secure(new Response(null, { status:308, headers:{Location:(local || stage ? url.origin : CANONICAL) + TRUST_ALIASES.get(url.pathname) + url.search} }),url.protocol === 'https:');
    }
    const versionedApi = isVersionedApiPath(url.pathname);
    const unsupportedVersion = versionedApi ? rejectUnsupportedApiVersion(request) : null;
    if (unsupportedVersion) {
      const versionedResponse = withApiVersion(secure(unsupportedVersion,url.protocol === 'https:'));
      return request.method === 'HEAD' ? new Response(null,versionedResponse) : versionedResponse;
    }
    let response;
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      response = await handleAdmin(request,env,{built,studioKey:seedAsset.studioKey,renderKey,loadSeed:() => loadAdminSeed(env)});
      const secured = secure(response,url.protocol === 'https:',ADMIN_CSP);
      secured.headers.set('Cache-Control', response.status === 200 && ['GET','HEAD'].includes(request.method) && ADMIN_ASSETS.has(url.pathname) ? 'private, max-age=31536000, immutable' : 'no-store');
      secured.headers.set('X-Robots-Tag','noindex, nofollow');
      return request.method === 'HEAD' ? new Response(null,secured) : secured;
    }
    if (url.pathname.startsWith('/mail-file/')) {
      try { response = await serveMailFile(request,env); } catch (error) { response = errorResponse(error,'mail'); }
    }
    else if (url.pathname.startsWith('/media/')) {
      try { response = await assetResponse(request,env); } catch (error) { response = errorResponse(error,'media'); }
    }
    else if (url.pathname === '/api/contact') response = await handleContact(request,env);
    else if (url.pathname === '/api/contact/config') response = ['GET','HEAD'].includes(request.method) ? await contactConfig(env) : json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
    else if (url.pathname === '/api/event') response = await eventResponse(request,env,url);
    else if (url.pathname === '/api/config') {
      response = request.method === 'GET' || request.method === 'HEAD'
        ? json({analytics:Boolean(env.ANALYTICS) && env.ANALYTICS_ENABLED === 'true'})
        : json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
    } else if (url.pathname === '/api' || url.pathname.startsWith('/api/')) response = json({error:'Unknown public API endpoint'},404);
    else if (!['GET','HEAD'].includes(request.method)) response = json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
    else if (url.pathname.endsWith('.map') || url.pathname.startsWith('/.')) response = new Response('Not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    else {
      try { response = await publicContent(request,env,publicBuilt,async () => (await loadAdminSeed(env)).seed) ?? await env.ASSETS.fetch(request); }
      catch(error) { const requestId=reportFailure(error,'public'); response = new Response(`Tillfälligt avbrott. Försök igen. Fel-ID: ${requestId}`,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Request-ID':requestId}}); }
    }
    if (url.pathname === '/404.html' && response.status === 200) {
      response = new Response(response.body,{status:404,headers:response.headers});
    }
    response = await negotiatePublicPage(request, response);
    if (isSkiftPath(url.pathname) && response.headers.get('Content-Type')?.includes('text/html')) {
      response = new Response(response.body, response);
      response.headers.set('Content-Security-Policy', SKIFT_CSP);
    }
    const secured = versionedApi
      ? withApiVersion(secure(response,url.protocol === 'https:'))
      : secure(response,url.protocol === 'https:');
    if (stage || url.pathname.startsWith('/login')) secured.headers.set('X-Robots-Tag','noindex, nofollow');
    if (url.pathname === '/' && ['GET','HEAD'].includes(request.method) && secured.status === 200) {
      // RFC 8631 discovery works for browsers, crawlers and Markdown clients
      // without adding another visible CMS/footer element.
      secured.headers.append('Link', '</developers/>; rel="service-doc"; type="text/html"');
      secured.headers.append('Link', '</openapi.json>; rel="service-desc"; type="application/json"');
    }
    if (request.method === 'HEAD') return new Response(null,secured);
    return secured;
  },
};
