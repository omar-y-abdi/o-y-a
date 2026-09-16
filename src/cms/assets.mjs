import { imageDimensionsFromData } from 'image-dimensions';
import { authenticateAdmin } from './auth.mjs';
import { HttpError } from './http.mjs';
import { digest, retainedResourceUsage } from './store.mjs';
import { decodeRaster } from './raster-integrity.mjs';
import { resourceReferences } from './resources.mjs';
import { sanitizeManagedSvg } from './svg.mjs';

export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
export const MAX_ACTIVE_FONTS = 64;
const MIME = { png: 'image/png', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function inspectAsset(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 12 || bytes.byteLength > MAX_ASSET_BYTES) throw new HttpError(413, 'Filen saknas eller är större än 10 MB.');
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'wOF2') {
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.byteLength < 48 || header.getUint32(8) !== bytes.byteLength || header.getUint16(12) === 0 || header.getUint16(12) > 100 || header.getUint32(16) > 32 * 1024 * 1024) throw new HttpError(422, 'Typsnittsfilen har en ogiltig WOFF2-header.');
    return { mime: 'font/woff2', extension: 'woff2', width: null, height: null };
  }
  let image;
  try { image = imageDimensionsFromData(bytes); } catch { /* Invalid file parsers fail closed. */ }
  if (!image || !MIME[image.type]) throw new HttpError(422, 'Välj PNG, JPEG, WebP, GIF, AVIF eller WOFF2. SVG och aktiva dokument kan inte laddas upp.');
  if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 || image.width > 8192 || image.height > 8192 || image.width * image.height > 32000000) throw new HttpError(422, 'Bilden är för stor. Max 8192 px per sida och 32 megapixlar.');
  return { mime: MIME[image.type], extension: image.type === 'jpeg' ? 'jpg' : image.type, width: image.width, height: image.height };
}

function lifecycle(row) { return row.trashed_at ? 'trash' : row.archived_at ? 'archived' : 'active'; }
function record(row) {
  const state = lifecycle(row);
  return { id: row.id, version: row.version, src: `/media/${row.object_key}`, name: row.name, mime: row.mime, bytes: row.bytes, width: row.width, height: row.height, alt: row.alt, createdAt: row.created_at, publishedAt: row.published_at, state, archived: state === 'archived', trashed: state === 'trash', deleting: Boolean(row.deleting_at) };
}
function builtinRecord(asset, row = {}) {
  const state = row.trashed_at ? 'trash' : row.archived_at ? 'archived' : 'active';
  return { ...asset, name: row.name ?? asset.name, alt: row.alt ?? asset.alt ?? '', version: row.version ?? 0, state, archived: state === 'archived', trashed: state === 'trash', deleted: Boolean(row.deleted_at), managedAssetId: row.managed_asset_id ?? null };
}

export async function listAssets(db) {
  const rows = await db.prepare('SELECT * FROM cms_media ORDER BY created_at DESC').all();
  return rows.results.map(record);
}

export async function assetSelection(db, ids = [], { fonts = false } = {}) {
  const rows = await db.prepare("SELECT * FROM cms_media WHERE id IN (SELECT value FROM json_each(?)) OR (? AND mime = 'font/woff2' AND archived_at IS NULL AND trashed_at IS NULL) ORDER BY created_at DESC, id DESC").bind(JSON.stringify(ids), Number(fonts)).all();
  return rows.results.map(record);
}

