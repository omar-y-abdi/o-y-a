import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { studioBuildKey } from '../scripts/build-cms.mjs';
import { seed } from '../.generated/cms-seed.mjs';

test('standalone CMS rebuilds retain their fresh inventory, key and exact seed bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cms-seed-rebuild-'));
  const { styles, js } = JSON.parse(await readFile('.generated/build.json', 'utf8'));
  const generated = ['cms-seed.mjs', 'cms-build.mjs', 'cms-public.mjs'];
  try {
    // The child owns its copied assets/generated output. Other fast tests keep
    // reading the untouched checkout build while this actual builder runs.
    await Promise.all(['src', 'public', 'dist', 'licenses'].map(path => cp(path, join(directory, path), { recursive: true })));
    await cp('THIRD-PARTY-LICENSES.txt', join(directory, 'THIRD-PARTY-LICENSES.txt'));
    await symlink(await realpath('node_modules'), join(directory, 'node_modules'), 'dir');
    await mkdir(join(directory, '.generated'));
    const script = `
      import assert from 'node:assert/strict';
      import { readFile, rm } from 'node:fs/promises';
      import { buildCms } from ${JSON.stringify(new URL('../scripts/build-cms.mjs', import.meta.url).href)};
      const names = ${JSON.stringify(generated)};
      // Dependency paths can change esbuild's chunk names after relocation.
      // Establish a fresh CMS baseline here; compare only the same checkout.
      for (const path of ['dist/admin', 'dist/login', 'dist/cms-public', 'dist/data/runtime.json']) await rm(path, { recursive: true, force: true });
      await buildCms(${JSON.stringify({ styles, js })});
      const before = await Promise.all(names.map(name => readFile('.generated/' + name)));
      const { seedAsset } = await import('./.generated/cms-build.mjs');
      const original = await readFile('dist' + seedAsset.path);
      for (let repeat = 0; repeat < 2; repeat++) {
        await buildCms(${JSON.stringify({ styles, js })});
        for (const [index, name] of names.entries()) assert.ok((await readFile('.generated/' + name)).equals(before[index]), name + ' changed on repeat ' + repeat);
        assert.ok((await readFile('dist' + seedAsset.path)).equals(original), 'Seed asset bytes changed on repeat ' + repeat);
      }
    `;
    await writeFile(join(directory, 'repeat.mjs'), script);
    const result = spawnSync(process.execPath, ['repeat.mjs'], { cwd: directory, encoding: 'utf8', timeout: 120000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr + result.stdout);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('studio representation identity is repeatable and follows validation semantics and seed contracts', async () => {
  const first = await studioBuildKey(seed), second = await studioBuildKey(seed);
  assert.equal(first, seed.studioKey);
  assert.equal(second, first);
  const changed = structuredClone(seed);
  changed.frame.contracts[0].attrs['data-test-contract'] = 'changed';
  assert.notEqual(await studioBuildKey(changed), first);
  const assets = structuredClone(seed); assets.staticPaths.push('/assets/new-build.js');
  assert.notEqual(await studioBuildKey(assets), first, 'asset inventory changes require an explicit refresh disposition');

  const directory = await mkdtemp(join(tmpdir(), 'cms-studio-policy-'));
  try {
    await cp('src', join(directory, 'src'), { recursive: true });
    await symlink(await realpath('node_modules'), join(directory, 'node_modules'), 'dir');
    assert.equal(await studioBuildKey(seed, directory), first, 'checkout path does not change the fingerprint');
    const file = join(directory, 'src/cms/validation.mjs');
    const source = await readFile(file, 'utf8');
    assert.ok(source.includes('if (!TAGS.has(tag))'));
    await writeFile(file, source.replace('if (!TAGS.has(tag))', "if (tag === 'div' || !TAGS.has(tag))"));
    assert.notEqual(await studioBuildKey(seed, directory), first, 'actual validation behavior changes the key without a manual policy bump');
    await writeFile(file, source);
    const viewFile = join(directory, 'src/cms/stored-view.mjs'), view = await readFile(viewFile, 'utf8');
    assert.ok(view.includes('page.project = null'));
    await writeFile(viewFile, view.replace('page.project = null', 'page.project = undefined'));
    assert.notEqual(await studioBuildKey(seed, directory), first, 'ordinary stored-view projection participates in canonical identity');
  } finally { await rm(directory, { recursive: true, force: true }); }
});
