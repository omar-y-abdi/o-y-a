import { parseFragment, serializeOuter } from 'parse5';
import { preparePage } from '../src/cms/validation.mjs';

const link = '<a href="/developers/">För utvecklare</a>';
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function nodes(html) {
  const result = [];
  const visit = node => { if (node.tagName) result.push(node); for (const child of node.childNodes ?? []) visit(child); };
  visit(parseFragment(html, { scriptingEnabled: false }));
  return result;
}
export function prepareFooterSource(document) {
  const current = preparePage(document);
  if (!document.includes(link)) return current;
  const previous = preparePage(document.replace(link, ''));
  const before = nodes(previous.html), after = nodes(current.html);
  const added = after.find(node => node.tagName === 'a' && attr(node, 'href') === '/developers/' && node.parentNode?.tagName === 'nav' && attr(node.parentNode, 'aria-label') === 'Sidfotsmeny');
  if (!added) throw new Error('The trusted footer migration requires the developer link.');
  const corresponding = after.filter(node => node !== added);
  if (before.length !== corresponding.length) throw new Error('The footer migration must account for exactly one added node.');
  const keys = {};
  before.forEach((node, index) => {
    const next = corresponding[index];
    if (node.tagName !== next.tagName) throw new Error('The legacy footer template no longer matches.');
    const oldKey = attr(node, 'data-cms-node'), newKey = attr(next, 'data-cms-node');
    if (oldKey !== newKey) keys[oldKey] = newKey;
  });
  const control = after.find(node => node.parentNode === added.parentNode && attr(node, 'data-privacy-open') !== undefined);
  if (!control) throw new Error('The trusted footer must retain its privacy control.');
  const marker = attr(before[corresponding.indexOf(control)], 'data-cms-node');
  return { ...current, footerMigration: { marker, navKey: attr(added.parentNode, 'data-cms-node'), link: serializeOuter(added), keys, contracts: previous.contracts } };
}
