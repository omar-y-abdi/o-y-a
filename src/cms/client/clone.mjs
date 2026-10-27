import { ID_REFERENCES } from '../id-references.mjs';
import { hasCloneSelector, mapCloneCss } from './clone-css.mjs';
import { resolveSiteLink } from '../routes.mjs';
import { ensureComponentIdentity } from './view-state.mjs';
import { tokenize } from 'css-tree/tokenizer';
import { cssTokenIndex, tokenTypes as T } from './css-tokens.mjs';
import { editorRuleBody, editorRuleGroups } from './editor-css.mjs';
import { mapFrameCss } from './frame-css.mjs';
import { ident } from 'css-tree/utils';
import { selectorId } from '../frame-id-selectors.mjs';

const guarded = new WeakSet(), remapped = new WeakSet(), transactions = new WeakMap();
const descendants = component => [component, ...component.components().map(descendants).flat()];

// Restrict the selector's subject, retaining specificity and pseudo-elements.
// Token balances keep commas/colons inside :is(), strings and attributes intact.
function scopeSelector(source, cloneId) {
  const stream = cssTokenIndex(source), parts = [];
  let start = 0, pseudo;
  const finish = end => {
    const at = pseudo ?? end;
    parts.push(source.slice(start, at).trimEnd() + `:where(#${CSS.escape(cloneId)},#${CSS.escape(cloneId)} *)` + source.slice(at, end));
    start = end + 1; pseudo = undefined;
  };
  for (let index = 0; index < stream.tokenCount; index++) {
    const type = stream.getTokenType(index), at = stream.getTokenStart(index);
    if (stream.isBlockOpenerTokenType(type)) { index = stream.getBlockTokenPairIndex(index); continue; }
    if (type === T.Comma) finish(at);
    else if (type === T.Colon && pseudo === undefined) {
      const next = source.slice(stream.getTokenStart(index + 1), stream.getTokenEnd(index + 1));
      if (next === ':' || /^(before|after|first-line|first-letter)$/i.test(next)) pseudo = at;
    }
  }
  finish(source.length);
  return parts.join(',');
}

function ruleHeader(rule) {
  let end = rule.cssText.length;
  tokenize(rule.cssText, (type, start) => { if (type === T.LeftCurlyBracket && start < end) end = start; });
  return rule.cssText.slice(0, end).trim();
}
function mappedDeclarations(style, ids, changedOnly = false) {
  return Array.from(style ?? [], name => {
    const value = style.getPropertyValue(name), mapped = mapCloneCss(value, ids);
    return changedOnly && value === mapped ? '' : `${name}:${mapped}${style.getPropertyPriority(name) ? '!important' : ''};`;
  }).join('');
}
function containsAnonymousLayer(node) {
  return ruleHeader(node) === '@layer' || [...node.cssRules ?? []].some(containsAnonymousLayer);
}
function cloneCondition(header, ids) {
  if (mapCloneCss(header, ids) !== header) {
    const error = new Error('Stilmallens villkor använder en lokal URL som kopian skulle ändra. Använd ett villkor utan den lokala URL:en innan du duplicerar. Originalet är oförändrat.');
    error.code = 'CMS_CLONE_CONDITION';
    throw error;
  }
  return header;
}

// Copy an affected rule's declaration leaves in source order. Unchanged sibling
// leaves still participate in its cascade; scope each subject, not its ancestors,
// so copying a nested child cannot replay declarations onto the original parent.
function cloneRuleCss(rule, ids, cloneId, preflight = false) {
  if (rule.isNested() || rule.get('shallow')) return '';
  for (const group of editorRuleGroups(rule)) cloneCondition(group.header, ids);
  const raw = rule.get('cmsCssRaw');
  if (raw !== undefined) {
    if (mapCloneCss(raw, ids) !== raw) {
      const error = new Error('En gemensam CSS-definition använder en lokal URL till elementet som ska kopieras. Gör definitionen oberoende av den lokala URL:en innan du duplicerar. Originalet är oförändrat.');
      error.code = 'CMS_CLONE_GLOBAL';
      throw error;
    }
    return '';
  }
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(editorRuleBody(rule));
  const leaves = [];
  let affected = false;
  const targets = new Map([...ids].map(([from, id]) => [from, { id }]));
  const selectors = source => mapFrameCss(source + '{}', targets, preflight ? checkCloneAttribute : undefined).slice(0, -2);
  const wrap = (body, parents) => parents.reduceRight((value, parent) => `${parent.header}{${value}}`, body);
  function visit(node, parents = []) {
    if (node.selectorText) {
      const selector = node.selectorText, mapped = selectors(selector);
      affected ||= mapped !== selector;
      parents = [...parents, { header: mapped, style: true }];
    } else if (!node.style) {
      parents = [...parents, { header: cloneCondition(ruleHeader(node), ids) }];
    }
    affected ||= !!mappedDeclarations(node.style, ids, true);
    const body = mappedDeclarations(node.style, ids);
    if (body) leaves.push({ body, parents });
    for (const child of node.cssRules ?? []) visit(child, parents);
  }
  for (const node of sheet.cssRules) visit(node);
  if (!affected) return '';
  if ([...sheet.cssRules].some(containsAnonymousLayer)) refuseLayer();
  return leaves.map(({ body, parents }) => {
    const scoped = parents.slice(), index = scoped.findLastIndex(parent => parent.style);
    if (index < 0) return '';
    scoped[index] = { ...scoped[index], header: scopeSelector(scoped[index].header, cloneId) };
    return wrap(body, scoped);
  }).join('');
}
function refuseLayer() {
  const error = new Error('Elementet använder ett anonymt CSS-lager inuti sin stilregel och kan inte dupliceras utan att ändra stilordningen. Ge lagret ett namn innan du duplicerar. Originalet är oförändrat.');
  error.code = 'CMS_CLONE_LAYER';
  throw error;
}
function checkCloneAttribute(node) {
  // Unlike known frame aliases, Grapes allocates clone IDs during recursion.
  // A probe ID cannot prove that a prefix/suffix/casefold predicate is stable.
  if (!node.matcher || !/(?:^|\|)id$/.test(ident.decode(node.name.name).toLowerCase()) || selectorId(node) !== undefined) return;
  const error = new Error('Stilmallen använder en ID-väljare vars betydelse kan ändras när kopian får nya ID:n. Använd en gemensam klass eller ett exakt, skiftlägeskänsligt ID innan du duplicerar. Originalet är oförändrat.');
  error.code = 'CMS_CLONE_SELECTOR';
  throw error;
}

