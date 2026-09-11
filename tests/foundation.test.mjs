import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const routes = ['', 'verkstad', 'om', 'projekt/furl', 'kontakt', 'integritet', 'kakor', 'villkor', 'tillganglighet'];
test('every requested page has a real static HTML source', () => {
  for (const route of routes) assert.ok(existsSync(`dist/${route ? route + '/' : ''}index.html`), `Missing static route /${route}`);
});
test('metadata is unique, canonical and not a scaffold', () => {
  const titles = new Set();
  for (const route of routes) {
    assert.ok(existsSync(`dist/${route ? route + '/' : ''}index.html`), 'Build output is required');
    const html = readFileSync(`dist/${route ? route + '/' : ''}index.html`, 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title?.includes('Omar Yusuf'));
    assert.ok(!titles.has(title), `Duplicate title ${title}`); titles.add(title);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.ok(html.includes(`rel="canonical" href="https://omaryusuf.se/${route ? route + '/' : ''}"`));
    assert.ok(/name="description" content=".{40,180}"/.test(html));
    assert.ok(!/\u2014|Lorem ipsum|Vite \+ React|LocalBusiness|your@email|placeholder=/i.test(html));
  }
});
