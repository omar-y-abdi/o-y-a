import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { api, state, publish, admin, ready, frame, save, backupSettled, restorePrompt, openAssets, uploadFile, records, downloadBytes } from './helpers/review-browser.mjs';

let runtime;
test.describe.configure({ mode: 'default', timeout: 120_000 });
test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true, storageState: { cookies: [], origins: [] } });
test.beforeAll(async () => { runtime = await cmsRuntime({ port: 0 }); });
test.afterAll(async () => { await runtime?.close(); });

async function setup(context, { markup, css = '', init } = {}) {
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  if (init) await context.addInitScript(init);
  const baseline = await api(context, runtime, 'revision/0');
  expect(baseline.ok(), await baseline.text()).toBe(true);
  const project = (await baseline.json()).project;
  if (markup !== undefined) {
    const { blank } = await state(context, runtime);
    project.pages.push({ ...blank, id: 'final-acceptance', sourceId: 'blank', path: '/final-acceptance/', css, html: blank.html.replace('</main>', markup + '</main>') });
  }
  await publish(context, runtime, project);
  const page = await admin(context, runtime);
  if (markup !== undefined) { await page.locator('[data-page-id=final-acceptance]').click(); await ready(page); }
  return page;
}

for (const [name, deleteKey] of [['active-input-backup-reload-publish', 'Backspace'], ['active-input-forward-delete-backup-reload-publish', 'Delete']]) {
  test(name, async ({ context, browser }, info) => {
    const page = await setup(context, { markup: '<p id="live-copy">Original editable paragraph</p>' });
    const target = frame(page).locator('#live-copy');
    await target.dblclick();
    await expect(target).toHaveAttribute('contenteditable', 'true');
    await target.evaluate(el => { el.ownerDocument.defaultView.caretHost = el; });
    await target.press('ControlOrMeta+A'); await target.press(deleteKey);
    await expect(page).toHaveURL(runtime.url + '/admin/');
    await expect(target).toHaveText('');
    expect(await target.evaluate(el => el === el.ownerDocument.defaultView.caretHost && el.isContentEditable)).toBe(true);
    await target.press('ControlOrMeta+z'); await expect(target).toHaveText('Original editable paragraph');
    await target.press('ControlOrMeta+Shift+z'); await expect(target).toHaveText('');
    await target.pressSequentially('Still typing before blur', { delay: 20 });
    await target.press('Shift+Enter'); await target.pressSequentially('Second line', { delay: 20 });
    await expect(page.locator('[data-action=save]')).toBeEnabled();
    await backupSettled(page);
    expect(await target.evaluate(el => el.isContentEditable)).toBe(true);
    await expect.poll(async () => (await records(page)).some(row => (row.project?.pages ?? []).some(page => page.html.includes('Still typing before blur') && page.html.includes('Second line'))), { timeout: 10_000 }).toBe(true);
    await page.reload(); await ready(page); await restorePrompt(page);
    await page.locator('[data-page-id=final-acceptance]').click(); await ready(page);
    await expect(frame(page).locator('#live-copy')).toHaveText('Still typing before blurSecond line');
    await save(page);
    const publicPage = await browser.newPage();
    try {
      await publicPage.goto(runtime.url + '/final-acceptance/');
      await expect(publicPage.locator('#live-copy')).toHaveText('Still typing before blurSecond line');
      expect(await publicPage.locator('#live-copy br').count()).toBe(1);
      await publicPage.screenshot({ path: info.outputPath('active-text-public.png') });
    } finally { await publicPage.close(); }
  });
}

