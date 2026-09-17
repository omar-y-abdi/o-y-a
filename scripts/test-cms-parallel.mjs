import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';

const suites = process.argv.slice(2);
const files = suites.length ? suites : [
  'tests/cms-browser.py',
  'tests/cms-interactions.py',
  'tests/cms-review-browser.py',
  'tests/cms-review-final-browser.py',
];
const limit = Math.max(1, Math.min(Number(process.env.CMS_BROWSER_WORKERS || 4), files.length));
let python = process.env.PYTHON ?? 'python3';
try { await access('.test-venv/bin/python'); if (!process.env.PYTHON) python = '.test-venv/bin/python'; } catch {}
let index = 0;
let failed = false;
const children = new Set();

function run(file) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== CMS browser suite: ${file} ===`);
    const child = spawn(process.execPath, ['scripts/test-cms.mjs', file], { stdio: 'inherit', env: { ...process.env, CMS_SKIP_HELPERS: '1' } });
    children.add(child);
    child.once('error', error => { children.delete(child); reject(error); });
    child.once('exit', code => { children.delete(child); if (code) failed = true; resolve(code ?? 1); });
  });
}

async function runHelpersOnce() {
  if (process.env.CMS_SKIP_HELPERS === '1') return;
  for (const file of ['tests/test_cms_browser_helpers.py', 'tests/test_cms_asset_usage.py']) {
    console.log(`\n=== CMS browser helper: ${file} ===`);
    const child = spawn(python, [file], { stdio: 'inherit', env: process.env });
    children.add(child);
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', value => resolve(value ?? 1));
    });
    children.delete(child);
    if (code) process.exit(code);
  }
}

async function worker() {
  while (index < files.length) {
    const file = files[index++];
    await run(file);
  }
}

function stopAll(signal) { for (const child of children) child.kill(signal); }
process.once('SIGINT', () => stopAll('SIGINT'));
process.once('SIGTERM', () => stopAll('SIGTERM'));

await runHelpersOnce();
await Promise.all(Array.from({ length: limit }, worker));
if (failed) process.exitCode = 1;
