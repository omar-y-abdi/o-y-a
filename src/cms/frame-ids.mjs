import parse from 'css-tree/parser';
import generate from 'css-tree/generator';
import walk from 'css-tree/walker';
import { ident } from 'css-tree/utils';
import { selectorId, checkAttributeIds } from './frame-id-selectors.mjs';

export function frameStyleIds(source) {
  const ids = new Set();
  if (source) walk(parse(source), node => { const id = selectorId(node); if (id !== undefined) ids.add(id); });
  return ids;
}

// Authoritative publication transformation. The smaller editor token adapter
// is checked against this AST implementation by differential regression tests.
export function mapFrameCss(source, ids) {
  if (!source || !ids.size) return source;
  const tree = parse(source, { parseCustomProperty: true });
  walk(tree, node => {
    const original = selectorId(node);
    if (node.type === 'AttributeSelector') checkAttributeIds(node, ids, generate(node));
    if (original !== undefined) {
      const attributeId = node.type === 'AttributeSelector';
      const target = ids.get(original);
      if (!target) return;
      if (target.id !== null && attributeId) node.value = { type: 'String', value: target.id };
      else if (target.id !== null) node.name = ident.encode(target.id);
      else Object.assign(node, parse(`[data-cms-frame-id="${target.key}"]`, { context: 'selector' }).children.first);
    }
    if (node.type === 'Url' && node.value.startsWith('#') && ids.has(node.value.slice(1))) {
      const target = ids.get(node.value.slice(1));
      if (target.id === null) throw new Error('En lokal CSS-referens i sidramen saknar ID på den här sidan.');
      node.value = '#' + target.id;
    }
  });
  return generate(tree);
}
