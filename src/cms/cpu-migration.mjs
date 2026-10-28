import { HttpError } from './http.mjs';

// These bounds reserve account capacity; the owner CLI additionally checks the
// current account-wide read/write receipts before staging and committing.
export const CPU_MIGRATION_MAX_READS = 250000;
export const CPU_MIGRATION_MAX_WRITES = 45000;
export const CPU_CACHE_IDENTITY = '(SELECT json_array(s.version,s.build_key,s.project_hash,s.migration_id) FROM cms_studio_heads s JOIN cms_head h ON h.version=s.version WHERE h.id=1)';
const fields = 'id,actor,origin,version,source_hash,build_key,project_hash,artifact_hash,state,created_at,committed_at,planned_reads,planned_writes';
const claimed = "EXISTS(SELECT 1 FROM cms_cpu_migrations o WHERE o.id=? AND o.state='committing')";
const receipt = row => ({ operationId: row.id, version: row.version, sourceHash: row.source_hash, buildKey: row.build_key, projectHash: row.project_hash, artifactHash: row.artifact_hash, origin: row.origin, state: row.state, createdAt: row.created_at, committedAt: row.committed_at, plannedReads: row.planned_reads, plannedWrites: row.planned_writes });
const validId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);

export async function cpuMigrationStatus(db, { buildKey, origin, actor, operationId }) {
  if (operationId !== undefined) {
    if (!validId(operationId)) throw new HttpError(422, 'Migreringens identitet är ogiltig.');
    const row = await db.prepare(`SELECT ${fields} FROM cms_cpu_migrations WHERE id=? AND actor=?`).bind(operationId, actor).first();
    if (!row) throw new HttpError(404, 'Migreringen finns inte för den här ägaren.');
    return receipt(row);
  }
  const row = await db.prepare(`SELECT h.version,${CPU_CACHE_IDENTITY} AS cache,date('now') AS day,(SELECT count(*) FROM cms_studio_text)+(SELECT count(*) FROM cms_preview_facts)+(SELECT count(*) FROM cms_studio_heads) AS cache_rows,EXISTS(SELECT 1 FROM cms_revision_resource_indexed WHERE version=h.version) AS indexed,(SELECT count(*) FROM cms_revision_resource_index WHERE version=h.version) AS reference_rows FROM cms_head h WHERE h.id=1`).first();
  return { version: row?.version ?? 0, buildKey, origin, actor, cache: row?.cache ? JSON.parse(row.cache) : null, day: row?.day, cacheRows: row?.cache_rows ?? 0, indexed: Boolean(row?.indexed), referenceRows: row?.reference_rows ?? 0 };
}

