import { spawn } from 'node:child_process';
import { publicRuntime } from '../tests/helpers/cms-runtime.mjs';

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

let runtime;
try {
  runtime = await publicRuntime();
  const env = { BASE_URL: runtime.url, PLAYWRIGHT_PORT: '', PLAYWRIGHT_WORKERS: process.env.PLAYWRIGHT_WORKERS || '3' };
  const jobs = [
    ['web-e2e', 'npm', ['run', 'test:public-pages'], env],
    ['web-interactions-revision', 'npx', ['playwright', 'test', 'tests/public-interactions.spec.mjs', 'tests/revision_browser.spec.mjs', '--project=chromium', '--no-deps', '--output=output/playwright/artifacts/interactions-revision'], env],
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
  await runtime?.close();
}
