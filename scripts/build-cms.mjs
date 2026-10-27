import { DEFAULT_SHARED_CONTENT, FOOTER_VERSION } from '../src/cms/legacy-project.mjs';
import { frameDefinitions } from '../src/cms/frame.mjs';
import { toFrameProject } from '../src/cms/frame-converter.mjs';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { imageDimensionsFromData } from 'image-dimensions';
import { routes } from '../src/content/site.mjs';
import { layout } from '../src/templates/layout.mjs';
import { preparePage } from '../src/cms/validation.mjs';
import { validateProject, defaultTheme } from '../src/cms/project.mjs';
// Current templates already hold the developer link: only unmarked (pre-PR #10) pages get it.
import { adminPage, loginPage } from '../src/cms/templates.mjs';
import { defaultCopy } from '../src/client/copy.mjs';
import { skiftCopy } from '../games/skift/src/copy.mjs';
import { resourceSlots } from '../src/content/resources.mjs';
import { sanitizeManagedSvg } from '../src/cms/svg.mjs';
import { parseFragment } from 'parse5';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { SKIFT_PATH } from '../src/content/skift.mjs';
import { verifyBundleNotices } from './third-party-notices.mjs';

const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
export async function studioBuildKey(seed, directory = process.cwd()) {
  // Fingerprint the actual dependency closure, not a manually maintained
  // version. The temporary in-memory bundles are neither emitted nor served.
  const representation = await build({ absWorkingDir: directory, entryPoints: ['src/cms/frame-converter.mjs', 'src/cms/project.mjs', 'src/cms/preview-store.mjs'], outdir: '.generated/studio-policy', bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', minify: true });
  const { studioKey: _previousKey, ...definitions } = seed;
  const policy = createHash('sha256').update(JSON.stringify(definitions));
  for (const output of representation.outputFiles) policy.update(output.contents);
  return policy.digest('hex');
}

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
  const vendorSource = 'node_modules/grapesjs/dist/grapes.min.js';
  const vendorCode = await readFile(vendorSource), vendorMap = await readFile(vendorSource + '.map');
  const vendorDir = `/admin/assets/grapes-${hash(Buffer.concat([vendorCode, vendorMap]))}`;
  const vendorPath = vendorDir + '/grapes.min.mjs';
  await mkdir('dist' + vendorDir, { recursive: true });
  await writeFile('dist' + vendorPath, vendorCode);
  // Keep the upstream sourceMappingURL valid within the immutable directory.
  await writeFile('dist' + vendorDir + '/grapes.min.js.map', vendorMap);
  const vendorVersion = JSON.parse(await readFile('node_modules/grapesjs/package.json', 'utf8')).version;
  await verifyBundleNotices({ inputs: { [vendorSource]: {} } });
  await writeFile('.generated/cms-vendor.json', JSON.stringify({ source: vendorSource, path: vendorPath, version: vendorVersion }));
  const bundle = await build({ entryPoints: { studio: 'src/cms/client/app.mjs', preview: 'src/cms/client/preview.mjs' }, outdir: 'dist/admin/assets', entryNames: '[name].[hash]', chunkNames: '[name].[hash]', outExtension: { '.js': '.mjs' }, bundle: true, splitting: true, format: 'esm', minify: true, sourcemap: false, target: ['es2022'], metafile: true, legalComments: 'linked',
    plugins: [{ name: 'reviewed-grapes-distribution', setup(builder) {
      builder.onResolve({ filter: /^grapesjs\/dist\/grapes\.min\.js$/ }, () => ({ path: 'grapes', namespace: 'cms-vendor' }));
      builder.onResolve({ filter: /^\/admin\/assets\// }, args => args.path === vendorPath ? { path: vendorPath, external: true } : undefined);
      builder.onLoad({ filter: /^grapes$/, namespace: 'cms-vendor' }, () => ({ contents: `import ${JSON.stringify(vendorPath)};const editor=globalThis.grapesjs;if(editor?.version!==${JSON.stringify(vendorVersion)}||typeof editor.init!=="function")throw new Error("Editorn kunde inte laddas. Ladda om sidan.");export default editor;`, loader: 'js' }));
    } }],
  });
  await verifyBundleNotices(bundle.metafile);
  await writeFile('.generated/cms-metafile.json', JSON.stringify(bundle.metafile));
  for (const name of await readdir('dist/admin/assets')) if (name.endsWith('.LEGAL.txt')) {
    const path = `dist/admin/assets/${name}`;
    await writeFile(path, (await readFile(path, 'utf8')).replace(/[ \t]+$/gm, ''));
  }
  const output = entry => '/' + Object.entries(bundle.metafile.outputs).find(([, value]) => value.entryPoint === entry)[0].replace(/^dist\//, '');
  const built = { styles, main: `/assets/${js.main}`, studio: output('src/cms/client/app.mjs'), preview: output('src/cms/client/preview.mjs'), css, vendorCss, loginCss };
  const pages = await Promise.all(routes.map(async page => ({ ...page, id: page.template, ...preparePage(await readFile(page.noindex ? 'dist/404.html' : `dist${page.path}index.html`, 'utf8')), css: '', project: null, footerVersion: FOOTER_VERSION })));
  const blank = { id: 'blank', path: '/ny-sida/', name: 'Ny sida', title: 'Ny sida | Omar Yusuf', description: 'En ny idé från Omar Yusuf.', template: 'custom', css: '', project: null, footerVersion: FOOTER_VERSION, ...preparePage(layout({ path: '/ny-sida/', name: 'Ny sida', title: 'Ny sida', description: 'En ny idé.', template: 'custom' }, '<section class="section-wrap" style="padding-block:80px;min-height:560px"><span class="eyebrow">EN NY IDÉ</span><h1>Här börjar något.</h1><p>Dubbelklicka för att skriva din berättelse.</p></section>', { css: styles.home, main: built.main })) };
  const assets = await Promise.all(Object.entries(resourceSlots).map(async ([slot, definition]) => {
    const { src, name, alt, mime, editableSrc } = definition;
    let bytes;
    try { bytes = await readFile(`public${src}`); } catch { return null; }
    const dimensions = imageDimensionsFromData(bytes);
    let editableSvg;
    if (editableSrc) editableSvg = sanitizeManagedSvg(await readFile(`public${editableSrc}`, 'utf8'));
    return { id: `builtin-${name}`, slot, src, name, alt: alt ?? name, mime: mime ?? (src.endsWith('.gif') ? 'image/gif' : 'image/png'), bytes: bytes.length, width: dimensions?.width, height: dimensions?.height, builtin: true, ...(editableSrc ? { editableSrc, editableSvg } : {}) };
  }));
  const cards = JSON.parse(await readFile('public/data/cards.json', 'utf8'));
  const staticPaths = (await readdir('dist', { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => '/' + `${entry.parentPath}/${entry.name}`.replace(/^dist\//, '')).sort();
  // Anchor targets of the code-owned game build, for links like /play/skift/#main.
  const skiftIds = elements(parseFragment(pages.find(page => page.path === SKIFT_PATH).html)).map(node => attribute(node, 'id')).filter(Boolean);
  const seed = frameDefinitions({ pages, blank, footerPage: pages.find(page => page.path === '/developers/'), skiftIds, runtime: { ...defaultCopy, ...skiftCopy }, assets: assets.filter(Boolean), staticPaths, sharedContent: DEFAULT_SHARED_CONTENT });
  seed.studioKey = await studioBuildKey(seed);
  await writeFile('dist/data/runtime.json', JSON.stringify(seed.runtime));
  const legacyInitial = validateProject({ schemaVersion: 1, pages, cards, runtime: seed.runtime, theme: defaultTheme, sharedContent: DEFAULT_SHARED_CONTENT }, seed);
  const initial = validateProject(toFrameProject(legacyInitial, seed), seed);
  await writeFile('.generated/cms-seed.mjs', `export const seed = ${JSON.stringify(seed)};\nexport const initial = ${JSON.stringify(initial)};\nexport const legacyInitial = ${JSON.stringify(legacyInitial)};\nexport const legacySeed = seed.legacy;\nexport const built = ${JSON.stringify(built)};\n`);
  await writeFile('dist/admin/index.html', adminPage({ css, vendorCss, js: built.studio }));
  await writeFile('dist/login/index.html', loginPage(loginCss));
  return built;
}
