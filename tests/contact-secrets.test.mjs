import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { decryptSecret, readContactSettings, SECRET_NAMES, signFileLink, verifyFileLink, writeContactSecrets } from '../src/server/contact-secrets.mjs';
import { handleEmailAdmin } from '../src/cms/email-api.mjs';
import { handleContact } from '../src/server/contact.mjs';
import { errorResponse } from '../src/cms/http.mjs';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';

let runtime, authorization;
before(async () => { runtime = await cmsRuntime(); authorization = await runtime.token(); });
after(async () => { await runtime?.close(); });

const origin = 'https://omaryusuf.se';
const MASTER = 'm'.repeat(48);
const SECRETS = { RESEND_API_KEY: 're_secretValue_1234567890', CONTACT_TO: 'owner@example.org', TURNSTILE_SITE_KEY: '0xsiteKey_123456', TURNSTILE_SECRET_KEY: '0xturnstileSecret_123456' };
const PRIVATE = [SECRETS.RESEND_API_KEY, SECRETS.TURNSTILE_SECRET_KEY];
const identity = { email: 'owner@example.test', subject: 'owner-fixture' };
const env = (extra = {}) => ({ CMS_DB: runtime.db, CONTACT_HASH_SECRET: MASTER, CONTACT_RATE_LIMIT: { limit: async () => ({ success: true }) }, ...extra });
const admin = async (e, path, body, { transport = async () => { throw new Error('unexpected provider call'); } } = {}) => {
  const url = new URL(origin + path);
  const request = new Request(url, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  try { return await handleEmailAdmin(request, e, { identity, url, head: async () => ({}), transport, now: () => Date.parse('2026-10-24T10:00:00Z') }); }
  catch (error) { return errorResponse(error, 'mail'); }
};
const visitor = { name: 'Ada Lovelace', email: 'ada@example.net', message: 'En idé', website: '', token: 'verified-token', submission: '6c77eb01-9260-4e9c-8a72-262b520ee1b1' };
const contactRequest = () => new Request(origin + '/api/contact', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify(visitor) });
const recorder = () => { const calls = []; return { calls, fetch: async (url, init) => { calls.push({ url, init }); return url.includes('siteverify') ? Response.json({ success: true, hostname: 'omaryusuf.se', action: 'contact' }) : Response.json({ data: [{ id: 'a' }, { id: 'b' }] }); } }; };
const clear = () => runtime.db.prepare('DELETE FROM cms_contact_secrets').run();
const count = async () => (await runtime.db.prepare('SELECT COUNT(*) AS n FROM cms_contact_secrets').first()).n;
const bytes = value => new Uint8Array(value);
const encodings = row => [Buffer.from(bytes(row.ciphertext)).toString('base64'), Buffer.from(bytes(row.ciphertext)).toString('base64url'), Buffer.from(bytes(row.ciphertext)).toString('hex'), Buffer.from(bytes(row.iv)).toString('hex')];

test('module has no console calls', async () => {
  for (const file of ['src/server/contact-secrets.mjs', 'src/cms/email-api.mjs']) assert.doesNotMatch(await readFile(file, 'utf8'), /console\./, file);
});

test('missing master refuses to save', async () => {
  await clear();
  for (const master of [undefined, 'x'.repeat(31)]) {
    const response = await admin(env({ CONTACT_HASH_SECRET: master }), '/admin/api/contact', { values: { RESEND_API_KEY: SECRETS.RESEND_API_KEY } });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'Huvudnyckeln saknas. Inget sparades.');
    assert.equal(await count(), 0);
  }
  const view = await (await admin(env({ CONTACT_HASH_SECRET: undefined }), '/admin/api/contact')).json();
  assert.equal(view.master, 'missing');
  assert.equal(view.ready, false);
  const upload = await signFileLink(env({ CONTACT_HASH_SECRET: undefined }), crypto.randomUUID(), 1).then(() => null, error => error.status);
  assert.equal(upload, 503);
});

