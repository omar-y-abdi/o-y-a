import { test, expect } from './helpers/public-test.mjs';
import { readFile } from 'node:fs/promises';

const project = JSON.parse(await readFile(new URL('./fixtures/cms-v185-project.json', import.meta.url), 'utf8'));
const AXE = await readFile(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const PAGES = [...new Set([...project.pages.map(page => page.path), '/play/skift/'])];
const SIZES = [[1366, 800], [360, 740]];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
// Known violations per page and rule, as axe's node targets in document order. Production showed the same five
// nodes on 2026-11-10. Delete an entry when its cause is fixed: the comparison below is exact in both directions.
const KNOWN = {
  // Owner content in the frozen v185 publication: the four project-card links name themselves with an aria-label
  // that leaves out the visible card text. The repository cannot change a stored page.
  '/': { 'label-content-name-mismatch': ['#inbstb', '.joy-art', '#iiio8d', '.backhaul-art'] },
  // games/skift/src/ui.js labels the "SV / EN" button "Byt till engelska". The game bundle's hash names a file in
  // dist/assets, so the fix changes the CMS studio build key and waits for a planned key change.
  '/play/skift/': { 'label-content-name-mismatch': ['#language-button'] },
};

const describeViolation = ({ id, impact, help, targets, summaries }) => [
  `${id} [${impact}] ${help} (${targets.length} ${targets.length === 1 ? 'node' : 'nodes'})`,
  ...summaries.map((summary, index) => `  ${targets[index]}\n  ${summary}`),
].join('\n');

test.describe('public accessibility, axe-core WCAG A and AA', () => {
  for (const path of PAGES) for (const [width, height] of SIZES) {
    test(`${path} at ${width}px`, { tag: path === '/play/skift/' ? '@webgl' : [] }, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage();
        const response = await page.goto(path, { waitUntil: 'networkidle' });
        if (path === '/404.html') expect(response?.status()).toBe(404);
        else expect(response?.status()).toBe(200);
        // The public CSP rejects the inline element addScriptTag would insert; page.evaluate does not insert one.
        await page.evaluate(AXE);
        const { passes, violations } = await page.evaluate(async values => {
          const results = await window.axe.run(document, { runOnly: { type: 'tag', values } });
          return {
            passes: results.passes.length,
            violations: results.violations.map(({ id, impact, help, nodes }) => ({
              id, impact, help,
              targets: nodes.map(node => node.target.flat().join(' >>> ')),
              summaries: nodes.slice(0, 3).map(node => node.failureSummary),
            })),
          };
        }, TAGS);
        expect(passes, 'axe reported no passing rule, so it did not audit this document').toBeGreaterThan(0);
        const known = KNOWN[path] ?? {};
        expect(Object.fromEntries(violations.map(({ id, targets }) => [id, targets])), `WCAG A/AA violations on ${path} at ${width}px differ from KNOWN. Fix a new violation; delete a KNOWN entry that no longer occurs.\nExpected known: ${JSON.stringify(known)}\nFound:\n${violations.map(describeViolation).join('\n') || '  none'}`).toEqual(known);
      } finally { await context.close(); }
    });
  }
});