export function installCloneGuard(component, editor, onError) {
  if (guarded.has(component)) return;
  guarded.add(component);
  const original = component.clone;
  component.clone = function (...args) {
    let transaction = transactions.get(editor);
    if (!transaction) {
      const ids = new Map(descendants(this).map(node => [node.getId(), node.getId() + '-cms-copy-check']));
      try { for (const rule of editor.Css.getAll().models) cloneRuleCss(rule, ids, 'cms-copy-check', true); }
      catch (error) { if (onError) { error.reported = true; onError(error); } throw error; }
      transaction = { depth: 0, rules: new Set(editor.Css.getAll().models) };
      transactions.set(editor, transaction);
    }
    transaction.depth++;
    try { return original.apply(this, args); }
    finally { if (--transaction.depth === 0) transactions.delete(editor); }
  };
}

export function remapClone(original, clone, editor) {
  const transaction = transactions.get(editor);
  if (transaction?.depth > 1 || remapped.has(clone)) return false;
  const pairs = [];
  function pair(source, copy) {
    pairs.push([source, copy]);
    source.components().forEach((child, index) => pair(child, copy.components().at(index)));
  }
  pair(original, clone);
  const ids = new Map(pairs.map(([source, copy]) => [source.getId(), copy.getId()]));
  const copiedIds = new Set(ids.values());
  const id = value => ids.get(value) ?? value;
  const pagePath = editor.getWrapper().getAttributes()['data-page'] ?? '/';
  for (const [, copy] of pairs) {
    const attrs = { ...copy.getAttributes() };
    delete attrs['data-cms-node'];
    for (const [name, value] of Object.entries(attrs)) {
      if (ID_REFERENCES.has(name)) attrs[name] = value.trim().split(/\s+/).map(id).join(' ');
      else if (name === 'href') {
        try {
          const link = resolveSiteLink(value, pagePath, [location.origin]);
          if (link.kind === 'page' && link.path === pagePath && ids.has(link.hash)) attrs[name] = value.slice(0, value.indexOf('#')) + '#' + id(link.hash);
        } catch { /* Invalid intermediate links remain editable and fail Save. */ }
      } else if (['style', 'fill', 'stroke', 'clip-path', 'mask', 'filter'].includes(name)) attrs[name] = mapCloneCss(String(value), ids);
    }
    copy.setAttributes(attrs);
    ensureComponentIdentity(copy,{fresh:true});
    copy.setStyle(Object.fromEntries(Object.entries(copy.getStyle()).map(([name, value]) => [name, mapCloneCss(String(value), ids)])));
  }
  const collection = editor.Css.getAll(), sources = [...transaction?.rules ?? collection.models];
  // Replace Grapes's automatic ID-only copies once all descendant IDs are known.
  if (transaction) for (const rule of [...collection.models]) {
    if (!transaction.rules.has(rule) && hasCloneSelector(rule.getSelectorsString(), copiedIds)) collection.remove(rule);
  }
  for (const source of sources) {
    const css = cloneRuleCss(source, ids, clone.getId());
    if (!css) continue;
    const groups = editorRuleGroups(source);
    const copied = editor.Parser.parseCss(css).map(rule => ({ ...rule, cmsCssGroups: groups,
      atRuleType: source.get('atRuleType'), mediaText: source.get('mediaText') }));
    // Adjacent insertion keeps a top-level anonymous layer the same instance.
    // Collection.add also preserves duplicate selectors and nested contexts;
    // CssComposer.setRule merges them by an insufficient selector/media key.
    collection.add(copied, { at: collection.indexOf(source) + 1 });
  }
  for (const [, copy] of pairs) remapped.add(copy);
  return true;
}
