import { HttpError, json, readJson } from './http.mjs';
import { validateProject, validateProjectWithReferences } from './project.mjs';
import { toLegacyProject } from './frame-converter.mjs';
import { digest, publicationChunks, publicationMedia, publishSite, readCurrentVersion, readHistory, readSite, renderProof, reusableRows, replaySave, replayFullSave } from './store.mjs';
import { renderPage, renderWinPreview } from './render.mjs';
import { resolveResources, resourceCatalog } from './resources.mjs';
import { applyProjectChanges, validateProjectChanges } from './project-changes.mjs';
import { SKIFT_PATH } from '../content/skift.mjs';
import { readStudioHead } from './studio-store.mjs';
import { previewBaseline } from './preview-store.mjs';
import { previewPayload } from './preview-project.mjs';
import { applyCpuMigration, cpuMigrationStatus } from './cpu-migration.mjs';
import { assetPage, assetSelection, builtinAssetStates, mergeBuiltinAssetStates } from './assets.mjs';
import { validateReferencedMedia, validatePackageResources } from './media-files.mjs';

const legacyDelta = changes => Object.hasOwn(changes, 'sharedContent') || changes.pages?.upsert.some(page => typeof page.html === 'string' && !page.html.trimStart().startsWith('<main'));
function deltaBase(stored, normalized, changes, seed) {
  if (!legacyDelta(changes)) return normalized;
  if (changes.frame) throw new HttpError(422, 'Sparningen blandar två format för sidramen. Läs in utkastet på nytt.');
  if (stored.schemaVersion === 1) return stored;
  const { frameVersion: _rollback, ...legacy } = toLegacyProject(normalized, seed);
  return legacy;
}