export async function assetPage(db, { cursor = null, query = '', archived = null, state = null, images = false } = {}) {
  if (state === null && archived !== null) state = archived ? 'archived' : 'active';
  if (typeof query !== 'string' || query.length > 200 || ![null, 'active', 'archived', 'trash'].includes(state)) throw new HttpError(400, 'Sökningen är ogiltig.');
  let before = ['', ''];
  try { if (cursor) before = JSON.parse(cursor); } catch { throw new HttpError(400, 'Biblioteksmarkören är ogiltig.'); }
  if (!Array.isArray(before) || before.length !== 2 || before.some(value => typeof value !== 'string') || cursor && (!/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(before[0]) || !UUID.test(before[1]))) throw new HttpError(400, 'Biblioteksmarkören är ogiltig.');
  const filter = "(? = '' OR CASE WHEN trashed_at IS NOT NULL THEN 'trash' WHEN archived_at IS NOT NULL THEN 'archived' ELSE 'active' END = ?) AND (? = 0 OR mime LIKE 'image/%') AND (instr(lower(name),lower(?)) > 0 OR instr(lower(mime),lower(?)) > 0)";
  const parameters = [state ?? '', state ?? '', Number(images), query, query];
  const [rows, count] = await Promise.all([
    db.prepare(`SELECT * FROM cms_media WHERE ${filter} AND (? = '' OR created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC, id DESC LIMIT 61`).bind(...parameters, ...[before[0], before[0], before[0], before[1]]).all(),
    db.prepare(`SELECT count(*) AS total FROM cms_media WHERE ${filter}`).bind(...parameters).first(),
  ]);
  const items = rows.results.slice(0, 60);
  return { items: items.map(record), total: count.total, next: rows.results.length > 60 ? JSON.stringify([items.at(-1).created_at, items.at(-1).id]) : null };
}

export async function builtinAssetStates(db) {
  const rows = await db.prepare('SELECT * FROM cms_builtin_resource_state').all();
  return new Map(rows.results.map(row => [row.source_path, row]));
}
export function mergeBuiltinAssetStates(seedAssets, states) {
  return seedAssets.map(asset => builtinRecord(asset, states.get(asset.src))).filter(asset => !asset.deleted);
}

export async function uploadAsset(env, { id, bytes, name, alt = '' }) {
  if (!env.CMS_DB || !env.CMS_MEDIA) throw new HttpError(503, 'Mediebiblioteket är inte tillgängligt.');
  if (!UUID.test(id) || typeof name !== 'string' || !name.trim() || name.length > 200 || /[\u0000-\u001f]/.test(name) || typeof alt !== 'string' || alt.length > 1000) throw new HttpError(422, 'Filnamn eller alternativtext är ogiltigt.');
  const info = inspectAsset(bytes);
  const hash = await digest(bytes);
  const existing = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  if (existing) {
    if (existing.sha256 !== hash) throw new HttpError(409, 'Uppladdningens identitet används redan av en annan fil.');
    if (!existing.validation_version) await validateStoredMedia(env, existing);
    return record(existing);
  }
  if (info.mime === 'font/woff2' && (await assetPage(env.CMS_DB, { query: 'font/woff2', state: 'active' })).total >= MAX_ACTIVE_FONTS) throw new HttpError(413, 'Biblioteket stöder 64 aktiva typsnitt. Arkivera ett oanvänt typsnitt innan du laddar upp fler.');
  if (info.mime.startsWith('image/')) await decodeRaster(env, bytes, info);
  const key = `${id}.${info.extension}`;
  const stored = await env.CMS_MEDIA.put(key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata: { contentType: info.mime }, customMetadata: { sha256: hash } });
  if (!stored) {
    const previous = await env.CMS_MEDIA.head(key);
    if (previous?.customMetadata?.sha256 !== hash) throw new HttpError(409, 'En annan fil finns redan för det här sparförsöket.');
  }
  // Retrying the same ID can adopt a completed upload after a metadata outage.
  // Unregistered objects are never served publicly and never replace old assets.
  await env.CMS_DB.prepare("INSERT OR IGNORE INTO cms_media (id, object_key, name, mime, bytes, width, height, alt, sha256, created_at, validation_version) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1 WHERE ? != 'font/woff2' OR (SELECT count(*) FROM cms_media WHERE mime = 'font/woff2' AND archived_at IS NULL) < ?").bind(id, key, name.trim(), info.mime, bytes.byteLength, info.width, info.height, alt, hash, new Date().toISOString(), info.mime, MAX_ACTIVE_FONTS).run();
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  if (!row || row.sha256 !== hash) throw new HttpError(409, 'Uppladdningen kunde inte bekräftas. Försök igen.');
  return record(row);
}

