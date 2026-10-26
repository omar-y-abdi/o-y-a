import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';
import { CSP, SKIFT_CSP } from '../src/csp.mjs';

test.use({ viewport: { width: 390, height: 844 } });
const GAME_SCRIPT = /\/play\/skift\/assets\/app\.js(?:\?|$)/;

const copy = {
  ...initial.runtime,
  'runtime.memory.aria.cardIdle': 'CMS-kort {number}',
  'runtime.privacy.status.unavailable': 'CMS-statistik </script><!-- $&',
  'runtime.motion.label.systemPaused': 'CMS-rörelse pausad',
  'runtime.contact.config.unavailable': 'CMS-postlucka stängd',
  'runtime.nav.menu.open': 'CMS öppna menyn',
  'runtime.nav.menu.close': 'CMS stäng menyn',
  'runtime.motion.label.enable': 'CMS aktivera rörelser',
  'runtime.motion.label.pause': 'CMS pausa rörelser',
  'runtime.motion.toast.paused': 'CMS rörelser pausade',
  'runtime.motion.toast.enabled': 'CMS rörelser aktiverade',
  'runtime.privacy.status.allowed': 'CMS statistik tillåts',
  'runtime.privacy.status.denied': 'CMS bara nödvändiga',
  'runtime.privacy.status.unset': 'CMS inget val ännu',
  'runtime.privacy.toast.allowed': 'CMS statistik sparad',
  'runtime.privacy.toast.denied': 'CMS nödvändiga sparat',
  'runtime.fold.button.expand': 'CMS vik ut ',
  'runtime.fold.button.collapse': 'CMS vik ihop ',
  'runtime.fold.status.folded': 'CMS rader hopvikta',
  'runtime.fold.status.expanded': 'CMS alla rader visas',
};
async function observeCsp(page) {
  await page.addInitScript(() => {
    window.__p2bViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.__p2bViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI }));
  });
}

// This controlled transport keeps the copy promise pending independently of
// AbortSignal's wall clock. Remove embedded copy so it cannot bypass the held
// fetch. Real HTTP embedding/fallback is checked separately.
async function holdCopy(page, path = '/play/skift/') {
  await page.route(url => url.pathname === path, async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/<script type="application\/json" id="cms-runtime">[\s\S]*?<\/script>/, '');
    await route.fulfill({ response, body });
  });
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

