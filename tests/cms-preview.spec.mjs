import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial } from '../.generated/cms-seed.mjs';
import { waitCanvas } from './helpers/cms-browser-qa.mjs';

test('studio preview shares pending and completed target HTML across devices, then sends the changed draft', async ({ page, context }) => {
  test.setTimeout(60000);
  const runtime = await cmsRuntime({ project: initial });
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const requests = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  try {
    await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(runtime.url + '/admin/');
    await waitCanvas(page);
    await page.locator('[data-page-id="about"]').click();
    await waitCanvas(page);
    await expect(page.locator('#page-description')).toHaveValue(initial.pages.find(page => page.id === 'about').description);
    await page.route('**/admin/api/preview', async route => {
      requests.push(route.request().postDataJSON());
      const response = await route.fetch();
      if (requests.length === 1) await held;
      await route.fulfill({ response });
    });
    await page.locator('[data-action="lock"]').click();
    await expect.poll(() => requests.length).toBe(1);
    await page.locator('[data-device="mobile"]').click();
    await page.locator('[data-device="compare"]').click();
    expect(requests).toHaveLength(1);
    expect(requests[0].project.pages.map(item => item.id)).toEqual(['about']);
    expect(requests[0].project.cards).toEqual([]);
    expect(requests[0].project.frame).toEqual(initial.frame);
    expect(requests[0].project.pages[0].facts).toBeUndefined();
    release();
    await expect(page.locator('[data-cms-preview-frame]')).toHaveCount(2);
    await expect(page.frameLocator('[data-cms-preview-frame]').first().locator('main h1')).toBeVisible();
    await page.locator('[data-device="mobile"]').click();
    await expect(page.locator('[data-cms-preview-frame]')).toHaveCount(1);
    expect(requests).toHaveLength(1);

    await page.locator('[data-action="edit"]').click();
    await waitCanvas(page);
    const description = 'Ändrad text måste få en ny förhandsvisning.';
    await page.locator('#page-description').fill(description);
    await page.locator('[data-action="lock"]').click();
    await expect.poll(() => requests.length).toBe(2);
    await expect(page.frameLocator('[data-cms-preview-frame]').locator('meta[name="description"]')).toHaveAttribute('content', description);
    expect(requests[1].project.pages[0].description).toBe(description);
    expect(errors).toEqual([]);
  } finally { release(); await runtime.close(); }
});

test('target-only machine preview keeps native card interaction and the complete draft bank', async ({ page, context }) => {
  test.setTimeout(60000);
  const runtime = await cmsRuntime({ project: initial });
  try {
    await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(runtime.url + '/admin/');
    await waitCanvas(page);
    const response = page.waitForResponse(response => new URL(response.url()).pathname === '/admin/api/preview');
    await page.locator('[data-action="lock"]').click();
    const preview = await response;
    expect(preview.status(), await preview.text()).toBe(200);
    const payload = preview.request().postDataJSON();
    expect(payload.project.pages.map(item => item.id)).toEqual(['home']);
    expect(payload.project.cards).toHaveLength(initial.cards.length);
    const frame = page.frameLocator('[data-cms-preview-frame]');
    await frame.locator('[data-print]').click();
    await expect(frame.locator('[data-receipt]')).toBeVisible();
    const message = await frame.locator('[data-card-message]').innerText();
    expect(initial.cards.some(card => card.text === message)).toBe(true);
    await frame.locator('[data-receipt-close]').click();
    await expect(frame.locator('[data-print]')).toBeFocused();
  } finally { await runtime.close(); }
});
