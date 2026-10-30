import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { nodeWorker, nodeCms } from './helpers/cms-node.mjs';
import { prepareCpuArtifact, readCpuSource, stageCpuArtifact } from '../scripts/cms-cpu-artifact.mjs';
import { applyCpuMigration, cpuMigrationStatus } from '../src/cms/cpu-migration.mjs';
import { readCurrentProject, readCurrentResources } from '../src/cms/current-project.mjs';
import { readStudioVersion } from '../src/cms/studio-store.mjs';
import { readSite, publishSite } from '../src/cms/store.mjs';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { validateProjectWithReferences } from '../src/cms/project.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
import { handleEmailAdmin } from '../src/cms/email-api.mjs';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { baseInitial, baseSeed, baseValidate, basePublish } from './helpers/base-worker.mjs';
import { legacyFrameIdentities } from './helpers/frame-identities.mjs';

const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const worker = await nodeWorker(), origin = 'https://omaryusuf.se', actor = 'owner@example.test';
const context = { seed, initial }, identity = { buildKey: seed.studioKey, origin, actor };
async function migrate(runtime) {
  const status = await cpuMigrationStatus(runtime.db, identity);
  const artifact = await prepareCpuArtifact(await readCpuSource(runtime.db, status.version), status, context);
  await stageCpuArtifact(runtime.db, artifact, context, { readToday: 0, writtenToday: 0 });
  await applyCpuMigration(runtime.db, { operationId: artifact.operationId, artifactHash: artifact.artifactHash, action: 'commit' }, identity);
  return artifact;
}
const current = runtime => readCurrentProject(runtime.db, seed, initial, origin);
const pageEdit = (project, label = 'Ny rad') => {
  const draft = structuredClone(project), page = draft.pages.find(item => item.path === '/om/');
  page.html = page.html.replace('</main>', `<p>${label}</p></main>`);
  return draft;
};
const clearWork = runtime => { runtime.queries.length = 0; runtime.blobSizes.length = 0; globalThis.cmsValidationCalls = []; };
const checkedResponse = async response => { assert.equal(response.status, 200, await response.clone().text()); return response.json(); };

test('modern first full/delta Save after cache-only migration uses exact proofs without BLOB decoding or legacy conversion', async () => {
  for (const mode of ['full', 'delta']) {
    const runtime = await nodeCms(raw, worker);
    try {
      await migrate(runtime);
      const saved = await current(runtime), original = JSON.stringify(saved.project);
      assert.equal(saved.version, 185);
      assert.ok(saved.baseline.validatedFrame?.nodes.length);
      assert.ok(saved.baseline.pages.every(page => page.facts?.validationKey.includes(seed.studioKey)), 'Migration facts cover the unchanged canonical pages');
      assert.equal(saved.project.validatedFrame, undefined);
      const edited = pageEdit(saved.project);
      const expected = validateProjectWithReferences(structuredClone(edited), seed, undefined, { origins: [origin] }).project;
      const body = { baseVersion: 185, requestId: crypto.randomUUID(), ...(mode === 'full' ? { project: edited } : { changes: projectChanges(saved.project, edited) }) };
      clearWork(runtime);
      globalThis.cmsValidationDetails = [];
      assert.equal((await checkedResponse(await runtime.fetch('/admin/api/save', body))).version, 186);
      assert.deepEqual(runtime.blobSizes, [], mode);
      assert.equal(globalThis.cmsValidationCalls.filter(name => name === 'validateHtml').length, 1, 'Only the edited main requires HTML sanitization');
      const cssChecks = globalThis.cmsValidationDetails.filter(call => call.name === 'validateCss');
      assert.equal(cssChecks.filter(call => call.context === 'stylesheet').length, 0, 'Exact unchanged page/frame stylesheets retain their proofs');
      assert.ok(cssChecks.some(call => call.context === 'declarationList'), 'Inline CSS/SVG attributes in the changed main still require validation');
      assert.equal(JSON.stringify(saved.project), original, 'Internal baseline facts never rewrite the canonical payload');
      delete globalThis.cmsValidationCalls;
      assert.deepEqual((await readSite(runtime.db)).project, expected);
      assert.equal((await readSite(runtime.db)).project.validatedFrame, undefined);
    } finally { delete globalThis.cmsValidationCalls; delete globalThis.cmsValidationDetails; runtime.close(); }
  }
});

