import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { routes, site } from '../src/content/site.mjs';
import { CSP } from '../.generated/csp.mjs';

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
    assert.match(file, /^[a-z]+\.[a-f0-9]{12}\.(mjs|css)$/);
    const code = await readFile(join('dist/assets', file), 'utf8');
    assert.ok(!code.includes('sourceMappingURL'));
    for (const match of code.matchAll(/(?:from\s*|import\()["']\.\/([^"']+)["']/g)) {
      assert.ok(files.includes(match[1]), `Missing imported module ${match[1]}`);
    }
    for (const match of code.matchAll(/(?:from\s*|import\()["'](\/cms-public\/[^"']+)["']/g)) assert.ok((await stat('dist' + match[1])).isFile(), `Missing lazy module ${match[1]}`);
  }
});

test('all structured-data scripts match actual CSP hashes and identity facts', async () => {
  for (const route of routes) {
    const html = await htmlFor(route);
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(match[1]);
      assert.equal(data['@context'], 'https://schema.org');
      assert.ok(data['@graph'].some(node => node['@type'] === 'Person' && node.name === 'Omar Yusuf'));
      assert.ok(!match[1].includes('LocalBusiness'), 'A private person is not an invented local business');
      const hash = createHash('sha256').update(match[1]).digest('base64');
      assert.ok(CSP.includes(`'sha256-${hash}'`), `Missing CSP hash for ${route.path}`);
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
  assert.ok(js < 14000, `Native public JavaScript gzip ${js} > 14 KB`);
  const lazyFiles = (await readdir('dist/cms-public')).filter(name => name.endsWith('.mjs'));
  let lazy = 0;
  for (const name of lazyFiles) lazy += gzipSync(await readFile('dist/cms-public/' + name)).byteLength;
  assert.ok(lazy < 8000, `Lazy win rendering/export JavaScript gzip ${lazy} > 8 KB`);
  let admin = 0;
  for (const name of await readdir('dist/admin/assets')) if (name.endsWith('.mjs')) admin += gzipSync(await readFile('dist/admin/assets/' + name)).byteLength;
  assert.ok(admin < 350000, `Isolated editor JavaScript gzip ${admin} > 350 KB`);
  for(const route of routes) {
    const html=await htmlFor(route);
    assert.doesNotMatch(html, /(?:src|href)="\/admin\//, 'Public pages must not load the editor');
    let css=0;
    for(const [,path] of html.matchAll(/rel="stylesheet" href="([^"]+)"/g)) css+=gzipSync(await readFile('dist'+path)).byteLength;
    // The machine's material layers get 3 KB; unrelated pages keep their original budget.
    const cssBudget = ['home','workshop'].includes(route.template) ? 17000 : 14000;
    assert.ok(css < cssBudget, `${route.path}: loaded styles gzip ${css} > ${cssBudget} bytes`);
  }
  assert.ok(gzipSync(await htmlFor(routes[0])).byteLength < 9000);
});
