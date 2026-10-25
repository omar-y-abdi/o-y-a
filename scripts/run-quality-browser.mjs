import { spawn } from 'node:child_process';
import { testPython } from './test-python.mjs';
import { publicRuntime } from '../tests/helpers/cms-runtime.mjs';

const python = await testPython();

const children = new Set();
let interrupted = false;

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
      resolve({ name, code: code ?? 1 });
    });
  });
}

function stopAll(signal) {
  interrupted = true;
  for (const child of children) child.kill(signal);
}
const onInterrupt = () => stopAll('SIGINT');
const onTerminate = () => stopAll('SIGTERM');
process.once('SIGINT', onInterrupt);
process.once('SIGTERM', onTerminate);

let runtime, analytics;
try {
  runtime = await publicRuntime();
  analytics = await publicRuntime({ analytics: true });
  const publicUrl = runtime.url, analyticsUrl = analytics.url;
  const env = { BASE_URL: publicUrl, PLAYWRIGHT_PORT: '', PLAYWRIGHT_WORKERS: process.env.PLAYWRIGHT_WORKERS || '3' };
  const jobs = [
    ['web-e2e', 'npm', ['run', 'test:public-pages'], env],
    ['interactions', python, ['tests/browser.py', '--base-url', publicUrl, '--analytics-url', analyticsUrl, '--screenshots', '--section', 'interactions']],
    ['privacy', python, ['tests/browser.py', '--base-url', publicUrl, '--analytics-url', analyticsUrl, '--screenshots', '--section', 'privacy']],
    ['revision', python, ['tests/revision_browser.py'], { BASE_URL: publicUrl }],
  ];
  for (const job of jobs) {
    if (interrupted) break;
    const result = await run(job);
    console.log(`${result.name}: ${result.code === 0 ? 'PASS' : `FAIL (${result.code})`}`);
    if (result.code !== 0) process.exitCode = 1;
  }
  if (interrupted) process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', onInterrupt);
  process.removeListener('SIGTERM', onTerminate);
  try { await analytics?.close(); }
  finally { await runtime?.close(); }
}
