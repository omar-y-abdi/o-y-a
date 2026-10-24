import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

// Unlike cms-editor.spec.mjs's bare editor, Mejl needs the real studio and API.
// Share one local Worker/D1/R2 fixture; keep saves in order under fullyParallel.
let runtime;
test.describe.configure({ mode: 'default' });
test.beforeAll(async () => { runtime = await cmsRuntime(); });
test.afterAll(async () => { await runtime?.close(); });

const nextFrames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const blockIds = rows => rows.evaluateAll(nodes => nodes.map(node => node.dataset.emailBlock));
const subjectField = page => page.locator('[data-email-path="templates.receipt.subject"]');
const previewSubject = page => page.locator('[data-email-subject-row] [data-email-preview-subject]');

async function openEmail(page) {
  await expect(page.locator('#loading-state')).toBeHidden();
  // The page list exists only after boot's state request and backup setup.
  await expect(page.locator('[data-page-id="home"]')).toHaveCount(1);
  const pages = page.locator('[data-action="toggle-pages"]'), mobile = await pages.isVisible();
  if (mobile) await pages.click();
  await page.locator('button[data-special="email"]').click();
  if (mobile) {
    await pages.click();
    await expect(page.locator('#left-panel')).toBeHidden();
  }
  await expect(page.locator('.email-view[data-email-ready="true"]')).toBeVisible();
  await expect(page.locator('[data-email-panel][data-email-state="ready"]')).toBeVisible();
}

async function openStudio(page, context, viewport = { width: 1440, height: 1000 }) {
  await page.setViewportSize(viewport);
  // Same signed Access-cookie login as skift.spec.mjs and scripts/cms-dev.mjs.
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  await page.goto(runtime.url + '/admin/');
  await openEmail(page);
}

async function selectEmailTab(page, tab) {
  const button = page.locator(`[data-email-tab="${tab}"]`);
  await button.click();
  await expect(button).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`[data-email-panel="${tab}"][data-email-state="ready"]`)).toBeVisible();
}

async function saveStudio(page) {
  const save = page.locator('[data-action="save"]');
  await expect(save).toBeEnabled();
  const pending = page.waitForResponse(response => response.url() === runtime.url + '/admin/api/save' && response.request().method() === 'POST');
  await save.click();
  const response = await pending;
  expect(response.status(), await response.text()).toBe(200);
  await expect(page.locator('#save-status')).toHaveText(/^Alla ändringar sparade · v\d+$/);
  await expect(save).toBeDisabled();
  await expect(page.locator('#studio-toast')).toContainText(/är sparad och publicerad\./);
  await expect(page.locator('#studio-toast')).not.toHaveClass(/\bis-error\b/);
  await expect(page.locator('[data-email-panel][data-email-state="error"], [data-email-error]')).toHaveCount(0);
}

test('Kantfall 19: every mail preview image loads and decodes in every engine', async ({ page, context }) => {
  await openStudio(page, context);
  await selectEmailTab(page, 'receipt');
  await expect(page.locator('[data-email-preview-error]')).toBeHidden();
  const images = page.frameLocator('iframe[data-email-preview-frame]').locator('img');
  // An empty/about:blank frame must not make the image assertions vacuous.
  await expect.poll(() => images.count(), { message: 'receipt preview contains mail images' }).toBeGreaterThan(0);
  for (let index = 0, count = await images.count(); index < count; index++) {
    const image = images.nth(index), src = await image.getAttribute('src');
    await expect.poll(() => image.evaluate(node => node.complete), { message: `image finished loading: ${src}` }).toBe(true);
    expect(await image.evaluate(node => node.naturalWidth), `decoded image: ${src}`).toBeGreaterThan(0);
  }
});

test('Kantfall 22: every Mejl tab fits both page and stage at 390 px', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only preview image loading needs cross-engine coverage.');
  await openStudio(page, context, { width: 390, height: 844 });
  for (const tab of ['receipt', 'notification', 'compose', 'sent', 'settings']) {
    await selectEmailTab(page, tab);
    await nextFrames(page);
    const widths = await page.evaluate(() => {
      const page = document.documentElement, stage = document.querySelector('#special-stage');
      return { page: { scroll: page.scrollWidth, client: page.clientWidth }, stage: { scroll: stage.scrollWidth, client: stage.clientWidth } };
    });
    expect(widths.page.scroll, `${tab}: page width`).toBeLessThanOrEqual(widths.page.client);
    expect(widths.stage.client, `${tab}: visible stage has width`).toBeGreaterThan(0);
    expect(widths.stage.scroll, `${tab}: stage width`).toBeLessThanOrEqual(widths.stage.client);
  }
});

