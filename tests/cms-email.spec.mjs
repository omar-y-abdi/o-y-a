import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';

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
  const forwarding = page.locator('[data-email-setting="forwarding"] a');
  await expect(forwarding).toHaveCount(1);
  await expect(forwarding).toHaveAttribute('href', 'https://dash.cloudflare.com/');
  await expect(forwarding).toHaveText('Öppna Cloudflare');
  await expect(page.locator('[data-email-banner="closed"]')).toContainText('Formuläret är stängt');
  await expect(page.locator('[data-email-save-settings]')).toBeDisabled();
  await expect(page.locator('[data-email-setting-input]')).toHaveCount(4);
  // No RESEND_API_KEY, TURNSTILE_SECRET_KEY or CONTACT_HASH_SECRET exists in
  // this harness: use the required non-vacuous password-value fallback.
  const passwords = page.locator('input[type="password"]');
  await expect(passwords).toHaveCount(2);
  for (let index = 0; index < await passwords.count(); index++) await expect(passwords.nth(index)).toHaveValue('');
});

async function fillCompose(page) {
  await selectEmailTab(page, 'compose');
  await page.locator('[data-email-chip-input="to"]').fill('ada@example.org');
  await page.locator('[data-email-chip-input="to"]').press('Enter');
  await page.locator('[data-email-path="subject"]').fill('Samma utskick');
}
async function confirmSend(page) {
  await page.locator('[data-email-send]').click();
  await page.locator('[data-confirm="yes"]').click();
}

async function expectFrozenCompose(page) {
  const fields = page.locator('fieldset[data-email-compose-fields]');
  // Playwright's disabled-control matcher excludes fieldsets themselves.
  await expect(fields).toHaveJSProperty('disabled', true);
  const controls = fields.locator('input, textarea, select, button');
  expect(await controls.count()).toBeGreaterThan(10);
  for (let index = 0; index < await controls.count(); index++) await expect(controls.nth(index)).toBeDisabled();
}

test('uncertain compose freezes all fields and retries identical body despite other draft edits', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Compose behavior needs Chromium only.');
  const calls = [];
  await page.route('**/admin/api/mail/send', async route => {
    calls.push(route.request().postData());
    await route.fulfill({ status: calls.length === 1 ? 503 : 200, json: calls.length === 1 ? { error: 'Svaret är osäkert.' } : { id: 'retry-ok', scheduledAt: null } });
  });
  await openStudio(page, context);
  await fillCompose(page);
  await expect(page.locator('[data-email-panel="compose"]')).toContainText('Bilder från Resurser skickas som de är publicerade');
  await expect(page.locator('[data-email-attachment-total]')).toContainText('inom 23 timmar');
  await confirmSend(page);
  const retry = page.getByRole('button', { name: 'Försök igen', exact: true });
  await expect(retry).toBeVisible();
  await expectFrozenCompose(page);
  await expect(page.locator('[data-email-panel="compose"] > .email-actions button:enabled')).toHaveText(['Försök igen', 'Kasta utkastet']);
  // Programmatic input must not bypass the freeze either.
  await page.locator('[data-email-path="subject"]').evaluate(node => { node.value = 'Ändrat efter felet'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  await selectEmailTab(page, 'receipt');
  await page.locator('[data-email-details="design"] > summary').click();
  await page.locator('[data-email-path="sender.name"]').fill('Ändrad avsändare');
  await selectEmailTab(page, 'compose');
  await expect(page.locator('[data-email-path="subject"]')).toHaveValue('Samma utskick');
  await retry.click();
  await expect(page.locator('[data-email-tab="sent"]')).toHaveAttribute('aria-selected', 'true');
  expect(calls).toHaveLength(2);
  expect(calls[1]).toBe(calls[0]);
  const body = JSON.parse(calls[0]);
  expect(Object.keys(body.identity)).toEqual(['sender', 'shell']);
  expect(body).not.toHaveProperty('email');
  expect(body).not.toHaveProperty('resources');
});

test('a frozen compose stays frozen after a 409 refusal until confirmation or discard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Compose behavior needs Chromium only.');
  const calls = [];
  await page.route('**/admin/api/mail/send', async route => {
    calls.push(route.request().postData());
    await route.fulfill(calls.length === 1 ? { status: 503, json: { error: 'Svaret är osäkert.' } } : { status: 409, json: { error: 'Konflikt i Resend.', details: { refused: true } } });
  });
  await openStudio(page, context);
  await fillCompose(page);
  await confirmSend(page);
  await expect(page.locator('[data-email-path="subject"]')).toBeDisabled();
  await page.locator('[data-email-send]').click();
  await expect(page.locator('#studio-toast')).toContainText('Konflikt i Resend.');
  await expectFrozenCompose(page);
  await expect(page.locator('[data-email-panel="compose"] > .email-actions button:enabled')).toHaveText(['Försök igen', 'Kasta utkastet']);
  expect(calls).toHaveLength(2);
  expect(calls[1]).toBe(calls[0]);
  await page.locator('[data-email-discard]').click();
  await page.locator('[data-confirm="no"]').click();
  await expectFrozenCompose(page);
});

