import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { studioBuildKey } from '../scripts/build-cms.mjs';
import { seed } from '../.generated/cms-seed.mjs';

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