test('pending-recovery-keeps-studio-blocked-until-installed', async ({ context }) => {
  const page = await setup(context, { markup: '<p id="recovered-copy">Recovered page body</p>' }), held = [];
  try {
    await page.locator('#page-title').fill('Recovered draft title');
    await backupSettled(page);
    await page.reload(); await ready(page);
    await expect(page.locator('#dialog-content')).toContainText('En idé väntar');
    await page.route('**/admin/api/recover', route => { held.push(route); });
    const pending = page.waitForRequest('**/admin/api/recover');
    await page.locator('[data-confirm=yes]').click();
    await pending;
    await expect(page.locator('#studio-dialog')).toBeVisible();
    await expect(page.locator('#dialog-content')).toContainText('Återställer utkastet');
    expect(await page.evaluate(() => document.querySelector('#studio-dialog').contains(document.activeElement))).toBe(true);
    expect(held).toHaveLength(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('#studio-dialog')).toBeVisible();
    await held.pop().continue();
    await expect(page.locator('#studio-dialog')).toBeHidden({ timeout: 20_000 }); await ready(page);
    await page.locator('[data-page-id=final-acceptance]').click(); await ready(page);
    await expect(page.locator('#page-title')).toHaveValue('Recovered draft title');
    await expect(frame(page).locator('#recovered-copy')).toHaveText('Recovered page body');
  } finally { for (const route of held) await route.abort(); }
});

test('rich-inspector-structure-reload-public', async ({ context, browser }, info) => {
  const markup = '<p id="rich-copy">Hello <span id="accent-word" class="accent">world</span>, <em>today</em> <a href="/om/">about</a>.<br>Next line</p>';
  const page = await setup(context, { markup, css: '.accent{color:rgb(201,32,17);font-weight:700}' });
  await frame(page).locator('#rich-copy').click({ position: { x: 8, y: 8 } });
  await expect(page.locator('#element-text')).toBeVisible();
  await page.locator('#element-text').fill('Hello world, today about.!\nNext line');
  await expect(frame(page).locator('#accent-word')).toHaveText('world');
  expect(await frame(page).locator('#accent-word').evaluate(el => getComputedStyle(el).color)).toBe('rgb(201, 32, 17)');
  await save(page); await page.reload(); await ready(page);
  await page.locator('[data-page-id=final-acceptance]').click(); await ready(page);
  await expect(frame(page).locator('#rich-copy em')).toHaveText('today');
  await expect(frame(page).locator('#rich-copy a')).toHaveAttribute('href', '/om/');
  const publicPage = await browser.newPage();
  try {
    await publicPage.goto(runtime.url + '/final-acceptance/');
    await expect(publicPage.locator('#accent-word')).toHaveText('world');
    expect(await publicPage.locator('#accent-word').evaluate(el => getComputedStyle(el).color)).toBe('rgb(201, 32, 17)');
    await expect(publicPage.locator('#rich-copy')).toHaveText('Hello world, today about.!Next line');
    await publicPage.screenshot({ path: info.outputPath('rich-text-public.png') });
  } finally { await publicPage.close(); }
});

test('preview-srcdoc-script-readiness', async ({ context }, info) => {
  const page = await setup(context);
  await page.locator('#page-description').fill('Unpublished preview metadata');
  await page.locator('[data-action=lock]').click();
  const preview = page.frameLocator('#preview-stage iframe').first();
  await expect(preview.locator('script[type=module][src*="/assets/main."]')).toHaveCount(1);
  await expect(preview.locator('head > script#cms-preview-data')).toHaveCount(1);
  expect(await preview.locator('body').getAttribute('data-cms-preview')).toBe('true');
  for (let index = 0; index < 3; index++) {
    await page.locator('[data-action=edit]').click(); await ready(page);
    await page.locator('[data-action=lock]').click();
    await expect(page.frameLocator('#preview-stage iframe').first().locator('script[type=module][src*="/assets/main."]')).toHaveCount(1);
  }
  await page.screenshot({ path: info.outputPath('locked-preview-scripts.png') });
});

