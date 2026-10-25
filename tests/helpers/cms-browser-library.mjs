import { build } from 'esbuild';
import { expect } from '@playwright/test';
import { waitCanvas } from './cms-browser-qa.mjs';

export async function libraryBundle() {
  const bundle = await build({ stdin: { contents: "import * as library from './src/cms/client/library.mjs'; window.libraryFixture = library;", resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022' });
  return bundle.outputFiles[0].text;
}

export async function libraryPage(page, runtime, bundle, html) {
  await page.context().addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
  const response = await page.goto(runtime.url + '/admin/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
  expect(response.status()).toBe(200);
  await waitCanvas(page);
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 5000 });
  await page.evaluate(bundle);
}
