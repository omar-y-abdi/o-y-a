import { HttpError } from './http.mjs';
import { digest } from './store.mjs';
import { sanitizeManagedSvg } from './svg.mjs';
import { builtinRecord, UUID } from './assets.mjs';

function managedSvgOperationRecord(row) {
  if (!row) return null;
  return { id: row.id, state: row.state, baseVersion: row.base_version, managedAssetId: row.managed_asset_id, derivativeId: row.derivative_media_id ?? null, updatedAt: row.updated_at };
}

async function managedSvgOperationRow(db, builtin, operationId) {
  if (!UUID.test(operationId ?? '')) throw new HttpError(422, 'SVG-sparningens identitet är ogiltig.');
  const row = await db.prepare('SELECT * FROM cms_managed_svg_operations WHERE id = ? AND source_path = ?').bind(operationId, builtin.src).first();
  if (!row) throw new HttpError(404, 'SVG-sparningen finns inte längre.');
  return row;
}

async function managedSvgBytes(env, managedAssetId) {
  const stored = await env.CMS_MEDIA?.get(`managed-svg/${managedAssetId}.svg`);
  if (!stored) throw new HttpError(503, 'Den redigerade SVG-källan saknas i lagringen.');
  return sanitizeManagedSvg(await stored.text());
}

export async function managedSvgSource(env, builtin) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  let svg = builtin.editableSvg;
  if (row?.managed_asset_id) svg = await managedSvgBytes(env, row.managed_asset_id);
  const pending = row?.managed_asset_id ? await env.CMS_DB.prepare("SELECT * FROM cms_managed_svg_operations WHERE source_path = ? AND managed_asset_id = ? AND state = 'committed' ORDER BY updated_at DESC LIMIT 1").bind(builtin.src, row.managed_asset_id).first() : null;
  return { svg: sanitizeManagedSvg(svg), version: row?.version ?? 0, asset: builtinRecord(builtin, row ?? {}), operation: managedSvgOperationRecord(pending) };
}

export function validateManagedSvg(builtin, svg) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  return { svg: sanitizeManagedSvg(svg) };
}

export async function stageManagedSvg(env, builtin, { operationId, baseVersion, svg }) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  if (!UUID.test(operationId ?? '')) throw new HttpError(422, 'SVG-sparningens identitet är ogiltig.');
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 0) throw new HttpError(428, 'Hämta SVG-källans aktuella version innan du sparar.');
  const sanitized = sanitizeManagedSvg(svg);
  const bytes = new TextEncoder().encode(sanitized);
  const hash = await digest(bytes);
  const existing = await env.CMS_DB.prepare('SELECT * FROM cms_managed_svg_operations WHERE id = ?').bind(operationId).first();
  if (existing) {
    if (existing.source_path !== builtin.src || existing.base_version !== baseVersion || existing.svg_sha256 !== hash) throw new HttpError(409, 'SVG-sparningens identitet används redan av ett annat utkast.');
    return { svg: await managedSvgBytes(env, existing.managed_asset_id), operation: managedSvgOperationRecord(existing) };
  }
  const current = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  if ((current?.version ?? 0) !== baseVersion) throw new HttpError(409, 'SVG-källan ändrades i en annan flik. Ladda om resursen.', { asset: builtinRecord(builtin, current ?? {}) });
  const key = `managed-svg/${operationId}.svg`;
  const stored = await env.CMS_MEDIA.put(key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata: { contentType: 'image/svg+xml' }, customMetadata: { sha256: hash, source: builtin.src } });
  if (!stored) {
    const previous = await env.CMS_MEDIA.head(key);
    if (previous?.customMetadata?.sha256 !== hash || previous?.customMetadata?.source !== builtin.src) throw new HttpError(409, 'En annan SVG-källa finns redan för detta sparförsök.');
  }
  const now = new Date().toISOString();
  const inserted = await env.CMS_DB.prepare("INSERT OR IGNORE INTO cms_managed_svg_operations(id,source_path,base_version,managed_asset_id,svg_sha256,state,created_at,updated_at) VALUES(?,?,?,?,?,'staged',?,?)").bind(operationId, builtin.src, baseVersion, operationId, hash, now, now).run();
  if (!inserted.meta.changes) {
    const concurrent = await env.CMS_DB.prepare('SELECT * FROM cms_managed_svg_operations WHERE id = ?').bind(operationId).first();
    if (!concurrent || concurrent.source_path !== builtin.src || concurrent.base_version !== baseVersion || concurrent.svg_sha256 !== hash) throw new HttpError(409, 'SVG-sparningen kolliderade med ett annat försök.');
    return { svg: sanitized, operation: managedSvgOperationRecord(concurrent) };
  }
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_managed_svg_operations WHERE id = ?').bind(operationId).first();
  return { svg: sanitized, operation: managedSvgOperationRecord(row) };
}

