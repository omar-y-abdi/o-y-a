import './prepare-cms-modules.mjs';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const CASES = [
  'R14-active-typing-newlines-composition-flush',
  'R18-canonical-content-reloads-without-divergent-editor-data',
  'R20-text-ranges-unicode-links-and-escaping',
  'R15-public-modules-ignore-author-preview-markers',
  'R21-transform-fit-mobile-and-png-export',
  'merge-overflow-export-pixels-and-live-host-isolation',
  'merge-wrapper-style-isolation',
  'R12-clone-anchor-aria-svg-and-style',
  'cms-duplicate-inline-section-preserves-style',
  'export-layout-scaled-card-not-fitting-wrapper',
  'export-layout-rejects-real-clipping',
  'representative-card-exports',
  'CI-preview-srcdoc-readiness',
  'merge-export-inherited-theme-and-current-width',
  'cms-usability-resize-nudge-and-style-mode',
  'cms-usability-view-state-and-mobile-center',
  'cms-client-shared-content-sync',
  'cms-locked-preview-mobile-center',
  'cms-managed-svg-uses-shared-editor',
];
const SERIAL_CASES = ['R20-preserve-rich-structure-and-simple-newlines'];
const SMOKE = new Set([
  'R14-active-typing-newlines-composition-flush',
  'R12-clone-anchor-aria-svg-and-style',
  'cms-duplicate-inline-section-preserves-style',
  'cms-usability-resize-nudge-and-style-mode',
  'cms-usability-view-state-and-mobile-center',
  'cms-managed-svg-uses-shared-editor',
]);
const profile = process.env.CMS_MODULE_PROFILE || 'full';
const cases = profile === 'smoke' ? CASES.filter(name => SMOKE.has(name)) : CASES;
const serialCases = profile === 'smoke' ? [] : SERIAL_CASES;
const workers = Math.max(1, Math.min(Number(process.env.CMS_MODULE_WORKERS || (process.env.CI ? 4 : 4)), cases.length));
let python = process.env.PYTHON ?? 'python3';
try { await access('.test-venv/bin/python'); if (!process.env.PYTHON) python = '.test-venv/bin/python'; } catch {}
let index = 0;
let failed = false;
const running = new Set();

function runCase(name) {
  return new Promise((resolve, reject) => {
    const child = spawn(python, ['tests/cms-modules.py'], { stdio: 'inherit', env: { ...process.env, CMS_MODULE_CASE: name } });
    running.add(child);
    child.once('error', error => { running.delete(child); reject(error); });
    child.once('exit', code => { running.delete(child); if (code) failed = true; resolve(code ?? 1); });
  });
}
async function worker() {
  while (index < cases.length) await runCase(cases[index++]);
}
async function runManagedSvgFidelity() {
  const child = spawn(python, ['tests/managed-svg-fidelity.py'], { stdio: 'inherit', env: process.env });
  running.add(child);
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', value => resolve(value ?? 1));
  });
  running.delete(child);
  if (code) failed = true;
}
function stop(signal) { for (const child of running) child.kill(signal); }
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
await Promise.all(Array.from({ length: workers }, worker));
for (const name of serialCases) await runCase(name);
await runManagedSvgFidelity();
if (failed) process.exitCode = 1;