async function validateStoredMedia(env, row) {
  const stored = await env.CMS_MEDIA?.get(row.object_key);
  if (!stored) throw new HttpError(422, 'En vald fil saknas i medielagringen. Återställ eller ersätt filen.');
  const bytes = new Uint8Array(await stored.arrayBuffer());
  if (await digest(bytes) !== row.sha256) throw new HttpError(422, 'En vald fil har ändrats i medielagringen. Återställ originalfilen.');
  const info = inspectAsset(bytes);
  if (info.mime !== row.mime || info.width !== row.width || info.height !== row.height) throw new HttpError(422, 'Filens lagrade uppgifter stämmer inte med innehållet.');
  if (info.mime.startsWith('image/')) await decodeRaster(env, bytes, info);
  await env.CMS_DB.prepare('UPDATE cms_media SET validation_version = 1 WHERE id = ? AND sha256 = ?').bind(row.id, row.sha256).run();
}

export async function validateReferencedMedia(env, project) {
  const keys = [...resourceReferences(project).keys()].filter(src => src.startsWith('/media/')).map(src => src.slice(7));
  if (!keys.length) return;
  const rows = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL').bind(JSON.stringify(keys)).all();
  if (rows.results.length !== keys.length) throw new HttpError(422, 'En vald fil saknas. Ladda upp filen innan du sparar.');
  // Revalidate legacy uploads lazily; a broken old file cannot be newly promoted.
  // Its old published revision/URL is retained for explicit historical recovery.
  for (const row of rows.results) if (!row.validation_version) await validateStoredMedia(env, row);
}

export async function updateAsset(db, id, input) {
  if (!UUID.test(id) || !input || Object.keys(input).some(key => !['baseVersion', 'name', 'alt', 'archived'].includes(key)) || input.name !== undefined && (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 200 || /[\u0000-\u001f]/.test(input.name)) || input.alt !== undefined && (typeof input.alt !== 'string' || input.alt.length > 1000) || input.archived !== undefined && typeof input.archived !== 'boolean') throw new HttpError(422, 'Filens uppgifter är ogiltiga.');
  if (!Number.isSafeInteger(input.baseVersion) || input.baseVersion < 0) throw new HttpError(428, 'Hämta filens aktuella uppgifter innan du ändrar dem.');
  const result = await db.prepare('UPDATE cms_media SET name = COALESCE(?, name), alt = COALESCE(?, alt), archived_at = CASE WHEN ? THEN ? ELSE archived_at END, version = version + 1 WHERE id = ? AND version = ? AND deleting_at IS NULL RETURNING *').bind(input.name?.trim() ?? null, input.alt ?? null, Number(input.archived !== undefined), input.archived ? new Date().toISOString() : null, id, input.baseVersion).first();
  if (!result) {
    const current = await db.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
    if (!current) throw new HttpError(404, 'Filen finns inte.');
    throw new HttpError(409, 'Filens uppgifter ändrades i en annan flik. Ditt formulär finns kvar.', { asset: record(current) });
  }
  return record(result);
}


function assertLifecycleInput(action, baseVersion) {
  if (!['archive', 'restore', 'trash', 'delete'].includes(action)) throw new HttpError(422, 'Resursåtgärden är ogiltig.');
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 0) throw new HttpError(428, 'Hämta resursens aktuella uppgifter innan du ändrar den.');
}
function currentReferenceCount(project, src) { return resourceReferences(project).get(src) ?? 0; }

