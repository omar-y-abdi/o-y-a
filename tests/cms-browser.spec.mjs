import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { routes } from '../src/content/site.mjs';
import { SKIFT_PATH } from '../src/content/skift.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { CMSBrowserQA, DESKTOP, MOBILE, assertClean, assertNoOverflow, confirmYes, discoverPages, firstTextTarget, fontSelect, frame, lockPreview, openPage, revertIfDirty, save, saveAssetMetadata, seedRuntime, shiftEnterText, trackPage, upload, waitCanvas } from './helpers/cms-browser-qa.mjs';

let runtime, baseline, api;
// Match the original Python scenario's timestamp-shaped authored labels.
const RUN_ID = new Date().toISOString().slice(0, 19).replaceAll('-', '').replaceAll(':', '').replace('T', '-');
const entries = routes.filter(route => route.path !== SKIFT_PATH).map(route => ({ id: route.template, name: route.name }));
test.use({ actionTimeout: 30_000, navigationTimeout: 30_000 });
test.describe.configure({ mode: 'default', timeout: 180_000 });
test.beforeAll(async ({ playwright }) => {
  runtime = await cmsRuntime({ port: 0 });
  api = await playwright.request.newContext();
  baseline = await seedRuntime(runtime, api);
  expect(baseline.pages.map(({ id, name }) => ({ id, name }))).toEqual(entries);
});
test.afterEach(async () => { await seedRuntime(runtime, api, baseline); });
test.afterAll(async () => { try { await api?.dispose(); } finally { await runtime?.close(); } });

async function admin(browser, testInfo, run, fixture = runtime) {
  const qa = new CMSBrowserQA(browser, fixture, testInfo);
  const { context, page, errors } = await qa.adminPage();
  try { await run(page, qa); }
  finally { try { assertClean(errors, testInfo.title); } finally { await context.close(); } }
}

