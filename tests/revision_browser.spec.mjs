import { test as base, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { CheckFailure, waitScrollSettled, waitAtTop, fikaCommentCandidates } from './helpers/revision-scroll.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { normalizeStoredProject } from '../src/cms/frame-converter.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { fikaResult } from '../src/client/playlogic.mjs';

let runtime;
const test = base.extend({
  session: async ({ browser }, use) => {
    const contexts = [];
    try {
      await use(async ({ width = 390, height = width < 600 ? 844 : 1000, motion = 'reduce', javascript = true, contactFixture } = {}) => {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: motion, deviceScaleFactor: 1, javaScriptEnabled: javascript, acceptDownloads: true });
        contexts.push(context);
        const page = await context.newPage(), errors = [], requests = [];
        page.on('console', message => { if (message.type() === 'error') errors.push(`console:error:${message.text().replace(/\s+/g, ' ').trim().slice(0, 900)}`); });
        page.on('pageerror', error => errors.push(`pageerror:${String(error).replace(/\s+/g, ' ').trim().slice(0, 900)}`));
        page.on('request', request => requests.push(request.url()));
        if (contactFixture) await installContactFixtures(page, contactFixture);
        return { page, errors, requests };
      });
    } finally { for (const context of contexts) await context.close(); }
  },
});

test.describe.configure({ mode: 'default', timeout: 120_000 });
test.beforeAll(async () => {
  runtime = await cmsRuntime({ port: 0 });
  const stored = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  const project = validateProject(normalizeStoredProject(stored, seed, initial), seed);
  await publishSite(runtime.db, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
});
test.afterAll(async () => { await runtime?.close(); });

async function goto(page, path, { status = 200, javascript = true } = {}) {
  const response = await page.goto(runtime.url + path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response?.status(), path).toBe(status);
  if (javascript) await expect(page.locator('html.js-ready')).toHaveCount(1, { timeout: 12_000 });
  return response;
}

async function assertShell(page, label) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement, body = document.body;
    const controls = [...document.querySelectorAll('button, a, input, textarea, select')].filter(node => {
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length;
    });
    const unlabeled = controls.filter(node => {
      if (node.matches('input,textarea,select')) return !node.getAttribute('aria-label') && !node.closest('label') && !document.querySelector(`label[for="${node.id}"]`);
      return !node.getAttribute('aria-label') && !node.textContent.trim() && !node.getAttribute('title');
    }).map(node => node.outerHTML.slice(0, 160));
    return { viewportWidth: innerWidth, documentWidth: Math.max(root.scrollWidth, body.scrollWidth), imagesWithoutAlt: [...document.images].filter(image => !image.getAttribute('alt')).length, unlabeled };
  });
  expect(metrics.documentWidth, `${label}: horisontell overflow`).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.imagesWithoutAlt, `${label}: bilder saknar alt`).toBe(0);
  expect(metrics.unlabeled, `${label}: synliga kontroller saknar etikett`).toEqual([]);
}

const assertClean = (errors, label) => expect(errors, `${label}: browserfel`).toEqual([]);
const focused = locator => locator.evaluate(element => document.activeElement === element);
const text = async locator => (await locator.innerText()).trim();

async function screenshot(page, info, name, selector) {
  if (selector) await page.locator(selector).screenshot({ path: info.outputPath(name + '.png'), animations: 'disabled' });
  else {
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await page.screenshot({ path: info.outputPath(name + '.png'), fullPage: false, animations: 'disabled' });
  }
}

async function scrollToFooter(page) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: 'instant' }));
  const current = await waitScrollSettled(page), maximum = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
  expect(current, 'sidans slut nåddes inte').toBeGreaterThan(0);
  expect(current, 'sidans slut nåddes inte').toBeGreaterThanOrEqual(maximum - 2);
  return maximum;
}

