import { handleContact, contactConfig } from './server/contact.mjs';
import { readConsent } from './client/privacy.mjs';
import { routes } from './content/site.mjs';
import { CSP } from '../.generated/csp.mjs';
import { seed, initial, built } from '../.generated/cms-seed.mjs';
import { handleAdmin, assetResponse } from './cms/api.mjs';
import { ADMIN_CSP, publicContent } from './cms/render.mjs';
import { errorResponse } from './cms/http.mjs';
import { reportFailure } from './cms/diagnostics.mjs';
import { negotiatePublicPage } from './server/markdown.mjs';

const PAGES = new Set(routes.filter(page => !page.noindex).map(page => page.path));
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
async function boundedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('empty');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new RangeError('size'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const all = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { all.set(chunk,offset);offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
}
async function eventResponse(request, env, url) {
  if (request.method !== 'POST') return json({error:'Method not allowed'},405,{Allow:'POST'});
  if (request.headers.get('Origin') !== url.origin || request.headers.get('X-OY-Consent') !== 'v1') return json({error:'Origin or consent missing'},403);
  if (request.headers.get('Sec-GPC') === '1' || request.headers.get('DNT') === '1' || readConsent(request.headers.get('Cookie') || '') !== 'allow') return json({error:'Consent required'},403);
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({error:'JSON required'},415);
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) return json({error:'Body too large'},413);
  let data;
  try { data = await boundedBody(request); } catch (error) { return json({error:'Invalid event'},error instanceof RangeError ? 413 : 400); }
  if (!data || Array.isArray(data) || typeof data !== 'object' || Object.keys(data).length !== 2 || !EVENTS.has(data.event) || !PAGES.has(data.page)) return json({error:'Unknown event data'},400);
  if (!env.ANALYTICS || env.ANALYTICS_ENABLED !== 'true') return json({error:'Analytics not configured'},503);
  try { env.ANALYTICS.writeDataPoint({blobs:[data.page,data.event],doubles:[1],indexes:['site']}); }
  catch { return json({error:'Analytics unavailable'},503); }
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
export default {
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
    let response;
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      response = await handleAdmin(request,env,{seed,initial,built});
      const secured = secure(response,url.protocol === 'https:',ADMIN_CSP);
      secured.headers.set('Cache-Control','no-store');
      secured.headers.set('X-Robots-Tag','noindex, nofollow');
      return request.method === 'HEAD' ? new Response(null,secured) : secured;
    }
    if (url.pathname.startsWith('/media/')) {
      try { response = await assetResponse(request,env); } catch (error) { response = errorResponse(error,'media'); }
    }
    else if (url.pathname === '/api/contact') response = await handleContact(request,env);
    else if (url.pathname === '/api/contact/config') response = ['GET','HEAD'].includes(request.method) ? contactConfig(env) : json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
    else if (url.pathname === '/api/event') response = await eventResponse(request,env,url);
    else if (url.pathname === '/api/config') {
      response = request.method === 'GET' || request.method === 'HEAD'
        ? json({analytics:Boolean(env.ANALYTICS) && env.ANALYTICS_ENABLED === 'true'})
        : json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
    } else if (/^\/data\/cards\/[a-z0-9-]{1,80}\.json$/.test(url.pathname) && !env.CMS_DB) {
      response = json({error:'Card not found',code:'NOT_FOUND',hint:'Read /data/cards.json for published card IDs.'},404);
    } else if (url.pathname === '/api' || url.pathname.startsWith('/api/')) response = json({error:'Unknown public API endpoint'},404);
    else if (!['GET','HEAD'].includes(request.method)) response = json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
    else if (url.pathname.endsWith('.map') || url.pathname.startsWith('/.')) response = new Response('Not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    else {
      try { response = await publicContent(request,env,built,CSP,seed) ?? await env.ASSETS.fetch(request); }
      catch(error) { const requestId=reportFailure(error,'public'); response = new Response(`Tillfälligt avbrott. Försök igen. Fel-ID: ${requestId}`,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Request-ID':requestId}}); }
    }
    if (url.pathname === '/404.html' && response.status === 200) {
      response = new Response(response.body,{status:404,headers:response.headers});
    }
    response = await negotiatePublicPage(request, response);
    const secured = secure(response,url.protocol === 'https:');
    if (stage || url.pathname.startsWith('/login')) secured.headers.set('X-Robots-Tag','noindex, nofollow');
    if (request.method === 'HEAD') return new Response(null,secured);
    return secured;
  },
};
