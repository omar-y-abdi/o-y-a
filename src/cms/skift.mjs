import { parseFragment, serialize } from 'parse5';
import { validateHtml } from './validation.mjs';
import { HttpError } from './http.mjs';
import { SKIFT_PATH, shiftLink } from '../content/skift.mjs';

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function elements(root) {
  const result = [];
  const visit = node => { if (node.tagName) result.push(node); for (const child of node.childNodes ?? []) visit(child); };
  visit(root); return result;
}

// The link uses a stable identity outside the numbered source nodes. Adding
// it never shifts owner styles or the historical footer migration's key map.
export function normalizeSkiftPage(page, definition) {
  if (!definition?.contracts?.some(contract => contract.key === 'skift-nav') || typeof page.html !== 'string') return page;
  const tree = parseFragment(page.html, { scriptingEnabled: true });
  const nodes = elements(tree);
  const slots = [
    { marker: 'data-skift-link', key: 'skift-nav', container: 'primary-nav', mobile: false },
    { marker: 'data-skift-mobile-link', key: 'skift-nav-mobile', container: 'mobile-menu', mobile: true },
  ];
  const missing = slots.filter(slot => !nodes.some(node => attr(node, slot.marker) !== undefined));
  if (!missing.length) return page;
  validateHtml(page.html, definition.contracts.filter(contract => !missing.some(slot => slot.key === contract.key)));
  for (const slot of missing) {
    const menu = nodes.find(node => (attr(node, 'class') ?? '').split(/\s+/).includes(slot.container));
    if (!menu) throw new HttpError(422, 'Sidans toppmeny saknas.');
    const anchor = parseFragment(shiftLink(false, slot.mobile)).childNodes[0];
    anchor.attrs.push({ name: 'data-cms-node', value: slot.key });
    anchor.parentNode = menu;
    const workshop = menu.childNodes.findIndex(node => node.tagName === 'a' && attr(node, 'href') === '/verkstad/');
    menu.childNodes.splice(workshop < 0 ? menu.childNodes.length : workshop + 1, 0, anchor);
  }
  return { ...page, html: serialize(tree) };
}

export function normalizeSkiftProject(input, seed) {
  if (!input || !Array.isArray(input.pages) || !seed.skiftPage) return input;
  const pages = input.pages.map(page => {
    if (!page || typeof page !== 'object') return page;
    const definition = seed.pages?.find(item => item.id === page.id) ?? seed.pages?.find(item => item.id === page.sourceId) ?? seed.blank;
    return normalizeSkiftPage(page, definition);
  });
  if (!pages.some(page => page?.id === 'skift')) {
    const game = structuredClone(seed.skiftPage);
    // Newly introduced page inherits the owner's current shared footer.
    const tree = parseFragment(game.html, { scriptingEnabled: false });
    for (const node of elements(tree)) {
      const value = input.sharedContent?.[attr(node, 'data-cms-shared')];
      if (typeof value !== 'string') continue;
      node.childNodes = parseFragment(value).childNodes;
      node.childNodes.forEach(child => { child.parentNode = node; });
    }
    game.html = serialize(tree);
    // Source facts describe the default footer, not the owner's inserted HTML.
    // Validate the introduced page before any incremental save can reuse facts.
    delete game.facts;
    pages.push(game);
  }
  let runtime = input.runtime;
  if (runtime && typeof runtime === 'object' && !Array.isArray(runtime)) {
    const missing = Object.entries(seed.runtime ?? {}).filter(([key]) => key.startsWith('runtime.skift.') && !Object.hasOwn(runtime, key));
    if (missing.length) runtime = { ...Object.fromEntries(missing), ...runtime };
  }
  return runtime === input.runtime && pages.length === input.pages.length && pages.every((page, index) => page === input.pages[index]) ? input : { ...input, pages, runtime };
}

export function skiftCsp(policy) {
  return policy.includes("media-src 'self' blob:") ? policy : policy + "; media-src 'self' blob:";
}
export const isSkiftPath = path => path === SKIFT_PATH || path === SKIFT_PATH.slice(0, -1);