async function installContactFixtures(page, fixture) {
  await page.route('**/turnstile/v0/api.js*', route => route.fulfill({ contentType: 'application/javascript', body: `(() => {
    const callbacks = new Map();
    window.turnstile = {
      render(element, config) { const id = 'local-turnstile'; callbacks.set(id, config); element.dataset.localTurnstile = 'true'; queueMicrotask(() => config.callback?.('local-test-token')); return id; },
      reset(id) { callbacks.get(id)?.callback?.('local-test-token'); },
      remove(id) { callbacks.delete(id); },
    };
  })();` }));
  await page.route('**/api/contact/config', route => {
    fixture.configRequests++;
    return route.fulfill({ json: { enabled: true, sitekey: 'local-test-sitekey' } });
  });
  await page.route('**/api/contact', route => {
    fixture.contacts.push(route.request().postDataJSON());
    if (fixture.failFirst && !fixture.failed) {
      fixture.failed = true;
      return route.fulfill({ status: 503, json: { ok: false, message: 'Posten kom inte hela vägen. Dina rader finns kvar. Försök igen.' } });
    }
    return route.fulfill({ json: { ok: true } });
  });
}

async function openContact(page) {
  await page.locator('.envelope').click();
  await expect(page.locator('[data-postbox]')).toHaveAttribute('open', '');
  await expect(page.locator('[data-contact-send]')).toBeEnabled({ timeout: 8000 });
}

const PUBLIC_PATHS = ['/', '/verkstad/', '/om/', '/projekt/furl/', '/projekt/blade-blend/', '/projekt/backhaul/', '/kontakt/', '/integritet/', '/kakor/', '/villkor/', '/tillganglighet/', '/404.html'];
for (const path of PUBLIC_PATHS) {
  test(`Real HTTP page smoke ${path}`, async ({ session }, info) => {
    const { page, errors } = await session();
    const response = await goto(page, path, { status: path === '/404.html' ? 404 : 200 });
    expect(response.headers()['x-cms-version'], 'sidan ska renderas från publicerad D1-data').toBe('1');
    expect(await page.locator('h1').count(), path).toBe(1);
    expect(await text(page.locator('main')), path).not.toBe('');
    expect(await page.locator('html').getAttribute('lang'), path).toBe('sv');
    await assertShell(page, `${path}@390`);
    assertClean(errors.filter(error => !(path === '/404.html' && error.includes('404 (Not Found)'))), path);
    if (['/', '/verkstad/', '/kontakt/'].includes(path)) await screenshot(page, info, `page-${path.replace(/^\/+|\/+$/g, '').replaceAll('/', '-') || 'home'}-390`);
  });
}

for (const width of [320, 390, 768, 1440]) for (const motion of ['reduce', 'no-preference']) {
  test(`Footer back-to-top ${width}px ${motion}`, async ({ session }, info) => {
    const { page, errors } = await session({ width, motion });
    await goto(page, '/');
    await scrollToFooter(page);
    await page.locator('[data-back-top]').click();
    expect(await waitAtTop(page)).toBe(0);
    expect(await focused(page.locator('.site-header .brand')), 'fokus flyttades inte till sidhuvudets varumärke').toBe(true);
    if (width === 320) expect(await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth })), 'Q9: migrated Home has no horizontal scroll').toEqual({ viewport: 320, document: 320, body: 320 });
    await assertShell(page, `top ${width}/${motion}`);
    assertClean(errors, `top ${width}/${motion}`);
    if ([390, 1440].includes(width) && motion === 'reduce') await screenshot(page, info, `top-${width}`);
  });
}

test('Native back-to-top works without application JavaScript', async ({ session }) => {
  const { page } = await session({ javascript: false });
  await goto(page, '/', { javascript: false });
  expect(await page.locator('noscript').count(), 'no-JS fallback saknas').toBeGreaterThan(0);
  await scrollToFooter(page);
  await page.locator('[data-back-top]').click();
  expect(await waitAtTop(page)).toBe(0);
});

