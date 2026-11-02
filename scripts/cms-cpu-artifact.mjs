import { createHash, randomUUID } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { validateProjectWithReferences } from '../src/cms/project.mjs';
import { restorableProjects } from '../src/cms/compatibility.mjs';
import { resourceReferences, validateResources } from '../src/cms/resources.mjs';
import { previewFacts, frameHash, pageHash } from '../src/cms/preview-store.mjs';
import { studioBatches, textParts } from '../src/cms/studio-store.mjs';
import { storedProjectView } from '../src/cms/stored-view.mjs';
import { CPU_CACHE_IDENTITY, CPU_MIGRATION_MAX_READS, CPU_MIGRATION_MAX_WRITES, cpuMigrationStatus } from '../src/cms/cpu-migration.mjs';

const PROJECT_BYTES = 8 * 1024 * 1024;
const SOURCE_BYTES = 1500000;
const SOURCE_PART = 64000;
const hash = value => createHash('sha256').update(value).digest('hex');
const bytes = value => Buffer.byteLength(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const sumBytes = rows => rows.reduce((total, row) => total + bytes(row.body), 0);

// All large decoding, conversion and validation happen on the owner's machine.
// The canonical text is the existing state representation, not the validator's
// normalized result: metadata, unresolved choices and retained private fields
// stay exact. The ordinary reader's obsolete editor-JSON projection still applies.
export async function prepareCpuArtifact(source, status, { seed, initial }, operationId = randomUUID()) {
  source = Buffer.from(source);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(operationId)) throw new Error('Migreringens identitet är ogiltig.');
  if (!source.length || source.length > SOURCE_BYTES) throw new Error('Revisionens komprimerade storlek ligger utanför publiceringsgränsen.');
  if (!integer(status.version) || status.version < 1 || !/^[0-9a-f]{64}$/.test(seed.studioKey ?? '') || status.buildKey !== seed.studioKey || typeof status.actor !== 'string' || !status.actor || new URL(status.origin).origin !== status.origin || !/^\d{4}-\d{2}-\d{2}$/.test(status.day ?? '') || !integer(status.cacheRows) || !integer(status.referenceRows) || typeof status.indexed !== 'boolean') throw new Error('Migreringen behöver samma huvudrevision, origin och byggidentitet som den körande studion.');
  const raw = JSON.parse(gunzipSync(source, { maxOutputLength: PROJECT_BYTES }).toString('utf8'));
  const canonical = normalizeStoredProject(storedProjectView(structuredClone(raw)), seed, initial);
  const serialized = JSON.stringify(canonical);
  if (bytes(serialized) > PROJECT_BYTES) throw new Error('Studions representation överskrider publiceringsgränsen; utred innehållet före migrering.');
  let checked;
  for (const candidate of restorableProjects(canonical)) checked = validateProjectWithReferences(structuredClone(candidate), seed, undefined, { origins: [status.origin] });
  if (!checked) throw new Error('Revisionens sidramskonflikter saknar ett validerbart alternativ.');
  const texts = textParts(serialized).map((body, part) => ({ kind: 'text', part, body }));
  const proofs = [];
  if (!canonical.frameConflicts?.length) {
    const frame = await frameHash(canonical, status.origin);
    const identities = new Map([['@frame', frame]]);
    for (const page of canonical.pages) identities.set(`page/${page.id}`, await pageHash(canonical, page, frame, status.origin));
    let total = 0;
    for (const proof of await previewFacts(checked.project, checked.frame, status.origin)) {
      const body = JSON.stringify(proof), size = bytes(body);
      // Optional proofs may miss; neither sanitization nor supported content
      // limits are reduced to fit the accelerator.
      if (proof.hash !== identities.get(proof.target) || size > 1000000 || total + size > PROJECT_BYTES) continue;
      proofs.push({ kind: 'proof', part: proofs.length, body }); total += size;
    }
  }
  const references = [...resourceReferences(raw, status.origin)].sort(([a], [b]) => a.localeCompare(b));
  const referenceRows = studioBatches(references).map((body, part) => ({ kind: 'references', part, body }));
  const rows = [...texts, ...proofs, ...referenceRows];
  if (rows.some(row => bytes(row.body) > 1000000)) throw new Error('En migreringspost överskrider D1-bindningens gräns.');
  // Include table and index writes, cascading old-cache deletion, the journal,
  // staging/readback/cleanup and a conservative fixed transaction allowance.
  const commitWrites = 64 + rows.length * 2 + (texts.length + proofs.length) * 2 + status.cacheRows * 4 + (status.indexed ? 0 : (references.length + status.referenceRows) * 4 + 2);
  const commitReads = 128 + rows.length * 12 + status.cacheRows * 4 + (references.length + status.referenceRows) * 4;
  const plannedWrites = commitWrites + 64 + rows.length * 2;
  const plannedReads = commitReads + 128 + rows.length * 12 + (references.length + status.referenceRows) * 4 + Math.ceil(source.length / SOURCE_PART) * 4;
  if (plannedWrites > CPU_MIGRATION_MAX_WRITES || plannedReads > CPU_MIGRATION_MAX_READS) throw new Error('Migreringen överskrider den avgränsade radbudgeten; dela inte upp den atomära publiceringen utan ny granskning.');
  const artifact = { format: 1, operationId, source: source.toString('base64'), sourceHash: hash(source), status, projectHash: hash(serialized), resources: validateResources(canonical.resources), textParts: texts.length, proofParts: proofs.length, referenceParts: referenceRows.length, referenceCount: references.length, stageBytes: sumBytes(rows), plannedReads, plannedWrites, commitReads, commitWrites, rows };
  return { ...artifact, artifactHash: hash(JSON.stringify(artifact)) };
}

