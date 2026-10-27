import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { uploadAsset } from '../src/cms/assets.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { ready, frame } from './helpers/review-browser.mjs';

let runtime, used, unused;
test.beforeAll(async () => {
  runtime = await cmsRuntime();
  const env = { CMS_DB: runtime.db, CMS_MEDIA: await runtime.mf.getR2Bucket('CMS_MEDIA'), CMS_IMAGES: await runtime.mf.getImagesBinding('CMS_IMAGES') };
  const upload = name => uploadAsset(env, { id: crypto.randomUUID(), name, bytes: Buffer.from(rasterFixtures.png, 'base64') });
  used = await upload('Använd.png');
  unused = await upload('Oanvänd.png');
  const project = structuredClone(initial);
  project.resources.icon = used.src;
  await publishSite(runtime.db, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
});
test.afterAll(async () => runtime?.close());

test('A11: separate groups, matching counts and local badges work with an incomplete draft; history sends only id', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  await page.route('**/admin/api/state', async route => {
    const response = await route.fetch(), state = await response.json();
    state.project.pages[0].title = '';
    state.project.pages[0].html = state.project.pages[0].html.replace('</main>', '<video></video></main>');
    await route.fulfill({ response, json: state });
  });
  await page.goto(runtime.url + '/admin/');
  await expect(page.locator('[data-page-id="home"]')).toHaveCount(1);
  await expect(page.locator('[data-library]')).toHaveText(['Sidor', 'Bilder', 'Vinster']);
  const requests = [];
  page.on('request', request => { if (request.url().includes('/admin/api/')) requests.push(request); });
  await page.locator('[data-library="assets"]').click();
  for (const name of ['builtin', 'uploads']) {
    const group = page.locator(`[data-media-group="${name}"]`);
    await expect(group).toBeVisible();
    const count = await group.locator('[data-asset-id]').count();
    expect(count).toBeGreaterThan(0);
    await expect(group).toHaveAttribute('data-visible-count', String(count));
    await expect(group.locator('h2')).toContainText(`· ${count} visas`);
  }
  await expect(page.locator('[data-media-group="builtin"] [data-media-state]')).toHaveCount(0);
  await expect(page.locator(`[data-asset-id="${used.id}"]`)).toContainText('Används');
  await expect(page.locator(`[data-asset-id="${unused.id}"]`)).toContainText('Oanvänd');
  expect(requests.filter(request => request.method() === 'POST')).toHaveLength(0);
  const history = page.waitForResponse(response => response.url().endsWith('/admin/api/asset-usage'));
  await page.locator(`[data-asset-id="${used.id}"]`).click();
  const response = await history;
  expect(response.status(), await response.text()).toBe(200);
  expect(response.request().postDataJSON()).toEqual({ id: used.id });
  await expect(page.locator('#asset-usage')).toHaveText('1 referenser i aktuellt utkast · 1 i sparad historik.');
  expect(requests.every(request => Buffer.byteLength(request.postData() ?? '') <= 1024)).toBe(true);
  await page.locator('[data-library="assets"]').click();
  await page.locator('[data-media-group="builtin"] [data-asset-id]').first().click();
  await expect(page.locator('[data-action="save-asset"]')).toBeVisible();
  await expect(page.locator('[data-action="archive-asset"], [data-action="trash-asset"], [data-action="delete-asset"]')).toHaveCount(0);
  await page.locator('[data-library="wins"]').click();
  await expect(page.locator('#win-search')).toBeVisible();
});

test('B8/A11: library tabs close editors without phantom changes and keep one frame across pages', async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  await page.goto(runtime.url + '/admin/');
  await ready(page);
  const save = page.locator('[data-action=save]'), undo = page.locator('[data-action=undo]');
  await expect(save).toBeDisabled();
  for (const id of ['about', 'home']) {
    await page.locator(`[data-page-id=${id}]`).click();
    await ready(page);
    await expect(save).toBeDisabled();
    await expect(undo).toBeDisabled();
  }
  for (const tab of ['assets', 'wins', 'pages']) {
    await page.locator(`[data-library=${tab}]`).click();
    if (tab === 'assets') await expect(page.locator('[data-media-group=builtin]')).toBeVisible();
    else if (tab === 'wins') await expect(page.locator('#win-search')).toBeVisible();
    else await ready(page);
    await expect(save).toBeDisabled();
    await expect(undo).toBeDisabled();
  }
  const tagline = 'En sidram genom alla flikar';
  await frame(page).locator('[data-cms-shared="footer.tagline"]').click();
  await page.locator('#element-text').fill(tagline);
  await page.locator('[data-library=assets]').click();
  await expect(page.locator('[data-media-group=builtin]')).toBeVisible();
  await page.locator('[data-library=wins]').click();
  await expect(page.locator('#win-search')).toBeVisible();
  await page.locator('[data-library=pages]').click();
  await ready(page);
  await expect(frame(page).locator('[data-cms-shared="footer.tagline"]')).toHaveText(tagline);
  await page.locator('[data-page-id=about]').click();
  await ready(page);
  await expect(frame(page).locator('[data-cms-shared="footer.tagline"]')).toHaveText(tagline);
  await expect(save).toBeEnabled();
  await expect(undo).toBeEnabled();
  const saved = page.waitForResponse(response => response.url().endsWith('/admin/api/save'));
  await save.click();
  const response = await saved;
  expect(response.status(), await response.text()).toBe(200);
  expect(response.request().postDataJSON().changes).toHaveProperty('frame');
  expect(response.request().postDataJSON().changes).not.toHaveProperty('pages');
  await expect(save).toBeDisabled();
});
