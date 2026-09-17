import { readdir } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { spawn } from 'node:child_process';

const mode = process.argv[2] ?? 'fast';
if (!['fast', 'slow', 'watch'].includes(mode)) throw new Error(`Unknown test mode: ${mode}`);
const slow = 'cms-backup-drill.test.mjs';
const all = (await readdir('tests')).filter(name => name.endsWith('.test.mjs')).sort();
const selected = mode === 'slow' ? all.filter(name => name === slow) : all.filter(name => name !== slow);
if (mode === 'slow' && selected.length !== 1) throw new Error(`Expected exactly one slow test file, found ${selected.length}.`);
if (!selected.length) throw new Error('No test files selected.');
const defaultConcurrency = process.env.CI ? 4 : Math.max(1, Math.floor(availableParallelism() * 0.75));
const concurrency = mode === 'slow' ? 1 : Number(process.env.TEST_CONCURRENCY ?? defaultConcurrency);
if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('TEST_CONCURRENCY must be a positive integer.');
const args = ['--test', `--test-concurrency=${concurrency}`];
if (mode === 'watch') args.push('--watch');
args.push(...selected.map(name => `tests/${name}`));
console.log(`node:test ${mode}: files=${selected.length} concurrency=${concurrency}`);
const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
child.on('error', error => { throw error; });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
