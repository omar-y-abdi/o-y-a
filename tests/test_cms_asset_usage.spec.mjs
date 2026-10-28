import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { CMSBrowserQA, seedRuntime, uploadFile, upload } from './helpers/cms-browser-qa.mjs';
import { libraryBundle, libraryPage } from './helpers/cms-browser-library.mjs';

let runtime, api, bundle;
test.describe.configure({ mode: 'default', timeout: 60_000 });
test.beforeAll(async ({ playwright }) => {
  runtime = await cmsRuntime({ port: 0 });
  api = await playwright.request.newContext();
  await seedRuntime(runtime, api);
  bundle = await libraryBundle();
});
test.afterAll(async () => { try { await api?.dispose(); } finally { await runtime?.close(); } });

test('test_delayed_usage_refresh_preserves_metadata_draft', async ({ browser, page }, testInfo) => {
  await libraryPage(page, bundle, '<div id="special-stage"></div><div id="custom-inspector"></div>');
  const asset = { id: 'asset-one', name: 'original.png', mime: 'image/png', src: '/image.png', alt: 'original alt', state: 'active' };
  await page.evaluate(asset => window.libraryFixture.assetDetail(asset), asset);
  await page.locator('#asset-name').fill('draft name.png');
  await page.locator('#asset-alt').fill('draft alt text');
  await page.evaluate(asset => window.libraryFixture.assetDetail(asset, { currentReferences: 2, historyReferences: 3 }), asset);
  expect(await page.locator('#asset-name').inputValue()).toBe('draft name.png');
  expect(await page.locator('#asset-alt').inputValue()).toBe('draft alt text');
  expect(await page.locator('#asset-usage').innerText()).toBe('2 referenser i aktuellt utkast · 3 i sparad historik.');

  // Keep the renderer assertion above and exercise the delayed real Worker response through the studio as well.
  const qa = new CMSBrowserQA(browser, runtime, testInfo), { context, page: studio } = await qa.adminPage();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let captured;
  const received = new Promise(resolve => { captured = resolve; });
  await studio.route('**/admin/api/asset-usage', async route => {
    const response = await route.fetch();
    const usage = await response.json();
    captured({ usage, body: route.request().postDataJSON() });
    await gate;
    await route.fulfill({ response });
  });
  try {
    await studio.locator('[data-library=assets]').click();
    const uploaded = await uploadFile(studio, upload(), runtime.url);
    const { usage, body } = await received;
    expect(body).toEqual({ id: uploaded.id });
    expect(usage).toEqual({ historyReferences: 0 });
    await expect(studio.locator('#asset-usage')).toHaveText('0 referenser i aktuellt utkast · … i sparad historik.');
    await studio.locator('#asset-name').fill('draft name.png');
    await studio.locator('#asset-alt').fill('draft alt text');
    release();
    await expect(studio.locator('#asset-usage')).toHaveText(`0 referenser i aktuellt utkast · ${usage.historyReferences} i sparad historik.`);
    expect(await studio.locator('#asset-name').inputValue(), uploaded.id).toBe('draft name.png');
    expect(await studio.locator('#asset-alt').inputValue()).toBe('draft alt text');
  } finally { release(); await context.close(); }
});