test('invalid formats save nothing', async () => {
  await clear();
  for (const values of [{ RESEND_API_KEY: 'sk_1234567890' }, { RESEND_API_KEY: 're_abc defghijk' }, { CONTACT_TO: 'not-an-address' }, { TURNSTILE_SITE_KEY: 'site' }, { TURNSTILE_SECRET_KEY: '0x short secret' }, { UNKNOWN: 'x' }, { CONTACT_TO: SECRETS.CONTACT_TO, RESEND_API_KEY: 42 }]) {
    const response = await admin(env(), '/admin/api/contact', { values });
    assert.equal(response.status, 422, JSON.stringify(values));
    assert.equal(await count(), 0);
  }
  const draft = structuredClone(DEFAULT_EMAIL);
  draft.sender.local = 'hej@evil.example';
  const calls = [];
  const response = await admin(env(SECRETS), '/admin/api/mail/test', { requestId: crypto.randomUUID(), template: 'receipt', email: draft }, { transport: async (...args) => { calls.push(args); return Response.json({ id: 'x' }); } });
  assert.equal(response.status, 422);
  assert.equal(calls.length, 0);
});

test('saved value wins, emptied falls back to env', async () => {
  await clear();
  const fromEnv = 're_fromEnvironment_123';
  await writeContactSecrets(env(), { RESEND_API_KEY: SECRETS.RESEND_API_KEY }, identity.email);
  let settings = await readContactSettings(env({ RESEND_API_KEY: fromEnv }));
  assert.equal(settings.values.RESEND_API_KEY, SECRETS.RESEND_API_KEY);
  assert.equal(settings.states.RESEND_API_KEY, 'saved');
  assert.ok(settings.updatedAt.RESEND_API_KEY);
  await writeContactSecrets(env(), { RESEND_API_KEY: '' }, identity.email);
  settings = await readContactSettings(env({ RESEND_API_KEY: fromEnv }));
  assert.equal(settings.values.RESEND_API_KEY, fromEnv);
  assert.equal(settings.states.RESEND_API_KEY, 'environment');
  assert.equal(settings.states.CONTACT_TO, 'missing');
  assert.equal(await count(), 0);
});

test('missing table means env only; any other D1 error closes everything', async () => {
  const thrown = { prepare() { throw new Error('D1_ERROR: no such table: cms_contact_secrets'); } };
  for (const CMS_DB of [thrown, undefined]) {
    const settings = await readContactSettings({ CMS_DB, CONTACT_HASH_SECRET: MASTER, RESEND_API_KEY: 're_onlyEnvironment_1' });
    assert.equal(settings.states.RESEND_API_KEY, 'environment');
    assert.equal(settings.values.RESEND_API_KEY, 're_onlyEnvironment_1');
    assert.equal(settings.states.CONTACT_TO, 'missing');
  }
  const rejected = { prepare: () => ({ all: async () => { throw new Error('D1_ERROR: storage failed'); } }) };
  const e = { ...env(SECRETS), CMS_DB: rejected };
  const settings = await readContactSettings(e);
  for (const name of SECRET_NAMES) {
    assert.equal(settings.states[name], 'unreadable', name);
    assert.equal(settings.values[name], undefined, name);
  }
  const provider = recorder();
  assert.equal((await handleContact(contactRequest(), e, provider.fetch)).status, 503);
  assert.equal(provider.calls.length, 0);
});

