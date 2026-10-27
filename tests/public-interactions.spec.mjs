import { test as base, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { publicRuntime } from './helpers/cms-runtime.mjs';

// HTTP-mode parity for browser.py: actual Worker, browser cookies and CSP.
// Fresh contexts preserve independent consent/motion state for every visit.
const test = base.extend({
  origins: [async ({}, use) => {
    const normal = await publicRuntime();
    let analytics;
    try {
      analytics = await publicRuntime({ analytics: true });
      await use({ normal: normal.url, analytics: analytics.url });
    } finally { try { await analytics?.close(); } finally { await normal.close(); } }
  }, { scope: 'worker' }],
  visit: async ({ browser, origins }, use) => {
    const contexts = [];
    try {
      await use(async (path, { width = 1440, height = 1000, motion = 'reduce', analytics = false, cookie, blockedCookie = false, gpc = false, dnt = false } = {}) => {
        const origin = analytics ? origins.analytics : origins.normal;
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, javaScriptEnabled: true, reducedMotion: motion, acceptDownloads: true });
        contexts.push(context);
        if (cookie) await context.addCookies([{ ...cookie, url: origin }]);
        if (blockedCookie) await context.addInitScript(() => {
          const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
          Object.defineProperty(document, 'cookie', { get: () => descriptor.get.call(document), set: () => {} });
        });
        if (gpc) await context.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
        if (dnt) await context.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { value: '1' }));
        const page = await context.newPage(), errors = [], events = [];
        page.on('pageerror', error => errors.push(String(error)));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('request', request => { if (new URL(request.url()).pathname === '/api/event') events.push(request.postDataJSON()); });
        await page.goto(origin + path, { waitUntil: 'networkidle' });
        return { page, errors, events, context };
      });
    } finally { for (const context of contexts) await context.close(); }
  },
});

const mobile = { width: 390, height: 844 };
const clean = session => expect(session.errors).toEqual([]);
const names = session => session.events.map(event => event.event);
const waitEvents = (session, expected) => expect.poll(() => names(session), { timeout: 3000, intervals: [20] }).toEqual(expected);
async function screenshot(page, info, name, fullPage = true) {
  if (fullPage) await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await page.screenshot({ path: info.outputPath(name + '.png'), fullPage, animations: 'disabled' });
}

test('Machine: all flavors, distinct receipts, close and focus restore', async ({ visit }, info) => {
  const session = await visit('/verkstad/', mobile), { page } = session, messages = [];
  await expect(page.locator('[data-print]')).toBeEnabled();
  for (const flavor of ['kind', 'joke', 'pause']) {
    await page.locator(`input[value="${flavor}"]`).check();
    for (let index = 0; index < 2; index++) {
      await page.locator('[data-print]').click();
      await expect(page.locator('[data-receipt]')).toBeVisible();
      const text = await page.locator('[data-card-message]').innerText();
      expect(text).toBeTruthy();
      expect(text).not.toBe(messages.at(-1));
      messages.push(text);
      await expect(page.locator('[data-share]')).toBeEnabled();
      await expect(page.locator('[data-save]')).toBeEnabled();
      await screenshot(page, info, `workshop-${flavor}-${index}-receipt-390`);
      await page.locator('[data-receipt-close]').click();
      await expect(page.locator('[data-print]')).toBeFocused();
    }
  }
  clean(session);
});

