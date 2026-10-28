import { parseArgs } from 'node:util';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { getPlatformProxy, unstable_readConfig } from 'wrangler';
import { studioBuildKey } from './build-cms.mjs';
import { prepareCpuArtifact, verifyCpuArtifact, readCpuSource, stageCpuArtifact, checkCpuBudget } from './cms-cpu-artifact.mjs';
import { SITE_ORIGIN } from '../src/cms/routes.mjs';

export function cpuOrigin(value, remote) {
  const origin = new URL(value);
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || (remote ? origin.origin !== SITE_ORIGIN : !['http:','https:'].includes(origin.protocol) || !['127.0.0.1','localhost'].includes(origin.hostname))) throw new Error('Välj produktionens exakta origin eller den uttryckliga lokala kopian.');
  return origin.origin;
}

// Public Wrangler API; its own supported authentication supplies the D1 owner
// capability. The isolated config deliberately excludes every other binding,
// asset path, variable and local secrets file. No Wrangler credentials are read.
export async function withCpuDatabase({ config = 'wrangler.jsonc', remote = false, persistTo }, action) {
  if (!remote && !persistTo || remote && persistTo) throw new Error('Lokal körning kräver --persist-to; fjärrkörning får inte använda den.');
  const source = unstable_readConfig({ config: resolve(config) });
  const matches = source.d1_databases.filter(item => item.binding === 'CMS_DB');
  if (matches.length !== 1 || !/^[0-9a-f-]{36}$/.test(matches[0].database_id ?? '') || !matches[0].database_name) throw new Error('Konfigurationen behöver exakt en CMS_DB med giltig D1-identitet.');
  const binding = matches[0], directory = await mkdtemp(join(tmpdir(), 'cms-cpu-d1-'));
  let proxy;
  try {
    const configPath = join(directory, 'wrangler.json');
    await writeFile(configPath, JSON.stringify({ name: 'cms-cpu-migration-tool', compatibility_date: source.compatibility_date, ...(source.account_id ? { account_id: source.account_id } : {}), d1_databases: [{ binding: 'CMS_DB', database_id: binding.database_id, database_name: binding.database_name, remote }] }), { mode: 0o600 });
    proxy = await getPlatformProxy({ configPath, envFiles: [], persist: remote ? false : { path: resolve(persistTo) }, remoteBindings: remote });
    return await action(proxy.env.CMS_DB);
  } finally {
    try { await proxy?.dispose(); }
    finally { await rm(directory, { recursive: true, force: true }); }
  }
}

// Retain actual query receipts. A missing/ambiguous write receipt stops further
// work; the owner must reconcile operation status and refresh account usage.
function meteredDatabase(db, budget) {
  const usage = { reads: 0, writes: 0 };
  const account = results => {
    for (const result of results) {
      if (!Number.isSafeInteger(result.meta?.rows_read) || !Number.isSafeInteger(result.meta?.rows_written)) throw new Error('D1 saknar radkvittot. Kontrollera migreringsstatus och kontots förbrukning före nästa försök.');
      usage.reads += result.meta.rows_read; usage.writes += result.meta.rows_written;
    }
    if (budget.readToday + usage.reads > 4500000 || budget.writtenToday + usage.writes > 90000) throw new Error('D1-kvittot överskrider den reserverade kontobudgeten. Stoppa och kontrollera status.');
    return results;
  };
  return { usage, prepare(sql) {
    let values = [];
    const query = async () => account([await db.prepare(sql).bind(...values).all()])[0];
    return { bind(...args) { values = args; return this; }, all: query, run: query, async first() { return (await query()).results[0] ?? null; } };
  } };
}