test('tampered, moved or foreign-key ciphertext is unreadable and closes the form', async () => {
  const fallback = { RESEND_API_KEY: 're_envFallback_12345', TURNSTILE_SECRET_KEY: '0xenvFallback_12345', CONTACT_TO: 'env@example.org', TURNSTILE_SITE_KEY: '0xenvSite_1234567' };
  const scenarios = [
    ['flipped byte', 'RESEND_API_KEY', MASTER, async () => {
      const row = await runtime.db.prepare("SELECT ciphertext FROM cms_contact_secrets WHERE name = 'RESEND_API_KEY'").first();
      const flipped = bytes(row.ciphertext).slice(); flipped[0] ^= 1;
      await runtime.db.prepare("UPDATE cms_contact_secrets SET ciphertext = ? WHERE name = 'RESEND_API_KEY'").bind(flipped.buffer).run();
    }],
    ['moved row', 'TURNSTILE_SECRET_KEY', MASTER, async () => {
      const row = await runtime.db.prepare("SELECT iv, ciphertext FROM cms_contact_secrets WHERE name = 'RESEND_API_KEY'").first();
      await runtime.db.prepare("UPDATE cms_contact_secrets SET iv = ?, ciphertext = ? WHERE name = 'TURNSTILE_SECRET_KEY'").bind(bytes(row.iv).slice().buffer, bytes(row.ciphertext).slice().buffer).run();
    }],
    ['other master', 'RESEND_API_KEY', 'n'.repeat(48), async () => {}],
  ];
  for (const [label, name, master, tamper] of scenarios) {
    await clear();
    await writeContactSecrets(env(), SECRETS, identity.email);
    await tamper();
    const e = env({ ...fallback, CONTACT_HASH_SECRET: master });
    const settings = await readContactSettings(e);
    assert.equal(settings.states[name], 'unreadable', label);
    assert.equal(settings.values[name], undefined, label);
    const row = await runtime.db.prepare('SELECT iv, ciphertext FROM cms_contact_secrets WHERE name = ?').bind(name).first();
    assert.deepEqual(await decryptSecret(master, name, row), { ok: false }, label);
    const provider = recorder();
    const response = await handleContact(contactRequest(), e, provider.fetch);
    assert.equal(response.status, 503, label);
    assert.equal(provider.calls.length, 0, label);
    assert.equal((await (await admin(e, '/admin/api/contact')).json()).values[name].state, 'unreadable', label);
  }
});

test('api never echoes ciphertext', async () => {
  await clear();
  const view = await (await admin(env(), '/admin/api/contact', { values: SECRETS })).json();
  assert.deepEqual(Object.keys(view), ['master', 'rateLimit', 'forwarding', 'ready', 'values']);
  assert.deepEqual(Object.keys(view.values), [...SECRET_NAMES]);
  for (const name of SECRET_NAMES) assert.deepEqual(Object.keys(view.values[name]), ['state', 'hint', 'updatedAt', ...(['TURNSTILE_SITE_KEY', 'CONTACT_TO'].includes(name) ? ['value'] : [])], name);
  assert.equal(view.ready, true);
  assert.equal(view.values.RESEND_API_KEY.state, 'saved');
  assert.equal(view.values.RESEND_API_KEY.hint, SECRETS.RESEND_API_KEY.slice(-4));
  assert.equal(view.values.CONTACT_TO.value, SECRETS.CONTACT_TO);
});