export async function prepareManagedSvg(env, builtin, { operationId, derivativeId }) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  if (!UUID.test(derivativeId ?? '')) throw new HttpError(422, 'PNG-derivatets identitet är ogiltig.');
  const operation = await managedSvgOperationRow(env.CMS_DB, builtin, operationId);
  if (['committed', 'completed'].includes(operation.state)) {
    if (operation.derivative_media_id !== derivativeId) throw new HttpError(409, 'SVG-sparningen är redan kopplad till ett annat PNG-derivat.');
    return { operation: managedSvgOperationRecord(operation) };
  }
  const derivative = await env.CMS_DB.prepare("SELECT * FROM cms_media WHERE id = ? AND mime = 'image/png' AND archived_at IS NULL AND trashed_at IS NULL AND deleting_at IS NULL").bind(derivativeId).first();
  if (!derivative) throw new HttpError(404, 'PNG-derivatet saknas eller kan inte användas.');
  if (operation.state === 'prepared') {
    if (operation.derivative_media_id !== derivativeId) throw new HttpError(409, 'SVG-sparningen är redan förberedd med ett annat PNG-derivat.');
    return { operation: managedSvgOperationRecord(operation) };
  }
  if (operation.state !== 'staged') throw new HttpError(409, 'SVG-sparningen är inte i ett förberedbart läge.');
  const now = new Date().toISOString();
  const result = await env.CMS_DB.prepare("UPDATE cms_managed_svg_operations SET derivative_media_id=?, state='prepared', updated_at=? WHERE id=? AND source_path=? AND state='staged'").bind(derivativeId, now, operationId, builtin.src).run();
  if (!result.meta.changes) throw new HttpError(409, 'SVG-sparningen ändrades samtidigt. Försök igen.');
  return { operation: managedSvgOperationRecord(await managedSvgOperationRow(env.CMS_DB, builtin, operationId)) };
}

export async function managedSvgOperation(env, builtin, operationId) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  return managedSvgOperationRow(env.CMS_DB, builtin, operationId);
}

export async function finalizeManagedSvg(env, builtin, operationId) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  const operation = await managedSvgOperationRow(env.CMS_DB, builtin, operationId);
  const current = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  if (['committed', 'completed'].includes(operation.state)) {
    if (current?.managed_asset_id !== operation.managed_asset_id || current?.version !== operation.base_version + 1) throw new HttpError(409, 'SVG-sparningen matchar inte längre den aktuella källan.');
    return { svg: await managedSvgBytes(env, operation.managed_asset_id), asset: builtinRecord(builtin, current), operation: managedSvgOperationRecord(operation) };
  }
  if (operation.state !== 'prepared' || !operation.derivative_media_id) throw new HttpError(409, 'SVG-sparningen saknar ett färdigt PNG-derivat.');
  if ((current?.version ?? 0) !== operation.base_version) throw new HttpError(409, 'SVG-källan ändrades i en annan flik. Ladda om resursen.', { asset: builtinRecord(builtin, current ?? {}) });
  const nextVersion = operation.base_version + 1;
  const now = new Date().toISOString();
  const canonical = current
    ? env.CMS_DB.prepare('UPDATE cms_builtin_resource_state SET managed_asset_id=?, version=version+1, updated_at=? WHERE source_path=? AND version=?').bind(operation.managed_asset_id, now, builtin.src, operation.base_version)
    : env.CMS_DB.prepare('INSERT OR IGNORE INTO cms_builtin_resource_state(source_path,version,managed_asset_id,updated_at) VALUES(?,1,?,?)').bind(builtin.src, operation.managed_asset_id, now);
  const commit = env.CMS_DB.prepare("UPDATE cms_managed_svg_operations SET state='committed', updated_at=? WHERE id=? AND source_path=? AND state='prepared' AND EXISTS(SELECT 1 FROM cms_builtin_resource_state WHERE source_path=? AND managed_asset_id=? AND version=?)").bind(now, operationId, builtin.src, builtin.src, operation.managed_asset_id, nextVersion);
  const [, committed] = await env.CMS_DB.batch([canonical, commit]);
  if (!committed.meta.changes) {
    const latest = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
    throw new HttpError(409, 'SVG-källan ändrades i en annan flik. Ladda om resursen.', { asset: builtinRecord(builtin, latest ?? {}) });
  }
  const row = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  const committedOperation = await managedSvgOperationRow(env.CMS_DB, builtin, operationId);
  return { svg: await managedSvgBytes(env, operation.managed_asset_id), asset: builtinRecord(builtin, row), operation: managedSvgOperationRecord(committedOperation) };
}

export async function completeManagedSvg(env, builtin, operationId) {
  if (!builtin?.builtin || !builtin.editableSvg || !builtin.editableSrc) throw new HttpError(404, 'Resursen har ingen redigerbar SVG-källa.');
  let operation = await managedSvgOperationRow(env.CMS_DB, builtin, operationId);
  if (operation.state === 'completed') return { operation: managedSvgOperationRecord(operation) };
  if (operation.state !== 'committed') throw new HttpError(409, 'SVG-sparningen kan inte slutföras innan källan är committad.');
  const current = await env.CMS_DB.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  if (current?.managed_asset_id !== operation.managed_asset_id || current?.version !== operation.base_version + 1) throw new HttpError(409, 'SVG-sparningen matchar inte längre den aktuella källan.');
  const result = await env.CMS_DB.prepare("UPDATE cms_managed_svg_operations SET state='completed', updated_at=? WHERE id=? AND source_path=? AND state='committed'").bind(new Date().toISOString(), operationId, builtin.src).run();
  if (!result.meta.changes) throw new HttpError(409, 'SVG-sparningen ändrades samtidigt. Försök igen.');
  operation = await managedSvgOperationRow(env.CMS_DB, builtin, operationId);
  return { operation: managedSvgOperationRecord(operation), asset: builtinRecord(builtin, current) };
}
