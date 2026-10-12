import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parse, serialize } from 'parse5';
import * as css from 'css-tree';

// Import a verified standalone release. No game dependencies enter the site's
// public bundle or CMS editor; gameplay stays in the released runtime.
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-skift.mjs <SKIFT project directory>');
const release = resolve(source, 'dist/play/skift');
const target = 'public/play/skift';
await mkdir(`${target}/assets`, { recursive: true });
await cp(`${release}/audio`, `${target}/audio`, { recursive: true });
for (const name of ['THIRD-PARTY-LICENSES.txt', 'assets/app.css', 'assets/app.js.LEGAL.txt']) {
  await writeFile(`${target}/${name}`, (await readFile(`${release}/${name}`, 'utf8')).replace(/\s*\/\/[#@] sourceMappingURL=.*$/gm, '').replace(/\s*\/\*[#@] sourceMappingURL=.*?\*\//gs, '').replace(/[\t ]+$/gm, ''));
}
// The standalone header was replaced by the real portfolio shell. Its styles
// must not restyle the shared wordmark, navigation or compact-screen menu.
const stylesheet = css.parse(await readFile(`${release}/assets/app.css`, 'utf8'));
css.walk(stylesheet, { visit: 'Rule', enter(rule, item, list) {
  if (rule.prelude?.type !== 'SelectorList') return;
  rule.prelude.children.forEach((selector, selectorItem, selectors) => {
    if (/\.(site-header|brand|back-link)\b/.test(css.generate(selector))) selectors.remove(selectorItem);
  });
  if (rule.prelude.children.isEmpty) list.remove(item);
} });
await writeFile(`${target}/assets/app.css`, css.generate(stylesheet));
const original = await readFile(`${release}/assets/app.js`, 'utf8');
let code = original;
const copyKeys = ['workshop', 'line1', 'line2', 'intro', 'start', 'resumeRun', 'newRun', 'noInstall', 'saving', 'loading', 'ready', 'footer'];
const { STRINGS } = await import(pathToFileURL(resolve(source, 'src/i18n.js')).href);
const landingCopy = Object.fromEntries(['sv', 'en'].flatMap(language => copyKeys.map(key => [`runtime.skift.${language}.${key}`, STRINGS[language][key]])));
await writeFile('src/content/skift-copy.mjs', `// Landing copy uses textContent only. Modal HTML stays code-owned.\nexport const skiftCopy = ${JSON.stringify(landingCopy, null, 2)};\n`);
const translation = code.match(/t\(e\)\{return (\w+)\[this\.settings\.language\]\[e\]\|\|e\}/);
if (!translation) throw new Error('Release adapter cannot locate the translation method.');
code = code.replace(translation[0], `t(e){return (${JSON.stringify(copyKeys)}.includes(e)?globalThis.__OY_SKIFT_COPY__?.["runtime.skift."+this.settings.language+"."+e]:undefined)??(${translation[1]}[this.settings.language][e]||e)}`);
for (const [before, after] of [
  ['new URL("./audio/",document.baseURI)', 'new URL("/play/skift/audio/",document.baseURI)'],
  ['".site-header nav"', '"[data-skift-menu]"'],
]) {
  if (code.split(before).length !== 2) throw new Error(`Release adapter requires exactly one ${before}`);
  code = code.replace(before, after);
}
code = code.replace(/\s*\/\/[#@] sourceMappingURL=.*$/gm, '').replace(/[\t ]+$/gm, '');
await writeFile(`${target}/assets/app.js`, code);
const document = parse(await readFile(`${release}/index.html`, 'utf8'), { scriptingEnabled: false });
let body;
const visit = (node, fn) => { fn(node); for (const child of node.childNodes ?? []) visit(child, fn); };
visit(document, node => { if (node.tagName === 'body') body = node; });
visit(body, node => {
  node.childNodes = node.childNodes?.filter(child => !['script', 'header'].includes(child.tagName));
  if (node.tagName === 'main') node.tagName = 'section';
  const id = node.attrs?.find(attr => attr.name === 'id')?.value;
  if (id) node.attrs.push({ name: 'data-skift-part', value: id });
  if (id === 'title-screen') {
    node.attrs.push({ name: 'data-skift-root', value: '' });
    const tools = parse('<body><nav class="skift-tools" data-skift-menu aria-label="Spelmeny"><button data-action="how" data-t="how">Så spelar du</button><button data-action="settings" data-t="settings">Inställningar</button></nav></body>');
    let nav; visit(tools, element => { if (element.tagName === 'nav') nav = element; });
    nav.parentNode = node; node.childNodes.unshift(nav);
  }
  if (id === 'modal') {
    const label = parse('<body><h2 id="modal-title" hidden>Spelmeny</h2></body>');
    let heading; visit(label, element => { if (element.tagName === 'h2') heading = element; });
    heading.parentNode = node; node.childNodes.push(heading);
  }
});
const html = serialize(body).replaceAll('\u2014', '-').replace(/[\t ]+$/gm, '');
await writeFile('src/templates/skift.mjs', `// Imported by scripts/import-skift.mjs; gameplay hooks belong to SKIFT.\nexport const skift = () => ${JSON.stringify(html)};\n`);
const { version } = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
await writeFile(`${target}/RELEASE.json`, JSON.stringify({ version, upstreamBundleSha256: createHash('sha256').update(original).digest('hex'), bundleSha256: createHash('sha256').update(code).digest('hex'), adapters: ['same-origin audio URLs for CMS previews', 'game menu selector isolated from portfolio navigation', 'CMS landing text via textContent', 'portfolio shell owns header and brand styles'] }, null, 2) + '\n');
console.log('Imported SKIFT release, licenses, audio and CMS page markup.');