export async function verifyCpuArtifact(artifact, context) {
  if (artifact?.format !== 1 || typeof artifact.source !== 'string' || !/^[0-9a-f-]{36}$/.test(artifact.operationId ?? '')) throw new Error('Migreringsfilens format är ogiltigt.');
  const expected = await prepareCpuArtifact(Buffer.from(artifact.source, 'base64'), artifact.status, context, artifact.operationId);
  if (!isDeepStrictEqual(expected, artifact)) throw new Error('Migreringsfilen avviker från den låsta källan och det aktuella bygget. Förbered en ny fil.');
  return expected;
}

export function checkCpuBudget(artifact, { readToday, writtenToday, day = new Date().toISOString().slice(0, 10) }) {
  if (!integer(readToday) || !integer(writtenToday) || day !== artifact.status.day) throw new Error('Ange dagens faktiska D1-läsningar och skrivningar för hela kontot; en ny UTC-dag behöver en ny plan.');
  if (!integer(artifact.plannedReads) || !integer(artifact.plannedWrites) || artifact.plannedReads > CPU_MIGRATION_MAX_READS || artifact.plannedWrites > CPU_MIGRATION_MAX_WRITES || readToday + artifact.plannedReads > 4500000 || writtenToday + artifact.plannedWrites > 90000) throw new Error('D1-kontots återstående radbudget räcker inte för den granskade migreringen.');
}

export async function readCpuSource(db, version, operationId) {
  if (!integer(version) || version < 1) throw new Error('Revisionens identitet är ogiltig.');
  const table = operationId === undefined ? 'cms_revisions' : 'cms_cpu_migrations';
  const column = operationId === undefined ? 'project' : 'source_project';
  const condition = operationId === undefined ? 'version=?' : 'version=? AND id=?';
  const values = operationId === undefined ? [version] : [version, operationId];
  const size = (await db.prepare(`SELECT length(${column}) AS size FROM ${table} WHERE ${condition}`).bind(...values).first())?.size;
  if (!integer(size) || !size || size > SOURCE_BYTES) throw new Error('Den låsta källrevisionen saknas eller är för stor.');
  const parts = [];
  for (let offset = 1; offset <= size; offset += SOURCE_PART) {
    const row = await db.prepare(`SELECT hex(substr(${column},?,?)) AS part FROM ${table} WHERE ${condition}`).bind(offset, SOURCE_PART, ...values).first();
    parts.push(Buffer.from(row?.part ?? '', 'hex'));
  }
  const source = Buffer.concat(parts);
  if (source.length !== size) throw new Error('Den låsta källrevisionen kunde inte läsas fullständigt.');
  return source;
}

