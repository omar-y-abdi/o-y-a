import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { transitionAsset } from '../src/cms/asset-lifecycle.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';

let runtime, bucket;
const project = () => structuredClone(initial);
const media = id => runtime.db.prepare('SELECT * FROM cms_media WHERE id = ?').bind(id).first();
const queued = id => runtime.db.prepare('SELECT * FROM cms_media_delete_queue WHERE id = ?').bind(id).first();
const head = async () => (await runtime.db.prepare('SELECT version FROM cms_head WHERE id = 1').first()).version;
const environment = extra => ({ CMS_DB: runtime.db, CMS_MEDIA: bucket, ...extra });

before(async () => { runtime = await cmsRuntime(); bucket = await runtime.mf.getR2Bucket('CMS_MEDIA'); });
after(async () => { await runtime?.close(); });
beforeEach(async () => { await runtime.db.exec('DELETE FROM cms_media_delete_queue;'); });

async function legacyDelete({ retainRow = false, historical = false } = {}) {
  const id = crypto.randomUUID(), key = `${id}.png`, now = new Date().toISOString();
  await bucket.put(key, 'historical object');
  await runtime.db.prepare('INSERT INTO cms_media(id,object_key,name,mime,bytes,width,height,alt,sha256,created_at,version,validation_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, key, 'history.png', 'image/png', 17, 1, 1, '', 'a'.repeat(64), now, 3, 1).run();
  if (historical) {
    const referenced = project();
    referenced.pages[0].html = referenced.pages[0].html.replace('</main>', `<img src="/media/${key}" alt="Historical fixture"></main>`);
    await publishSite(runtime.db, { project: referenced, baseVersion: await head(), requestId: crypto.randomUUID(), actor: runtime.email });
  }
  await runtime.db.prepare('UPDATE cms_media SET trashed_at = ? WHERE id = ?').bind(now, id).run();
  const snapshot = await media(id);
  await runtime.db.prepare('INSERT INTO cms_media_delete_queue(id,object_key,snapshot,created_at) VALUES(?,?,?,?)').bind(id, key, JSON.stringify(snapshot), now).run();
  if (!retainRow) await runtime.db.prepare('DELETE FROM cms_media WHERE id = ?').bind(id).run();
  return { id, key, snapshot, input: { id, action: 'delete', baseVersion: snapshot.version, baseSiteVersion: await head(), project: project() } };
}

test('a historical delete queue resumes through the canonical reservation and removes both records', async () => {
  const { id, key, input } = await legacyDelete();
  const observed = [];
  const result = await transitionAsset(environment({ CMS_MEDIA: { async delete(value) {
    const current = await media(id);
    observed.push(current.deleting_at);
    assert.ok(current.trashed_at);
    assert.equal(await queued(id), null, 'queue has atomically handed ownership to the canonical row');
    await bucket.delete(value);
  } } }), input);
  assert.equal(result.deleted, true);
  assert.equal(observed.length, 1);
  assert.ok(observed[0]);
  assert.equal(await media(id), null);
  assert.equal(await queued(id), null);
  assert.equal(await bucket.head(key), null);
});

test('non-delete actions cannot execute an old queued deletion', async () => {
  const { id, key, input } = await legacyDelete();
  for (const action of ['archive', 'restore', 'trash']) await assert.rejects(transitionAsset(environment(), { ...input, action }), error => error.status === 404);
  assert.ok(await queued(id));
  assert.equal(await media(id), null);
  assert.ok(await bucket.head(key));
});

test('queue handoff preserves an existing matching record and its newer metadata', async () => {
  const { id, key, input } = await legacyDelete({ retainRow: true });
  await runtime.db.prepare('UPDATE cms_media SET name = ?, version = version + 1 WHERE id = ?').bind('Renamed after recovery.png', id).run();
  input.baseVersion++;
  assert.equal((await transitionAsset(environment({ CMS_MEDIA: { async delete(value) {
    assert.equal((await media(id)).name, 'Renamed after recovery.png');
    assert.equal(await queued(id), null);
    await bucket.delete(value);
  } } }), input)).deleted, true);
  assert.equal(await media(id), null);
  assert.equal(await bucket.head(key), null);
});

test('a queued deletion restores metadata but preserves bytes referenced by the draft or retained history', async () => {
  for (const historical of [false, true]) {
    const { id, key, input } = await legacyDelete({ historical });
    if (!historical) input.project.pages[0].html = input.project.pages[0].html.replace('</main>', `<img src="/media/${key}" alt="Draft fixture"></main>`);
    await assert.rejects(transitionAsset(environment(), input), error => error.status === 409 && /används/.test(error.message));
    assert.ok(await media(id), 'recover canonical metadata even when deletion is forbidden');
    assert.equal((await media(id)).deleting_at, null);
    assert.equal(await queued(id), null);
    assert.ok(await bucket.head(key));
  }
});

test('stale head and stale resource version leave the queued snapshot untouched', async () => {
  for (const stale of ['head', 'resource']) {
    const { id, key, input } = await legacyDelete();
    const original = await queued(id);
    if (stale === 'resource') input.baseVersion++;
    else input.baseSiteVersion++;
    await assert.rejects(transitionAsset(environment(), input), error => error.status === 409);
    assert.deepEqual(await queued(id), original);
    assert.equal(await media(id), null);
    assert.ok(await bucket.head(key));
  }
});

test('head changes immediately before queue adoption cannot consume its snapshot', async () => {
  const { id, key, input } = await legacyDelete();
  let first = true;
  const db = { prepare: sql => runtime.db.prepare(sql), async batch(statements) {
    if (first) {
      first = false;
      await publishSite(runtime.db, { project: project(), baseVersion: await head(), requestId: crypto.randomUUID(), actor: runtime.email });
    }
    return runtime.db.batch(statements);
  } };
  await assert.rejects(transitionAsset(environment({ CMS_DB: db }), input), error => error.status === 409);
  assert.ok(await queued(id));
  assert.equal(await media(id), null);
  assert.ok(await bucket.head(key));
});

test('invalid snapshots and conflicting canonical identities do not change either record', async () => {
  for (const invalid of ['json', 'identity', 'key', 'current']) {
    const { id, key, input, snapshot } = await legacyDelete({ retainRow: invalid === 'current' });
    if (invalid === 'json') await runtime.db.prepare('UPDATE cms_media_delete_queue SET snapshot = ? WHERE id = ?').bind('{broken', id).run();
    if (invalid === 'identity') await runtime.db.prepare('UPDATE cms_media_delete_queue SET snapshot = ? WHERE id = ?').bind(JSON.stringify({ ...snapshot, id: crypto.randomUUID() }), id).run();
    if (invalid === 'key') await runtime.db.prepare('UPDATE cms_media_delete_queue SET object_key = ? WHERE id = ?').bind('mail-private/' + id, id).run();
    if (invalid === 'current') await runtime.db.prepare('UPDATE cms_media SET sha256 = ? WHERE id = ?').bind('b'.repeat(64), id).run();
    const previous = { queue: await queued(id), media: await media(id) };
    await assert.rejects(transitionAsset(environment(), input), error => [409, 503].includes(error.status));
    assert.deepEqual({ queue: await queued(id), media: await media(id) }, previous);
    assert.ok(await bucket.head(key));
  }
});

test('queue adoption rolls back completely when a statement in its D1 transaction fails', async () => {
  const { id, key, input } = await legacyDelete();
  const db = { prepare: sql => runtime.db.prepare(sql), batch: statements => runtime.db.batch([...statements, runtime.db.prepare('SELECT * FROM missing_recovery_table')]) };
  await assert.rejects(transitionAsset(environment({ CMS_DB: db }), input), /missing_recovery_table/);
  assert.equal(await media(id), null);
  assert.ok(await queued(id));
  assert.ok(await bucket.head(key));
});

test('R2 failure after queue adoption retains the canonical deletion claim for retry', async () => {
  const { id, key, input } = await legacyDelete();
  await assert.rejects(transitionAsset(environment({ CMS_MEDIA: { async delete() { throw new Error('R2_ERROR: unavailable'); } } }), input), /R2_ERROR/);
  assert.equal(await queued(id), null);
  assert.ok((await media(id)).deleting_at);
  assert.ok(await bucket.head(key));
  assert.equal((await transitionAsset(environment(), input)).deleted, true);
  assert.equal(await media(id), null);
  assert.equal(await bucket.head(key), null);
});

test('a delayed duplicate adoption cannot resurrect metadata after deletion', { timeout: 10000 }, async () => {
  const { id, key, input } = await legacyDelete();
  const entered = Promise.withResolvers(), resume = Promise.withResolvers();
  const db = { prepare: sql => runtime.db.prepare(sql), async batch(statements) { entered.resolve(); await resume.promise; return runtime.db.batch(statements); } };
  const delayed = transitionAsset(environment({ CMS_DB: db }), input);
  await entered.promise;
  try {
    assert.equal((await transitionAsset(environment(), input)).deleted, true);
    assert.equal(await queued(id), null);
    assert.equal(await media(id), null);
  } finally { resume.resolve(); }
  assert.equal((await delayed).deleted, true);
  assert.equal(await queued(id), null);
  assert.equal(await media(id), null);
  assert.equal(await bucket.head(key), null);
});
