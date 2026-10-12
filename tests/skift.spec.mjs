import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

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

test('integrated game supports input, pause, persisted settings and district checkpoint', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(String(error)));
  await page.setViewportSize({ width: 1440, height: 900 });
  await openGame(page);
  await expect(page.locator('.site-header .brand')).toHaveAttribute('aria-label', 'Omar Yusuf, startsida');
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

test('mobile game keeps touch controls visible and plays after resize', async ({ browser }) => {
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

test('CMS page settings, visual editing, Save and interactive preview work for SKIFT', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  const page = await context.newPage();
  const errors = [], audio = [];
  await page.clock.install();
  page.on('pageerror', error => errors.push(String(error)));
  page.on('response', response => { if (response.url().includes('/play/skift/audio/')) audio.push({ url: response.url(), status: response.status() }); });
  await page.goto(runtime.url + '/admin/');
  await page.locator('[data-page-id="skift"]').click();
  await expect(page.locator('#page-name')).toHaveValue('SKIFT');
  await page.locator('#page-title').fill('CMS-testat skift | Omar Yusuf');
  await page.locator('#page-title').dispatchEvent('change');
  await page.locator('[data-action="runtime"]').click();
  await page.locator('#copy-search').fill('SKIFT');
  const intro = page.locator('[data-copy-key="runtime.skift.sv.intro"]');
  await intro.fill('CMS-intro <img src=x onerror="window.injected=true">');
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('#save-status')).toContainText(/Sparat|Sparad|Alla ändringar/i);
  await page.locator('[data-page-id="skift"]').click();
  await page.locator('[data-action="lock"]').click();
  const preview = page.frameLocator('[data-cms-preview-frame]').first();
  await expect(preview.locator('#start-button')).toBeEnabled();
  await expect(preview.locator('.intro')).toHaveText('CMS-intro <img src=x onerror="window.injected=true">');
  await expect(preview.locator('.intro img')).toHaveCount(0);
  await preview.locator('#start-button').click();
  await expect(preview.locator('#game-screen')).toBeVisible();
  await expect.poll(() => audio.some(response => response.url.endsWith('/audio/shift.mp3') && response.status === 200)).toBe(true);
  await page.clock.runFor(1500);
  await expect(preview.locator('#clock')).not.toHaveText('00:00');
  const live = await context.newPage();
  await live.goto(runtime.url + '/play/skift/');
  await expect(live).toHaveTitle('CMS-testat skift | Omar Yusuf');
  await expect(live.locator('.intro')).toHaveText('CMS-intro <img src=x onerror="window.injected=true">');
  expect(errors).toEqual([]);
  await context.close();
});
