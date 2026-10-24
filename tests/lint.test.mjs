import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const lint = fileURLToPath(new URL('../scripts/lint.mjs', import.meta.url));

async function check(files) {
  const cwd = await mkdtemp(join(tmpdir(), 'lint-'));
  try {
    for (const dir of ['src', 'scripts', 'tests']) await mkdir(join(cwd, dir));
    for (const [file, source] of Object.entries(files)) {
      await mkdir(dirname(join(cwd, file)), { recursive: true });
      await writeFile(join(cwd, file), source);
    }
    const result = spawnSync(process.execPath, [lint], { cwd, encoding: 'utf8' });
    assert.ifError(result.error);
    return result;
  } finally { await rm(cwd, { recursive: true, force: true }); }
}

test('lint accepts ESM and keeps content restrictions scoped to src', async () => {
  const result = await check({ 'src/valid.mjs': 'export const ready = await Promise.resolve(true);', 'tests/fixture.mjs': 'const text = "debugger eval( new Function( —";' });
  assert.equal(result.status, 0, result.stderr);
});

for (const [name, source] of [
  ['duplicate let', 'let duplicate; let duplicate;'],
  ['unexpected character', 'const value = @;'],
]) {
  test(`lint rejects ${name}`, async () => {
    const result = await check({ 'src/invalid.mjs': source });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/invalid\.mjs/);
  });
}

for (const content of ['—', 'debugger', 'eval(', 'new Function(']) {
  test(`lint retains production-content rule for ${JSON.stringify(content)}`, async () => {
    const result = await check({ 'src/content.txt': content });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Forbidden production content in src\/content\.txt/);
  });
}

test('lint retains V8 regexp early-error checks for manual scripts', async () => {
  const result = await check({ 'scripts/smoke-live.mjs': 'const pattern = /(/;' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid regular expression/);
});
