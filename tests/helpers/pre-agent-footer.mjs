import { readFile } from 'node:fs/promises';
import { parseFragment, serialize } from 'parse5';
import { initial } from '../../.generated/cms-seed.mjs';
import { routes } from '../../src/content/site.mjs';
import { preparePage, validateHtml } from '../../src/cms/validation.mjs';

const developerLink = '<a href="/developers/">För utvecklare</a>';
export async function preAgentFooterProject() {
  // PR #10 inserted exactly this anchor. Prepare the actual preceding source
  // before numbering, independently of the production migration code.
  const pages = await Promise.all(routes.filter(page => page.path !== '/developers/').map(async page => {
    const raw = await readFile(page.noindex ? 'dist/404.html' : `dist${page.path}index.html`, 'utf8');
    if (!raw.includes(developerLink)) throw new Error('The legacy fixture needs an explicit template update.');
    const old = preparePage(raw.replace(developerLink, ''));
    validateHtml(old.html, old.contracts);
    const { contracts: _ephemeralTemplateContracts, ...stored } = old;
    return { ...page, id: page.template, sourceId: page.template, ...stored, css: '', project: null };
  }));
  const project = { ...structuredClone(initial), pages };
  const home = project.pages.find(page => page.path === '/');
  const tree = parseFragment(home.html);
  const visit = (node, fn) => { fn(node); for (const child of node.childNodes ?? []) visit(child, fn); };
  visit(tree, node => {
    if (node.tagName === 'footer') node.attrs.push({ name: 'id', value: 'owner-footer' });
  });
  home.html = serialize(tree);
  home.css = '#owner-footer{height:282px}';
  home.description = 'Owner description retained across the footer upgrade.';
  return project;
}

export function footerHook(page) {
  let key;
  const visit = node => {
    if (node.tagName === 'button' && node.attrs.some(a => a.name === 'data-privacy-open')) key ??= node.attrs.find(a => a.name === 'data-cms-node')?.value;
    for (const child of node.childNodes ?? []) visit(child);
  };
  visit(parseFragment(page.html));
  return key;
}
