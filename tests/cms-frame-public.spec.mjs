import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { parseFragment, serialize } from 'parse5';
import * as css from 'css-tree';
import { seed } from '../.generated/cms-seed.mjs';
import { normalizeStoredProject } from '../src/cms/legacy-project.mjs';
import { toFrameProject } from '../src/cms/frame-converter.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

// Keep raster/compositing off the host GPU and pin color/text rendering.
// File scope is required: launchOptions changes Playwright's worker fixture.
test.use({ launchOptions: {
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: [
    ...(process.env.CHROMIUM_PATH ? ['--no-sandbox'] : []),
    '--disable-gpu', '--force-color-profile=srgb', '--disable-lcd-text',
  ],
} });

// Independent baseline applies only the named owner decisions to legacy data.
function approvedBaseline(project) {
  const result = normalizeStoredProject(structuredClone(project), seed.legacy);
  for (const page of result.pages) {
    const tree = parseFragment(page.html);
    for (const node of elements(tree)) if ((attribute(node, 'class') ?? '').split(/\s+/).includes('footer-signoff')) {
      const text = node.childNodes.filter(child => child.nodeName === '#text');
      expect(text).toHaveLength(1);
      text[0].value = 'Thanks for stopping by. ';
    }
    page.html = serialize(tree);
    if (page.path !== '/') continue;
    let removed = 0;
    const styles = css.parse(page.css);
    css.walk(styles, { visit: 'Rule', enter(rule, item, list) {
      if (['#iua9', '#iyi2x6'].includes(css.generate(rule.prelude))) { list.remove(item); removed++; }
    } });
    expect(removed).toBe(2);
    page.css = css.generate(styles);
  }
  return result;
}

async function prepareCapture(page) {
  const loading = await page.locator('img').evaluateAll(images => images.map(image => {
    const value = image.getAttribute('loading');
    image.loading = 'eager';
    return value;
  }));
  if (!loading.length) return;
  try {
    await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete)), { timeout: 2_000 }).toBe(true);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  } finally {
    await page.locator('img').evaluateAll((images, values) => images.forEach((image, index) => {
      if (index >= values.length) return;
      if (values[index] === null) image.removeAttribute('loading');
      else image.setAttribute('loading', values[index]);
    }), loading);
  }
}

function compareCapture(actual, expected, label, failures) {
  if (!actual || !expected) { failures.push(`${label}: capture missing`); return false; }
  const identity = isDeepStrictEqual(actual.identity, expected.identity);
  const png = actual.screenshot.equals(expected.screenshot);
  if (!identity) failures.push(`${label}: public identity`);
  if (!png) failures.push(`${label}: PNG bytes (${expected.pngPath}, ${actual.pngPath})`);
  return identity && png;
}