for (const [device, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  test(`login-${device}`, async ({ browser }, testInfo) => {
    const qa = new CMSBrowserQA(browser, runtime, testInfo), context = await qa.context(viewport, false);
    try {
      const page = await context.newPage(), errors = trackPage(page);
      const response = await page.goto(runtime.url + '/login/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (response) expect(response.status()).toBeLessThan(400);
      await page.locator('.login-button').waitFor({ state: 'visible', timeout: 10_000 });
      await expect(page.locator('.login-trust')).toBeVisible();
      await qa.screenshot(page, testInfo.title);
      await assertNoOverflow(page, testInfo.title);
      assertClean(errors, testInfo.title);
    } finally { await context.close(); }
  });

  test(`admin-${device}`, async ({ browser }, testInfo) => {
    const fixture = await cmsRuntime({ port: 0 });
    try {
      const qa = new CMSBrowserQA(browser, fixture, testInfo), { context, page, errors } = await qa.adminPage(viewport);
      try {
        const state = await page.request.get(fixture.url + '/admin/api/state');
        try { expect((await state.json()).version, 'Original admin checks run before first publication').toBe(0); }
        finally { await state.dispose(); }
        expect(await page.locator('[data-page-id]').count()).toBeGreaterThan(0);
        if (device === 'desktop') {
          expect(await discoverPages(page)).toEqual(entries);
          const identityCookie = (await context.cookies()).find(cookie => cookie.name === 'CF_Authorization');
          expect(identityCookie).toMatchObject({ httpOnly: true, secure: false, sameSite: 'Lax', path: '/' });
          expect(await page.evaluate(() => document.cookie)).not.toContain('CF_Authorization=');
        }
        await qa.screenshot(page, testInfo.title);
        await assertNoOverflow(page, testInfo.title);
        assertClean(errors, testInfo.title);
      } finally { await context.close(); }
    } finally { await fixture.close(); }
  });
}

for (const published of [false, true]) {
  test(published ? 'edit-save-public-reload with existing publication' : 'edit-save-public-reload', async ({ browser }, testInfo) => {
    // The original Python sequence starts from version zero. Keep that first
    // publication distinct from the already-published delta-save scenario.
    const fixture = published ? runtime : await cmsRuntime({ port: 0 });
    try {
      await admin(browser, testInfo, async (page, qa) => {
        let firstSave;
        page.on('request', request => {
          if (!firstSave && request.method() === 'POST' && new URL(request.url()).pathname === '/admin/api/save') firstSave = request.postDataJSON();
        });
        await openPage(page, (await discoverPages(page))[0]);
        await (await firstTextTarget(await frame(page))).click();
        await page.locator('#element-text').waitFor({ state: 'visible', timeout: 10_000 });
        const old = await page.locator('#element-text').inputValue(), marker = `${old} · QA-${RUN_ID}`;
        await page.locator('#element-text').fill(marker);
        await page.waitForTimeout(600);
        await expect(page.locator('[data-action=save]')).toBeEnabled();
        expect((await save(page)).toLowerCase()).toMatch(/sparad|original/);
        if (published) expect(firstSave.baseVersion).toBeGreaterThan(0);
        else expect(firstSave.baseVersion, 'The original Python scenario publishes an empty database for the first time').toBe(0);
        expect(Object.hasOwn(firstSave, published ? 'changes' : 'project')).toBe(true);
        await page.locator('[data-device=compare]').click();
        await page.locator('#preview-stage iframe').nth(1).waitFor({ state: 'attached', timeout: 20_000 });
        await qa.screenshot(page, 'edit-save-compare');
        const context = await qa.context(DESKTOP, false);
        try {
          const live = await context.newPage(), errors = trackPage(live);
          const response = await live.goto(fixture.url + '/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
          if (response) expect(response.status()).toBeLessThan(400);
          await live.waitForTimeout(700);
          expect(await live.locator('body').innerText()).toContain(marker);
          await live.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
          await live.waitForTimeout(700);
          expect(await live.locator('body').innerText()).toContain(marker);
          await assertNoOverflow(live, 'public-reload');
          assertClean(errors, 'public-reload');
          await qa.screenshot(live, 'public-reload');
        } finally { await context.close(); }
        const scripts = await lockPreview(page);
        expect(scripts.some(source => source.includes('main') || source.endsWith('.mjs'))).toBe(true);
        await page.locator('[data-action=edit]').click();
        await waitCanvas(page);
        await (await firstTextTarget(await frame(page))).click();
        await page.locator('#element-text').fill(old);
        await page.waitForTimeout(500);
        if (await page.locator('[data-action=save]').isEnabled()) await save(page);
      }, fixture);
    } finally { if (!published) await fixture.close(); }
  });
}

async function publicCopyCheck(qa, expected, label) {
  for (const [device, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
    const context = await qa.context(viewport, false);
    try {
      const page = await context.newPage(), errors = trackPage(page);
      const response = await page.goto(runtime.url + '/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (response) expect(response.status()).toBeLessThan(400);
      await page.waitForTimeout(700);
      const heading = await page.locator('h1').first().innerText(), body = await page.locator('body').innerText();
      expect(heading.includes(expected) || body.includes(expected), `${label}-${device}: exakt radbrytning`).toBe(true);
      await assertNoOverflow(page, `${label}-${device}`);
      assertClean(errors, `${label}-${device}`);
      await qa.screenshot(page, `${label}-${device}`);
    } finally { await context.close(); }
  }
}

for (const source of ['rte', 'textarea']) {
  test(`newline-${source}-shift-enter-save-reload`, async ({ browser }, testInfo) => {
    await admin(browser, testInfo, async (page, qa) => {
      await openPage(page, (await discoverPages(page))[0]);
      const canvas = await frame(page), target = await firstTextTarget(canvas);
      let input;
      if (source === 'rte') {
        await target.dblclick();
        await page.waitForTimeout(300);
        input = canvas.locator('[contenteditable=true]').first();
        await input.waitFor({ state: 'visible', timeout: 5000 });
      } else {
        await target.click();
        input = page.locator('#element-text');
        await input.waitFor({ state: 'visible', timeout: 10_000 });
      }
      const typed = await shiftEnterText(input);
      expect(source === 'rte' ? await input.innerText() : await input.inputValue()).toBe(typed);
      if (source === 'rte') await page.locator('#canvas-label').click();
      await page.waitForTimeout(600);
      await expect(page.locator('[data-action=save]')).toBeEnabled();
      await save(page);
      await publicCopyCheck(qa, 'Omar\nYusuf.', `newline-${source}`);
      await qa.screenshot(page, `newline-${source}-admin`);
    });
  });
}

test('new-pages-duplicate', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    const before = await page.locator('[data-page-id]').count();
    const slug = RUN_ID.replaceAll('-', '');
    const name = `QA sida ${RUN_ID}`, path = `/qa-browser-${slug}/`, copy = `QA kopia ${RUN_ID}`, copyPath = `/qa-browser-${slug}-copy/`;
    await page.locator('[data-action=add-page]').click();
    await page.locator('#new-page-name').fill(name);
    await page.locator('#new-page-path').fill(path);
    await page.locator('#create-page').click();
    await page.locator('#canvas-path').waitFor({ state: 'visible', timeout: 10_000 });
    expect(await page.locator('#canvas-path').innerText()).toBe(path);
    await page.locator('#page-name').waitFor({ state: 'visible', timeout: 10_000 });
    expect(await page.locator('#page-name').inputValue()).toBe(name);
    expect(await page.locator('[data-page-id]').count()).toBe(before + 1);
    await page.locator('#duplicate-page').click();
    await page.locator('#new-page-name').fill(copy);
    await page.locator('#new-page-path').fill(copyPath);
    await page.locator('#create-page').click();
    expect(await page.locator('#canvas-path').innerText()).toBe(copyPath);
    expect(await page.locator('[data-page-id]').count()).toBe(before + 2);
    await save(page);
    const context = await qa.context({ width: 1200, height: 800 }, false);
    try {
      const live = await context.newPage(), errors = trackPage(live);
      const response = await live.goto(runtime.url + copyPath, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      expect(response).not.toBeNull();
      expect(response.status()).toBeLessThan(400);
      await assertNoOverflow(live, 'new-page-public');
      assertClean(errors, 'new-page-public');
    } finally { await context.close(); }
    await page.locator('#delete-page').click();
    await confirmYes(page);
    await waitCanvas(page);
    await page.locator('[data-page-id]').filter({ hasText: name }).first().click();
    await waitCanvas(page);
    await page.locator('#delete-page').click();
    await confirmYes(page);
    await waitCanvas(page);
    if (await page.locator('[data-action=save]').isEnabled()) await save(page);
  });
});

test('style-device-changes', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    await openPage(page, (await discoverPages(page))[0]);
    await page.locator('[data-action=theme]').click();
    await page.locator('#theme-size').waitFor({ state: 'visible', timeout: 10_000 });
    const old = Number(await page.locator('#theme-size').inputValue());
    await page.locator('#theme-size').fill(String(old < 32 ? old + 1 : old - 1));
    await page.locator('#theme-size').press('Tab');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-action=save]')).toBeEnabled();
    for (const [device, width] of [['mobile', '390'], ['desktop', '1440']]) {
      await page.locator(`[data-device=${device}]`).click();
      expect(await page.locator('#viewport-size').innerText()).toContain(width);
    }
    await qa.screenshot(page, 'style-devices');
    await revertIfDirty(page);
    await assertNoOverflow(page, 'style-devices');
  });
});

