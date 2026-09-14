import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { imageDimensionsFromData } from 'image-dimensions';
import { routes } from '../src/content/site.mjs';
import { layout } from '../src/templates/layout.mjs';
import { preparePage } from '../src/cms/validation.mjs';
import { validateProject, defaultTheme } from '../src/cms/project.mjs';
import { adminPage, loginPage } from '../src/cms/templates.mjs';
import { defaultCopy } from '../src/client/copy.mjs';
import { resourceSlots } from '../src/content/resources.mjs';

const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
export async function buildCms({ styles, js }) {
  await mkdir('dist/admin/assets', { recursive: true });
  await mkdir('dist/cms-public', { recursive: true });
  await mkdir('dist/login', { recursive: true });
  async function stylesheet(source, name, dir = 'admin/assets') {
    const content = await readFile(source);
    const path = `/${dir}/${name}.${hash(content)}.css`;
    await writeFile(`dist${path}`, content);
    return path;
  }
  const [css, vendorCss, loginCss] = await Promise.all([
    stylesheet('src/cms/styles.css', 'studio'),
    stylesheet('node_modules/grapesjs/dist/css/grapes.min.css', 'grapes'),
    stylesheet('src/cms/login.css', 'login', 'cms-public'),
  ]);
  const bundle = await build({ entryPoints: { studio: 'src/cms/client/app.mjs', preview: 'src/cms/client/preview.mjs' }, outdir: 'dist/admin/assets', entryNames: '[name].[hash]', chunkNames: '[name].[hash]', outExtension: { '.js': '.mjs' }, bundle: true, splitting: true, format: 'esm', minify: true, sourcemap: false, target: ['es2022'], metafile: true, legalComments: 'linked' });
  for (const name of await readdir('dist/admin/assets')) if (name.endsWith('.LEGAL.txt')) {
    const path = `dist/admin/assets/${name}`;
    await writeFile(path, (await readFile(path, 'utf8')).replace(/[ \t]+$/gm, ''));
  }
  const output = entry => '/' + Object.entries(bundle.metafile.outputs).find(([, value]) => value.entryPoint === entry)[0].replace(/^dist\//, '');
  const built = { styles, main: `/assets/${js.main}`, studio: output('src/cms/client/app.mjs'), preview: output('src/cms/client/preview.mjs'), css, vendorCss, loginCss };
  const pages = await Promise.all(routes.map(async page => ({ ...page, id: page.template, ...preparePage(await readFile(page.noindex ? 'dist/404.html' : `dist${page.path}index.html`, 'utf8')), css: '', project: null })));
  const blank = { id: 'blank', path: '/ny-sida/', name: 'Ny sida', title: 'Ny sida | Omar Yusuf', description: 'En ny idé från Omar Yusuf.', template: 'custom', css: '', project: null, ...preparePage(layout({ path: '/ny-sida/', name: 'Ny sida', title: 'Ny sida', description: 'En ny idé.', template: 'custom' }, '<section class="section-wrap" style="padding-block:80px;min-height:560px"><span class="eyebrow">EN NY IDÉ</span><h1>Här börjar något.</h1><p>Dubbelklicka för att skriva din berättelse.</p></section>', { css: styles.home, main: built.main })) };
  const assets = await Promise.all(Object.entries(resourceSlots).map(async ([slot, { src, name }]) => {
    let bytes;
    try { bytes = await readFile(`public${src}`); } catch { return null; }
    const dimensions = imageDimensionsFromData(bytes);
    return { id: `builtin-${name}`, slot, src, name, alt: name, mime: src.endsWith('.gif') ? 'image/gif' : 'image/png', bytes: bytes.length, width: dimensions?.width, height: dimensions?.height, builtin: true };
  }));
  const cards = JSON.parse(await readFile('public/data/cards.json', 'utf8'));
  const staticPaths = (await readdir('dist', { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => '/' + `${entry.parentPath}/${entry.name}`.replace(/^dist\//, ''));
  const seed = { pages: pages.map(({ html, css, project, ...page }) => page), blank, runtime: defaultCopy, assets: assets.filter(Boolean), staticPaths };
  await writeFile('dist/data/runtime.json', JSON.stringify(defaultCopy));
  const initial = validateProject({ schemaVersion: 1, pages, cards, runtime: seed.runtime, theme: defaultTheme }, seed);
  await writeFile('.generated/cms-seed.mjs', `export const seed = ${JSON.stringify(seed)};\nexport const initial = ${JSON.stringify(initial)};\nexport const built = ${JSON.stringify(built)};\n`);
  await writeFile('dist/admin/index.html', adminPage({ css, vendorCss, js: built.studio }));
  await writeFile('dist/login/index.html', loginPage(loginCss));
  return built;
}
