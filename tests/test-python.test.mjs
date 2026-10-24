import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const helper = new URL('../scripts/test-python.mjs', import.meta.url).href;

test('test Python selection honors overrides, finds the venv, falls back only when absent and surfaces filesystem errors', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'test-python-'));
  const env = { ...process.env };
  delete env.PYTHON;
  const run = (overrides = {}) => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `import { testPython } from ${JSON.stringify(helper)}; console.log(await testPython());`], { cwd, env: { ...env, ...overrides }, encoding: 'utf8' });
    assert.ifError(result.error);
    return result;
  };
  const selected = overrides => {
    const result = run(overrides);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  try {
    assert.equal(selected(), 'python3');
    await mkdir(join(cwd, '.test-venv/bin'), { recursive: true });
    await writeFile(join(cwd, '.test-venv/bin/python'), '');
    assert.equal(selected(), '.test-venv/bin/python');
    assert.equal(selected({ PYTHON: '/custom/python' }), '/custom/python');
    await rm(join(cwd, '.test-venv'), { recursive: true });
    await writeFile(join(cwd, '.test-venv'), 'not a directory');
    const broken = run();
    assert.notEqual(broken.status, 0);
    assert.match(broken.stderr, /ENOTDIR/);
    assert.equal(selected({ PYTHON: '/custom/python' }), '/custom/python');
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
