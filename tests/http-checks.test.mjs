import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

const project = JSON.parse(await readFile(new URL('./fixtures/cms-v185-project.json', import.meta.url), 'utf8'));
const routes = [...new Set([...project.pages.filter(page => !page.noindex).map(page => page.path), '/play/skift/'])];
let runtime, analytics;
before(async () => {
  runtime = await cmsRuntime({ project });
  analytics = await cmsRuntime({ analytics: true });
});
after(async () => {
  try { await analytics?.close(); }
  finally { await runtime?.close(); }
});

// node:http preserves encoded wire bytes and redirects, unlike fetch().
// Match the former HTTPConnection/close harness: a fresh connection per call.
function fetchHttp(path, { method = 'GET', headers = {}, body, fixture = runtime } = {}) {
  return new Promise((resolve, reject) => {
    const req = request(new URL(path, fixture.url), { method, headers, agent: false }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.once('error', reject);
      response.once('end', () => resolve({ status: response.statusCode, headers: new Headers(response.headers), body: Buffer.concat(chunks) }));
    });
    req.once('error', reject);
    req.setTimeout(5_000, () => req.destroy(new Error(`HTTP timeout: ${method} ${path}`)));
    req.end(body);
  });
}

for (const path of routes) test(`published HTTP: GET, HEAD, security and linked resources ${path}`, async () => {
  const response = await fetchHttp(path);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.doesNotMatch(response.headers.get('content-security-policy'), /unsafe-eval/);
  const html = response.body.toString();
  assert.equal([...html.matchAll(/<h1(?: |>).*?<\/h1>/gs)].length, 1);
  if (path !== '/play/skift/') assert.equal(response.headers.get('x-cms-version'), '1', 'HTML must come from published D1 rows');
  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = new URL(href.replaceAll('&amp;', '&'), runtime.url).pathname;
    const resource = await fetchHttp(target);
    assert.equal(resource.status, 200, `${path}: ${href}`);
    if (target.endsWith('.mjs')) assert.match(resource.headers.get('content-type'), /javascript/);
  }
  const head = await fetchHttp(path, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  const length = head.headers.get('content-length');
  if (length !== null) assert.equal(Number(length), response.body.length, `${path}: HEAD representation size`);
});