test('undo-redo-revert', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    await openPage(page, (await discoverPages(page))[0]);
    await (await firstTextTarget(await frame(page))).click();
    await page.locator('#element-text').waitFor({ state: 'visible', timeout: 10_000 });
    const old = await page.locator('#element-text').inputValue(), marker = `${old} · UNDO-${RUN_ID}`;
    await page.locator('#element-text').fill(marker);
    await page.waitForTimeout(500);
    await page.locator('[data-action=undo]').click();
    await waitCanvas(page);
    expect(await (await firstTextTarget(await frame(page))).innerText()).not.toContain(marker);
    await page.locator('[data-action=redo]').click();
    await waitCanvas(page);
    expect(await (await firstTextTarget(await frame(page))).innerText()).toContain(marker);
    await page.locator('[data-action=revert]').click();
    await confirmYes(page);
    await waitCanvas(page);
    expect(await (await firstTextTarget(await frame(page))).innerText()).toBe(old);
    await qa.screenshot(page, 'undo-redo-revert');
    await assertNoOverflow(page, 'undo-redo-revert');
  });
});

test('history-review-restore', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    await openPage(page, (await discoverPages(page))[0]);
    await page.locator('[data-action=history]').click();
    await page.locator('#special-stage').waitFor({ state: 'visible', timeout: 10_000 });
    const rows = page.locator('.history-row');
    await rows.first().waitFor({ state: 'visible', timeout: 20_000 });
    expect(await rows.count()).toBeGreaterThan(0);
    const review = rows.first().locator('[data-review-version]'), restore = rows.nth(await rows.count() > 1 ? 1 : 0).locator('[data-restore-version]');
    const reviewVersion = await review.getAttribute('data-review-version'), restoreVersion = await restore.getAttribute('data-restore-version');
    expect(reviewVersion).toBeTruthy();
    expect(restoreVersion).toBeTruthy();
    await review.click();
    await page.locator('#preview-stage iframe').first().waitFor({ state: 'attached', timeout: 20_000 });
    await qa.screenshot(page, `history-review-${reviewVersion}`);
    await page.locator('[data-action=history]').click();
    await rows.first().waitFor({ state: 'visible', timeout: 20_000 });
    await page.locator(`[data-restore-version="${restoreVersion}"]`).first().click();
    await confirmYes(page);
    await waitCanvas(page);
    if (await page.locator('[data-action=save]').isEnabled() || await page.locator('[data-action=revert]').isEnabled()) await revertIfDirty(page);
    await assertNoOverflow(page, 'history');
  });
});

