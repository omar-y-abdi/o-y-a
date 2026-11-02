import { HttpError } from './http.mjs';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function lifecycle(row) { return row.trashed_at ? 'trash' : row.archived_at ? 'archived' : 'active'; }

export function record(row) {
  const state = lifecycle(row);
  return { id: row.id, version: row.version, src: `/media/${row.object_key}`, name: row.name, mime: row.mime, bytes: row.bytes, width: row.width, height: row.height, alt: row.alt, createdAt: row.created_at, publishedAt: row.published_at, state, archived: state === 'archived', trashed: state === 'trash', deleting: Boolean(row.deleting_at) };
}

export function builtinRecord(asset, row = {}) {
  const state = row.trashed_at ? 'trash' : row.archived_at ? 'archived' : 'active';
  return { ...asset, name: row.name ?? asset.name, alt: row.alt ?? asset.alt ?? '', version: row.version ?? 0, state, archived: state === 'archived', trashed: state === 'trash', deleted: Boolean(row.deleted_at), managedAssetId: row.managed_asset_id ?? null };
}

export async function assetSelection(db, ids = [], { fonts = false } = {}) {
  const rows = await db.prepare("SELECT * FROM cms_media WHERE id IN (SELECT value FROM json_each(?)) OR (? AND mime = 'font/woff2' AND archived_at IS NULL AND trashed_at IS NULL) ORDER BY created_at DESC, id DESC").bind(JSON.stringify(ids), Number(fonts)).all();
  return rows.results.map(record);
}

export async function assetPage(db, { cursor = null, query = '', archived = null, state = null, images = false, fonts = false } = {}) {
  if (state === null && archived !== null) state = archived ? 'archived' : 'active';
  if (typeof query !== 'string' || query.length > 200 || ![null, 'active', 'archived', 'trash'].includes(state)) throw new HttpError(400, 'Sökningen är ogiltig.');
  let before = ['', ''];
  try { if (cursor) before = JSON.parse(cursor); } catch { throw new HttpError(400, 'Biblioteksmarkören är ogiltig.'); }
  if (!Array.isArray(before) || before.length !== 2 || before.some(value => typeof value !== 'string') || cursor && (!/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(before[0]) || !UUID.test(before[1]))) throw new HttpError(400, 'Biblioteksmarkören är ogiltig.');
  const lifecycleFilter = state === 'active' ? 'trashed_at IS NULL AND archived_at IS NULL' : state === 'archived' ? 'trashed_at IS NULL AND archived_at IS NOT NULL' : state === 'trash' ? 'trashed_at IS NOT NULL' : '1';
  const filter = `${lifecycleFilter} AND (? = 0 OR mime LIKE 'image/%') AND (? = 0 OR mime = 'font/woff2') AND (instr(lower(name),lower(?)) > 0 OR instr(lower(mime),lower(?)) > 0)`;
  const parameters = [Number(images), Number(fonts), query, query];
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
