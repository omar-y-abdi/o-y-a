import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'parse5';

const origin = 'https://omaryusuf.se';
const file = path => readFileSync('dist' + path, 'utf8');
const page = path => file(path === '/' ? '/index.html' : path + 'index.html');
async function app() { return (await import('../src/worker.mjs')).default; }
function env() {
  return {
    ASSETS: { async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === '/' || path.endsWith('/')) {
        try { return new Response(page(path), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); }
        catch { return new Response(file('/404.html'), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }); }
      }
      return new Response(file('/404.html'), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } },
  };
}
function find(node, tag) {
  if (node.tagName === tag) return node;
  for (const child of node.childNodes || []) { const result = find(child, tag); if (result) return result; }
  return null;
}
function readable(node) {
  if (node.nodeName === '#text') return node.value;
  if (['script', 'style', 'svg'].includes(node.tagName)) return '';
  return (node.childNodes || []).map(readable).join(' ');
}

test('homepage has meaningful server-rendered main content, a single H1 and correct identity metadata', () => {
  const html = page('/');
  const doc = parse(html);
  const main = find(doc, 'main');
  assert.ok(main);
  assert.ok(readable(main).replace(/\s+/g, ' ').trim().length > 500);
  const headings = [];
  const walk = node => { if (/^h[1-6]$/.test(node.tagName || '')) headings.push(Number(node.tagName[1])); for (const child of node.childNodes || []) walk(child); };
  walk(main);
  assert.equal(headings.filter(level => level === 1).length, 1);
  for (let i = 1; i < headings.length; i++) assert.ok(headings[i] <= headings[i-1] + 1, 'Do not skip heading levels');
  for (const field of ['<html lang="sv"', 'rel="canonical"', 'property="og:image"', 'property="og:type"', '"@type":"Person"']) assert.ok(html.includes(field), field);
  assert.ok(!html.includes('"@type":"Organization"'), 'Do not claim an unverified company');
  assert.match(html, /"knowsAbout":\[/);
  assert.match(html, /<title>Omar Yusuf \| Maskiningenjör, automation och AI-projekt<\/title>/);
});

test('Markdown negotiation on canonical public pages reflects the actual HTML, removes chrome and varies cache', async () => {
  const worker = await app();
  for (const path of ['/', '/om/', '/kontakt/']) {
    const response = await worker.fetch(new Request(origin + path, { headers: { Accept: 'text/markdown, text/html;q=0.5' } }), env());
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/markdown/);
    assert.match(response.headers.get('vary'), /\bAccept\b/i);
    const markdown = await response.text();
    assert.match(markdown, /^# /);
    assert.ok(markdown.length > 500);
    assert.ok(!/<(?:script|nav|div)\b/i.test(markdown));
  }
  const workerResponse = await worker.fetch(new Request(origin + '/', { headers: { Accept: 'text/html' } }), env());
  assert.match(workerResponse.headers.get('content-type'), /^text\/html/);
  assert.match(workerResponse.headers.get('vary'), /\bAccept\b/i);
  assert.match(await workerResponse.text(), /<main\b/);
});

test('Accept q-values, exclusions, wildcards, and HEAD select correct representations', async () => {
  const worker = await app();
  for (const [accept, expected] of [
    ['text/markdown;q=1, text/html;q=0.4', 'text/markdown'],
    ['text/html;q=1, text/markdown;q=0.4', 'text/html'],
    ['text/markdown;q=0, */*;q=1', 'text/html'],
    ['*/*', 'text/html'],
    ['text/*', 'text/html'],
    ['application/json', null],
  ]) {
    const response = await worker.fetch(new Request(origin + '/', { headers: { Accept: accept } }), env());
    if (!expected) assert.equal(response.status, 406, accept);
    else assert.match(response.headers.get('content-type'), new RegExp('^' + expected.replace('/', '\\/')), accept);
  }
  const head = await worker.fetch(new Request(origin + '/', { method: 'HEAD', headers: { Accept: 'text/markdown' } }), env());
  assert.equal(head.status, 200);
  assert.match(head.headers.get('content-type'), /^text\/markdown/);
  assert.equal(await head.text(), '');
});

test('Markdown 404 contains a useful explanation and real navigation', async () => {
  const response = await (await app()).fetch(new Request(origin + '/missing-page/', { headers: { Accept: 'text/markdown' } }), env());
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /^text\/markdown/);
  const body = await response.text();
  assert.ok(body.length >= 20);
  assert.match(body, /https:\/\/omaryusuf\.se\//);
});

test('known trust pages have discoverable English redirects to real Swedish content', async () => {
  const worker = await app();
  for (const [from, to] of [['/about', '/om/'], ['/contact', '/kontakt/'], ['/privacy', '/integritet/']]) {
    const response = await worker.fetch(new Request(origin + from), env());
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), origin + to);
    assert.ok(readable(find(parse(page(to)), 'main')).length > 500);
  }
});

