import { test, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BANK = JSON.parse(await readFile(new URL('../public/data/cards.json', import.meta.url), 'utf8'));
const OUTPUT = new URL('../output/card-export-playwright/', import.meta.url);
const KEEP = new Set(['k01', 'j01', 'p01', 'r01', ...BANK.toSorted((a,b)=>b.text.length-a.text.length).slice(0,4).map(card=>card.id)]);

function pngDimensions(buffer) {
  expect(buffer.subarray(0, 8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
  expect(buffer.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function shadowState(page) {
  return page.locator('[data-win-artwork]').evaluate(host => {
    const root = host.shadowRoot;
    const text = root?.querySelector('[data-card-text]');
    const content = text?.closest('.win-design');
    if (!text || !content) return null;
    const box = el => {
      const r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    const range = document.createRange(); range.selectNodeContents(text);
    return {
      text: text.textContent,
      host: box(host), textBox: box(text), contentBox: box(content),
      lineCount: range.getClientRects().length,
      overflow: content.scrollWidth > content.clientWidth + 1 || content.scrollHeight > content.clientHeight + 1 || text.scrollWidth > text.clientWidth + 1 || text.scrollHeight > text.clientHeight + 1,
    };
  });
}

async function waitForCard(page, expectedText) {
  await expect.poll(async () => (await shadowState(page))?.text, { timeout: 8_000 }).toBe(expectedText);
  return shadowState(page);
}

async function waitForDownload(page, save) {
  const download = page.waitForEvent('download').then(value => ({ download: value }));
  const failed = page.locator('[data-toast]').filter({ hasText: 'Bilden kunde inte sparas' })
    .waitFor({ state: 'visible' })
    .then(() => ({ error: page.locator('[data-toast]').innerText() }));
  await save.click();
  const outcome = await Promise.race([download, failed]);
  if (outcome.error) throw new Error(`Card export failed in the app: ${await outcome.error}`);
  return outcome.download;
}

function assertLayout(state) {
  if (!(state.host.width > 0 && state.host.height > 0 && state.contentBox.width > 0 && state.contentBox.height > 0)) return;
  expect(state.overflow).toBe(false);
  expect(state.textBox.left).toBeGreaterThanOrEqual(state.host.left - 1);
  expect(state.textBox.top).toBeGreaterThanOrEqual(state.host.top - 1);
  expect(state.textBox.right).toBeLessThanOrEqual(state.host.right + 1);
  expect(state.textBox.bottom).toBeLessThanOrEqual(state.host.bottom + 1);
  expect(state.contentBox.left).toBeGreaterThanOrEqual(state.host.left - 1);
  expect(state.contentBox.top).toBeGreaterThanOrEqual(state.host.top - 1);
  expect(state.contentBox.right).toBeLessThanOrEqual(state.host.right + 1);
  expect(state.contentBox.bottom).toBeLessThanOrEqual(state.host.bottom + 1);
  expect(state.lineCount).toBeGreaterThan(0);
}

test.beforeAll(async () => { await mkdir(OUTPUT, { recursive: true }); });

test.describe('all 240 production card exports', () => {
  test.describe.configure({ retries: 1 });
  for (const card of BANK) {
    test(`${card.id} exports valid PNG`, async ({ page }, testInfo) => {
      const browserErrors = [];
      page.on('pageerror', error => browserErrors.push(String(error)));
      page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
      const response = await page.goto(`/verkstad/?kort=${encodeURIComponent(card.id)}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      const state = await waitForCard(page, card.text);
      assertLayout(state);
      const save = page.locator('[data-save]');
      await expect(save).toBeEnabled();
      const download = await waitForDownload(page, save);
      const path = await download.path();
      expect(path).toBeTruthy();
      const bytes = await readFile(path);
      const dimensions = pngDimensions(bytes);
      expect(dimensions.width).toBeGreaterThanOrEqual(100);
      expect(dimensions.height).toBeGreaterThanOrEqual(100);
      if (KEEP.has(card.id)) await page.screenshot({ path: join(testInfo.outputDir, `${card.id}.png`), fullPage: true, animations: 'disabled' });
      expect(browserErrors).toEqual([]);
    });
  }
});
