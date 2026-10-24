import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const importer = fileURLToPath(new URL('../scripts/import-skift.mjs', import.meta.url));
const copyKeys = ['workshop', 'line1', 'line2', 'intro', 'start', 'resumeRun', 'newRun', 'noInstall', 'saving', 'loading', 'ready', 'footer'];
const strings = Object.fromEntries(['sv', 'en'].map(lang => [lang, Object.fromEntries(copyKeys.map(key => [key, `${lang}-${key}`]))]));
const appJs = 'class U{t(e){return S[this.settings.language][e]||e}}function f(a,b){if(a)if(b==="start")go()}const audio=new URL("./audio/",document.baseURI);const nav=q(".site-header nav");\n';
const indexHtml = '<!doctype html><html><body><header>x</header><main id="title-screen"><p>hi</p></main><dialog id="modal"></dialog><script>1</script></body></html>';

/** A minimal but valid standalone release, with optional files left out or replaced. */
async function release(root, { omit = [], packageJson = '{"name":"skift","version":"1.0.0","type":"module"}', index = indexHtml } = {}) {
  const dist = join(root, 'dist/play/skift');
  const files = {
    'package.json': packageJson,
    'src/i18n.js': `export const STRINGS = ${JSON.stringify(strings)};\n`,
    'dist/play/skift/assets/app.js': appJs,
    'dist/play/skift/assets/app.css': '.brand{color:red}.title{color:blue}\n',
    'dist/play/skift/assets/app.js.LEGAL.txt': 'legal\n',
    'dist/play/skift/THIRD-PARTY-LICENSES.txt': 'licenses\n',
    'dist/play/skift/audio/tone.txt': 'tone\n',
    'dist/play/skift/index.html': index,
  };
  for (const [name, text] of Object.entries(files)) {
    if (omit.includes(name)) continue;
    await mkdir(join(root, name, '..'), { recursive: true });
    await writeFile(join(root, name), text);
  }
  return dist;
}

const run = (releaseRoot, cwd) => spawnSync(process.execPath, [importer, releaseRoot], { cwd, encoding: 'utf8' });

async function scratch(fn) {
  const base = await mkdtemp(join(tmpdir(), 'skift-import-'));
  try { await fn(base); } finally { await rm(base, { recursive: true, force: true }); }
}

test('control: a complete release imports and writes the site files', async () => {
  await scratch(async base => {
    const rel = join(base, 'release'), cwd = join(base, 'cwd');
    await release(rel);
    await mkdir(join(cwd, 'src/content'), { recursive: true });
    await mkdir(join(cwd, 'src/templates'), { recursive: true });
    const result = run(rel, cwd);
    assert.equal(result.status, 0, result.stderr);
    for (const file of ['public/play/skift/RELEASE.json', 'public/play/skift/assets/app.js', 'public/play/skift/assets/app.css', 'public/play/skift/THIRD-PARTY-LICENSES.txt', 'public/play/skift/audio/tone.txt', 'src/content/skift-copy.mjs', 'src/templates/skift.mjs'])
      await access(join(cwd, file));
  });
});

test('a release without index.html changes zero files', async () => {
  await scratch(async base => {
    const rel = join(base, 'release'), cwd = join(base, 'cwd');
    await release(rel, { omit: ['dist/play/skift/index.html'] });
    await mkdir(cwd);
    const result = run(rel, cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /index\.html/);
    assert.deepEqual(await readdir(cwd), []);
  });
});

test('an index.html without the game page changes zero files', async () => {
  const pages = ['', '<!doctype html><html><head><title>x</title></head></html>', '<!doctype html><html><body><main id="other"></main></body></html>'];
  for (const index of pages) {
    await scratch(async base => {
      const rel = join(base, 'release'), cwd = join(base, 'cwd');
      await release(rel, { index });
      await mkdir(cwd);
      const result = run(rel, cwd);
      assert.notEqual(result.status, 0, index);
      assert.match(result.stderr, /index\.html has no #title-screen/, index);
      assert.deepEqual(await readdir(cwd), [], index);
    });
  }
});

test('invalid package metadata changes zero files', async () => {
  for (const packageJson of ['{broken', '{"name":"skift"}']) {
    await scratch(async base => {
      const rel = join(base, 'release'), cwd = join(base, 'cwd');
      await release(rel, { packageJson });
      await mkdir(cwd);
      const result = run(rel, cwd);
      assert.notEqual(result.status, 0, packageJson);
      assert.deepEqual(await readdir(cwd), [], packageJson);
    });
  }
});