test('custom-card-visible-transform-export', async ({ context }, info) => {
  const page = await setup(context), project = (await state(context, runtime)).project;
  const card = project.cards[0];
  card.text = 'Visible card text\nSecond line';
  card.design = { html: '<article class="rotated-card"><p data-card-text></p></article>', css: '.rotated-card{width:400px;height:180px;padding:20px;box-sizing:border-box;background:rgb(250,200,30);transform:rotate(12deg) translate(18px,-10px)}', project: null };
  await publish(context, runtime, project);
  const publishedCard = (await state(context, runtime)).project.cards[0];
  await page.reload(); await ready(page);
  await openAssets(page, 'wins');
  await page.locator(`#special-stage [data-win-id="${publishedCard.id}"]`).click(); await ready(page);
  await page.locator('[data-action=lock]').click();
  const preview = page.frameLocator('#preview-stage iframe').first(), root = preview.locator('#cms-win-preview .rotated-card');
  await expect(root).toBeVisible({ timeout: 20_000 });
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).not.toContain(await root.evaluate(el => getComputedStyle(el).transform));
  await expect(preview.locator('#cms-win-preview [data-card-text]')).toHaveText('Visible card textSecond line');
  await page.locator('[data-action=edit]').click(); await ready(page);
  const pending = page.waitForEvent('download');
  await page.locator('[data-action=export-win]').click();
  const data = await downloadBytes(await pending, info, 'rotated-card.png');
  expect(data.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(data.readUInt32BE(16)).toBeGreaterThan(800);
  expect(data.readUInt32BE(20)).toBeGreaterThan(360);
  const response = await context.request.get(runtime.url + '/data/cards.json', { maxRetries: 2 });
  const bank = await response.json();
  expect(bank.find(item => item.id === publishedCard.id).design.html).toBe(publishedCard.design.html);
});

test('distinct-font-replacement-and-history', async ({ context, browser }, info) => {
  const page = await setup(context, { markup: '<p id="font-copy">A font replacement with two different files</p>' });
  const oldFile = 'tests/fixtures/dm-sans-latin-400-normal.woff2', newFile = 'tests/fixtures/dm-sans-latin-700-normal.woff2';
  const oldBytes = await readFile(oldFile), newBytes = await readFile(newFile);
  expect(oldBytes).not.toEqual(newBytes);
  const old = await uploadFile(page, runtime, oldFile);
  await expect(page.locator('#asset-name')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-action=theme]').click();
  await page.locator('#theme-font').selectOption('cms-font-' + old.id);
  await page.locator('[data-page-id=final-acceptance]').click(); await ready(page);
  await frame(page).locator('#font-copy').click();
  await page.locator('details.advanced-style summary').click();
  await page.locator('#extra-property').fill('font-family');
  await page.locator('#extra-value').fill('"cms-font-' + old.id + '"');
  await page.locator('#apply-property').click(); await save(page);
  const previous = (await state(context, runtime)).project;
  expect(previous.theme.fontFamily).toBe('cms-font-' + old.id);
  await openAssets(page);
  await page.locator(`#special-stage [data-asset-id="${old.id}"]`).click();
  await page.locator('[data-action=replace-asset]').click();
  const replacement = await uploadFile(page, runtime, newFile);
  await expect(page.locator('#studio-toast')).toContainText('referenser är ersatta', { timeout: 20_000 });
  await save(page);
  const current = (await state(context, runtime)).project;
  expect(current.theme.fontFamily).toBe('cms-font-' + replacement.id);
  expect(current.pages.find(page => page.id === 'final-acceptance').css).toContain('cms-font-' + replacement.id);
  const publicPage = await browser.newPage();
  try {
    await publicPage.goto(runtime.url + '/final-acceptance/');
    await publicPage.evaluate(() => document.fonts.ready.then(() => undefined));
    expect(await publicPage.locator('#font-copy').evaluate(el => getComputedStyle(el).fontFamily)).toContain('cms-font-' + replacement.id);
    expect(await (await publicPage.request.get(runtime.url + replacement.src, { maxRetries: 2 })).body()).toEqual(newBytes);
    expect(await (await publicPage.request.get(runtime.url + old.src, { maxRetries: 2 })).body()).toEqual(oldBytes);
    await publish(context, runtime, previous);
    await publicPage.reload();
    await publicPage.evaluate(() => document.fonts.ready.then(() => undefined));
    expect(await publicPage.locator('#font-copy').evaluate(el => getComputedStyle(el).fontFamily)).toContain('cms-font-' + old.id);
    await publicPage.screenshot({ path: info.outputPath('font-replaced-and-restored.png') });
  } finally { await publicPage.close(); }
});

