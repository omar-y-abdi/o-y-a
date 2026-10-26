import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { baseInitial, baseSeed, baseValidate, basePublish } from './helpers/base-worker.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { digest, readSite, replayFullSave, publishSite } from '../src/cms/store.mjs';
import { Draft } from '../src/cms/client/draft.mjs';
import { ApiError } from '../src/cms/client/api.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';

async function admin(runtime) {
  const token = await runtime.token();
  return (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, {
    ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
    headers: { 'Cf-Access-Jwt-Assertion': token, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
  });
}

test('F1: accepted placeholder-like comment cannot capture published main content', async () => {
  const runtime = await cmsRuntime();
  try {
    const call = await admin(runtime), project = structuredClone(initial);
    project.frame.html = '<!-- template example: <main></main> -->' + project.frame.html;
    const saved = await call('save', { project, baseVersion: 0, requestId: crypto.randomUUID() });
    assert.equal(saved.status, 200, await saved.clone().text());
    for (const page of project.pages.filter(page => !page.noindex)) {
      const response = await runtime.mf.dispatchFetch(runtime.url + page.path);
      assert.equal(response.status, 200, page.path);
      const html = await response.text(), nodes = elements(parse(html));
      assert.ok(html.includes('<!-- template example: <main></main> -->'));
      assert.equal(nodes.filter(node => node.tagName === 'main').length, 1, page.path);
      const main = nodes.find(node => node.tagName === 'main');
      assert.equal(elements(main).filter(node => node.tagName === 'h1').length, 1, page.path);
    }
  } finally { await runtime.close(); }
});

test('F4: Save reserves game-main IDs without reserving original shared navigation IDs', async () => {
  const runtime = await cmsRuntime();
  try {
    const call = await admin(runtime);
    assert.ok(seed.skiftIds.includes('start-button'));
    assert.ok(seed.skiftIds.includes('modal'));
    assert.ok(!seed.skiftIds.includes('mobile-menu'));
    for (const id of ['start-button', 'modal']) {
      const project = structuredClone(initial);
      project.frame.html = `<div id="${id}" data-cms-node="u-collision"></div>` + project.frame.html;
      const rejected = await call('save', { project, baseVersion: 0, requestId: crypto.randomUUID() });
      assert.equal(rejected.status, 422, await rejected.clone().text());
      assert.match((await rejected.json()).error, /spelets huvudinnehåll/);
      assert.equal(await readSite(runtime.db), null);
    }
    const project = structuredClone(initial);
    project.frame.html = '<div id="unique-frame-id" data-cms-node="u-unique"></div>' + project.frame.html;
    const saved = await call('save', { project, baseVersion: 0, requestId: crypto.randomUUID() });
    assert.equal(saved.status, 200, await saved.clone().text());
    const nodes = elements(parse(await (await runtime.mf.dispatchFetch(runtime.url + '/play/skift/')).text()));
    for (const id of ['start-button', 'modal', 'mobile-menu', 'unique-frame-id']) assert.equal(nodes.filter(node => attribute(node, 'id') === id).length, 1, id);
  } finally { await runtime.close(); }
});

test('F3: actual BASE validator/publisher receipt replays before HEAD policy conversion', async () => {
  const runtime = await cmsRuntime();
  try {
    assert.equal(baseInitial.schemaVersion, 1);
    assert.equal(baseInitial.pages.length, 14);
    assert.equal(initial.pages.length, 13);
    const raw = structuredClone(baseInitial);
    raw.pages[0].description = 'Beskrivning sparad före Worker-bytet.';
    const project = baseValidate(raw, baseSeed, baseInitial);
    assert.deepEqual(project, raw, 'This actual BASE client snapshot is already canonical');
    const requestId = crypto.randomUUID(), body = { project: raw, baseVersion: 0, requestId };
    await basePublish(runtime.db, { project, baseVersion: 0, requestId, actor: runtime.email });
    const oldReplay = await basePublish(runtime.db, { project, baseVersion: 0, requestId, actor: runtime.email });
    assert.equal(oldReplay.replayed, true);
    const stored = await runtime.db.prepare('SELECT payload_hash FROM cms_revisions WHERE request_id=?').bind(requestId).first();
    assert.equal(stored.payload_hash, await digest(JSON.stringify(project)));
    const call = await admin(runtime);
    for (const afterAnotherSave of [false, true]) {
      if (afterAnotherSave) {
        const state = await (await call('state')).json();
        state.project.pages[0].description = 'En senare version.';
        const next = await call('save', { project: state.project, baseVersion: 1, requestId: crypto.randomUUID() });
        assert.equal(next.status, 200, await next.clone().text());
      }
      const retry = await call('save', body);
      assert.equal(retry.status, 200, await retry.clone().text());
      assert.deepEqual(await retry.json(), oldReplay);
      assert.equal((await readSite(runtime.db)).version, afterAnotherSave ? 2 : 1);
    }
    const changed = structuredClone(body);
    changed.project.pages[0].description = 'En annan text med samma identitet.';
    const conflict = await call('save', changed);
    assert.equal(conflict.status, 409);
    assert.deepEqual((await conflict.json()).details, { saveIdentityUnverified: true, recordedVersion: 1 });
    assert.equal((await call('save', { ...body, baseVersion: 1 })).status, 409);
    await assert.rejects(replayFullSave(runtime.db, { requestId, actor: 'another-owner@example.test', baseVersion: 0, project: raw }), error => error.status === 409 && !error.details);
    assert.equal((await runtime.db.prepare('SELECT count(*) AS n FROM cms_revisions').first()).n, 2);
  } finally { await runtime.close(); }
});

test('F3: actual BASE metadata trimming is replayable under its pinned historical contract', async () => {
  const runtime = await cmsRuntime();
  try {
    const raw = structuredClone(baseInitial);
    raw.pages[0].description = '  Äldre text med blanksteg.  ';
    const canonical = baseValidate(raw, baseSeed, baseInitial), requestId = crypto.randomUUID();
    assert.notEqual(JSON.stringify(raw), JSON.stringify(canonical));
    await basePublish(runtime.db, { project: canonical, baseVersion: 0, requestId, actor: runtime.email });
    const body = { project: raw, baseVersion: 0, requestId }, response = await (await admin(runtime))('save', body);
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await response.json()).replayed, true);
    assert.equal((await readSite(runtime.db)).version, 1);
  } finally { await runtime.close(); }
});

