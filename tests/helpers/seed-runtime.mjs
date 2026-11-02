import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

// Real workerd request ownership with explicit test acknowledgements. The
// production loader/asset binding are unchanged; signed API coverage uses
// cmsRuntime separately. No waitUntil keeps the abandoned request alive.
export async function seedRuntime({ assetFetch, observe = async () => {} }) {
  const bundle = await build({ stdin: { resolveDir: process.cwd(), contents: `
    import { loadAdminSeed } from './src/cms/admin-seed.mjs';
    import { errorResponse } from './src/cms/http.mjs';
    export default { async fetch(request, env) {
      const pending = loadAdminSeed(env);
      pending.catch(() => {});
      await env.OBSERVE.fetch(request);
      if (new URL(request.url).pathname === '/abandon') return new Response('handler-ended');
      try { return Response.json(await pending); }
      catch (error) { return errorResponse(error, 'seed-fixture'); }
    } };
  ` }, bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022' });
  const mf = new Miniflare(convertV4MiniflareOptions({
    host: '127.0.0.1', port: 0, modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-09-11',
    assets: { directory: 'dist', binding: 'STATIC_ASSETS', run_worker_first: true, routerConfig: { has_user_worker: true }, assetConfig: { html_handling: 'force-trailing-slash', not_found_handling: '404-page' } },
    serviceBindings: {
      ASSETS: request => assetFetch(request, async () => (await mf.getBindings()).STATIC_ASSETS.fetch(request)),
      OBSERVE: async request => { await observe(new URL(request.url).pathname); return new Response(null, { status: 204 }); },
    },
  }));
  try { return { mf, url: (await mf.ready).origin, close: () => mf.dispose() }; }
  catch (error) { await mf.dispose(); throw error; }
}
