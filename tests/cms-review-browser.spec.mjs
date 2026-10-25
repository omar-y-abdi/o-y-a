import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { api, state, publish, seedReview, admin as openAdmin, ready as waitCanvas, frame, save, backupSettled, restorePrompt as restoreDraft, revertIfDirty, openAssets, uploadFile, records, confirmYes, shot, downloadBytes } from './helpers/review-browser.mjs';

let runtime;
test.describe.configure({ mode: 'default', timeout: 120_000 });
test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true, storageState: { cookies: [], origins: [] } });
test.beforeAll(async () => { runtime = await cmsRuntime({ port: 0 }); });
test.afterAll(async () => { await runtime?.close(); });
test.beforeEach(async ({ context }) => { await seedReview(context, runtime); });

async function ready(page) {
  await waitCanvas(page);
  await expect(page.locator('#page-description')).toBeVisible();
}
const admin = (context, runtime) => openAdmin(context, runtime, ready);
const restorePrompt = page => restoreDraft(page, ready);

test('independent-tabs-save-revert-reload', async ({ context: initialContext, browser }, info) => {
  for (const order of ['A', 'B']) {
    const context = order === 'A' ? initialContext : await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', storageState: { cookies: [], origins: [] } });
    try {
      if (order === 'B') await seedReview(context, runtime);
      const a = await admin(context, runtime), b = await admin(context, runtime);
      await a.locator('#page-description').fill('Tab A independent valuable draft');
      await backupSettled(a);
      await b.locator('#page-description').fill('Tab B published version');
      await save(b);
      expect((await records(a, true)).some(row => row.project.pages[0].description === 'Tab A independent valuable draft')).toBe(true);
      await b.locator('#page-description').fill('Tab B disposable edit');
      await backupSettled(b);
      await revertIfDirty(b);
      await expect(b.locator('#page-description')).toHaveValue('Tab B published version');
      await expect(b.locator('#backup-status')).toHaveText('Reservutkast redo');
      if (order === 'B') await b.close();
      await a.reload(); await ready(a); await restorePrompt(a);
      await expect(a.locator('#page-description')).toHaveValue('Tab A independent valuable draft');
      await a.locator('[data-action=backups]').click();
      await expect(a.locator('#backup-export')).toBeVisible();
      await shot(a, info, 'independent-tab-recovery-' + order);
    } finally { await context.close(); }
  }
});

