import { test } from 'vitest';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from 'jose';
import { authenticateAdmin, accessConfig } from '../src/cms/auth.mjs';
import { readJson, requireWriteRequest, HttpError } from '../src/cms/http.mjs';

const issuer = 'https://portfolio.cloudflareaccess.com';
const env = { CMS_ACCESS_TEAM: issuer, CMS_ACCESS_AUD: 'portfolio-admin', CMS_ADMIN_EMAIL: 'owner@example.test' };
const keys = await generateKeyPair('RS256');
const jwks = createLocalJWKSet({ keys: [{ ...await exportJWK(keys.publicKey), alg: 'RS256', kid: 'fixture' }] });
async function signed(claims = {}, options = {}) {
  return new SignJWT({ email: env.CMS_ADMIN_EMAIL, type: 'app', ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'fixture' })
    .setIssuer(options.issuer ?? issuer).setAudience(options.audience ?? env.CMS_ACCESS_AUD)
    .setSubject('owner-id').setIssuedAt().setExpirationTime(options.expiry ?? '5m')
    .sign(options.key ?? keys.privateKey);
}
const request = token => new Request('https://omaryusuf.se/admin/api/state', { headers: token ? { 'Cf-Access-Jwt-Assertion': token } : {} });

test('valid signed owner identity is accepted and returns no token', async () => {
  const identity = await authenticateAdmin(request(await signed()), env, { jwks });
  assert.deepEqual(identity, { email: env.CMS_ADMIN_EMAIL, subject: 'owner-id' });
});

test('missing configuration fails closed before consulting request identity', async () => {
  for (const key of Object.keys(env)) {
    const incomplete = { ...env, [key]: '' };
    await assert.rejects(authenticateAdmin(request(await signed()), incomplete, { jwks }), error => error instanceof HttpError && error.status === 503);
  }
});

test('Access configuration requires an exact HTTPS team authority and one owner', () => {
  for (const team of ['http://portfolio.cloudflareaccess.com', 'https://portfolio.cloudflareaccess.com.evil.test', 'https://user@portfolio.cloudflareaccess.com', 'https://portfolio.cloudflareaccess.com/path', 'https://portfolio.cloudflareaccess.com:8443']) {
    assert.throws(() => accessConfig({ ...env, CMS_ACCESS_TEAM: team }), HttpError);
  }
  for (const email of ['', '*@example.test', 'owner@example.test,other@example.test', 'owner@example.test\nother@example.test']) {
    assert.throws(() => accessConfig({ ...env, CMS_ADMIN_EMAIL: email }), HttpError);
  }
});

test('missing, malformed, wrong-owner, expired and mis-scoped assertions are denied', async () => {
  const attempts = [undefined, 'garbage', await signed({ email: 'attacker@example.test' }), await signed({ email: undefined }), await signed({}, { issuer: 'https://other.cloudflareaccess.com' }), await signed({}, { audience: 'other-app' }), await signed({}, { expiry: Math.floor(Date.now() / 1000) - 10 })];
  for (const token of attempts) {
    await assert.rejects(authenticateAdmin(request(token), env, { jwks }), error => error instanceof HttpError && error.status === 401);
  }
});

test('a forged signature and an Access service identity cannot impersonate owner', async () => {
  const other = await generateKeyPair('RS256');
  for (const token of [await signed({}, { key: other.privateKey }), await signed({ type: 'service', common_name: 'automation' })]) {
    await assert.rejects(authenticateAdmin(request(token), env, { jwks }), error => error.status === 401);
  }
});

test('owner identity cannot be supplied through unsigned headers or query parameters', async () => {
  const forged = new Request('https://omaryusuf.se/admin/api/state?email=owner@example.test', { headers: { 'Cf-Access-Authenticated-User-Email': env.CMS_ADMIN_EMAIL, 'X-Admin': 'true', Cookie: 'admin=true' } });
  await assert.rejects(authenticateAdmin(forged, env, { jwks }), error => error.status === 401);
});

test('private image requests may use a cryptographically verified Access cookie', async () => {
  const cookieRequest = new Request('https://omaryusuf.se/media/private.png', { headers: { Cookie: `CF_Authorization=${await signed()}` } });
  assert.equal((await authenticateAdmin(cookieRequest, env, { jwks })).email, env.CMS_ADMIN_EMAIL);
  const duplicate = new Request(cookieRequest, { headers: { Cookie: `CF_Authorization=invalid; CF_Authorization=${await signed()}` } });
  await assert.rejects(authenticateAdmin(duplicate, env, { jwks }), error => error.status === 401);
});

function writeRequest(headers = {}, method = 'POST', body = '{}') {
  return new Request('https://omaryusuf.se/admin/api/save', { method, headers: { Origin: 'https://omaryusuf.se', 'Content-Type': 'application/json', 'X-CMS-Request': '1', ...headers }, body });
}

test('write requests require exact origin, non-simple header and JSON', () => {
  assert.doesNotThrow(() => requireWriteRequest(writeRequest()));
  for (const headers of [{ Origin: 'https://evil.test' }, { Origin: 'https://sub.omaryusuf.se' }, { Origin: 'null' }, { Origin: '' }, { 'X-CMS-Request': '' }, { 'Content-Type': 'text/plain' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
    assert.throws(() => requireWriteRequest(writeRequest(headers)), HttpError);
  }
});

test('JSON reader handles UTF-8 byte limits, malformed JSON and length lies', async () => {
  assert.deepEqual(await readJson(writeRequest({}, 'POST', '{"text":"räv"}'), 100), { text: 'räv' });
  await assert.rejects(readJson(writeRequest({}, 'POST', '{"text":"😀😀😀"}'), 16), error => error.status === 413);
  await assert.rejects(readJson(writeRequest({ 'Content-Length': '99999' }), 100), error => error.status === 413);
  await assert.rejects(readJson(writeRequest({}, 'POST', '{bad}'), 100), error => error.status === 400);
  const invalidUtf8 = new Request('https://omaryusuf.se/admin/api/save', { method: 'POST', body: new Uint8Array([0xff]) });
  await assert.rejects(readJson(invalidUtf8, 100), error => error.status === 400);
});

test('streamed body without Content-Length cannot evade its byte ceiling', async () => {
  let cancelled = false;
  const body = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(32)); }, cancel() { cancelled = true; } });
  const req = new Request('https://omaryusuf.se/admin/api/save', { method: 'POST', body, duplex: 'half' });
  await assert.rejects(readJson(req, 64), error => error.status === 413);
  assert.equal(cancelled, true);
});
