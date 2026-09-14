import { imageDimensionsFromData } from 'image-dimensions';
import { authenticateAdmin } from './auth.mjs';
import { HttpError } from './http.mjs';
import { digest } from './store.mjs';

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

function record(row) {
  return { id: row.id, version: row.version, src: `/media/${row.object_key}`, name: row.name, mime: row.mime, bytes: row.bytes, width: row.width, height: row.height, alt: row.alt, createdAt: row.created_at, publishedAt: row.published_at, archived: Boolean(row.archived_at) };
}

export async function listAssets(db) {
  const rows = await db.prepare('SELECT * FROM cms_media ORDER BY created_at DESC').all();
  return rows.results.map(record);
}

export async function assetSelection(db, ids = [], { fonts = false } = {}) {
  const rows = await db.prepare("SELECT * FROM cms_media WHERE id IN (SELECT value FROM json_each(?)) OR (? AND mime = 'font/woff2' AND archived_at IS NULL) ORDER BY created_at DESC, id DESC").bind(JSON.stringify(ids), Number(fonts)).all();
  return rows.results.map(record);
}

export async function assetPage(db, { cursor = null, query = '', archived = null, images = false } = {}) {
  if (typeof query !== 'string' || query.length > 200 || ![null, true, false].includes(archived)) throw new HttpError(400, 'Sökningen är ogiltig.');
  let before = ['', ''];
  try { if (cursor) before = JSON.parse(cursor); } catch { throw new HttpError(400, 'Biblioteksmarkören är ogiltig.'); }
  if (!Array.isArray(before) || before.length !== 2 || before.some(value => typeof value !== 'string') || cursor && (!/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(before[0]) || !UUID.test(before[1]))) throw new HttpError(400, 'Biblioteksmarkören är ogiltig.');
  const filter = "(? = -1 OR (archived_at IS NOT NULL) = ?) AND (? = 0 OR mime LIKE 'image/%') AND (instr(lower(name),lower(?)) > 0 OR instr(lower(mime),lower(?)) > 0)";
  const parameters = [archived === null ? -1 : Number(archived), Number(archived), Number(images), query, query];
  const [rows, count] = await Promise.all([
    db.prepare(`SELECT * FROM cms_media WHERE ${filter} AND (? = '' OR created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC, id DESC LIMIT 61`).bind(...parameters, ...[before[0], before[0], before[0], before[1]]).all(),
    db.prepare(`SELECT count(*) AS total FROM cms_media WHERE ${filter}`).bind(...parameters).first(),
  ]);
  const items = rows.results.slice(0, 60);
  return { items: items.map(record), total: count.total, next: rows.results.length > 60 ? JSON.stringify([items.at(-1).created_at, items.at(-1).id]) : null };
}

export async function uploadAsset(env, { id, bytes, name, alt = '' }) {
  if (!env.CMS_DB || !env.CMS_MEDIA) throw new HttpError(503, 'Mediebiblioteket är inte tillgängligt.');
  if (!UUID.test(id) || typeof name !== 'string' || !name.trim() || name.length > 200 || /[\u0000-\u001f]/.test(name) || typeof alt !== 'string' || alt.length > 1000) throw new HttpError(422, 'Filnamn eller alternativtext är ogiltigt.');
  const info = inspectAsset(bytes);
  const hash = await digest(bytes);
  const existing = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  if (existing) {
    if (existing.sha256 !== hash) throw new HttpError(409, 'Uppladdningens identitet används redan av en annan fil.');
    return record(existing);
  }
  if (info.mime === 'font/woff2' && (await assetPage(env.CMS_DB, { query: 'font/woff2', archived: false })).total >= MAX_ACTIVE_FONTS) throw new HttpError(413, 'Biblioteket stöder 64 aktiva typsnitt. Arkivera ett oanvänt typsnitt innan du laddar upp fler.');
  const key = `${id}.${info.extension}`;
  const stored = await env.CMS_MEDIA.put(key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata: { contentType: info.mime }, customMetadata: { sha256: hash } });
  if (!stored) {
    const previous = await env.CMS_MEDIA.head(key);
    if (previous?.customMetadata?.sha256 !== hash) throw new HttpError(409, 'En annan fil finns redan för det här sparförsöket.');
  }
  // Retrying the same ID can adopt a completed upload after a metadata outage.
  // Unregistered objects are never served publicly and never replace old assets.
  await env.CMS_DB.prepare("INSERT OR IGNORE INTO cms_media (id, object_key, name, mime, bytes, width, height, alt, sha256, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ? != 'font/woff2' OR (SELECT count(*) FROM cms_media WHERE mime = 'font/woff2' AND archived_at IS NULL) < ?").bind(id, key, name.trim(), info.mime, bytes.byteLength, info.width, info.height, alt, hash, new Date().toISOString(), info.mime, MAX_ACTIVE_FONTS).run();
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  if (!row || row.sha256 !== hash) throw new HttpError(409, 'Uppladdningen kunde inte bekräftas. Försök igen.');
  return record(row);
}

export async function updateAsset(db, id, input) {
  if (!UUID.test(id) || !input || Object.keys(input).some(key => !['baseVersion', 'name', 'alt', 'archived'].includes(key)) || input.name !== undefined && (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 200 || /[\u0000-\u001f]/.test(input.name)) || input.alt !== undefined && (typeof input.alt !== 'string' || input.alt.length > 1000) || input.archived !== undefined && typeof input.archived !== 'boolean') throw new HttpError(422, 'Filens uppgifter är ogiltiga.');
  if (!Number.isSafeInteger(input.baseVersion) || input.baseVersion < 0) throw new HttpError(428, 'Hämta filens aktuella uppgifter innan du ändrar dem.');
  const result = await db.prepare('UPDATE cms_media SET name = COALESCE(?, name), alt = COALESCE(?, alt), archived_at = CASE WHEN ? THEN ? ELSE archived_at END, version = version + 1 WHERE id = ? AND version = ? RETURNING *').bind(input.name?.trim() ?? null, input.alt ?? null, Number(input.archived !== undefined), input.archived ? new Date().toISOString() : null, id, input.baseVersion).first();
  if (!result) {
    const current = await db.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
    if (!current) throw new HttpError(404, 'Filen finns inte.');
    throw new HttpError(409, 'Filens uppgifter ändrades i en annan flik. Ditt formulär finns kvar.', { asset: record(current) });
  }
  return record(result);
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