async function adoptQueuedDelete(db, id) {
  const queued = await db.prepare('SELECT * FROM cms_media_delete_queue WHERE id = ?').bind(id).first();
  if (!queued) return null;
  const snapshot = JSON.parse(queued.snapshot);
  let current = await db.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  if (current && (current.object_key !== snapshot.object_key || current.sha256 !== snapshot.sha256)) throw new HttpError(503, 'Resursraderingen behöver slutföras manuellt innan filen kan användas igen.');
  if (!current?.deleting_at) {
    const token = `${new Date().toISOString()}#${crypto.randomUUID()}`;
    if (current) {
      current = await db.prepare('UPDATE cms_media SET deleting_at = ?, version = version + 1 WHERE id = ? AND version = ? AND trashed_at IS NOT NULL AND deleting_at IS NULL RETURNING *').bind(token, id, current.version).first();
    } else {
      await db.prepare('INSERT OR IGNORE INTO cms_media (id,object_key,name,mime,bytes,width,height,alt,sha256,created_at,published_at,archived_at,version,validation_version,trashed_at,deleting_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(snapshot.id,snapshot.object_key,snapshot.name,snapshot.mime,snapshot.bytes,snapshot.width,snapshot.height,snapshot.alt,snapshot.sha256,snapshot.created_at,snapshot.published_at,snapshot.archived_at,snapshot.version+1,snapshot.validation_version,snapshot.trashed_at,token).run();
      current = await db.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
    }
  }
  if (!current?.deleting_at) throw new HttpError(503, 'Resursraderingen behöver slutföras manuellt innan filen kan användas igen.');
  await db.prepare('DELETE FROM cms_media_delete_queue WHERE id = ?').bind(id).run();
  return current;
}

async function completeReservedDelete(env, row) {
  await env.CMS_MEDIA.delete(row.object_key);
  const removed = await env.CMS_DB.prepare('DELETE FROM cms_media WHERE id = ? AND deleting_at = ?').bind(row.id, row.deleting_at).run();
  if (!removed.meta.changes) {
    const latest = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(row.id).first();
    if (latest && latest.deleting_at !== row.deleting_at) throw new HttpError(503, 'Resursraderingen ändrades medan filen togs bort. Ladda om biblioteket.');
  }
  return { deleted: true, id: row.id, usage: { currentReferences: 0, historyReferences: 0 } };
}

export async function assetUsage(env, asset, project) {
  let src = asset.src;
  if (!asset.builtin) {
    if (!UUID.test(asset.id)) throw new HttpError(404, 'Filen finns inte.');
    const row = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(asset.id).first();
    if (!row) throw new HttpError(404, 'Filen finns inte.');
    src = `/media/${row.object_key}`;
  }
  return { currentReferences: currentReferenceCount(project, src), historyReferences: await retainedResourceUsage(env.CMS_DB, src) };
}

export async function transitionAsset(env, { id, action, baseVersion, project }) {
  assertLifecycleInput(action, baseVersion);
  if (!UUID.test(id)) throw new HttpError(404, 'Filen finns inte.');
  let current = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  if (!current) {
    const adopted = await adoptQueuedDelete(env.CMS_DB, id);
    if (!adopted) throw new HttpError(404, 'Filen finns inte.');
    return completeReservedDelete(env, adopted);
  }
  if (current.deleting_at) {
    if (action !== 'delete') throw new HttpError(409, 'Resursen håller redan på att raderas. Ladda om biblioteket.', { asset: record(current) });
    return completeReservedDelete(env, current);
  }
  const src = `/media/${current.object_key}`;
  const refs = currentReferenceCount(project, src);
  if (['trash', 'delete'].includes(action) && refs) throw new HttpError(409, `Resursen används fortfarande ${refs} gånger i aktuellt utkast.`);
  if (action === 'delete') {
    if (!current.trashed_at) throw new HttpError(409, 'Flytta resursen till papperskorgen före permanent radering.');
    if (current.version !== baseVersion) throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: record(current) });
    const observedHead = await env.CMS_DB.prepare('SELECT version FROM cms_head WHERE id = 1').first();
    const historical = await retainedResourceUsage(env.CMS_DB, src);
    if (historical) throw new HttpError(409, `Resursen används fortfarande ${historical} gånger i sparad historik.`);
    const token = `${new Date().toISOString()}#${crypto.randomUUID()}`;
    const reserved = await env.CMS_DB.prepare('UPDATE cms_media SET deleting_at = ?, version = version + 1 WHERE id = ? AND version = ? AND trashed_at IS NOT NULL AND deleting_at IS NULL AND (SELECT version FROM cms_head WHERE id = 1) = ? RETURNING *').bind(token, id, baseVersion, observedHead?.version ?? -1).first();
    if (!reserved) {
      const latest = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
      if (latest?.deleting_at) return completeReservedDelete(env, latest);
      if (!latest) throw new HttpError(404, 'Filen finns inte.');
      throw new HttpError(409, 'Resursen eller webbplatsen ändrades i en annan flik. Ladda om biblioteket.', { asset: record(latest) });
    }
    return completeReservedDelete(env, reserved);
  }
  const now = new Date().toISOString();
  const values = action === 'archive' ? [now, null] : action === 'restore' ? [null, null] : [null, now];
  const updated = await env.CMS_DB.prepare('UPDATE cms_media SET archived_at = ?, trashed_at = ?, version = version + 1 WHERE id = ? AND version = ? AND deleting_at IS NULL RETURNING *').bind(values[0], values[1], id, baseVersion).first();
  if (!updated) {
    const latest = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
    if (!latest) throw new HttpError(404, 'Filen finns inte.');
    throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: record(latest) });
  }
  return { asset: record(updated), usage: { currentReferences: refs, historyReferences: await retainedResourceUsage(env.CMS_DB, src) } };
}

