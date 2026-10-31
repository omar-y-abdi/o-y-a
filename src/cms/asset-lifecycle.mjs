import { HttpError } from './http.mjs';
import { retainedResourceUsage } from './store.mjs';
import { resourceReferences } from './resources.mjs';
import { record, builtinRecord, UUID } from './assets.mjs';

function assertLifecycleInput(action, baseVersion, baseSiteVersion) {
  if (!['archive', 'restore', 'trash', 'delete'].includes(action)) throw new HttpError(422, 'Resursåtgärden är ogiltig.');
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 0) throw new HttpError(428, 'Hämta resursens aktuella uppgifter innan du ändrar den.');
  if (['trash', 'delete'].includes(action) && (!Number.isSafeInteger(baseSiteVersion) || baseSiteVersion < 0)) throw new HttpError(428, 'Hämta webbplatsens aktuella version innan du gör en destruktiv resursändring.');
}

function currentReferenceCount(project, src) { return resourceReferences(project).get(src) ?? 0; }

async function recoverQueuedDelete(db, queued, current, { id, baseVersion, baseSiteVersion }) {
  let snapshot;
  try { snapshot = JSON.parse(queued.snapshot); } catch { /* The queue remains available for owner repair. */ }
  const extension = queued.object_key.slice(id.length + 1);
  if (!snapshot || snapshot.id !== id || snapshot.object_key !== queued.object_key || queued.object_key !== `${id}.${extension}` || !['png', 'jpg', 'gif', 'webp', 'avif', 'woff2'].includes(extension) || !/^[0-9a-f]{64}$/.test(snapshot.sha256) || !Number.isSafeInteger(snapshot.version) || snapshot.version < 0 || typeof snapshot.trashed_at !== 'string' || !snapshot.trashed_at) throw new HttpError(503, 'Den äldre resursraderingen har ogiltiga uppgifter. Bevara kön och kontrollera databasens backup.');
  if (current && (current.object_key !== queued.object_key || current.sha256 !== snapshot.sha256)) throw new HttpError(409, 'Den äldre resursraderingen matchar inte den nuvarande filen. Inga uppgifter ändrades.');
  if ((current?.version ?? snapshot.version) !== baseVersion) throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.');
  const columns = ['id', 'object_key', 'name', 'mime', 'bytes', 'width', 'height', 'alt', 'sha256', 'created_at', 'published_at', 'archived_at', 'version', 'validation_version', 'trashed_at', 'deleting_at'];
  const values = columns.map(name => name === 'deleting_at' ? null : snapshot[name] ?? null);
  // Move the old durable record back to canonical storage atomically. The exact
  // queue row must still exist, so a delayed retry cannot recreate a file after
  // another request consumed the queue and completed its deletion.
  const [, consumed] = await db.batch([
    db.prepare(`INSERT INTO cms_media(${columns.join(',')}) SELECT ${columns.map(() => '?').join(',')} WHERE NOT EXISTS (SELECT 1 FROM cms_media WHERE id = ?) AND (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_media_delete_queue WHERE id = ? AND object_key = ? AND snapshot = ?)`).bind(...values, id, baseSiteVersion, id, queued.object_key, queued.snapshot),
    db.prepare('DELETE FROM cms_media_delete_queue WHERE id = ? AND object_key = ? AND snapshot = ? AND (SELECT version FROM cms_head WHERE id = 1) = ? AND EXISTS (SELECT 1 FROM cms_media WHERE id = ? AND object_key = ? AND sha256 = ? AND version = ?)').bind(id, queued.object_key, queued.snapshot, baseSiteVersion, id, queued.object_key, snapshot.sha256, baseVersion),
  ]);
  if (!consumed.meta.changes && await db.prepare('SELECT id FROM cms_media_delete_queue WHERE id = ?').bind(id).first()) throw new HttpError(409, 'Resursen eller webbplatsen ändrades medan den äldre raderingen återställdes. Försök igen med aktuella uppgifter.');
  const restored = await db.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  if (restored && (restored.object_key !== queued.object_key || restored.sha256 !== snapshot.sha256)) throw new HttpError(409, 'Resursraderingens identitet ändrades. Inga filer raderades.');
  return restored;
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

export async function assetUsage(env, asset) {
  let src = asset.src;
  if (!asset.builtin) {
    if (!UUID.test(asset.id)) throw new HttpError(404, 'Filen finns inte.');
    const row = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(asset.id).first();
    if (!row) throw new HttpError(404, 'Filen finns inte.');
    src = `/media/${row.object_key}`;
  }
  return { historyReferences: await retainedResourceUsage(env.CMS_DB, src) };
}

export async function transitionAsset(env, { id, action, baseVersion, baseSiteVersion, project }) {
  assertLifecycleInput(action, baseVersion, baseSiteVersion);
  if (!UUID.test(id)) throw new HttpError(404, 'Filen finns inte.');
  let current = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
  // Only an explicit delete can recover a historical delete intent. Reuse the
  // current deletion checks after restoring its metadata, including history.
  const queued = action === 'delete' ? await env.CMS_DB.prepare('SELECT * FROM cms_media_delete_queue WHERE id = ?').bind(id).first() : null;
  if (queued) {
    current = await recoverQueuedDelete(env.CMS_DB, queued, current, { id, baseVersion, baseSiteVersion });
    if (!current) return { deleted: true, id, usage: { currentReferences: 0, historyReferences: 0 } };
  }
  if (!current) throw new HttpError(404, 'Filen finns inte.');
  if (current.deleting_at) {
    if (action !== 'delete') throw new HttpError(409, 'Resursen håller redan på att raderas. Ladda om biblioteket.', { asset: record(current) });
    if (queued && (currentReferenceCount(project, `/media/${current.object_key}`) || await retainedResourceUsage(env.CMS_DB, `/media/${current.object_key}`))) throw new HttpError(409, 'Den äldre resursraderingen används fortfarande i utkast eller historik. Inga filer raderades.');
    return completeReservedDelete(env, current);
  }
  const src = `/media/${current.object_key}`;
  const refs = currentReferenceCount(project, src);
  if (['trash', 'delete'].includes(action) && refs) throw new HttpError(409, `Resursen används fortfarande ${refs} gånger i aktuellt utkast.`);
  if (action === 'delete') {
    if (!current.trashed_at) throw new HttpError(409, 'Flytta resursen till papperskorgen före permanent radering.');
    if (current.version !== baseVersion) throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: record(current) });
    const historical = await retainedResourceUsage(env.CMS_DB, src);
    if (historical) throw new HttpError(409, `Resursen används fortfarande ${historical} gånger i sparad historik.`);
    const token = `${new Date().toISOString()}#${crypto.randomUUID()}`;
    const reserved = await env.CMS_DB.prepare('UPDATE cms_media SET deleting_at = ?, version = version + 1 WHERE id = ? AND version = ? AND trashed_at IS NOT NULL AND deleting_at IS NULL AND (SELECT version FROM cms_head WHERE id = 1) = ? RETURNING *').bind(token, id, baseVersion, baseSiteVersion).first();
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
  const statement = action === 'trash'
    ? env.CMS_DB.prepare('UPDATE cms_media SET archived_at = ?, trashed_at = ?, version = version + 1 WHERE id = ? AND version = ? AND deleting_at IS NULL AND (SELECT version FROM cms_head WHERE id = 1) = ? AND NOT EXISTS (SELECT 1 FROM cms_revision_resource_index WHERE version = (SELECT version FROM cms_head WHERE id = 1) AND src = ?) RETURNING *').bind(values[0], values[1], id, baseVersion, baseSiteVersion, src)
    : env.CMS_DB.prepare('UPDATE cms_media SET archived_at = ?, trashed_at = ?, version = version + 1 WHERE id = ? AND version = ? AND deleting_at IS NULL RETURNING *').bind(values[0], values[1], id, baseVersion);
  const updated = await statement.first();
  if (!updated) {
    const latest = await env.CMS_DB.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
    if (!latest) throw new HttpError(404, 'Filen finns inte.');
    // A18: the UPDATE itself refuses a file the published head uses; this read only names the reason.
    if (action === 'trash' && await env.CMS_DB.prepare('SELECT 1 AS used FROM cms_revision_resource_index WHERE version = (SELECT version FROM cms_head WHERE id = 1) AND src = ?').bind(src).first()) throw new HttpError(409, 'Filen används på den publicerade webbplatsen. Spara utkastet utan filen först.', { asset: record(latest) });
    throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: record(latest) });
  }
  return { asset: record(updated), usage: { currentReferences: refs, historyReferences: await retainedResourceUsage(env.CMS_DB, src) } };
}