test('lock-compare-public-scripts', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    await openPage(page, (await discoverPages(page))[0]);
    await page.locator('[data-action=lock]').click();
    await page.locator('[data-action=lock][aria-pressed=true]').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('#preview-stage iframe').first().waitFor({ state: 'attached', timeout: 20_000 });
    expect(await page.frameLocator('#preview-stage iframe').first().locator('script[src]').count()).toBeGreaterThan(0);
    await page.locator('[data-device=compare]').click();
    await page.locator('#preview-stage iframe').nth(1).waitFor({ state: 'attached', timeout: 20_000 });
    await qa.screenshot(page, 'lock-compare');
    await assertNoOverflow(page, 'lock-compare');
  });
});

test('assets-upload-metadata', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    await page.locator('[data-library=assets]').click();
    await page.locator('[data-action=upload]').waitFor({ state: 'visible', timeout: 10_000 });
    const chooser = page.waitForEvent('filechooser', { timeout: 5000 });
    await page.locator('[data-action=upload]').click();
    await (await chooser).setFiles(upload());
    await page.locator('#asset-name').waitFor({ state: 'visible', timeout: 20_000 });
    expect((await page.locator('#asset-name').inputValue()).toLowerCase()).toMatch(/\.png$/);
    const name = `QA metadata ${RUN_ID}.png`, alt = `Lokal QA PNG ${RUN_ID}`;
    await page.locator('#asset-name').fill(name);
    await page.locator('#asset-alt').fill(alt);
    await saveAssetMetadata(page);
    expect(await page.locator('#asset-name').inputValue()).toBe(name);
    expect(await page.locator('#asset-alt').inputValue()).toBe(alt);
    await qa.screenshot(page, 'assets-upload-metadata');
    await assertNoOverflow(page, 'assets-upload');
  });
});

