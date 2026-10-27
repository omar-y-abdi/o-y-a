import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { verifyNotices, verifyBundleNotices } from '../scripts/third-party-notices.mjs';
import { gameNotices } from '../games/skift/scripts/notices.mjs';

test('tracked full notices match installed sources and every built CMS package', async () => {
  assert.equal(await verifyNotices(), await readFile('THIRD-PARTY-LICENSES.txt', 'utf8'));
  await verifyBundleNotices(JSON.parse(await readFile('.generated/cms-metafile.json', 'utf8')));
  assert.equal(await gameNotices('games/skift', 'node_modules'), await readFile('games/skift/THIRD-PARTY-LICENSES.txt', 'utf8'));
});

test('missing copyright, license drift and changed embedded vendor code fail closed', async t => {
  const root = await mkdtemp(join(tmpdir(), 'notice-review-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const inventory = JSON.parse(await readFile('licenses/inventory.json', 'utf8'));
  await cp('licenses', join(root, 'licenses'), { recursive: true });
  await cp('THIRD-PARTY-LICENSES.txt', join(root, 'THIRD-PARTY-LICENSES.txt'));
  const paths = [...inventory.packages.flatMap(entry => [`node_modules/${entry.name}/package.json`, `node_modules/${entry.name}/${entry.file}`]), ...Object.keys(inventory.reviewedVendorFiles)];
  for (const path of new Set(paths)) { await mkdir(dirname(join(root, path)), { recursive: true }); await cp(path, join(root, path)); }
  await verifyNotices(root);
  const canonical = await readFile(join(root, 'THIRD-PARTY-LICENSES.txt'), 'utf8');
  await writeFile(join(root, 'THIRD-PARTY-LICENSES.txt'), canonical.replace(/^Copyright.*$/m, ''));
  await assert.rejects(verifyNotices(root), /differs from reviewed full texts/);
  await writeFile(join(root, 'THIRD-PARTY-LICENSES.txt'), canonical);
  for (const file of ['licenses/spectrum.txt', 'licenses/codemirror-2.txt']) {
    const upstream = await readFile(join(root, file), 'utf8');
    await writeFile(join(root, file), 'MIT');
    await writeFile(join(root, 'THIRD-PARTY-LICENSES.txt'), canonical.replace(upstream.trimEnd(), 'MIT'));
    await assert.rejects(verifyNotices(root), /Unreviewed upstream notice bytes/);
    await writeFile(join(root, file), upstream);
    await writeFile(join(root, 'THIRD-PARTY-LICENSES.txt'), canonical);
  }
  const source = 'node_modules/grapesjs/LICENSE', original = await readFile(join(root, source));
  await writeFile(join(root, source), 'BSD-3-Clause');
  await assert.rejects(verifyNotices(root), /Unreviewed license\/source bytes: grapesjs/);
  await writeFile(join(root, source), original);
  await writeFile(join(root, 'node_modules/grapesjs/dist/grapes.mjs'), '// a different bundled vendor');
  await assert.rejects(verifyNotices(root), /Reinspect embedded third-party code/);
});

test('a new or nested mismatched bundled dependency requires notice review', async t => {
  await assert.rejects(verifyBundleNotices({ inputs: { 'node_modules/new-library/index.js': {} } }), /unreviewed third-party package: new-library/);
  const root = await mkdtemp(join(tmpdir(), 'notice-nested-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp('licenses', join(root, 'licenses'), { recursive: true });
  const nested = 'node_modules/outer/node_modules/three';
  await mkdir(join(root, nested), { recursive: true });
  await writeFile(join(root, nested, 'package.json'), JSON.stringify({ name: 'three', version: '0.0.1' }));
  await assert.rejects(verifyBundleNotices({ inputs: { [`${nested}/index.js`]: {} } }, root), /unreviewed version: three@0.0.1/);
});

test('standalone packaging cannot silently omit a library license', async t => {
  const root = await mkdtemp(join(tmpdir(), 'skift-notice-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp('games/skift/THIRD-PARTY-LICENSES.txt', join(root, 'THIRD-PARTY-LICENSES.txt'));
  await assert.rejects(gameNotices(root, join(root, 'node_modules')), { code: 'ENOENT' });
});

test('optimized editor distribution contains the reviewed ESM sources and is the shipped entry', async () => {
  const maps = await Promise.all(['grapes.mjs', 'grapes.min.js'].map(async name => JSON.parse(await readFile(`node_modules/grapesjs/dist/${name}.map`, 'utf8'))));
  const [esm, optimized] = maps.map(map => new Map(map.sources.map((source, index) => [source, map.sourcesContent[index]])));
  const esmOnly = [...esm.keys()].filter(source => !optimized.has(source)).sort();
  assert.deepEqual(esmOnly.map(source => source.split('/modules/').at(-1)), ['index-all.js', 'index.js']);
  assert.ok(esmOnly.every(source => source.includes('/underscore@1.13.8/node_modules/underscore/modules/')));
  assert.deepEqual([...optimized.keys()].filter(source => !esm.has(source)), ['webpack://grapesjs/webpack/universalModuleDefinition']);
  for (const [source, content] of optimized) if (esm.has(source)) assert.equal(content, esm.get(source), source);
  const graph = JSON.parse(await readFile('.generated/cms-metafile.json', 'utf8'));
  assert.ok(Object.hasOwn(graph.inputs, 'node_modules/grapesjs/dist/grapes.min.js'));
  assert.ok(!Object.hasOwn(graph.inputs, 'node_modules/grapesjs/dist/grapes.mjs'));
});
