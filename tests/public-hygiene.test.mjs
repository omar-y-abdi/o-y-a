import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routes, site } from '../src/content/site.mjs';
import { securityTxt } from '../src/content/security.mjs';
import { MANIFEST_PATH, webManifest } from '../src/content/manifest.mjs';
import { unavailablePage } from '../src/templates/unavailable.mjs';
import { layout } from '../src/templates/layout.mjs';

const DAY = 86_400_000;
const expiresOf = body => body.match(/^Expires: (.+)$/m)?.[1];
const head = page => layout(page, '', { css: '/assets/site.test.css', main: '/assets/main.test.mjs' }).split('</head>')[0];
const JSON_LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const graphOf = html => JSON.parse(html.match(JSON_LD)[1])['@graph'];
const ownAddressTags = url => [`<link rel="canonical" href="${url}">`, `<link rel="alternate" type="text/markdown" href="${url}">`, `<meta property="og:url" content="${url}">`];

test('security.txt lists exactly the four RFC 9116 fields with LF endings', () => {
  const body = securityTxt(new Date('2026-11-10T15:30:00Z'));
  assert.equal(body, [
    'Contact: https://omaryusuf.se/kontakt/',
    'Expires: 2027-05-09T00:00:00Z',
    'Preferred-Languages: sv, en',
    'Canonical: https://omaryusuf.se/.well-known/security.txt',
  ].join('\n') + '\n');
});

test('security.txt Expires is 180 days ahead at UTC midnight, across year and leap boundaries', () => {
  for (const [now, expires] of [
    ['2026-11-10T15:30:00Z', '2027-05-09T00:00:00Z'],
    ['2026-07-15T23:59:59Z', '2027-01-11T00:00:00Z'],
    ['2027-09-01T00:00:00Z', '2028-02-28T00:00:00Z'],
    // 2028 is a leap year: the window ends on the leap day, then crosses it.
    ['2027-09-02T00:00:00Z', '2028-02-29T00:00:00Z'],
    ['2027-12-01T12:00:00Z', '2028-05-29T00:00:00Z'],
  ]) assert.equal(expiresOf(securityTxt(new Date(now))), expires, now);
});

test('security.txt Expires is always a future UTC midnight, more than 179 and at most 180 days ahead', () => {
  for (let time = Date.UTC(2026, 0, 1); time < Date.UTC(2029, 0, 1); time += 7 * DAY + 3_600_000 + 61_000) {
    const now = new Date(time);
    const expires = expiresOf(securityTxt(now));
    assert.match(expires, /^\d{4}-\d{2}-\d{2}T00:00:00Z$/);
    const delta = Date.parse(expires) - time;
    assert.ok(delta > 0, `${now.toISOString()} -> ${expires}`);
    assert.ok(delta > 179 * DAY && delta <= 180 * DAY, `${now.toISOString()} -> ${expires}`);
  }
});

test('security.txt refuses an invalid time instead of publishing a broken Expires', () => {
  assert.throws(() => securityTxt(new Date('not a date')), TypeError);
  assert.throws(() => securityTxt(Date.now()), TypeError);
});

test('the 503 page is a self-contained, script-free and escaped Swedish document', () => {
  const html = unavailablePage({ requestId: '<x>&"', css: '/assets/site.0123456789ab.css' });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.match(html, /<html lang="sv">/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<title>Tillfälligt avbrott \| Omar Yusuf<\/title>/);
  assert.match(html, /<meta name="theme-color" content="#fff0b3">/);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg"/);
  assert.equal([...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(match => match[1]).join(), '/assets/site.0123456789ab.css');
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.match(html, /<main id="main"><section class="not-found section-wrap">/);
  for (const name of ['eyebrow', 'error-actions', 'button button-ink', 'error-note']) assert.ok(html.includes(`class="${name}"`), name);
  assert.match(html, /<a href="\/" class="button button-ink">Försök igen från startsidan<\/a>/);
  assert.ok(html.includes('Fel-ID: &lt;x&gt;&amp;&quot;'));
  assert.ok(!html.includes('<x>'));
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<style/i);
  assert.doesNotMatch(html, /\sstyle=/i);
  const hostile = unavailablePage({ requestId: 'id', css: '/assets/site.css"><script src="//evil.example/x.js"></script>' });
  assert.ok(hostile.includes('<link rel="stylesheet" href="/assets/site.css&quot;&gt;&lt;script src=&quot;//evil.example/x.js&quot;&gt;&lt;/script&gt;">'), 'The stylesheet address is escaped inside its attribute');
  assert.equal((hostile.match(/<link rel="stylesheet"/g) || []).length, 1);
  assert.doesNotMatch(hostile, /<script/i);
});