test('definitive validation and provider refusals unlock compose; expiry keeps it frozen until discard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Compose behavior needs Chromium only.');
  const replies = [{ status: 422, json: { error: 'Rätta ämnet.', details: { field: 'subject' } } }, { status: 502, json: { error: 'Nyckeln godtas inte.', details: { refused: true } } }, { status: 409, json: { error: 'Kontrollera mejlet i Resend: https://resend.com/emails', details: { uncertain: true } } }];
  await page.route('**/admin/api/mail/send', route => route.fulfill(replies.shift()));
  await openStudio(page, context);
  await fillCompose(page);
  for (let index = 0; index < 2; index++) {
    await confirmSend(page);
    await expect(page.locator('[data-email-path="subject"]')).toBeEnabled();
    await page.locator('[data-email-path="subject"]').fill(`Rättat ämne ${index}`);
  }
  await confirmSend(page);
  await expect(page.locator('[data-email-path="subject"]')).toBeDisabled();
  await expect(page.locator('#studio-toast')).toContainText('https://resend.com/emails');
  await page.getByRole('button', { name: 'Kasta utkastet', exact: true }).click();
  await expect(page.locator('#studio-dialog')).toContainText('kan redan ha skickats');
  await expect(page.locator('#studio-dialog')).toContainText('Skickade eller i Resend');
  await page.locator('[data-confirm="no"]').click();
  await expect(page.locator('[data-email-path="subject"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Kasta utkastet', exact: true }).click();
  await page.locator('[data-confirm="yes"]').click();
  await expect(page.locator('[data-email-path="subject"]')).toBeEnabled();
  await expect(page.locator('[data-email-path="subject"]')).toHaveValue('');
});

test('test mail freezes per template until success or confirmed discard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Retry behavior needs Chromium only.');
  const calls = [];
  await page.route('**/admin/api/mail/test', async route => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ status: calls.length === 3 ? 200 : 503, json: calls.length === 3 ? { id: 'test-ok' } : { error: 'Svaret är osäkert.' } });
  });
  await openStudio(page, context);
  const sendTest = async () => {
    const button = page.locator('[data-email-test]');
    const pending = page.waitForResponse('**/admin/api/mail/test');
    await button.click();
    await pending;
    await expect(button).toBeEnabled();
  };
  await selectEmailTab(page, 'receipt');
  await sendTest();
  await selectEmailTab(page, 'notification');
  await sendTest();
  await selectEmailTab(page, 'receipt');
  await sendTest(); // Successful receipt retry.
  expect(calls[2]).toEqual(calls[0]);
  expect(calls[1].requestId).not.toBe(calls[0].requestId);
  await sendTest(); // New request after success.
  expect(calls[3].requestId).not.toBe(calls[2].requestId);
  await expect(subjectField(page)).toBeDisabled();
  await page.locator('[data-email-test-discard]').click();
  await page.locator('[data-confirm="no"]').click();
  await expect(subjectField(page)).toBeDisabled();
  await page.locator('[data-email-test-discard]').click();
  await page.locator('[data-confirm="yes"]').click();
  await subjectField(page).fill('Ändrad mall');
  await sendTest();
  expect(calls[4].requestId).not.toBe(calls[3].requestId);
  await sendTest();
  expect(calls[5]).toEqual(calls[4]);
});

