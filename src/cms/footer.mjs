import { parseFragment, serialize } from 'parse5';
import { HttpError } from './http.mjs';
import { attribute, elements } from './html-tree.mjs';

export const FOOTER_VERSION = 1;
const LINK = '<a href="/developers/">För utvecklare</a>';
// PR #10 migration. Signature keys do not shift, so only the link is added;
// validateProject then checks the result against the current contracts.
function normalizeFooterPage(page) {
  if (page.footerVersion !== undefined && page.footerVersion !== FOOTER_VERSION) throw new HttpError(422, 'Sidfotens version stöds inte.');
  if (page.footerVersion === FOOTER_VERSION || typeof page.html !== 'string') return page;
  const tree = parseFragment(page.html, { scriptingEnabled: true });
  const nav = elements(tree).find(node => attribute(node, 'data-privacy-open') !== undefined)?.parentNode;
  if (nav?.tagName !== 'nav' || elements(nav).some(node => node.tagName === 'a' && attribute(node, 'href') === '/developers/')) return { ...page, footerVersion: FOOTER_VERSION };
  const link = parseFragment(LINK).childNodes[0];
  link.parentNode = nav;
  nav.childNodes.unshift(link);
  return { ...page, html: serialize(tree), footerVersion: FOOTER_VERSION };
}

export function normalizeFooterProject(input, seed) {
  if (!input || !Array.isArray(input.pages)) return input;
  let changed = false;
  const pages = input.pages.map(page => {
    if (!page || typeof page !== 'object') return page;
    const normalized = normalizeFooterPage(page);
    changed ||= normalized !== page;
    return normalized;
  });
  if (!changed) return input;
  // The new footer must point to a page that is also editable and publishable.
  // Once marked, subsequent owner edits/deletions are not re-added on reads.
  if (seed.footerPage && !pages.some(page => page?.path === seed.footerPage.path || page?.id === seed.footerPage.id)) pages.push({ ...structuredClone(seed.footerPage), footerVersion: FOOTER_VERSION });
  return { ...input, pages };
}
