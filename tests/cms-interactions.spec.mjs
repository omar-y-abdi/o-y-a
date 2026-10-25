import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { CMSBrowserQA, DESKTOP, PNG, assertClean, confirmYes, frame, openAssets, openPage, original, save, saveAssetMetadata, seedRuntime, upload, waitCanvas } from './helpers/cms-browser-qa.mjs';

let runtime, baseline, api;
test.describe.configure({ mode: 'default', timeout: 180_000 });
test.beforeAll(async ({ playwright }) => {
  runtime = await cmsRuntime({ port: 0 });
  api = await playwright.request.newContext();
  baseline = await seedRuntime(runtime, api);
});
test.afterEach(async () => { await seedRuntime(runtime, api, baseline); });
test.afterAll(async () => { try { await api?.dispose(); } finally { await runtime?.close(); } });

async function admin(browser, testInfo, run) {
  const qa = new CMSBrowserQA(browser, runtime, testInfo), { context, page, errors } = await qa.adminPage(DESKTOP);
  try { await run(page, qa, context); assertClean(errors, testInfo.title); }
  finally { await context.close(); }
}
async function shot(page, qa, name) {
  await page.mouse.move(5, 5);
  await qa.screenshot(page, name, false);
}

test('literal-text-survives-three-save-reload-cycles', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa, context) => {
    for (let iteration = 0; iteration < 3; iteration++) {
      await (await frame(page)).locator('h1').click();
      await page.locator('#element-text').fill('Omar\nYusuf' + '.'.repeat(iteration + 1));
      await save(page);
      await page.reload();
      await waitCanvas(page);
      await expect((await frame(page)).locator('h3 a[href="/projekt/blade-blend/"]')).toHaveText('Blade & Blend ');
      const response = await context.request.get(runtime.url + '/');
      expect(await response.text()).not.toContain('Blade &amp;amp;');
      await response.dispose();
    }
    await shot(page, qa, 'newline-roundtrip');
    await original(page);
  });
});

test('keyboard-blocks-and-memory-style-survives-reset', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa) => {
    await openPage(page, { id: 'workshop', name: 'Glädjeverkstaden' });
    const canvas = await frame(page), card = canvas.locator('[data-memory-card="0"]');
    await expect(canvas.locator('[data-memory-card]')).toHaveCount(12);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await page.locator('[data-inspector=design]').click();
    for (let index = 0; index < 6; index++) {
      if ((await page.locator('#selection-type').innerText()).startsWith('BUTTON')) break;
      await page.locator('#select-parent').click();
    }
    expect(await page.locator('#selection-type').innerText()).toMatch(/^BUTTON/);
    await page.locator('.advanced-style summary').click();
    await page.locator('#extra-property').fill('border-radius');
    await page.locator('#extra-value').fill('31px');
    await page.locator('#apply-property').click();
    const key = await card.getAttribute('data-cms-node');
    await shot(page, qa, 'memory-design');
    await save(page);
    const publicContext = await qa.context(DESKTOP, false, { reducedMotion: 'reduce' });
    try {
      const live = await publicContext.newPage();
      await live.goto(runtime.url + '/verkstad/');
      const target = live.locator(`[data-cms-node="${key}"]`);
      await expect(target).toHaveCSS('border-radius', '31px');
      await live.locator('[data-memory-reset]').click();
      await expect(target).toHaveCSS('border-radius', '31px');
      await expect(live.locator('[data-memory-card]')).toHaveCount(12);
    } finally { await publicContext.close(); }
    await page.locator('[data-inspector=blocks]').click();
    await page.locator('[data-inspector=design]').click();
    for (let index = 0; index < 10; index++) {
      if ((await page.locator('#selection-type').innerText()).startsWith('MAIN')) break;
      await page.locator('#select-parent').click();
    }
    expect(await page.locator('#selection-type').innerText()).toMatch(/^MAIN/);
    await page.locator('[data-inspector=blocks]').click();
    await page.getByRole('button', { name: 'Text', exact: true }).press('Enter');
    await expect((await frame(page)).getByText('Här börjar något nytt.', { exact: true })).toBeVisible();
    await shot(page, qa, 'blocks-keyboard');
    await original(page);
  });
});