for (const width of [390, 1440]) {
  test(`Identity/projects/lazy card bank ${width}px`, async ({ session }, info) => {
    const { page, errors, requests } = await session({ width });
    await goto(page, '/');
    expect(await page.locator('.id-monogram').count()).toBe(0);
    await expect(page.locator('.human-card .curiosity-drawing')).toBeVisible({ timeout: 12_000 });
    expect(await page.locator('.project-grid article').count()).toBe(4);
    expect(await page.locator('a[href="/projekt/blade-blend/"]').count()).toBeGreaterThanOrEqual(2);
    expect(await page.locator('a[href="/projekt/backhaul/"]').count()).toBeGreaterThanOrEqual(2);
    expect(requests.filter(url => new URL(url).pathname === '/data/cards.json')).toEqual([]);
    await assertShell(page, `identity ${width}`);
    assertClean(errors, `identity ${width}`);
    await screenshot(page, info, `identity-${width}`, '.about-teaser');
    await screenshot(page, info, `projects-${width}`, '#byggen');
  });

  test(`Machine receipt/eye tracking/pause ${width}px`, async ({ session }, info) => {
    const { page, errors, requests } = await session({ width, motion: 'no-preference' });
    await goto(page, '/verkstad/');
    const stage = page.locator('[data-machine]'), button = page.locator('[data-print]'), receipt = page.locator('[data-receipt]');
    await stage.scrollIntoViewIfNeeded();
    expect(await page.locator('[data-face], .printer-top').count()).toBe(0);
    expect(await page.locator('.joy-ball').evaluate(element => element.tagName)).toBe('DIV');
    expect(await page.locator('.machine-display').getAttribute('aria-hidden')).toBe('true');
    const bounds = await stage.boundingBox();
    expect(bounds, 'maskinens bounding box saknas').toBeTruthy();
    await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height * 0.3);
    const transform = () => page.locator('.eye i').first().evaluate(element => element.style.transform);
    await expect.poll(transform, { timeout: 12_000 }).not.toBe('');
    expect(await transform()).toMatch(/^translate\(/);
    await page.mouse.move(0, 0);
    await expect.poll(transform, { timeout: 12_000 }).toBe('');
    const face = await page.locator('.joy-ball').boundingBox();
    expect(face, 'vinstmaskinens ansikte saknar bounding box').toBeTruthy();
    await page.mouse.click(face.x + face.width / 2, face.y + face.height / 2);
    expect(await stage.getAttribute('data-mood')).toBeNull();
    await page.locator('input[name="flavor"][value="joke"]').check();
    await button.click();
    await expect(button).toBeDisabled({ timeout: 12_000 });
    expect(await receipt.isVisible(), 'kvitto visas innan printfasen är klar').toBe(false);
    await expect(receipt).toBeVisible({ timeout: 8000 });
    const animation = await receipt.evaluate(element => ({ name: getComputedStyle(element).animationName, duration: getComputedStyle(element).animationDuration }));
    expect(animation).toEqual({ name: 'receipt-in', duration: '0.55s' });
    await screenshot(page, info, `printer-enter-${width}`);
    await expect(button).toBeEnabled({ timeout: 8000 });
    const first = await text(page.locator('[data-card-message]'));
    expect(first).not.toBe('');
    const rect = await receipt.boundingBox();
    expect(rect, 'kvitto saknar bounding box').toBeTruthy();
    expect(rect.x).toBeGreaterThanOrEqual(-1);
    expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
    expect(requests.filter(url => new URL(url).pathname === '/data/cards.json')).toHaveLength(1);
    await page.locator('[data-receipt-close]').click();
    expect(await focused(button), 'kvitto-close återförde inte fokus till printknappen').toBe(true);
    await button.click();
    await expect(receipt).toBeHidden({ timeout: 12_000 });
    await page.locator('[data-motion-toggle]').click();
    await expect.poll(async () => await button.isEnabled() && await receipt.isVisible()).toBe(true);
    const second = await text(page.locator('[data-card-message]'));
    expect(second).not.toBe('');
    expect(second).not.toBe(first);
    expect(await stage.getAttribute('data-print-phase')).toBeNull();
    expect(await stage.getAttribute('data-mood')).toBeNull();
    await screenshot(page, info, `printer-finished-${width}`);
    await assertShell(page, `machine ${width}`);
    assertClean(errors, `machine ${width}`);
  });

  test(`Contact required fields/local request fixture ${width}px`, async ({ session }, info) => {
    const fixture = { configRequests: 0, contacts: [], failFirst: false, failed: false };
    const { page, errors } = await session({ width, contactFixture: fixture });
    await goto(page, '/kontakt/');
    expect(fixture.configRequests).toBe(0);
    await screenshot(page, info, `contact-closed-${width}`);
    await openContact(page);
    await screenshot(page, info, `contact-open-${width}`);
    expect(await page.content()).not.toContain('@chalmers.se');
    expect(await text(page.locator('main'))).not.toContain('När du öppnar kuvertet laddas');
    await page.locator('[data-contact-send]').click();
    await expect(page.locator('#contact-name')).toBeFocused({ timeout: 12_000 });
    await page.locator('#contact-name').fill('Mira Test');
    await page.locator('#contact-email').fill('mira@example.org');
    await page.locator('[data-contact-send]').click();
    await expect(page.locator('[data-contact-success]')).toBeVisible({ timeout: 8000 });
    expect(fixture.contacts).toHaveLength(1);
    expect(fixture.contacts[0].message).toBe('');
    expect(fixture.contacts[0].website).toBe('');
    await screenshot(page, info, `contact-success-${width}`);
    await assertShell(page, `contact ${width}`);
    assertClean(errors, `contact ${width}`);
  });
}