test('fresh test refusal drops requestId; uncertain retries retain it even on later refusal', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Retry behavior needs Chromium only.');
  const calls = [], replies = [
    { status: 502, json: { error: 'Nyckeln godtas inte.', details: { refused: true } } },
    { status: 409, json: { error: 'Kontrollera Resend.', details: { refused: true, uncertain: true } } },
    { status: 409, json: { error: 'Konflikt i Resend.', details: { refused: true } } },
    { status: 200, json: { id: 'confirmed-test' } },
  ];
  await page.route('**/admin/api/mail/test', async route => {
    calls.push(route.request().postData());
    await route.fulfill(replies.shift());
  });
  await openStudio(page, context);
  await page.locator('[data-email-test]').click();
  await expect(page.locator('#studio-toast')).toContainText('Nyckeln godtas inte.');
  await expect(subjectField(page)).toBeEnabled();
  await page.locator('[data-email-test]').click();
  await expect(subjectField(page)).toBeDisabled();
  await page.locator('[data-email-test]').click();
  await expect(page.locator('#studio-toast')).toContainText('Konflikt i Resend.');
  await expect(subjectField(page)).toBeDisabled();
  await expect(page.locator('[data-email-panel] > .email-actions button:enabled')).toHaveText(['Försök igen', 'Kasta utkastet']);
  await page.locator('[data-email-test]').click();
  await expect(subjectField(page)).toBeEnabled();
  expect(calls).toHaveLength(4);
  expect(JSON.parse(calls[1]).requestId).not.toBe(JSON.parse(calls[0]).requestId);
  expect(calls[2]).toBe(calls[1]);
  expect(calls[3]).toBe(calls[1]);
});

for (const kind of ['compose', 'receipt']) test(`frozen ${kind} restores requestId and exact body after reload`, async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Reload recovery needs Chromium only.');
  const calls = [], path = kind === 'compose' ? 'send' : 'test';
  await page.route(`**/admin/api/mail/${path}`, async route => {
    calls.push(route.request().postData());
    await route.fulfill(calls.length === 1 ? { status: 503, json: { error: 'Svaret är osäkert.' } } : { status: 200, json: { id: 'reload-ok', scheduledAt: null } });
  });
  await openStudio(page, context);
  if (kind === 'compose') { await fillCompose(page); await confirmSend(page); }
  else { await subjectField(page).fill('Osparat före omladdning'); await page.locator('[data-email-test]').click(); }
  const field = kind === 'compose' ? page.locator('[data-email-path="subject"]') : subjectField(page);
  await expect(field).toBeDisabled();
  await expect(page.locator('#studio-toast')).toContainText('Svaret är osäkert.');
  if (kind === 'receipt') {
    // Restore the project before reload; recovery must come from the frozen mail body.
    await expect(page.locator('#backup-status')).toHaveText('Reservutkast sparat för denna flik');
    await page.locator('[data-action="undo"]').click();
    await expect(page.locator('[data-action="save"]')).toBeDisabled();
    await expect(page.locator('#backup-status')).toHaveText('Reservutkast redo');
    await expect(field).toHaveValue('Osparat före omladdning');
  }
  await page.reload();
  await openEmail(page);
  await expect(page.locator(`[data-email-tab="${kind}"]`)).toHaveAttribute('aria-selected', 'true');
  if (kind === 'compose') await expectFrozenCompose(page);
  await expect(field).toBeDisabled();
  await expect(field).toHaveValue(kind === 'compose' ? 'Samma utskick' : 'Osparat före omladdning');
  const retry = page.locator(kind === 'compose' ? '[data-email-send]' : '[data-email-test]');
  await expect(retry).toHaveText('Försök igen');
  expect(calls).toHaveLength(1);
  await retry.click();
  if (kind === 'compose') await expect(page.locator('[data-email-tab="sent"]')).toHaveAttribute('aria-selected', 'true');
  else await expect(field).toBeEnabled();
  expect(calls).toHaveLength(2);
  expect(calls[1]).toBe(calls[0]);
  expect(JSON.parse(calls[1]).requestId).toBe(JSON.parse(calls[0]).requestId);
  await page.reload();
  await openEmail(page);
  await selectEmailTab(page, kind);
  await expect(field).toBeEnabled();
});

