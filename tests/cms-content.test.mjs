import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { preparePage, validateHtml, validateCss, validatePagePath } from '../src/cms/validation.mjs';

test('ordinary layout, rich text, SVG artwork and responsive CSS survive validation', () => {
  const html = '<main id="main"><h1>Hej <em>Omar</em></h1><section><p>Rävar &amp; kaffe</p><a href="/om/">Läs mer</a><img src="/media/12345678-1234-4123-8123-123456789abc.png" alt="En blomma"><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor"></circle></svg></section></main>';
  const result = validateHtml(html);
  assert.match(result, /Rävar &amp; kaffe/);
  assert.match(result, /viewBox="0 0 10 10"/);
  const css = ':root{--paper:#fffdf6}.card{display:grid;gap:clamp(1rem,2vw,3rem);background:var(--paper)}@media(max-width:760px){.card{grid-template-columns:1fr}}@keyframes spin{to{transform:rotate(360deg)}}';
  assert.match(validateCss(css), /@media/);
});

test('active HTML, mutation XSS and unsafe URL forms are rejected', () => {
  const payloads = [
    '<script>alert(1)</script>', '<img src="/media/a.png" onerror="alert(1)">',
    '<a href="jav&#x61;script:alert(1)">bad</a>', '<a href="java\nscript:alert(1)">bad</a>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>', '<object data="/admin/api/state"></object>',
    '<svg><foreignObject><div>bad</div></foreignObject></svg>', '<svg><use href="https://evil.test/x.svg#x"></use></svg>',
    '<img src="data:image/svg+xml,<svg onload=alert(1)>">', '<base href="https://evil.test/">',
    '<form action="https://evil.test/"><input name="email"></form>', '<a ping="https://evil.test" href="/">bad</a>',
    '<meta http-equiv="refresh" content="0;url=https://evil.test">', '<img src="//evil.test/a.png">',
    '<img src="/admin/api/state">', '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
  ];
  for (const html of payloads) assert.throws(() => validateHtml(html), { name: 'Error' }, html);
});

test('CSS parser rejects imports, external loads, legacy execution and invalid fallback nodes', () => {
  for (const css of ['@import "https://evil.test/a.css";', '@\\69mport "https://evil.test/a.css";', 'div{background:url(https://evil.test/a)}', 'div{background:u\\72l(https://evil.test/a)}', 'div{behavior:url(/media/a.htc)}', 'div{-moz-binding:url(/media/a.xml)}', 'div{width:expression(alert(1))}', 'div{--load:url(/admin/api/state);background:var(--load)}', '@namespace svg url(http://evil.test);', 'div{background:url(javascript:alert(1))}']) {
    assert.throws(() => validateCss(css), undefined, css);
  }
  assert.match(validateCss('@font-face{font-family:Studio;src:url(/media/12345678-1234-4123-8123-123456789abc.woff2) format("woff2")}'), /font-face/);
});

test('inline CSS receives the same checks as stylesheet CSS', () => {
  assert.throws(() => validateHtml('<p style="background:url(https://evil.test/)">bad</p>'));
  assert.match(validateHtml('<p style="color:#234ce7;font-size:24px">Hej</p>'), /font-size:24px/);
});

test('full current pages import without losing required functional hooks', async () => {
  for (const path of ['dist/index.html', 'dist/verkstad/index.html', 'dist/kontakt/index.html', 'dist/projekt/furl/index.html']) {
    const prepared = preparePage(await readFile(path, 'utf8'));
    assert.match(prepared.html, /data-cms-node/);
    const validated = validateHtml(prepared.html, prepared.contracts);
    assert.match(validated, /id="main"/);
    assert.match(validated, /data-menu-toggle/);
  }
});

test('editing text and styles is allowed, removing or retargeting a functional hook is rejected', async () => {
  const prepared = preparePage(await readFile('dist/kontakt/index.html', 'utf8'));
  assert.doesNotThrow(() => validateHtml(prepared.html.replace('Inga frimärken behövs.', 'Bara ett litet hej.'), prepared.contracts));
  assert.throws(() => validateHtml(prepared.html.replace('data-contact-form=""', 'data-lost-form=""'), prepared.contracts));
  assert.throws(() => validateHtml(prepared.html.replace('name="email"', 'name="other"'), prepared.contracts));
});

test('deep, oversized and duplicate-ID content is rejected deterministically', () => {
  assert.throws(() => validateHtml('<div>'.repeat(100) + 'x' + '</div>'.repeat(100)));
  assert.throws(() => validateHtml('<p>' + 'x'.repeat(600000) + '</p>'));
  assert.throws(() => validateHtml('<p id="duplicate">a</p><p id="duplicate">b</p>'));
});

test('visual wrappers and reordering survive while moving a control outside its functional group is rejected', () => {
  const prepared = preparePage('<body><main id="main"><div data-memory-grid><button data-memory-card="0">?</button><button data-memory-card="1">?</button></div></main></body>');
  const button = prepared.html.match(/<button[^>]*data-memory-card="0"[^>]*>.*?<\/button>/)[0];
  assert.doesNotThrow(() => validateHtml(prepared.html.replace(button, `<section>${button}</section>`), prepared.contracts));
  assert.throws(() => validateHtml(prepared.html.replace(button, '').replace('</main>', button + '</main>'), prepared.contracts), /utanför sin funktion/);
});

test('page paths cannot shadow admin, API, media or traversal routes', () => {
  assert.equal(validatePagePath('/projekt/nytt/'), '/projekt/nytt/');
  for (const path of ['/admin/', '/admin/api/save/', '/api/', '/assets/x/', '/media/x/', '/login/', '/data/x/', '/a/../b/', '//evil.test/', '/bad?x=1/', '/bad%2fpath/', '/bad\\path/']) assert.throws(() => validatePagePath(path), undefined, path);
});

test('A8: social and mail are reserved from the one shared list and the 422 names the address', () => {
  for (const path of ['/social/x/', '/mail/x/']) assert.throws(() => validatePagePath(path), { status: 422, message: new RegExp(`Adressen ${path} är reserverad`) });
  assert.equal(validatePagePath('/socialt/'), '/socialt/');
});

test('A4: validateHtml accepts <strike> from the strike-through action', () => {
  assert.match(validateHtml('<p>En <strike>struken</strike> text</p>'), /<strike>struken<\/strike>/);
});
