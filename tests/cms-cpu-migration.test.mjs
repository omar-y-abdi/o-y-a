import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { prepareCpuArtifact, verifyCpuArtifact, readCpuSource, stageCpuArtifact, checkCpuBudget } from '../scripts/cms-cpu-artifact.mjs';
import { cpuOrigin, withCpuDatabase } from '../scripts/cms-migrate-cpu.mjs';
import { applyCpuMigration, cpuMigrationStatus } from '../src/cms/cpu-migration.mjs';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { storedProjectView } from '../src/cms/stored-view.mjs';
import { resourceReferences, validateResources } from '../src/cms/resources.mjs';
import { readStudioHead, readStudioVersion, textParts } from '../src/cms/studio-store.mjs';
import { readSite, publishSite } from '../src/cms/store.mjs';
import { releaseVerdict } from '../scripts/cms-pull-release.mjs';
import { nodeWorker, nodeCms } from './helpers/cms-node.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { baseInitial, baseSeed, baseValidate, basePublish } from './helpers/base-worker.mjs';
import { legacyFrameIdentities } from './helpers/frame-identities.mjs';

const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const worker = await nodeWorker(), context = { seed, initial };
const identity = { buildKey: seed.studioKey, origin: 'https://omaryusuf.se', actor: 'owner@example.test' };
const budget = { readToday: 0, writtenToday: 0 };
const command = (artifact, action = 'commit') => ({ operationId: artifact.operationId, artifactHash: artifact.artifactHash, action });
const status = runtime => cpuMigrationStatus(runtime.db, identity);
async function prepare(runtime, id) { const head = await status(runtime); return prepareCpuArtifact(await readCpuSource(runtime.db, head.version), head, context, id); }
const stage = (runtime, artifact) => stageCpuArtifact(runtime.db, artifact, context, budget);
const apply = (runtime, artifact, action = 'commit', authority = identity) => applyCpuMigration(runtime.db, command(artifact, action), authority);
const publicRows = runtime => runtime.sqlite.prepare('SELECT * FROM cms_rendered ORDER BY version,path').all();
const revisions = runtime => runtime.sqlite.prepare('SELECT * FROM cms_revisions ORDER BY version').all();

test('raw-v185 CPU migration preserves exact state/public/history and removes full revision work from commit/state', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const before = await (await runtime.fetch('/admin/api/state')).json(), publicBefore = publicRows(runtime), historyBefore = revisions(runtime);
    const artifact = await prepare(runtime);
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_cpu_migrations').get().n, 0, 'Prepare is read-only');
    await stage(runtime, artifact);
    assert.equal(await readStudioHead(runtime.db, seed.studioKey), null, 'Staging is invisible');
    runtime.blobSizes.length = 0;
    const parse = JSON.parse, stringify = JSON.stringify;
    let result;
    try {
      JSON.parse = (text, ...args) => { assert.ok(!(text.length > 100000 && text.includes('"pages"')), 'commit parsed a project'); return parse(text, ...args); };
      JSON.stringify = (value, ...args) => { assert.ok(!value?.pages && !value?.project?.pages, 'commit serialized a project'); return stringify(value, ...args); };
      const response = await runtime.fetch('/admin/api/cpu-migration', command(artifact));
      assert.equal(response.status, 200, await response.clone().text()); result = await response.json();
    } finally { JSON.parse = parse; JSON.stringify = stringify; }
    assert.equal(result.state, 'committed'); assert.equal(result.replayed, false);
    assert.deepEqual(runtime.blobSizes, []);
    runtime.queries.length = 0;
    const after = await (await runtime.fetch('/admin/api/state')).json();
    assert.deepEqual(after, before);
    assert.ok(runtime.queries.every(sql => !/\bcms_revisions\b/.test(sql)));
    assert.deepEqual(runtime.blobSizes, []);
    assert.deepEqual(publicRows(runtime), publicBefore); assert.deepEqual(revisions(runtime), historyBefore);
    assert.deepEqual((await readSite(runtime.db, 185, { raw: true })).project, raw);
    assert.equal(runtime.sqlite.prepare('SELECT version FROM cms_head').get().version, 185);
    const expected = [...resourceReferences(raw, identity.origin)].sort(([a], [b]) => a.localeCompare(b));
    const indexed = runtime.sqlite.prepare('SELECT src,reference_count FROM cms_revision_resource_index WHERE version=185').all().map(row => [row.src, row.reference_count]).sort(([a], [b]) => a.localeCompare(b));
    assert.deepEqual(indexed, expected, 'Absent index describes the raw revision, not the deduplicated frame');
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_cpu_migration_rows').get().n, 0);
    assert.equal(runtime.sqlite.prepare('SELECT source_project FROM cms_cpu_migrations').get().source_project, null);
  } finally { runtime.close(); }
});

