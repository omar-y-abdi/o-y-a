import parse from 'css-tree/parser';
import generate from 'css-tree/generator';
import walk from 'css-tree/walker';
import { ident } from 'css-tree/utils';

const attributeName = node => ident.decode(node.name.name).toLowerCase();
const sensitive = node => !node.flags || ident.decode(node.flags).toLowerCase() === 's';
const selectorId = node => node.type === 'IdSelector' ? ident.decode(node.name)
  : node.type === 'AttributeSelector' && attributeName(node) === 'id' && node.matcher === '=' && sensitive(node)
    ? node.value.type === 'String' ? node.value.value : ident.decode(node.value.name) : undefined;

function matchesId(node, id) {
  if (id === null) return false;
  if (!node.matcher) return true;
  let value = node.value.type === 'String' ? node.value.value : ident.decode(node.value.name);
  if (!sensitive(node)) {
    const lower = text => text.replace(/[A-Z]/g, letter => letter.toLowerCase());
    id = lower(id); value = lower(value);
  }
  switch (node.matcher) {
    case '=': return id === value;
    case '^=': return !!value && id.startsWith(value);
    case '$=': return !!value && id.endsWith(value);
    case '*=': return !!value && id.includes(value);
    case '~=': return !!value && !/[\t\n\f\r ]/.test(value) && id.split(/[\t\n\f\r ]+/).includes(value);
    case '|=': return id === value || id.startsWith(value + '-');
    default: return true;
  }
}

export function frameStyleIds(source) {
  const ids = new Set();
  if (source) walk(parse(source), node => { const id = selectorId(node); if (id !== undefined) ids.add(id); });
  return ids;
}

// Shared by publication and the editor's reversible ID projection. Parse CSS
// tokens, so colours, comments, strings and escaped identifiers stay distinct.
export function mapFrameCss(source, ids) {
  if (!source || !ids.size) return source;
  const tree = parse(source, { parseCustomProperty: true });
  walk(tree, node => {
    const original = selectorId(node);
    if (node.type === 'AttributeSelector' && /(?:^|\|)id$/.test(attributeName(node)) && original === undefined) {
      // Prefixes, substring matching and case folding can select several nodes.
      // Rewriting their text as one alias would silently change that set.
      for (const [from, target] of ids) {
        if (from === target.id) continue;
        const before = matchesId(node, from), after = matchesId(node, target.id);
        if (before !== after) throw new Error(`CSS-väljaren ${generate(node)} kan ändra betydelse med sidramens äldre ID:n. Använd ett exakt ID eller en gemensam klass innan du fortsätter.`);
      }
    }
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