test('asset-archive-recovery-and-locked-win-preview', async ({ browser }, testInfo) => {
  await admin(browser, testInfo, async (page, qa, context) => {
    await page.locator('[data-library=assets]').click();
    await page.locator('#file-input').setInputFiles(upload());
    await page.locator('#asset-name').waitFor({ state: 'visible' });
    const src = await page.locator('#special-stage img').getAttribute('src');
    const box = await page.locator('#special-stage img').boundingBox(), stage = await page.locator('#special-stage').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(stage.x);
    expect(box.x + box.width).toBeLessThanOrEqual(stage.x + stage.width);
    await page.locator('#asset-name').fill('Liten bild, trygg plats');
    await page.locator('#asset-alt').fill('En liten testbild');
    await saveAssetMetadata(page);
    await page.locator('[data-action=archive-asset]').click();
    await confirmYes(page);
    await page.locator('[data-action=restore-asset]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('#library-list [data-special=media]').click();
    await page.locator('[data-media-state=archived]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('[data-media-state=archived]').click();
    await page.getByRole('button', { name: 'Liten bild, trygg plats' }).click();
    await page.locator('[data-action=restore-asset]').click();
    await expect(page.locator('[data-action=archive-asset]')).toBeVisible();
    await shot(page, qa, 'asset-details');
    const privateContext = await qa.context(DESKTOP, false);
    try {
      const response = await privateContext.request.get(runtime.url + src);
      expect(response.status()).toBe(404);
      await response.dispose();
    } finally { await privateContext.close(); }
    const id = src.split('/').at(-1).split('.')[0];
    await page.locator('[data-library=pages]').click();
    await page.locator('[data-action=add-page]').click();
    await page.locator('#new-page-name').fill('Bildens väg till webben');
    await page.locator('#new-page-path').fill('/bildverifiering/');
    await page.locator('#create-page').click();
    await waitCanvas(page);
    await page.locator('[data-inspector=blocks]').click();
    await page.getByRole('button', { name: 'Bild', exact: true }).click();
    await page.locator('[data-inspector=design]').click();
    await page.locator('#choose-image').click();
    await page.locator(`[data-pick-image="${id}"]`).click();
    await expect((await frame(page)).locator('main img')).toHaveAttribute('src', src);
    await save(page);
    const html = await context.request.get(runtime.url + '/bildverifiering/');
    expect(await html.text()).toContain(src);
    await html.dispose();
    const publicContext = await qa.context(DESKTOP, false);
    try {
      const published = await publicContext.request.get(runtime.url + src);
      expect(published.status()).toBe(200);
      expect(await published.body()).toEqual(PNG);
      await published.dispose();
    } finally { await publicContext.close(); }
    await original(page);
    await openAssets(page, 'wins');
    await shot(page, qa, 'wins-library');
    await page.locator('[data-win-id]').first().click();
    await waitCanvas(page);
    const design = (await frame(page)).locator('.win-design');
    await expect(design).toHaveCSS('width', '600px');
    await expect(design).toHaveCSS('padding-top', '38px');
    await expect(design).toHaveCSS('background-color', 'rgb(255, 253, 246)');
    await page.locator('[data-inspector=blocks]').click();
    await page.getByRole('button', { name: 'Text', exact: true }).press('Enter');
    await expect(design.getByText('Här börjar något nytt.', { exact: true })).toBeVisible();
    await page.locator('[data-inspector=design]').click();
    await page.locator('#win-text').fill('Första raden.\nAndra raden.');
    await save(page);
    await shot(page, qa, 'win-design');
    await page.locator('[data-action=lock]').click();
    const preview = page.frameLocator('#preview-stage iframe');
    await expect(preview.locator('#cms-win-preview .win-design')).toBeVisible({ timeout: 20_000 });
    await expect(preview.locator('[data-card-text]')).toHaveText('Första raden.Andra raden.');
    expect(await preview.locator('[data-card-text]').innerText()).toBe('Första raden.\nAndra raden.');
    await expect(page.locator('#editor')).toBeHidden();
    expect(await page.locator('.right-panel').evaluate(element => element.inert)).toBe(true);
    await shot(page, qa, 'win-locked');
    await page.locator('[data-action=edit]').click();
    await expect(page.locator('#editor')).toBeVisible();
    expect(await page.locator('.right-panel').evaluate(element => element.inert)).toBe(false);
    await original(page);
  });
});

test('two-tab-conflict-and-local-draft-recovery', async ({ browser }, testInfo) => {
  const qa = new CMSBrowserQA(browser, runtime, testInfo), first = await qa.adminPage(DESKTOP), second = await qa.adminPage(DESKTOP);
  try {
    await first.page.locator('#page-description').fill('Den första flikens genomtänkta beskrivning av portfolion.');
    await save(first.page);
    const page = second.page;
    await page.locator('#page-description').fill('Den andra flikens genomtänkta beskrivning av portfolion.');
    await page.locator('[data-action=save]').click();
    await expect(page.locator('#studio-dialog')).toBeVisible();
    await expect(page.locator('#dialog-content')).toContainText('En nyare version finns');
    await shot(page, qa, 'conflict');
    await page.locator('[data-action=reconcile]').click();
    await expect(page.locator('#dialog-content')).toContainText('Välj dina ändringar');
    await confirmYes(page);
    await waitCanvas(page);
    await expect(page.locator('#page-description')).toHaveValue('Den andra flikens genomtänkta beskrivning av portfolion.');
    await save(page);
    await page.locator('#page-description').fill('Detta lokala reservutkast ska överleva en omladdning.');
    await page.waitForTimeout(900);
    page.on('dialog', dialog => dialog.accept());
    await page.reload();
    await expect(page.locator('#dialog-content')).toContainText('En idé väntar');
    await shot(page, qa, 'recovery');
    await confirmYes(page);
    await waitCanvas(page);
    await expect(page.locator('#page-description')).toHaveValue('Detta lokala reservutkast ska överleva en omladdning.');
    await original(page);
    assertClean([...first.errors, ...second.errors].filter(error => !error.includes('409')), 'conflict-recovery');
  } finally { await first.context.close(); await second.context.close(); }
});
