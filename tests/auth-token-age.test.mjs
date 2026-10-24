import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from 'jose';
import { authenticateAdmin } from '../src/cms/auth.mjs';
import { api, upload } from '../src/cms/client/api.mjs';

const issuer = 'https://portfolio.cloudflareaccess.com';
const env = { CMS_ACCESS_TEAM: issuer, CMS_ACCESS_AUD: 'portfolio-admin', CMS_ADMIN_EMAIL: 'owner@example.test' };
const keys = await generateKeyPair('RS256');
const jwks = createLocalJWKSet({ keys: [{ ...await exportJWK(keys.publicKey), alg: 'RS256', kid: 'fixture' }] });
const now = () => Math.floor(Date.now() / 1000);
const signed = issuedMinutesAgo => new SignJWT({ email: env.CMS_ADMIN_EMAIL, type: 'app' })
  .setProtectedHeader({ alg: 'RS256', kid: 'fixture' }).setIssuer(issuer).setAudience(env.CMS_ACCESS_AUD)
  .setSubject('owner-id').setIssuedAt(now() - issuedMinutesAgo * 60).setExpirationTime(now() + 60).sign(keys.privateKey);
const request = token => new Request('https://omaryusuf.se/admin/api/state', { headers: { 'Cf-Access-Jwt-Assertion': token } });

test('A10: an Access session older than one hour is refused, a 59 minute one is accepted', async () => {
  await assert.rejects(authenticateAdmin(request(await signed(61)), env, { jwks }), error => error.status === 401);
  assert.equal((await authenticateAdmin(request(await signed(59)), env, { jwks })).email, env.CMS_ADMIN_EMAIL);
});

async function withFetch(respond, run) {
  const original = globalThis.fetch, calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return respond(url, init); };
  try { await run(calls); } finally { globalThis.fetch = original; }
}

test('A10: every studio fetch carries X-Requested-With so Access answers 401, not a redirect', async () => {
  await withFetch(() => Response.json({ ok: true }, { status: 201 }), async calls => {
    await api('state');
    await api('save', { changes: {} });
    await upload(new File([new Uint8Array(12)], 'a.png'), crypto.randomUUID());
    assert.equal(calls.length, 3);
    for (const { init } of calls) assert.equal(init.headers['X-Requested-With'], 'XMLHttpRequest');
  });
});

test('A10: a failed fetch becomes status 0 with the retry text; an Access 401 keeps its status', async () => {
  await withFetch(() => { throw new TypeError('Failed to fetch'); }, async () => {
    await assert.rejects(api('save', {}), error => error.status === 0 && error.message === 'Anslutningen bröts. Försök spara igen; samma version sparas inte två gånger.');
  });
  await withFetch(() => new Response('Unauthorized', { status: 401 }), async () => {
    await assert.rejects(api('save', {}), error => error.status === 401 && /Inloggningen har gått ut/.test(error.message));
  });
});

test('A10: upload() maps a failed fetch and a non-JSON Access response like the other calls', async () => {
  const file = new File([new Uint8Array(12)], 'a.png');
  await withFetch(() => { throw new TypeError('Failed to fetch'); }, async () => {
    await assert.rejects(upload(file, crypto.randomUUID()), error => error.status === 0 && error.message === 'Anslutningen bröts. Försök spara igen; samma version sparas inte två gånger.');
  });
  for (const [status, message] of [[401, 'Inloggningen har gått ut. Ditt utkast finns kvar.'], [502, 'Svaret kunde inte bekräftas. Ditt utkast finns kvar.']]) {
    await withFetch(() => new Response('<html>', { status }), async () => {
      await assert.rejects(upload(file, crypto.randomUUID()), error => error.status === status && error.message === message);
    });
  }
});

test('A10: a 2xx whose body is not JSON is an unknown outcome, status 0 with the retry text', async () => {
  const retry = 'Anslutningen bröts. Försök spara igen; samma version sparas inte två gånger.';
  await withFetch(() => new Response('<html>', { status: 200 }), async () => {
    await assert.rejects(api('save', {}), error => error.status === 0 && error.message === retry);
  });
  await withFetch(() => new Response('<html>', { status: 201 }), async () => {
    await assert.rejects(upload(new File([new Uint8Array(12)], 'a.png'), crypto.randomUUID()), error => error.status === 0 && error.message === retry);
  });
});
