import { parseArgs } from 'node:util';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { platform, arch } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { cpuMigrationStatus, applyCpuMigration } from '../src/cms/cpu-migration.mjs';
import { prepareCpuArtifact, readCpuSource, stageCpuArtifact } from './cms-cpu-artifact.mjs';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { storedProjectView } from '../src/cms/stored-view.mjs';
import { previewPayload } from '../src/cms/preview-project.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
import { studioBuildKey } from './build-cms.mjs';
import { publishSite, digest } from '../src/cms/store.mjs';

const { values } = parseArgs({ options: {
  cold: { type: 'string', default: '20' }, warm: { type: 'string', default: '50' }, warmup: { type: 'string', default: '3' }, output: { type: 'string', default: 'output/cpu/handlers.json' },
  workload: { type: 'string' }, list: { type: 'boolean' },
  'public-reference': { type: 'string' }, 'record-public-reference': { type: 'string' },
} });
// Factories defer all fixture access: --list neither builds nor opens storage.
const workloads = {
  'state-before-migration': () => ({ path: '/admin/api/state', tables: ordinary }),
  'state-after-migration': () => ({ path: '/admin/api/state', tables: canonical }),
  'state-first': () => ({ path: '/admin/api/state', tables: empty, expectedProject: initial, expectedVersion: 0 }),
  'public-canonical': () => ({ path: '/', tables: publicCanonical, response: 'public', seedless: true }),
  'public-legacy': () => ({ path: '/', tables: ordinary, response: 'public' }),
  'preview-about-hit': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(project, 'page', about.id) }),
  'preview-about-edit': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(draft, 'page', about.id) }),
  'preview-machine-bank': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(project, 'page', machine.id) }),
  'preview-one-card': () => ({ path: '/admin/api/preview', tables: canonical, body: () => previewPayload(project, 'win', project.cards[0].id) }),
  'first-full-save': () => ({ path: '/admin/api/save', tables: canonical, body: () => ({ project: draft, baseVersion: 185, requestId: crypto.randomUUID() }) }),
  'first-delta-save': () => ({ path: '/admin/api/save', tables: canonical, body: () => ({ changes, baseVersion: 185, requestId: crypto.randomUUID() }) }),
  'validate-current': () => ({ path: '/admin/api/validate', tables: canonical, body: () => ({ project: draft }) }),
  'recover-current': () => ({ path: '/admin/api/recover', tables: canonical, body: () => ({ project: draft }) }),
  'recover-current-pending': () => ({ path: '/admin/api/recover', tables: canonical, body: () => ({ project: draft, baseVersion: 185, pendingSave: { changes, baseVersion: 185, requestId: crypto.randomUUID() } }) }),
  'replay-full': () => ({ path: '/admin/api/save', tables: replay, body: () => fullAttempt, seedless: true, replayed: true }),
  'replay-delta': () => ({ path: '/admin/api/save', tables: replay, body: () => deltaAttempt, seedless: true, replayed: true }),
};
if (values.list) { console.log(Object.keys(workloads).join('\n')); process.exit(0); }
if (values['record-public-reference'] && (values.workload || values['public-reference'])) throw new Error('Record public reference separately from measurements, in the reviewed baseline checkout.');
if (!values['record-public-reference'] && !Object.hasOwn(workloads, values.workload ?? '')) throw new Error('Choose exactly one --workload from --list; run each workload in its own process.');
if (values.workload?.startsWith('public-') && !values['public-reference']) throw new Error('Public measurements require the independently recorded --public-reference from the reviewed baseline.');
if (values['public-reference'] && !values.workload?.startsWith('public-')) throw new Error('--public-reference applies only to a public workload.');
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

