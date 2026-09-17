import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const PAGES = ['/', '/verkstad/', '/om/', '/projekt/furl/', '/projekt/blade-blend/', '/projekt/backhaul/', '/kontakt/', '/integritet/', '/kakor/', '/villkor/', '/tillganglighet/', '/404.html'];
const SIZES = [[320,780], [390,844], [768,1024], [1024,900], [1440,1000], [1920,1080]];
const SCREENSHOTS = new URL('../artifacts/screenshots/', import.meta.url);

const screenshotName = (path, width) => `${path.replace(/^\/+|\/+$/g, '').replaceAll('/', '-') || 'home'}-${width}.png`;

test.beforeAll(async () => mkdir(SCREENSHOTS, { recursive: true }));

test.describe('public responsive matrix', () => {
  for (const path of PAGES) for (const [width, height] of SIZES) {
    test(`${path} at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', message => {
        if (message.type() === 'error' && !(path === '/404.html' && message.text().includes('404'))) errors.push(message.text());
      });
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      if (path === '/404.html') expect(response?.status()).toBe(404);
      else expect(response?.status()).toBe(200);
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
      expect(errors).toEqual([]);
      if ([390, 1440].includes(width)) await page.screenshot({ path: join(SCREENSHOTS.pathname, screenshotName(path, width)), fullPage: true, animations: 'disabled' });
      await context.close();
    });
  }

  for (const width of [390, 1440]) {
    test(`No JavaScript navigation and fallback ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 844 }, javaScriptEnabled: false, reducedMotion: 'reduce' });
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
});
