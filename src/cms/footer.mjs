import { parseFragment, serialize } from 'parse5';
import * as css from 'css-tree';
import { validateHtml } from './validation.mjs';
import { HttpError } from './http.mjs';

export const FOOTER_VERSION = 1;
const attribute = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function elements(root) {
  const result = [];
  function visit(node) {
    if (node.tagName) result.push(node);
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(root);
  return result;
}
function remapCss(source, keys) {
  if (!source?.includes('data-cms-node')) return source;
  const tree = css.parse(source);
  let changed = false;
  css.walk(tree, node => {
    if (node.type !== 'AttributeSelector' || node.name.name !== 'data-cms-node' || !node.value) return;
    const property = node.value.type === 'String' ? 'value' : 'name';
    const replacement = keys[node.value[property]];
    if (replacement) { node.value[property] = replacement; changed = true; }
  });
  return changed ? css.generate(tree) : source;
}

// A bounded migration for the source change in PR #10, not a permissive
// fallback validator. Its old contracts and key map come from trusted builds.
export function normalizeFooterPage(page, definition) {
  if (page.footerVersion !== undefined && page.footerVersion !== FOOTER_VERSION) throw new HttpError(422, 'Sidfotens version stöds inte.');
  const migration = definition?.footerMigration;
  if (page.footerVersion === FOOTER_VERSION || !migration || typeof page.html !== 'string') return page;
  const tree = parseFragment(page.html, { scriptingEnabled: true });
  const nodes = elements(tree);
  const oldControl = nodes.find(node => attribute(node, 'data-cms-node') === migration.marker && attribute(node, 'data-privacy-open') !== undefined);
  if (!oldControl) return { ...page, footerVersion: FOOTER_VERSION };

  // Do not repair or erase a forged hook, duplicate identity, or moved control.
  // Only HTML satisfying the complete pre-change security contract is eligible.
  validateHtml(page.html, migration.contracts);
  for (const node of nodes) {
    const identity = node.attrs.find(item => item.name === 'data-cms-node');
    if (identity && migration.keys[identity.value]) identity.value = migration.keys[identity.value];
  }
  const nav = nodes.find(node => attribute(node, 'data-cms-node') === migration.navKey);
  if (nav && !elements(nav).some(node => node.tagName === 'a' && attribute(node, 'href') === '/developers/')) {
    const link = parseFragment(migration.link).childNodes[0];
    link.parentNode = nav;
    nav.childNodes.unshift(link);
  }
  return { ...page, html: serialize(tree), css: remapCss(page.css, migration.keys), footerVersion: FOOTER_VERSION };
}

export function normalizeFooterProject(input, seed) {
  if (!input || !Array.isArray(input.pages)) return input;
  let changed = false;
  const pages = input.pages.map(page => {
    if (!page || typeof page !== 'object') return page;
    const definition = seed.pages?.find(item => item.id === page.id) ?? seed.pages?.find(item => item.id === page.sourceId) ?? seed.blank;
    const normalized = normalizeFooterPage(page, definition);
    changed ||= normalized !== page;
    return normalized;
  });
  if (!changed) return input;
  // The new footer must point to a page that is also editable and publishable.
  // Once marked, subsequent owner edits/deletions are not re-added on reads.
  if (seed.footerPage && !pages.some(page => page?.path === seed.footerPage.path || page?.id === seed.footerPage.id)) {
    pages.push(normalizeFooterPage(structuredClone(seed.footerPage), seed.footerPage));
  }
  return { ...input, pages };
}