test('Contact error retains input and retry reuses submission ID', async ({ session }, info) => {
  const fixture = { configRequests: 0, contacts: [], failFirst: true, failed: false };
  const { page, errors } = await session({ contactFixture: fixture });
  await goto(page, '/kontakt/');
  await openContact(page);
  await page.locator('#contact-name').fill('Mira Test');
  await page.locator('#contact-email').fill('mira@example.org');
  await page.locator('#contact-message').fill('En fråga som ska finnas kvar.');
  await page.locator('[data-contact-send]').click();
  await expect(page.locator('[data-contact-status]')).toContainText('Dina rader finns kvar', { timeout: 8000 });
  expect(await page.locator('#contact-message').inputValue()).toBe('En fråga som ska finnas kvar.');
  expect(fixture.contacts.length, 'första lokala kontaktposten saknas').toBeGreaterThan(0);
  const firstSubmission = fixture.contacts[0].submission;
  await expect(page.locator('[data-contact-send]')).toBeEnabled({ timeout: 8000 });
  await page.locator('[data-contact-send]').click();
  await expect(page.locator('[data-contact-success]')).toBeVisible({ timeout: 8000 });
  expect(fixture.contacts).toHaveLength(2);
  expect(fixture.contacts[1].submission).toBe(firstSubmission);
  await screenshot(page, info, 'contact-error-retry-390');
  assertClean(errors.filter(error => !error.includes('503 (Service Unavailable)')), 'contact retry');
});

test('Bubbles click/keyboard/reset and unavailable audio fallback', async ({ session }, info) => {
  const { page, errors } = await session({ width: 1440, motion: 'no-preference' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
  });
  await goto(page, '/verkstad/');
  const buttons = page.locator('[data-bubble]');
  expect(await buttons.count()).toBe(12);
  await buttons.first().scrollIntoViewIfNeeded();
  await buttons.nth(0).click();
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true', { timeout: 12_000 });
  await expect.poll(() => page.locator('.pop-drop').count(), { timeout: 2000 }).toBeGreaterThan(0);
  await screenshot(page, info, 'bubble-burst-1440');
  await page.locator('[data-bubble-reset]').click();
  for (let index = 0; index < 12; index++) { await buttons.nth(index).focus(); await page.keyboard.press('Space'); }
  await expect(page.locator('[data-bubble-status]')).toContainText('Alla poppade', { timeout: 12_000 });
  expect(await page.locator('[data-bubble].is-popped').count()).toBe(12);
  await page.locator('[data-bubble-reset]').click();
  for (let index = 0; index < 12; index++) expect(await buttons.nth(index).getAttribute('aria-pressed')).toBe('false');
  await page.locator('[data-sound-toggle]').click();
  await expect(page.locator('[data-sound-toggle]')).toHaveAttribute('aria-pressed', 'false', { timeout: 12_000 });
  assertClean(errors, 'bubbles');
});

