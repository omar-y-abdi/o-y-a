import { HttpError } from './http.mjs';
import { fontCss } from './theme.mjs';
import { resourceReferences, resolveResources } from './resources.mjs';
import { resourceSlots } from '../content/resources.mjs';
import { composePage, frameCss } from './frame.mjs';
import { trimLegacySaveMetadata } from './legacy-save-identity.mjs';
import { studioStatements } from './studio-store.mjs';
import { previewFacts } from './preview-store.mjs';
import { digest } from './digest.mjs';
import { storedProjectView } from './stored-view.mjs';
import { stripNodeKeys } from './public-html.mjs';
export { digest } from './digest.mjs';

async function compress(text) {
  return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
}

async function decompress(bytes) {
  return new Response(new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}

export async function readSite(db, version, { raw = false } = {}) {
  const row = version === undefined
    ? await db.prepare('SELECT r.* FROM cms_head h JOIN cms_revisions r ON r.version = h.version WHERE h.id = 1').first()
    : await db.prepare('SELECT * FROM cms_revisions WHERE version = ?').bind(version).first();
  if (!row) return null;
  const project = JSON.parse(await decompress(row.project));
  // Migration CAS hashes the exact stored project; normal reads discard unused editor JSON.
  if (!raw) storedProjectView(project);
  return { version: row.version, requestId: row.request_id, createdAt: row.created_at, project };
}

export async function readCurrentVersion(db) {
  const row = await db.prepare('SELECT version FROM cms_head WHERE id = 1').first();
  return Number(row?.version ?? 0);
}

export async function replaySave(db, { requestId, actor, payloadHash }) {
  const existing = await db.prepare('SELECT version, payload_hash, actor, created_at FROM cms_revisions WHERE request_id = ?').bind(requestId).first();
  if (!existing) return null;
  if (existing.payload_hash !== payloadHash || existing.actor !== actor) throw new HttpError(409, 'Ett annat sparförsök använde samma identitet.');
  return { version: existing.version, requestId, createdAt: existing.created_at, replayed: true };
}

export async function replayFullSave(db, { requestId, actor, baseVersion, payloadHash, project }) {
  const existing = await db.prepare('SELECT version, base_version, request_format, payload_hash, actor, created_at FROM cms_revisions WHERE request_id = ?').bind(requestId).first();
  if (!existing) return null;
  if (existing.actor !== actor || existing.base_version !== baseVersion) throw new HttpError(409, 'Ett annat sparförsök använde samma identitet.');
  let expected = existing.request_format === 'full-v1' ? payloadHash : null;
  if (existing.request_format === 'canonical' && [1, 2].includes(project?.schemaVersion) && Array.isArray(project.pages)) {
    expected = await digest(JSON.stringify(project));
    if (expected !== existing.payload_hash) {
      const trimmed = trimLegacySaveMetadata(project);
      if (trimmed) expected = await digest(JSON.stringify(trimmed));
    }
  }
  if (expected !== existing.payload_hash) {
    if (existing.request_format === 'canonical') {
      // The old Worker stored no raw request identity. Re-normalizing with new
      // rules cannot prove equality, nor can a mismatch prove changed content.
      throw new HttpError(409, `Sparförsöket finns redan som version ${existing.version}, men dess äldre innehåll kan inte jämföras säkert. Ditt frysta utkast finns kvar. Jämför med versionen i historiken innan du återställer eller sparar nya ändringar.`, { saveIdentityUnverified: true, recordedVersion: existing.version });
    }
    throw new HttpError(409, 'Ett annat sparförsök använde samma identitet.');
  }
  return { version: existing.version, requestId, createdAt: existing.created_at, replayed: true };
}

export async function readPublicPage(db, path) {
  const htmlPage = path.startsWith('/') || path === '@frame';
  const row = await db.prepare(`SELECT h.version, p.html, p.css, p.meta${htmlPage ? ', r.html AS runtime' : ''} FROM cms_head h LEFT JOIN cms_rendered p ON p.version = h.version AND p.path = ?${htmlPage ? " LEFT JOIN cms_rendered r ON r.version = h.version AND r.path = '@runtime'" : ''} WHERE h.id = 1`).bind(path).first();
  if (!row || row.version === 0) return null;
  if (row.html === null) return { version: row.version, page: null };
  return { version: row.version, html: row.html, css: row.css, ...JSON.parse(row.meta), ...(htmlPage ? { runtimeJson: row.runtime ?? undefined } : {}) };
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


const RESOURCE_BACKFILL_LIMIT = 20;
async function indexRevisionResources(db, version, project) {
  const refs = [...resourceReferences(project).entries()];
  const statements = refs.map(([src, count]) => db.prepare('INSERT OR REPLACE INTO cms_revision_resource_index(version,src,reference_count) VALUES(?,?,?)').bind(version, src, count));
  statements.push(db.prepare('INSERT OR IGNORE INTO cms_revision_resource_indexed(version) VALUES(?)').bind(version));
  await db.batch(statements);
}
async function backfillRevisionResourceIndex(db) {
  const rows = await db.prepare('SELECT r.version,r.project FROM cms_revisions r LEFT JOIN cms_revision_resource_indexed i ON i.version=r.version WHERE i.version IS NULL ORDER BY r.version LIMIT ?').bind(RESOURCE_BACKFILL_LIMIT + 1).all();
  for (const row of rows.results.slice(0, RESOURCE_BACKFILL_LIMIT)) await indexRevisionResources(db, row.version, JSON.parse(await decompress(row.project)));
  if (rows.results.length > RESOURCE_BACKFILL_LIMIT) throw new HttpError(503, 'Historikens resursindex byggs om. Försök igen så fortsätter återställningen.');
}
export async function retainedResourceUsage(db, src) {
  await backfillRevisionResourceIndex(db);
  const row = await db.prepare('SELECT COALESCE(sum(reference_count),0) AS total FROM cms_revision_resource_index WHERE src=?').bind(src).first();
  return Number(row?.total ?? 0);
}

export async function readHistory(db, cursor = Number.MAX_SAFE_INTEGER) {
  const rows = await db.prepare('SELECT version, created_at AS createdAt, actor, summary FROM cms_revisions WHERE version < ? ORDER BY version DESC LIMIT 51').bind(cursor).all();
  return { items: rows.results.slice(0, 50), next: rows.results.length > 50 ? rows.results[49].version : null };
}

function metadata(page) {
  const { id, path, name, title, description, template, bodyClass, noindex, sourceId, footerVersion } = page;
  return { id, path, name, title, description, template, bodyClass, noindex: Boolean(noindex), sourceId, ...(footerVersion === undefined ? {} : { footerVersion }) };
}

const utf8Bytes = value => new TextEncoder().encode(value).byteLength;
export const PUBLIC_ROW_LIMIT = 1500000;
export const PUBLIC_BIND_LIMIT = 1800000;
export const RENDERED_RETENTION_MS = 24 * 60 * 60 * 1000;
// The successor timestamp is when this version was replaced. Receipt resources
// and templates remain pinned for every retained revision.
export const EXPIRED_RENDERED_SQL = "path NOT IN ('@resources','@email') AND EXISTS (SELECT 1 FROM cms_revisions successor WHERE successor.version = cms_rendered.version + 1 AND successor.base_version = cms_rendered.version AND successor.created_at <= ?)";
export function publicationChunks(project, resources = resourceSlots, references = resourceReferences(project)) {
  const fonts = fontCss(project, references);
  const manifest = project.pages.map(metadata);
  const publicCard = card => ({ id: card.id, flavor: card.flavor, text: card.text, ...(card.design ? { design: { html: card.design.html, css: fontCss({ theme: {}, pages: [], cards: [card] }) + card.design.css } } : {}) });
  const addressableCards = project.cards.filter(card => (card.state ?? 'active') !== 'trash').map(publicCard);
  const activeIds = project.cards.filter(card => (card.state ?? 'active') === 'active').map(card => card.id);
  const rendered = [
    ...project.pages.map(page => {
      const html = composePage(project.frame, page);
      return { path: page.path, html: project.frame ? stripNodeKeys(html) : html, css: fonts + frameCss(project.frame, page) + page.css, meta: { ...metadata(page), resources, ...(project.frame ? { frameVersion: 2 } : {}) } };
    }),
    ...(project.frame ? [{ path: '@frame', html: stripNodeKeys(project.frame.html), css: fonts + project.frame.css, meta: { id: 'skift', resources } }] : []),
    ...addressableCards.map(card => ({ path: `@card/${card.id}`, html: JSON.stringify(card), css: '', meta: {} })),
    ...[['cards', { schemaVersion: 1, ids: activeIds }], ['runtime', project.runtime], ['theme', project.theme], ['resources', resources], ['manifest', manifest], ['email', project.email ?? null]].map(([key, value]) => ({ path: `@${key}`, html: JSON.stringify(value), css: '', meta: {} })),
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

export async function publicationMedia(db, project, references = resourceReferences(project)) {
  const mediaKeys = [...references.keys()].filter(src => /^\/media\/[0-9a-f-]{36}\.(png|jpg|gif|webp|avif|woff2)$/.test(src)).map(src => src.slice(7));
  let media = [];
  if (mediaKeys.length) {
    const available = await db.prepare('SELECT object_key, mime, width, height, alt, validation_version FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL AND trashed_at IS NULL').bind(JSON.stringify(mediaKeys)).all();
    if (available.results.length !== mediaKeys.length) throw new HttpError(422, 'En vald fil saknas. Ladda upp filen innan du sparar.');
    if (available.results.some(row => !row.validation_version)) throw new HttpError(422, 'En vald fil behöver kontrolleras igen innan publicering.');
    media = available.results.map(row => ({ ...row, src: '/media/' + row.object_key }));
  }
  return media;
}

export async function publishSite(db, { project, baseVersion, requestId, actor, payloadHash, references, requestFormat = 'canonical', studioKey, previewFrame, origin }) {
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 0 || !/^[0-9a-f-]{36}$/.test(requestId)) throw new HttpError(400, 'Sparförsöket saknar en giltig version eller identitet.');
  const serialized = JSON.stringify(project);
  if (new TextEncoder().encode(serialized).byteLength > 8 * 1024 * 1024) throw new HttpError(413, 'Projektet är för stort.');
  const hash = payloadHash ?? await digest(serialized);
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
  const trustedReferences = references ?? resourceReferences(project);
  const media = await publicationMedia(db, project, trustedReferences);
  const mediaKeys = media.map(row => row.object_key);
  const summary = `${manifest.length} sidor · ${project.cards.length} vinster`;
  const revision = mediaKeys.length
    ? db.prepare('INSERT INTO cms_revisions (version, request_id, base_version, actor, created_at, payload_hash, request_format, project, manifest, summary) SELECT ?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'), ?, ?, ?, ?, ? FROM cms_head WHERE id = 1 AND version = ? AND (SELECT count(*) FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL AND trashed_at IS NULL AND validation_version > 0) = ?').bind(version, requestId, baseVersion, actor, hash, requestFormat, compressed, JSON.stringify(manifest), summary, baseVersion, JSON.stringify(mediaKeys), mediaKeys.length)
    : db.prepare('INSERT INTO cms_revisions (version, request_id, base_version, actor, created_at, payload_hash, request_format, project, manifest, summary) SELECT ?, ?, ?, ?, strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\'), ?, ?, ?, ?, ? FROM cms_head WHERE id = 1 AND version = ?').bind(version, requestId, baseVersion, actor, hash, requestFormat, compressed, JSON.stringify(manifest), summary, baseVersion);
  const statements = [revision];
  const resourceIndex = [...trustedReferences.entries()];
  if (resourceIndex.length) statements.push(db.prepare("INSERT INTO cms_revision_resource_index(version,src,reference_count) SELECT ?, json_extract(value,'$[0]'), json_extract(value,'$[1]') FROM json_each(?) WHERE (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id=?)").bind(version, JSON.stringify(resourceIndex), baseVersion, requestId));
  statements.push(db.prepare('INSERT INTO cms_revision_resource_indexed(version) SELECT ? WHERE (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id=?)').bind(version, baseVersion, requestId));
  const chunks = publicationChunks(project, await resolveResources(db, project), trustedReferences);
  for (const chunk of chunks) statements.push(db.prepare("INSERT INTO cms_rendered (version, path, html, css, meta) SELECT ?, json_extract(value, '$.path'), json_extract(value, '$.html'), json_extract(value, '$.css'), json_extract(value, '$.meta') FROM json_each(?) WHERE (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id = ?)").bind(version, JSON.stringify(chunk), baseVersion, requestId));
  if (mediaKeys.length) statements.push(db.prepare('UPDATE cms_media SET published_at = COALESCE(published_at, ?) WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL AND trashed_at IS NULL AND (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id = ?)').bind(createdAt, JSON.stringify(mediaKeys), baseVersion, requestId));
  // Bound ordinary saves to one expired version; the paged maintenance script
  // handles a historical backlog without charging it to an owner's Save.
  statements.push(db.prepare(`DELETE FROM cms_rendered WHERE path NOT IN ('@resources','@email') AND version = (SELECT previous.version FROM cms_revisions previous JOIN cms_revisions successor ON successor.version = previous.version + 1 WHERE successor.base_version = previous.version AND successor.created_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now','-24 hours') AND EXISTS (SELECT 1 FROM cms_rendered WHERE version = previous.version AND path NOT IN ('@resources','@email')) ORDER BY previous.version LIMIT 1) AND version < ? AND (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id = ?)`).bind(baseVersion, baseVersion, requestId));
  // API publishers provide the build identity only after server validation.
  // Legacy/reverse and direct fixture publishers invalidate the optional copy.
  const buildKey = project.schemaVersion === 2 ? studioKey : undefined;
  statements.push(...studioStatements(db, { version, serialized, resources: project.resources, buildKey, hash: buildKey ? await digest(serialized) : undefined, facts: buildKey && previewFrame && origin ? await previewFacts(project, previewFrame, origin) : [], condition: '(SELECT version FROM cms_head WHERE id=1)=? AND EXISTS(SELECT 1 FROM cms_revisions WHERE request_id=?)', values: [baseVersion, requestId] }));
  statements.push(db.prepare('UPDATE cms_head SET version = ? WHERE id = 1 AND version = ? AND EXISTS (SELECT 1 FROM cms_revisions WHERE request_id = ?)').bind(version, baseVersion, requestId));
  // The conditional inserts and pointer change share a D1 transaction. A stale
  // request writes no rows; any SQL failure rolls back the complete publication.
  await db.batch(statements);
  const committed = await db.prepare('SELECT version, payload_hash, actor, created_at FROM cms_revisions WHERE request_id = ?').bind(requestId).first();
  if (!committed) throw new HttpError(409, 'Webbplatsen ändrades i en annan flik. Ditt utkast finns kvar; jämför innan du sparar igen.');
  if (committed.payload_hash !== hash || committed.actor !== actor) throw new HttpError(409, 'Ett annat sparförsök använde samma identitet.');
  return { version: committed.version, requestId, createdAt: committed.created_at };
}
