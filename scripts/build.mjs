import { mkdir, rm, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { routes, site } from '../src/content/site.mjs';
import { layout, structuredData } from '../src/templates/layout.mjs';
import { home } from '../src/templates/home.mjs';
import { workshop, about, furl, contact, notFound } from '../src/templates/pages.mjs';
import { projectDetail } from '../src/templates/expansion.mjs';
import { legal } from '../src/templates/legal.mjs';
import { buildCms } from './build-cms.mjs';
import { build, transform } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const hash = value => createHash('sha256').update(value).digest('hex').slice(0,12);
await rm('dist', { recursive:true, force:true });
await mkdir('dist/assets', { recursive:true });
await mkdir('.generated', { recursive:true });
await cp('public', 'dist', { recursive:true });
const winBundle = await build({ entryPoints: ['src/client/win.mjs'], bundle: true, write: false, format: 'esm', minify: true, target: 'es2022' });
const winCode = winBundle.outputFiles[0].text;
const winPath = `/cms-public/win.${hash(winCode)}.mjs`;
await mkdir('dist/cms-public', { recursive:true });
await writeFile(`dist${winPath}`, winCode);
const js = {};
for (const name of ['privacy','copy','cards','playlogic','memory','games','joy','contact','main']) {
  let code = await readFile(`src/client/${name}.mjs`, 'utf8');
  code = code.replaceAll("'./win.mjs'", `'${winPath}'`);
  for (const [dependency, filename] of Object.entries(js)) code = code.replaceAll(`'./${dependency}.mjs'`, `'./${filename}'`);
  code = (await transform(code, { minify: true, format: 'esm', target: 'es2022' })).code;
  const filename = `${name}.${hash(code)}.mjs`;
  await writeFile(`dist/assets/${filename}`,code);
  js[name] = filename;
}
const baseCss = (await Promise.all(['base','home','pages'].map(name => readFile(`src/styles/${name}.css`,'utf8')))).join('\n').trim();
const additions = { home:['showcase','toys'], workshop:['toys','games'], about:['showcase'], blade:['showcase'], backhaul:['showcase'], contact:['postbox'] };
const styles = {};
for (const template of new Set(routes.map(page => page.template))) {
  const extra = await Promise.all((additions[template] || []).map(name => readFile(`src/styles/${name}.css`,'utf8')));
  const css = [baseCss,...extra].join('\n');
  const cssPath = `/assets/site.${hash(css)}.css`;
  await writeFile('dist' + cssPath,css);
  styles[template] = cssPath;
}
const renderers = { home, workshop, about, furl, contact, notFound, blade:projectDetail, backhaul:projectDetail };
for (const page of routes) {
  const content = (renderers[page.template] || legal)(page);
  const destination = page.noindex ? 'dist/404.html' : `dist${page.path}index.html`;
  await mkdir(dirname(destination), { recursive:true });
  await writeFile(destination,layout(page,content,{css:styles[page.template], main:`/assets/${js.main}`}));
}
const scriptHashes = routes.map(page => `'sha256-${createHash('sha256').update(structuredData(page)).digest('base64')}'`);
const csp = ["default-src 'self'", `script-src 'self' https://challenges.cloudflare.com ${scriptHashes.join(' ')}`, "style-src 'self'", "style-src-attr 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'", "connect-src 'self' https://challenges.cloudflare.com", "frame-src https://challenges.cloudflare.com", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"].join('; ');
await writeFile('.generated/csp.mjs',`export const CSP = ${JSON.stringify(csp)};\n`);
await writeFile('dist/_headers',`/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${site.origin}/sitemap.xml\n`);
const indexed = routes.filter(page => !page.noindex);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map(page => `  <url><loc>${site.origin}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('dist/llms.txt',`# Omar Yusuf\n\n> Personlig webbplats för Omar Yusuf, maskiningenjör med intresse för kod, automation och mekatronik.\n\n## Sidor\n${indexed.map(page => `- [${page.name}](${site.origin}${page.path}): ${page.description}`).join('\n')}\n\n## Offentliga projekt\n- [Furl](${site.furl}): Projektets egen dokumentation är källan för aktuella funktioner och begränsningar.\n\nGlädjeverkstaden innehåller förskrivna skämt och uppmuntrande texter, inte personlig eller professionell rådgivning. Webbplatsen representerar en person, inte en verifierad lokal verksamhet.\n`);
const cms = await buildCms({ styles, js });
await writeFile('.generated/build.json',JSON.stringify({routes:indexed.map(page => page.path),js,styles,cms},null,2));
console.log(`Built ${routes.length} public pages, ${Object.keys(js).length} native public modules, and the isolated CMS editor.`);