test('public API errors remain JSON and add machine-readable codes and actionable hints', async () => {
  const worker = await app();
  const missing = await worker.fetch(new Request(origin + '/api/does-not-exist'), env());
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /application\/json/);
  const payload = await missing.json();
  for (const key of ['error', 'code', 'hint']) assert.equal(typeof payload[key], 'string');
  const event = await worker.fetch(new Request(origin + '/api/event'), env());
  assert.equal(event.status, 405);
  assert.equal((await event.json()).code, 'METHOD_NOT_ALLOWED');
  const contact = await worker.fetch(new Request(origin + '/api/contact'), env());
  assert.equal(contact.status, 405);
  const problem = await contact.json();
  assert.equal(problem.ok, false);
  assert.equal(typeof problem.message, 'string');
  assert.equal(typeof problem.code, 'string');
  assert.equal(typeof problem.hint, 'string');
});

test('OpenAPI describes implemented operations with distinct IDs and typed bodies', () => {
  const doc = JSON.parse(file('/openapi.json'));
  assert.match(doc.openapi, /^3\.1\./);
  assert.equal(doc.servers[0].url, origin);
  const expected = ['/api/config', '/api/contact/config', '/api/contact', '/api/event', '/data/cards.json', '/data/runtime.json'];
  for (const path of expected) assert.ok(doc.paths[path], path);
  const ids = [];
  for (const [path, methods] of Object.entries(doc.paths)) for (const [method, spec] of Object.entries(methods)) {
    assert.ok(['get', 'head', 'post'].includes(method), path + method);
    assert.ok(spec.operationId && spec.description && Object.keys(spec.responses).length > 0);
    ids.push(spec.operationId);
  }
  assert.equal(ids.length, new Set(ids).size);
  const body = doc.paths['/api/contact'].post.requestBody.content['application/json'].schema;
  assert.ok(body.properties.token && body.properties.submission && body.properties.website);
  assert.ok(body.required.includes('name'));
  assert.ok(doc.paths['/api/event'].post.parameters.some(p => p.name === 'X-OY-Consent'));
  for(const header of ['Retry-After','RateLimit','RateLimit-Policy']) assert.ok(doc.paths['/api/contact'].post.responses['429'].headers[header],header);
  assert.ok(!doc.paths['/admin/'], 'Owner CMS must not be advertised as public API');
});