export async function transitionBuiltinAsset(db, builtin, { action, baseVersion, project }) {
  assertLifecycleInput(action, baseVersion);
  const current = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  const version = current?.version ?? 0;
  if (version !== baseVersion) throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: builtinRecord(builtin, current ?? {}) });
  const refs = currentReferenceCount(project, builtin.src);
  if (['trash', 'delete'].includes(action) && refs) throw new HttpError(409, `Resursen används fortfarande ${refs} gånger i aktuellt utkast.`);
  if (action === 'delete') {
    if (!current?.trashed_at) throw new HttpError(409, 'Flytta resursen till papperskorgen före permanent radering.');
    const historical = await retainedResourceUsage(db, builtin.src);
    if (historical) throw new HttpError(409, `Resursen används fortfarande ${historical} gånger i sparad historik.`);
  }
  const now = new Date().toISOString();
  const archived = action === 'archive' ? now : null;
  const trashed = action === 'trash' ? now : null;
  const deleted = action === 'delete' ? now : null;
  const result = !current
    ? await db.prepare('INSERT OR IGNORE INTO cms_builtin_resource_state(source_path,version,name,alt,archived_at,trashed_at,deleted_at,updated_at) VALUES(?,1,NULL,NULL,?,?,?,?)').bind(builtin.src, archived, trashed, deleted, now).run()
    : await db.prepare('UPDATE cms_builtin_resource_state SET archived_at=?, trashed_at=?, deleted_at=?, version=version+1, updated_at=? WHERE source_path=? AND version=?').bind(archived, trashed, deleted, now, builtin.src, baseVersion).run();
  if (!result.meta.changes) {
    const latest = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
    throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: builtinRecord(builtin, latest ?? {}) });
  }
  const row = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  return action === 'delete' ? { deleted: true, id: builtin.id } : { asset: builtinRecord(builtin, row), usage: { currentReferences: refs, historyReferences: await retainedResourceUsage(db, builtin.src) } };
}