const { nodeWorker, nodeCms } = await import('../tests/helpers/cms-node.mjs');
const { initial, seed } = await import('../.generated/cms-seed.mjs');
if (await studioBuildKey(seed) !== seed.studioKey) throw new Error('Build identity is stale; build the exact measured checkout first.');
const seedPath = '/admin/seed.' + hash(JSON.stringify({ seed, initial })) + '.json';
const fixtureBytes = await readFile('tests/fixtures/cms-v185-project.json'), raw = JSON.parse(fixtureBytes);
const project = normalizeStoredProject(storedProjectView(structuredClone(raw)), seed, initial);
const draft = structuredClone(project), about = draft.pages.find(page => page.path === '/om/');
const machine = project.pages.find(page => page.html.includes('data-machine'));
if (!about || !machine || !project.cards.length) throw new Error('The production-shaped workload is incomplete.');
about.html = about.html.replace('</main>', '<p>CPU measurement edit.</p></main>');
const changes = projectChanges(project, draft);
const fullAttempt = { project: draft, baseVersion: 185, requestId: '00000000-0000-4000-8000-000000000101' };
const deltaAttempt = { changes, baseVersion: 185, requestId: '00000000-0000-4000-8000-000000000102' };
// Compile/seed/derive artifacts outside every sample. The fixture auth module
// is deliberately identified below; these numbers cannot certify edge CPU.
const preparedWorker = await nodeWorker(), prototype = await nodeCms(raw, preparedWorker);
let ordinary, canonical, empty, publicCanonical, replay;
try {
  ordinary = snapshot(prototype);
  if (JSON.parse(prototype.sqlite.prepare("SELECT meta FROM cms_rendered WHERE version=185 AND path='/'").get().meta).frameVersion === 2) throw new Error('Legacy public fixture unexpectedly has canonical rendered rows');
  const identity = { buildKey: seed.studioKey, origin: 'https://omaryusuf.se', actor: 'owner@example.test' };
  const status = await cpuMigrationStatus(prototype.db, identity);
  const artifact = await prepareCpuArtifact(await readCpuSource(prototype.db, status.version), status, { seed, initial });
  await stageCpuArtifact(prototype.db, artifact, { seed, initial }, { readToday: 0, writtenToday: 0 });
  await applyCpuMigration(prototype.db, { operationId: artifact.operationId, artifactHash: artifact.artifactHash, action: 'commit' }, identity);
  canonical = snapshot(prototype);
  if (values.workload === 'public-canonical' || values['record-public-reference']) {
    // CPU migration does not rewrite rendered rows. This separate publication
    // creates the canonical public representation being measured.
    await publishSite(prototype.db, { project, baseVersion: 185, requestId: crypto.randomUUID(), actor: identity.actor, studioKey: seed.studioKey, origin: identity.origin });
    if (JSON.parse(prototype.sqlite.prepare("SELECT meta FROM cms_rendered WHERE version=186 AND path='/'").get().meta).frameVersion !== 2) throw new Error('Canonical public fixture did not produce canonical rendered rows');
    publicCanonical = snapshot(prototype);
  }
  if (values.workload === 'state-first') {
    const first = await nodeCms(null, preparedWorker);
    try { empty = snapshot(first); } finally { first.close(); }
  }
  if (values.workload?.startsWith('replay-')) {
    // Store-produced committed receipts exercise the real handler's replay.
    // Actual API publication/replay is separately covered by integration tests.
    const full = values.workload === 'replay-full', attempt = full ? fullAttempt : deltaAttempt;
    const envelope = full ? { baseVersion: 185, project: draft } : { baseVersion: 185, changes };
    await publishSite(prototype.db, { project: draft, baseVersion: 185, requestId: attempt.requestId, actor: identity.actor, payloadHash: await digest(JSON.stringify(envelope)), requestFormat: full ? 'full-v1' : 'delta-v1', studioKey: seed.studioKey, origin: identity.origin });
    await publishSite(prototype.db, { project, baseVersion: 186, requestId: crypto.randomUUID(), actor: identity.actor, studioKey: seed.studioKey, origin: identity.origin });
    replay = snapshot(prototype);
  }
} finally { prototype.close(); }
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
if (commit.status !== 0) throw new Error('Cannot identify measured checkout.');
const report = {
  format: 1, commit: commit.stdout.trim(), sourceHash: hash(JSON.stringify(await sourceIdentity())), seedKey: seed.studioKey,
  scriptHash: hash(await readFile(new URL(import.meta.url))), helperHash: hash(await readFile('tests/helpers/cms-node.mjs')), generatedHash: hash(await readFile('.generated/cms-seed.mjs')),
  fixtureHash: hash(fixtureBytes), lockHash: hash(await readFile('package-lock.json')), node: process.version, platform: platform(), arch: arch(), counts,
  scope: 'Complete bundled Worker handler dispatch and response-body consumption in Node with real SQLite; Access identity is a test stub. CPU includes SQLite/native work, validation-call and seed-read counting, and local file reads for the ASSETS seed adapter. Module initialization is separate. This is not workerd or Cloudflare edge CPU.',
  methodology: 'Cold means first dispatch per fresh module instance, not a fresh OS process. Warm uses one module with three default excluded warmups and requires zero seed reads. Identical pre-request database contents are restored outside every sample, including mutating Saves. Client encoding, fixture setup and esbuild are excluded. Replay fixtures are store-produced full/delta receipts at version186 with a later head187, not captured API publications. Public status/headers/body must match a separately recorded clean-baseline reference. p95 is nearest rank; failed samples and warmups are retained and disqualify the run.',
  startedAt: new Date().toISOString(), workloads: [],
};

