import { ident } from 'css-tree/utils';

const attributeName = node => ident.decode(node.name.name).toLowerCase();
const sensitive = node => !node.flags || ident.decode(node.flags).toLowerCase() === 's';
export const selectorId = node => node.type === 'IdSelector' ? ident.decode(node.name)
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

export function checkAttributeIds(node, ids, label) {
  if (node.type !== 'AttributeSelector' || !/(?:^|\|)id$/.test(attributeName(node)) || selectorId(node) !== undefined) return;
  // Non-exact selectors stay unchanged; every changed node must still produce
  // the same predicate result. Unmapped nodes retain their original IDs.
  for (const [from, target] of ids) {
    if (from !== target.id && matchesId(node, from) !== matchesId(node, target.id)) throw new Error(`CSS-väljaren ${label} kan ändra betydelse med sidramens äldre ID:n. Använd ett exakt ID eller en gemensam klass innan du fortsätter.`);
  }
}