export async function stageCpuArtifact(db, artifact, context, budget) {
  await verifyCpuArtifact(artifact, context);
  checkCpuBudget(artifact, budget);
  const a = artifact, s = a.status, expectedCache = s.cache === null ? null : JSON.stringify(s.cache);
  const current = await cpuMigrationStatus(db, { buildKey: context.seed.studioKey, origin: s.origin, actor: s.actor });
  if (!isDeepStrictEqual(current, s)) throw new Error('Huvudrevisionens identitet, index, radantal eller budgetdag ändrades. Förbered en ny plan.');
  // Never rebind a reused operation ID. The source BLOB is copied inside D1;
  // no multi-megabyte BLOB binding crosses a Worker request.
  await db.prepare(`INSERT INTO cms_cpu_migrations(id,actor,origin,version,source_hash,source_project,build_key,expected_cache,project_hash,resources,artifact_hash,text_parts,proof_parts,reference_parts,reference_count,stage_bytes,planned_reads,planned_writes,budget_day) SELECT ?,?,?,r.version,?,r.project,?,?,?,?,?,?,?,?,?,?,?,?,? FROM cms_revisions r JOIN cms_head h ON h.version=r.version WHERE h.id=1 AND r.version=? AND ${CPU_CACHE_IDENTITY} IS ? ON CONFLICT(id) DO NOTHING`).bind(a.operationId, s.actor, s.origin, a.sourceHash, s.buildKey, expectedCache, a.projectHash, JSON.stringify(a.resources), a.artifactHash, a.textParts, a.proofParts, a.referenceParts, a.referenceCount, a.stageBytes, a.plannedReads, a.plannedWrites, s.day, s.version, expectedCache).run();
  const operation = await db.prepare('SELECT artifact_hash,state FROM cms_cpu_migrations WHERE id=?').bind(a.operationId).first();
  if (!operation || operation.artifact_hash !== a.artifactHash || !['preparing','ready'].includes(operation.state)) throw new Error('Migreringens identitet, huvudrevision eller tidigare studiokopia ändrades. Kontrollera kvittot innan du försöker igen.');
  if (hash(await readCpuSource(db, s.version, a.operationId)) !== a.sourceHash) throw new Error('D1-kopian av källrevisionen matchar inte migreringsfilen.');
  for (const row of a.rows) {
    await db.prepare("INSERT INTO cms_cpu_migration_rows(operation_id,kind,part,body) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM cms_cpu_migrations WHERE id=? AND artifact_hash=? AND state='preparing') ON CONFLICT(operation_id,kind,part) DO NOTHING").bind(a.operationId, row.kind, row.part, row.body, a.operationId, a.artifactHash).run();
    const stored = await db.prepare('SELECT body FROM cms_cpu_migration_rows WHERE operation_id=? AND kind=? AND part=?').bind(a.operationId, row.kind, row.part).first();
    if (stored?.body !== row.body) throw new Error('En låst migreringspost saknas eller innehåller andra byte. Ingenting publicerades.');
  }
  const inventory = await db.prepare('SELECT count(*) AS rows,sum(length(CAST(body AS BLOB))) AS bytes FROM cms_cpu_migration_rows WHERE operation_id=?').bind(a.operationId).first();
  if (inventory.rows !== a.rows.length || inventory.bytes !== a.stageBytes) throw new Error('Migreringens poster är inte exakt den granskade filen.');
  await db.prepare("UPDATE cms_cpu_migrations SET state='ready' WHERE id=? AND artifact_hash=? AND state='preparing' AND budget_day=date('now') AND created_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-24 hours')").bind(a.operationId, a.artifactHash).run();
  if ((await db.prepare('SELECT state FROM cms_cpu_migrations WHERE id=?').bind(a.operationId).first())?.state !== 'ready') throw new Error('Migreringens dag eller tillstånd ändrades innan verifieringen blev klar.');
  return { operationId: a.operationId, artifactHash: a.artifactHash, state: 'ready', plannedReads: a.plannedReads, plannedWrites: a.plannedWrites };
}