test('managed-svg-dirty-navigation-unload-recovery', async ({ context }) => {
  const page = await setup(context);
  const asset = (await state(context, runtime)).assets.find(item => item.editableSrc && item.slot === 'emailStatic');
  await openAssets(page);
  await page.locator(`#special-stage [data-asset-id="${asset.id}"]`).click();
  await expect(page.locator('[data-action=edit-svg-asset]')).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-action=edit-svg-asset]').click(); await ready(page);
  const group = frame(page).locator('svg g').first();
  await expect(group).toBeVisible({ timeout: 10_000 }); await group.click();
  await page.locator('[data-nudge=right]').click();
  await expect(page.locator('[data-action=save]')).toBeEnabled();
  await expect(page.locator('#save-status')).toContainText('SVG-utkast');
  await backupSettled(page);
  const svgRecords = (await records(page)).filter(row => row.managedSvg);
  expect(svgRecords.length).toBeGreaterThan(0);
  expect(svgRecords.at(-1).managedSvg.id).toBe(asset.id);
  expect(svgRecords.at(-1).managedSvg.svg).toContain('translate(');
  expect(svgRecords.at(-1).managedSvg.svg).not.toContain('data-cms-node');
  const prevented = await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; });
  expect(prevented, 'dirty managed SVG did not participate in beforeunload protection').toBe(true);
  await page.locator('[data-library=pages]').click();
  await expect(page.locator('#studio-dialog')).toBeVisible();
  await expect(page.locator('#dialog-content')).toContainText('Lämna SVG-utkastet?');
  await page.locator('[data-confirm=no]').click();
  await expect(page.locator('#studio-dialog')).toBeHidden();
  await expect(page.locator('#canvas-label')).toContainText('SVG');
  await expect(page.locator('[data-action=save]')).toBeEnabled();
  await page.locator('[data-library=pages]').click();
  await expect(page.locator('#studio-dialog')).toBeVisible();
  await page.locator('[data-confirm=yes]').click();
  await expect(page.locator('#studio-dialog')).toBeHidden();
  await expect(page.locator('[data-page-id]').first()).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(700);
  expect((await records(page)).filter(row => !row.deleted).some(row => row.managedSvg)).toBe(false);
});

test('storage-quota-visible-export', async ({ context }, info) => {
  const init = `(() => { const original = IDBDatabase.prototype.transaction; IDBDatabase.prototype.transaction = function(stores, mode, ...args) { if (mode === 'readwrite') throw new DOMException('Test quota', 'QuotaExceededError'); return original.call(this, stores, mode, ...args); }; })();`;
  const page = await setup(context, { init });
  await page.locator('#page-description').fill('Valuable text despite rejected local storage');
  await expect(page.locator('#backup-status')).toContainText('kunde inte sparas', { timeout: 10_000 });
  await expect(page.locator('[data-action=save]')).toBeEnabled();
  await page.locator('[data-action=backups]').click();
  const pending = page.waitForEvent('download');
  await page.locator('#backup-export').click();
  const data = JSON.parse((await downloadBytes(await pending, info, 'quota-backup.json')).toString('utf8'));
  expect(data.project.pages[0].description).toBe('Valuable text despite rejected local storage');
  await page.screenshot({ path: info.outputPath('storage-quota-visible.png') });
});
