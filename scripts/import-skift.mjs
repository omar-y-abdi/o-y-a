import { readFile, readdir, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parse, parseFragment, serialize } from 'parse5';
import * as css from 'css-tree';
import { walk } from '../src/cms/html-tree.mjs';

// Import a verified standalone release. No game dependencies enter the site's
// public bundle or CMS editor; gameplay stays in the released runtime.
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-skift.mjs <SKIFT project directory>');
const release = resolve(source, 'dist/play/skift');
const target = 'public/play/skift';
// Read and validate every input and build every output in memory first, so a
// wrong or incomplete release directory changes zero files.
const original = await readFile(`${release}/assets/app.js`, 'utf8');
const licenseNames = ['THIRD-PARTY-LICENSES.txt', 'assets/app.js.LEGAL.txt'];
const licenseSources = await Promise.all(licenseNames.map(name => readFile(`${release}/${name}`, 'utf8')));
const stylesheetSource = await readFile(`${release}/assets/app.css`, 'utf8');
const indexSource = await readFile(`${release}/index.html`, 'utf8');
const { version } = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
if (typeof version !== 'string' || !version) throw new Error('Release package.json has no version.');
if ((await readdir(`${release}/audio`)).length === 0) throw new Error('Release audio directory is empty.');
let code = original;
const copyKeys = ['workshop', 'line1', 'line2', 'intro', 'start', 'resumeRun', 'newRun', 'noInstall', 'saving', 'loading', 'ready', 'footer'];
const { STRINGS } = await import(pathToFileURL(resolve(source, 'src/i18n.js')).href);
const landingCopy = Object.fromEntries(['sv', 'en'].flatMap(language => copyKeys.map(key => [`runtime.skift.${language}.${key}`, STRINGS[language][key]])));
const translation = code.match(/t\(e\)\{return (\w+)\[this\.settings\.language\]\[e\]\|\|e\}/);
if (!translation) throw new Error('Release adapter cannot locate the translation method.');
code = code.replace(translation[0], `t(e){return (${JSON.stringify(copyKeys)}.includes(e)?globalThis.__OY_SKIFT_COPY__?.["runtime.skift."+this.settings.language+"."+e]:undefined)??(${translation[1]}[this.settings.language][e]||e)}`);
const readiness = code.match(/if\((\w+)\)if\((\w+)==="start"\)/);
if (!readiness || code.split(readiness[0]).length !== 2) throw new Error('Release adapter cannot locate the unique gameplay readiness guard.');
// Closing Help/Settings only changes UI; gameplay still requires completed startup.
code = code.replace(readiness[0], `if(${readiness[1]}||${readiness[2]}==="close")if(${readiness[2]}==="start")`);
for (const [before, after] of [
  ['new URL("./audio/",document.baseURI)', 'new URL("/play/skift/audio/",document.baseURI)'],
  ['".site-header nav"', '"[data-skift-menu]"'],
]) {
  if (code.split(before).length !== 2) throw new Error(`Release adapter requires exactly one ${before}`);
  code = code.replace(before, after);
}
code = code.replace(/\s*\/\/[#@] sourceMappingURL=.*$/gm, '').replace(/[\t ]+$/gm, '');
const licenseOutputs = licenseSources.map(text => text.replace(/\s*\/\/[#@] sourceMappingURL=.*$/gm, '').replace(/\s*\/\*[#@] sourceMappingURL=.*?\*\//gs, '').replace(/[\t ]+$/gm, ''));
// The standalone header was replaced by the real portfolio shell. Its styles
// must not restyle the shared wordmark, navigation or compact-screen menu.
const stylesheet = css.parse(stylesheetSource);
css.walk(stylesheet, { visit: 'Rule', enter(rule, item, list) {
  if (rule.prelude?.type !== 'SelectorList') return;
  rule.prelude.children.forEach((selector, selectorItem, selectors) => {
    if (/\.(site-header|brand|back-link)\b/.test(css.generate(selector))) selectors.remove(selectorItem);
  });
  if (rule.prelude.children.isEmpty) list.remove(item);
} });
const stylesheetOutput = css.generate(stylesheet);
const copyModule = `// Landing copy uses textContent only. Modal HTML stays code-owned.\nexport const skiftCopy = ${JSON.stringify(landingCopy, null, 2)};\n`;
const document = parse(indexSource, { scriptingEnabled: false });
const body = document.childNodes.find(node => node.tagName === 'html')?.childNodes.find(node => node.tagName === 'body');
if (!body) throw new Error('Release index.html has no body.');
walk(body, node => {
  node.childNodes = node.childNodes?.filter(child => !['script', 'header'].includes(child.tagName));
  if (node.tagName === 'main') node.tagName = 'section';
  const id = node.attrs?.find(attr => attr.name === 'id')?.value;
  if (id) node.attrs.push({ name: 'data-skift-part', value: id });
  if (id === 'title-screen') {
    node.attrs.push({ name: 'data-skift-root', value: '' });
    const nav = parseFragment('<nav class="skift-tools" data-skift-menu aria-label="Spelmeny"><button data-action="how" data-t="how">Så spelar du</button><button data-action="settings" data-t="settings">Inställningar</button></nav>').childNodes[0];
    nav.parentNode = node; node.childNodes.unshift(nav);
  }
  if (id === 'modal') {
    const heading = parseFragment('<h2 id="modal-title" hidden>Spelmeny</h2>').childNodes[0];
    heading.parentNode = node; node.childNodes.push(heading);
  }
});
const html = serialize(body).replaceAll('\u2014', '-').replace(/[\t ]+$/gm, '');
const templateModule = `// Imported by scripts/import-skift.mjs; gameplay hooks belong to SKIFT.\nexport const skift = () => ${JSON.stringify(html)};\n`;
const releaseOutput = JSON.stringify({ version, upstreamBundleSha256: createHash('sha256').update(original).digest('hex'), bundleSha256: createHash('sha256').update(code).digest('hex'), adapters: ['same-origin audio URLs for CMS previews', 'game menu selector isolated from portfolio navigation', 'CMS landing text via textContent', 'portfolio shell owns header and brand styles', 'loading Help and Settings remain dismissible'] }, null, 2) + '\n';
await mkdir(`${target}/assets`, { recursive: true });
await cp(`${release}/audio`, `${target}/audio`, { recursive: true });
for (const [index, name] of licenseNames.entries()) await writeFile(`${target}/${name}`, licenseOutputs[index]);
await writeFile(`${target}/assets/app.css`, stylesheetOutput);
await writeFile('src/content/skift-copy.mjs', copyModule);
await writeFile(`${target}/assets/app.js`, code);
await writeFile('src/templates/skift.mjs', templateModule);
await writeFile(`${target}/RELEASE.json`, releaseOutput);
console.log('Imported SKIFT release, licenses, audio and CMS page markup.');
