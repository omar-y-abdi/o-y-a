import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { parseFragment, serializeOuter } from 'parse5';
import { elements } from '../src/cms/html-tree.mjs';
import { seed } from '../.generated/cms-seed.mjs';

let runtime;
// Each case renders a live 3D world. Share one fixture and run these cases in
// order so software-rendered CI does not run three worlds concurrently.
test.describe.configure({ mode: 'default' });
test.beforeAll(async () => { runtime = await cmsRuntime(); });
test.afterAll(async () => { await runtime?.close(); });
const snapshot = page => page.evaluate(() => window.__SKIFT__.snapshot());
async function openGame(page) {
  await page.goto(runtime.url + '/play/skift/?qa=1');
  await page.waitForFunction(() => window.__SKIFT__);
  await expect(page.locator('#start-button')).toBeEnabled();
}

test('loading and title menus remain dismissible and error recovery stays available', { tag: '@webgl' }, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
  await page.goto(runtime.url + '/play/skift/?qa=1');
  await expect(page.locator('#world canvas')).toHaveCount(1);
  await expect(page.locator('#start-button')).toBeDisabled();
  for (const loading of [true, false]) {
    for (const [menu, exit] of [['how', 'Escape'], ['settings', 'back'], ['how', 'close']]) {
      await page.locator(`[data-skift-menu] [data-action="${menu}"]`).click();
      await expect(page.locator('#modal')).toBeVisible();
      if (exit === 'Escape') await page.keyboard.press('Escape');
      else await page.locator(exit === 'back' ? '#modal .primary[data-action="close"]' : '#modal .modal-close').click();
      await expect(page.locator('#modal')).toBeHidden();
      await expect(page.locator('#title-screen')).toBeVisible();
      if (loading) await expect(page.locator('#start-button')).toBeDisabled();
    }
    if (loading) { await page.clock.resume(); await page.waitForFunction(() => window.__SKIFT__); }
  }
  await page.locator('#start-button').click();
  expect((await snapshot(page)).mode).toBe('play');
  await page.evaluate(() => document.querySelector('#world canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('#modal [data-action="reload"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal [data-action="reload"]')).toBeVisible();
  await page.locator('#modal [data-action="reload"]').click();
  await page.waitForFunction(() => window.__SKIFT__);
  await expect(page.locator('#start-button')).toBeEnabled();
  expect((await snapshot(page)).mode).toBe('menu');
});

test('integrated game supports input, pause, persisted settings and district checkpoint', { tag: '@webgl' }, async ({ page }) => {
  // Two WebGL initializations plus the complete input/pause/settings/persistence
  // flow can exhaust 30s on CI even while every step advances.
  test.setTimeout(60_000);
  const errors = []; page.on('pageerror', error => errors.push(String(error)));
  await page.setViewportSize({ width: 1440, height: 900 });
  await openGame(page);
  await expect(page.locator('.site-header .brand')).toHaveAttribute('aria-label', 'Omar Yusuf, startsida');
  await expect(page.locator('.primary-nav')).toHaveAttribute('aria-label', 'Huvudmeny');
  for (const selector of ['.footer-bottom nav a', '.consent-banner p a', '.skip-link']) await expect(page.locator(selector).first()).toHaveCSS('text-decoration-line', 'underline');
  await page.locator('#start-button').click();
  const first = await snapshot(page);
  await page.keyboard.down('d');
  try {
    await expect.poll(async () => {
      const moved = await snapshot(page);
      return Math.hypot(moved.player.x - first.player.x, moved.player.z - first.player.z);
    }).toBeGreaterThan(1);
  } finally { await page.keyboard.up('d'); }
  await page.keyboard.press('Space');
  await expect.poll(async () => (await snapshot(page)).dashCooldown).toBeGreaterThan(0);
  await page.keyboard.press('j');
  await expect.poll(async () => (await snapshot(page)).pulseCooldown).toBeGreaterThan(0);
  await page.keyboard.press('Escape'); await expect(page.locator('#modal')).toBeVisible();
  const paused = await snapshot(page); await page.waitForTimeout(300);
  expect((await snapshot(page)).time).toBe(paused.time);
  await page.locator('#modal [data-action="settings"]').click();
  await page.locator('[data-setting="sound"]').uncheck();
  await page.locator('[data-setting="language"]').selectOption('en');
  await page.reload(); await page.waitForFunction(() => window.__SKIFT__);
  const restored = await snapshot(page);
  expect(restored.settings.sound).toBe(false); expect(restored.settings.language).toBe('en');
  await expect(page.locator('#new-button')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a warm return reuses the versioned bootstrap and game and still starts a run', { tag: '@webgl' }, async ({ page, context }) => {
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  const cached = new Set(), responses = new Map();
  session.on('Network.requestServedFromCache', ({ requestId }) => cached.add(requestId));
  session.on('Network.responseReceived', ({ requestId, response }) => {
    if (/\/(?:play\/skift\/assets\/app\.js|assets\/skift-bootstrap\.[A-Z0-9]{8}\.mjs)/.test(new URL(response.url).pathname)) responses.set(requestId, response);
  });
  await openGame(page);
  expect(responses.size).toBe(2);
  await page.goto(runtime.url + '/om/');
  cached.clear(); responses.clear();
  await openGame(page);
  expect(responses.size).toBe(2);
  const network = [...responses].filter(([id, response]) => !response.fromDiskCache && !cached.has(id)).map(([, response]) => response.url);
  expect(network).toEqual([]);
  await page.locator('#start-button').click();
  expect((await snapshot(page)).mode).toBe('play');
  await session.detach();
});

test('mobile game keeps touch controls visible and plays after resize', { tag: '@webgl' }, async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await openGame(page); await page.locator('#start-button').tap();
  await expect(page.locator('#joystick')).toBeVisible();
  await page.locator('#dash-control').tap();
  await expect.poll(async () => (await snapshot(page)).dashCooldown).toBeGreaterThan(0);
  await page.setViewportSize({ width: 844, height: 390 });
  expect((await snapshot(page)).mode).toBe('play');
  const controls = await page.evaluate(() => ['.district-card', '.run-card', '#dash-control', '#pulse-control'].map(selector => {
    const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
    return { x, y, width, height };
  }));
  for (const box of controls) {
    expect(box.width).toBeGreaterThan(0); expect(box.height).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(844);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(390);
  }
  await context.close();
});

// A14/B8: the game's complete main is code-owned. CMS publication supplies
// its shared frame and runtime texts, without storing the game as a CMS page.
test('CMS edits SKIFT texts while the live main stays the code-owned build', { tag: '@webgl' }, async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(runtime.url + '/admin/');
  await expect(page.locator('[data-page-id="home"]')).toBeVisible();
  await expect(page.locator('[data-page-id="skift"]')).toHaveCount(0);
  await page.locator('[data-action="runtime"]').click();
  await page.locator('#copy-search').fill('SKIFT');
  await expect(page.locator('[data-copy-key^="runtime.skift."][data-copy-key$=".footer"]')).toHaveCount(0);
  const intro = page.locator('[data-copy-key="runtime.skift.sv.intro"]');
  await intro.fill('CMS-intro <img src=x onerror="window.injected=true">');
  const saved = page.waitForResponse(response => response.url().endsWith('/admin/api/save'));
  await page.locator('[data-action="save"]').click();
  const publication = await saved;
  expect(publication.status(), await publication.text()).toBe(200);
  const { version } = await publication.json();
  await expect(page.locator('#save-status')).toContainText(/Sparat|Sparad|Alla ändringar/i);
  const live = await context.newPage();
  const response = await live.goto(runtime.url + '/play/skift/');
  expect(response.headers()['x-cms-version']).toBe(String(version));
  const main = html => serializeOuter(elements(parseFragment(html)).find(node => node.tagName === 'main')).replace(/ data-cms-node="[^"]+"/g, '');
  expect(main(await response.text())).toBe(main(seed.skiftPage.html));
  await expect(live).toHaveTitle('SKIFT | Starta ditt arbetsskift | Omar Yusuf');
  await expect(live.locator('.intro')).toHaveText('CMS-intro <img src=x onerror="window.injected=true">');
  await expect(live.locator('.intro img')).toHaveCount(0);
  expect(errors).toEqual([]);
});
