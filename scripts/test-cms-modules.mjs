import { build } from 'esbuild';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { initial, built } from '../.generated/cms-seed.mjs';

import { renderPage } from '../src/cms/render.mjs';

await mkdir('output/cms-modules', { recursive: true });
await build({ entryPoints: ['tests/helpers/cms-module-entry.mjs'], bundle: true, format: 'iife', outfile: 'output/cms-modules/entry.js', target: 'es2022' });
await writeFile('output/cms-modules/page.json', JSON.stringify(initial.pages[0]));
await writeFile('output/cms-modules/fixtures.json', JSON.stringify({ cards: initial.cards, preview: renderPage(initial.pages[0], built, { preview: true, project: initial }), main: built.main }));
let python = process.env.PYTHON ?? 'python3';
try { await access('.test-venv/bin/python'); if (!process.env.PYTHON) python = '.test-venv/bin/python'; } catch { /* Use the configured Python in CI. */ }
const child = spawn(python, ['tests/cms-modules.py'], { stdio: 'inherit', env: process.env });
process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