test('CPU migration keeps ordinary-view metadata/defaults and unresolved choices exact; raw editor JSON stays in history', async () => {
  for (const mode of ['missing', 'partial', 'conflicts', 'editor']) {
    const source = structuredClone(mode === 'conflicts' ? raw : initial);
    if (mode === 'missing') delete source.resources;
    else if (mode === 'partial') source.resources = { icon: initial.resources.icon };
    else if (mode === 'conflicts') source.pages[1].html = source.pages[1].html.replace('</footer>', '<p>Ägarens andra ram.</p></footer>');
    else source.pages[0].project = { components: [{ content: 'Discarded editor metadata' }] };
    const runtime = await nodeCms(source, worker);
    try {
      const expected = JSON.parse(JSON.stringify(normalizeStoredProject(storedProjectView(structuredClone(source)), seed, initial)));
      const before = (await (await runtime.fetch('/admin/api/state')).json()).project;
      if (mode === 'conflicts') assert.ok(expected.frameConflicts.length);
      const artifact = await prepare(runtime); await stage(runtime, artifact); await apply(runtime, artifact);
      const canonical = await readStudioVersion(runtime.db, 185);
      assert.deepEqual(JSON.parse(canonical.parts.join('')), expected);
      assert.deepEqual((await (await runtime.fetch('/admin/api/state')).json()).project, before);
      assert.deepEqual((await readSite(runtime.db, 185, { raw: true })).project, source);
      assert.deepEqual(canonical.resources, validateResources(expected.resources));
      if (mode === 'conflicts') assert.equal(artifact.proofParts, 0, 'A migration does not select a frame for proof production');
      const verdict = await releaseVerdict({ revisions: [{ version: 185, project: await readCpuSource(runtime.db, 185) }], media: [], studio: [canonical] }, context);
      assert.equal(verdict.compatible, true, JSON.stringify(verdict));
      const wrong = { ...canonical, resources: { ...canonical.resources, icon: '/media/00000000-0000-4000-8000-000000000000.png' } };
      assert.equal((await releaseVerdict({ revisions: [{ version: 185, project: await readCpuSource(runtime.db, 185) }], media: [], studio: [wrong] }, context)).compatible, false);
    } finally { runtime.close(); }
  }
});

test('actual BASE publication migrates on real D1 without a Save, retaining alias IDs, raw identity and public bytes', async () => {
  const runtime = await cmsRuntime();
  try {
    const project = baseValidate(legacyFrameIdentities(baseInitial), baseSeed), requestId = crypto.randomUUID();
    await basePublish(runtime.db, { project, baseVersion: 0, requestId, actor: runtime.email });
    const token = await runtime.token();
    const call = (path, body, headers = {}) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), headers: { 'CF-Access-Jwt-Assertion': token, Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/json', ...headers } });
    const before = await (await call('state')).json();
    assert.ok(before.project.pages.some(page => page.frameIds && Object.keys(page.frameIds).length));
    const pages = new Map();
    for (const path of ['/', '/om/', '/verkstad/']) pages.set(path, await (await runtime.mf.dispatchFetch(runtime.url + path)).text());
    const head = await (await call('cpu-migration')).json();
    const artifact = await prepareCpuArtifact(await readCpuSource(runtime.db, 1), head, context);
    await stageCpuArtifact(runtime.db, artifact, context, budget);
    const unauthorized = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/cpu-migration');
    assert.equal(unauthorized.status, 401);
    assert.equal((await call('cpu-migration', command(artifact), { Origin: 'https://other.example' })).status, 403);
    assert.equal((await call('cpu-migration', { ...command(artifact), project: {} })).status, 422, 'HTTP cannot inject even a small content field');
    assert.equal((await call('cpu-migration', { ...command(artifact), project })).status, 413, 'The endpoint retains its small body limit');
    const response = await call('cpu-migration', command(artifact));
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json(); assert.ok(result.databaseUsage.reads > 0 && result.databaseUsage.writes > 0);
    assert.deepEqual((await (await call('state')).json()).project, before.project);
    for (const [path, html] of pages) assert.equal(await (await runtime.mf.dispatchFetch(runtime.url + path)).text(), html, path);
    assert.deepEqual((await readSite(runtime.db, 1, { raw: true })).project, project);
    assert.equal((await runtime.db.prepare('SELECT count(*) AS n FROM cms_revisions').first()).n, 1);
    const replay = await basePublish(runtime.db, { project, baseVersion: 0, requestId, actor: runtime.email });
    assert.equal(replay.replayed, true);
  } finally { await runtime.close(); }
});

