import { parseArgs } from 'node:util';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { platform, arch } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { nodeWorker, nodeCms } from '../tests/helpers/cms-node.mjs';
import { cpuMigrationStatus, applyCpuMigration } from '../src/cms/cpu-migration.mjs';
import { prepareCpuArtifact, readCpuSource, stageCpuArtifact } from './cms-cpu-artifact.mjs';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { storedProjectView } from '../src/cms/stored-view.mjs';
import { previewPayload } from '../src/cms/preview-project.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
import { studioBuildKey } from './build-cms.mjs';

const { values } = parseArgs({ options: {
  cold: { type: 'string', default: '20' }, warm: { type: 'string', default: '50' }, warmup: { type: 'string', default: '3' }, output: { type: 'string', default: 'output/cpu/handlers.json' },
  workload: { type: 'string' }, list: { type: 'boolean' },
} });
// Factories defer all fixture access: --list neither builds nor opens storage.
const workloads = {
  'state-before-migration': () => ({ path: '/admin/api/state', tables: ordinary }),
  'state-after-migration': () => ({ path: '/admin/api/state', tables: canonical }),
  'preview-about-hit': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(project, 'page', about.id) }),
  'preview-about-edit': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(draft, 'page', about.id) }),
  'preview-machine-bank': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(project, 'page', machine.id) }),
  'preview-one-card': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(project, 'win', project.cards[0].id) }),
  'first-full-save': () => ({ path: '/admin/api/save', tables: canonical, body: () => ({ project: draft, baseVersion: 185, requestId: crypto.randomUUID() }) }),
  'first-delta-save': () => ({ path: '/admin/api/save', tables: canonical, body: () => ({ changes, baseVersion: 185, requestId: crypto.randomUUID() }) }),
  'validate-current': () => ({ path: '/admin/api/validate', tables: canonical, body: () => ({ project: draft }) }),
  'recover-current': () => ({ path: '/admin/api/recover', tables: canonical, body: () => ({ project: draft }) }),
  'recover-current-pending': () => ({ path: '/admin/api/recover', tables: canonical, body: () => ({ project: draft, baseVersion: 185, pendingSave: { changes, baseVersion: 185, requestId: crypto.randomUUID() } }) }),
};
if (values.list) { console.log(Object.keys(workloads).join('\n')); process.exit(0); }
if (!Object.hasOwn(workloads, values.workload ?? '')) throw new Error('Choose exactly one --workload from --list; run each workload in its own process.');
const count = name => { const n = Number(values[name]); if (!Number.isSafeInteger(n) || n < 1 || n > 200) throw new Error(`${name} must be 1..200`); return n; };
const counts = { cold: count('cold'), warm: count('warm'), warmup: count('warmup') };
const hash = value => createHash('sha256').update(value).digest('hex');
const quantile = (samples, key, fraction) => {
  const sorted = samples.map(item => item[key]).sort((a, b) => a - b);
  return fraction === .5 && sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.ceil(sorted.length * fraction) - 1];
};
const distribution = samples => ({ count: samples.length, medianCpuMs: quantile(samples, 'cpuMs', .5), p95CpuMs: quantile(samples, 'cpuMs', .95), medianWallMs: quantile(samples, 'wallMs', .5), p95WallMs: quantile(samples, 'wallMs', .95), errors: samples.filter(item => item.error).length });
const time = () => ({ wall: performance.now(), cpu: process.cpuUsage() });
const elapsed = start => { const cpu = process.cpuUsage(start.cpu); return { cpuMs: (cpu.user + cpu.system) / 1000, wallMs: performance.now() - start.wall }; };

async function sourceIdentity(directory = 'src', result = []) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await sourceIdentity(path, result);
    else if (entry.isFile()) result.push([path, hash(await readFile(path))]);
  }
  return result;
}
function snapshot(runtime) {
  return runtime.sqlite.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all().map(({ name }) => ({ name, rows: runtime.sqlite.prepare(`SELECT * FROM "${name}"`).all() }));
}
function restore(runtime, tables) {
  runtime.sqlite.exec('BEGIN; PRAGMA defer_foreign_keys=ON');
  try {
    for (const { name } of [...tables].reverse()) runtime.sqlite.exec(`DELETE FROM "${name}"`);
    for (const { name, rows } of tables) for (const row of rows) {
      const keys = Object.keys(row);
      runtime.sqlite.prepare(`INSERT INTO "${name}"(${keys.map(key => `"${key}"`).join(',')}) VALUES(${keys.map(() => '?').join(',')})`).run(...Object.values(row));
    }
    runtime.sqlite.exec('COMMIT');
  } catch (error) { runtime.sqlite.exec('ROLLBACK'); throw error; }
}

