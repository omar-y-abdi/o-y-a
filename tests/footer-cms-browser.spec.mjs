import { test, expect } from '@playwright/test';
import { frame, lockPreview, waitCanvas, waitSaved } from './helpers/cms-browser-qa.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { preAgentFooterProject } from './helpers/pre-agent-footer.mjs';
import { publishSite } from '../src/cms/store.mjs';

let runtime, priorRoundTrip;
// The eight ordered cases share one legacy publication, as the Python original did.
test.describe.configure({ mode: 'serial' });
test.use({ actionTimeout: 30_000, navigationTimeout: 30_000 });
test.setTimeout(180_000);
test.beforeAll(async () => {
  test.setTimeout(120_000);
  runtime = await cmsRuntime({ port: 0 });
  // Store the real legacy publication, before the current API migrates it.
  await publishSite(runtime.db, { project: await preAgentFooterProject(), baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
});
test.afterAll(async () => { await runtime?.close(); });

async function contained(footer) {
  const result = await footer.evaluate(footer => {
    const box = footer.getBoundingClientRect(), padding = parseFloat(getComputedStyle(footer).paddingBottom);
    const controls = [...footer.querySelectorAll('nav a, nav button')].filter(el => el.getBoundingClientRect().width > 0);
    return {
      footer: { width: box.width, height: box.height, bottom: box.bottom },
      overflow: controls.filter(el => { const r = el.getBoundingClientRect(); return r.left < box.left - 1 || r.right > box.right + 1 || r.bottom > box.bottom - padding + 1; }).map(el => el.textContent.trim()),
      horizontal: footer.scrollWidth > footer.clientWidth + 1,
    };
  });
  expect(result.overflow, JSON.stringify(result)).toEqual([]); expect(result.horizontal, JSON.stringify(result)).toBe(false);
}

async function props(page) {
  const toggle = page.getByRole('button', { name: 'Egenskaper', exact: true });
  if (!await page.locator('#element-text').isVisible() && await toggle.isVisible()) await toggle.click();
}

async function closeProps(page) {
  if (await page.locator('body.show-properties').count()) await page.getByRole('button', { name: 'Egenskaper', exact: true }).click();
}

async function save(page) {
  const pending = page.waitForResponse(response => response.url() === runtime.url + '/admin/api/save' && response.request().method() === 'POST');
  await page.locator('[data-action=save]').click();
  const response = await pending;
  if (response.status() !== 200) {
    const groups = response.request().postDataJSON()?.changes ?? {};
    console.log('SAVE_DELTA_DIAG', JSON.stringify({ fields: Object.keys(groups), upserts: (groups.pages?.upsert ?? []).map(page => ({ id: page.id, keys: Object.keys(page).sort(), footerVersion: page.footerVersion })) }));
  }
  expect(response.status(), (await response.text()).slice(0, 1200)).toBe(200);
  await waitSaved(page);
}

async function publicFooter(browser, width, javascript, testInfo) {
  const context = await browser.newContext({ viewport: { width, height: 680 }, javaScriptEnabled: javascript, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(runtime.url + '/', { waitUntil: 'networkidle' });
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/developers/"]')).toHaveCount(1); await contained(footer);
    if (javascript) {
      const privacy = footer.locator('[data-privacy-open]'); await privacy.scrollIntoViewIfNeeded(); await expect(privacy).toBeVisible(); await privacy.click();
      await expect(page.locator('[data-privacy-dialog]')).toBeVisible(); await page.locator('[data-dialog-close]').click();
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.screenshot({ path: testInfo.outputPath(`public-${width}-js-${javascript}.png`) });
  } finally { await context.close(); }
}

for (const width of [320, 390, 393, 760, 1440]) {
  test(`legacy-fixed-footer-contained-${width}`, async ({ browser }, testInfo) => {
    await publicFooter(browser, width, true, testInfo);
  });
}

test('legacy-fixed-footer-no-javascript', async ({ browser }, testInfo) => {
  await publicFooter(browser, 390, false, testInfo);
});

for (const width of [390, 1440]) {
  test(`cms-edit-save-preview-reload-${width}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    try {
      await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url, httpOnly: true, secure: false, sameSite: 'Lax' }]);
      const page = await context.newPage(); page.on('dialog', dialog => dialog.accept());
      await page.goto(runtime.url + '/admin/');
      await page.locator('iframe.gjs-frame, [data-shared-content-repair]').first().waitFor({ state: 'visible', timeout: 30_000 });
      const repair = page.locator('[data-shared-content-repair]');
      if (await repair.count()) await repair.locator('button[type="submit"]').click();
      await waitCanvas(page);
      const device = `[data-device=${width <= 760 ? 'mobile' : 'desktop'}]`;
      await page.locator(device).click();
      let canvas = await frame(page);
      if (priorRoundTrip) {
        const response = await context.request.get(runtime.url + '/admin/api/state');
        expect(response.status(), await response.text()).toBe(200);
        expect((await response.json()).version, 'The next viewport must inherit the preceding publication').toBe(priorRoundTrip.version);
        await expect(canvas.locator('footer a[href="/developers/#main"]')).toHaveText(priorRoundTrip.label);
        await expect(canvas.locator('footer a[href="/tillganglighet/"]')).toHaveText(priorRoundTrip.accessibilityLabel);
      }
      const link = canvas.locator('footer a[href="/developers/"], footer a[href="/developers/#main"]').first();
      await expect(link).toHaveCount(1); await contained(canvas.locator('footer'));
      await link.click(); await props(page);
      if (!await page.locator('#element-text').isVisible()) {
        console.log('CMS_SELECTION_DIAG', JSON.stringify({ viewport: width, pageUrl: page.url(), linkHref: await link.getAttribute('href'), frameDocument: await link.evaluate(element => element.ownerDocument.location.href), bodyClasses: await page.locator('body').getAttribute('class'), textFields: await page.locator('#element-text').count(), hrefFields: await page.locator('#element-href').count(), editButtons: await page.locator('[data-action=edit]').count(), selected: await canvas.locator('[data-cms-selected]').count() }));
      }
      const label = `Utvecklardokumentation ${width}`;
      await expect(page.locator('#element-text')).toBeVisible(); await page.locator('#element-text').fill(label);
      await page.locator('#element-href').fill('/developers/#main'); await page.locator('#element-href').press('Tab');
      await closeProps(page); await save(page);
      await page.reload(); await waitCanvas(page); await page.locator(device).click(); canvas = await frame(page);
      await expect(canvas.locator('footer a[href="/developers/#main"]')).toHaveText(label);

      await canvas.locator('footer a[href="/tillganglighet/"]').click(); await props(page);
      const accessibilityLabel = `Tillgänglighet och stöd ${width}`;
      expect(await page.locator('#element-text').inputValue(), 'Each viewport must perform a new edit on the shared Worker').not.toBe(accessibilityLabel);
      await page.locator('#element-text').fill(accessibilityLabel); await closeProps(page);
      await expect(page.locator('[data-action=save]')).toBeEnabled(); await save(page);
      await expect((await frame(page)).locator('footer a[href="/tillganglighet/"]')).toHaveText(accessibilityLabel);

      canvas = await frame(page); await canvas.locator('footer').click({ position: { x: 5, y: 5 } });
      if (!await page.locator('.advanced-style').isVisible()) await page.getByRole('button', { name: 'Egenskaper', exact: true }).click();
      await page.locator('.advanced-style > summary').click(); await page.locator('#extra-property').fill('height');
      await page.locator('#extra-value').fill(`${width === 390 ? 260 : 270}px`); await page.locator('#apply-property').click();
      await closeProps(page); await save(page); await contained((await frame(page)).locator('footer'));
      await lockPreview(page);
      const preview = page.frameLocator('#preview-stage iframe').first();
      await expect(preview.locator('footer a[href="/developers/#main"]')).toHaveText(label); await contained(preview.locator('footer'));
      await page.screenshot({ path: testInfo.outputPath(`cms-preview-${width}.png`) });

      const publicPage = await context.newPage();
      for (const viewport of [320, 390, 393, 760, 1440]) {
        await publicPage.setViewportSize({ width: viewport, height: 680 }); await publicPage.goto(runtime.url + '/', { waitUntil: 'networkidle' });
        await expect(publicPage.locator('footer a[href="/developers/#main"]')).toHaveText(label);
        await expect(publicPage.locator('footer a[href="/developers/"]')).toHaveCount(0); await contained(publicPage.locator('footer'));
        await publicPage.locator('footer [data-privacy-open]').click(); await expect(publicPage.locator('[data-privacy-dialog]')).toBeVisible(); await publicPage.locator('[data-dialog-close]').click();
      }
      const response = await context.request.get(runtime.url + '/admin/api/state');
      expect(response.status(), await response.text()).toBe(200);
      const state = await response.json();
      expect(state.project.pages.some(page => page.path === '/developers/')).toBe(true);
      expect(state.project.pages[0].description).toBe('Owner description retained across the footer upgrade.');
      priorRoundTrip = { version: state.version, label, accessibilityLabel };
    } finally { await context.close(); }
  });
}