test('artifact verification proves derivation and immutable stage retries reject changed identities', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const artifact = await prepare(runtime), changed = structuredClone(artifact);
    const project = JSON.parse(changed.rows.filter(row => row.kind === 'text').map(row => row.body).join(''));
    project.pages[0].title = 'A different valid title';
    const serialized = JSON.stringify(project);
    changed.rows = [...textParts(serialized).map((body, part) => ({ kind: 'text', part, body })), ...changed.rows.filter(row => row.kind !== 'text')];
    changed.projectHash = createHash('sha256').update(serialized).digest('hex');
    changed.stageBytes = changed.rows.reduce((n, row) => n + Buffer.byteLength(row.body), 0);
    delete changed.artifactHash; changed.artifactHash = createHash('sha256').update(JSON.stringify(changed)).digest('hex');
    await assert.rejects(verifyCpuArtifact(changed, context), /avviker/);
    await assert.rejects(stage(runtime, changed), /avviker/);
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_cpu_migrations').get().n, 0);
    await stage(runtime, artifact);
    const rows = runtime.sqlite.prepare('SELECT * FROM cms_cpu_migration_rows ORDER BY kind,part').all();
    await stage(runtime, artifact); assert.deepEqual(runtime.sqlite.prepare('SELECT * FROM cms_cpu_migration_rows ORDER BY kind,part').all(), rows);
    const reused = await prepareCpuArtifact(Buffer.from(artifact.source, 'base64'), { ...artifact.status, cacheRows: artifact.status.cacheRows + 1 }, context, artifact.operationId);
    await assert.rejects(stage(runtime, reused), /identitet/);
    await apply(runtime, artifact, 'abort');
    await assert.rejects(stage(runtime, artifact), /identitet/);
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_cpu_migration_rows').get().n, 0, 'Late retry cannot resurrect aborted staging');
  } finally { runtime.close(); }
});

test('interrupted preparation resumes exact staged bytes without making partial text visible', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const artifact = await prepare(runtime);
    let inserted = 0;
    const interrupted = { prepare(sql) {
      const statement = runtime.db.prepare(sql);
      if (sql.startsWith('INSERT INTO cms_cpu_migration_rows')) {
        const run = statement.run;
        statement.run = async () => { if (++inserted === 2) throw new Error('controlled upload interruption'); return run(); };
      }
      return statement;
    } };
    await assert.rejects(stageCpuArtifact(interrupted, artifact, context, budget), /controlled upload interruption/);
    assert.equal(await readStudioHead(runtime.db, seed.studioKey), null);
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_cpu_migration_rows').get().n, 1);
    await assert.rejects(apply(runtime, artifact), { status: 409 });
    await stage(runtime, artifact); await apply(runtime, artifact);
    assert.equal((await readStudioHead(runtime.db, seed.studioKey)).hash, artifact.projectHash);
  } finally { runtime.close(); }
});

