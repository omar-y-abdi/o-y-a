import { mkdir, rm, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, basename } from 'node:path';
import { routes, site } from '../src/content/site.mjs';
import { layout } from '../src/templates/layout.mjs';
import { CSP } from '../src/csp.mjs';
import { home } from '../src/templates/home.mjs';
import { workshop, about, furl, contact, notFound } from '../src/templates/pages.mjs';
import { projectDetail } from '../src/templates/expansion.mjs';
import { legal } from '../src/templates/legal.mjs';
import { skift } from '../games/skift/src/page.mjs';
import { developers } from '../src/templates/developers.mjs';
import { openApi } from '../src/content/openapi.mjs';
import { llmsTxt } from '../src/content/llms.mjs';
import { buildCms } from './build-cms.mjs';
import { build } from 'esbuild';
import { buildSkift } from '../games/skift/scripts/build-portfolio.mjs';
import { verifyNotices, verifyBundleNotices } from './third-party-notices.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const thirdPartyNotices = await verifyNotices();
const hash = value => createHash('sha256').update(value).digest('hex').slice(0,12);
await rm('dist', { recursive:true, force:true });
await mkdir('dist/assets', { recursive:true });
await mkdir('.generated', { recursive:true });
await cp('public', 'dist', { recursive:true });
await writeFile('dist/THIRD-PARTY-LICENSES.txt', thirdPartyNotices);
const skiftBuild = await buildSkift();
const skiftApp = `/play/skift/assets/app.js?v=${hash(await readFile('dist/play/skift/assets/app.js'))}`;
const winBundle = await build({ entryPoints: ['src/client/win.mjs'], bundle: true, write: false, format: 'esm', minify: true, target: 'es2022', metafile: true });
const winCode = winBundle.outputFiles[0].text;
const winPath = `/cms-public/win.${hash(winCode)}.mjs`;
await mkdir('dist/cms-public', { recursive:true });
await writeFile(`dist${winPath}`, winCode);
const entries = { main: 'src/client/main.mjs', 'skift-bootstrap': 'src/client/skift-bootstrap.mjs' };
const bundle = await build({
  entryPoints: entries, outdir: 'dist/assets', entryNames: '[name].[hash]', chunkNames: 'chunk.[hash]', outExtension: { '.js': '.mjs' },
  bundle: true, splitting: true, format: 'esm', minify: true, target: 'es2022', metafile: true,
  plugins: [{ name: 'lazy-assets', setup(builder) {
    builder.onResolve({ filter: /^\.\/win\.mjs$/ }, () => ({ path: winPath, external: true }));
    builder.onResolve({ filter: /^\/play\/skift\/assets\/app\.js$/ }, () => ({ path: skiftApp, external: true }));
  } }],
});
const js = Object.fromEntries(Object.entries(entries).map(([name, entry]) => [name, basename(Object.keys(bundle.metafile.outputs).find(path => bundle.metafile.outputs[path].entryPoint === entry))]));
const baseStyles = await Promise.all(['base','home','pages'].map(name => readFile(`src/styles/${name}.css`,'utf8')));
const baseCss = baseStyles.join('\n').trim();
const additions = { home:['showcase','toys'], workshop:['toys','games'], skift:['skift'], about:['showcase'], blade:['showcase'], backhaul:['showcase'], contact:['postbox'] };
const styles = {};
for (const template of new Set(routes.map(page => page.template))) {
  const extra = await Promise.all((additions[template] || []).map(name => readFile(`src/styles/${name}.css`,'utf8')));
  const shared = template === 'skift' ? [await readFile('dist/play/skift/assets/app.css', 'utf8'), baseStyles[0]] : [baseCss];
  if (template === 'skift') await rm('dist/play/skift/assets/app.css');
  const css = [...shared, ...extra].join('\n');
  const cssPath = `/assets/site.${hash(css)}.css`;
  await writeFile('dist' + cssPath,css);
  styles[template] = cssPath;
}
const renderers = { home, workshop, skift, about, furl, contact, developers, notFound, blade:projectDetail, backhaul:projectDetail };
for (const page of routes) {
  const content = (renderers[page.template] || legal)(page);
  const destination = page.noindex ? 'dist/404.html' : `dist${page.path}index.html`;
  await mkdir(dirname(destination), { recursive:true });
  await writeFile(destination,layout(page,content,{css:styles[page.template], main:`/assets/${js.main}`}));
}
await writeFile('dist/_headers',`/*\n  Content-Security-Policy: ${CSP}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/play/skift/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/play/skift/audio/*\n  Cache-Control: public, max-age=86400\n`);
await writeFile('dist/openapi.json',JSON.stringify(openApi,null,2)+'\n');
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${site.origin}/sitemap.xml\n`);
const indexed = routes.filter(page => !page.noindex);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map(page => `  <url><loc>${site.origin}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('dist/llms.txt',llmsTxt(indexed,site));
const cms = await buildCms({ styles, js });
for (const graph of [skiftBuild, winBundle.metafile, bundle.metafile]) await verifyBundleNotices(graph);
await writeFile('.generated/build.json',JSON.stringify({routes:indexed.map(page => page.path),js,styles,cms,skift:skiftBuild},null,2));
console.log(`Built ${routes.length} public pages, ${Object.keys(js).length} public entry points, and the isolated CMS editor.`);
