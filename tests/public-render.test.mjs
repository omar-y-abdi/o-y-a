import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { after, before, test } from 'node:test';
import { publishSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

const project = JSON.parse(await readFile(new URL('./fixtures/cms-v185-project.json', import.meta.url), 'utf8'));
let runtime, version;
before(async () => {
  runtime = await cmsRuntime();
  ({ version } = await publishSite(runtime.db, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email }));
});
after(() => runtime?.close());
const call = path => runtime.mf.dispatchFetch('https://omaryusuf.se' + path);

test('Worker-rendered v185 home embeds runtime once and retains the HTML transfer budget', async () => {
  const response = await call('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  const blocks = [...html.matchAll(/<script type="application\/json" id="cms-runtime">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0][1], JSON.stringify(project.runtime).replaceAll('<', '\\u003c'));
  const bytes = gzipSync(html).byteLength;
  // Published HTML 9,428 B + at most 2,443 B embedded copy = 11,871 B, rounded up.
  assert.ok(bytes < 12000, `Worker v185 / HTML gzip ${bytes} >= 12000 bytes, including embedded runtime`);
});

test('a corrupt runtime row cannot break unrelated public endpoints or inject HTML', async () => {
  const raw = 'broken </script><script src="/attack.js"></script><!--';
  const stored = await runtime.db.prepare("SELECT html FROM cms_rendered WHERE version=? AND path='@runtime'").bind(version).first();
  try {
    await runtime.db.prepare("UPDATE cms_rendered SET html=? WHERE version=? AND path='@runtime'").bind(raw, version).run();
    for (const path of ['/data/cards.json', `/data/cards/${project.cards[0].id}.json`, '/sitemap.xml', '/']) {
      const response = await call(path);
      assert.equal(response.status, 200, `${path} must not parse an unrelated runtime row`);
      const body = await response.text();
      if (path.endsWith('.json')) assert.ok(JSON.parse(body));
      else if (path === '/sitemap.xml') assert.match(body, /<urlset/);
      else {
        const block = body.match(/<script type="application\/json" id="cms-runtime">([\s\S]*?)<\/script>/)?.[1];
        assert.equal(block, raw.replaceAll('<', '\\u003c'));
        assert.doesNotMatch(body, /<script src="\/attack\.js"/);
      }
    }
    assert.equal((await call('/data/runtime.json')).status, 503, 'The corrupt endpoint itself still fails closed');
  } finally {
    await runtime.db.prepare("UPDATE cms_rendered SET html=? WHERE version=? AND path='@runtime'").bind(stored.html, version).run();
  }
});
