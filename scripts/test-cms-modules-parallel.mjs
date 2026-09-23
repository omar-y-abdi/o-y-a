import './prepare-cms-modules.mjs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const source = await readFile('tests/cms-modules.py', 'utf8');
const registered = [...source.matchAll(/^\s*run\('([^']+)'/gm)].map(match => match[1]);
if (!registered.length || new Set(registered).size !== registered.length) throw new Error('CMS module registrations are missing or duplicated.');
const SERIAL_CASES = new Set(['R20-preserve-rich-structure-and-simple-newlines']);
for (const name of SERIAL_CASES) if (!registered.includes(name)) throw new Error(`Unknown serial CMS module case: ${name}`);
const SMOKE = new Set([
  'R14-active-typing-newlines-composition-flush',
  'R23-live-text-active-inactive-serialization-stable',
  'R12-clone-anchor-aria-svg-and-style',
  'cms-duplicate-inline-section-preserves-style',
  'cms-usability-resize-nudge-and-style-mode',
  'cms-usability-view-state-and-mobile-center',
  'cms-managed-svg-uses-shared-editor',
]);
for (const name of SMOKE) if (!registered.includes(name)) throw new Error(`Unknown smoke CMS module case: ${name}`);
const profile = process.env.CMS_MODULE_PROFILE || 'full';
const selected = profile === 'smoke' ? registered.filter(name => SMOKE.has(name)) : registered;
const cases = selected.filter(name => !SERIAL_CASES.has(name));
const serialCases = selected.filter(name => SERIAL_CASES.has(name));
const expectedCases = [...cases, ...serialCases];
const workers = Math.max(1, Math.min(Number(process.env.CMS_MODULE_WORKERS || 4), Math.max(cases.length, 1)));
const resultsDir = 'output/cms-modules/results';
await rm(resultsDir, { recursive: true, force: true });
await mkdir(resultsDir, { recursive: true });
let python = process.env.PYTHON ?? 'python3';
try { await access('.test-venv/bin/python'); if (!process.env.PYTHON) python = '.test-venv/bin/python'; } catch {}
let index = 0;
let failed = false;
const running = new Set();
const resultPath = name => `${resultsDir}/${encodeURIComponent(name)}.json`;

function runCase(name) {
  return new Promise((resolve, reject) => {
    const child = spawn(python, ['tests/cms-modules.py'], { stdio: 'inherit', env: { ...process.env, CMS_MODULE_CASE: name, CMS_MODULE_RESULT_PATH: resultPath(name) } });
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
async function mergeResults() {
  const aggregate = [];
  for (const name of expectedCases) {
    let parsed;
    try { parsed = JSON.parse(await readFile(resultPath(name), 'utf8')); }
    catch (error) { throw new Error(`Missing structured CMS module result for ${name}: ${error.message}`); }
    if (!Array.isArray(parsed) || parsed.length !== 1 || parsed[0]?.name !== name) throw new Error(`Invalid structured CMS module result for ${name}.`);
    aggregate.push(parsed[0]);
  }
  const names = aggregate.map(item => item.name);
  if (names.length !== expectedCases.length || new Set(names).size !== expectedCases.length) throw new Error(`CMS module evidence mismatch: expected ${expectedCases.length}, got ${names.length}.`);
  await writeFile('output/cms-modules/results.json', JSON.stringify(aggregate, null, 2));
  if (aggregate.some(item => !item.passed)) failed = true;
}
function stop(signal) { for (const child of running) child.kill(signal); }
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
await Promise.all(Array.from({ length: workers }, worker));
for (const name of serialCases) await runCase(name);
await mergeResults();
await runManagedSvgFidelity();
if (failed) process.exitCode = 1;
