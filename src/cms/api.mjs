import { authenticateAdmin } from './auth.mjs';
import { errorResponse, HttpError, requireWriteRequest } from './http.mjs';
import { normalizeStoredProject, normalizeClientProject } from './frame-converter.mjs';
import { resourceReferences } from './resources.mjs';
import { handleEmailAdmin } from './email-api.mjs';
import { readCurrentProject, readCurrentResources } from './current-project.mjs';
import { siteReads, siteReadPatterns, siteWrites } from './admin-site.mjs';
import { mediaReads, mediaWrites } from './admin-media.mjs';

const reads = new Map([...siteReads, ...mediaReads]);
const writes = new Map([...siteWrites, ...mediaWrites]);
const resourceIds = project => [...resourceReferences(project).keys()].filter(src => src.startsWith('/media/')).map(src => src.slice(7).split('.')[0]);
// The one ingress for every project a client sends. Old tabs and drafts: A1a
// refreshes a stale /developers/ first (fingerprint on raw bytes), then their
// positional keys go through the frozen e5592bc map. Stored data uses rekeyHtml.
export { normalizeClientProject } from './frame-converter.mjs';

export async function handleAdmin(request, env, { built, studioKey, renderKey, loadSeed }) {
  let definitions;
  const studio = () => definitions ??= loadSeed().then(({ seed, initial }) => ({
    seed, initial,
    storedProject: project => normalizeStoredProject(project, seed, initial),
    fromClient: project => normalizeClientProject(project, seed),
  }));
  // One request-local snapshot; no process cache can outlive a Save or media
  // change. Internal proof facts never become the delta's project payload.
  let current;
  const published = () => current ??= studio().then(({ seed, initial }) => readCurrentProject(env.CMS_DB, seed, initial, new URL(request.url).origin));
  const publishedBaseline = async () => (await published()).baseline;
  try {
    const identity = await authenticateAdmin(request, env);
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/admin/api/')) return env.ASSETS.fetch(request);
    // Mail owns its established route/uncertainty boundary, including settings
    // reads without D1 and unknown-route refusal before write guards.
    if (url.pathname === '/admin/api/contact' || url.pathname.startsWith('/admin/api/mail/')) return await handleEmailAdmin(request, env, { identity, url, head: () => readCurrentResources(env.CMS_DB, studioKey, studio) });
    if (!env.CMS_DB) throw new HttpError(503, 'Studions lagring är inte tillgänglig.');
    const context = { studio, studioKey, renderKey, built, identity, url, published, publishedBaseline, resourceIds };
    if (request.method === 'GET' || request.method === 'HEAD') {
      const handler = reads.get(url.pathname);
      if (handler) return await handler(request, env, context);
      for (const route of siteReadPatterns) {
        const match = route.pattern.exec({ pathname: url.pathname });
        if (match) return await route.handler(request, env, { ...context, params: match.pathname.groups });
      }
      throw new HttpError(404, 'Åtgärden finns inte.');
    }
    // Preserve generic unknown-route ordering: reject an invalid write before
    // its 404, but never parse its body. Upload is the one binary CMS route.
    requireWriteRequest(request, url.pathname === '/admin/api/upload' ? 'application/octet-stream' : 'application/json');
    const handler = writes.get(url.pathname);
    if (handler) return await handler(request, env, context);
    throw new HttpError(404, 'Åtgärden finns inte.');
  } catch (error) { return errorResponse(error, new URL(request.url).pathname.split('/')[3]); }
}