test('receipt subject updates the preview, survives Save and reload, and Undo restores the saved subject', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only preview image loading needs cross-engine coverage.');
  await openStudio(page, context);
  await selectEmailTab(page, 'receipt');
  const subject = subjectField(page), previous = await subject.inputValue();
  await expect(previewSubject(page)).toHaveText(previous);
  const saved = 'Ett nytt hej från studion · sparat';
  expect(saved).not.toBe(previous);
  await subject.fill(saved);
  await expect(previewSubject(page)).toHaveText(saved);
  await saveStudio(page);

  await page.reload();
  await openEmail(page);
  await selectEmailTab(page, 'receipt');
  await expect(subject).toHaveValue(saved);
  await expect(previewSubject(page)).toHaveText(saved);
  await expect(page.locator('[data-action="save"]')).toBeDisabled();

  await subject.fill('Ett nytt hej från studion · osparat');
  await expect(previewSubject(page)).toHaveText('Ett nytt hej från studion · osparat');
  const undo = page.locator('[data-action="undo"]');
  await expect(undo).toBeEnabled();
  await undo.click();
  await expect(subject).toHaveValue(saved);
  await expect(previewSubject(page)).toHaveText(saved);
  await expect(page.locator('[data-action="save"]')).toBeDisabled();
});

test('a receipt block can be added, moved down and up, removed, then saved without a validation error', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only preview image loading needs cross-engine coverage.');
  await openStudio(page, context);
  await selectEmailTab(page, 'receipt');
  const rows = page.locator('[data-email-section="card"] li[data-email-block]'), before = await blockIds(rows);
  const add = page.locator('select[data-email-add="card"]');
  await add.selectOption('text');
  await expect(rows).toHaveCount(before.length + 1);
  const id = await rows.last().getAttribute('data-email-block');
  // Add appends to the section. A follower lets this same block move down,
  // then up; retaining the follower makes the final Save a real project change.
  await add.selectOption('divider');
  await expect(rows).toHaveCount(before.length + 2);
  const follower = await rows.last().getAttribute('data-email-block');
  expect(id).not.toBe(follower);
  const block = page.locator(`li[data-email-block="${id}"]`);
  await expect.poll(() => blockIds(rows)).toEqual([...before, id, follower]);
  await block.locator('[data-email-move="down"]').click();
  await expect.poll(() => blockIds(rows)).toEqual([...before, follower, id]);
  await block.locator('[data-email-move="up"]').click();
  await expect.poll(() => blockIds(rows)).toEqual([...before, id, follower]);
  await block.locator('[data-email-remove]').click();
  await expect(block).toHaveCount(0);
  await expect.poll(() => blockIds(rows)).toEqual([...before, follower]);
  await saveStudio(page);

  await page.reload();
  await openEmail(page);
  await selectEmailTab(page, 'receipt');
  await expect.poll(() => blockIds(rows)).toEqual([...before, follower]);
  await expect(block).toHaveCount(0);
});

test('Inställningar renders E1 states without exposing secret input values', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only preview image loading needs cross-engine coverage.');
  await openStudio(page, context);
  await selectEmailTab(page, 'settings');
  // cmsRuntime binds none of the mail settings, master key or rate limiter.
  const states = [
    ['RESEND_API_KEY', 'missing', '✕ Saknas'],
    ['CONTACT_TO', 'missing', '✕ Saknas'],
    ['TURNSTILE_SITE_KEY', 'missing', '✕ Saknas'],
    ['TURNSTILE_SECRET_KEY', 'missing', '✕ Saknas'],
    ['master', 'missing', '✕ Saknas. Inget kan sparas.'],
    ['rateLimit', 'missing', '✕ Saknas'],
    ['forwarding', 'info', 'Ställs in i Cloudflare.'],
  ];
  await expect(page.locator('[data-email-setting]')).toHaveCount(states.length);
  for (const [name, state, text] of states) {
    const row = page.locator(`[data-email-setting="${name}"]`), status = row.locator('[data-email-setting-state]');
    await expect(row).toBeVisible();
    await expect(status).toHaveAttribute('data-email-setting-state', state);
    await expect(status).toContainText(text);
  }
  await expect(page.locator('[data-email-banner="closed"]')).toContainText('Formuläret är stängt');
  await expect(page.locator('[data-email-save-settings]')).toBeDisabled();
  await expect(page.locator('[data-email-setting-input]')).toHaveCount(4);
  // No RESEND_API_KEY, TURNSTILE_SECRET_KEY or CONTACT_HASH_SECRET exists in
  // this harness: use the required non-vacuous password-value fallback.
  const passwords = page.locator('input[type="password"]');
  await expect(passwords).toHaveCount(2);
  for (let index = 0; index < await passwords.count(); index++) await expect(passwords.nth(index)).toHaveValue('');
});
