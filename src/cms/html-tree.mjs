import { parseFragment } from 'parse5';
import { HttpError } from './http.mjs';

export const attribute = (node, name) => node.attrs?.find(item => item.name === name)?.value;
export function walk(root, visit) {
  let count = 0;
  function step(node, depth) {
    if (depth > 64 || ++count > 12000) throw new HttpError(422, 'Innehållet har för många eller för djupt nästlade element.');
    visit(node);
    for (const child of node.childNodes ?? []) step(child, depth + 1);
  }
  step(root, 0);
}
export function elements(root) {
  const nodes = [];
  walk(root, node => { if (node.tagName) nodes.push(node); });
  return nodes;
}
export function setInner(node, html) {
  node.childNodes = parseFragment(html).childNodes;
  for (const child of node.childNodes) child.parentNode = node;
}
