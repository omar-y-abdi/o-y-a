import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { readFile, readdir } from 'node:fs/promises';

export async function migrateCmsDb(db) {
  for (const file of (await readdir('migrations')).filter(name => name.endsWith('.sql')).sort()) await db.exec(await readFile(`migrations/${file}`, 'utf8'));
}

// A real Worker, D1, R2 and signed JWT. Only the outbound JWKS origin is
// replaced by a local identity fixture. No auth bypass exists in product code.
export async function cmsRuntime({ port = 0, persist = false } = {}) {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const key = { ...await exportJWK(publicKey), kid: 'local-fixture', alg: 'RS256', use: 'sig' };
  const team = 'https://cms-test.cloudflareaccess.com';
  const email = 'owner@example.test';
  const audience = 'cms-local-tests';
  const bundle = await build({ entryPoints: ['src/worker.mjs'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022' });
  const options = {
    host: '127.0.0.1', port, modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-09-11',
    bindings: { CMS_ACCESS_TEAM: team, CMS_ACCESS_AUD: audience, CMS_ADMIN_EMAIL: email, CMS_STAGE: 'true', PREVIEW_ORIGIN: `http://127.0.0.1:${port}`, ANALYTICS_ENABLED: 'false' },
    assets: { directory: 'dist', binding: 'ASSETS', run_worker_first: true, routerConfig: { has_user_worker: true }, assetConfig: { html_handling: 'force-trailing-slash', not_found_handling: '404-page' } },
    d1Databases: ['CMS_DB'], r2Buckets: ['CMS_MEDIA'], images: { binding: 'CMS_IMAGES' },
    ...(persist ? { d1Persist: 'output/cms-local/d1', r2Persist: 'output/cms-local/r2' } : {}),
    outboundService: async request => request.url === `${team}/cdn-cgi/access/certs` ? Response.json({ keys: [key] }) : new Response('Unexpected outbound request', { status: 502 }),
  };
  const mf = new Miniflare(convertV4MiniflareOptions(options));
  await mf.ready;
  if (port === 0) {
    const address = await mf.ready;
    options.port = Number(address.port);
    options.bindings.PREVIEW_ORIGIN = address.origin;
    await mf.setOptions(convertV4MiniflareOptions(options));
  }
  const db = await mf.getD1Database('CMS_DB');
  await migrateCmsDb(db);
  const token = async (overrides = {}) => new SignJWT({ email, type: 'app', ...overrides }).setProtectedHeader({ alg: 'RS256', kid: key.kid }).setIssuer(team).setAudience(audience).setSubject('owner-fixture').setIssuedAt().setExpirationTime('1h').sign(privateKey);
  return { mf, db, email, token, url: (await mf.ready).origin, close: () => mf.dispose() };
}