export async function transitionBuiltinAsset(db, builtin, { action, baseVersion, baseSiteVersion, project }) {
  assertLifecycleInput(action, baseVersion, baseSiteVersion);
  const current = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  if (current?.deleted_at) throw new HttpError(409, 'Permanent raderade inbyggda resurser kan inte återställas via livscykel-API:t.');
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
  const destructive = ['trash', 'delete'].includes(action);
  const result = !current
    ? destructive
      ? await db.prepare('INSERT OR IGNORE INTO cms_builtin_resource_state(source_path,version,name,alt,archived_at,trashed_at,deleted_at,updated_at) SELECT ?,1,NULL,NULL,?,?,?,? WHERE (SELECT version FROM cms_head WHERE id=1)=?').bind(builtin.src, archived, trashed, deleted, now, baseSiteVersion).run()
      : await db.prepare('INSERT OR IGNORE INTO cms_builtin_resource_state(source_path,version,name,alt,archived_at,trashed_at,deleted_at,updated_at) VALUES(?,1,NULL,NULL,?,?,?,?)').bind(builtin.src, archived, trashed, deleted, now).run()
    : destructive
      ? await db.prepare('UPDATE cms_builtin_resource_state SET archived_at=?, trashed_at=?, deleted_at=?, version=version+1, updated_at=? WHERE source_path=? AND version=? AND (SELECT version FROM cms_head WHERE id=1)=?').bind(archived, trashed, deleted, now, builtin.src, baseVersion, baseSiteVersion).run()
      : await db.prepare('UPDATE cms_builtin_resource_state SET archived_at=?, trashed_at=?, deleted_at=?, version=version+1, updated_at=? WHERE source_path=? AND version=?').bind(archived, trashed, deleted, now, builtin.src, baseVersion).run();
  if (!result.meta.changes) {
    const latest = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
    throw new HttpError(409, 'Resursen ändrades i en annan flik. Ladda om biblioteket.', { asset: builtinRecord(builtin, latest ?? {}) });
  }
  const row = await db.prepare('SELECT * FROM cms_builtin_resource_state WHERE source_path = ?').bind(builtin.src).first();
  return action === 'delete' ? { deleted: true, id: builtin.id } : { asset: builtinRecord(builtin, row), usage: { currentReferences: refs, historyReferences: await retainedResourceUsage(db, builtin.src) } };
}
