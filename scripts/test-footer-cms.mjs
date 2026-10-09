import { mkdir, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { cmsRuntime } from '../tests/helpers/cms-runtime.mjs';
import { preAgentFooterProject } from '../tests/helpers/pre-agent-footer.mjs';
import { publishSite } from '../src/cms/store.mjs';

const runtime = await cmsRuntime();
const state = `output/cms-local/footer-auth-${process.pid}.json`;
try {
  // Seed through storage, not the current save API: the browser must encounter
  // a genuine retained pre-PR-10 revision with old keys and a fixed footer size.
  await publishSite(runtime.db, { project: await preAgentFooterProject(), baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
  await mkdir('output/cms-local', { recursive: true });
  await writeFile(state, JSON.stringify({ cookies: [{ name: 'CF_Authorization', value: await runtime.token(), domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] }), { mode: 0o600 });
  const child = spawn(process.env.PYTHON ?? 'python3', ['tests/footer-cms-browser.py'], {
    stdio: 'inherit', env: { ...process.env, BASE_URL: runtime.url, CMS_STORAGE_STATE: state },
  });
  const interrupt = () => child.kill('SIGINT'), terminate = () => child.kill('SIGTERM');
  process.once('SIGINT', interrupt); process.once('SIGTERM', terminate);
  try {
    process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
  } finally { process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', terminate); }
} finally { await runtime.close(); await rm(state, { force: true }); }