test('real Worker first delta after actual BASE migration preserves historical aliases and both replay protocols', async () => {
  const runtime = await cmsRuntime();
  try {
    const historical = baseValidate(legacyFrameIdentities(baseInitial), baseSeed), oldId = crypto.randomUUID();
    await basePublish(runtime.db, { project: historical, baseVersion: 0, requestId: oldId, actor: runtime.email });
    const token = await runtime.token();
    const call = (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), headers: { 'CF-Access-Jwt-Assertion': token, Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/json' } });
    const status = await checkedResponse(await call('cpu-migration'));
    const artifact = await prepareCpuArtifact(await readCpuSource(runtime.db, 1), status, context);
    await stageCpuArtifact(runtime.db, artifact, context, { readToday: 0, writtenToday: 0 });
    await checkedResponse(await call('cpu-migration', { operationId: artifact.operationId, artifactHash: artifact.artifactHash, action: 'commit' }));
    const state = await checkedResponse(await call('state')), edited = pageEdit(state.project);
    const body = { changes: projectChanges(state.project, edited), baseVersion: 1, requestId: crypto.randomUUID() };
    assert.equal((await checkedResponse(await call('save', body))).version, 2);
    for (const attempt of [body, { project: historical, baseVersion: 0, requestId: oldId }]) assert.equal((await checkedResponse(await call('save', attempt))).replayed, true);
    const changedOld = structuredClone(historical); changedOld.pages[0].description += ' Andra byte';
    const refused = await call('save', { project: changedOld, baseVersion: 0, requestId: oldId });
    assert.equal(refused.status, 409); assert.equal((await refused.json()).details.saveIdentityUnverified, true);
    assert.deepEqual((await readSite(runtime.db, 1, { raw: true })).project, historical);
    const latest = await readSite(runtime.db);
    assert.equal(latest.version, 2);
    assert.deepEqual(latest.project.pages.map(page => page.frameIds), state.project.pages.map(page => page.frameIds));
  } finally { await runtime.close(); }
});

test('current proof reuse leaves input HTML/CSS/frame/source contracts authoritative', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await migrate(runtime);
    const { project } = await current(runtime);
    for (const mutate of [
      draft => { draft.pages[0].html += '<script>alert(1)</script>'; draft.pages[0].facts = { validationKey: 'forged', ids: [] }; },
      draft => { draft.pages[0].css += 'main{background:url(javascript:alert(1))}'; },
      draft => { draft.frame.html = draft.frame.html.replace('data-consent="deny"', 'data-consent="allow"'); },
      draft => { draft.pages[0].sourceId = 'missing-source'; },
      draft => { draft.pages[0].html = draft.pages[0].html.replace('</main>', '<p aria-labelledby="missing-current-label">Text</p></main>'); },
    ]) {
      const draft = structuredClone(project); mutate(draft);
      const response = await runtime.fetch('/admin/api/save', { project: draft, baseVersion: 185, requestId: crypto.randomUUID() });
      assert.equal(response.status, 422, await response.clone().text());
      assert.equal(runtime.sqlite.prepare('SELECT version FROM cms_head').get().version, 185);
    }
  } finally { runtime.close(); }
});

test('proof identity is pinned to version/build/origin/content; missing proofs revalidate and corrupt matching facts surface', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await migrate(runtime);
    const canonical = await readStudioVersion(runtime.db, 185);
    const exact = await current(runtime);
    assert.ok(exact.baseline.validatedFrame);
    const otherOrigin = await readCurrentProject(runtime.db, seed, initial, 'https://other.example');
    assert.equal(otherOrigin.baseline.validatedFrame, undefined);
    assert.deepEqual(otherOrigin.project, exact.project);
    runtime.sqlite.prepare("UPDATE cms_preview_facts SET content_hash='wrong' WHERE target='@frame'").run();
    assert.equal((await current(runtime)).baseline.validatedFrame, undefined);
    runtime.sqlite.prepare("UPDATE cms_preview_facts SET facts='not json' WHERE target=?").run(`page/${exact.project.pages[0].id}`);
    assert.equal((await runtime.fetch('/admin/api/validate', { project: exact.project })).status, 503);
    runtime.sqlite.prepare('DELETE FROM cms_preview_facts').run();
    clearWork(runtime);
    await checkedResponse(await runtime.fetch('/admin/api/validate', { project: exact.project }));
    assert.ok(globalThis.cmsValidationCalls.includes('validateHtml'));
    assert.deepEqual(runtime.blobSizes, [], 'A proof miss does not discard a complete canonical body');
    delete globalThis.cmsValidationCalls;
    runtime.sqlite.prepare("UPDATE cms_studio_heads SET build_key='old-build'").run();
    runtime.blobSizes.length = 0;
    assert.deepEqual((await current(runtime)).project, exact.project);
    assert.ok(runtime.blobSizes.length, 'Mismatched build keeps the ordinary revision path');
    runtime.sqlite.prepare('UPDATE cms_studio_heads SET build_key=?').run(seed.studioKey);
    runtime.sqlite.prepare('DELETE FROM cms_studio_text WHERE part=0').run();
    await assert.rejects(current(runtime), /CMS_STUDIO_TEXT_INCOMPLETE/);
    await assert.rejects(readCurrentResources(runtime.db, seed, initial), /CMS_STUDIO_TEXT_INCOMPLETE/);
    assert.equal(canonical.hash.length, 64);
  } finally { delete globalThis.cmsValidationCalls; runtime.close(); }
});