test('F3: unprovable historical normalization keeps frozen recovery instead of claiming different content', async () => {
  const runtime = await cmsRuntime();
  try {
    const raw = { ...structuredClone(baseInitial), clientNote: 'A field the historical validator did not retain.' };
    const canonical = baseValidate(raw, baseSeed, baseInitial), requestId = crypto.randomUUID();
    assert.equal(canonical.clientNote, undefined);
    await basePublish(runtime.db, { project: canonical, baseVersion: 0, requestId, actor: runtime.email });
    const body = { project: raw, baseVersion: 0, requestId }, response = await (await admin(runtime))('save', body);
    assert.equal(response.status, 409);
    const result = await response.json();
    assert.equal(result.details.recordedVersion, 1);
    assert.match(result.error, /finns redan som version 1/);
    const draft = new Draft(baseInitial, 0);
    draft.restorePending(body);
    draft.rejectSave(new ApiError(result.error, response.status, result.details));
    assert.deepEqual(draft.pendingSave, body);
    assert.deepEqual(draft.pendingSnapshot, raw);
    assert.equal((await readSite(runtime.db)).version, 1);
  } finally { await runtime.close(); }
});

test('F3: new full Save binds raw envelope despite canonical trimming and rejects changed body', async () => {
  const runtime = await cmsRuntime();
  try {
    const call = await admin(runtime), project = structuredClone(initial);
    project.pages[0].description = '  Ny text med blanksteg.  ';
    const body = { project, baseVersion: 0, requestId: crypto.randomUUID() };
    assert.equal((await call('save', body)).status, 200);
    assert.equal((await readSite(runtime.db)).project.pages[0].description, 'Ny text med blanksteg.');
    const replay = await call('save', body);
    assert.equal(replay.status, 200, await replay.clone().text());
    assert.equal((await replay.json()).replayed, true);
    const changed = structuredClone(body);
    changed.project.pages[0].description = changed.project.pages[0].description.trim();
    const rejected = await call('save', changed);
    assert.equal(rejected.status, 409);
    assert.equal((await rejected.json()).details, undefined, 'New raw identities establish a definite mismatch');
    assert.equal((await runtime.db.prepare('SELECT request_format FROM cms_revisions').first()).request_format, 'full-v1');
    assert.equal((await readSite(runtime.db)).version, 1);
  } finally { await runtime.close(); }
});

test('F3: historical delta receipts cannot masquerade as full-project identities', async () => {
  const runtime = await cmsRuntime();
  try {
    await publishSite(runtime.db, { project: initial, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
    const project = structuredClone(initial);
    project.pages[0].description = 'En äldre delta-sparning.';
    const envelope = { baseVersion: 1, changes: projectChanges(initial, project) }, requestId = crypto.randomUUID();
    // Older Workers recorded raw delta hashes without a request-format column.
    await publishSite(runtime.db, { project, baseVersion: 1, requestId, actor: runtime.email, payloadHash: await digest(JSON.stringify(envelope)) });
    const call = await admin(runtime);
    const forgedFull = await call('save', { project: envelope, baseVersion: 1, requestId });
    assert.equal(forgedFull.status, 409);
    assert.equal((await forgedFull.json()).details.saveIdentityUnverified, true);
    const replay = await call('save', { ...envelope, requestId });
    assert.equal(replay.status, 200, await replay.clone().text());
    assert.equal((await replay.json()).replayed, true);
    assert.equal((await readSite(runtime.db)).version, 2);
  } finally { await runtime.close(); }
});
