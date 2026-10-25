import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { cleanupMailFiles, discardMailUpload, maintainMailFiles, removeMailFile, sweepMailOrphans, MAIL_CLEANUP_LIMIT, MAIL_FILE_LIFETIME } from '../src/cms/mail-files.mjs';

let runtime, bucket, clock;
const START = Date.parse('2026-10-24T10:00:00Z');
const iso = ms => new Date(ms).toISOString();
const key = id => 'mail-private/' + id;
const env = extra => ({ CMS_DB: runtime.db, CMS_MEDIA: bucket, ...extra });
const row = id => runtime.db.prepare('SELECT * FROM cms_mail_files WHERE id = ?').bind(id).first();
const cursor = () => runtime.db.prepare('SELECT cursor, version FROM cms_mail_cleanup WHERE id = 1').first();

before(async () => { runtime = await cmsRuntime({ scheduled: true }); });
after(async () => { await runtime?.close(); });
beforeEach(async () => {
  clock = START;
  await runtime.db.exec('DELETE FROM cms_mail_files;');
  await runtime.db.exec("UPDATE cms_mail_cleanup SET cursor = '', version = 0 WHERE id = 1;");
  const objects = new Map(), deletes = [], lists = [];
  bucket = {
    objects, deletes, lists,
    async delete(keys) { deletes.push([keys].flat()); for (const item of [keys].flat()) objects.delete(item); },
    async list(options) {
      lists.push(options);
      const remaining = [...objects.values()].sort((a, b) => a.key.localeCompare(b.key)).filter(item => item.key.startsWith(options.prefix) && (!options.cursor || item.key > options.cursor));
      const selected = remaining.slice(0, options.limit);
      return { objects: selected, truncated: remaining.length > selected.length, cursor: selected.at(-1)?.key ?? '' };
    },
  };
});

function object({ id = crypto.randomUUID(), uploaded = START - MAIL_FILE_LIFETIME - 1 } = {}) {
  bucket.objects.set(key(id), { key: key(id), uploaded: new Date(uploaded) });
  return id;
}

async function file({ expires = START - 1, state = 'ready', claimed = null, id = object() } = {}) {
  await runtime.db.prepare('INSERT INTO cms_mail_files(id,object_key,name,mime,bytes,created_at,expires_at,state,claimed_by) VALUES(?,?,?,?,?,?,?,?,?)').bind(id, key(id), 'fixture.pdf', 'application/pdf', 10, iso(START - 1000), iso(expires), state, claimed).run();
  return id;
}

test('expiry claims rows before R2 deletion and preserves unexpired scheduled files', async () => {
  const expired = await file(), staging = await file({ state: 'uploading' });
  const scheduled = await file({ expires: START + 86400000, claimed: 'mail/scheduled' });
  const unexpired = await file({ expires: START + 1 });
  const remove = bucket.delete;
  bucket.delete = async keys => {
    for (const id of [expired, staging]) assert.equal((await row(id)).state, 'deleting');
    await remove(keys);
  };
  await cleanupMailFiles(env(), () => clock);
  for (const id of [expired, staging]) { assert.equal(await row(id), null); assert.equal(bucket.objects.has(key(id)), false); }
  for (const id of [scheduled, unexpired]) { assert.equal((await row(id)).state, 'ready'); assert.ok(bucket.objects.has(key(id))); }
});

test('R2 failure retains a terminal D1 claim and a later invocation retries it', async () => {
  const id = await file(), remove = bucket.delete;
  bucket.delete = async () => { throw new Error('R2_ERROR: unavailable'); };
  await assert.rejects(cleanupMailFiles(env(), () => clock), /R2_ERROR/);
  assert.equal((await row(id)).state, 'deleting');
  assert.ok(bucket.objects.has(key(id)));
  bucket.delete = remove;
  await cleanupMailFiles(env(), () => ++clock);
  assert.equal(await row(id), null);
  assert.equal(bucket.objects.has(key(id)), false);
});

test('D1 failure after successful R2 deletion remains retryable', async () => {
  const id = await file();
  const db = { prepare(sql) {
    if (sql.startsWith('DELETE FROM cms_mail_files')) return { bind() { return this; }, async run() { throw new Error('D1_ERROR: unavailable'); } };
    return runtime.db.prepare(sql);
  } };
  await assert.rejects(cleanupMailFiles(env({ CMS_DB: db }), () => clock), /D1_ERROR/);
  assert.equal((await row(id)).state, 'deleting');
  assert.equal(bucket.objects.has(key(id)), false);
  await cleanupMailFiles(env(), () => ++clock);
  assert.equal(await row(id), null);
});