test('secrets never leave the server', async () => {
  await clear();
  const logged = [];
  const methods = ['log', 'info', 'warn', 'error', 'debug'];
  const originals = Object.fromEntries(methods.map(method => [method, console[method]]));
  for (const method of methods) console[method] = (...args) => { logged.push(args.map(String).join(' ')); };
  const bodies = [];
  try {
    bodies.push(await (await admin(env(), '/admin/api/contact', { values: SECRETS })).text());
    bodies.push(await (await admin(env(), '/admin/api/contact')).text());
    const leaky = async () => Response.json({ name: 'validation_error', message: `Bad key ${SECRETS.RESEND_API_KEY} and re_other_key_value` }, { status: 422 });
    bodies.push(await (await admin(env(), '/admin/api/mail/test', { requestId: crypto.randomUUID(), template: 'notification', email: null }, { transport: leaky })).text());
    const provider = recorder();
    bodies.push(await (await handleContact(contactRequest(), env(), provider.fetch)).text());
    assert.equal(provider.calls.length, 2);
  } finally { for (const method of methods) console[method] = originals[method]; }
  assert.match(bodies[2], /\[nyckel\]/);
  const headers = { 'Cf-Access-Jwt-Assertion': authorization, Origin: origin };
  for (const path of ['/admin/api/state', '/admin/api/history', '/admin/api/revision/0']) bodies.push(await (await runtime.mf.dispatchFetch(origin + path, { headers })).text());
  const rows = (await runtime.db.prepare('SELECT name, iv, ciphertext FROM cms_contact_secrets').all()).results;
  assert.equal(rows.length, 4);
  const forbidden = [...PRIVATE, ...rows.flatMap(encodings)];
  for (const text of [...bodies, ...logged]) for (const value of forbidden) assert.ok(!text.includes(value), `leaked ${value.slice(0, 6)}…`);
  for (const row of rows) {
    const stored = Buffer.from(bytes(row.ciphertext)).toString('latin1') + Buffer.from(bytes(row.iv)).toString('latin1');
    for (const value of Object.values(SECRETS)) assert.ok(!stored.includes(value));
  }
});

test('signed links bind id and expiry', async () => {
  const id = crypto.randomUUID(), exp = 2000000000;
  const link = new URL(await signFileLink(env(), id, exp), origin);
  const [, , linkId, linkExp] = link.pathname.split('/');
  const sig = link.searchParams.get('token');
  assert.equal(linkId, id);
  assert.equal(link.pathname, `/mail-file/${id}/${exp}`);
  assert.ok(!link.pathname.includes(sig));
  assert.equal(sig.length, 43);
  assert.equal(await verifyFileLink(env(), id, linkExp, sig, exp - 10), true);
  assert.equal(await verifyFileLink(env(), crypto.randomUUID(), linkExp, sig, exp - 10), false);
  assert.equal(await verifyFileLink(env(), id, String(exp + 1), sig, exp - 10), false);
  assert.equal(await verifyFileLink(env(), id, linkExp, sig, exp + 1), false);
  assert.equal(await verifyFileLink(env({ CONTACT_HASH_SECRET: 'n'.repeat(48) }), id, linkExp, sig, exp - 10), false);
  assert.equal(await verifyFileLink(env(), id, linkExp, (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1), exp - 10), false);
});

test('controlled master rotation requires settings re-entry and invalidates old links', async () => {
  await clear();
  await writeContactSecrets(env(), SECRETS, identity.email);
  const id = crypto.randomUUID(), exp = 2000000000;
  const previous = new URL(await signFileLink(env(), id, exp), origin);
  const rotated = env({ ...SECRETS, CONTACT_HASH_SECRET: 'r'.repeat(48) });
  const unavailable = await readContactSettings(rotated);
  for (const name of SECRET_NAMES) {
    assert.equal(unavailable.states[name], 'unreadable');
    assert.equal(unavailable.values[name], undefined, 'saved ciphertext must not fall back to environment values');
  }
  assert.equal(await verifyFileLink(rotated, id, String(exp), previous.searchParams.get('token'), exp - 1), false);
  // Reverting the master before any writes restores the original ciphertext.
  assert.deepEqual((await readContactSettings(env())).values, SECRETS);
  await writeContactSecrets(rotated, SECRETS, identity.email);
  assert.deepEqual((await readContactSettings(rotated)).values, SECRETS);
  const next = new URL(await signFileLink(rotated, id, exp), origin);
  assert.equal(await verifyFileLink(rotated, id, String(exp), next.searchParams.get('token'), exp - 1), true);
  for (const name of SECRET_NAMES) assert.equal((await readContactSettings(env())).states[name], 'unreadable', 'rollback after re-entry also requires matching saved ciphertext');
});