test.describe('public startup', () => {
  let runtime;
  test.beforeAll(async () => {
    runtime = await cmsRuntime();
    await publishSite(runtime.db, { project: { ...initial, runtime: copy }, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
  });
  test.afterAll(async () => runtime?.close());

  for (const failed of [/\/assets\/skift-bootstrap\.[^/]+\.mjs$/, GAME_SCRIPT]) {
    test(`SKIFT module failure exposes reload and keeps navigation usable: ${failed}`, async ({ page }) => {
      await page.route(failed, route => route.abort());
      await page.goto(runtime.url + '/play/skift/');
      const failure = page.locator('[data-skift-load-error]');
      await expect(failure).toBeVisible();
      await expect(page.locator('#load-status')).toBeHidden();
      await expect(page.locator('#start-button')).toBeDisabled();
      await page.locator('[data-menu-toggle]').click();
      await expect(page.locator('#mobile-menu')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.unroute(failed);
      // Avoid requiring WebGL here: this is a real import/reload recovery gate.
      await page.route(GAME_SCRIPT, route => route.fulfill({ contentType: 'text/javascript', body: 'document.querySelector("#start-button").disabled = false;' }));
      await failure.getByRole('link', { name: 'Ladda om' }).click();
      await expect(failure).toBeHidden();
      await expect(page.locator('#start-button')).toBeEnabled();
    });
  }

  for (const width of [390, 768, 1000]) {
    test(`navigation remains available when main module fails at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route(/\/assets\/main\.[^/]+\.mjs$/, route => route.abort());
      await page.goto(runtime.url + '/');
      await expect(page.locator('html')).not.toHaveClass(/js-ready/);
      await expect(page.locator('[data-menu-toggle]')).toBeHidden();
      const about = page.locator('.primary-nav a[href="/om/"]');
      await expect(about).toBeVisible();
      await about.click();
      await expect(page).toHaveURL(runtime.url + '/om/');
    });
  }

  test('SKIFT shell handlers wait for the shared pending runtime copy before producing text', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await holdCopy(page);
    await page.route('**/api/config', route => route.fulfill({ json: { analytics: true } }));
    await page.route('**/api/event', route => route.fulfill({ status: 204 }));
    await page.route(GAME_SCRIPT, route => route.fulfill({ contentType: 'text/javascript', body: '' }));
    await page.goto(runtime.url + '/play/skift/', { waitUntil: 'networkidle' });
    await expect(page.locator('#cms-runtime')).toHaveCount(0);
    await expect(page.locator('html')).toHaveClass(/js-ready/);
    const menu = page.locator('[data-menu-toggle]');
    const initialLabel = await menu.getAttribute('aria-label');
    await menu.click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await expect(menu).toHaveAttribute('aria-label', initialLabel);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-menu')).toBeHidden();
    await expect(menu).toBeFocused();
    await menu.click();
    // Programmatic clicks reach pending handlers without Playwright waiting for
    // a disabled control or a dialog whose opening correctly waits for copy.
    await page.evaluate(() => {
      document.querySelector('[data-motion-toggle]').click();
      document.querySelector('[data-privacy-open]').click();
    });
    await expect(page.locator('[data-privacy-status]')).toHaveText('');
    await expect(page.locator('[data-toast]')).toBeHidden();
    expect(await page.evaluate(() => document.querySelector('[data-privacy-dialog]').open)).toBe(false);
    expect(await page.evaluate(() => document.cookie)).not.toContain('oy_motion=');
    await page.evaluate(() => window.__p2bReleaseCopy());
    await expect(menu).toHaveAttribute('aria-label', copy['runtime.nav.menu.close']);
    await expect(page.locator('[data-toast]')).toHaveText(copy['runtime.motion.toast.paused']);
    await expect(page.locator('[data-privacy-dialog]')).toBeVisible();
    await expect(page.locator('[data-privacy-status]')).toHaveText(copy['runtime.privacy.status.unset']);
    await page.locator('[data-dialog-close]').click();
    // Finish the dialog's asynchronous focus restoration before closing the menu.
    await expect(page.locator('[data-privacy-dialog]')).toBeHidden();
    await expect(page.locator('.site-footer [data-privacy-open]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-label', copy['runtime.nav.menu.open']);
    await expect(menu).toBeFocused();
    await page.locator('[data-motion-toggle]').click();
    await expect(page.locator('[data-toast]')).toHaveText(copy['runtime.motion.toast.enabled']);
    expect(await page.evaluate(() => window.__p2bRuntimeRequests)).toBe(1);
  });

  for (const choice of ['deny', 'allow']) {
    test(`SKIFT ${choice} consent waits for copy before changing cookies or text`, async ({ page }) => {
      await holdCopy(page);
      await page.route('**/api/config', route => route.fulfill({ json: { analytics: true } }));
      await page.route('**/api/event', route => route.fulfill({ status: 204 }));
      await page.route(GAME_SCRIPT, route => route.fulfill({ contentType: 'text/javascript', body: '' }));
      await page.goto(runtime.url + '/play/skift/', { waitUntil: 'networkidle' });
      await expect(page.locator('#cms-runtime')).toHaveCount(0);
      await expect(page.locator('html')).toHaveClass(/js-ready/);
      await page.evaluate(choice => document.querySelector(`[data-privacy-dialog] [data-consent="${choice}"]`).click(), choice);
      await expect(page.locator('[data-toast]')).toBeHidden();
      await expect(page.locator('[data-privacy-status]')).toHaveText('');
      expect(await page.evaluate(() => document.cookie)).not.toContain('oy_privacy=');
      await page.evaluate(() => window.__p2bReleaseCopy());
      await expect(page.locator('[data-toast]')).toHaveText(copy[`runtime.privacy.toast.${choice === 'allow' ? 'allowed' : 'denied'}`]);
      await expect(page.locator('[data-privacy-status]')).toHaveText(copy[`runtime.privacy.status.${choice === 'allow' ? 'allowed' : 'denied'}`]);
      expect(await page.evaluate(() => document.cookie)).toContain(`oy_privacy=v1.${choice}`);
      expect(await page.evaluate(() => window.__p2bRuntimeRequests)).toBe(1);
    });
  }

  test('fold action waits for copy and uses owner labels on its first change', async ({ page }) => {
    await holdCopy(page, '/projekt/furl/');
    await page.goto(runtime.url + '/projekt/furl/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveClass(/js-ready/);
    const fold = page.locator('[data-fold]');
    const initialText = await fold.textContent();
    const initialStatus = await page.locator('[data-fold-status]').textContent();
    await fold.click();
    await expect(fold).toHaveAttribute('aria-pressed', 'false');
    await expect(fold).toHaveText(initialText);
    await expect(page.locator('[data-fold-status]')).toHaveText(initialStatus);
    await page.evaluate(() => window.__p2bReleaseCopy());
    await expect(fold).toHaveAttribute('aria-pressed', 'true');
    await expect(fold).toHaveText(copy['runtime.fold.button.expand'].trim());
    await expect(page.locator('[data-fold-status]')).toHaveText(copy['runtime.fold.status.folded']);
    await fold.click();
    await expect(fold).toHaveText(copy['runtime.fold.button.collapse'].trim());
    await expect(page.locator('[data-fold-status]')).toHaveText(copy['runtime.fold.status.expanded']);
  });

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

  test('SKIFT frame embeds shared copy for shell and game without a runtime fetch', async ({ page }) => {
    const runtimeRequests = [], gameRequests = [];
    page.on('request', request => { if (new URL(request.url()).pathname === '/data/runtime.json') runtimeRequests.push(request.url()); });
    await page.route(GAME_SCRIPT, async route => {
      gameRequests.push(route.request().url());
      await route.fulfill({ contentType: 'text/javascript', body: 'window.__p2bGameCopy = globalThis.__OY_SKIFT_COPY__;' });
    });
    const response = await page.goto(runtime.url + '/play/skift/', { waitUntil: 'networkidle' });
    expect(response.headers()['content-security-policy']).toBe(SKIFT_CSP);
    expect(await page.locator('#cms-runtime').evaluate(node => JSON.parse(node.textContent))).toEqual(copy);
    await expect(page.locator('[data-menu-toggle]')).toHaveAttribute('aria-label', copy['runtime.nav.menu.open']);
    await expect.poll(() => page.evaluate(() => window.__p2bGameCopy)).toEqual(copy);
    expect(runtimeRequests).toEqual([]);
    expect(gameRequests).toHaveLength(1);
    expect(new URL(gameRequests[0]).searchParams.get('v')).toMatch(/^[a-f0-9]{12}$/);
  });

  test('shell runs while copy waits; memory and privacy initialize with loaded text', async ({ page }) => {
    await observeCsp(page);
    await holdCopy(page, '/verkstad/');
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
    await holdCopy(page, '/kontakt/');
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
    await page.route(GAME_SCRIPT, async route => {
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

test.describe('privacy dialog pointer closure on published v185', () => {
  let runtime;
  test.beforeAll(async () => {
    const project = JSON.parse(await readFile(new URL('./fixtures/cms-v185-project.json', import.meta.url), 'utf8'));
    runtime = await cmsRuntime();
    await publishSite(runtime.db, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
  });
  test.afterAll(async () => runtime?.close());

  for (const width of [390, 1440]) {
    for (const path of ['/', '/play/skift/']) {
      test(`${path} X closes the dialog and restores footer focus at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        // The privacy shell must work independently of the game's WebGL runtime.
        await page.route(GAME_SCRIPT, route => route.fulfill({ contentType: 'text/javascript', body: '' }));
        const response = await page.goto(runtime.url + path, { waitUntil: 'networkidle' });
        expect(response.status()).toBe(200);
        if (path === '/') expect(response.headers()['x-cms-version']).toBe('1');
        const trigger = page.locator('.site-footer [data-privacy-open]');
        const dialog = page.locator('[data-privacy-dialog]');
        const closer = dialog.locator('[data-dialog-close]');

        await trigger.click();
        await expect(dialog).toBeVisible();
        await closer.click();
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
      });
    }
  }
});
