import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';

const publicUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';
const analyticsUrl = process.env.ANALYTICS_URL || 'http://127.0.0.1:4174';
let python = process.env.PYTHON || 'python3';
try {
  await access('.test-venv/bin/python');
  if (!process.env.PYTHON) python = '.test-venv/bin/python';
} catch {}

const jobs = [
  ['web-e2e', 'npm', ['run', 'test:web:e2e'], { BASE_URL: publicUrl, PLAYWRIGHT_WORKERS: process.env.PLAYWRIGHT_WORKERS || '3' }],
  ['interactions', python, ['tests/browser.py', '--base-url', publicUrl, '--analytics-url', analyticsUrl, '--screenshots', '--section', 'interactions']],
  ['privacy', python, ['tests/browser.py', '--base-url', publicUrl, '--analytics-url', analyticsUrl, '--screenshots', '--section', 'privacy']],
  ['revision', python, ['tests/revision_browser.py'], { BASE_URL: publicUrl }],
];

const children = new Set();
let failed = false;

function run([name, command, args, extraEnv = {}]) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${name} ===`);
    const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
    children.add(child);
    child.once('error', error => {
      children.delete(child);
      reject(error);
    });
    child.once('exit', code => {
      children.delete(child);
      if (code) failed = true;
      resolve({ name, code: code ?? 1 });
    });
  });
}

function stopAll(signal) {
  for (const child of children) child.kill(signal);
}
process.once('SIGINT', () => stopAll('SIGINT'));
process.once('SIGTERM', () => stopAll('SIGTERM'));

const results = await Promise.all(jobs.map(run));
for (const result of results) console.log(`${result.name}: ${result.code === 0 ? 'PASS' : `FAIL (${result.code})`}`);
if (failed) process.exit(1);