export async function updateBuiltinAsset(db, builtin, input) {
  if (!input || Object.keys(input).some(key => !['baseVersion', 'name', 'alt'].includes(key)) || !Number.isSafeInteger(input.baseVersion) || input.baseVersion < 0 || input.name !== undefined && (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 200) || input.alt !== undefined && (typeof input.alt !== 'string' || input.alt.length > 1000)) throw new HttpError(422, 'Resursens uppgifter är ogiltiga.');
  const current = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  const version = current?.version ?? 0;
  if (version !== input.baseVersion) throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: builtinRecord(builtin, current ?? {}) });
  const now = new Date().toISOString();
  const result = !current
    ? await db.prepare('INSERT OR IGNORE INTO cms_builtin_resource_state(source_path,version,name,alt,updated_at) VALUES(?,1,?,?,?)').bind(builtin.src, input.name?.trim() ?? null, input.alt ?? null, now).run()
    : await db.prepare('UPDATE cms_builtin_resource_state SET name=COALESCE(?,name),alt=COALESCE(?,alt),version=version+1,updated_at=? WHERE source_path=? AND version=?').bind(input.name?.trim() ?? null, input.alt ?? null, now, builtin.src, input.baseVersion).run();
  if (!result.meta.changes) {
    const latest = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
    throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: builtinRecord(builtin, latest ?? {}) });
  }
  return builtinRecord(builtin, await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first());
}


export async function managedSvgSource(env, builtin) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  let svg = builtin.editableSvg;
  if (row?.managed_asset_id) {
    const stored = await env.CMS_MEDIA?.get(`managed-svg/${row.managed_asset_id}.svg`);
    if (!stored) throw new HttpError(503, 'Den redigerade SVG-källan saknas i lagringen.');
    svg = await stored.text();
  }
  return { svg: sanitizeManagedSvg(svg), version: row?.version ?? 0, asset: builtinRecord(builtin, row ?? {}) };
}

export async function saveManagedSvg(env, builtin, { baseVersion, svg }) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 0) throw new HttpError(428, 'Hämta SVG-källans aktuella version innan du sparar.');
  const sanitized = sanitizeManagedSvg(svg);
  const current = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  const version = current?.version ?? 0;
  if (version !== baseVersion) throw new HttpError(409, 'SVG-källan ändrades i en annan flik. Ladda om resursen.', { asset: builtinRecord(builtin, current ?? {}) });
  const id = crypto.randomUUID();
  const key = `managed-svg/${id}.svg`;
  const bytes = new TextEncoder().encode(sanitized);
  await env.CMS_MEDIA.put(key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata: { contentType: 'image/svg+xml' }, customMetadata: { sha256: await digest(bytes), source: builtin.src } });
  const now = new Date().toISOString();
  let result;
  if (current) result = await env.CMS_DB.prepare('UPDATE cms_builtin_resource_state SET managed_asset_id=?, version=version+1, updated_at=? WHERE source_path=? AND version=?').bind(id, now, builtin.src, baseVersion).run();
  else result = await env.CMS_DB.prepare('INSERT OR IGNORE INTO cms_builtin_resource_state(source_path,version,managed_asset_id,updated_at) VALUES(?,1,?,?)').bind(builtin.src, id, now).run();
  if (!result.meta.changes) {
    await env.CMS_MEDIA.delete(key);
    const latest = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
    throw new HttpError(409, 'SVG-källan ändrades i en annan flik. Ladda om resursen.', { asset: builtinRecord(builtin, latest ?? {}) });
  }
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  return { svg: sanitized, asset: builtinRecord(builtin, row) };
}

export async function assetResponse(request, env) {
  const missing = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const match = new URL(request.url).pathname.match(/^\/media\/([0-9a-f-]{36})\.(png|jpg|gif|webp|avif|woff2)$/);
  if (!match || !UUID.test(match[1]) || !env.CMS_DB || !env.CMS_MEDIA) return missing();
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ? AND object_key = ?').bind(match[1], `${match[1]}.${match[2]}`).first();
  if (!row) return missing();
  if (!row.published_at) {
    try { await authenticateAdmin(request, env); } catch { return missing(); }
  }
  const object = request.method === 'HEAD' ? await env.CMS_MEDIA.head(row.object_key) : await env.CMS_MEDIA.get(row.object_key);
  if (!object) return missing();
  const headers = { 'Content-Type': row.mime, 'Content-Length': String(row.bytes), 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': row.published_at ? 'public, max-age=31536000, immutable' : 'private, no-store', ETag: object.httpEtag };
  if (request.headers.get('If-None-Match') === object.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}
