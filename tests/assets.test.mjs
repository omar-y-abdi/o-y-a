import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import * as css from 'css-tree';
import { routes, site } from '../src/content/site.mjs';
import { CSP, SKIFT_CSP } from '../src/csp.mjs';

async function htmlFor(route) {
  return readFile(route.noindex ? 'dist/404.html' : `dist${route.path}index.html`, 'utf8');
}

test('every internal link and fragment resolves to a built page or asset', async () => {
  for (const route of routes) {
    const html = await htmlFor(route);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(match[1].replaceAll('&amp;', '&'), site.origin + route.path);
      if (url.origin !== site.origin) continue;
      let file = 'dist' + url.pathname;
      if (url.pathname.endsWith('/')) file += 'index.html';
      assert.ok((await stat(file)).isFile(), `${route.path}: missing ${file}`);
      if (url.hash) {
        const target = await readFile(file, 'utf8');
        assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${route.path}: missing fragment ${url}`);
      }
    }
  }
});

test('native module imports resolve to content-hashed files with no source maps', async () => {
  const files = await readdir('dist/assets');
  assert.ok(files.every(name => !name.endsWith('.map')));
  for (const file of files) {
    assert.match(file, /^(?:[a-z-]+\.[A-Z0-9]{8}\.mjs|site\.[a-f0-9]{12}\.css)$/);
    const code = await readFile(join('dist/assets', file), 'utf8');
    assert.ok(!code.includes('sourceMappingURL'));
    for (const match of code.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)["']\.\/([^"']+)["']/g)) {
      assert.ok(files.includes(match[1]), `Missing imported module ${match[1]}`);
    }
    for (const match of code.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)["'](\/(?:cms-public|play\/skift\/assets)\/[^"']+)["']/g)) {
      const path = match[1].startsWith('/play/skift/assets/') ? new URL(match[1], site.origin).pathname : match[1];
      assert.ok((await stat('dist' + path)).isFile(), `Missing lazy module ${match[1]}`);
    }
  }
});

test('public shell has one shared dependency and a separate lazy SKIFT entry', async () => {
  const files = await readdir('dist/assets');
  const entry = name => files.find(file => file.startsWith(name + '.') && file.endsWith('.mjs'));
  const main = entry('main'), bootstrap = entry('skift-bootstrap');
  assert.ok(main && bootstrap);
  const mainCode = await readFile(join('dist/assets', main), 'utf8');
  const bootstrapCode = await readFile(join('dist/assets', bootstrap), 'utf8');
  const imports = code => [...code.matchAll(/(?:from\s*|import\s*)["']\.\/([^"']+)["']/g)].map(match => match[1]);
  const shared = imports(mainCode);
  assert.equal(shared.length, 1, 'HTML → main → shared copy is the complete static shell graph');
  assert.deepEqual(imports(bootstrapCode), shared, 'Both entries must share one copy loader/cache');
  assert.deepEqual(imports(await readFile(join('dist/assets', shared[0]), 'utf8')), []);
  assert.ok(mainCode.includes(`import("./${bootstrap}")`), 'SKIFT stays a dynamic import');
  const app = bootstrapCode.match(/import\(["'](\/play\/skift\/assets\/app\.js\?v=[a-f0-9]{12})["']\)/)?.[1];
  assert.ok(app, 'The lazy game import must carry its content hash');
  const appHash = createHash('sha256').update(await readFile('dist/play/skift/assets/app.js')).digest('hex').slice(0, 12);
  assert.equal(new URL(app, site.origin).searchParams.get('v'), appHash);
  assert.doesNotMatch(mainCode, /\/play\/skift\/assets\/app\.js/);
});

test('built home CSS keeps the focused dialog closer absolutely positioned', async () => {
  const html = await htmlFor(routes.find(route => route.path === '/'));
  const stylesheet = html.match(/rel="stylesheet" href="(\/assets\/site\.[a-f0-9]{12}\.css)"/)?.[1];
  assert.ok(stylesheet, 'Built home must link its content-hashed site stylesheet');
  let position;
  css.walk(css.parse(await readFile('dist' + stylesheet, 'utf8')), { visit: 'Rule', enter(rule) {
    if (rule.prelude?.type !== 'SelectorList') return;
    rule.prelude.children.forEach(selector => {
      if (css.generate(selector) !== '.dialog-close:focus-visible') return;
      rule.block.children.forEach(declaration => {
        if (declaration.type === 'Declaration' && declaration.property === 'position') position = css.generate(declaration.value);
      });
    });
  } });
  assert.equal(position, 'absolute', 'Focus styling must not move the dialog pointer target before release');
});

test('SKIFT caches versioned assets and daily audio without shipping duplicate CSS', async () => {
  const headers = await readFile('dist/_headers', 'utf8');
  assert.ok(headers.includes('/play/skift/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n'));
  assert.ok(headers.includes('/play/skift/audio/*\n  Cache-Control: public, max-age=86400\n'));
  assert.ok(!(await readdir('dist/play/skift/assets')).includes('app.css'));
});

test('public CSP constants permit external scripts and inert data blocks only', async () => {
  assert.equal(CSP.split('; ').find(directive => directive.startsWith('script-src ')), "script-src 'self' https://challenges.cloudflare.com");
  assert.equal(SKIFT_CSP, CSP + "; media-src 'self' blob:");
  assert.ok((await readFile('dist/_headers', 'utf8')).includes(`Content-Security-Policy: ${CSP}\n`));
  for (const route of routes) {
    const html = await htmlFor(route);
    const visit = node => {
      if (node.tagName === 'script') {
        const attrs = Object.fromEntries(node.attrs.map(attr => [attr.name, attr.value]));
        assert.ok(attrs.src || ['application/ld+json', 'application/json'].includes(attrs.type), `${route.path}: inline executable script`);
      }
      for (const child of node.childNodes ?? []) visit(child);
      if (node.content) visit(node.content);
    };
    visit(parse(html));
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(match[1]);
      assert.equal(data['@context'], 'https://schema.org');
      assert.ok(data['@graph'].some(node => node['@type'] === 'Person' && node.name === 'Omar Yusuf'));
      assert.ok(!match[1].includes('LocalBusiness'), 'A private person is not an invented local business');
    }
    assert.equal((html.match(/<script[^>]*src=/g) || []).length, 1);
    assert.ok(!/<(?:iframe|video)\b/i.test(html));
  }
});

test('robots, sitemap and llms list canonical pages but not the error page', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  const robots = await readFile('dist/robots.txt', 'utf8');
  const llms = await readFile('dist/llms.txt', 'utf8');
  for (const route of routes.filter(route => !route.noindex)) {
    assert.ok(sitemap.includes(`<loc>${site.origin}${route.path}</loc>`));
    assert.ok(llms.includes(site.origin + route.path));
  }
  assert.ok(!sitemap.includes('/404'));
  for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) assert.equal(new URL(loc).search, '');
  assert.ok(robots.includes('Disallow: /api/'));
  assert.ok(robots.includes(`Sitemap: ${site.origin}/sitemap.xml`));
});

test('social image has the promised PNG dimensions and icons really exist', async () => {
  for (const [path, width, height] of [['dist/social/omar-yusuf.png',1200,630],['dist/apple-touch-icon.png',180,180]]) {
    const png = await readFile(path);
    assert.equal(png.subarray(1,4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16),width);
    assert.equal(png.readUInt32BE(20),height);
  }
  assert.match(await readFile('dist/favicon.svg','utf8'), /<svg[^>]+viewBox="0 0 100 100"/);
});

test('production transfer budgets stay small without framework bundles', async () => {
  const files = await readdir('dist/assets');
  let js = 0;
  for (const name of files) {
    const bytes = gzipSync(await readFile(join('dist/assets',name))).byteLength;
    if (name.endsWith('.mjs')) js += bytes;
  }
  assert.ok(js < 14500, `Native public JavaScript gzip ${js} > 14.5 KB`);
  const lazyFiles = (await readdir('dist/cms-public')).filter(name => name.endsWith('.mjs'));
  let lazy = 0;
  for (const name of lazyFiles) lazy += gzipSync(await readFile('dist/cms-public/' + name)).byteLength;
  assert.ok(lazy < 8000, `Lazy win rendering/export JavaScript gzip ${lazy} > 8 KB`);
  let admin = 0;
  for (const name of await readdir('dist/admin/assets')) if (name.endsWith('.mjs')) admin += gzipSync(await readFile('dist/admin/assets/' + name)).byteLength;
  // 375 KB since the Mejl tab (owner request 2026-10-24); its view is a lazy chunk, so the studio boot does not load it.
  assert.ok(admin < 375000, `Isolated editor JavaScript gzip ${admin} > 375 KB`);
  for(const route of routes) {
    const html=await htmlFor(route);
    assert.doesNotMatch(html, /(?:src|href)="\/admin\//, 'Public pages must not load the editor');
    let css=0;
    for(const [,path] of html.matchAll(/rel="stylesheet" href="([^"]+)"/g)) css+=gzipSync(await readFile('dist'+path)).byteLength;
    // The machine's material layers keep a separate cap, with transfer headroom.
    const cssBudget = ['home','workshop'].includes(route.template) ? 18400 : 14000;
    assert.ok(css < cssBudget, `${route.path}: loaded styles gzip ${css} > ${cssBudget} bytes`);
  }
  assert.ok(gzipSync(await htmlFor(routes[0])).byteLength < 9000);
});