test('unsealed/incomplete and stale source/head/build/origin/cache operations leave all serving state intact', async () => {
  for (const failure of ['unsealed','incomplete','source','head','build','origin','actor','cache','expired','day']) {
    const runtime = await nodeCms(raw, worker);
    try {
      const artifact = await prepare(runtime); await stage(runtime, artifact);
      let authority = identity;
      if (failure === 'unsealed') runtime.sqlite.prepare("UPDATE cms_cpu_migrations SET state='preparing'").run();
      if (failure === 'incomplete') runtime.sqlite.prepare("DELETE FROM cms_cpu_migration_rows WHERE kind='text' AND part=0").run();
      if (failure === 'source') runtime.sqlite.prepare("UPDATE cms_revisions SET project=x'0001' WHERE version=185").run();
      if (failure === 'head') runtime.sqlite.prepare('UPDATE cms_head SET version=0').run();
      if (failure === 'build') authority = { ...identity, buildKey: 'f'.repeat(64) };
      if (failure === 'origin') authority = { ...identity, origin: 'https://other.example' };
      if (failure === 'actor') authority = { ...identity, actor: 'another@example.test' };
      if (failure === 'cache') runtime.sqlite.prepare('INSERT INTO cms_studio_heads(version,build_key,project_hash,resources,text_parts,migration_id) VALUES(?,?,?,?,1,?)').run(185, seed.studioKey, artifact.projectHash, JSON.stringify(artifact.resources), crypto.randomUUID());
      if (failure === 'expired') runtime.sqlite.prepare("UPDATE cms_cpu_migrations SET created_at='2000-01-01T00:00:00.000Z'").run();
      if (failure === 'day') runtime.sqlite.prepare("UPDATE cms_cpu_migrations SET budget_day='2000-01-01'").run();
      const before = { public: publicRows(runtime), history: revisions(runtime), cache: runtime.sqlite.prepare('SELECT * FROM cms_studio_heads').all() };
      await assert.rejects(apply(runtime, artifact, 'commit', authority), { status: 409 }, failure);
      assert.deepEqual({ public: publicRows(runtime), history: revisions(runtime), cache: runtime.sqlite.prepare('SELECT * FROM cms_studio_heads').all() }, before, failure);
    } finally { runtime.close(); }
  }
});

test('concurrent exact commits replay accurately; competing refreshes, rollback generations and later Saves stay guarded', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const a = await prepare(runtime), b = await prepare(runtime);
    await stage(runtime, a); await stage(runtime, b);
    const duplicate = await Promise.all([apply(runtime, a), apply(runtime, a)]);
    assert.deepEqual(duplicate.map(row => row.replayed).sort(), [false, true]);
    await assert.rejects(apply(runtime, b), { status: 409 });
    const c = await prepare(runtime); await stage(runtime, c); await apply(runtime, c);
    await assert.rejects(apply(runtime, a, 'rollback'), { status: 409 });
    assert.equal(runtime.sqlite.prepare('SELECT migration_id FROM cms_studio_heads').get().migration_id, c.operationId);
    const rollback = await apply(runtime, c, 'rollback'); assert.equal(rollback.state, 'rolled_back');
    assert.equal((await apply(runtime, c, 'rollback')).replayed, true);
    assert.equal(await readStudioHead(runtime.db, seed.studioKey), null);
    await assert.rejects(apply(runtime, c), { status: 409 }, 'Rollback cannot silently republish a consumed operation');
    // Rollback removes only its current copy; it does not cancel another
    // sealed operation derived from the identical absent-cache state.
    await apply(runtime, b);
    await publishSite(runtime.db, { project: initial, baseVersion: 185, requestId: crypto.randomUUID(), actor: identity.actor, studioKey: seed.studioKey });
    const after = await readStudioHead(runtime.db, seed.studioKey);
    assert.equal((await apply(runtime, b)).replayed, true, 'Lost-response retry after a later publication is receipt-only');
    assert.deepEqual(await readStudioHead(runtime.db, seed.studioKey), after);
    await assert.rejects(apply(runtime, b, 'rollback'), { status: 409 });
    // Product retention currently deletes rendered rows only, never raw
    // revisions. Simulate explicit source-row retirement to prove the terminal
    // receipt has an independent lifetime, without introducing a prune path.
    runtime.sqlite.prepare('DELETE FROM cms_rendered WHERE version=185').run();
    runtime.sqlite.prepare('DELETE FROM cms_revisions WHERE version=185').run();
    assert.equal((await apply(runtime, b)).replayed, true);
    assert.deepEqual(await readStudioHead(runtime.db, seed.studioKey), after);
  } finally { runtime.close(); }
});