test('SSR 12 memory cards hydrate, reset, pair and preserve style', async ({ session }, info) => {
  const { page, errors } = await session();
  await page.addInitScript(() => {
    const mark = () => {
      const first = document.querySelector('[data-memory-card]');
      if (!first || first.dataset.qaStyle) return;
      first.dataset.qaStyle = 'keep';
      first.style.setProperty('--qa-memory-style', 'rgb(35, 76, 231)');
    };
    new MutationObserver(mark).observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', mark, { once: true });
    mark();
  });
  const response = await page.goto(runtime.url + '/verkstad/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response?.status()).toBe(200);
  expect((await response.text()).split('data-memory-card').length - 1, 'SSR-memory').toBe(12);
  const styled = page.locator('[data-memory-card][data-qa-style="keep"]');
  await expect(styled).toHaveCount(1, { timeout: 12_000 });
  const styleBefore = await styled.getAttribute('style') || '', qaBefore = await styled.getAttribute('data-qa-style');
  await expect(page.locator('html.js-ready')).toHaveCount(1, { timeout: 12_000 });
  let buttons = page.locator('[data-memory-card]');
  if (await buttons.count() === 0) buttons = page.locator('.memory-card');
  expect(await buttons.count()).toBe(12);
  for (let index = 0; index < 12; index++) expect(await buttons.nth(index).isDisabled()).toBe(false);
  const first = buttons.nth(0);
  const classes = () => buttons.evaluateAll(elements => elements.map(element => [...element.querySelector('.memory-front').classList].find(name => /^memory-color-\d+$/.test(name))));
  let values = await classes();
  const other = values.findIndex(value => value !== values[0]);
  expect(other, 'memory har inga två olika parvärden').toBeGreaterThanOrEqual(0);
  await first.click();
  await buttons.nth(other).click();
  await expect(page.locator('[data-memory-status]')).toHaveText(/^Inte ett par/, { timeout: 12_000 });
  await page.locator('[data-memory-reset]').click();
  await expect(page.locator('.memory-card.is-open')).toHaveCount(0, { timeout: 3000 });
  expect(await first.getAttribute('style')).toBe(styleBefore);
  expect(await first.getAttribute('data-qa-style')).toBe(qaBefore);
  values = await classes();
  for (const value of new Set(values)) {
    const pair = values.flatMap((item, index) => item === value ? [index] : []);
    expect(pair).toHaveLength(2);
    for (const index of pair) { await buttons.nth(index).focus(); await page.keyboard.press('Enter'); }
  }
  await expect(page.locator('.memory-card.is-matched')).toHaveCount(12, { timeout: 8000 });
  const status = await text(page.locator('[data-memory-status]'));
  expect(status).toContain('Alla hittade hem på');
  expect(status).toContain('6 försök');
  expect(await first.getAttribute('style')).toBe(styleBefore);
  await screenshot(page, info, 'memory-complete-390', '.memory-section');
  await assertShell(page, 'memory');
  assertClean(errors, 'memory');
});

test('Fika measures elapsed time and aborts on hidden document', async ({ session }, info) => {
  const { page, errors } = await session({ width: 1440 });
  await goto(page, '/verkstad/');
  await expect(page.locator('[data-memory-card][data-index]')).toHaveCount(12, { timeout: 12_000 });
  const button = page.locator('[data-fika-button]');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).not.toContainText('Starta', { timeout: 12_000 });
  await page.waitForTimeout(5000);
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-fika-result]')).toHaveText(/^\d+,\d{2} s$/, { timeout: 3000 });
  await expect(button).toContainText('En fika till', { timeout: 3000 });
  const value = Number((await text(page.locator('[data-fika-result]'))).replace(',', '.').replace(' s', ''));
  expect(value).toBeGreaterThanOrEqual(4.7);
  expect(value).toBeLessThanOrEqual(5.8);
  const note = await text(page.locator('[data-fika-status]'));
  expect([...fikaCommentCandidates(value)].some(fragment => note.includes(fragment)), `fikaresultat ${value} s gav fel kommentar ${note}`).toBe(true);
  await screenshot(page, info, 'fika-result-1440', '.fika-section');
  await button.click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await text(page.locator('[data-fika-status]'))).toContain('fliken');
  assertClean(errors, 'fika');
});

