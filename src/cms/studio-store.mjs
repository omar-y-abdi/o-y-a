// Bounded D1 values; do not split a surrogate pair when serializing Unicode.
export const STUDIO_TEXT_CHUNK = 32768;
export function textParts(text) {
  const parts = [];
  for (let offset = 0; offset < text.length;) {
    let end = Math.min(offset + STUDIO_TEXT_CHUNK, text.length);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    parts.push(text.slice(offset, end));
    offset = end;
  }
  return parts;
}

const missingSchema = error => /no such table: (?:main\.)?cms_studio_(?:heads|text)\b/i.test(String(error?.message ?? error));
const columns = 's.version,s.build_key,s.project_hash,s.text_parts,CASE WHEN t.part=0 THEN s.resources END AS resources,t.part,t.body';
function studioRecord(rows) {
  if (!rows.length) return null;
  if (rows.length !== rows[0].text_parts || rows.some((row, index) => row.part !== index || typeof row.body !== 'string')) throw new Error('CMS_STUDIO_TEXT_INCOMPLETE');
  return { version: rows[0].version, buildKey: rows[0].build_key, hash: rows[0].project_hash, resources: JSON.parse(rows[0].resources), parts: rows.map(row => row.body) };
}

// Only current, matching-code text can bypass the ordinary revision reader.
// Missing new tables permit the old read path during an additive rollout;
// Incomplete text/index and every other database error stay visible. Stored
// body/hash equality is checked by the release gate, not rehashed on each read.
export async function readStudioHead(db, buildKey) {
  if (!buildKey) return null;
  try {
    const { results } = await db.prepare(`SELECT ${columns},CASE WHEN t.part=0 THEN EXISTS(SELECT 1 FROM cms_revision_resource_indexed WHERE version=s.version) END AS indexed,CASE WHEN t.part=0 THEN (SELECT json_group_array(src) FROM (SELECT src FROM cms_revision_resource_index WHERE version=s.version AND src GLOB '/media/*' ORDER BY src)) END AS media_references FROM cms_head h JOIN cms_studio_heads s ON s.version=h.version LEFT JOIN cms_studio_text t ON t.version=s.version WHERE h.id=1 AND s.build_key=? ORDER BY t.part`).bind(buildKey).all();
    const record = studioRecord(results);
    if (!record) return null;
    if (!results[0].indexed) throw new Error('CMS_STUDIO_RESOURCE_INDEX_MISSING');
    return { ...record, mediaReferences: JSON.parse(results[0].media_references) };
  } catch (error) { if (missingSchema(error)) return null; throw error; }
}

// Release/backup verification explicitly inspects a pinned representation even
// if it belongs to an earlier build. Never use this as a serving shortcut.
export async function readStudioVersion(db, version) {
  try {
    const { results } = await db.prepare(`SELECT ${columns} FROM cms_studio_heads s LEFT JOIN cms_studio_text t ON t.version=s.version WHERE s.version=? ORDER BY t.part`).bind(version).all();
    return studioRecord(results);
  } catch (error) { if (missingSchema(error)) return null; throw error; }
}

function textBatches(parts) {
  const batches = [];
  let entries = [], bytes = 2;
  for (const [part, body] of parts.entries()) {
    const entry = JSON.stringify({ part, body }), size = new TextEncoder().encode(entry).byteLength + 1;
    if (bytes + size > 1000000) { batches.push('[' + entries.join(',') + ']'); entries = []; bytes = 2; }
    entries.push(entry); bytes += size;
  }
  if (entries.length) batches.push('[' + entries.join(',') + ']');
  return batches;
}

export function studioStatements(db, { version, serialized, resources, buildKey, hash, condition, values }) {
  const statements = [db.prepare(`DELETE FROM cms_studio_heads WHERE ${condition}`).bind(...values)];
  if (!buildKey) return statements;
  const parts = textParts(serialized);
  statements.push(db.prepare(`INSERT INTO cms_studio_heads(version,build_key,project_hash,resources,text_parts) SELECT ?,?,?,?,? WHERE ${condition}`).bind(version, buildKey, hash, JSON.stringify(resources), parts.length, ...values));
  for (const batch of textBatches(parts)) statements.push(db.prepare(`INSERT INTO cms_studio_text(version,part,body) SELECT ?,json_extract(value,'$.part'),json_extract(value,'$.body') FROM json_each(?) WHERE ${condition}`).bind(version, batch, ...values));
  return statements;
}