async function publicFontCheck(qa, value) {
  for (const [device, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
    const context = await qa.context(viewport, false);
    try {
      const page = await context.newPage(), errors = trackPage(page), responses = [];
      page.on('response', response => { if (response.url().includes(`/media/${value.replace(/^cms-font-/, '')}.woff2`)) responses.push(response); });
      const response = await page.goto(runtime.url + '/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (response) expect(response.status()).toBeLessThan(400);
      await page.waitForTimeout(500);
      const loaded = () => page.evaluate(async family => { await document.fonts.ready; await document.fonts.load(`16px "${family}"`); return document.fonts.check(`16px "${family}"`); }, value);
      expect(await loaded()).toBe(true);
      expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain(value);
      expect(await page.locator('h1').first().evaluate(node => getComputedStyle(node).fontFamily)).toContain(value);
      expect(responses.filter(item => item.status() === 200 && (item.headers()['content-type'] || '').toLowerCase().startsWith('font/woff2')).length).toBeGreaterThan(0);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(500);
      expect(await loaded()).toBe(true);
      await assertNoOverflow(page, `font-public-${device}`);
      assertClean(errors, `font-public-${device}`);
      await qa.screenshot(page, `font-public-${device}`);
    } finally { await context.close(); }
  }
}

test('font-upload-theme-individual', async ({ browser }, testInfo) => {
  const font = 'tests/fixtures/dm-sans-latin-400-normal.woff2';
  expect((await readFile(font)).length).toBeGreaterThan(0);
  await admin(browser, testInfo, async (page, qa) => {
    const pages = await discoverPages(page);
    await page.locator('[data-library=assets]').click();
    await page.locator('[data-action=upload]').waitFor({ state: 'visible', timeout: 10_000 });
    const ids = () => page.locator('[data-asset-id]').evaluateAll(nodes => nodes.map(node => node.dataset.assetId).filter(Boolean));
    const before = new Set(await ids()), chooser = page.waitForEvent('filechooser', { timeout: 5000 });
    await page.locator('[data-action=upload]').click();
    await (await chooser).setFiles(font);
    await page.locator('#asset-name').waitFor({ state: 'visible', timeout: 20_000 });
    expect((await page.locator('#asset-name').inputValue()).toLowerCase()).toMatch(/\.woff2$/);
    await page.locator('.asset-nav-row[data-special=media]').click();
    await page.locator('[data-action=upload]').waitFor({ state: 'visible', timeout: 10_000 });
    const added = (await ids()).filter(id => !before.has(id));
    expect(added).toHaveLength(1);
    const id = added[0], value = `cms-font-${id}`;
    await page.locator(`[data-asset-id="${id}"]`).click();
    await page.locator('#asset-name').waitFor({ state: 'visible', timeout: 10_000 });
    expect(await page.locator('#selection-type').innerText()).toBe('font/woff2');
    await qa.screenshot(page, 'font-upload');
    await page.locator('[data-library=pages]').click();
    await page.locator('[data-page-id]').first().waitFor({ state: 'visible', timeout: 10_000 });
    await openPage(page, pages[0]);
    await page.locator('[data-action=theme]').click();
    const theme = page.locator('#theme-font');
    await theme.waitFor({ state: 'visible', timeout: 10_000 });
    const originalTheme = await theme.inputValue();
    expect(await theme.locator(`option[value="${value}"]`).count()).toBeGreaterThan(0);
    await theme.selectOption(value);
    await page.waitForTimeout(600);
    expect(await theme.inputValue()).toBe(value);
    await page.locator('[data-action=edit]').click();
    await waitCanvas(page);
    await (await firstTextTarget(await frame(page))).click();
    await page.locator('#styles-panel').waitFor({ state: 'visible', timeout: 10_000 });
    const individual = await fontSelect(page, value), originalIndividual = await individual.inputValue();
    const originalIndex = await individual.locator('option').evaluateAll((options, selected) => options.findIndex(option => option.value === selected), originalIndividual);
    await individual.selectOption(value);
    await page.waitForTimeout(700);
    expect(await individual.inputValue()).toBe(value);
    expect(await (await frame(page)).evaluate(() => getComputedStyle(document.querySelector('.gjs-selected')).fontFamily)).toContain(value);
    await expect(page.locator('[data-action=save]')).toBeEnabled();
    await save(page);
    await qa.screenshot(page, 'font-theme-individual');
    await publicFontCheck(qa, value);
    await page.locator('[data-action=edit]').click();
    await waitCanvas(page);
    await (await firstTextTarget(await frame(page))).click();
    const restore = await fontSelect(page, value), options = await restore.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
    await restore.selectOption(options.includes(originalIndividual) ? originalIndividual : { index: Math.max(0, originalIndex) });
    await page.locator('[data-action=theme]').click();
    await theme.waitFor({ state: 'visible', timeout: 10_000 });
    await theme.selectOption(originalTheme);
    await page.waitForTimeout(500);
    if (await page.locator('[data-action=save]').isEnabled()) await save(page);
    await page.locator('[data-library=assets]').click();
    await page.locator('.asset-nav-row[data-special=media]').waitFor({ state: 'visible', timeout: 10_000 });
    const asset = page.locator(`[data-asset-id="${id}"]`);
    if (await asset.count()) {
      await asset.click();
      await page.locator('[data-action=archive-asset]').waitFor({ state: 'visible', timeout: 10_000 });
      await page.locator('[data-action=archive-asset]').click();
      await confirmYes(page);
    }
  });
});

test('win-edit-export', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    await page.locator('[data-library=assets]').click();
    await page.locator('[data-special=wins]').click();
    const card = page.locator('.win-card').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    await card.click();
    await page.locator('#win-text').waitFor({ state: 'visible', timeout: 15_000 });
    const marker = `${await page.locator('#win-text').inputValue()} · QA-${RUN_ID}`;
    await page.locator('#win-text').fill(marker);
    await page.waitForTimeout(500);
    expect(await page.locator('#win-text').inputValue()).toBe(marker);
    const pending = page.waitForEvent('download', { timeout: 20_000 });
    await page.locator('[data-action=export-win]').click();
    const download = await pending, path = testInfo.outputPath('win-export.png');
    await download.saveAs(path);
    const bytes = await readFile(path);
    expect(bytes.length).toBeGreaterThanOrEqual(100);
    expect(bytes.subarray(0, 4).equals(Buffer.from('\x89PNG', 'latin1'))).toBe(true);
    await testInfo.attach('win-export', { path, contentType: 'image/png' });
    await qa.screenshot(page, 'win-edit-export');
    await revertIfDirty(page);
    await assertNoOverflow(page, 'win-export');
  });
});