// Normal CMS authority can only select a sealed operation. The source and all
// content are prepared/read back through separate D1-owner authority; there is
// deliberately no HTTP upload, arbitrary-SQL or caller-provided project path.
export async function applyCpuMigration(db, body, { buildKey, origin, actor }) {
  if (!body || Object.keys(body).some(key => !['operationId','artifactHash','action'].includes(key)) || !validId(body.operationId) || typeof body.artifactHash !== 'string' || !/^[0-9a-f]{64}$/.test(body.artifactHash) || !['commit','abort','rollback'].includes(body.action)) throw new HttpError(422, 'Migreringen saknar en giltig åtgärd, identitet eller kontrollsumma.');
  const id = body.operationId;
  const row = await db.prepare(`SELECT ${fields} FROM cms_cpu_migrations WHERE id=? AND actor=? AND artifact_hash=?`).bind(id, actor, body.artifactHash).first();
  if (!row) throw new HttpError(409, 'Migreringens låsta identitet matchar inte.');
  let databaseResults;
  if (body.action === 'commit') {
    if (row.state === 'committed') return { ...receipt(row), replayed: true };
    if (row.state !== 'ready') throw new HttpError(409, 'Migreringen är inte förberedd och verifierad.');
    const claim = db.prepare(`UPDATE cms_cpu_migrations AS o SET state='committing' WHERE id=? AND actor=? AND artifact_hash=? AND state='ready' AND build_key=? AND origin=? AND budget_day=date('now') AND created_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-24 hours') AND planned_reads<=? AND planned_writes<=? AND version=(SELECT version FROM cms_head WHERE id=1) AND source_project=(SELECT project FROM cms_revisions WHERE version=o.version) AND expected_cache IS ${CPU_CACHE_IDENTITY} AND text_parts=(SELECT count(*) FROM cms_cpu_migration_rows WHERE operation_id=o.id AND kind='text') AND text_parts-1=(SELECT max(part) FROM cms_cpu_migration_rows WHERE operation_id=o.id AND kind='text') AND proof_parts=(SELECT count(*) FROM cms_cpu_migration_rows WHERE operation_id=o.id AND kind='proof') AND reference_parts=(SELECT count(*) FROM cms_cpu_migration_rows WHERE operation_id=o.id AND kind='references') AND stage_bytes=(SELECT sum(length(CAST(body AS BLOB))) FROM cms_cpu_migration_rows WHERE operation_id=o.id)`).bind(id, actor, body.artifactHash, buildKey, origin, CPU_MIGRATION_MAX_READS, CPU_MIGRATION_MAX_WRITES);
    databaseResults = await db.batch([
      claim,
      db.prepare(`DELETE FROM cms_studio_heads WHERE ${claimed}`).bind(id),
      db.prepare("INSERT INTO cms_studio_heads(version,build_key,project_hash,resources,text_parts,migration_id) SELECT version,build_key,project_hash,resources,text_parts,id FROM cms_cpu_migrations WHERE id=? AND state='committing'").bind(id),
      db.prepare("INSERT INTO cms_studio_text(version,part,body) SELECT o.version,r.part,r.body FROM cms_cpu_migration_rows r JOIN cms_cpu_migrations o ON o.id=r.operation_id WHERE o.id=? AND o.state='committing' AND r.kind='text'").bind(id),
      db.prepare("INSERT INTO cms_preview_facts(version,target,content_hash,origin,facts) SELECT o.version,json_extract(r.body,'$.target'),json_extract(r.body,'$.hash'),json_extract(r.body,'$.origin'),json_extract(r.body,'$.facts') FROM cms_cpu_migration_rows r JOIN cms_cpu_migrations o ON o.id=r.operation_id WHERE o.id=? AND o.state='committing' AND r.kind='proof'").bind(id),
      // A missing marker can accompany an interrupted older index fill. Replace
      // only that incomplete index with the exact RAW-revision references.
      db.prepare("DELETE FROM cms_revision_resource_index WHERE version=(SELECT version FROM cms_cpu_migrations WHERE id=? AND state='committing') AND NOT EXISTS(SELECT 1 FROM cms_revision_resource_indexed i WHERE i.version=cms_revision_resource_index.version)").bind(id),
      db.prepare("INSERT INTO cms_revision_resource_index(version,src,reference_count) SELECT o.version,json_extract(j.value,'$[0]'),json_extract(j.value,'$[1]') FROM cms_cpu_migrations o JOIN cms_cpu_migration_rows r ON r.operation_id=o.id,json_each(r.body) j WHERE o.id=? AND o.state='committing' AND r.kind='references' AND NOT EXISTS(SELECT 1 FROM cms_revision_resource_indexed WHERE version=o.version)").bind(id),
      db.prepare("INSERT INTO cms_revision_resource_indexed(version) SELECT version FROM cms_cpu_migrations o WHERE id=? AND state='committing' AND NOT EXISTS(SELECT 1 FROM cms_revision_resource_indexed WHERE version=o.version)").bind(id),
      db.prepare(`DELETE FROM cms_cpu_migration_rows WHERE operation_id=? AND ${claimed}`).bind(id, id),
      db.prepare("UPDATE cms_cpu_migrations SET state='committed',source_project=NULL,committed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND state='committing'").bind(id),
    ]);
  } else if (body.action === 'abort') {
    if (row.state === 'aborted') return { ...receipt(row), replayed: true };
    if (!['preparing','ready'].includes(row.state)) throw new HttpError(409, 'Den här migreringen kan inte avbrytas.');
    databaseResults = await db.batch([
      db.prepare("UPDATE cms_cpu_migrations SET state='aborted',source_project=NULL WHERE id=? AND state IN ('preparing','ready')").bind(id),
      db.prepare("DELETE FROM cms_cpu_migration_rows WHERE operation_id=? AND EXISTS(SELECT 1 FROM cms_cpu_migrations WHERE id=? AND state='aborted')").bind(id, id),
    ]);
  } else {
    if (row.state === 'rolled_back') return { ...receipt(row), replayed: true };
    if (row.state !== 'committed') throw new HttpError(409, 'Bara en genomförd migrering kan återställas.');
    databaseResults = await db.batch([
      db.prepare("UPDATE cms_cpu_migrations SET state='rolling_back' WHERE id=? AND state='committed' AND EXISTS(SELECT 1 FROM cms_studio_heads s JOIN cms_head h ON h.version=s.version WHERE h.id=1 AND s.migration_id=?)").bind(id, id),
      db.prepare("DELETE FROM cms_studio_heads WHERE migration_id=? AND EXISTS(SELECT 1 FROM cms_cpu_migrations WHERE id=? AND state='rolling_back')").bind(id, id),
      db.prepare("UPDATE cms_cpu_migrations SET state='rolled_back' WHERE id=? AND state='rolling_back'").bind(id),
    ]);
  }
  const result = await cpuMigrationStatus(db, { actor, operationId: id });
  const expected = { commit: 'committed', abort: 'aborted', rollback: 'rolled_back' }[body.action];
  if (result.state !== expected) throw new HttpError(409, 'Huvudrevisionen, bygget, budgetdagen eller studions kopia ändrades. Migreringen skrev ingenting.');
  const completeUsage = databaseResults.every(item => Number.isSafeInteger(item.meta?.rows_read) && Number.isSafeInteger(item.meta?.rows_written));
  return { ...result, replayed: databaseResults[0].meta.changes === 0, databaseUsage: completeUsage ? databaseResults.reduce((total, item) => ({ reads: total.reads + item.meta.rows_read, writes: total.writes + item.meta.rows_written }), { reads: 0, writes: 0 }) : null };
}