test('every indexable head names its own address once: canonical, Markdown alternate, og:url and the page JSON-LD', () => {
  const pageTypes = { '/om/': 'AboutPage', '/kontakt/': 'ContactPage' };
  for (const page of routes.filter(route => !route.noindex)) {
    const html = head(page), url = site.origin + page.path;
    for (const tag of ownAddressTags(url)) assert.equal(html.split(tag).length, 2, `${page.path}: ${tag}`);
    assert.equal((html.match(/rel="canonical"|type="text\/markdown"|property="og:url"/g) || []).length, 3, page.path);
    assert.ok(!html.includes('name="robots"'), page.path);
    const graph = graphOf(html);
    assert.deepEqual(graph.slice(0, 2).map(node => node['@type']), ['Person', 'WebSite'], page.path);
    assert.deepEqual(graph.slice(2), [
      { '@type': pageTypes[page.path] ?? 'WebPage', '@id': url, url, name: page.title, description: page.description, inLanguage: 'sv-SE', isPartOf: { '@id': 'https://omaryusuf.se/#website' }, about: { '@id': 'https://omaryusuf.se/#omar' } },
      ...(page.path === '/' ? [] : [{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Hem', item: 'https://omaryusuf.se/' }, { '@type': 'ListItem', position: 2, name: page.name, item: url }] }]),
    ], page.path);
  }
});

test('the noindex head equals the indexable head minus its own address and page JSON-LD, plus the robots meta', () => {
  const missing = routes.find(route => route.noindex);
  assert.ok(missing, 'The error page is the noindex route');
  const indexable = head({ ...missing, noindex: false }), noindex = head(missing);
  const withoutGraph = html => html.replace(JSON_LD, '');
  const themeLine = '<meta name="theme-color" content="#fff0b3"><meta name="color-scheme" content="light">\n';
  let expected = withoutGraph(indexable);
  for (const tag of ownAddressTags(site.origin + missing.path)) {
    assert.equal(expected.split(tag).length, 2, tag);
    expected = expected.replace(tag, '');
  }
  assert.equal(expected.split(themeLine).length, 2);
  assert.equal(withoutGraph(noindex), expected.replace(themeLine, themeLine + '<meta name="robots" content="noindex, follow">'));
  assert.deepEqual(graphOf(indexable).map(node => node['@type']), ['Person', 'WebSite', 'WebPage', 'BreadcrumbList']);
  assert.deepEqual(graphOf(noindex), graphOf(indexable).slice(0, 2), 'Only the Person and WebSite nodes remain, unchanged');
  assert.ok(!noindex.includes('/404.html'), 'The error page head names no address of its own');
});

test('the web manifest is pretty JSON naming the site, its default colours and the built-in icons', () => {
  const body = webManifest();
  const manifest = JSON.parse(body);
  assert.equal(body, JSON.stringify(manifest, null, 2) + '\n');
  assert.deepEqual(manifest, {
    name: 'Omar Yusuf',
    short_name: 'Omar Yusuf',
    lang: 'sv',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#fffdf6',
    theme_color: '#fff0b3',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  });
  assert.equal(MANIFEST_PATH, '/site.webmanifest');
});

test('every page head links the manifest exactly once and agrees with it on theme colour and icons', () => {
  const manifest = JSON.parse(webManifest());
  for (const page of routes) {
    const html = head(page);
    assert.equal(html.split('<link rel="manifest" href="/site.webmanifest">').length, 2, page.path);
    assert.equal((html.match(/rel="manifest"/g) || []).length, 1, page.path);
    assert.equal(html.match(/<meta name="theme-color" content="([^"]+)">/)?.[1], manifest.theme_color, page.path);
    assert.deepEqual([html.match(/<link rel="icon" href="([^"]+)"/)?.[1], html.match(/<link rel="apple-touch-icon" href="([^"]+)"/)?.[1]], manifest.icons.map(icon => icon.src), page.path);
  }
});