test('contact configuration stays private and unconfigured sending fails closed', async () => {
  const config = await fetchHttp('/api/contact/config');
  assert.equal(config.status, 200);
  assert.deepEqual(JSON.parse(config.body), { enabled: false, sitekey: null });
  assert.equal(config.headers.get('cache-control'), 'no-store');
  const head = await fetchHttp('/api/contact/config', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  const sent = await fetchHttp('/api/contact', { method: 'POST', headers: { Origin: runtime.url, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', email: 'visitor@example.org', message: '', website: '', token: 'test', submission: '6c77eb01-9260-4e9c-8a72-262b520ee1b1' }) });
  assert.equal(sent.status, 503);
  assert.equal(JSON.parse(sent.body).ok, false);
  assert.doesNotMatch(sent.body.toString(), /@chalmers\.se/);
});

test('published joke bank and email GIF retain their content types', async () => {
  const cards = await fetchHttp('/data/cards.json');
  assert.equal(cards.status, 200);
  assert.match(cards.headers.get('content-type'), /application\/json/);
  assert.equal(JSON.parse(cards.body).length, 240);
  assert.equal(cards.headers.get('x-cms-version'), '1');
  const gif = await fetchHttp('/mail/omar-smile.gif');
  assert.equal(gif.status, 200);
  assert.equal(gif.headers.get('content-type'), 'image/gif');
  assert.equal(gif.body.subarray(0, 6).toString(), 'GIF89a');
});

test('missing paths return custom 404 HTML with noindex', async () => {
  for (const path of ['/does-not-exist', '/nested/missing/', '/404.html']) {
    const response = await fetchHttp(path);
    assert.equal(response.status, 404, path);
    assert.match(response.body.toString(), /tog fikapaus/);
    assert.match(response.body.toString(), /noindex/);
  }
});

test('published canonical redirects use 307 and preserve the card query', async () => {
  for (const [path, target] of [['/verkstad', '/verkstad/'], ['/om/index.html', '/om/'], ['/verkstad?kort=k01', '/verkstad/?kort=k01']]) {
    const response = await fetchHttp(path);
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get('location'), runtime.url + target);
  }
});

test('published sitemap and text discovery resources stay available', async () => {
  const sitemap = await fetchHttp('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type'), /application\/xml/);
  assert.deepEqual([...sitemap.body.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]).sort(), routes.map(path => 'https://omaryusuf.se' + path).sort());
  for (const path of ['/robots.txt', '/llms.txt']) {
    const response = await fetchHttp(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/plain/);
    assert.match(response.body.toString(), /omaryusuf\.se/);
  }
});

test('Markdown negotiation retains HTML, HEAD, Vary and raw gzip responses', async () => {
  const customMarkdown = new Map([
    ['/ake/', '# Åke kör axel\n\nless gooo\n\n## Din nästa idé.\n\nGe den lite plats.\n\n## En tanke.\n\nOch en till.\n'],
    ['/ekfr/', '# Här börjar något.\n\nDubbelklicka för att skriva din berättelse.\n'],
  ]);
  for (const path of [...routes, '/404.html']) {
    const status = path === '/404.html' ? 404 : 200;
    const response = await fetchHttp(path, { headers: { Accept: 'text/markdown' } });
    assert.equal(response.status, status, path);
    assert.match(response.headers.get('content-type'), /^text\/markdown/);
    assert.match(response.headers.get('vary'), /accept/i);
    assert.match(response.body.toString(), /^# /);
    if (customMarkdown.has(path)) assert.equal(response.body.toString(), customMarkdown.get(path), path);
    else assert.ok(response.body.length >= 100, path);
    assert.doesNotMatch(response.body.toString(), /<main|<script/);
    const head = await fetchHttp(path, { method: 'HEAD', headers: { Accept: 'text/markdown' } });
    assert.equal(head.status, status);
    assert.equal(head.body.length, 0);
    assert.match(head.headers.get('content-type'), /^text\/markdown/);
  }
  for (const accept of ['text/html', 'text/markdown;q=0, text/html;q=1']) {
    const response = await fetchHttp('/', { headers: { Accept: accept } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.match(response.body.toString(), /<main/);
  }
  const rejected = await fetchHttp('/', { headers: { Accept: 'application/json' } });
  assert.equal(rejected.status, 406);
  assert.match(rejected.headers.get('vary'), /accept/i);
  const compressed = await fetchHttp('/', { headers: { Accept: 'text/markdown', 'Accept-Encoding': 'gzip' } });
  assert.equal(compressed.status, 200);
  assert.match(compressed.headers.get('content-type'), /^text\/markdown/);
  assert.ok(compressed.headers.get('vary').toLowerCase().split(',').map(value => value.trim()).includes('accept'));
  const markdownBody = compressed.headers.get('content-encoding') === 'gzip' ? gunzipSync(compressed.body) : compressed.body;
  assert.match(markdownBody.toString(), /^# /);
});

test('aliases, JSON errors, OpenAPI and machine discovery match the public API', async () => {
  for (const [source, target] of [['/about', '/om/'], ['/contact', '/kontakt/'], ['/privacy', '/integritet/']]) {
    const redirect = await fetchHttp(source);
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), runtime.url + target);
    const response = await fetchHttp(target);
    assert.equal(response.status, 200);
    assert.ok(response.body.length > 500);
  }
  for (const path of ['/api/unknown', '/data/cards/unknown.json', '/api/event', '/api/contact']) {
    const response = await fetchHttp(path);
    const methodError = path === '/api/event' || path === '/api/contact';
    assert.equal(response.status, methodError ? 405 : 404, path);
    assert.match(response.headers.get('content-type'), /application\/json/);
    const data = JSON.parse(response.body);
    assert.ok(data.code && data.hint);
    if (methodError) assert.equal(data.code, 'METHOD_NOT_ALLOWED');
    else assert.ok(data.error);
  }
  const response = await fetchHttp('/openapi.json');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const spec = JSON.parse(response.body);
  assert.match(spec.openapi, /^3\.1\./);
  assert.equal(spec.servers[0].url, 'https://omaryusuf.se');
  for (const path of ['/api/config', '/api/contact/config', '/api/contact', '/api/event', '/data/cards.json', '/data/runtime.json', '/data/cards/{id}.json']) assert.ok(spec.paths[path], path);
  for (const path of ['/api/config', '/api/contact/config', '/data/cards.json', '/data/runtime.json', '/openapi.json']) {
    const response = await fetchHttp(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.notEqual(JSON.parse(response.body), null);
  }
  const discovery = await fetchHttp('/llms.txt');
  assert.equal(discovery.status, 200);
  for (const text of ['## N', '/developers/', '/openapi.json']) assert.ok(discovery.body.includes(text));
});

test('home transfers as real gzip within the phase-2 Worker document budget', async () => {
  const response = await fetchHttp('/', { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-encoding'), 'gzip');
  const html = gunzipSync(response.body).toString();
  assert.match(html, /Omar/);
  const runtimeCopy = html.match(/<script type="application\/json" id="cms-runtime">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(runtimeCopy, 'Published home must embed its runtime copy');
  assert.deepEqual(JSON.parse(runtimeCopy), project.runtime);
  // Published HTML 9,428 B + at most 2,443 B embedded copy = 11,871 B, rounded up.
  assert.ok(response.body.length < 12000, `${response.body.length} gzip bytes`);
});

test('private paths, traversal and source maps are never served', async () => {
  for (const path of ['/.env', '/.git/config', '/assets/main.mjs.map', '/%2eenv', '/..%2fpackage.json', '/_headers']) {
    const response = await fetchHttp(path);
    assert.ok(response.status >= 400, path);
    assert.ok(!response.body.includes('"scripts"'));
  }
});

test('HTTP analytics availability and consent gates match the configured binding', async () => {
  for (const [fixture, enabled] of [[runtime, false], [analytics, true]]) {
    const response = await fetchHttp('/api/config', { fixture });
    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.body), { analytics: enabled });
  }
  for (const [cookie, origin, status] of [['v1.allow', analytics.url, 204], ['v1.deny', analytics.url, 403], ['v1.allow', 'https://evil.example', 403]]) {
    const response = await fetchHttp('/api/event', { fixture: analytics, method: 'POST', headers: { Origin: origin, Cookie: `oy_privacy=${cookie}`, 'Content-Type': 'application/json', 'X-OY-Consent': 'v1' }, body: JSON.stringify({ event: 'joy', page: '/verkstad/' }) });
    assert.equal(response.status, status);
    if (status === 204) {
      assert.equal(response.body.length, 0);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  }
});

let configSequence = 0;
async function browserConfig(port) {
  const previous = process.env.PLAYWRIGHT_PORT;
  try {
    if (port === undefined) delete process.env.PLAYWRIGHT_PORT;
    else process.env.PLAYWRIGHT_PORT = port;
    return (await import(`../playwright.config.mjs?http-config=${configSequence++}`)).default;
  } finally {
    if (previous === undefined) delete process.env.PLAYWRIGHT_PORT;
    else process.env.PLAYWRIGHT_PORT = previous;
  }
}

test('browser HTTP server accepts environment ports and rejects invalid boundaries', async () => {
  assert.equal((await browserConfig()).webServer, undefined);
  for (const port of ['1', '65535']) {
    const config = await browserConfig(port);
    assert.equal(config.webServer?.url, `http://127.0.0.1:${port}/`);
    assert.equal(config.webServer.env.PORT, port);
    assert.equal(config.webServer.reuseExistingServer, false);
  }
  for (const port of ['0', '-1', '65536', 'not-a-port']) await assert.rejects(browserConfig(port), /PLAYWRIGHT_PORT must be an integer between 1 and 65535/);
});

test('targeted WebGL has no project dependencies', async () => {
  const config = await browserConfig();
  assert.deepEqual(config.projects.find(project => project.name === 'chromium-webgl').dependencies ?? [], []);
});

test('public browser phases partition exports without dropping cases or replacing artifacts', async () => {
  const { scripts } = JSON.parse(await readFile('package.json', 'utf8'));
  const commands = scripts['test:public-pages'].split(' && ');
  assert.equal(commands.length, 3);
  const phases = commands.map(command => {
    // This contract deliberately accepts only literal CLI arguments, including
    // the quoted group label; no shell expansion is needed by these phases.
    assert.doesNotMatch(command, /[\\$;|`\n]/);
    const words = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g).map(word => word.replace(/(["'])(.*?)\1/g, '$2'));
    assert.deepEqual(words.splice(0, 2), ['playwright', 'test']);
    return parseArgs({ args: words, allowPositionals: true, options: {
      project: { type: 'string' }, 'no-deps': { type: 'boolean' }, workers: { type: 'string' },
      grep: { type: 'string' }, 'grep-invert': { type: 'string' }, output: { type: 'string' },
    } });
  });
  const [ordinary, exportPhase, webgl] = phases;
  assert.deepEqual(ordinary.positionals, ['tests/public-pages.spec.mjs', 'tests/public-review.spec.mjs', 'tests/card-export.spec.mjs', 'tests/public-startup.spec.mjs']);
  assert.deepEqual(exportPhase.positionals, ['tests/card-export.spec.mjs']);
  assert.deepEqual(webgl.positionals, ['tests/public-pages.spec.mjs', 'tests/skift.spec.mjs']);
  assert.equal(ordinary.values['grep-invert'], 'all 240 production card exports');
  assert.equal(exportPhase.values.grep, ordinary.values['grep-invert']);
  assert.equal(ordinary.values.grep, undefined);
  assert.equal(exportPhase.values['grep-invert'], undefined);
  assert.equal(webgl.values.grep, undefined);
  assert.equal(webgl.values['grep-invert'], undefined);
  assert.deepEqual(phases.map(phase => phase.values.project), ['chromium', 'chromium', 'chromium-webgl']);
  assert.ok(phases.every(phase => phase.values['no-deps']));
  assert.equal(exportPhase.values.workers, '1');
  const outputs = phases.map(phase => phase.values.output);
  assert.equal(new Set(outputs).size, 3);
  assert.ok(outputs.every(path => /^output\/playwright\/artifacts\/[a-z-]+$/.test(path)));
  const config = await browserConfig();
  assert.equal(config.projects.find(project => project.name === 'chromium-webgl').workers, 1);
  assert.ok(config.projects.find(project => project.name === 'chromium').grepInvert.test('@webgl'));
});

test('browser failures retain traces without retries and preserve the engine selections', async () => {
  const config = await browserConfig();
  assert.equal(config.use.trace, 'retain-on-failure');
  assert.equal(config.retries, 0);
  const editorSuites = [
    'cms-editor.spec.mjs', 'cms-email.spec.mjs', 'public-startup.spec.mjs',
    'cms-modules.spec.mjs', 'managed-svg-fidelity.spec.mjs',
    'test_cms_browser_helpers.spec.mjs', 'test_cms_asset_usage.spec.mjs',
    'cms-review-browser.spec.mjs', 'cms-review-final-browser.spec.mjs', 'footer-cms-browser.spec.mjs',
  ];
  for (const name of ['firefox', 'webkit']) assert.deepEqual(config.projects.find(project => project.name === name).testMatch, editorSuites);
});