test('Shared card exact-ID lookup and hostile query rejection', async ({ visit }, info) => {
  const shared = await visit('/verkstad/?kort=j01');
  await expect(shared.page.locator('[data-receipt]')).toBeVisible();
  await expect(shared.page.locator('input[value="joke"]')).toBeChecked();
  await screenshot(shared.page, info, 'shared-receipt-1440');
  clean(shared);
  const hostile = await visit('/verkstad/?kort=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
  await expect(hostile.page.locator('[data-receipt]')).toBeHidden();
  await expect(hostile.page.locator('[data-toast]')).toHaveText('Det kortet finns inte. Tryck fram ett nytt i stället.');
  await expect(hostile.page.locator('img')).toHaveCount(0);
  clean(hostile);
});

test('Clipboard denial: usable labelled manual copy fallback', async ({ visit }, info) => {
  const session = await visit('/verkstad/?kort=k01', mobile), { page } = session;
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Blocked'); } } }));
  await page.locator('[data-share]').click();
  await expect(page.locator('[data-copy-fallback]')).toBeVisible();
  expect(await page.locator('#share-url').inputValue()).toMatch(/\/verkstad\/\?kort=k01$/);
  await expect(page.locator('#share-url')).toBeFocused();
  await screenshot(page, info, 'clipboard-fallback-390');
  clean(session);
});

test('Save: actual generated 1200x800 PNG', async ({ visit }, info) => {
  const session = await visit('/verkstad/?kort=p01'), { page } = session;
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    window.__savedCard = null;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...rest) {
      window.__savedCard = this.toDataURL('image/png');
      return original.call(this, callback, ...rest);
    };
  });
  await page.locator('[data-save]').click();
  await page.waitForFunction(() => window.__savedCard !== null);
  const data = await page.evaluate(() => window.__savedCard);
  expect(data).toMatch(/^data:image\/png;base64,/);
  const png = Buffer.from(data.split(',')[1], 'base64');
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 800]);
  await writeFile(info.outputPath('saved-card.png'), png);
  clean(session);
});

test('Bubbles: keyboard, count, duplicate suppression, reset, sound off/failure', async ({ visit }, info) => {
  const session = await visit('/verkstad/', mobile), { page } = session, sound = page.locator('[data-sound-toggle]');
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await expect(sound).toContainText('av');
  await expect(page.locator('[data-bubble="0"]')).toBeEnabled();
  for (let index = 0; index < 12; index++) {
    const bubble = page.locator(`[data-bubble="${index}"]`);
    await bubble.focus(); await page.keyboard.press('Space');
    await expect(bubble).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(page.locator('[data-bubble-status]')).toContainText('Alla poppade');
  await page.locator('[data-bubble="11"]').click();
  await expect(page.locator('[data-bubble-status]')).toContainText('Alla poppade');
  await screenshot(page, info, 'bubbles-popped-390');
  await page.locator('[data-bubble-reset]').click();
  await expect(page.locator('[data-bubble][aria-pressed="false"]')).toHaveCount(12);
  await page.evaluate(() => { window.AudioContext = undefined; window.webkitAudioContext = undefined; });
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-toast]')).toContainText('Ljud stöds inte');
  clean(session);
});

test('Skip link, mobile menu, Escape and resize dismissal', async ({ visit }, info) => {
  const session = await visit('/', mobile), { page } = session, toggle = page.locator('[data-menu-toggle]');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toContainText('Hoppa');
  await toggle.click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await screenshot(page, info, 'mobile-menu-390');
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-menu')).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click(); await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator('#mobile-menu')).toBeHidden();
  clean(session);
});

test('Mobile short action labels do not wrap into cramped pills', async ({ visit }) => {
  const { page } = await visit('/om/', mobile);
  for (const selector of ['.hello-link', '.about-cta .button']) {
    const control = page.locator(selector);
    if (!await control.isVisible()) continue;
    const lines = await control.evaluate(element => { const range = document.createRange(); range.selectNodeContents(element.childNodes[0]); return range.getClientRects().length; });
    expect(lines, selector).toBeLessThanOrEqual(1);
  }
});

test('Furl illustrative fold/unfold preserves and restores all lines', async ({ visit }, info) => {
  const session = await visit('/projekt/furl/'), { page } = session;
  await page.locator('[data-fold]').click();
  await expect(page.locator('.repeat-line:visible')).toHaveCount(0);
  await expect(page.locator('.folded-line')).toBeVisible();
  await screenshot(page, info, 'furl-folded-1440');
  await page.locator('[data-fold]').click();
  await expect(page.locator('.repeat-line:visible')).toHaveCount(3);
  await expect(page.locator('.folded-line')).toBeHidden();
  await expect(page.locator('[data-fold-status]')).toContainText('inte');
  clean(session);
});

