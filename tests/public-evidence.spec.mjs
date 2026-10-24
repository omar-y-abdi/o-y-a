import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { initial } from '../.generated/cms-seed.mjs';

// Copy this unchanged into the baseline checkout for comparable evidence.
// It imports no phase-2-specific product modules and uses real published D1 rows.
test('phase-2 public screenshot, property and boot evidence', async ({ browser }) => {
  test.setTimeout(120_000);
  const directory = resolve(process.env.P2B_EVIDENCE_DIR || 'output/p2b-evidence');
  await mkdir(directory, { recursive: true });
  const runtime = await cmsRuntime();
  const boot = [];
  try {
    await publishSite(runtime.db, { project: initial, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
    for (const path of ['/', '/verkstad/', '/om/', '/kontakt/', '/villkor/', '/play/skift/']) {
      for (const [width, height] of [[390, 844], [1440, 1000]]) {
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        try {
          await context.addInitScript(() => {
            const observer = new MutationObserver(() => {
              if (!document.documentElement?.classList.contains('js-ready')) return;
              window.__p2bJsReady = performance.now();
              observer.disconnect();
            });
            observer.observe(document, { attributes: true, childList: true, subtree: true });
          });
          const page = await context.newPage();
          const response = await page.goto(runtime.url + path, { waitUntil: path === '/play/skift/' ? 'load' : 'networkidle' });
          await expect(page.locator('html')).toHaveClass(/js-ready/);
          const timing = await page.evaluate(() => ({ jsReadyMs: window.__p2bJsReady, resources: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, startMs: entry.startTime, durationMs: entry.duration })) }));
          expect(timing.jsReadyMs).toBeGreaterThan(0);
          boot.push({ path, width, ...timing, csp: response.headers()['content-security-policy'] });
          if (path === '/play/skift/') continue;
          if (path === '/' || path === '/verkstad/') await expect(page.locator('[data-print]')).toBeEnabled();
          if (path === '/verkstad/') await expect(page.locator('[data-memory-card="0"]')).toBeEnabled();
          const name = `${path.replace(/^\/+|\/+$/g, '') || 'home'}-${width}`;
          const properties = await page.evaluate(() => [...document.querySelectorAll('html,body,.site-header,.brand,.primary-nav,.header-actions,.mobile-menu,main,h1,.site-footer,.footer-back,[data-motion-toggle],[data-menu-toggle],[data-print],[data-memory-grid],[data-contact-form],[data-privacy-status]')].map(element => {
            const style = getComputedStyle(element), box = element.getBoundingClientRect();
            return {
              tag: element.tagName, id: element.id, class: element.className,
              text: element.textContent, hidden: element.hidden,
              label: element.getAttribute('aria-label'), pressed: element.getAttribute('aria-pressed'), disabled: element.getAttribute('disabled'),
              box: { x: box.x, y: box.y, width: box.width, height: box.height },
              style: Object.fromEntries(['display', 'position', 'visibility', 'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height', 'padding', 'margin', 'border-width', 'overflow-x'].map(property => [property, style.getPropertyValue(property)])),
            };
          }));
          await writeFile(join(directory, `${name}.properties.json`), JSON.stringify(properties, null, 2) + '\n');
          await page.screenshot({ path: join(directory, `${name}.png`), fullPage: true, animations: 'disabled' });
        } finally { await context.close(); }
      }
    }
    await writeFile(join(directory, 'boot.json'), JSON.stringify({ profile: 'local Worker; cold browser context per navigation; no network/CPU throttling; performance.now at js-ready mutation', samples: boot }, null, 2) + '\n');
  } finally { await runtime.close(); }
});
