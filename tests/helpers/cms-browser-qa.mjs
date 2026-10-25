import { expect } from '@playwright/test';
import { basename } from 'node:path';

export const DESKTOP = { width: 1440, height: 900 };
export const MOBILE = { width: 390, height: 844 };
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
export const upload = () => ({ name: 'cms-browser-upload.png', mimeType: 'image/png', buffer: PNG });
export const readApi = (request, url) => request.get(url, { maxRetries: 2 });

export async function seedRuntime(runtime, request, project) {
  const headers = { 'Cf-Access-Jwt-Assertion': await runtime.token(), Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' };
  const response = await request.get(runtime.url + '/admin/api/state', { headers });
  expect(response.status(), await response.text()).toBe(200);
  const state = await response.json();
  await response.dispose();
  const saved = await request.post(runtime.url + '/admin/api/save', { headers, data: { project: project ?? state.project, baseVersion: state.version, requestId: crypto.randomUUID() } });
  expect(saved.status(), await saved.text()).toBe(200);
  await saved.dispose();
  return state.project;
}

export function trackPage(page) {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(`console error: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`pageerror: ${error}`));
  return errors;
}

export const assertClean = (errors, label) => expect(errors, label).toEqual([]);
export async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, bodyScrollWidth: document.body?.scrollWidth ?? 0, bodyClientWidth: document.body?.clientWidth ?? 0 }));
  expect(metrics.scrollWidth, label).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.bodyScrollWidth, label).toBeLessThanOrEqual(metrics.bodyClientWidth);
}

export async function openAssets(page, section = 'media') {
  if (!['media', 'wins'].includes(section)) throw new Error(`Unknown resource section: ${section}`);
  await page.locator(section === 'wins' ? '[data-library=wins]' : '[data-library=assets]').click();
  await page.locator(`#special-stage ${section === 'wins' ? '#win-search' : '[data-media-state=active]'}`).waitFor({ state: 'visible', timeout: 20_000 });
}

export async function saveAssetMetadata(page) {
  const previous = await page.locator('#asset-name').elementHandle();
  if (!previous) throw new Error('Filens metadataformulär saknas');
  try {
    const [response] = await Promise.all([
      page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/admin/api/asset-metadata'),
      page.locator('[data-action=save-asset]').click(),
    ]);
    if (response.status() !== 200) throw new Error(`Metadata sparades inte: HTTP ${response.status()}`);
    await page.waitForFunction(input => !input.isConnected, previous, { timeout: 20_000 });
    await page.locator('#asset-name').waitFor({ state: 'visible', timeout: 20_000 });
  } finally { await previous.dispose(); }
}

export async function uploadFile(page, file, baseUrl) {
  const [response] = await Promise.all([
    page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/admin/api/upload'),
    page.locator('#file-input').setInputFiles(file),
  ]);
  if (response.status() !== 201) throw new Error(`Uppladdningen misslyckades: HTTP ${response.status()}`);
  const assetId = response.request().headers()['x-cms-upload-id'];
  if (!assetId) throw new Error('Uppladdningen saknar sin begärans fil-ID');
  await page.waitForFunction(() => document.querySelector('#file-input').files.length === 0, undefined, { timeout: 20_000 });
  await page.locator('#asset-name').waitFor({ state: 'visible', timeout: 20_000 });
  const state = await readApi(page.request, baseUrl + '/admin/api/state');
  let matches;
  try {
    if (state.status() !== 200) throw new Error(`Uppladdningens metadata kunde inte läsas: HTTP ${state.status()}`);
    matches = (await state.json()).assets.filter(asset => asset.id === assetId);
  } finally { await state.dispose(); }
  if (matches.length !== 1 || matches[0].name !== basename(typeof file === 'string' ? file : file.name)) throw new Error(`Uppladdad fil saknas eller stämmer inte i lagringen: ${assetId}`);
  return matches[0];
}

export async function lockPreview(page, timeout = 20_000) {
  const frames = page.locator('#preview-stage iframe');
  const previous = await frames.count() ? await frames.first().elementHandle() : null;
  try {
    await page.locator('[data-action=lock]').click();
    if (previous) await page.waitForFunction(frame => !frame.isConnected, previous, { timeout });
    await frames.first().waitFor({ state: 'attached', timeout });
    const preview = page.frameLocator('#preview-stage iframe').first();
    await preview.locator('head script[type=module][src*="/assets/main."]').waitFor({ state: 'attached', timeout });
    return await preview.locator('script[src]').evaluateAll(scripts => scripts.map(script => script.getAttribute('src') || ''));
  } finally { await previous?.dispose(); }
}

export async function waitCanvas(page, timeout = 20_000) {
  await page.locator('#editor iframe.gjs-frame').waitFor({ state: 'attached', timeout });
  await page.locator('#loading-state').waitFor({ state: 'hidden', timeout });
  await page.waitForTimeout(500);
}

export async function frame(page) {
  const handle = await page.locator('#editor iframe.gjs-frame').elementHandle();
  if (!handle) throw new Error('GrapesJS .gjs-frame saknar element handle');
  try {
    const canvas = await handle.contentFrame();
    if (!canvas) throw new Error('GrapesJS .gjs-frame saknar innehållsram');
    await canvas.locator('body').waitFor({ state: 'attached', timeout: 10_000 });
    return canvas;
  } finally { await handle.dispose(); }
}

export async function firstTextTarget(canvas) {
  for (const selector of ['h1', 'h2', 'h3', 'p']) {
    const candidates = canvas.locator(selector);
    for (let index = 0; index < Math.min(await candidates.count(), 12); index++) if (await candidates.nth(index).isVisible()) return candidates.nth(index);
  }
  throw new Error('canvas saknar klickbar rubrik eller text');
}

export async function waitSaved(page, timeout = 30_000) {
  await page.waitForFunction(() => !document.querySelector('#save-status').innerText.includes('Sparar') && document.querySelector('[data-action=save]').disabled && document.querySelector('[data-action=revert]').disabled, undefined, { timeout });
  return page.locator('#save-status').innerText();
}

export async function save(page) {
  await page.locator('[data-action=save]').click();
  return waitSaved(page);
}

export async function confirmYes(page) {
  const dialog = page.locator('#studio-dialog[open]');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
  await dialog.locator('[data-confirm=yes]').click();
  await dialog.waitFor({ state: 'hidden', timeout: 10_000 });
}

export async function revertIfDirty(page) {
  const button = page.locator('[data-action=revert]');
  if (await button.isDisabled()) return;
  const previous = await page.locator('#editor iframe.gjs-frame').elementHandle();
  try {
    await button.click();
    await confirmYes(page);
    if (previous) await page.waitForFunction(canvas => !canvas.isConnected, previous, { timeout: 20_000 });
    await waitCanvas(page);
  } finally { await previous?.dispose(); }
}

export async function original(page) {
  await page.locator('[data-action=history]').click();
  await page.locator('[data-restore-version="0"]').click();
  await confirmYes(page);
  await waitCanvas(page);
  if (await page.locator('[data-action=save]').isEnabled()) await save(page);
}

export async function discoverPages(page) {
  const entries = await page.locator('[data-page-id]').evaluateAll(rows => rows.map(row => ({ id: row.dataset.pageId || '', name: row.querySelector('.page-name').innerText })));
  expect(entries.length, 'inga dynamiskt upptäckta sidor').toBeGreaterThan(0);
  return entries;
}

export async function openPage(page, entry) {
  const row = page.locator(`[data-page-id="${entry.id}"]`);
  expect(await row.count(), `sidrad saknas: ${entry.id}`).toBeGreaterThan(0);
  if (!await row.isVisible()) {
    const toggle = page.locator('[data-action=toggle-pages]');
    await expect(toggle, 'mobilens Sidor-drawer kan inte öppnas').toBeVisible();
    await toggle.click();
    await row.waitFor({ state: 'visible', timeout: 10_000 });
  }
  await row.click();
  await waitCanvas(page);
  expect(await page.locator('#canvas-path').innerText(), `sidans canvas saknar path: ${entry.name}`).not.toBe('');
}

export async function fontSelect(page, value) {
  const find = async () => {
    const selectors = page.locator('#styles-panel select');
    for (let index = 0; index < await selectors.count(); index++) if (await selectors.nth(index).locator(`option[value="${value}"]`).count()) return selectors.nth(index);
  };
  let select = await find();
  if (select) return select;
  const titles = page.locator('#styles-panel .gjs-sm-sector-title');
  for (let index = 0; index < await titles.count(); index++) if ((await titles.nth(index).innerText()).includes('Typografi')) { await titles.nth(index).click(); break; }
  await page.waitForTimeout(250);
  select = await find();
  if (!select) throw new Error(`individuell font-family-hook saknas för ${value}`);
  return select;
}

export async function shiftEnterText(locator, first = 'Omar', second = 'Yusuf.') {
  await locator.click();
  await locator.press('ControlOrMeta+A');
  await locator.press('Backspace');
  await locator.pressSequentially(first);
  await locator.press('Shift+Enter');
  await locator.pressSequentially(second);
  return `${first}\n${second}`;
}

export class CMSBrowserQA {
  constructor(browser, runtime, testInfo) {
    this.browser = browser;
    this.runtime = runtime;
    this.testInfo = testInfo;
  }

  async context(viewport, authenticated = true, options = {}) {
    const context = await this.browser.newContext({ viewport, acceptDownloads: true, ...options });
    if (authenticated) await context.addCookies([{ name: 'CF_Authorization', value: await this.runtime.token(), url: this.runtime.url }]);
    return context;
  }

  async adminPage(viewport = DESKTOP, label = this.testInfo.title) {
    const context = await this.context(viewport);
    try {
      const page = await context.newPage();
      const errors = trackPage(page);
      const response = await page.goto(this.runtime.url + '/admin/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      if (response) expect(response.status(), label).toBeLessThan(400);
      expect(page.url()).not.toContain('/login');
      expect(await page.locator('body').getAttribute('class'), label).toContain('studio');
      if (viewport.width <= 500) await page.locator('[data-action=toggle-pages]').waitFor({ state: 'visible', timeout: 10_000 });
      else {
        await page.locator('#library-list').waitFor({ state: 'visible', timeout: 20_000 });
        await page.locator('[data-page-id]').first().waitFor({ state: 'visible', timeout: 20_000 });
      }
      await waitCanvas(page);
      await page.waitForTimeout(600);
      const dialog = page.locator('#studio-dialog[open]');
      if (await dialog.count() && await dialog.isVisible() && /idé väntar|lokalt utkast/.test(await dialog.innerText())) {
        await dialog.locator('[data-confirm=no]').click();
        await dialog.waitFor({ state: 'hidden', timeout: 5000 });
      }
      return { context, page, errors };
    } catch (error) { await context.close(); throw error; }
  }

  async screenshot(page, name, fullPage = true) {
    const path = this.testInfo.outputPath(name + '.png');
    await page.screenshot({ path, fullPage });
    await this.testInfo.attach(name, { path, contentType: 'image/png' });
  }
}