const summary = artifact => ({ operationId: artifact.operationId, artifactHash: artifact.artifactHash, version: artifact.status.version, buildKey: artifact.status.buildKey, sourceHash: artifact.sourceHash, projectHash: artifact.projectHash, origin: artifact.status.origin, textParts: artifact.textParts, proofParts: artifact.proofParts, referenceCount: artifact.referenceCount, plannedReads: artifact.plannedReads, plannedWrites: artifact.plannedWrites, commitReads: artifact.commitReads, commitWrites: artifact.commitWrites, budgetDay: artifact.status.day });
function reportWrite(result, ownerQueries, budget) {
  console.log(JSON.stringify({ ...result, ownerQueries }, null, 2));
  if (result.state && !result.replayed && !result.databaseUsage) throw new Error('Migreringen har ett svar men saknar D1-radkvitto; kontrollera status och kontots förbrukning.');
  if (result.databaseUsage && (budget.readToday + ownerQueries.reads + result.databaseUsage.reads > 4500000 || budget.writtenToday + ownerQueries.writes + result.databaseUsage.writes > 90000)) throw new Error('Migreringen svarade men det observerade D1-kvittot överskrider kontoreserven. Kontrollera status och kontots förbrukning före fortsatt arbete.');
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: {
    prepare: { type: 'boolean' }, apply: { type: 'boolean' }, status: { type: 'boolean' }, abort: { type: 'boolean' }, rollback: { type: 'boolean' }, cleanup: { type: 'boolean' }, remote: { type: 'boolean', default: false },
    origin: { type: 'string' }, receipt: { type: 'string' }, config: { type: 'string', default: 'wrangler.jsonc' }, 'persist-to': { type: 'string' }, 'read-today': { type: 'string' }, 'written-today': { type: 'string' }, help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log('node scripts/cms-migrate-cpu.mjs --prepare|--apply|--status|--abort|--rollback|--cleanup --origin=URL [--receipt=PRIVATE_FILE] [--remote | --persist-to=COPY] [--config=PATH] [--read-today=N --written-today=N]');
    console.log('Prepare reads only. Apply stages verified content through D1-owner authority and commits through the authenticated Worker. No public/history rewrite. Keep the receipt private; never include cookies in arguments.');
    return;
  }
  const actions = ['prepare','apply','status','abort','rollback','cleanup'].filter(name => values[name]);
  if (actions.length !== 1 || !values.origin || actions[0] !== 'cleanup' && actions[0] !== 'status' && !values.receipt) throw new Error('Välj exakt en åtgärd, uttrycklig --origin och migreringens privata --receipt.');
  const action = actions[0], origin = cpuOrigin(values.origin, values.remote);
  const cookie = process.env.CMS_MIGRATION_COOKIE;
  if (!cookie) throw new Error('CMS_MIGRATION_COOKIE behövs för studions vanliga Access-kontroll.');
  const http = async (body, operationId) => {
    const url = new URL('/admin/api/cpu-migration', origin);
    if (operationId) url.searchParams.set('operationId', operationId);
    const response = await fetch(url, { method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Cookie: cookie, ...(body ? { Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error ?? `Migreringen avvisades (${response.status}).`), { status: response.status });
    return result;
  };
  const artifact = values.receipt && action !== 'prepare' ? JSON.parse(await readFile(values.receipt, 'utf8')) : null;
  if (artifact && artifact.status.origin !== origin) throw new Error('Migreringsfilen gäller en annan origin.');
  if (action === 'status') { console.log(JSON.stringify(await http(undefined, artifact?.operationId), null, 2)); return; }
  const budget = { readToday: Number(values['read-today']), writtenToday: Number(values['written-today']) };
  if (action !== 'prepare' && (!Number.isSafeInteger(budget.readToday) || budget.readToday < 0 || !Number.isSafeInteger(budget.writtenToday) || budget.writtenToday < 0)) throw new Error('Skrivande åtgärder kräver dagens kontoomfattande --read-today och --written-today.');
  const post = (item, operation) => http({ operationId: item.operationId, artifactHash: item.artifactHash, action: operation });
  if (action === 'abort' || action === 'rollback') {
    const operation = await http(undefined, artifact.operationId);
    if (operation.artifactHash !== artifact.artifactHash) throw new Error('Migreringsfilen matchar inte det låsta kvittot.');
    checkCpuBudget({ ...operation, status: { day: new Date().toISOString().slice(0, 10) } }, budget);
    reportWrite(await post(artifact, action), { reads: 0, writes: 0 }, budget); return;
  }
  const options = { config: values.config, remote: values.remote, persistTo: values['persist-to'] };
  if (action === 'cleanup') {
    const reserve = { status: { day: new Date().toISOString().slice(0, 10) }, plannedReads: 250000, plannedWrites: 45000 };
    checkCpuBudget(reserve, budget);
    const current = await http();
    await withCpuDatabase(options, async source => {
      const db = meteredDatabase(source, budget);
      // At most one abandoned operation per invocation. Receipts stay; heavy
      // staged content is discarded. Repeating cannot skip an unfinished row.
      const operation = await db.prepare("SELECT id,artifact_hash FROM cms_cpu_migrations WHERE actor=? AND state='preparing' AND created_at<strftime('%Y-%m-%dT%H:%M:%fZ','now','-24 hours') ORDER BY created_at,id LIMIT 1").bind(current.actor).first() ?? await db.prepare("SELECT id,artifact_hash FROM cms_cpu_migrations WHERE actor=? AND state='ready' AND created_at<strftime('%Y-%m-%dT%H:%M:%fZ','now','-24 hours') ORDER BY created_at,id LIMIT 1").bind(current.actor).first();
      const result = operation ? await post({ operationId: operation.id, artifactHash: operation.artifact_hash }, 'abort') : { cleaned: 0 };
      reportWrite(result, db.usage, budget);
    });
    return;
  }
  const { seed, initial } = await import('../.generated/cms-seed.mjs');
  if (await studioBuildKey(seed) !== seed.studioKey) throw new Error('Byggkoden och den genererade identiteten skiljer sig. Bygg och förbered med exakt granskat bygge.');
  const context = { seed, initial };
  if (action === 'prepare') {
    const status = await http();
    const prepared = await withCpuDatabase(options, async db => prepareCpuArtifact(await readCpuSource(db, status.version), status, context));
    await writeFile(values.receipt, JSON.stringify(prepared), { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ dryRun: true, ...summary(prepared) }, null, 2)); return;
  }
  // An exact already-committed retry remains useful after another Save or
  // deployment. It never stages/reapplies old content or requires old code.
  let previous;
  try { previous = await http(undefined, artifact.operationId); }
  catch (error) { if (error.status !== 404) throw error; }
  if (previous?.state === 'committed') { console.log(JSON.stringify(await post(artifact, 'commit'), null, 2)); return; }
  await verifyCpuArtifact(artifact, context);
  checkCpuBudget(artifact, budget);
  const current = await http();
  if (current.buildKey !== seed.studioKey || current.origin !== artifact.status.origin || current.actor !== artifact.status.actor || current.version !== artifact.status.version) throw new Error('Den körande studion matchar inte migreringsfilen.');
  await withCpuDatabase(options, async source => {
    const db = meteredDatabase(source, budget);
    await stageCpuArtifact(db, artifact, context, budget);
    checkCpuBudget({ ...artifact, plannedReads: artifact.commitReads, plannedWrites: artifact.commitWrites }, { readToday: budget.readToday + db.usage.reads, writtenToday: budget.writtenToday + db.usage.writes });
    const result = await post(artifact, 'commit');
    reportWrite(result, db.usage, budget);
  });
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await main().catch(error => { console.error(`cms-migrate-cpu: ${error.message}`); process.exitCode = 1; });