test('cleanup is bounded and failed older work does not starve the next page', async () => {
  const first = [], next = [];
  for (let index = 0; index < MAIL_CLEANUP_LIMIT; index++) first.push(await file({ expires: START - 10 }));
  for (let index = 0; index < MAIL_CLEANUP_LIMIT; index++) next.push(await file({ expires: START - 1 }));
  const remove = bucket.delete;
  bucket.delete = async keys => { assert.equal(keys.length, MAIL_CLEANUP_LIMIT); throw new Error('R2_ERROR: unavailable'); };
  await assert.rejects(cleanupMailFiles(env(), () => clock), /R2_ERROR/);
  for (const id of first) assert.equal((await row(id)).state, 'deleting');
  for (const id of next) assert.equal((await row(id)).state, 'ready');
  bucket.delete = remove;
  await cleanupMailFiles(env(), () => ++clock);
  for (const id of first) assert.ok(await row(id));
  for (const id of next) assert.equal(await row(id), null);
});

test('overlapping cleaners can safely delete the same terminal claim', { timeout: 10000 }, async () => {
  const id = await file(), firstEntered = Promise.withResolvers(), releaseFirst = Promise.withResolvers();
  const remove = bucket.delete;
  let calls = 0;
  bucket.delete = async keys => { if (++calls === 1) { firstEntered.resolve(); await releaseFirst.promise; } await remove(keys); };
  const first = cleanupMailFiles(env(), () => clock);
  await firstEntered.promise;
  await cleanupMailFiles(env(), () => clock + 1);
  releaseFirst.resolve();
  await first;
  assert.equal(await row(id), null);
  assert.equal(bucket.objects.has(key(id)), false);
});

test('manual removal is terminal before storage deletion and cannot take a send claim', async t => {
  t.mock.method(console, 'error', () => {});
  const id = await file({ expires: START + 86400000 }), claimed = await file({ expires: START + 86400000, claimed: 'mail/in-flight' });
  const remove = bucket.delete;
  bucket.delete = async () => { throw new Error('R2_ERROR: unavailable'); };
  assert.equal(await removeMailFile(env(), id, () => clock), true);
  assert.equal((await row(id)).state, 'deleting');
  assert.equal(await removeMailFile(env(), id, () => clock), false);
  assert.equal(await removeMailFile(env(), claimed, () => clock), false);
  assert.equal((await row(claimed)).state, 'ready');
  bucket.delete = remove;
  await cleanupMailFiles(env(), () => ++clock);
  assert.equal(await row(id), null);
  assert.ok(await row(claimed));
});

test('discarding a late PUT also removes its object when the staging row is already gone', async () => {
  const id = await file({ state: 'uploading' });
  await cleanupMailFiles(env(), () => clock);
  object({ id, uploaded: clock }); // The old request's R2 PUT completes late.
  await discardMailUpload(env(), id, () => clock);
  assert.equal(await row(id), null);
  assert.equal(bucket.objects.has(key(id)), false);
});

test('append-only mail migrations retain historical claims and conservatively classify old intents', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(await readFile('migrations/0007_contact_mail.sql', 'utf8'));
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO cms_mail_files(id,object_key,name,mime,bytes,created_at,expires_at,claimed_by) VALUES(?,?,?,?,?,?,?,?)').run(id, key(id), 'retained.pdf', 'application/pdf', 15, iso(START), iso(START + 86400000), 'mail/historical');
    db.prepare('INSERT INTO cms_sent_mail(request_id,kind,recipients,subject,sender,created_at,actor) VALUES(?,?,?,?,?,?,?)').run('mail/historical', 'custom', '{"to":[]}', 'Retained', 'owner', iso(START), 'owner');
    const previous = { ...db.prepare('SELECT * FROM cms_mail_files').get() };
    db.exec(await readFile('migrations/0008_mail_send_attempts.sql', 'utf8'));
    db.exec(await readFile('migrations/0009_mail_file_lifecycle.sql', 'utf8'));
    assert.deepEqual({ ...db.prepare('SELECT * FROM cms_mail_files').get() }, { ...previous, state: 'ready', deleting_at: null });
    assert.equal(db.prepare('SELECT send_attempts FROM cms_sent_mail').get().send_attempts, 1);
    assert.deepEqual({ ...db.prepare('SELECT * FROM cms_mail_cleanup').get() }, { id: 1, cursor: '', version: 0 });
  } finally { db.close(); }
});

