import { expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

export function api(context, runtime, path, data) {
  const url = runtime.url + '/admin/api/' + path;
  return data === undefined ? context.request.get(url, { maxRetries: 2 }) : context.request.post(url, { data, headers: { Origin: runtime.url, 'X-CMS-Request': '1' } });
}

export async function state(context, runtime) {
  const response = await api(context, runtime, 'state');
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}

export async function publish(context, runtime, project) {
  const current = await state(context, runtime);
  const result = await api(context, runtime, 'save', { project, baseVersion: current.version, requestId: crypto.randomUUID() });
  expect(result.ok(), `${result.status()} ${await result.text()}`).toBe(true);
  return result.json();
}

export async function seedReview(context, runtime) {
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url, httpOnly: true, secure: false, sameSite: 'Lax' }]);
  const baseline = await api(context, runtime, 'revision/0');
  expect(baseline.ok(), await baseline.text()).toBe(true);
  await publish(context, runtime, (await baseline.json()).project);
}

export const frame = page => page.frameLocator('#editor iframe.gjs-frame');

export async function ready(page) {
  await expect(page.locator('#editor iframe.gjs-frame')).toBeAttached({ timeout: 20_000 });
  await expect(page.locator('#loading-state')).toBeHidden({ timeout: 20_000 });
  await page.waitForTimeout(500);
}

export async function admin(context, runtime, waitForReady = ready) {
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept());
  await page.goto(runtime.url + '/admin/');
  await waitForReady(page);
  expect(await page.evaluate(() => document.cookie.split(';').some(value => value.trimStart().startsWith('CF_Authorization='))), 'The original owner fixture keeps the Access cookie HttpOnly').toBe(false);
  return page;
}

export async function anonymousPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'no-preference', storageState: { cookies: [], origins: [] } });
  try {
    expect(page.viewportSize(), 'The original public checks use the browser API default viewport').toEqual({ width: 1280, height: 720 });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'The original public context uses ordinary motion').toBe(false);
    expect(await page.context().cookies(), 'The public context must remain anonymous').toEqual([]);
    return page;
  } catch (error) { await page.close(); throw error; }
}

export async function save(page) {
  await page.locator('[data-action=save]').click();
  await expect.poll(async () => !(await page.locator('#save-status').innerText()).includes('Sparar') && await page.locator('[data-action=save]').isDisabled() && await page.locator('[data-action=revert]').isDisabled(), { timeout: 30_000, message: 'Save avslutades inte' }).toBe(true);
}

export async function backupSettled(page) {
  await expect(page.locator('#backup-status')).toContainText('sparat för denna flik', { timeout: 10_000 });
}

export async function confirmYes(page) {
  const dialog = page.locator('#studio-dialog[open]');
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-confirm=yes]').click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

export async function restorePrompt(page, waitForReady = ready) {
  await expect(page.locator('#dialog-content')).toContainText('En idé väntar');
  await page.locator('[data-confirm=yes]').click();
  await expect(page.locator('#studio-dialog')).toBeHidden({ timeout: 20_000 });
  await waitForReady(page);
}

export async function revertIfDirty(page) {
  const button = page.locator('[data-action=revert]');
  if (await button.isDisabled()) return;
  const previous = await page.locator('#editor iframe.gjs-frame').elementHandle();
  try {
    await button.click();
    await confirmYes(page);
    if (previous) await page.waitForFunction(frame => !frame.isConnected, previous, { timeout: 20_000 });
    await ready(page);
  } finally { await previous?.dispose(); }
}

export async function openAssets(page, section = 'media') {
  if (!['media', 'wins'].includes(section)) throw new Error(`Unknown resource section: ${section}`);
  await page.locator(`[data-library=${section === 'wins' ? 'wins' : 'assets'}]`).click();
  await expect(page.locator(`#special-stage ${section === 'wins' ? '#win-search' : '[data-media-state=active]'}`)).toBeVisible({ timeout: 20_000 });
}

export async function uploadFile(page, runtime, path) {
  const pending = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/admin/api/upload');
  await page.locator('#file-input').setInputFiles(path);
  const response = await pending;
  expect(response.status(), 'Uppladdningen misslyckades').toBe(201);
  const id = response.request().headers()['x-cms-upload-id'];
  expect(id, 'Uppladdningen saknar sin begärans fil-ID').toBeTruthy();
  await page.waitForFunction(() => document.querySelector('#file-input').files.length === 0, null, { timeout: 20_000 });
  await expect(page.locator('#asset-name')).toBeVisible({ timeout: 20_000 });
  const matches = (await state(page.context(), runtime)).assets.filter(asset => asset.id === id);
  expect(matches).toHaveLength(1);
  expect(matches[0].name).toBe(basename(path));
  return matches[0];
}

export function records(page, activeOnly = false) {
  return page.evaluate(activeOnly => new Promise((resolve, reject) => {
    const open = indexedDB.open('oy-portfolio-studio', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('drafts'), request = tx.objectStore('drafts').getAll();
      tx.onabort = () => { db.close(); reject(tx.error); };
      request.onerror = () => { db.close(); reject(request.error); };
      request.onsuccess = () => { const rows = request.result; db.close(); resolve(activeOnly ? rows.filter(row => row.project && !row.deleted) : rows); };
    };
  }), activeOnly);
}

export async function shot(page, info, name) {
  await page.mouse.move(3, 3);
  await page.screenshot({ path: info.outputPath(name + '.png') });
}

export async function downloadBytes(download, info, name) {
  const path = info.outputPath(name);
  await download.saveAs(path);
  return readFile(path);
}
