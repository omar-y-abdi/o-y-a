import { spawn } from 'node:child_process';

const suites = process.argv.slice(2);
const files = suites.length ? suites : [
  'tests/cms-browser.py',
  'tests/cms-interactions.py',
  'tests/cms-review-browser.py',
  'tests/cms-review-final-browser.py',
];
const limit = Math.max(1, Math.min(Number(process.env.CMS_BROWSER_WORKERS || 4), files.length));
let index = 0;
let failed = false;
const children = new Set();

function run(file) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== CMS browser suite: ${file} ===`);
    const child = spawn(process.execPath, ['scripts/test-cms.mjs', file], { stdio: 'inherit' });
    children.add(child);
    child.once('error', error => { children.delete(child); reject(error); });
    child.once('exit', code => { children.delete(child); if (code) failed = true; resolve(code ?? 1); });
  });
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

await Promise.all(Array.from({ length: limit }, worker));
if (failed) process.exitCode = 1;
