import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
    assert.equal(selected({ PYTHON: '' }), 'python3');
    await mkdir(join(cwd, '.test-venv/bin'), { recursive: true });
    await writeFile(join(cwd, '.test-venv/bin/python'), '');
    assert.equal(selected(), '.test-venv/bin/python');
    assert.equal(selected({ PYTHON: '' }), '.test-venv/bin/python');
    assert.equal(selected({ PYTHON: '/custom/python' }), '/custom/python');
    await rm(join(cwd, '.test-venv'), { recursive: true });
    await writeFile(join(cwd, '.test-venv'), 'not a directory');
    const broken = run();
    assert.notEqual(broken.status, 0);
    assert.match(broken.stderr, /ENOTDIR/);
    assert.match(run({ PYTHON: '' }).stderr, /ENOTDIR/);
    assert.equal(selected({ PYTHON: '/custom/python' }), '/custom/python');
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test('quality shell uses the shared Python finder for every Python invocation', async () => {
  const quality = await readFile(new URL('../scripts/quality.sh', import.meta.url), 'utf8');
  assert.match(quality, /python=\$\(node --input-type=module -e 'import \{ testPython \} from "\.\/scripts\/test-python\.mjs"; console\.log\(await testPython\(\)\);'\)/);
  assert.doesNotMatch(quality, /^python\s/m);
  assert.equal((quality.match(/^"\$python" /gm) ?? []).length, 1, 'the revision-scroll unit check is the only Python step left');
});