async function capture(browser, runtime, pages, version, javascript, width, testInfo, phase, failures) {
  const result = new Map();
  for (const item of pages) {
    const label = `${item.path}, ${width}, js=${javascript}`, name = `${phase}-${item.id}-${width}-${javascript ? 'ready' : 'no-js'}`;
    let context;
    try {
      // Same cold-context capture as public-evidence.spec.mjs. No browser state,
      // scroll position or pending work carries over from the previous page.
      context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', javaScriptEnabled: javascript });
      const page = await context.newPage();
      if (javascript) await page.addInitScript(() => {
        let random = 123456;
        Math.random = () => ((random = Math.imul(random, 1664525) + 1013904223 >>> 0) / 4294967296);
        crypto.getRandomValues = array => { for (let index = 0; index < array.length; index++) array[index] = Math.floor(Math.random() * 0x100000000); return array; };
      });
      const value = await test.step(`${label}, ${phase}`, async () => {
        const response = await page.goto(runtime.url + item.path, { waitUntil: 'networkidle', timeout: 4_000 });
        expect(response.status(), item.path).toBe(item.path === '/404.html' ? 404 : 200);
        expect(response.headers()['x-cms-version'], item.path).toBe(String(version));
        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('footer.site-footer')).toHaveCount(1);
        if (javascript) {
          await expect(page.locator('html')).toHaveClass(/js-ready/);
          if (item.path === '/' || item.path === '/verkstad/') await expect(page.locator('[data-print]')).toBeEnabled();
          if (item.path === '/verkstad/') await expect(page.locator('[data-memory-card="0"]')).toBeEnabled();
        }
        await prepareCapture(page);
        const pngPath = testInfo.outputPath(`${name}.png`);
        // Native screenshot waits for fonts, including with scripting disabled.
        // The two independent baseline captures below are the stability check.
        const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', timeout: 5_000, path: pngPath });
        const identity = await page.locator('body').evaluate(body => {
          function visit(node, inMain = false) {
            inMain ||= node.tagName === 'MAIN';
            if (node.nodeType === Node.TEXT_NODE) return inMain || node.textContent.trim() ? node.textContent : null;
            if (node.nodeType !== Node.ELEMENT_NODE) return null;
            const attrs = [...node.attributes].filter(attr => !['data-cms-node', 'data-cms-version'].includes(attr.name) && (inMain || attr.name !== 'id' || ['top', 'mobile-menu', 'privacy-title'].includes(attr.value))).map(attr => [attr.name, attr.name === 'class' ? attr.value.trim().replace(/\s+/g, ' ') : attr.value]).sort(([a], [b]) => a.localeCompare(b));
            return { tag: node.tagName, attrs, children: [...node.childNodes].map(child => visit(child, inMain)).filter(child => child !== null) };
          }
          return visit(body);
        });
        const rendering = await page.locator('body').evaluate(body => {
          const properties = ['display', 'position', 'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'transform', 'filter', 'opacity'];
          return { fonts: document.fonts.status, images: [...document.images].map(image => ({ src: image.currentSrc, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight })), nodes: [body, ...body.querySelectorAll('.site-header,.brand,.primary-nav,.header-actions,.mobile-menu,main,h1,.site-footer,.footer-back,[data-motion-toggle],[data-menu-toggle],[data-print],[data-memory-grid],[data-contact-form],[data-privacy-status]')].map(node => {
            const style = getComputedStyle(node), box = node.getBoundingClientRect();
            return { tag: node.tagName, id: node.id, box: { x: box.x, y: box.y, width: box.width, height: box.height }, style: Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)])) };
          }) };
        });
        await testInfo.attach(`${name}.json`, { body: JSON.stringify(identity, null, 2), contentType: 'application/json' });
        await testInfo.attach(`${name}-render.json`, { body: JSON.stringify(rendering, null, 2), contentType: 'application/json' });
        await testInfo.attach(`${name}.png`, { path: pngPath, contentType: 'image/png' });
        return { identity, screenshot, pngPath };
      }, { timeout: 8_000 });
      result.set(item.path, value);
    } catch (error) { failures.push(`${label}, ${phase}: ${error.stack ?? error}`); }
    finally { await context?.close(); }
  }
  return result;
}

test('B8: fifteen v185 pages retain exact approved screenshots and public identity at 390/1440 before and after js-ready', async ({ browser }, testInfo) => {
  // fr7 completed 174 captures in 300 s, including setup (~1.72 s/capture).
  // Round to 2 s, add 50% for software rendering, then 60 s setup/cleanup.
  const captureCount = 15 * 2 * 2 * 3;
  test.setTimeout(captureCount * 3_000 + 60_000);
  const session = await browser.newBrowserCDPSession();
  try {
    const profile = await session.send('SystemInfo.getInfo');
    await testInfo.attach('rendering-profile.json', { body: JSON.stringify({ version: browser.version(), gpu: profile.gpu }, null, 2), contentType: 'application/json' });
  } finally { await session.detach(); }
  const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  const before = approvedBaseline(raw), after = validateProject(toFrameProject(raw, seed), seed);
  expect(before.pages).toHaveLength(15);
  const runtime = await cmsRuntime();
  const failures = [];
  try {
    let version = 0;
    for (const javascript of [false, true]) for (const width of [390, 1440]) {
      version = (await publishSite(runtime.db, { project: before, baseVersion: version, requestId: crypto.randomUUID(), actor: runtime.email })).version;
      const baseline = await capture(browser, runtime, before.pages, version, javascript, width, testInfo, 'before-1', failures);
      const repeated = await capture(browser, runtime, before.pages, version, javascript, width, testInfo, 'before-2', failures);
      // Exactly two baseline attempts, both retained. A mismatch fails the gate;
      // do not retry until noisy output happens to agree.
      const stable = new Set();
      for (const item of before.pages) if (compareCapture(repeated.get(item.path), baseline.get(item.path), `${item.path}, ${width}, js=${javascript}, baseline vs baseline`, failures)) stable.add(item.path);
      version = (await publishSite(runtime.db, { project: after, baseVersion: version, requestId: crypto.randomUUID(), actor: runtime.email })).version;
      const migrated = await capture(browser, runtime, before.pages, version, javascript, width, testInfo, 'after', failures);
      for (const item of before.pages) {
        if (stable.has(item.path)) compareCapture(migrated.get(item.path), baseline.get(item.path), `${item.path}, ${width}, js=${javascript}, migrated vs baseline`, failures);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  } finally { await runtime.close(); }
});
