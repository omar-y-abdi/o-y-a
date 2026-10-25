import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize } from 'parse5';
import { walk } from '../../../src/cms/html-tree.mjs';

// One markup source serves the standalone release and the portfolio build.
const document = parse(await readFile(new URL('../index.html', import.meta.url), 'utf8'), { scriptingEnabled: false });
const body = document.childNodes.find(node => node.tagName === 'html').childNodes.find(node => node.tagName === 'body');
let hasTitleScreen = false;
walk(body, node => {
  node.childNodes = node.childNodes?.filter(child => !['script', 'header'].includes(child.tagName));
  if (node.tagName === 'main') node.tagName = 'section';
  const id = node.attrs?.find(attr => attr.name === 'id')?.value;
  if (id) node.attrs.push({ name: 'data-skift-part', value: id });
  if (id === 'title-screen') {
    hasTitleScreen = true;
    node.attrs.push({ name: 'data-skift-root', value: '' });
    const nav = parseFragment('<nav class="skift-tools" data-skift-menu aria-label="Spelmeny"><button data-action="how" data-t="how">Så spelar du</button><button data-action="settings" data-t="settings">Inställningar</button></nav>').childNodes[0];
    nav.parentNode = node; node.childNodes.unshift(nav);
  }
  if (node.attrs?.some(attr => attr.name === 'class' && attr.value.split(/\s+/).includes('hero-copy'))) {
    const failure = parseFragment('<p data-skift-load-error role="alert" hidden>Spelet kunde inte laddas. <a href="/play/skift/">Ladda om</a>. <span lang="en">The game could not load. Reload to try again.</span></p>').childNodes[0];
    failure.parentNode = node; node.childNodes.unshift(failure);
  }
  if (id === 'modal') {
    const heading = parseFragment('<h2 id="modal-title" hidden>Spelmeny</h2>').childNodes[0];
    heading.parentNode = node; node.childNodes.push(heading);
  }
});
if (!hasTitleScreen) throw new Error('SKIFT index.html has no #title-screen element.');
const html = serialize(body).replaceAll('\u2014', '-').replace(/[\t ]+$/gm, '');
export const skift = () => html;
