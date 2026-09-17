import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { initial, built } from '../.generated/cms-seed.mjs';
import { renderPage } from '../src/cms/render.mjs';

await mkdir('output/cms-modules', { recursive: true });
await build({ entryPoints: ['tests/helpers/cms-module-entry.mjs'], bundle: true, format: 'iife', outfile: 'output/cms-modules/entry.js', target: 'es2022' });
await writeFile('output/cms-modules/page.json', JSON.stringify(initial.pages[0]));
const dataUri = async path => `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
await writeFile('output/cms-modules/fixtures.json', JSON.stringify({
  cards: initial.cards,
  preview: renderPage(initial.pages[0], built, { preview: true, project: initial }),
  main: built.main,
  mailSvg: await readFile('public/mail/omar-smile.svg', 'utf8'),
  mailPngData: await dataUri('public/mail/omar-smile.png'),
  iconSvg: await readFile('public/favicon.svg', 'utf8'),
  iconPngData: await dataUri('public/apple-touch-icon.png'),
}));