// The Python helper regressions use a virtual monotonic clock and measured offsets.
function scrollTrace(offsets) {
  const values = offsets[Symbol.iterator]();
  let current, reads = 0, now = 0;
  return {
    page: { evaluate: async expression => { expect(expression).toBe('scrollY'); const next = values.next(); if (!next.done) current = next.value; reads++; return current; } },
    timer: { now: () => now, sleep: async ms => { now += ms; } },
    reads: () => reads,
  };
}

test('test_one_pixel_steps_are_not_settled', async () => {
  const trace = scrollTrace([4, 3, 2, 1, 0, 0, 0, 0]);
  expect(await waitScrollSettled(trace.page, { timer: trace.timer })).toBe(0);
  expect(trace.reads()).toBe(8);
});
test('test_fractional_position_is_not_truncated_to_zero', async () => {
  const trace = scrollTrace([0.75, 0.75, 0.75, 0.75]);
  expect(await waitScrollSettled(trace.page, { timer: trace.timer })).toBe(0.75);
});
test('test_continuous_one_pixel_motion_times_out', async () => {
  const trace = scrollTrace(Array.from({ length: 100 }, (_, index) => index));
  await expect(waitScrollSettled(trace.page, { timeout: 500, timer: trace.timer })).rejects.toThrow(CheckFailure);
});
for (const [name, offsets] of [
  ['test_top_rejects_a_permanent_one_pixel_offset', [1]],
  ['test_top_rejects_a_fractional_offset', [0.75]],
  ['test_top_rejects_rebound_after_touching_zero', [0, 1]],
]) test(name, async () => {
  const trace = scrollTrace(offsets);
  await expect(waitAtTop(trace.page, { timeout: 500, timer: trace.timer })).rejects.toThrow(CheckFailure);
});
test('test_top_accepts_only_stable_exact_zero', async () => {
  const trace = scrollTrace([3, 2, 1, 0, 0, 0, 0, 0]);
  expect(await waitAtTop(trace.page, { timer: trace.timer })).toBe(0);
});
test('test_measured_five_seconds_requires_target_comment', () => {
  expect(fikaCommentCandidates(5.00)).toEqual(new Set(['äggklocka']));
});
test('test_slightly_late_real_time_accepts_correct_near_comment', () => {
  expect(fikaCommentCandidates(5.30)).toEqual(new Set(['Lagom bryggt']));
  expect(fikaResult(5300).comment).toContain('Lagom bryggt');
});
test('test_late_time_requires_pour_another_comment', () => {
  expect(fikaCommentCandidates(5.70)).toEqual(new Set(['påtår']));
});
test('test_rounding_boundaries_allow_adjacent_valid_categories_only', () => {
  expect(fikaCommentCandidates(5.15)).toEqual(new Set(['äggklocka', 'Lagom bryggt']));
  expect(fikaCommentCandidates(5.60)).toEqual(new Set(['Lagom bryggt', 'påtår']));
});
