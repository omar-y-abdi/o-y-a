import { HttpError, json, readBytes, readJson } from './http.mjs';
import { validateProject } from './project.mjs';
import { replaceResource, resourceCatalog } from './resources.mjs';
import { assetPage, assetSelection, builtinAssetStates, mergeBuiltinAssetStates, updateAsset, updateBuiltinAsset } from './assets.mjs';
import { MAX_ASSET_BYTES, uploadAsset } from './media-files.mjs';
import { assetUsage, transitionAsset, transitionBuiltinAsset } from './asset-lifecycle.mjs';
import { completeManagedSvg, finalizeManagedSvg, managedSvgOperation, managedSvgSource, prepareManagedSvg, stageManagedSvg, validateManagedSvg } from './managed-svg.mjs';

async function assets(request, env, context) {
  const { url } = context;
  const state = url.searchParams.get('state');
  const result = await assetPage(env.CMS_DB, { cursor: url.searchParams.get('cursor'), query: url.searchParams.get('q') ?? '', state: ['active','archived','trash'].includes(state) ? state : null, archived: state ? null : url.searchParams.get('archived') === '1', images: url.searchParams.get('kind') === 'image', fonts: url.searchParams.get('kind') === 'font' });
  return json(result);
}

async function managedSource(request, env, context) {
  const { url } = context;
  const { seed } = await context.studio();
  const builtin = seed.assets.find(asset => asset.id === url.searchParams.get('id'));
  return json(await managedSvgSource(env, builtin ? { ...builtin, builtin: true } : null));
}

async function upload(request, env) {
  let name, alt;
  try { name = decodeURIComponent(request.headers.get('X-CMS-Filename') ?? ''); alt = decodeURIComponent(request.headers.get('X-CMS-Alt') ?? ''); }
  catch { throw new HttpError(400, 'Filens uppgifter kunde inte läsas.'); }
  return json(await uploadAsset(env, { id: request.headers.get('X-CMS-Upload-Id') ?? '', name, alt, bytes: await readBytes(request, MAX_ASSET_BYTES) }), 201);
}

async function managedSvg(request, env, context) {
  const { url, publishedBaseline, resourceIds } = context;
  const body = await readJson(request, 16 * 1024 * 1024);
  const { seed, fromClient } = await context.studio();
  const source = seed.assets.find(asset => asset.id === body.id);
  const builtin = source ? { ...source, builtin: true } : null;
  if (body.action === 'validate') return json(validateManagedSvg(builtin, body.svg));
  if (body.action === 'stage') return json(await stageManagedSvg(env, builtin, body));
  if (body.action === 'prepare') return json(await prepareManagedSvg(env, builtin, body));
  if (body.action === 'complete') return json(await completeManagedSvg(env, builtin, body.operationId));
  if (body.action === 'finalize') {
    const operation = await managedSvgOperation(env, builtin, body.operationId);
    if (!operation.derivative_media_id || !['prepared','committed','completed'].includes(operation.state)) throw new HttpError(409, 'SVG-sparningen saknar ett färdigt PNG-derivat.');
    const project = validateProject(fromClient(body.project), seed, await publishedBaseline(), { publication: false, origins: [url.origin] });
    const [selectedAssets, builtinStates] = await Promise.all([assetSelection(env.CMS_DB, [...resourceIds(project), operation.derivative_media_id].filter(Boolean)), builtinAssetStates(env.CMS_DB)]);
    const builtinSeed = { ...seed, assets: mergeBuiltinAssetStates(seed.assets, builtinStates) };
    const assets = resourceCatalog(builtinSeed, selectedAssets, project);
    const previous = assets.find(asset => asset.id === body.id), next = assets.find(asset => asset.id === operation.derivative_media_id && !asset.builtin && !asset.trashed);
    if (!previous || !next) throw new HttpError(404, 'SVG-källan eller PNG-derivatet saknas.');
    const replacement = replaceResource(project, previous, next, url.origin);
    const committed = await finalizeManagedSvg(env, builtin, body.operationId);
    const latestStates = await builtinAssetStates(env.CMS_DB);
    return json({ ...replacement, ...committed, assets: resourceCatalog({ ...seed, assets: mergeBuiltinAssetStates(seed.assets, latestStates) }, selectedAssets, replacement.project) });
  }
  throw new HttpError(422, 'SVG-sparningens fas är ogiltig.');
}

async function usage(request, env, context) {
  const body = await readJson(request, 1024);
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.id !== 'string' || Object.keys(body).some(key => key !== 'id')) throw new HttpError(422, 'Välj en resurs för historikkontrollen.');
  const { seed } = await context.studio();
  const builtin = seed.assets.find(asset => asset.id === body.id);
  return json(await assetUsage(env, builtin ? { ...builtin, builtin: true } : { id: body.id }));
}

async function change(request, env, context) {
  const { url, publishedBaseline } = context;
  const body = await readJson(request, 16 * 1024 * 1024);
  const { seed, fromClient } = await context.studio();
  const builtin = seed.assets.find(asset => asset.id === body.id);
  if (url.pathname === '/admin/api/asset-metadata') {
    const { id, ...patch } = body;
    return json({ asset: builtin ? await updateBuiltinAsset(env.CMS_DB, builtin, patch) : await updateAsset(env.CMS_DB, id, patch) });
  }
  const project = validateProject(fromClient(body.project), seed, await publishedBaseline(), { publication: false, origins: [url.origin] });
  const input = { action: body.action, baseVersion: body.baseVersion, baseSiteVersion: body.baseSiteVersion, project };
  return json(builtin ? await transitionBuiltinAsset(env.CMS_DB, builtin, input) : await transitionAsset(env, { id: body.id, ...input }));
}

async function replace(request, env, context) {
  const { url, publishedBaseline, resourceIds } = context;
  const body = await readJson(request, 16 * 1024 * 1024);
  const { seed, fromClient } = await context.studio();
  const project = validateProject(fromClient(body.project), seed, await publishedBaseline(), { publication: false, origins: [url.origin] });
  const [selectedAssets, builtinStates] = await Promise.all([assetSelection(env.CMS_DB, [...resourceIds(project), body.fromId, body.toId].filter(Boolean)), builtinAssetStates(env.CMS_DB)]);
  const builtinSeed = { ...seed, assets: mergeBuiltinAssetStates(seed.assets, builtinStates) };
  const assets = resourceCatalog(builtinSeed, selectedAssets, project);
  const previous = assets.find(asset => asset.id === body.fromId), next = assets.find(asset => asset.id === body.toId && !asset.builtin && !asset.trashed);
  if (!previous || !next) throw new HttpError(404, 'Filen som ska ersättas eller den nya filen saknas.');
  const result = replaceResource(project, previous, next, url.origin);
  return json({ ...result, assets: resourceCatalog(builtinSeed, assets.filter(asset => !asset.builtin), result.project) });
}

export const mediaReads = new Map([
  ['/admin/api/assets', assets], ['/admin/api/managed-svg', managedSource],
]);
export const mediaWrites = new Map([
  ['/admin/api/upload', upload], ['/admin/api/managed-svg', managedSvg], ['/admin/api/asset-usage', usage],
  ['/admin/api/asset-metadata', change], ['/admin/api/asset-lifecycle', change], ['/admin/api/replace-resource', replace],
]);
