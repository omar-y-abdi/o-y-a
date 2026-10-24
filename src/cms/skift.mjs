import { parseFragment, serialize } from 'parse5';
import { validateHtml, rekeyHtml } from './validation.mjs';
import { HttpError } from './http.mjs';
import { SKIFT_PATH, shiftLink } from '../content/skift.mjs';
import { attribute as attr, elements } from './html-tree.mjs';

// The link uses a fixed identity outside the signature keys.
export function normalizeSkiftPage(page, definition) {
  const links = definition?.contracts?.filter(contract => ['skift-nav', 'skift-nav-mobile'].includes(contract.key)) ?? [];
  if (!links.length || typeof page.html !== 'string') return page;
  // A page that already carries every link identity needs no migration and is
  // returned without parsing it on each public read.
  if (links.every(link => page.html.includes(`data-cms-node="${link.key}"`))) return page;
  const tree = parseFragment(page.html, { scriptingEnabled: true });
  const nodes = elements(tree);
  const missing = links.filter(link => !nodes.some(node => attr(node, 'data-cms-node') === link.key));
  if (!missing.length) return page;
  // Check a re-keyed copy: stored pages from older builds carry positional keys.
  // The output keeps the page's own keys; Save validates them afterwards.
  validateHtml(rekeyHtml(page.html), definition.contracts.filter(contract => !missing.some(link => link.key === contract.key)));
  for (const link of missing) {
    const menu = nodes.find(node => (attr(node, 'class') ?? '').split(/\s+/).includes(link.containerClass));
    if (!menu) throw new HttpError(422, 'Sidans toppmeny saknas.');
    const anchor = parseFragment(shiftLink(false, link.key === 'skift-nav-mobile')).childNodes[0];
    anchor.attrs.push({ name: 'data-cms-node', value: link.key });
    anchor.parentNode = menu;
    const workshop = menu.childNodes.findIndex(node => node.tagName === 'a' && attr(node, 'href') === '/verkstad/');
    menu.childNodes.splice(workshop < 0 ? menu.childNodes.length : workshop + 1, 0, anchor);
  }
  return { ...page, html: serialize(tree) };
}

// The game page is code-owned: the build at SKIFT_PATH is always served, so a
// stored copy is dropped on read and on save instead of shadowing template fixes.
export function normalizeSkiftProject(input, seed) {
  if (!input || !Array.isArray(input.pages)) return input;
  const pages = input.pages.filter(page => page?.id !== 'skift').map(page => {
    if (!page || typeof page !== 'object') return page;
    const definition = seed.pages?.find(item => item.id === page.id) ?? seed.pages?.find(item => item.id === page.sourceId) ?? seed.blank;
    return normalizeSkiftPage(page, definition);
  });
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