const publicIdentity = (response, bytes) => ({ status: response.status, headers: Object.fromEntries(response.headers), bodyBytes: bytes.byteLength, bodySha256: hash(new Uint8Array(bytes)) });
if (values['record-public-reference']) {
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'src'], { encoding: 'utf8' });
  if (status.status !== 0 || status.stdout.trim()) throw new Error('Record the public reference only from the reviewed baseline with unchanged product source.');
  const runtime = await nodeCms(null, preparedWorker), responses = {};
  try {
    for (const name of ['public-canonical', 'public-legacy']) {
      const workload = workloads[name](); restore(runtime, workload.tables);
      const response = await preparedWorker.fetch(runtime.request(workload.path), runtime.env), bytes = await response.arrayBuffer();
      if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Baseline ${name} is not an HTML200 response`);
      responses[name] = publicIdentity(response, bytes);
    }
  } finally { runtime.close(); }
  const reference = { format: 1, commit: report.commit, sourceHash: report.sourceHash, scriptHash: report.scriptHash, helperHash: report.helperHash, fixtureHash: report.fixtureHash, generatedHash: report.generatedHash, lockHash: report.lockHash, seedKey: report.seedKey, recordedAt: new Date().toISOString(), utcYear: new Date().getUTCFullYear(), responses };
  await mkdir(dirname(values['record-public-reference']), { recursive: true });
  await writeFile(values['record-public-reference'], JSON.stringify(reference, null, 2));
  console.log(JSON.stringify({ recorded: values['record-public-reference'], commit: reference.commit, sourceHash: reference.sourceHash }));
  process.exit(0);
}
let publicReference;
if (values['public-reference']) {
  const referenceBytes = await readFile(values['public-reference']);
  publicReference = JSON.parse(referenceBytes);
  if (publicReference.format !== 1 || publicReference.utcYear !== new Date().getUTCFullYear()) throw new Error('Public reference format/year differs; rerecord the reviewed baseline for the current render year.');
  for (const field of ['scriptHash', 'helperHash', 'fixtureHash', 'generatedHash', 'lockHash', 'seedKey']) if (publicReference[field] !== report[field]) throw new Error(`Public reference ${field} differs from this measurement`);
  if (!publicReference.responses?.[values.workload]) throw new Error('Public reference does not contain the selected workload');
  report.publicReference = { sha256: hash(referenceBytes), commit: publicReference.commit, sourceHash: publicReference.sourceHash, recordedAt: publicReference.recordedAt, utcYear: publicReference.utcYear };
}

async function sample(runtime, worker, workload, warm = false) {
  restore(runtime, workload.tables);
  const body = workload.body?.(), request = runtime.request(workload.path, body);
  const requestBytes = body === undefined ? 0 : Buffer.byteLength(JSON.stringify(body));
  runtime.queries.length = 0; runtime.blobSizes.length = 0; globalThis.cmsValidationCalls = [];
  let seedReads = 0;
  const fetchAsset = runtime.env.ASSETS.fetch;
  runtime.env.ASSETS.fetch = input => {
    if (new URL(typeof input === 'string' ? input : input.url).pathname === seedPath) seedReads++;
    return fetchAsset(input);
  };
  const start = time();
  let response, bytes, failure;
  try { response = await worker.fetch(request, runtime.env); bytes = await response.arrayBuffer(); }
  catch (error) { failure = String(error); }
  finally { runtime.env.ASSETS.fetch = fetchAsset; }
  const measured = elapsed(start);
  try {
    if (failure) throw new Error(failure);
    if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${Buffer.from(bytes).toString('utf8').slice(0, 500)}`);
    const result = workload.response === 'public' ? null : JSON.parse(Buffer.from(bytes).toString('utf8'));
    if (workload.response === 'public' && JSON.stringify(publicIdentity(response, bytes)) !== JSON.stringify(publicReference.responses[workload.name])) throw new Error('Public status/headers/body differ from the independently recorded baseline');
    if (workload.path.endsWith('/state') && (result.version !== (workload.expectedVersion ?? 185) || JSON.stringify(result.project) !== JSON.stringify(workload.expectedProject ?? project))) throw new Error('State identity changed');
    if (workload.path.endsWith('/save') && result.version !== 186) throw new Error('Save did not return the intended version');
    if (workload.replayed && (result.replayed !== true || result.requestId !== body.requestId || runtime.sqlite.prepare('SELECT version FROM cms_head WHERE id=1').get().version !== 187 || runtime.sqlite.prepare('SELECT count(*) AS count FROM cms_revisions').get().count !== 3)) throw new Error('Confirmed replay changed identity, the later head or revision count');
    if (workload.seedless && seedReads !== 0) throw new Error('Seedless canonical-public/replay path fetched definitions');
    if (warm && seedReads !== 0) throw new Error('A warm handler unexpectedly fetched definitions');
    if (seedReads > 1) throw new Error('One handler unexpectedly fetched definitions more than once');
    if (workload.path.endsWith('/preview') && (typeof result.html !== 'string' || !result.html.includes('cms-preview-data'))) throw new Error('Preview output missing');
    if (['/recover', '/validate'].some(path => workload.path.endsWith(path)) && !result.project.pages.find(page => page.path === '/om/').html.includes('CPU measurement edit.')) throw new Error('Validation or recovery lost the requested edit');
  } catch (error) { failure = String(error); }
  const calls = globalThis.cmsValidationCalls; delete globalThis.cmsValidationCalls;
  return { ...measured, requestBytes, responseBytes: bytes?.byteLength ?? 0, status: response?.status ?? null, seedReads, queries: runtime.queries.length, blobReads: runtime.blobSizes.length, blobBytes: runtime.blobSizes.reduce((a, b) => a + b, 0), htmlValidations: calls.filter(name => name === 'validateHtml').length, cssValidations: calls.filter(name => name === 'validateCss').length, ...(failure ? { error: failure } : {}) };
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
    for (let index = 0; index < counts.warm; index++) warm.push(await sample(runtime, worker, workload, true));
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
