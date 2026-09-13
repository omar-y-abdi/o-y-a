import { authenticateAdmin } from './auth.mjs';
import { assetResponse, listAssets, MAX_ASSET_BYTES, updateAsset, uploadAsset } from './assets.mjs';
import { errorResponse, HttpError, json, readBytes, readJson, requireWriteRequest } from './http.mjs';
import { validateProject } from './project.mjs';
import { publishSite, readHistory, readSite } from './store.mjs';
import { renderPage, renderWinPreview } from './render.mjs';

export async function handleAdmin(request, env, { seed, initial, built }) {
  try {
    const identity = await authenticateAdmin(request, env);
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/admin/api/')) return env.ASSETS.fetch(request);
    if (!env.CMS_DB) throw new HttpError(503, 'Studions lagring är inte tillgänglig.');
    if (request.method === 'GET' || request.method === 'HEAD') {
      if (url.pathname === '/admin/api/state') {
        const [state, assets] = await Promise.all([readSite(env.CMS_DB), listAssets(env.CMS_DB)]);
        return json({ version: state?.version ?? 0, project: state?.project ?? initial, identity, definitions: seed.pages, blank: seed.blank, built, assets: [...seed.assets, ...assets], environment: env.CMS_STAGE === 'true' ? 'staging' : 'production' });
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
      if (url.pathname === '/admin/api/assets') return json({ assets: [...seed.assets, ...await listAssets(env.CMS_DB)] });
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
    if (url.pathname === '/admin/api/validate' || url.pathname === '/admin/api/preview') {
      const body = await readJson(request, 8 * 1024 * 1024);
      const baseline = (await readSite(env.CMS_DB))?.project ?? initial;
      const project = validateProject(body.project, seed, baseline);
      if (url.pathname.endsWith('/validate')) return json({ project });
      if (body.cardId) {
        const card = project.cards.find(item => item.id === body.cardId);
        if (!card) throw new HttpError(404, 'Vinsten finns inte i utkastet.');
        return json({ html: renderWinPreview(card, project, built) });
      }
      const page = project.pages.find(item => item.id === body.pageId);
      if (!page) throw new HttpError(404, 'Sidan finns inte i utkastet.');
      return json({ html: renderPage(page, built, { preview: true, project }) });
    }
    if (url.pathname === '/admin/api/save') {
      const body = await readJson(request, 8 * 1024 * 1024);
      const baseline = (await readSite(env.CMS_DB))?.project ?? initial;
      const project = validateProject(body.project, seed, baseline);
      return json(await publishSite(env.CMS_DB, { project, baseVersion: body.baseVersion, requestId: body.requestId, actor: identity.email }));
    }
    const asset = url.pathname.match(/^\/admin\/api\/assets\/([0-9a-f-]{36})$/);
    if (asset) return json(await updateAsset(env.CMS_DB, asset[1], await readJson(request, 4096)));
    throw new HttpError(404, 'Åtgärden finns inte.');
  } catch (error) { return errorResponse(error); }
}

export { assetResponse };