test('incomplete-recovery-export-unsafe-import', async ({ context }, info) => {
  const page = await admin(context, runtime);
  await page.locator('#page-description').fill('Valuable incomplete draft survives');
  await page.locator('#page-title').fill('');
  await backupSettled(page);
  await page.reload(); await ready(page); await restorePrompt(page);
  await expect(page.locator('#page-title')).toHaveValue('');
  await expect(page.locator('#page-description')).toHaveValue('Valuable incomplete draft survives');
  await expect(page.locator('#studio-toast')).toContainText('Rätta före Save');
  await shot(page, info, 'incomplete-draft-restored');
  await page.locator('[data-action=backups]').click();
  const exported = page.waitForEvent('download');
  await page.locator('#backup-export').click();
  const data = JSON.parse((await downloadBytes(await exported, info, 'incomplete-draft.json')).toString('utf8'));
  expect(data.format).toBe('oy-portfolio-draft');
  expect(data.project.pages[0].title).toBe('');
  data.project.pages[0].css = 'body{background:url(https://evil.example/leak)}';
  await page.locator('#backup-file').setInputFiles({ name: 'unsafe-import.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await page.locator('[data-confirm=yes]').click();
  await expect(page.locator('#dialog-content')).toContainText('Utkastet kunde inte läsas säkert');
  await expect(page.locator('#export-rejected')).toBeVisible();
  const rejected = page.waitForEvent('download');
  await page.locator('#export-rejected').click();
  expect(JSON.parse((await downloadBytes(await rejected, info, 'rejected-original.json')).toString('utf8')).project).toEqual(data.project);
  await shot(page, info, 'unsafe-backup-visible-error');
});

test('expired-session-keeps-backup', async ({ context }, info) => {
  const page = await admin(context, runtime);
  await page.locator('#page-description').fill('Session expiry must not destroy this');
  await backupSettled(page);
  await page.route('**/admin/api/recover', route => route.fulfill({ status: 401, json: { error: 'Sessionen har gått ut.' } }));
  await page.reload(); await ready(page);
  await page.locator('[data-confirm=yes]').click();
  await expect(page.locator('#dialog-content')).toContainText('Sessionen har gått ut');
  expect((await records(page, true)).some(row => row.project.pages[0].description === 'Session expiry must not destroy this')).toBe(true);
  await shot(page, info, 'expired-session-recovery');
});

test('definitive-rejection-and-unknown-replay', async ({ context }, info) => {
  const page = await admin(context, runtime);
  let calls = [];
  await page.route('**/admin/api/save', route => {
    calls.push(route.request().postDataJSON());
    return calls.length === 1 ? route.fulfill({ status: 413, contentType: 'text/plain', body: 'Content too large' }) : route.continue();
  });
  await page.locator('#page-description').fill('Rejected payload');
  const rejected = page.waitForResponse(response => response.url().endsWith('/admin/api/save'));
  await page.locator('[data-action=save]').click();
  await rejected;
  await expect(page.locator('#save-status')).not.toContainText('Sparar');
  await page.locator('#page-description').fill('Corrected payload');
  await save(page);
  expect(calls[0].requestId).not.toBe(calls[1].requestId);
  expect(calls[1].changes.pages.upsert.some(page => page.description === 'Corrected payload')).toBe(true);
  await page.unroute('**/admin/api/save');
  calls = [];
  await page.route('**/admin/api/save', async route => {
    calls.push(route.request().postDataJSON());
    if (calls.length === 1) {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort('failed');
    } else await route.continue();
  });
  await page.locator('#page-description').fill('Committed but response lost');
  await page.locator('[data-action=save]').click();
  await expect(page.locator('#studio-toast')).toContainText('Anslutningen bröts');
  await page.locator('#studio-dialog [data-action=close-dialog]').click();
  await page.locator('#page-description').fill('Newer correction after unknown outcome');
  await save(page);
  expect(calls[0], 'Unknown commit must replay the exact ID and payload').toEqual(calls[1]);
  expect(calls).toHaveLength(3);
  expect(calls[2].requestId).not.toBe(calls[1].requestId);
  expect((await state(context, runtime)).project.pages[0].description).toBe('Newer correction after unknown outcome');
  await shot(page, info, 'save-rejection-and-replay');
});

test('rapid-inline-save-diagnostic', async ({ context, browserName }, info) => {
  const page = await admin(context, runtime), requests = [];
  await page.route('**/admin/api/save', route => { requests.push(route.request().postDataJSON()); return route.continue(); });
  await frame(page).locator('#hero-title').dblclick();
  const editable = frame(page).locator('[contenteditable=true]').first();
  await expect(editable).toBeVisible();
  const marker = 'RAPID-' + crypto.randomUUID().replaceAll('-', '').slice(0, 6);
  await editable.press('ControlOrMeta+A');
  await editable.press('Backspace');
  await expect(page).toHaveURL(runtime.url + '/admin/');
  await expect(editable).toHaveAttribute('contenteditable', 'true');
  await editable.pressSequentially(marker);
  const pending = page.waitForResponse(response => response.url().endsWith('/admin/api/save'));
  await page.locator('[data-action=save]').click();
  const result = await pending;
  await expect(page.locator('#save-status')).not.toContainText('Sparar', { timeout: 20_000 });
  await page.waitForTimeout(600);
  const currentState = await state(context, runtime), rows = await records(page, true);
  const row = rows.reduce((latest, item) => !latest || (item.updatedAt ?? '') > (latest.updatedAt ?? '') ? item : latest, null);
  const payload = requests[0] ?? {}, submitted = payload.changes?.pages?.upsert?.find(item => item.id === 'home') ?? {};
  const current = currentState.project.pages.find(item => item.id === 'home') ?? {}, backup = row?.project?.pages?.find(item => item.id === 'home');
  const fields = ['title', 'description', 'html', 'css'];
  console.log('RAPID_SAVE_DIAGNOSTIC ' + JSON.stringify({ browser: browserName, status: result.status(), requestCount: requests.length, requestBytes: Buffer.byteLength(JSON.stringify(payload)), submittedPageFields: Object.keys(submitted).sort(), serverVersion: currentState.version, serverDiffFromSubmitted: fields.filter(key => submitted[key] !== current[key]), backupDiffFromSubmitted: backup ? fields.filter(key => submitted[key] !== backup[key]) : null, saveStatus: await page.locator('#save-status').innerText(), backupStatus: await page.locator('#backup-status').innerText() }));
  expect(requests, 'Expected one successful immediate Save request.').toHaveLength(1);
  expect(result.status(), 'Expected one successful immediate Save request.').toBe(200);
  expect(backup ? fields.filter(key => backup[key] !== submitted[key]) : [], 'A canvas/editor flush changed the draft after Save despite no further user input.').toEqual([]);
  expect(await page.locator('#save-status').innerText(), 'A single immediate Save should leave this no-further-input draft clean.').not.toContain('Utkast');
  await shot(page, info, 'rapid-inline-save-diagnostic');
});

test('metadata-cas-explicit-retry', async ({ context }, info) => {
  const a = await admin(context, runtime), uploaded = await uploadFile(a, runtime, 'public/mail/omar-smile.png');
  const id = uploaded.id;
  await expect(a.locator('#asset-name')).toBeVisible();
  const b = await admin(context, runtime);
  await openAssets(b);
  const row = b.locator(`#special-stage [data-asset-id="${id}"]`);
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(b.locator('#asset-name')).toBeVisible({ timeout: 20_000 });
  await a.locator('[data-action=archive-asset]').click();
  await a.locator('[data-confirm=yes]').click();
  await b.locator('#asset-name').fill('Renamed without reversing archive');
  await b.locator('#asset-alt').fill('Concurrent alternative text');
  await b.locator('[data-action=save-asset]').click();
  await expect(b.locator('#dialog-content')).toContainText('Granska innan du skriver över');
  await expect(b.locator('#asset-name')).toHaveValue('Renamed without reversing archive');
  await shot(b, info, 'asset-metadata-conflict');
  await b.locator('#retry-asset').click();
  await expect(b.locator('[data-action=restore-asset]')).toBeVisible();
  const archived = await api(context, runtime, 'assets?state=archived');
  const item = (await archived.json()).items.find(item => item.id === id);
  expect(item.archived).toBeTruthy();
  expect(item.name).toBe('Renamed without reversing archive');
  expect(item.alt).toBe('Concurrent alternative text');
});

test('clone-anchor-aria-svg-style-delete-original', async ({ context, browser }, info) => {
  const current = await state(context, runtime), project = current.project;
  const markup = '<section id="copy-section" aria-labelledby="copy-target" style="padding:19px;color:rgb(201,32,17)"><h2 id="copy-target">Local clone target</h2><a href="#copy-target">Local clone link</a><a href="/kontakt/">External target</a><svg viewBox="0 0 10 10" width="40" height="40"><defs><clipPath id="copy-clip"><circle cx="5" cy="5" r="5"></circle></clipPath></defs><rect width="10" height="10" clip-path="url(#copy-clip)"></rect></svg></section>';
  project.pages.push({ ...current.blank, id: 'review-clone', sourceId: 'blank', path: '/review-clone/', html: current.blank.html.replace('</main>', markup + '</main>') });
  await publish(context, runtime, project);
  const page = await admin(context, runtime);
  await page.locator('[data-page-id=review-clone]').click(); await ready(page);
  await frame(page).getByText('Local clone target', { exact: true }).click();
  await page.locator('#select-parent').click();
  await page.locator('#duplicate-element').click();
  await expect(frame(page).getByText('Local clone target', { exact: true })).toHaveCount(2);
  await save(page); await page.reload(); await ready(page);
  const savedPage = (await state(context, runtime)).project.pages.find(item => item.id === 'review-clone');
  const compactCss = savedPage.css.replaceAll(' ', '');
  expect(compactCss).toContain('padding:19px');
  expect(compactCss).toContain('color:rgb(201,32,17)');
  expect(compactCss).not.toContain('color:black');
  expect(compactCss).not.toContain('border:0solidblack');
  const publicPage = await browser.newPage();
  try {
    const pending = publicPage.waitForResponse(response => response.url().includes('/cms-public/v') && response.url().endsWith('/review-clone.css'));
    await publicPage.goto(runtime.url + '/review-clone/', { waitUntil: 'load' });
    const cssResponse = await pending;
    expect(cssResponse.ok(), `${cssResponse.status()} ${cssResponse.url()}`).toBe(true);
    const publishedCss = (await cssResponse.text()).replaceAll(' ', '');
    expect(publishedCss).toContain('padding:19px');
    expect(publishedCss).toContain('color:rgb(201,32,17)');
    const sections = publicPage.locator('section:has(h2)').filter({ has: publicPage.getByText('Local clone target', { exact: true }) });
    await expect(sections).toHaveCount(2);
    for (let index = 0; index < 2; index++) {
      await expect(sections.nth(index)).toHaveCSS('padding', '19px');
      await expect(sections.nth(index)).toHaveCSS('color', 'rgb(201, 32, 17)');
    }
    const values = await sections.evaluateAll(sections => sections.map(section => ({ id: section.id, heading: section.querySelector('h2').id, link: section.querySelector('a').getAttribute('href'), label: section.getAttribute('aria-labelledby'), clip: section.querySelector('clipPath').id, clipRef: section.querySelector('rect').getAttribute('clip-path'), padding: getComputedStyle(section).padding, color: getComputedStyle(section).color })));
    expect(values).toHaveLength(2);
    expect(values[0].id).not.toBe(values[1].id);
    for (const value of values) {
      expect(value.link).toBe('#' + value.heading);
      expect(value.label).toBe(value.heading);
      expect(value.clipRef).toBe('url(#' + value.clip + ')');
      expect(value.padding).toBe('19px');
      expect(value.color).toBe('rgb(201, 32, 17)');
      await publicPage.locator('#' + value.id + ' a').first().click();
      expect(publicPage.url().endsWith('#' + value.heading)).toBe(true);
    }
    await shot(publicPage, info, 'clone-semantic-references');
  } finally { await publicPage.close(); }
  await page.locator('[data-page-id=review-clone]').click(); await ready(page);
  await frame(page).getByText('Local clone target', { exact: true }).first().click();
  await page.locator('#select-parent').click();
  await page.locator('#delete-element').click();
  if (await page.locator('[data-confirm=yes]').isVisible()) await page.locator('[data-confirm=yes]').click();
  await save(page);
  expect((await api(context, runtime, 'validate', { project: (await state(context, runtime)).project })).ok()).toBe(true);
});

test('builtin-resource-publication', async ({ context, browser }, info) => {
  const page = await admin(context, runtime), bytes = await readFile('public/social/omar-yusuf.png');
  for (const slot of ['social', 'icon', 'emailStatic', 'emailAnimated']) {
    const builtin = (await state(context, runtime)).assets.find(item => item.slot === slot);
    await openAssets(page);
    await page.locator(`#special-stage [data-asset-id="${builtin.id}"]`).click();
    await page.locator('[data-action=replace-asset]').click();
    await page.locator('#file-input').setInputFiles('public/social/omar-yusuf.png');
    await expect(page.locator('#studio-toast')).toContainText('referenser är ersatta', { timeout: 20_000 });
    await save(page);
    const src = (await state(context, runtime)).project.resources[slot];
    expect(src).toMatch(/^\/media\//);
    const anonymous = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    try {
      const response = await anonymous.request.get(runtime.url + src);
      expect(response.status()).toBe(200);
      expect(await response.body()).toEqual(bytes);
      const html = await (await anonymous.request.get(runtime.url + '/')).text();
      if (slot === 'social') expect(html).toContain(`property="og:image" content="${runtime.url + src}"`);
      if (slot === 'icon') expect(html).toContain(`rel="apple-touch-icon" href="${src}"`);
    } finally { await anonymous.close(); }
    await shot(page, info, 'resource-slot-' + slot);
  }
});

async function setTagline(page, text) {
  const node = frame(page).locator('[data-cms-shared="footer.tagline"]');
  await node.scrollIntoViewIfNeeded(); await node.click(); await node.dblclick();
  await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.type(text);
  await page.waitForTimeout(600);
}

async function sharedEverywhere(context, text) {
  const project = (await state(context, runtime)).project;
  expect(project.frame.html).toContain(text);
  expect(project.pages.filter(page => page.html.includes('data-cms-shared="footer.tagline"')).map(page => page.path)).toEqual([]);
  return project;
}

test('tagline-then-new-page', async ({ context }) => {
  const page = await admin(context, runtime);
  await setTagline(page, 'Ny tagline före ny sida');
  await page.locator('[data-action=add-page]').click();
  await page.locator('#new-page-name').fill('Tagline-test');
  await page.locator('#new-page-path').fill('/tagline-test/');
  await page.locator('#create-page').click(); await waitCanvas(page);
  await save(page);
  const project = await sharedEverywhere(context, 'Ny tagline före ny sida');
  expect(project.pages.some(page => page.path === '/tagline-test/')).toBe(true);
});

test('two-tabs-keep-mine', async ({ context }) => {
  const a = await admin(context, runtime), b = await admin(context, runtime);
  await setTagline(a, 'Flik A:s tagline'); await save(a);
  await setTagline(b, 'Flik B:s tagline');
  await b.locator('[data-action=save]').click();
  await expect(b.locator('#dialog-content')).toContainText('En nyare version finns');
  await b.locator('[data-action=reconcile]').click();
  await expect(b.locator('#dialog-content')).toContainText('Välj dina ändringar');
  await confirmYes(b); await waitCanvas(b);
  await save(b);
  await sharedEverywhere(context, 'Flik B:s tagline');
});

test('save-error-stays', async ({ context }) => {
  const page = await admin(context, runtime), message = 'Människan: Länken har en otillåten adress.';
  await page.route('**/admin/api/save', route => route.fulfill({ status: 422, json: { error: message } }));
  await page.locator('#page-description').fill('Ett utkast som sparas fel');
  await page.locator('[data-action=save]').click();
  await expect(page.locator('#save-status')).toContainText(message);
  await page.waitForTimeout(13_000);
  await expect(page.locator('#studio-toast')).toBeHidden();
  await expect(page.locator('#save-status')).toContainText(message);
  await page.locator('#page-description').fill('Ett utkast som sparas fel igen');
  await expect(page.locator('#save-status')).toContainText(message);
  await page.unroute('**/admin/api/save');
  await save(page);
  await expect(page.locator('#save-status')).not.toContainText(message);
  await expect(page.locator('#save-status')).toContainText('Alla ändringar sparade');
});

test('empty-link-blocks-save', async ({ context }) => {
  const page = await admin(context, runtime), calls = [];
  await page.route('**/admin/api/save', route => { calls.push(1); return route.continue(); });
  const node = frame(page).locator('main p').first();
  await node.scrollIntoViewIfNeeded(); await node.click(); await node.dblclick();
  await node.evaluate(el => { const doc = el.ownerDocument, selection = doc.getSelection(), range = doc.createRange(); el.focus(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range); });
  await page.locator('.gjs-rte-action[title="Link"]').click();
  await page.locator('[data-action=save]').click();
  await expect(page.locator('#studio-toast')).toContainText('Länken saknar adress.');
  await expect(page.locator('#element-href')).toBeFocused();
  expect(calls, 'Save must not reach the server with an empty link').toHaveLength(0);
  await page.locator('#element-href').fill('/om/');
  await page.locator('#element-href').press('Tab');
  await save(page);
  expect(calls).toHaveLength(1);
});

async function resizePage(context, id, path) {
  const current = await state(context, runtime), box = `<div id="${id}" style="width:200px;height:100px;background-color:rgb(10,20,30)"></div>`;
  current.project.pages.push({ ...current.blank, id: path, sourceId: 'blank', path: '/' + path + '/', html: current.blank.html.replace('</main>', box + '</main>') });
  await publish(context, runtime, current.project);
  const page = await admin(context, runtime);
  await page.locator(`[data-page-id=${path}]`).click(); await ready(page);
  return page;
}

async function resize(page, dx) {
  const handle = page.locator('.gjs-resizer-h-br');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  expect(box).toBeTruthy();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx / 2, y, { steps: 4 }); await page.mouse.move(x + dx, y, { steps: 4 }); await page.mouse.up();
}

async function setColour(page) {
  await page.locator('summary', { hasText: 'Fler stilegenskaper' }).click();
  await page.locator('#extra-property').fill('background-color');
  await page.locator('#extra-value').fill('rgb(200,10,10)');
  await page.locator('#apply-property').click();
  await expect(page.locator('.gjs-resizer-h-br')).toBeVisible();
}

test('resize-is-one-undo-step', async ({ context }) => {
  const page = await resizePage(context, 'rbox', 'review-resize');
  const node = () => frame(page).locator('#rbox');
  const width = async () => Math.round(await node().evaluate(el => el.getBoundingClientRect().width));
  const select = async () => { await node().scrollIntoViewIfNeeded(); await node().click(); };
  const undo = async () => { await page.locator('[data-action=undo]').click(); await waitCanvas(page); await select(); };
  await select();
  const original = await width();
  await setColour(page);
  await page.waitForTimeout(100);
  await resize(page, 80);
  await page.waitForTimeout(400);
  const first = await width();
  expect(first).toBeGreaterThan(original);
  await undo();
  expect(await width(), 'resize must revert alone').toBe(original);
  expect(await node().evaluate(el => getComputedStyle(el).backgroundColor), 'colour edit must survive the undo').toBe('rgb(200, 10, 10)');
  await resize(page, 60);
  const mid = await width();
  await resize(page, 60);
  const second = await width();
  expect(mid).toBeGreaterThan(original);
  expect(second).toBeGreaterThan(mid);
  await page.waitForTimeout(300);
  await undo();
  expect(await width(), 'only the second resize reverts').toBe(mid);
});

test('resize-then-immediate-edit-page', async ({ context }) => {
  const page = await resizePage(context, 'rbox2', 'review-resize2');
  const node = () => frame(page).locator('#rbox2');
  const width = async () => Math.round(await node().evaluate(el => el.getBoundingClientRect().width));
  const colour = () => node().evaluate(el => getComputedStyle(el).backgroundColor);
  const select = async () => { await node().scrollIntoViewIfNeeded(); await node().click(); };
  await select();
  const original = await width(), originalColour = await colour();
  await resize(page, 80);
  await setColour(page);
  const resized = await width();
  expect(resized).toBeGreaterThan(original);
  await page.locator('[data-action=undo]').click(); await waitCanvas(page); await select();
  expect(await width(), 'first Undo reverts only the colour').toBe(resized);
  expect(await colour(), 'first Undo reverts only the colour').toBe(originalColour);
  await page.locator('[data-action=undo]').click(); await waitCanvas(page); await select();
  expect(await width(), 'second Undo reverts the size').toBe(original);
});
