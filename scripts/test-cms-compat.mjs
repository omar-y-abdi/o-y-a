import { spawn } from 'node:child_process';

const browsers = ['firefox', 'webkit'];
const runId = process.pid;
const running = new Set();
let stopping = false;

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env });
    running.add(child);
    child.once('error', error => {
      running.delete(child);
      reject(error);
    });
    child.once('exit', code => {
      running.delete(child);
      resolve(code ?? 1);
    });
  });
}

async function runBrowser(browser) {
  const env = { ...process.env, CMS_BROWSER: browser, CMS_BROWSER_WORKERS: process.env.CMS_COMPAT_BROWSER_WORKERS || '2', PLAYWRIGHT_JSON_OUTPUT_FILE: `output/playwright/modules-${runId}-${browser}.json` };
  console.log(`\n=== CMS compatibility: ${browser} ===`);
  let code = await run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'tests/cms-modules.spec.mjs', 'tests/managed-svg-fidelity.spec.mjs', 'tests/test_cms_browser_helpers.spec.mjs', 'tests/test_cms_asset_usage.spec.mjs', `--project=${browser}`, '--no-deps', '--workers=1', `--output=output/playwright/artifacts/modules-${runId}-${browser}`, '--reporter=line,json'], env);
  if (code) return { browser, code };
  code = await run('node', ['scripts/test-cms-parallel.mjs', 'tests/cms-review-browser.py', 'tests/cms-review-final-browser.py'], env);
  return { browser, code };
}

function stopAll(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of running) child.kill(signal);
}

process.once('SIGINT', () => stopAll('SIGINT'));
process.once('SIGTERM', () => stopAll('SIGTERM'));

const results = await Promise.all(browsers.map(runBrowser));
const failed = results.filter(result => result.code !== 0);
for (const result of results) console.log(`${result.browser}: ${result.code === 0 ? 'PASS' : `FAIL (${result.code})`}`);
if (failed.length) process.exitCode = 1;