async function state(request, env, context) {
  const { built, identity, resourceIds } = context;
  const { seed, initial, storedProject } = await context.studio();
  const [canonical, media, builtinStates] = await Promise.all([readStudioHead(env.CMS_DB, seed.studioKey), assetPage(env.CMS_DB, { state: 'active' }), builtinAssetStates(env.CMS_DB)]);
  const state = canonical ?? await readSite(env.CMS_DB);
  const project = canonical ? { resources: canonical.resources } : state ? storedProject(state.project) : initial;
  const referenced = canonical ? canonical.mediaReferences.map(src => src.slice(7).split('.')[0]) : resourceIds(project);
  const selected = await assetSelection(env.CMS_DB, referenced, { fonts: true });
  const assets = [...new Map([...media.items, ...selected].map(asset => [asset.id, asset])).values()];
  const builtins = mergeBuiltinAssetStates(seed.assets, builtinStates);
  const envelope = { version: state?.version ?? 0, identity, definitions: seed.pages, frameContracts: seed.frame?.contracts ?? [], blank: seed.blank, built, assets: resourceCatalog({ ...seed, assets: builtins }, assets, project), mediaTotal: media.total, environment: env.CMS_STAGE === 'true' ? 'staging' : 'production' };
  if (!canonical) return json({ ...envelope, project });
  return new Response(`${JSON.stringify(envelope).slice(0, -1)},"project":${canonical.parts.join('')}}`, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

async function history(request, env, context) {
  const { url } = context;
  const cursor = Number(url.searchParams.get('before') ?? Number.MAX_SAFE_INTEGER);
  if (!Number.isSafeInteger(cursor) || cursor < 1) throw new HttpError(400, 'Historikmarkören är ogiltig.');
  return json(await readHistory(env.CMS_DB, cursor));
}

async function revision(request, env, context) {
  const { params } = context;
  if (params.version === '0') return json({ version: 0, createdAt: null, project: (await context.studio()).initial });
  const state = await readSite(env.CMS_DB, Number(params.version));
  if (!state) throw new HttpError(404, 'Versionen finns inte.');
  const { storedProject } = await context.studio();
  return json({ ...state, project: storedProject(state.project) });
}

async function migrationStatus(request, env, context) {
  const { studioKey, identity, url } = context;
  return json(await cpuMigrationStatus(env.CMS_DB, { buildKey: studioKey, origin: url.origin, actor: identity.email, operationId: url.searchParams.get('operationId') ?? undefined }));
}

async function migrateCpu(request, env, context) {
  const { studioKey, identity, url } = context;
  return json(await applyCpuMigration(env.CMS_DB, await readJson(request, 4096), { buildKey: studioKey, origin: url.origin, actor: identity.email }));
}

async function migrateFrame(request, env, context) {
  const { identity, url } = context;
  const body = await readJson(request, 4096);
  if (!body || Object.keys(body).some(key => !['expectedVersion', 'expectedHash', 'projectHash', 'reverse', 'requestId'].includes(key)) || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 1 || typeof body.reverse !== 'boolean' || !/^[0-9a-f]{64}$/.test(body.expectedHash) || !/^[0-9a-f]{64}$/.test(body.projectHash) || !/^[0-9a-f-]{36}$/.test(body.requestId)) throw new HttpError(422, 'Migreringen saknar en giltig version, kontrollsumma eller identitet.');
  const payloadHash = await digest(JSON.stringify({ expectedVersion: body.expectedVersion, expectedHash: body.expectedHash, projectHash: body.projectHash, reverse: body.reverse }));
  const replay = await replaySave(env.CMS_DB, { requestId: body.requestId, actor: identity.email, payloadHash });
  if (replay) return json(replay);
  const stored = await readSite(env.CMS_DB, undefined, { raw: true });
  if (!stored || stored.version !== body.expectedVersion || await digest(JSON.stringify(stored.project)) !== body.expectedHash) throw new HttpError(409, 'Huvudrevisionen ändrades. Migreringen skrev ingenting.');
  if (stored.project.schemaVersion === (body.reverse ? 1 : 2)) throw new HttpError(409, 'Huvudrevisionen har redan det valda formatet.');
  const { seed, storedProject } = await context.studio();
  const candidate = body.reverse ? toLegacyProject(stored.project, seed) : storedProject(stored.project);
  const { project, references, frame } = validateProjectWithReferences(candidate, seed, undefined, { origins: [url.origin] });
  if (await digest(JSON.stringify(project)) !== body.projectHash) throw new HttpError(409, 'Konverteraren skiljer sig från den repeterade versionen. Migreringen skrev ingenting.');
  await validateReferencedMedia(env, project, references);
  return json(await publishSite(env.CMS_DB, { project, references, baseVersion: stored.version, requestId: body.requestId, actor: identity.email, payloadHash, requestFormat: 'migration-v1', studioKey: seed.studioKey, renderKey: context.renderKey, previewFrame: frame, origin: url.origin }));
}

async function recover(request, env, context) {
  const { url, published, publishedBaseline } = context;
  const body = await readJson(request, 16 * 1024 * 1024);
  const { seed, storedProject, fromClient } = await context.studio();
  const baseline = await publishedBaseline();
  const project = validateProject(fromClient(body.project), seed, baseline, { origins: [url.origin], publication: false });
  const warnings = [];
  try { publicationChunks(validateProject(structuredClone(project), seed, baseline, { origins: [url.origin] })); }
  catch (error) { if (![422, 413].includes(error.status)) throw error; warnings.push(error.message); }
  // Recovery may replay an unresolved save only after the same security
  // validation. Keep its original payload, not a newly normalized attempt.
  let pendingSave = null;
  let pendingProject = null;
  if (body.pendingSave) {
    const pending = body.pendingSave;
    if (!Number.isSafeInteger(pending.baseVersion) || pending.baseVersion < 0 || !/^[0-9a-f-]{36}$/.test(pending.requestId)) throw new HttpError(422, 'Reservutkastets sparförsök är ogiltigt.');
    const legacy = Object.hasOwn(pending, 'project') && !Object.hasOwn(pending, 'changes');
    const delta = Object.hasOwn(pending, 'changes') && !Object.hasOwn(pending, 'project');
    const allowed = new Set(['baseVersion', 'requestId', legacy ? 'project' : 'changes']);
    if ((!legacy && !delta) || Object.keys(pending).some(key => !allowed.has(key)) || delta && body.baseVersion !== undefined && pending.baseVersion !== body.baseVersion) throw new HttpError(422, 'Reservutkastets sparförsök är ogiltigt.');
    if (legacy) {
      pendingProject = validateProject(fromClient(structuredClone(pending.project)), seed, baseline, { origins: [url.origin], publication: false });
      pendingSave = { project: pending.project, baseVersion: pending.baseVersion, requestId: pending.requestId };
    } else {
      if (pending.baseVersion === 0) throw new HttpError(422, 'Första reservutkastet kräver hela webbplatsen.');
      let changes;
      try { changes = validateProjectChanges(pending.changes); }
      catch { throw new HttpError(422, 'Reservutkastets sparförsök är ogiltigt.'); }
      const head = legacyDelta(changes) ? null : await published();
      const saved = head?.version === pending.baseVersion ? head : await readSite(env.CMS_DB, pending.baseVersion);
      if (!saved) throw new HttpError(422, 'Reservutkastets ursprungsversion saknas.');
      const base = storedProject(saved.project);
      let candidate;
      try { candidate = applyProjectChanges(deltaBase(saved.project, base, changes, seed), changes); }
      catch { throw new HttpError(422, 'Reservutkastets sparförsök är ogiltigt.'); }
      pendingProject = validateProject(fromClient(candidate), seed, saved.baseline ?? base, { origins: [url.origin], publication: false });
      pendingSave = pending;
    }
  }
  return json({ project, pendingSave, pendingProject, warnings });
}

async function validate(request, env, context) {
  const { built, url, published, publishedBaseline } = context;
  const body = await readJson(request, 8 * 1024 * 1024);
  const isPreview = url.pathname.endsWith('/preview');
  let input = body?.project, target;
  if (isPreview) {
    const pageTarget = typeof body?.pageId === 'string', cardTarget = typeof body?.cardId === 'string';
    if (pageTarget === cardTarget) throw new HttpError(422, 'Välj en sida eller en vinst för förhandsvisningen.');
    try {
      const payload = previewPayload(input, cardTarget ? 'win' : 'page', cardTarget ? body.cardId : body.pageId);
      input = payload.project;
      target = cardTarget ? { cardId: body.cardId } : { pageId: body.pageId };
    } catch (error) { throw new HttpError(422, error.message); }
  }
  const { seed, fromClient } = await context.studio();
  input = fromClient(input);
  const baseline = isPreview ? await previewBaseline(env.CMS_DB, input, seed, url.origin) : await publishedBaseline();
  const { project, references } = validateProjectWithReferences(input, seed, baseline, { origins: [url.origin], preview: target });
  await validateReferencedMedia(env, project, references);
  if (body.resources !== undefined) await validatePackageResources(env.CMS_DB, body.resources);
  await publicationMedia(env.CMS_DB, project, references);
  if (!isPreview) {
    const resources = await resolveResources(env.CMS_DB, project), stored = await published(), proof = renderProof(context.renderKey);
    const reused = await reusableRows(env.CMS_DB, project, stored, resources, references, proof);
    publicationChunks(project, resources, references, { reused, proof });
    return json({ project });
  }
  if (body.cardId) {
    const card = project.cards.find(item => item.id === body.cardId);
    if (!card) throw new HttpError(404, 'Vinsten finns inte i utkastet.');
    return json({ html: renderWinPreview(card, project, built, references) });
  }
  const page = project.pages.find(item => item.id === body.pageId);
  if (!page) throw new HttpError(404, 'Sidan finns inte i utkastet.');
  return json({ html: renderPage(page, built, { preview: true, project, resources: await resolveResources(env.CMS_DB, project), resourceOrigin: url.origin, references }) });
}

async function save(request, env, context) {
  const { identity, url, published, publishedBaseline } = context;
  const body = await readJson(request, 8 * 1024 * 1024);
  const hasProject = Object.hasOwn(body ?? {}, 'project'), hasChanges = Object.hasOwn(body ?? {}, 'changes');
  const allowed = new Set(['baseVersion', 'requestId', hasChanges ? 'changes' : 'project']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || hasProject === hasChanges
    || Object.keys(body).some(key => !allowed.has(key)) || !Number.isSafeInteger(body.baseVersion) || body.baseVersion < 0
    || typeof body.requestId !== 'string' || !/^[0-9a-f-]{36}$/.test(body.requestId)) {
    throw new HttpError(422, 'Sparförsöket är ogiltigt.');
  }
  if (hasChanges) {
    let changes;
    try { changes = validateProjectChanges(body.changes); }
    catch { throw new HttpError(422, 'Sparförändringarna är ogiltiga.'); }
    const payloadHash = await digest(JSON.stringify({ baseVersion: body.baseVersion, changes: body.changes }));
    const replay = await replaySave(env.CMS_DB, { requestId: body.requestId, actor: identity.email, payloadHash });
    if (replay) return json(replay);
    // A14: an explicit game-page edit is refused, never silently dropped.
    if (changes.pages?.upsert.some(page => page.id === 'skift' || page.path === SKIFT_PATH)) throw new HttpError(422, 'Spelets sida kan inte redigeras i studion.');
    if (body.baseVersion === 0) throw new HttpError(422, 'Första sparningen kräver hela webbplatsen.');
    if (await readCurrentVersion(env.CMS_DB) !== body.baseVersion) {
      const racedReplay = await replaySave(env.CMS_DB, { requestId: body.requestId, actor: identity.email, payloadHash });
      if (racedReplay) return json(racedReplay);
      throw new HttpError(409, 'Webbplatsen ändrades i en annan flik. Ditt utkast finns kvar; jämför innan du sparar igen.');
    }
    const stored = legacyDelta(changes) ? await readSite(env.CMS_DB) : await published();
    if ((stored?.version ?? 0) !== body.baseVersion) {
      const racedReplay = await replaySave(env.CMS_DB, { requestId: body.requestId, actor: identity.email, payloadHash });
      if (racedReplay) return json(racedReplay);
      throw new HttpError(409, 'Webbplatsen ändrades i en annan flik. Ditt utkast finns kvar; jämför innan du sparar igen.');
    }
    const { seed, initial, storedProject, fromClient } = await context.studio();
    const base = stored ? storedProject(stored.project) : initial;
    const baseline = stored?.baseline ?? base;
    let candidate;
    try { candidate = applyProjectChanges(deltaBase(stored.project, base, changes, seed), changes); }
    catch { throw new HttpError(422, 'Sparförändringarna passar inte den aktuella versionen.'); }
    // After the replay check, so a replayed pendingSave keeps its payload hash.
    const { project, references, frame } = validateProjectWithReferences(fromClient(candidate), seed, baseline, { origins: [url.origin] });
    await validateReferencedMedia(env, project, references);
    return json(await publishSite(env.CMS_DB, { project, baseVersion: body.baseVersion, requestId: body.requestId, actor: identity.email, payloadHash, references, requestFormat: 'delta-v1', studioKey: seed.studioKey, renderKey: context.renderKey, reuseFrom: stored, previewFrame: frame, origin: url.origin }));
  }
  const payloadHash = await digest(JSON.stringify({ baseVersion: body.baseVersion, project: body.project }));
  const replay = await replayFullSave(env.CMS_DB, { requestId: body.requestId, actor: identity.email, baseVersion: body.baseVersion, payloadHash, project: body.project });
  if (replay) return json(replay);
  const { seed, fromClient } = await context.studio();
  const baseline = await publishedBaseline();
  const { project, references, frame } = validateProjectWithReferences(fromClient(body.project), seed, baseline, { origins: [url.origin] });
  await validateReferencedMedia(env, project, references);
  return json(await publishSite(env.CMS_DB, { project, baseVersion: body.baseVersion, requestId: body.requestId, actor: identity.email, references, payloadHash, requestFormat: 'full-v1', studioKey: seed.studioKey, renderKey: context.renderKey, previewFrame: frame, origin: url.origin }));
}

export const siteReads = new Map([
  ['/admin/api/state', state], ['/admin/api/history', history], ['/admin/api/cpu-migration', migrationStatus],
]);
export const siteReadPatterns = [{ pattern: new URLPattern({ pathname: '/admin/api/revision/:version(\\d+)' }), handler: revision }];
export const siteWrites = new Map([
  ['/admin/api/save', save], ['/admin/api/validate', validate], ['/admin/api/preview', validate],
  ['/admin/api/recover', recover], ['/admin/api/migrate-frame', migrateFrame], ['/admin/api/cpu-migration', migrateCpu],
]);
