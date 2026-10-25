import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UI } from '../games/skift/src/ui.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha256 = value => createHash('sha256').update(value).digest('hex');

test('a clean site build compiles changed SKIFT source without an imported release', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'skift-build-'));
  try {
    for (const directory of ['scripts', 'src', 'games', 'public']) {
      await cp(join(root, directory), join(scratch, directory), { recursive: true, filter: path => {
        const name = relative(root, path);
        return !name.startsWith('public/play/skift') && !/(^|\/)(node_modules|dist|evidence)(\/|$)/.test(name);
      } });
    }
    await cp(join(root, 'package.json'), join(scratch, 'package.json'));
    await symlink(join(root, 'node_modules'), join(scratch, 'node_modules'), 'dir');
    const source = join(scratch, 'games/skift/src/i18n.js');
    const original = await readFile(source, 'utf8');
    assert.ok(original.includes("intro:'En liten robot."));
    await writeFile(source, original.replace(/intro:'En liten robot\.[^']*'/, "intro:'Source build probe.'"));
    const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: scratch, encoding: 'utf8', timeout: 120000 });
    assert.equal(result.status, 0, result.error?.message ?? result.stderr);
    const game = join(scratch, 'dist/play/skift');
    await assert.rejects(readFile(join(scratch, 'public/play/skift/RELEASE.json')), { code: 'ENOENT' });
    // esbuild escapes non-ASCII text in the bundle, so the probe stays ASCII.
    const code = await readFile(join(game, 'assets/app.js'), 'utf8');
    assert.ok(code.includes('Source build probe.'), 'Runtime must come from the edited source');
    const copy = JSON.parse(await readFile(join(scratch, 'dist/data/runtime.json'), 'utf8'));
    assert.equal(copy['runtime.skift.sv.intro'], 'Source build probe.', 'CMS defaults must come from the same source');
    const release = JSON.parse(await readFile(join(game, 'RELEASE.json'), 'utf8'));
    assert.equal(release.bundleSha256, sha256(code));
    assert.ok(Object.hasOwn(release.sources, 'games/skift/src/i18n.js'));
    for (const [path, digest] of Object.entries(release.sources)) assert.equal(digest, sha256(await readFile(join(scratch, path))), path);
    assert.deepEqual(release.buildOptions, { bundle: true, minify: true, target: ['chrome100', 'safari15.4', 'firefox100'], legalComments: 'linked', sourcemap: false });
    assert.equal(release.adapters.length, 5);
    const build = JSON.parse(await readFile(join(scratch, '.generated/build.json'), 'utf8'));
    const inputs = Object.keys(build.skift.inputs);
    assert.deepEqual(inputs.filter(path => path.startsWith('games/skift/src/')).sort(), [
      'art.js', 'game.js', 'i18n.js', 'input.js', 'levels.js', 'main.js', 'physics.js', 'rules.js', 'sound.js', 'style.css', 'ui.js', 'view.js',
    ].map(name => 'games/skift/src/' + name).sort());
    // The scratch checkout links node_modules, so esbuild reports the resolved path.
    const libraries = [...new Set(inputs.map(path => path.match(/(?:^|\/)node_modules\/([^/]+)\//)?.[1]).filter(Boolean))].sort();
    assert.deepEqual(libraries, ['cannon-es', 'howler', 'three']);
    const pins = JSON.parse(await readFile(join(scratch, 'games/skift/package.json'), 'utf8')).dependencies;
    const site = JSON.parse(await readFile(join(scratch, 'package.json'), 'utf8'));
    for (const [name, version] of Object.entries(pins)) {
      assert.equal(site.devDependencies[name], version);
      assert.equal(site.dependencies[name], undefined);
    }
    const audio = (await readdir(join(game, 'audio'))).sort();
    assert.deepEqual(audio, ['boss.wav', 'cell.wav', 'clear.wav', 'dash.wav', 'fail.wav', 'hit.wav', 'pulse.wav', 'scrap.wav', 'shift.mp3', 'shot.wav', 'strike.wav']);
    for (const name of audio) assert.deepEqual(await readFile(join(game, 'audio', name)), await readFile(join(scratch, 'games/skift/public/audio', name)), name);
    for (const name of ['THIRD-PARTY-LICENSES.txt', 'assets/app.js.LEGAL.txt']) assert.ok((await readFile(join(game, name), 'utf8')).trim(), name);
    assert.doesNotMatch(code, /sourceMappingURL/);
    assert.ok(!(await readdir(join(game, 'assets'))).some(name => name.endsWith('.map')));
    assert.ok(!(await readdir(join(scratch, 'dist/play/skift/assets'))).includes('app.css'), 'CSS belongs only in the hashed page stylesheet');
    const built = await readFile(join(scratch, '.generated/build.json'), 'utf8');
    await writeFile(join(scratch, 'games/skift/index.html'), '<!doctype html><main id="other"></main>');
    const invalid = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: scratch, encoding: 'utf8', timeout: 120000 });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /SKIFT index\.html has no #title-screen element/);
    assert.equal(await readFile(join(game, 'assets/app.js'), 'utf8'), code, 'Invalid source must fail before replacing the existing build');
    assert.equal(await readFile(join(scratch, '.generated/build.json'), 'utf8'), built);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

test('game translations accept only landing overrides, including empty text, in either language', t => {
  const previous = globalThis.__OY_SKIFT_COPY__;
  t.after(() => { if (previous === undefined) delete globalThis.__OY_SKIFT_COPY__; else globalThis.__OY_SKIFT_COPY__ = previous; });
  globalThis.__OY_SKIFT_COPY__ = {
    'runtime.skift.sv.intro': '<img src=x onerror=alert(1)>',
    'runtime.skift.en.intro': 'Owner intro',
    'runtime.skift.sv.start': '',
    'runtime.skift.sv.howTitle': '<img src=x onerror=alert(1)>',
  };
  const ui = Object.create(UI.prototype);
  ui.settings = { language: 'sv' };
  assert.equal(ui.t('intro'), '<img src=x onerror=alert(1)>');
  assert.equal(ui.t('start'), '');
  assert.equal(ui.t('line1'), 'Sista skiftet.');
  assert.equal(ui.t('howTitle'), 'Liten robot. Stora möjligheter.');
  assert.equal(ui.t('unknown'), 'unknown');
  ui.settings.language = 'en';
  assert.equal(ui.t('intro'), 'Owner intro');
  assert.equal(ui.t('start'), 'Start your shift');
});
