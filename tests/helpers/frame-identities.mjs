import { parseFragment, serialize } from 'parse5';
import { attribute, elements } from '../../src/cms/html-tree.mjs';

// The same ID-only legacy variation is used with the actual BASE validator and
// the browser's current legacy fixture. Pages without an ID remain idless.
export function legacyFrameIdentities(initial) {
  const project = structuredClone(initial);
  for (const page of project.pages) {
    if (!['home', 'about'].includes(page.id)) continue;
    const tree = parseFragment(page.html, { scriptingEnabled: false });
    const nodes = elements(tree), footer = nodes.find(node => node.tagName === 'footer'), main = nodes.find(node => node.tagName === 'main');
    const id = `legacy-footer-${page.id}`;
    footer.attrs = [...footer.attrs.filter(item => item.name !== 'id'), { name: 'id', value: id }];
    const links = parseFragment(`<a href="#${id}" data-cms-node="u-footer-${page.id}">Till sidfoten</a>${page.id === 'home' ? '<a href="/om/#legacy-footer-about" data-cms-node="u-other-footer">Till andra sidans sidfot</a>' : ''}`).childNodes;
    for (const link of links) { link.parentNode = main; main.childNodes.push(link); }
    page.html = serialize(tree);
    page.project = null;
  }
  return project;
}

export const footerId = html => attribute(elements(parseFragment(html)).find(node => node.tagName === 'footer'), 'id') ?? null;