const { initial, seed } = await import('../.generated/cms-seed.mjs');
if (await studioBuildKey(seed) !== seed.studioKey) throw new Error('Build identity is stale; build the exact measured checkout first.');
const fixtureBytes = await readFile('tests/fixtures/cms-v185-project.json'), raw = JSON.parse(fixtureBytes);
const project = normalizeStoredProject(storedProjectView(structuredClone(raw)), seed, initial);
const draft = structuredClone(project), about = draft.pages.find(page => page.path === '/om/');
about.html = about.html.replace('</main>', '<p>CPU measurement edit.</p></main>');
const machine = project.pages.find(page => page.html.includes('data-machine'));
if (!about || !machine || !project.cards.length) throw new Error('The production-shaped workload is incomplete.');
// Compile/seed/derive artifacts outside every sample. The fixture auth module
// is deliberately identified below; these numbers cannot certify edge CPU.
const preparedWorker = await nodeWorker(), prototype = await nodeCms(raw, preparedWorker);
let ordinary, canonical;
try {
  ordinary = snapshot(prototype);
  const identity = { buildKey: seed.studioKey, origin: 'https://omaryusuf.se', actor: 'owner@example.test' };
  const status = await cpuMigrationStatus(prototype.db, identity);
  const artifact = await prepareCpuArtifact(await readCpuSource(prototype.db, status.version), status, { seed, initial });
  await stageCpuArtifact(prototype.db, artifact, { seed, initial }, { readToday: 0, writtenToday: 0 });
  await applyCpuMigration(prototype.db, { operationId: artifact.operationId, artifactHash: artifact.artifactHash, action: 'commit' }, identity);
  canonical = snapshot(prototype);
} finally { prototype.close(); }
const changes = projectChanges(project, draft);
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
if (commit.status !== 0) throw new Error('Cannot identify measured checkout.');
const report = {
  format: 1, commit: commit.stdout.trim(), sourceHash: hash(JSON.stringify(await sourceIdentity())), seedKey: seed.studioKey,
  scriptHash: hash(await readFile(new URL(import.meta.url))), helperHash: hash(await readFile('tests/helpers/cms-node.mjs')), generatedHash: hash(await readFile('.generated/cms-seed.mjs')),
  fixtureHash: hash(fixtureBytes), lockHash: hash(await readFile('package-lock.json')), node: process.version, platform: platform(), arch: arch(), counts,
  scope: 'Complete bundled Worker handler dispatch and response-body consumption in Node with real SQLite; Access identity is a test stub. CPU includes SQLite/native work and enabled validation-call counting in this process. Module initialization is separate. This is not workerd or Cloudflare edge CPU.',
  methodology: 'Cold means first dispatch per fresh module instance, not a fresh OS process. Warm uses one module with three default excluded warmups. Identical pre-request database contents are restored outside every sample, including mutating Saves. Client encoding, fixture setup and esbuild are excluded. p95 is nearest rank; failed samples are retained and disqualify the run.',
  startedAt: new Date().toISOString(), workloads: [],
};
async function sample(runtime, worker, workload) {
  restore(runtime, workload.tables);
  const body = workload.body?.(), request = runtime.request(workload.path, body);
  const requestBytes = body === undefined ? 0 : Buffer.byteLength(JSON.stringify(body));
  runtime.queries.length = 0; runtime.blobSizes.length = 0; globalThis.cmsValidationCalls = [];
  const start = time();
  let response, bytes, failure;
  try { response = await worker.fetch(request, runtime.env); bytes = await response.arrayBuffer(); }
  catch (error) { failure = String(error); }
  const measured = elapsed(start);
  try {
    if (failure) throw new Error(failure);
    if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${Buffer.from(bytes).toString('utf8').slice(0, 500)}`);
    const result = JSON.parse(Buffer.from(bytes).toString('utf8'));
    if (workload.path.endsWith('/state') && (result.version !== 185 || JSON.stringify(result.project) !== JSON.stringify(project))) throw new Error('State identity changed');
    if (workload.path.endsWith('/save') && result.version !== 186) throw new Error('Save did not publish the intended version');
    if (workload.path.endsWith('/preview') && (typeof result.html !== 'string' || !result.html.includes('cms-preview-data'))) throw new Error('Preview output missing');
    if (['/recover', '/validate'].some(path => workload.path.endsWith(path)) && !result.project.pages.find(page => page.path === '/om/').html.includes('CPU measurement edit.')) throw new Error('Validation or recovery lost the requested edit');
  } catch (error) { failure = String(error); }
  const calls = globalThis.cmsValidationCalls; delete globalThis.cmsValidationCalls;
  return { ...measured, requestBytes, responseBytes: bytes?.byteLength ?? 0, status: response?.status ?? null, queries: runtime.queries.length, blobReads: runtime.blobSizes.length, blobBytes: runtime.blobSizes.reduce((a, b) => a + b, 0), htmlValidations: calls.filter(name => name === 'validateHtml').length, cssValidations: calls.filter(name => name === 'validateCss').length, ...(failure ? { error: failure } : {}) };
}
{
  const workload = { name: values.workload, ...workloads[values.workload]() };
  const cold = [], warm = [], warming = [], initialization = [];
  for (let index = 0; index < counts.cold; index++) {
    const start = time(), worker = await nodeWorker(); initialization.push(elapsed(start));
    const runtime = await nodeCms(null, worker);
    try { cold.push(await sample(runtime, worker, workload)); }
    finally { runtime.close(); }
  }
  const worker = await nodeWorker(), runtime = await nodeCms(null, worker);
  try {
    for (let index = 0; index < counts.warmup; index++) {
      warming.push(await sample(runtime, worker, workload));
    }
    for (let index = 0; index < counts.warm; index++) warm.push(await sample(runtime, worker, workload));
  } finally { runtime.close(); }
  const entry = { name: workload.name, cold: { ...distribution(cold), samples: cold }, warm: { ...distribution(warm), samples: warm }, warmup: { ...distribution(warming), samples: warming }, moduleInitialization: { ...distribution(initialization), samples: initialization } };
  report.workloads.push(entry);
  await mkdir(dirname(values.output), { recursive: true });
  await writeFile(values.output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ name: entry.name, cold: distribution(cold), warm: distribution(warm) }));
}
report.completedAt = new Date().toISOString();
report.passed = report.workloads.every(item => !item.cold.errors && !item.warm.errors && !item.warmup.errors);
await writeFile(values.output, JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
