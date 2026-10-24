import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';
import { CSP, SKIFT_CSP } from '../src/csp.mjs';

const copy = {
  ...initial.runtime,
  'runtime.memory.aria.cardIdle': 'CMS-kort {number}',
  'runtime.privacy.status.unavailable': 'CMS-statistik </script><!-- $&',
  'runtime.motion.label.systemPaused': 'CMS-rörelse pausad',
  'runtime.contact.config.unavailable': 'CMS-postlucka stängd',
};
let runtime;
test.beforeAll(async () => {
  runtime = await cmsRuntime();
  await publishSite(runtime.db, { project: { ...initial, runtime: copy }, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
});
test.afterAll(async () => runtime?.close());

async function observeCsp(page) {
  await page.addInitScript(() => {
    window.__p2bViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.__p2bViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI }));
  });
}

// This controlled transport keeps the copy promise pending independently of
// AbortSignal's wall clock. Real HTTP embedding/fallback is checked separately.
async function holdCopy(page) {
  await page.addInitScript(runtimeCopy => {
    const originalFetch = window.fetch.bind(window);
    window.__p2bRuntimeRequests = 0;
    const pending = new Promise(resolve => { window.__p2bReleaseCopy = () => resolve(Response.json(runtimeCopy)); });
    window.fetch = (input, options) => {
      if (input === '/data/runtime.json') { window.__p2bRuntimeRequests++; return pending; }
      return originalFetch(input, options);
    };
  }, copy);
}

for (const browserName of ['chromium', 'firefox', 'webkit']) {
  test.describe(`public startup in ${browserName}`, () => {
    test.use({ browserName, channel: '', launchOptions: {}, viewport: { width: 390, height: 844 } });

    test('embedded copy initializes labels without a runtime request or CSP violation', async ({ page }) => {
      const requests = [], errors = [];
      page.on('request', request => { if (new URL(request.url()).pathname === '/data/runtime.json') requests.push(request.url()); });
      page.on('pageerror', error => errors.push(String(error)));
      await observeCsp(page);
      const response = await page.goto(runtime.url + '/verkstad/', { waitUntil: 'networkidle' });
      expect(response.headers()['content-security-policy']).toBe(CSP);
      await expect(page.locator('[data-memory-card="0"]')).toHaveAttribute('aria-label', 'CMS-kort 1');
      await expect(page.locator('[data-motion-toggle]')).toHaveAttribute('aria-label', copy['runtime.motion.label.systemPaused']);
      await expect(page.locator('[data-privacy-status]')).toHaveText(copy['runtime.privacy.status.unavailable']);
      expect(await page.locator('#cms-runtime').evaluate(node => JSON.parse(node.textContent))).toEqual(copy);
      expect(requests).toEqual([]);
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => window.__p2bViolations)).toEqual([]);
    });

    test('missing runtime block still fetches the public endpoint once', async ({ page }) => {
      let requests = 0;
      page.on('request', request => { if (new URL(request.url()).pathname === '/data/runtime.json') requests++; });
      await page.route('**/verkstad/', async route => {
        const response = await route.fetch();
        const body = (await response.text()).replace(/<script type="application\/json" id="cms-runtime">[\s\S]*?<\/script>/, '');
        await route.fulfill({ response, body });
      });
      await page.goto(runtime.url + '/verkstad/', { waitUntil: 'networkidle' });
      await expect(page.locator('[data-memory-card="0"]')).toHaveAttribute('aria-label', 'CMS-kort 1');
      await expect(page.locator('[data-privacy-status]')).toHaveText(copy['runtime.privacy.status.unavailable']);
      expect(requests).toBe(1);
    });

    test('shell runs while copy waits; memory and privacy initialize with loaded text', async ({ page }) => {
      await observeCsp(page);
      await holdCopy(page);
      await page.route('**/verkstad/', async route => {
        const response = await route.fetch();
        const body = (await response.text()).replace(/<script type="application\/json" id="cms-runtime">[\s\S]*?<\/script>/, '');
        await route.fulfill({ response, body });
      });
      await page.goto(runtime.url + '/verkstad/', { waitUntil: 'load' });
      await expect(page.locator('html')).toHaveClass(/js-ready/);
      await expect(page.locator('[data-memory-card="0"]')).toBeDisabled();
      await expect(page.locator('[data-print]')).toBeDisabled();
      await page.locator('[data-menu-toggle]').click();
      await expect(page.locator('#mobile-menu')).toBeVisible();
      await page.evaluate(() => window.__p2bReleaseCopy());
      await expect(page.locator('[data-memory-card="0"]')).toBeEnabled();
      await expect(page.locator('[data-print]')).toBeEnabled();
      await expect(page.locator('[data-memory-card="0"]')).toHaveAttribute('aria-label', 'CMS-kort 1');
      await expect(page.locator('[data-motion-toggle]')).toHaveAttribute('aria-label', copy['runtime.motion.label.systemPaused']);
      await expect(page.locator('[data-privacy-status]')).toHaveText(copy['runtime.privacy.status.unavailable']);
      expect(await page.evaluate(() => window.__p2bRuntimeRequests)).toBe(1);
      expect(await page.evaluate(() => window.__p2bViolations)).toEqual([]);
    });

    test('contact initialization waits for copy even when the envelope opens first', async ({ page }) => {
      await holdCopy(page);
      await page.route('**/kontakt/', async route => {
        const response = await route.fetch();
        const body = (await response.text()).replace(/<script type="application\/json" id="cms-runtime">[\s\S]*?<\/script>/, '');
        await route.fulfill({ response, body });
      });
      await page.route('**/api/contact/config', route => route.fulfill({ json: { enabled: false } }));
      await page.goto(runtime.url + '/kontakt/', { waitUntil: 'load' });
      await expect(page.locator('html')).toHaveClass(/js-ready/);
      await page.locator('[data-postbox] > summary').click();
      await expect(page.locator('[data-contact-status]')).toHaveText('');
      await page.evaluate(() => window.__p2bReleaseCopy());
      await expect(page.locator('[data-contact-status]')).toHaveText(copy['runtime.contact.config.unavailable']);
    });

    test('SKIFT entry shares pending copy and cannot block the shell', async ({ page }) => {
      await holdCopy(page);
      let appRequests = 0;
      await page.route('**/play/skift/assets/app.js', async route => {
        appRequests++;
        await route.fulfill({ contentType: 'text/javascript', body: 'window.__p2bGameCopy = globalThis.__OY_SKIFT_COPY__;' });
      });
      const response = await page.goto(runtime.url + '/play/skift/', { waitUntil: 'networkidle' });
      expect(response.headers()['content-security-policy']).toBe(SKIFT_CSP);
      await expect(page.locator('html')).toHaveClass(/js-ready/);
      await page.locator('[data-menu-toggle]').click();
      await expect(page.locator('#mobile-menu')).toBeVisible();
      expect(appRequests).toBe(0);
      expect(await page.evaluate(() => window.__p2bRuntimeRequests)).toBe(1);
      await page.evaluate(() => window.__p2bReleaseCopy());
      await expect.poll(() => page.evaluate(() => window.__p2bGameCopy)).toEqual(copy);
      expect(appRequests).toBe(1);
      expect(await page.evaluate(() => window.__p2bRuntimeRequests)).toBe(1);
    });
  });
}