for (const [index, entry] of entries.entries()) for (const [device, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  test(`canvas-${String(index + 1).padStart(2, '0')}-${device}`, async ({ browser }, testInfo) => {
    const qa = new CMSBrowserQA(browser, runtime, testInfo), { context, page, errors } = await qa.adminPage(viewport);
    try {
      await openPage(page, entry);
      await page.locator(`[data-device=${device}]`).click();
      await page.locator(`[data-device=${device}][aria-pressed=true]`).waitFor({ state: 'visible', timeout: 5000 });
      let canvas = await frame(page), box;
      const geometry = async () => {
        box = await page.locator('#editor iframe.gjs-frame').boundingBox();
        return await canvas.evaluate(() => window.innerWidth) <= (device === 'desktop' ? 1440 : 390) && !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1;
      };
      await expect.poll(geometry, { timeout: 10_000 }).toBe(true);
      await page.mouse.move(box.x + box.width * .82, box.y + box.height * .55);
      await page.mouse.wheel(0, -10_000);
      await page.waitForTimeout(250);
      const scrollState = () => canvas.evaluate(() => { const node = document.scrollingElement || document.documentElement; return { y: node.scrollTop, max: Math.max(0, node.scrollHeight - node.clientHeight) }; });
      let scroll = await scrollState();
      expect(scroll.y).toBe(0);
      await qa.screenshot(page, `${testInfo.title}-top`);
      canvas = await frame(page);
      await expect.poll(geometry, { timeout: 10_000 }).toBe(true);
      await page.mouse.move(box.x + box.width * .82, box.y + box.height * .55);
      for (let attempt = 0; attempt < 12; attempt++) {
        await page.mouse.wheel(0, 3000);
        await page.waitForTimeout(120);
        scroll = await scrollState();
        if (scroll.y === scroll.max) break;
      }
      expect(scroll.y).toBe(scroll.max);
      await qa.screenshot(page, `${testInfo.title}-end`);
      await assertNoOverflow(page, testInfo.title);
      assertClean(errors, testInfo.title);
    } finally { await context.close(); }
  });
}