test('orphan sweep only deletes old unregistered private keys', async () => {
  const old = object(), recent = object({ uploaded: START - MAIL_FILE_LIFETIME + 1 });
  const ready = await file({ expires: START + 86400000 });
  const staging = await file({ state: 'uploading', expires: START + 86400000 });
  const scheduled = await file({ expires: START + 30 * 86400000, claimed: 'mail/scheduled' });
  bucket.objects.set('public-other/key', { key: 'public-other/key', uploaded: new Date(0) });
  await sweepMailOrphans(env(), () => clock);
  assert.equal(bucket.objects.has(key(old)), false);
  for (const id of [recent, ready, staging, scheduled]) assert.ok(bucket.objects.has(key(id)));
  assert.ok(bucket.objects.has('public-other/key'));
  assert.deepEqual(bucket.lists, [{ prefix: 'mail-private/', limit: MAIL_CLEANUP_LIMIT }]);
  assert.deepEqual(await cursor(), { cursor: '', version: 1 });
});

test('orphan cursor reaches later pages, wraps, and revisits failed objects', async () => {
  const ids = Array.from({ length: MAIL_CLEANUP_LIMIT + 1 }, () => object()).sort();
  const remove = bucket.delete;
  bucket.delete = async () => { throw new Error('R2_ERROR: unavailable'); };
  await assert.rejects(sweepMailOrphans(env(), () => clock), /R2_ERROR/);
  assert.equal((await cursor()).cursor, key(ids[MAIL_CLEANUP_LIMIT - 1]));
  bucket.delete = remove;
  await sweepMailOrphans(env(), () => clock);
  assert.equal(bucket.objects.has(key(ids.at(-1))), false);
  assert.equal((await cursor()).cursor, '');
  await sweepMailOrphans(env(), () => clock);
  assert.equal(bucket.objects.size, 0);
});

test('an old orphan scan cannot overwrite cursor progress after a full wrap', { timeout: 10000 }, async () => {
  for (let index = 0; index <= MAIL_CLEANUP_LIMIT; index++) object({ uploaded: START });
  const list = bucket.list, firstEntered = Promise.withResolvers(), releaseFirst = Promise.withResolvers();
  let calls = 0;
  bucket.list = async options => {
    const result = await list(options);
    if (++calls === 1) { firstEntered.resolve(); await releaseFirst.promise; }
    return result;
  };
  const old = sweepMailOrphans(env(), () => clock);
  await firstEntered.promise;
  await sweepMailOrphans(env(), () => clock);
  await sweepMailOrphans(env(), () => clock);
  assert.deepEqual(await cursor(), { cursor: '', version: 2 });
  releaseFirst.resolve();
  await old;
  assert.deepEqual(await cursor(), { cursor: '', version: 2 });
});

test('a failed membership read never deletes registered objects', async () => {
  const id = object();
  const db = { prepare(sql) {
    if (sql.startsWith('SELECT object_key FROM cms_mail_files')) return { bind() { return this; }, async all() { throw new Error('D1_ERROR: unavailable'); } };
    return runtime.db.prepare(sql);
  } };
  await assert.rejects(sweepMailOrphans(env({ CMS_DB: db }), () => clock), /D1_ERROR/);
  assert.ok(bucket.objects.has(key(id)));
  assert.deepEqual(bucket.deletes, []);
});

test('maintenance continues orphan recovery when the expired-row batch fails', async t => {
  t.mock.method(console, 'error', () => {});
  const id = object();
  const db = { prepare(sql) {
    if (sql.startsWith('UPDATE cms_mail_files')) return { bind() { return this; }, async all() { throw new Error('D1_ERROR: unavailable'); } };
    return runtime.db.prepare(sql);
  } };
  await assert.rejects(maintainMailFiles(env({ CMS_DB: db }), () => clock), /maintenance failed/);
  assert.equal(bucket.objects.has(key(id)), false);
});

test('real R2 pagination continues after the previous page objects were deleted', async () => {
  const r2 = await runtime.mf.getR2Bucket('CMS_MEDIA');
  const ids = Array.from({ length: MAIL_CLEANUP_LIMIT + 1 }, () => crypto.randomUUID());
  await Promise.all(ids.map(id => r2.put(key(id), 'orphan fixture')));
  const later = Date.now() + MAIL_FILE_LIFETIME + 1000;
  const e = env({ CMS_MEDIA: r2 });
  await sweepMailOrphans(e, () => later);
  assert.equal((await r2.list({ prefix: 'mail-private/' })).objects.length, 1);
  assert.ok((await cursor()).cursor);
  await sweepMailOrphans(e, () => later);
  assert.equal((await r2.list({ prefix: 'mail-private/' })).objects.length, 0);
  assert.equal((await cursor()).cursor, '');
});

test('real Worker scheduled handler expires a private upload with no later mail request', async () => {
  const r2 = await runtime.mf.getR2Bucket('CMS_MEDIA');
  const id = await file({ expires: 0 });
  await r2.put(key(id), 'private expired attachment');
  const response = await fetch(runtime.url + '/cdn-cgi/local/scheduled?format=json');
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal((await response.json()).outcome, 'ok');
  assert.equal(await row(id), null);
  assert.equal(await r2.head(key(id)), null);
});