test('discard clears only its frozen mail, preserves other frozen bodies and never stores settings', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Storage behavior needs Chromium only.');
  const calls = [];
  for (const path of ['send', 'test']) await page.route(`**/admin/api/mail/${path}`, async route => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ status: 503, json: { error: 'Svaret är osäkert.' } });
  });
  await openStudio(page, context);
  await selectEmailTab(page, 'settings');
  await page.locator('[data-email-setting-input="RESEND_API_KEY"]').fill('re_never_store_this_key');
  await page.locator('[data-email-setting-input="CONTACT_TO"]').fill('never-store@example.org');
  await selectEmailTab(page, 'receipt');
  await page.locator('[data-email-test]').click();
  await expect(page.locator('#studio-toast')).toContainText('Svaret är osäkert.');
  await fillCompose(page);
  await confirmSend(page);
  await expect(page.locator('[data-email-send]')).toHaveText('Försök igen');
  await expect(page.locator('[data-email-send]')).toBeEnabled();
  expect(calls).toHaveLength(2);
  const stored = () => page.evaluate(() => sessionStorage.getItem('studio-mail-frozen'));
  const pending = await stored();
  expect(pending).toContain(calls[0].requestId);
  expect(pending).toContain(calls[1].requestId);
  expect(pending).not.toContain('re_never_store_this_key');
  expect(pending).not.toContain('never-store@example.org');
  expect(pending).not.toContain('RESEND_API_KEY');
  expect(pending).not.toContain('CONTACT_TO');
  await page.reload();
  await openEmail(page);
  await expectFrozenCompose(page);
  await page.locator('[data-email-discard]').click();
  await page.locator('[data-confirm="yes"]').click();
  expect(await stored()).not.toContain(calls[1].requestId);
  expect(await stored()).toContain(calls[0].requestId);
  await selectEmailTab(page, 'receipt');
  await expect(subjectField(page)).toBeDisabled();
  await page.locator('[data-email-test-discard]').click();
  await page.locator('[data-confirm="yes"]').click();
  expect(await stored()).toBeNull();
  await page.reload();
  await openEmail(page);
  await expect(subjectField(page)).toBeEnabled();
  await selectEmailTab(page, 'compose');
  await expect(page.locator('fieldset[data-email-compose-fields]')).toHaveJSProperty('disabled', false);
  await expect(page.locator('[data-email-path="subject"]')).toBeEnabled();
});

test('blocked sessionStorage surfaces failure while frozen mail remains retryable', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Storage behavior needs Chromium only.');
  const calls = [];
  let pending;
  await openStudio(page, context);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
  await page.route('**/admin/api/mail/send', async route => {
    calls.push(route.request().postData());
    if (calls.length === 1) { pending = route; return; }
    await route.fulfill({ json: { id: 'storage-retry-ok', scheduledAt: null } });
  });
  await fillCompose(page);
  await confirmSend(page);
  await expect(page.locator('#studio-toast')).toContainText('kunde inte sparas i flikens lagring');
  await expectFrozenCompose(page);
  // Release the pending request with an ambiguous failure after seeing the storage error.
  await expect.poll(() => Boolean(pending)).toBe(true);
  await pending.fulfill({ status: 503, json: { error: 'Svaret är osäkert.' } });
  await expect(page.locator('#studio-toast')).toContainText('Svaret är osäkert.');
  await page.locator('[data-email-send]').click();
  await expect(page.locator('[data-email-tab="sent"]')).toHaveAttribute('aria-selected', 'true');
  expect(calls).toHaveLength(2);
  expect(calls[1]).toBe(calls[0]);
});