test('a Save between canonical/proof reads cannot mix head versions or bypass the publication CAS', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await migrate(runtime);
    let raced = false;
    const db = { prepare(sql) {
      const statement = runtime.db.prepare(sql);
      if (sql.startsWith('SELECT f.target,f.content_hash,f.facts')) {
        const all = statement.all;
        statement.all = async () => {
          if (!raced) {
            raced = true;
            await publishSite(runtime.db, { project: initial, baseVersion: 185, requestId: crypto.randomUUID(), actor, studioKey: seed.studioKey });
          }
          return all();
        };
      }
      return statement;
    } };
    const read = await readCurrentProject(db, seed, initial, origin);
    assert.equal(read.version, 185); assert.equal(read.baseline.validatedFrame, undefined);
    assert.equal(runtime.sqlite.prepare('SELECT version FROM cms_head').get().version, 186);
    const response = await runtime.fetch('/admin/api/save', { changes: projectChanges(read.project, pageEdit(read.project)), baseVersion: 185, requestId: crypto.randomUUID() });
    assert.equal(response.status, 409);
    assert.equal(runtime.sqlite.prepare('SELECT version FROM cms_head').get().version, 186);
  } finally { runtime.close(); }
});

test('modern recovery uses the current snapshot while historical and legacy pending payloads keep their fixed raw base', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await migrate(runtime);
    const { project } = await current(runtime), draft = pageEdit(project, 'Fryst ändring');
    const pending = { changes: projectChanges(project, draft), baseVersion: 185, requestId: crypto.randomUUID() };
    clearWork(runtime);
    const currentRecovery = await checkedResponse(await runtime.fetch('/admin/api/recover', { project: draft, baseVersion: 185, pendingSave: pending }));
    assert.deepEqual(runtime.blobSizes, []);
    assert.deepEqual(currentRecovery.pendingSave, pending);
    assert.ok(currentRecovery.pendingProject.pages.find(page => page.path === '/om/').html.includes('Fryst ändring'));
    delete globalThis.cmsValidationCalls;
    const newer = structuredClone(initial); newer.pages.find(page => page.path === '/om/').description = 'Senare publicerad metadata';
    await publishSite(runtime.db, { project: newer, baseVersion: 185, requestId: crypto.randomUUID(), actor, studioKey: seed.studioKey });
    runtime.blobSizes.length = 0;
    const historical = await checkedResponse(await runtime.fetch('/admin/api/recover', { project: draft, baseVersion: 185, pendingSave: pending }));
    assert.ok(runtime.blobSizes.length, 'Historical reconstruction retains its pinned original revision');
    assert.deepEqual(historical.pendingSave, pending);
    assert.notEqual(historical.pendingProject.pages.find(page => page.path === '/om/').description, 'Senare publicerad metadata');
    const legacyPage = structuredClone(raw.pages.find(page => page.path === '/om/')); delete legacyPage.facts;
    legacyPage.description = 'Äldre fryst ändring';
    const legacy = { changes: { pages: { upsert: [legacyPage], remove: [] } }, baseVersion: 185, requestId: crypto.randomUUID() };
    runtime.blobSizes.length = 0;
    const oldRecovery = await checkedResponse(await runtime.fetch('/admin/api/recover', { project: draft, baseVersion: 185, pendingSave: legacy }));
    assert.ok(runtime.blobSizes.length); assert.deepEqual(oldRecovery.pendingSave, legacy);
    assert.equal(oldRecovery.pendingProject.pages.find(page => page.path === '/om/').description, 'Äldre fryst ändring');
  } finally { delete globalThis.cmsValidationCalls; runtime.close(); }
});

