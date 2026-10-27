import { test, expect } from '@playwright/test';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial } from '../.generated/cms-seed.mjs';

// The existing public matrix covers the owner's v185 content. These separate
// cases cover the shipped static/default project in the exact CI browser too.
test.describe.configure({ mode: 'default' });
let staticRuntime, publishedRuntime;
test.beforeAll(async () => {
  staticRuntime = await cmsRuntime();
  publishedRuntime = await cmsRuntime({ project: initial });
});
test.afterAll(async () => { await staticRuntime?.close(); await publishedRuntime?.close(); });

for (const source of ['static', 'published']) for (const width of [320, 390]) {
  test(`O1/O2: ${source} workshop keeps content and Save pointer inside ${width}px`, async ({ page }, testInfo) => {
    const runtime = source === 'static' ? staticRuntime : publishedRuntime;
    await page.setViewportSize({ width, height: 844 });
    await page.goto(runtime.url + '/verkstad/?kort=k01', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator('[data-win-artwork]').evaluate(element => element.shadowRoot?.querySelector('[data-card-text]')?.textContent)).toBeTruthy();
    const overflow = await page.evaluate(() => ({ viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth,
      outside: [...document.querySelectorAll('main *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(element).visibility !== 'hidden').slice(0, 12).map(element => ({ tag: element.tagName, id: element.id, class: element.className?.baseVal ?? element.className, right: element.getBoundingClientRect().right, font: getComputedStyle(element).font, text: element.textContent.slice(0, 80) })),
    }));
    const save = page.locator('[data-save]');
    await expect(save).toBeEnabled();
    await save.scrollIntoViewIfNeeded();
    const hit = await save.evaluate(element => {
      const bounds = element.getBoundingClientRect(), target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      return { reachable: element.contains(target), target: target?.outerHTML.slice(0, 500), bounds: bounds.toJSON() };
    });
    await testInfo.attach('workshop-layout-and-pointer', { body: JSON.stringify({ source, width, browser: page.context().browser().version(), overflow, hit }, null, 2), contentType: 'application/json' });
    expect(Math.max(overflow.html, overflow.body), JSON.stringify(overflow)).toBeLessThanOrEqual(width + 1);
    expect(hit.reachable, JSON.stringify(hit)).toBe(true);
    const download = page.waitForEvent('download');
    await save.click();
    expect(await (await download).failure()).toBeNull();
  });
}
