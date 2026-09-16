import { mkdir, writeFile, access, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { cmsRuntime } from '../tests/helpers/cms-runtime.mjs';

const runtime = await cmsRuntime();
let python = process.env.PYTHON ?? 'python3';
try { await access('.test-venv/bin/python'); if (!process.env.PYTHON) python = '.test-venv/bin/python'; } catch { /* CI uses the configured Python installation. */ }
await mkdir('output/cms-local', { recursive: true });
const state = `output/cms-local/test-auth-${process.pid}.json`;
await writeFile(state, JSON.stringify({ cookies: [{ name: 'CF_Authorization', value: await runtime.token(), domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] }), { mode: 0o600 });
try {
  const files = process.argv.slice(2);
  const suites = files.length ? files : ['tests/cms-browser.py', 'tests/cms-interactions.py', 'tests/cms-review-browser.py', 'tests/cms-review-final-browser.py'];
  const helpers = process.env.CMS_SKIP_HELPERS === '1' ? [] : ['tests/test_cms_browser_helpers.py'];
  for (const file of [...helpers, ...suites.filter(file => file !== 'tests/test_cms_browser_helpers.py')]) {
    const child = spawn(python, [file], { stdio: 'inherit', env: { ...process.env, BASE_URL: runtime.url, CMS_STORAGE_STATE: state } });
    const stop = signal => child.kill(signal);
    const interrupt = () => stop('SIGINT'), terminate = () => stop('SIGTERM');
    process.once('SIGINT', interrupt); process.once('SIGTERM', terminate);
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', value => resolve(value ?? 1)); });
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', terminate);
    if (code) process.exitCode = code;
  }
} finally { await runtime.close(); await rm(state, { force: true }); }