test('legacy delta Save retains its raw reconstruction, and confirmed replays precede any broken current copy', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await migrate(runtime);
    const page = structuredClone(raw.pages.find(item => item.path === '/om/')); delete page.facts;
    page.description = 'Äldre flik sparar';
    const body = { changes: { pages: { upsert: [page], remove: [] } }, baseVersion: 185, requestId: crypto.randomUUID() };
    runtime.blobSizes.length = 0;
    assert.equal((await checkedResponse(await runtime.fetch('/admin/api/save', body))).version, 186);
    assert.ok(runtime.blobSizes.length);
    const latest = (await current(runtime)).project;
    const full = { project: pageEdit(latest), baseVersion: 186, requestId: crypto.randomUUID() };
    await checkedResponse(await runtime.fetch('/admin/api/save', full));
    runtime.sqlite.prepare('DELETE FROM cms_studio_text WHERE part=0').run();
    for (const attempt of [body, full]) {
      runtime.queries.length = 0; runtime.blobSizes.length = 0;
      assert.equal((await checkedResponse(await runtime.fetch('/admin/api/save', attempt))).replayed, true);
      assert.deepEqual(runtime.blobSizes, []);
      assert.ok(runtime.queries.every(sql => !/cms_studio_|cms_preview_facts/.test(sql)));
    }
    assert.equal((await runtime.fetch('/admin/api/save', { ...full, project: pageEdit(latest, 'Andra byte') })).status, 409);
    assert.equal((await runtime.fetch('/admin/api/save', { ...full, baseVersion: 187, requestId: crypto.randomUUID() })).status, 503);
  } finally { runtime.close(); }
});

test('mail reads only canonical slot metadata, keeps provider bytes and replay order, and checks current published images', async () => {
  const project = structuredClone(initial), id = crypto.randomUUID(), src = `/media/${id}.png`;
  project.resources.emailStatic = src;
  const runtime = await nodeCms(project, worker);
  try {
    runtime.sqlite.prepare('INSERT INTO cms_media(id,object_key,name,mime,bytes,width,height,alt,sha256,created_at,published_at,validation_version) VALUES(?,?,?,?,1,1,1,?,?,?, ?,1)').run(id, `${id}.png`, 'mail.png', 'image/png', 'Bildens alternativtext', 'a'.repeat(64), new Date().toISOString(), new Date().toISOString());
    await migrate(runtime);
    const env = { CMS_DB: runtime.db, RESEND_API_KEY: 're_localFixture_1234567890', CONTACT_TO: 'owner@example.test', CONTACT_RATE_LIMIT: { limit: async () => ({ success: true }) }, CMS_MEDIA: { delete: async () => {}, list: async () => ({ objects: [], truncated: false }) } };
    const calls = [], transport = async (_url, options) => { calls.push(JSON.parse(options.body)); return Response.json({ id: `receipt-${calls.length}` }); };
    const payload = () => ({ intentVersion: 2, requestId: crypto.randomUUID(), to: ['recipient@example.test'], cc: [], bcc: [], subject: 'Lokalt prov', preheader: 'Resurskontroll', blocks: structuredClone(DEFAULT_EMAIL.templates.receipt.blocks), design: structuredClone(DEFAULT_EMAIL.templates.receipt.design), scheduledAt: null, attachments: [] });
    const send = (body, head) => handleEmailAdmin(new Request(origin + '/admin/api/mail/send', { method: 'POST', headers: { Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env, { identity: { email: actor }, url: new URL(origin + '/admin/api/mail/send'), head, transport });
    const fullHead = async () => normalizeStoredProject((await readSite(runtime.db)).project, seed, initial);
    const smallHead = () => readCurrentResources(runtime.db, seed, initial);
    await checkedResponse(await send(payload(), fullHead));
    const frozen = payload(); runtime.queries.length = 0; runtime.blobSizes.length = 0;
    await checkedResponse(await send(frozen, smallHead));
    assert.deepEqual(calls[1], calls[0], 'Resource-only head renders the identical provider payload');
    assert.deepEqual(runtime.blobSizes, []);
    assert.ok(runtime.queries.every(sql => !/cms_preview_facts|\bt\.body\b|\bSELECT body\b/.test(sql)));
    assert.ok(runtime.queries.some(sql => /cms_studio_heads/.test(sql)));
    runtime.sqlite.prepare('UPDATE cms_media SET alt=? WHERE id=?').run('Uppdaterad alternativtext utan Save', id);
    await checkedResponse(await send(payload(), smallHead));
    assert.notEqual(calls[2].html, calls[1].html, 'Mutable resource metadata is resolved again');
    runtime.sqlite.prepare('UPDATE cms_media SET trashed_at=? WHERE id=?').run(new Date().toISOString(), id);
    await assert.rejects(send(payload(), smallHead), { status: 422 });
    const sent = calls.length; runtime.queries.length = 0;
    await checkedResponse(await send(frozen, smallHead));
    assert.equal(calls.length, sent);
    assert.ok(runtime.queries.every(sql => !/cms_studio_heads/.test(sql)), 'Confirmed mail replays before current resource eligibility');
  } finally { runtime.close(); }
});
