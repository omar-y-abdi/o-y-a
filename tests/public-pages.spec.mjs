import { test, expect } from './helpers/public-test.mjs';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

const project = JSON.parse(await readFile(new URL('./fixtures/cms-v185-project.json', import.meta.url), 'utf8'));
const PAGES = [...new Set([...project.pages.map(page => page.path), '/play/skift/'])];
const SIZES = [[320,780], [390,844], [768,1024], [1024,900], [1440,1000], [1920,1080]];
const SCREENSHOTS = new URL('../artifacts/screenshots/', import.meta.url);

const screenshotName = (path, width) => `${path.replace(/^\/+|\/+$/g, '').replaceAll('/', '-') || 'home'}-${width}.png`;

test.beforeAll(async () => mkdir(SCREENSHOTS, { recursive: true }));

test.describe('public responsive matrix', () => {
  for (const path of PAGES) for (const [width, height] of SIZES) {
    test(`${path} at ${width}px`, { tag: path === '/play/skift/' ? '@webgl' : [] }, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      const gameRequests = [];
      page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/play/skift/assets/')) gameRequests.push(request.url()); });
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', message => {
        if (message.type() === 'error' && !(path === '/404.html' && message.text().includes('404'))) errors.push(message.text());
      });
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      if (path === '/404.html') expect(response?.status()).toBe(404);
      else expect(response?.status()).toBe(200);
      if (path !== '/play/skift/') expect(response.headers()['x-cms-version']).toBe('1');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
      await expect(page).toHaveTitle(/Omar Yusuf/);
      const overflow = await page.evaluate(() => ({ viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      expect(Math.max(overflow.html, overflow.body)).toBeLessThanOrEqual(width + 1);
      for (const image of await page.locator('img').all()) expect(await image.getAttribute('alt')).not.toBeNull();
      expect((await page.locator('main').innerText()).trim()).not.toBe('');
      for (const control of await page.locator('button,a,input').all()) {
        if (!await control.isVisible()) continue;
        const label = await control.getAttribute('aria-label') || (await control.innerText()).trim() || await control.evaluate(element => [...(element.labels || [])].map(item => item.textContent).join(' ').trim());
        expect(label, await control.evaluate(element => element.outerHTML)).not.toBe('');
      }
      await expect(page.locator('iframe')).toHaveCount(0);
      await expect(page.locator('.header-actions .shift-link')).toHaveCount(0);
      const mobileMenu = width <= 1000;
      if (mobileMenu) await page.locator('[data-menu-toggle]').click();
      const shift = page.locator(mobileMenu ? '.mobile-menu .shift-link' : '.primary-nav .shift-link');
      await expect(shift).toBeVisible();
      await expect(shift).toHaveAttribute('href', '/play/skift/');
      const shiftBox = await shift.boundingBox();
      expect(shiftBox.x + shiftBox.width).toBeLessThanOrEqual(width);
      const appearance = await shift.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, border: getComputedStyle(element).borderTopWidth }));
      expect(appearance.background).toBe('rgba(0, 0, 0, 0)');
      if (!mobileMenu) expect(appearance.border).toBe('0px');
      if (mobileMenu) await page.locator('[data-menu-toggle]').click();
      expect(errors).toEqual([]);
      if (path !== '/play/skift/') expect(gameRequests).toEqual([]);
      if ([390, 1440].includes(width)) await page.screenshot({ path: join(SCREENSHOTS.pathname, screenshotName(path, width)), fullPage: true, animations: 'disabled' });
      await context.close();
    });
  }

  for (const width of [390, 1440]) {
    test(`No JavaScript navigation and fallback ${width}px`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 844 }, javaScriptEnabled: false, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/', { waitUntil: 'load' });
      await expect(page.locator('h1')).toContainText('Omar');
      await expect(page.getByRole('link', { name: 'Människan', exact: true })).toBeVisible();
      expect((await page.locator('noscript').innerText()).trim()).not.toBe('');
      await expect(page.locator('[data-print]')).toBeDisabled();
      await page.screenshot({ path: join(SCREENSHOTS.pathname, `home-no-js-${width}.png`), fullPage: true, animations: 'disabled' });
      await context.close();
    });
  }

  test('published sitemap parses as XML and lists every indexable page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const sitemap = await page.evaluate(async () => {
      const response = await fetch('/sitemap.xml');
      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
      return { status: response.status, errors: xml.querySelectorAll('parsererror').length, namespace: xml.documentElement.namespaceURI, urls: [...xml.getElementsByTagNameNS('http://www.sitemaps.org/schemas/sitemap/0.9', 'loc')].map(node => node.textContent).sort() };
    });
    expect(sitemap.status).toBe(200);
    expect(sitemap.errors).toBe(0);
    expect(sitemap.namespace).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(sitemap.urls).toEqual([...project.pages.filter(page => !page.noindex).map(page => 'https://omaryusuf.se' + page.path), 'https://omaryusuf.se/play/skift/'].sort());
  });
});

test.describe('raw v185 public Home before the owner migrates', () => {
  let runtime;
  test.beforeAll(async () => { runtime = await cmsRuntime({ project }); });
  test.afterAll(async () => { await runtime?.close(); });

  for (const width of [320, 1280]) test(`raw Home smoke at ${width}px; only the known 388px overflow is expected`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      const response = await page.goto(runtime.url + '/', { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      expect(response.headers()['x-cms-version']).toBe('1');
      await expect(page.locator('html')).toHaveClass(/js-ready/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
      await expect(page).toHaveTitle(/Omar Yusuf/);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('footer.site-footer')).toHaveCount(1);
      await expect(page.locator('[data-print]')).toBeEnabled();
      expect((await page.locator('main').innerText()).trim()).not.toBe('');
      const expected = width === 320 ? 388 : width;
      expect(await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }))).toEqual({ viewport: width, document: expected, body: expected });
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
