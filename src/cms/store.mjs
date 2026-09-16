import { HttpError } from './http.mjs';
import { fontCss } from './theme.mjs';
import { resourceReferences, resolveResources } from './resources.mjs';
import { resourceSlots } from '../content/resources.mjs';

export async function digest(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function compress(text) {
  return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
}

async function decompress(bytes) {
  return new Response(new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}

export async function readSite(db, version) {
  const row = version === undefined
    ? await db.prepare('SELECT r.* FROM cms_head h JOIN cms_revisions r ON r.version = h.version WHERE h.id = 1').first()
    : await db.prepare('SELECT * FROM cms_revisions WHERE version = ?').bind(version).first();
  if (!row) return null;
  return { version: row.version, requestId: row.request_id, createdAt: row.created_at, project: JSON.parse(await decompress(row.project)) };
}

export async function readPublicPage(db, path) {
  const row = await db.prepare('SELECT h.version, p.html, p.css, p.meta FROM cms_head h LEFT JOIN cms_rendered p ON p.version = h.version AND p.path = ? WHERE h.id = 1').bind(path).first();
  if (!row || row.version === 0) return null;
  if (row.html === null) return { version: row.version, page: null };
  return { version: row.version, html: row.html, css: row.css, ...JSON.parse(row.meta) };
}

export async function readPublicData(db, key) {
  const value = await readPublicPage(db, `@${key}`);
  if (!value?.html) return null;
  let data = JSON.parse(value.html);
  if (key === 'cards' && !Array.isArray(data)) {
    const rows = await db.prepare("SELECT path, html FROM cms_rendered WHERE version = ? AND path GLOB '@card/*'").bind(value.version).all();
    const cards = new Map(rows.results.map(row => [row.path.slice(6), JSON.parse(row.html)]));
    data = data.ids.map(id => { if (!cards.has(id)) throw new Error('CMS_CARD_MANIFEST_INCOMPLETE'); return cards.get(id); });
  }
  return { version: value.version, value: data };
}


export async function retainedResourceUsage(db, src) {
  const rows = await db.prepare('SELECT project FROM cms_revisions ORDER BY version').all();
  let references = 0;
  for (const row of rows.results) {
    const project = JSON.parse(await decompress(row.project));
    references += resourceReferences(project).get(src) ?? 0;
  }
  return references;
}

export async function readHistory(db, cursor = Number.MAX_SAFE_INTEGER) {
  const rows = await db.prepare('SELECT version, created_at AS createdAt, actor, summary FROM cms_revisions WHERE version < ? ORDER BY version DESC LIMIT 51').bind(cursor).all();
  return { items: rows.results.slice(0, 50), next: rows.results.length > 50 ? rows.results[49].version : null };
}

function metadata(page) {
  const { id, path, name, title, description, template, bodyClass, noindex, sourceId } = page;
  return { id, path, name, title, description, template, bodyClass, noindex: Boolean(noindex), sourceId };
}

const utf8Bytes = value => new TextEncoder().encode(value).byteLength;
export const PUBLIC_ROW_LIMIT = 1500000;
export const PUBLIC_BIND_LIMIT = 1800000;
export function publicationChunks(project, resources = resourceSlots) {
  const fonts = fontCss(project);
  const manifest = project.pages.map(metadata);
  const publicCard = card => ({ id: card.id, flavor: card.flavor, text: card.text, ...(card.design ? { design: { html: card.design.html, css: fontCss({ theme: {}, pages: [], cards: [card] }) + card.design.css } } : {}) });
  const addressableCards = project.cards.filter(card => (card.state ?? 'active') !== 'trash').map(publicCard);
  const activeIds = project.cards.filter(card => (card.state ?? 'active') === 'active').map(card => card.id);
  const rendered = [
    ...project.pages.map(page => ({ path: page.path, html: page.html, css: fonts + page.css, meta: { ...metadata(page), resources } })),
    ...addressableCards.map(card => ({ path: `@card/${card.id}`, html: JSON.stringify(card), css: '', meta: {} })),
    ...[['cards', { schemaVersion: 1, ids: activeIds }], ['runtime', project.runtime], ['theme', project.theme], ['resources', resources], ['manifest', manifest]].map(([key, value]) => ({ path: `@${key}`, html: JSON.stringify(value), css: '', meta: {} })),
  ];
  const chunks = [[]];
  let chunkBytes = 2, totalBytes = 0;
  for (const item of rendered) {
    const rowBytes = utf8Bytes(item.path + item.html + item.css + JSON.stringify(item.meta)) + 64;
    const bindBytes = utf8Bytes(JSON.stringify(item)) + 1;
    if (rowBytes > PUBLIC_ROW_LIMIT || bindBytes + 2 > PUBLIC_BIND_LIMIT) throw new HttpError(413, `Innehållet ${item.path} är för stort för publicering. Minska sidans eller kortets innehåll.`);
    totalBytes += bindBytes;
    if (totalBytes > 16 * 1024 * 1024) throw new HttpError(413, 'Det renderade innehållet är för stort. Minska upprepade stilar och innehåll.');
    if (chunkBytes + bindBytes > PUBLIC_BIND_LIMIT && chunks.at(-1).length) { chunks.push([]); chunkBytes = 2; }
    chunks.at(-1).push(item); chunkBytes += bindBytes;
  }
  return chunks;
}

export async function publicationMedia(db, project) {
  const mediaKeys = [...resourceReferences(project).keys()].filter(src => /^\/media\/[0-9a-f-]{36}\.(png|jpg|gif|webp|avif|woff2)$/.test(src)).map(src => src.slice(7));
  let media = [];
  if (mediaKeys.length) {
    const available = await db.prepare('SELECT object_key, mime, width, height, alt, validation_version FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL').bind(JSON.stringify(mediaKeys)).all();
    if (available.results.length !== mediaKeys.length) throw new HttpError(422, 'En vald fil saknas. Ladda upp filen innan du sparar.');
    if (available.results.some(row => !row.validation_version)) throw new HttpError(422, 'En vald fil behöver kontrolleras igen innan publicering.');
    media = available.results.map(row => ({ ...row, src: '/media/' + row.object_key }));
  }
  return media;
}

export async function publishSite(db, { project, baseVersion, requestId, actor }) {
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 0 || !/^[0-9a-f-]{36}$/.test(requestId)) throw new HttpError(400, 'Sparförsöket saknar en giltig version eller identitet.');
  const serialized = JSON.stringify(project);
  if (new TextEncoder().encode(serialized).byteLength > 8 * 1024 * 1024) throw new HttpError(413, 'Projektet är för stort.');
  const hash = await digest(serialized);
  const existing = await db.prepare('SELECT version, payload_hash, actor, created_at FROM cms_revisions WHERE request_id = ?').bind(requestId).first();
  if (existing) {
    if (existing.payload_hash !== hash || existing.actor !== actor) throw new HttpError(409, 'Sparförsökets identitet har redan använts för andra ändringar.');
    return { version: existing.version, requestId, createdAt: existing.created_at, replayed: true };
  }
  const compressed = await compress(serialized);
  if (compressed.byteLength > 1500000) throw new HttpError(413, 'Projektets innehåll är för stort för en säker version.');
  const version = baseVersion + 1;
  const createdAt = new Date().toISOString();
  const manifest = project.pages.map(metadata);
  const media = await publicationMedia(db, project);
  const mediaKeys = media.map(row => row.object_key);
  const summary = `${manifest.length} sidor · ${project.cards.length} vinster`;
  const revision = mediaKeys.length
    ? db.prepare('INSERT INTO cms_revisions (version, request_id, base_version, actor, created_at, payload_hash, project, manifest, summary) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? FROM cms_head WHERE id = 1 AND version = ? AND (SELECT count(*) FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL AND validation_version IS NOT NULL) = ?').bind(version, requestId, baseVersion, actor, createdAt, hash, compressed, JSON.stringify(manifest), summary, baseVersion, JSON.stringify(mediaKeys), mediaKeys.length)
    : db.prepare('INSERT INTO cms_revisions (version, request_id, base_version, actor, created_at, payload_hash, project, manifest, summary) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? FROM cms_head WHERE id = 1 AND version = ?').bind(version, requestId, baseVersion, actor, createdAt, hash, compressed, JSON.stringify(manifest), summary, baseVersion);
  const statements = [revision];
  const chunks = publicationChunks(project, await resolveResources(db, project));
  for (const chunk of chunks) statements.push(db.prepare("INSERT INTO cms_rendered (version, path, html, css, meta) SELECT ?, json_extract(value, '$.path'), json_extract(value, '$.html'), json_extract(value, '$.css'), json_extract(value, '$.meta') FROM json_each(?) WHERE (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id = ?)").bind(version, JSON.stringify(chunk), baseVersion, requestId));
  if (mediaKeys.length) statements.push(db.prepare('UPDATE cms_media SET published_at = COALESCE(published_at, ?) WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL AND (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id = ?)').bind(createdAt, JSON.stringify(mediaKeys), baseVersion, requestId));
  statements.push(db.prepare('UPDATE cms_head SET version = ? WHERE id = 1 AND version = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id = ?)').bind(version, baseVersion, requestId));
  // The conditional inserts and pointer change share a D1 transaction. A stale
  // request writes no rows; any SQL failure rolls back the complete publication.
  await db.batch(statements);
  const committed = await db.prepare('SELECT version, payload_hash, actor, created_at FROM cms_revisions WHERE request_id = ?').bind(requestId).first();
  if (!committed) throw new HttpError(409, 'Webbplatsen ändrades i en annan flik. Ditt utkast finns kvar; jämför innan du sparar igen.');
  if (committed.payload_hash !== hash || committed.actor !== actor) throw new HttpError(409, 'Ett annat sparförsök använde samma identitet.');
  return { version: committed.version, requestId, createdAt: committed.created_at };
}
