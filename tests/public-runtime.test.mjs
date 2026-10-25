import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { renderPage } from '../src/cms/render.mjs';
import { defaultTheme } from '../src/cms/theme.mjs';

let sequence = 0;
const freshCopy = () => import(`../src/client/copy.mjs?public-runtime=${sequence++}`);
function documentFixture(t, document) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else delete globalThis.document;
  });
}
const publicDocument = text => ({ head: { querySelector: () => text === undefined ? null : { textContent: text } } });
const page = { path: '/', template: 'home', title: 'Omar Yusuf', name: 'Hem', description: 'En portfolio.', bodyClass: 'page-home', id: 'home', html: '<main id="main"><h1>Hej</h1></main>', css: '' };
const built = { main: '/assets/main.TESTHASH.mjs', preview: '/admin/assets/preview.mjs', styles: { home: '/assets/site.css' } };

test('runtime JSON cannot close its script, open a comment or expand replacement tokens', () => {
  for (const text of ['</script><script src="/attack.js"></script>', '<!--<script>', '</ScRiPt><!--', '$& $` $\' < & " \\ \u2028\u2029']) {
    const runtime = { 'runtime.nav.menu.open': text };
    const runtimeJson = JSON.stringify(runtime, null, 2);
    const html = renderPage(page, built, { version: 7, runtimeJson });
    const scripts = [];
    const visit = node => {
      if (node.tagName === 'script') scripts.push(node);
      for (const child of node.childNodes ?? []) visit(child);
    };
    visit(parse(html));
    assert.equal(scripts.length, 3);
    const block = scripts.find(node => node.attrs.some(attr => attr.name === 'id' && attr.value === 'cms-runtime'));
    assert.ok(block);
    assert.equal(block.attrs.find(attr => attr.name === 'type').value, 'application/json');
    const json = block.childNodes.map(node => node.value).join('');
    assert.ok(!json.includes('<'));
    assert.equal(json, runtimeJson.replaceAll('<', '\\u003c'), 'Stored JSON bytes are embedded without parsing or reserialization');
    assert.deepEqual(JSON.parse(json), runtime);
    assert.equal(html.replace(/<script type="application\/json" id="cms-runtime">[\s\S]*?<\/script>/, ''), renderPage(page, built, { version: 7 }));
    const preview = renderPage(page, built, { version: 7, preview: true, runtimeJson, project: { pages: [], theme: defaultTheme, cards: [], runtime } });
    assert.ok(!preview.includes('id="cms-runtime"'));
    assert.ok(preview.includes('id="cms-preview-data"'));
  }
});

test('embedded copy is filtered, preserves literal text and never fetches', async t => {
  const text = '</script><!-- $&';
  documentFixture(t, publicDocument(JSON.stringify({ 'runtime.nav.menu.open': text, 'runtime.skift.sv.intro': text, unknown: 'ignored', 'runtime.motion.label.pause': 7 })));
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected runtime fetch'); });
  const copy = await freshCopy();
  const loaded = await copy.loadCopy();
  assert.equal(copy.t('runtime.nav.menu.open'), text);
  assert.equal(loaded['runtime.skift.sv.intro'], text);
  assert.equal(copy.t('runtime.motion.label.pause'), copy.defaultCopy['runtime.motion.label.pause']);
  assert.ok(!Object.hasOwn(loaded, 'unknown'));
  assert.equal(await copy.loadCopy(), loaded);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test('a missing block fetches once; simultaneous callers share the result', async t => {
  documentFixture(t, publicDocument());
  let release;
  const response = new Promise(resolve => { release = resolve; });
  t.mock.method(globalThis, 'fetch', (path, options) => {
    assert.equal(path, '/data/runtime.json');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.ok(options.signal instanceof AbortSignal);
    return response;
  });
  const copy = await freshCopy();
  const first = copy.loadCopy(), second = copy.loadCopy();
  assert.equal(globalThis.fetch.mock.callCount(), 1);
  release(Response.json({ 'runtime.nav.menu.open': 'Hämtad meny' }));
  assert.equal(await first, await second);
  assert.equal(copy.t('runtime.nav.menu.open'), 'Hämtad meny');
  assert.equal(await copy.loadCopy(), await first);
  assert.equal(globalThis.fetch.mock.callCount(), 1);
});

test('malformed embedded copy falls through to exactly one shared runtime fetch', async t => {
  for (const text of ['invalid JSON', 'null', '[]', '"text"']) {
    await t.test(text, async t => {
      documentFixture(t, publicDocument(text));
      t.mock.method(globalThis, 'fetch', async path => {
        assert.equal(path, '/data/runtime.json');
        return Response.json({ 'runtime.nav.menu.open': 'Hämtad efter trasig inbäddning' });
      });
      const copy = await freshCopy();
      const [first, second] = await Promise.all([copy.loadCopy(), copy.loadCopy()]);
      assert.equal(copy.t('runtime.nav.menu.open'), 'Hämtad efter trasig inbäddning');
      assert.equal(first, second);
      assert.equal(await copy.loadCopy(), first);
      assert.equal(globalThis.fetch.mock.callCount(), 1);
    });
  }
});

test('an empty embedded object is valid and does not fetch', async t => {
  documentFixture(t, publicDocument('{}'));
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected fallback'); });
  const copy = await freshCopy();
  assert.deepEqual(await copy.loadCopy(), copy.defaultCopy);
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test('unavailable, invalid and aborted runtime responses retain default copy', async t => {
  for (const text of [undefined, 'invalid JSON', 'null', '[]', '"text"']) {
    for (const response of [() => Response.json({}, { status: 503 }), () => new Response('invalid JSON'), () => Response.json(null), () => Response.json([]), () => Response.json('text'), () => { throw new DOMException('Aborted', 'AbortError'); }]) {
      await t.test(async t => {
        documentFixture(t, publicDocument(text));
        t.mock.method(globalThis, 'fetch', response);
        const copy = await freshCopy();
        assert.deepEqual(await copy.loadCopy(), copy.defaultCopy);
        assert.equal(globalThis.fetch.mock.callCount(), 1);
      });
    }
  }
});

test('studio-owned preview copy takes precedence over a public runtime block', async t => {
  const preview = { schemaVersion: 1, cards: [], runtime: { 'runtime.nav.menu.open': 'Förhandsvisad meny' } };
  const node = { textContent: JSON.stringify(preview) };
  documentFixture(t, {
    ...publicDocument(JSON.stringify({ 'runtime.nav.menu.open': 'Publik meny' })),
    URL: 'about:srcdoc', body: { dataset: { cmsPreview: 'true' } },
    head: { querySelectorAll: () => [node], querySelector: () => { throw new Error('Public block must not be read in preview'); } },
    querySelectorAll: () => [node],
    defaultView: { frameElement: { hasAttribute: () => true, ownerDocument: { location: { pathname: '/admin/' } } } },
  });
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected preview fetch'); });
  const copy = await freshCopy();
  await copy.loadCopy();
  assert.equal(copy.t('runtime.nav.menu.open'), 'Förhandsvisad meny');
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});
