import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { readFile, readdir } from 'node:fs/promises';
import { publishSite } from '../../src/cms/store.mjs';
import { toFrameProject } from '../../src/cms/frame-converter.mjs';
import { validateProject } from '../../src/cms/project.mjs';
import { seed } from '../../.generated/cms-seed.mjs';

export async function migrateCmsDb(db) {
  for (const file of (await readdir('migrations')).filter(name => name.endsWith('.sql')).sort()) await db.exec(await readFile(`migrations/${file}`, 'utf8'));
}

// A real Worker, D1, R2 and signed JWT. Only the outbound JWKS origin is
// replaced by a local identity fixture. No auth bypass exists in product code.
export async function cmsRuntime({ port = 0, persist = false, project, analytics = false, scheduled = false, assetFetch } = {}) {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const key = { ...await exportJWK(publicKey), kid: 'local-fixture', alg: 'RS256', use: 'sig' };
  const team = 'https://cms-test.cloudflareaccess.com';
  const email = 'owner@example.test';
  const audience = 'cms-local-tests';
  const bundle = await build({ entryPoints: ['src/worker.mjs'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022' });
  const options = {
    host: '127.0.0.1', port, modules: true, script: bundle.outputFiles[0].text, unsafeTriggerHandlers: scheduled,
    compatibilityDate: '2026-09-11',
    bindings: { CMS_ACCESS_TEAM: team, CMS_ACCESS_AUD: audience, CMS_ADMIN_EMAIL: email, CMS_STAGE: 'true', PREVIEW_ORIGIN: `http://127.0.0.1:${port}`, ANALYTICS_ENABLED: String(analytics) },
    assets: { directory: 'dist', binding: assetFetch ? 'STATIC_ASSETS' : 'ASSETS', run_worker_first: true, routerConfig: { has_user_worker: true }, assetConfig: { html_handling: 'force-trailing-slash', not_found_handling: '404-page' } },
    ...(assetFetch ? { serviceBindings: { ASSETS: request => assetFetch(request, async () => (await mf.getBindings()).STATIC_ASSETS.fetch(request)) } } : {}),
    d1Databases: ['CMS_DB'], r2Buckets: ['CMS_MEDIA'], images: { binding: 'CMS_IMAGES' },
    ...(analytics ? { analyticsEngineDatasets: { ANALYTICS: { dataset: 'cms-local-tests' } } } : {}),
    ...(persist ? { d1Persist: 'output/cms-local/d1', r2Persist: 'output/cms-local/r2' } : {}),
    outboundService: async request => request.url === `${team}/cdn-cgi/access/certs` ? Response.json({ keys: [key] }) : new Response('Unexpected outbound request', { status: 502 }),
  };
  const mf = new Miniflare(convertV4MiniflareOptions(options));
  try {
    const address = await mf.ready;
    if (port === 0) {
      options.port = Number(address.port);
      options.bindings.PREVIEW_ORIGIN = address.origin;
      await mf.setOptions(convertV4MiniflareOptions(options));
    }
    const db = await mf.getD1Database('CMS_DB');
    await migrateCmsDb(db);
    if (project) await publishSite(db, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: email });
    const token = async (overrides = {}, expiresAt = '1h') => new SignJWT({ email, type: 'app', ...overrides }).setProtectedHeader({ alg: 'RS256', kid: key.kid }).setIssuer(team).setAudience(audience).setSubject('owner-fixture').setIssuedAt().setExpirationTime(expiresAt).sign(privateKey);
    return { mf, db, email, token, url: (await mf.ready).origin, close: () => mf.dispose() };
  } catch (error) {
    await mf.dispose();
    throw error;
  }
}

export async function publicRuntime(options = {}) {
  const project = JSON.parse(await readFile(new URL('../fixtures/cms-v185-project.json', import.meta.url), 'utf8'));
  return cmsRuntime({ project: validateProject(toFrameProject(project, seed), seed), ...options });
}
