import { authenticateAdmin } from './auth.mjs';
import { assetResponse, assetPage, assetSelection, MAX_ASSET_BYTES, updateAsset, uploadAsset, validateReferencedMedia } from './assets.mjs';
import { errorResponse, HttpError, json, readBytes, readJson, requireWriteRequest } from './http.mjs';
import { validateProject } from './project.mjs';
import { publicationChunks, publicationMedia, publishSite, readHistory, readSite } from './store.mjs';
import { renderPage, renderWinPreview } from './render.mjs';
import { replaceResource, resourceReferences, resourceCatalog, resolveResources } from './resources.mjs';

const resourceIds = project => [...resourceReferences(project).keys()].filter(src => src.startsWith('/media/')).map(src => src.slice(7).split('.')[0]);

export async function handleAdmin(request, env, { seed, initial, built }) {
  try {
    const identity = await authenticateAdmin(request, env);
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/admin/api/')) return env.ASSETS.fetch(request);
    if (!env.CMS_DB) throw new HttpError(503, 'Studions lagring är inte tillgänglig.');
    if (request.method === 'GET' || request.method === 'HEAD') {
      if (url.pathname === '/admin/api/state') {
        const [state, media] = await Promise.all([readSite(env.CMS_DB), assetPage(env.CMS_DB)]);
        const project = state?.project ?? initial;
        const selected = await assetSelection(env.CMS_DB, resourceIds(project), { fonts: true });
        const assets = [...new Map([...media.items, ...selected].map(asset => [asset.id, asset])).values()];
        return json({ version: state?.version ?? 0, project, identity, definitions: seed.pages, blank: seed.blank, built, assets: resourceCatalog(seed, assets, project), mediaTotal: media.total, environment: env.CMS_STAGE === 'true' ? 'staging' : 'production' });
      }
      if (url.pathname === '/admin/api/history') {
        const cursor = Number(url.searchParams.get('before') ?? Number.MAX_SAFE_INTEGER);
        if (!Number.isSafeInteger(cursor) || cursor < 1) throw new HttpError(400, 'Historikmarkören är ogiltig.');
        return json(await readHistory(env.CMS_DB, cursor));
      }
      const revision = url.pathname.match(/^\/admin\/api\/revision\/(\d+)$/);
      if (revision) {
        if (revision[1] === '0') return json({ version: 0, createdAt: null, project: initial });
        const state = await readSite(env.CMS_DB, Number(revision[1]));
        if (!state) throw new HttpError(404, 'Versionen finns inte.');
        return json(state);
      }
      if (url.pathname === '/admin/api/assets') {
        const result = await assetPage(env.CMS_DB, { cursor: url.searchParams.get('cursor'), query: url.searchParams.get('q') ?? '', archived: url.searchParams.get('archived') === '1', images: url.searchParams.get('kind') === 'image' });
        return json(result);
      }
      throw new HttpError(404, 'Åtgärden finns inte.');
    }
    if (url.pathname === '/admin/api/upload') {
      requireWriteRequest(request, 'application/octet-stream');
      let name, alt;
      try { name = decodeURIComponent(request.headers.get('X-CMS-Filename') ?? ''); alt = decodeURIComponent(request.headers.get('X-CMS-Alt') ?? ''); }
      catch { throw new HttpError(400, 'Filens uppgifter kunde inte läsas.'); }
      return json(await uploadAsset(env, { id: request.headers.get('X-CMS-Upload-Id') ?? '', name, alt, bytes: await readBytes(request, MAX_ASSET_BYTES) }), 201);
    }
    requireWriteRequest(request);
    if (['/admin/api/replace-resource', '/admin/api/resource-usage'].includes(url.pathname)) {
      const body = await readJson(request, 16 * 1024 * 1024);
      const project = validateProject(body.project, seed, null, { publication: false, origins: [url.origin] });
      const assets = resourceCatalog(seed, await assetSelection(env.CMS_DB, [...resourceIds(project), body.fromId, body.toId].filter(Boolean)), project);
      if (url.pathname.endsWith('/resource-usage')) {
        const counts = resourceReferences(project, url.origin);
        return json({ counts: Object.fromEntries([...counts].map(([src, count]) => [src, count])) });
      }
      const previous = assets.find(asset => asset.id === body.fromId), next = assets.find(asset => asset.id === body.toId && !asset.builtin);
      if (!previous || !next) throw new HttpError(404, 'Filen som ska ersättas eller den nya filen saknas.');
      const result = replaceResource(project, previous, next, url.origin);
      return json({ ...result, assets: resourceCatalog(seed, assets.filter(asset => !asset.builtin), result.project) });
    }
    if (url.pathname === '/admin/api/recover') {
      const body = await readJson(request, 16 * 1024 * 1024);
      const project = validateProject(body.project, seed, null, { origins: [url.origin], publication: false });
      const warnings = [];
      try { publicationChunks(validateProject(structuredClone(project), seed, null, { origins: [url.origin] })); }
      catch (error) { if (![422, 413].includes(error.status)) throw error; warnings.push(error.message); }
      // Recovery may replay an unresolved save only after the same security
      // validation. Keep its original payload, not a newly normalized attempt.
      let pendingSave = null;
      if (body.pendingSave) {
        const pending = body.pendingSave;
        if (!Number.isSafeInteger(pending.baseVersion) || pending.baseVersion < 0 || !/^[0-9a-f-]{36}$/.test(pending.requestId)) throw new HttpError(422, 'Reservutkastets sparförsök är ogiltigt.');
        validateProject(structuredClone(pending.project), seed, null, { origins: [url.origin], publication: false });
        pendingSave = { project: pending.project, baseVersion: pending.baseVersion, requestId: pending.requestId };
      }
      return json({ project, pendingSave, warnings });
    }
    if (url.pathname === '/admin/api/validate' || url.pathname === '/admin/api/preview') {
      const body = await readJson(request, 8 * 1024 * 1024);
      const baseline = (await readSite(env.CMS_DB))?.project ?? initial;
      const project = validateProject(body.project, seed, baseline, { origins: [url.origin] });
      await validateReferencedMedia(env, project);
      await publicationMedia(env.CMS_DB, project);
      if (url.pathname.endsWith('/validate')) { publicationChunks(project, await resolveResources(env.CMS_DB, project)); return json({ project }); }
      if (body.cardId) {
        const card = project.cards.find(item => item.id === body.cardId);
        if (!card) throw new HttpError(404, 'Vinsten finns inte i utkastet.');
        return json({ html: renderWinPreview(card, project, built) });
      }
      const page = project.pages.find(item => item.id === body.pageId);
      if (!page) throw new HttpError(404, 'Sidan finns inte i utkastet.');
      return json({ html: renderPage(page, built, { preview: true, project, resources: await resolveResources(env.CMS_DB, project), resourceOrigin: url.origin }) });
    }
    if (url.pathname === '/admin/api/save') {
      const body = await readJson(request, 8 * 1024 * 1024);
      const baseline = (await readSite(env.CMS_DB))?.project ?? initial;
      const project = validateProject(body.project, seed, baseline, { origins: [url.origin] });
      await validateReferencedMedia(env, project);
      return json(await publishSite(env.CMS_DB, { project, baseVersion: body.baseVersion, requestId: body.requestId, actor: identity.email }));
    }
    const asset = url.pathname.match(/^\/admin\/api\/assets\/([0-9a-f-]{36})$/);
    if (asset) return json(await updateAsset(env.CMS_DB, asset[1], await readJson(request, 4096)));
    throw new HttpError(404, 'Åtgärden finns inte.');
  } catch (error) { return errorResponse(error, new URL(request.url).pathname.split('/')[3]); }
}

export { assetResponse };