test('System reduced motion and explicit pause, animations actually stopped', async ({ visit }) => {
  const reduced = await visit('/');
  await expect(reduced.page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(reduced.page.locator('[data-motion-toggle]')).toBeDisabled();
  expect(await reduced.page.locator('.joy-ball').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await reduced.page.locator('[data-print]').click();
  await expect(reduced.page.locator('[data-receipt]')).toBeVisible();
  await expect(reduced.page.locator('.confetti-piece')).toHaveCount(0);
  clean(reduced);
  const manual = await visit('/', { motion: 'no-preference' });
  await manual.page.locator('[data-motion-toggle]').click();
  await expect(manual.page.locator('html')).toHaveAttribute('data-motion', 'off');
  expect(await manual.page.locator('.joy-ball').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  expect(await manual.page.evaluate(() => document.cookie)).toContain('oy_motion=off');
  clean(manual);
});

test('Native privacy dialog: disabled unavailable tracking, focus trap and restoration', async ({ visit }, info) => {
  const session = await visit('/', mobile), { page } = session, button = page.locator('[data-privacy-open]').first(), dialog = page.locator('[data-privacy-dialog]');
  await button.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('[data-privacy-status]')).toContainText('inte aktiv');
  await expect(dialog.locator('[data-consent="allow"]')).toBeDisabled();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !document.hasFocus() || document.activeElement.closest('dialog') !== null)).toBe(true);
  }
  await screenshot(page, info, 'privacy-dialog-390', false);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
  clean(session);
});

test('Consent gates collection and revocation stops new events immediately', async ({ visit }, info) => {
  const session = await visit('/verkstad/', { ...mobile, analytics: true }), { page } = session, receipt = page.locator('[data-receipt]');
  await page.waitForTimeout(100);
  expect(session.events).toEqual([]);
  await expect(page.locator('[data-consent-banner]')).toBeVisible();
  await screenshot(page, info, 'consent-banner-390', false);
  await page.locator('[data-consent-banner] [data-consent="allow"]').click();
  await waitEvents(session, ['page_view']);
  await page.locator('[data-print]').click();
  await expect(receipt).toBeVisible();
  await waitEvents(session, ['page_view', 'joy']);
  await page.locator('[data-receipt-close]').click();
  await expect(receipt).toBeHidden();
  await page.locator('[data-print]').click();
  await expect(receipt).toBeVisible();
  expect(names(session)).toEqual(['page_view', 'joy']);
  await page.locator('[data-privacy-open]').first().click();
  await page.locator('dialog [data-consent="deny"]').click();
  for (let index = 0; index < 12; index++) await page.locator(`[data-bubble="${index}"]`).click();
  expect(names(session)).toEqual(['page_view', 'joy']);
  clean(session);
});

test('Revocation stops tracking even when overwriting an old allow cookie fails', async ({ visit }) => {
  const session = await visit('/', { analytics: true, cookie: { name: 'oy_privacy', value: 'v1.allow' }, blockedCookie: true }), { page } = session;
  await waitEvents(session, ['page_view']);
  await page.locator('[data-privacy-open]').first().click();
  await page.locator('dialog [data-consent="deny"]').click();
  await page.locator('[data-print]').click();
  await expect(page.locator('[data-receipt]')).toBeVisible();
  expect(names(session)).toEqual(['page_view']);
  clean(session);
});

for (const setting of ['gpc', 'dnt', 'blockedCookie']) test(`Privacy fails closed: ${setting}`, async ({ visit }) => {
  const session = await visit('/', { analytics: true, [setting]: true }), { page } = session;
  if (setting === 'blockedCookie') {
    await page.locator('[data-consent-banner] [data-consent="allow"]').click();
    await expect(page.locator('[data-toast]')).toContainText('sparade inte');
  } else {
    await expect(page.locator('[data-consent-banner]')).toBeHidden();
    await page.locator('[data-privacy-open]').first().click();
    await expect(page.locator('dialog [data-consent="allow"]')).toBeDisabled();
    await page.keyboard.press('Escape');
  }
  await page.locator('[data-print]').click();
  await expect(page.locator('[data-receipt]')).toBeVisible();
  expect(session.events).toEqual([]);
  clean(session);
});
