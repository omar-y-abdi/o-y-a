import { mkdir, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { testPython } from './test-python.mjs';

const files = process.argv.slice(2);
if (!files.length) throw new Error('Usage: node scripts/test-cms.mjs path/to/tool.py [more tools]');
// Imported after the argument check: the runtime helper needs a build.
const { cmsRuntime } = await import('../tests/helpers/cms-runtime.mjs');
const python = await testPython();
const runtime = await cmsRuntime();
await mkdir('output/cms-local', { recursive: true });
const state = `output/cms-local/test-auth-${process.pid}.json`;
await writeFile(state, JSON.stringify({ cookies: [{ name: 'CF_Authorization', value: await runtime.token(), domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] }), { mode: 0o600 });
try {
  for (const file of files) {
    const child = spawn(python, [file], { stdio: 'inherit', env: { ...process.env, BASE_URL: runtime.url, CMS_STORAGE_STATE: state } });
    const stop = signal => child.kill(signal);
    const interrupt = () => stop('SIGINT'), terminate = () => stop('SIGTERM');
    process.once('SIGINT', interrupt); process.once('SIGTERM', terminate);
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', value => resolve(value ?? 1)); });
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', terminate);
    if (code) process.exitCode = code;
  }
} finally { await runtime.close(); await rm(state, { force: true }); }