test('transaction failure restores the whole old copy; stale build refresh preserves an existing raw index', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const a = await prepare(runtime); await stage(runtime, a); await apply(runtime, a);
    runtime.sqlite.prepare("UPDATE cms_studio_heads SET build_key='previous-build'").run();
    const old = await readStudioVersion(runtime.db, 185), references = runtime.sqlite.prepare('SELECT * FROM cms_revision_resource_index ORDER BY src').all();
    const refresh = await prepare(runtime); await stage(runtime, refresh);
    runtime.sqlite.exec("CREATE TRIGGER fail_cpu_text BEFORE INSERT ON cms_studio_text BEGIN SELECT RAISE(ABORT,'controlled CPU copy failure'); END");
    await assert.rejects(apply(runtime, refresh), /controlled CPU copy failure/);
    assert.deepEqual(await readStudioVersion(runtime.db, 185), old);
    assert.equal(runtime.sqlite.prepare('SELECT state FROM cms_cpu_migrations WHERE id=?').get(refresh.operationId).state, 'ready');
    runtime.sqlite.exec('DROP TRIGGER fail_cpu_text');
    await apply(runtime, refresh);
    assert.equal((await readStudioHead(runtime.db, seed.studioKey)).hash, old.hash);
    assert.deepEqual(runtime.sqlite.prepare('SELECT * FROM cms_revision_resource_index ORDER BY src').all(), references);
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_revisions').get().n, 1);
  } finally { runtime.close(); }
});

test('account estimates fail before staging and endpoint origins cannot redirect owner credentials', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const artifact = await prepare(runtime);
    for (const invalid of [{ readToday: 4500000, writtenToday: 0 }, { readToday: 0, writtenToday: 90000 }, { readToday: 0, writtenToday: 0, day: '2000-01-01' }, { readToday: NaN, writtenToday: 0 }]) {
      assert.throws(() => checkCpuBudget(artifact, invalid));
      await assert.rejects(stageCpuArtifact(runtime.db, artifact, context, invalid));
    }
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_cpu_migrations').get().n, 0);
    runtime.sqlite.prepare("INSERT INTO cms_revision_resource_index(version,src,reference_count) VALUES(185,'/favicon.svg',1)").run();
    await assert.rejects(stage(runtime, artifact), /radantal/, 'Fresh count/index preflight invalidates an obsolete estimate before any stage write');
    assert.equal(runtime.sqlite.prepare('SELECT count(*) AS n FROM cms_cpu_migrations').get().n, 0);
    assert.equal(cpuOrigin('https://omaryusuf.se/', true), 'https://omaryusuf.se');
    assert.equal(cpuOrigin('http://127.0.0.1:8123/', false), 'http://127.0.0.1:8123');
    for (const origin of ['https://other.example', 'https://omaryusuf.se:444', 'https://omaryusuf.se/path', 'https://user@omaryusuf.se', 'https://omaryusuf.se/?secret=1']) assert.throws(() => cpuOrigin(origin, true));
    assert.throws(() => cpuOrigin('https://other.example', false));
  } finally { runtime.close(); }
});

test('isolated Wrangler D1 proxy persists only the explicitly selected local copy and disposes between uses', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cms-cpu-proxy-test-'));
  try {
    const config = join(directory, 'wrangler.json'), persistTo = join(directory, 'copy');
    await writeFile(config, JSON.stringify({ name: 'cpu-proxy-test', compatibility_date: '2026-09-11', d1_databases: [{ binding: 'CMS_DB', database_name: 'local-test', database_id: crypto.randomUUID() }], vars: { SHOULD_NOT_BE_COPIED: 'excluded' }, r2_buckets: [{ binding: 'EXCLUDED', bucket_name: 'not-a-real-bucket' }] }));
    await withCpuDatabase({ config, persistTo }, async db => {
      await db.prepare('CREATE TABLE migration_probe(value TEXT)').run();
      await db.prepare('INSERT INTO migration_probe(value) VALUES(?)').bind('parameter-bound copy').run();
    });
    await withCpuDatabase({ config, persistTo }, async db => assert.equal((await db.prepare('SELECT value FROM migration_probe').first()).value, 'parameter-bound copy'));
    await withCpuDatabase({ config, persistTo: join(directory, 'another-copy') }, async db => assert.equal(await db.prepare("SELECT name FROM sqlite_schema WHERE name='migration_probe'").first(), null));
    await assert.rejects(withCpuDatabase({ config }, () => assert.fail('missing local directory must not open a proxy')), /persist-to/);
    await assert.rejects(withCpuDatabase({ config, persistTo, remote: true }, () => assert.fail('remote must not use local persistence')), /persist-to/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
