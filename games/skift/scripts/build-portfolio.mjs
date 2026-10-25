import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build, version as esbuildVersion } from 'esbuild';
import * as css from 'css-tree';
import { gameBuildOptions } from './build-options.mjs';

const sha256 = value => createHash('sha256').update(value).digest('hex');

export async function buildSkift() {
  const target = 'dist/play/skift';
  await rm(target, { recursive: true, force: true });
  await mkdir(`${target}/assets`, { recursive: true });
  const bundle = await build({ ...gameBuildOptions, entryPoints: ['games/skift/src/main.js'], outfile: `${target}/assets/app.js`, sourcemap: false, metafile: true });
  // The standalone header belongs to index.html; the portfolio owns its shell.
  const stylesheet = css.parse(await readFile(`${target}/assets/app.css`, 'utf8'));
  css.walk(stylesheet, { visit: 'Rule', enter(rule, item, list) {
    if (rule.prelude?.type !== 'SelectorList') return;
    rule.prelude.children.forEach((selector, selectorItem, selectors) => {
      if (/\.(site-header|brand|back-link)\b/.test(css.generate(selector))) selectors.remove(selectorItem);
    });
    if (rule.prelude.children.isEmpty) list.remove(item);
  } });
  await writeFile(`${target}/assets/app.css`, css.generate(stylesheet));
  await cp('games/skift/public/audio', `${target}/audio`, { recursive: true });
  const licenses = [];
  for (const [name, file] of [['three', 'LICENSE'], ['cannon-es', 'LICENSE'], ['howler', 'LICENSE.md'], ['esbuild', 'LICENSE.md']]) {
    licenses.push(`## ${name}\n\n${await readFile(`node_modules/${name}/${file}`, 'utf8')}`);
  }
  await writeFile(`${target}/THIRD-PARTY-LICENSES.txt`, licenses.join('\n\n').replace(/[\t ]+$/gm, ''));
  const legal = `${target}/assets/app.js.LEGAL.txt`;
  await writeFile(legal, (await readFile(legal, 'utf8')).replace(/[\t ]+$/gm, ''));
  const { version, dependencies } = JSON.parse(await readFile('games/skift/package.json', 'utf8'));
  const paths = [...Object.keys(bundle.metafile.inputs).filter(path => path.startsWith('games/skift/')), 'games/skift/index.html', 'games/skift/src/page.mjs', 'games/skift/src/copy.mjs', 'games/skift/scripts/build-options.mjs', 'games/skift/scripts/build-portfolio.mjs'].sort();
  const sources = Object.fromEntries(await Promise.all(paths.map(async path => [path, sha256(await readFile(path))])));
  const code = await readFile(`${target}/assets/app.js`);
  await writeFile(`${target}/RELEASE.json`, JSON.stringify({
    version, bundleSha256: sha256(code), sources, dependencies, esbuildVersion,
    buildOptions: { ...gameBuildOptions, sourcemap: false },
    adapters: ['same-origin audio URLs for CMS previews', 'game menu selector isolated from portfolio navigation', 'CMS landing text via textContent', 'portfolio shell owns header and brand styles', 'loading Help and Settings remain dismissible'],
  }, null, 2) + '\n');
  return bundle.metafile;
}
