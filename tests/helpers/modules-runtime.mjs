import { test as base, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { initial } from '../../.generated/cms-seed.mjs';
import { publishSite } from '../../src/cms/store.mjs';
import { cmsRuntime } from './cms-runtime.mjs';

export const SHELL = '<!doctype html><html><head><style>body{margin:0}#editor{width:1000px;height:700px}#side{position:absolute;left:1020px;top:0;width:350px}#styles-panel,#blocks-panel,#layers-panel,#traits-panel{min-height:1px}</style></head><body><div id="editor"></div><aside id="side"><div id="selection-name"></div><div id="selection-type"></div><div id="custom-inspector"></div><div id="styles-panel"></div><div id="blocks-panel"></div><div id="layers-panel"></div><div id="traits-panel"></div></aside></body></html>';

export const test = base.extend({
  modules: [async ({}, use) => {
    const runtime = await cmsRuntime({ port: 0 });
    try {
      const published = await publishSite(runtime.db, { project: structuredClone(initial), baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
      const headers = { Cookie: `CF_Authorization=${await runtime.token()}`, Origin: runtime.url, 'X-CMS-Request': '1', 'Content-Type': 'application/json' };
      const stateResponse = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/state', { headers });
      expect(stateResponse.status, await stateResponse.clone().text()).toBe(200);
      const state = await stateResponse.json(), page = state.project.pages[0];
      expect(state.version).toBe(published.version);
      const previewResponse = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/preview', { method: 'POST', headers, body: JSON.stringify({ project: state.project, pageId: page.id }) });
      expect(previewResponse.status, await previewResponse.clone().text()).toBe(200);
      const cardsResponse = await runtime.mf.dispatchFetch(runtime.url + '/data/cards.json');
      expect(cardsResponse.status).toBe(200);
      const publicCards = await cardsResponse.json();
      const cardText = ({ id, flavor, text }) => ({ id, flavor, text });
      expect(publicCards.map(cardText)).toEqual(state.project.cards.filter(card => (card.state ?? 'active') === 'active').map(cardText));
      const bundle = await build({ entryPoints: ['tests/helpers/cms-module-entry.mjs'], bundle: true, write: false, format: 'iife', target: 'es2022' });
      const fixture = {
        cards: state.project.cards, preview: (await previewResponse.json()).html, main: state.built.main,
        mailSvg: await readFile('public/mail/omar-smile.svg', 'utf8'),
        mailPngData: `data:image/png;base64,${(await readFile('public/mail/omar-smile.png')).toString('base64')}`,
        iconSvg: await readFile('public/favicon.svg', 'utf8'),
        iconPngData: `data:image/png;base64,${(await readFile('public/apple-touch-icon.png')).toString('base64')}`,
      };
      await use({ runtime, page, fixture, bundle: bundle.outputFiles[0].text, version: published.version });
    } finally { await runtime.close(); }
  }, { scope: 'worker', timeout: 120_000 }],
});

// Retain the Python suite's isolated module DOM, on the real Worker's origin.
// Public HTML, card data and preview HTML come through Worker/D1, not serve.mjs
// or render_support's rewritten source. This harness does not test CSP.
export async function openModulePage(page, modules, html = SHELL) {
  page.setDefaultTimeout(8_000);
  const response = await page.goto(modules.runtime.url + '/', { waitUntil: 'networkidle' });
  expect(response.status()).toBe(200);
  expect(response.headers()['x-cms-version']).toBe(String(modules.version));
  await page.setContent(html);
  await page.addStyleTag({ path: 'node_modules/grapesjs/dist/css/grapes.min.css' });
  await page.addStyleTag({ path: 'src/cms/styles.css' });
  await page.addScriptTag({ content: modules.bundle });
}

export async function editor(page, content) {
  await page.evaluate(data => {
    window.snapshots = []; window.ready = false;
    window.handle = cmsTest.createEditor({ page: data, cssPath: '', assets: [], onChange(value) { snapshots.push(value); }, onSelect() {}, onReady() { ready = true; } });
  }, content);
  await page.waitForFunction(() => ready, null, { timeout: 20_000 });
  return page.frameLocator('#editor iframe.gjs-frame');
}

export const nextFrames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

export async function attachPng(testInfo, name, dataUrl) {
  await testInfo.attach(name, { body: Buffer.from(dataUrl.split(',')[1], 'base64'), contentType: 'image/png' });
}