test('unconfirmed test rows show Resend link without custom compose retry instruction', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Sent-list behavior needs Chromium only.');
  const item = { id: null, confirmed: false, to: ['ada@example.org'], cc: [], bcc: [], createdAt: '2026-10-24T10:00:00.000Z', scheduledAt: null, canceledAt: null, attachments: 0 };
  await page.route('**/admin/api/mail/sent', route => route.fulfill({ json: { items: [{ ...item, kind: 'custom', subject: 'Eget mejl' }, { ...item, kind: 'test', subject: 'Provmejl' }] } }));
  await openStudio(page, context);
  await selectEmailTab(page, 'sent');
  const rows = page.locator('[data-email-sent-table] tbody tr');
  await expect(rows.nth(0)).toContainText('Tryck Försök igen i samma flik');
  await expect(rows.nth(1)).toContainText('Ej bekräftat. Provmejlet kan ha skickats.');
  await expect(rows.nth(1)).not.toContainText('Tryck Skicka');
  await expect(rows.nth(1).locator('a')).toHaveAttribute('href', 'https://resend.com/emails');
});

test('building text refuses more than 10000 characters and accepts exactly 10000', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Text editing needs Chromium only.');
  await page.route('**/admin/api/state', async route => {
    const response = await route.fetch(), state = await response.json(), email = structuredClone(DEFAULT_EMAIL);
    const text = email.templates.receipt.blocks.find(block => block.type === 'text');
    email.templates.receipt.blocks = Array.from({ length: 6 }, (_, index) => ({ ...structuredClone(text), id: `long000${index}`, section: index ? 'card' : 'band', text: '€'.repeat(2000) }));
    state.project.email = email;
    await route.fulfill({ response, json: state });
  });
  await openStudio(page, context);
  await selectEmailTab(page, 'receipt');
  await page.locator('[data-email-details="text"] > summary').click();
  const text = page.locator('[data-email-path="templates.receipt.text"]'), before = await text.inputValue();
  await page.locator('[data-email-text-build]').click();
  await expect(page.locator('#studio-toast')).toContainText('10000 tecken');
  await expect(page.locator('#studio-toast')).toHaveClass(/is-error/);
  await expect(text).toHaveValue(before);
  await page.locator('[data-email-section="card"] [data-email-remove]').last().click();
  await page.locator('[data-email-section="band"] [data-email-select]').click();
  await page.locator('[data-email-path="templates.receipt.blocks[0].text"]').fill('€'.repeat(1946));
  await page.locator('[data-email-text-build]').click();
  const expected = ['€'.repeat(1946), ...Array(4).fill('€'.repeat(2000))].join('\n\n') + '\n\nIntegritet: https://omaryusuf.se/integritet/';
  expect(expected.length).toBe(10000);
  await expect(text).toHaveValue(expected);
});

test('failed mail chunk tells owner to reload and clears stale sidebar selection', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chunk-load recovery needs Chromium only.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  await page.goto(runtime.url + '/admin/');
  await expect(page.locator('#loading-state')).toBeHidden();
  await expect(page.locator('[data-page-id="home"]')).toHaveClass(/is-selected/);
  await page.route(/\/admin\/assets\/.*\.mjs$/, route => route.abort('failed'));
  await page.locator('[data-special="email"]').click();
  await expect(page.locator('#special-stage [role="alert"]')).toContainText('Ladda om sidan och öppna Mejl igen');
  await expect(page.locator('[data-page-id="home"]')).not.toHaveClass(/is-selected/);
  await expect(page.locator('[data-special="email"]')).not.toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#studio-toast')).toContainText('Ladda om sidan och öppna Mejl igen');
});