test('agents and developers discover real documentation without fictional integrations', () => {
  assert.match(page('/developers/'), /OpenAPI/);
  assert.match(page('/developers/'), /Ingen publik API-nyckel/);
  assert.ok(page('/').includes('href="/developers/"'));
  const llms = file('/llms.txt');
  assert.match(llms, /## När en agent bör använda/);
  assert.match(llms, /\/developers\//);
  assert.match(llms, /\/openapi\.json/);
  const sitemap = file('/sitemap.xml');
  assert.match(sitemap, /https:\/\/omaryusuf\.se\/developers\//);
});

test('published CMS HTML is the Markdown source, not an outdated static snapshot', async () => {
  const worker = await app();
  const bindings = env();
  bindings.CMS_DB = {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return {
                version: 12,
                html: '<main><h1>CMS published heading</h1><p>The owner changed this body in the editor. Real published content.</p></main>',
                css: '',
                meta: JSON.stringify({id:'home',path:'/',name:'Hem',title:'CMS page | Omar Yusuf',description:'Owner published updated content.',template:'home',bodyClass:'page-home'}),
              };
            },
          };
        },
      };
    },
  };
  const response = await worker.fetch(new Request(origin + '/', {headers:{Accept:'text/markdown'}}), bindings);
  assert.equal(response.status,200);
  const body = await response.text();
  assert.match(body,/^# CMS published heading/m);
  assert.match(body,/The owner changed this body/);
  assert.ok(!body.includes('Alla bästa saker börjar'));
  assert.equal(response.headers.get('x-cms-version'),'12');
  assert.match(response.headers.get('vary'),/Accept/);
});

test('published CMS sitemap retains unindexed decisions while discovering new static developers page', async () => {
  const worker = await app();
  const bindings = env();
  bindings.CMS_DB = {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return {
                version: 3,
                html: JSON.stringify([{path:'/',noindex:false},{path:'/om/',noindex:false},{path:'/kontakt/',noindex:true}]),
                css: '',
                meta: '{}',
              };
            },
          };
        },
      };
    },
  };
  const response = await worker.fetch(new Request(origin + '/sitemap.xml'),bindings);
  assert.equal(response.status,200);
  const body = await response.text();
  assert.match(body,/https:\/\/omaryusuf\.se\/developers\//);
  assert.match(body,/https:\/\/omaryusuf\.se\/om\//);
  assert.ok(!body.includes('https://omaryusuf.se/kontakt/'));
  assert.ok(!body.includes('https://omaryusuf.se/verkstad/'));
});

test('new public developer page works before the owner republishes an older CMS manifest', async () => {
  const worker = await app();
  const bindings = env();
  bindings.CMS_DB = {
    prepare() {
      return { bind() { return { async first() { return {version:11,html:null,css:null,meta:null}; } }; } };
    },
  };
  const html = await worker.fetch(new Request(origin + '/developers/', {headers:{Accept:'text/html'}}), bindings);
  assert.equal(html.status,200);
  assert.match(await html.text(),/För utvecklare/);
  const markdown = await worker.fetch(new Request(origin + '/developers/', {headers:{Accept:'text/markdown'}}), bindings);
  assert.equal(markdown.status,200);
  assert.match(await markdown.text(),/^# För utvecklare/m);
});

test('previously published CMS homepage exposes the new documentation link without republishing', async () => {
  const worker = await app();
  const bindings = env();
  bindings.CMS_DB = {
    prepare() { return { bind() { return { async first() {
      return {
        version: 5,
        html: '<main id="main"><h1>CMS portfolio</h1></main><footer><nav aria-label="Sidfotsmeny"><a href="/integritet/">Integritet</a></nav></footer>',
        css: '',
        meta: JSON.stringify({id:'home',path:'/',name:'Hem',title:'CMS portfolio | Omar Yusuf',description:'A published personal portfolio page.',template:'home',bodyClass:'page-home'}),
      };
    } }; } }; },
  };
  const response = await worker.fetch(new Request(origin+'/',{headers:{Accept:'text/html'}}),bindings);
  assert.equal(response.status,200);
  const html = await response.text();
  assert.match(html,/<nav[^>]*aria-label="Sidfotsmeny"[^>]*>[^<]*<a href="\/developers\/">För utvecklare<\/a>/);
  assert.equal((html.match(/href="\/developers\/"/g)||[]).length,1);
});
