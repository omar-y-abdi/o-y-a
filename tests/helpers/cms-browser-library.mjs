import { build } from 'esbuild';

export async function libraryBundle() {
  const bundle = await build({ stdin: { contents: "import * as library from './src/cms/client/library.mjs'; window.libraryFixture = library;", resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022' });
  return bundle.outputFiles[0].text;
}

export async function libraryPage(page, bundle, html) {
  // These renderer fixtures need a fresh document, like their Python originals.
  // Replacing an initialized studio leaves its ResizeObserver alive after the
  // observed editor has been removed. Real studio interactions use cmsRuntime.
  await page.goto('about:blank');
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 5000 });
  await page.evaluate(bundle);
}
