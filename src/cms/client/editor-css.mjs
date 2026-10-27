import { tokenize, tokenTypes } from 'css-tree/tokenizer';

const marker = '--cms-import-rule';
const groups = new Set(['media', 'supports', 'container', 'layer', 'starting-style']);

function header(rule) {
  let end = rule.cssText.length;
  tokenize(rule.cssText, (type, start) => { if (type === tokenTypes.LeftCurlyBracket && start < end) end = start; });
  return rule.cssText.slice(0, end).trim();
}
function declarations(rule) {
  return Object.fromEntries(Array.from(rule.style ?? [], name => [name,
    rule.style.getPropertyValue(name) + (rule.style.getPropertyPriority(name) ? ' !important' : '')]));
}

export function editorRuleGroups(rule) {
  const original = rule.get('cmsCssGroups') ?? [], current = rule.getAtRule();
  if (!original.length) return current ? [{ id: current, header: current }] : [];
  const result = original.slice();
  if (current !== result.at(-1).header) {
    result.pop();
    if (current) result.push({ id: rule.cid, header: current });
  }
  return result;
}
export function editorRuleBody(rule) {
  const original = rule.get('cmsCssNested');
  if (!original) return rule.get('cmsCssRaw') ?? rule.getDeclaration({ withNested: true });
  // CSSOM preserves child order, duplicate selectors, nested declarations and
  // anonymous layer identity. Grapes owns the editable outer declarations.
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(original);
  const node = sheet.cssRules[0];
  node.selectorText = rule.getSelectorsString();
  node.style.cssText = rule.styleToString({ important: rule.get('important') });
  return node.cssText;
}

export const editorRuleKey = rule => editorRuleGroups(rule).map(group => group.header).join('|') + '|' + (rule.get('cmsCssRaw') ?? rule.getSelectorsString());

// Canvas and publication snapshots share this ordering. GrapesJS's generator
// groups media rules and omits nesting by default; either changes the cascade.
// Group identity matters: two anonymous @layer blocks are two different layers.
export function editorCss(rules) {
  let css = '', opened = [];
  for (const rule of rules) {
    if (rule.isNested() || rule.get('shallow')) continue;
    const body = editorRuleBody(rule);
    if (!body) continue;
    const next = editorRuleGroups(rule);
    let common = 0;
    while (common < opened.length && common < next.length && opened[common].id === next[common].id) common++;
    css += '}'.repeat(opened.length - common);
    for (const group of next.slice(common)) css += group.header + '{';
    css += body;
    opened = next;
  }
  return css + '}'.repeat(opened.length);
}

export function installEditorCss(editor) {
  let pending, serial = 0, style, disposed = false, queued = false;
  const rules = editor.Css.getAll();
  function before(input) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(input.input);
    pending = [];
    const flat = [];
    function visit(list, parents = []) {
      for (const rule of list) {
        const name = /^@([\w-]+)/.exec(rule.cssText)?.[1];
        if (!rule.selectorText && rule.cssRules?.length && groups.has(name)) {
          visit(rule.cssRules, [...parents, { id: `css-group-${serial++}`, header: header(rule) }]);
          continue;
        }
        const item = { style: declarations(rule), groups: parents, selector: rule.selectorText };
        if (rule.selectorText && rule.cssRules?.length) item.nested = rule.cssText;
        if (!rule.selectorText) item.raw = rule.cssText;
        const index = pending.push(item) - 1;
        // The native Grapes parser still owns class/state selector models. Its
        // input has no nested structure that it could strip or reorder.
        flat.push(`${rule.selectorText || `[data-css-import="${serial++}"]`}{${marker}:${index}}`);
      }
    }
    visit(sheet.cssRules);
    input.input = flat.join('\n');
  }
  function parsed({ output, error }) {
    const source = pending;
    pending = undefined;
    if (error) throw error;
    const seen = new Set();
    for (let index = 0; index < output.length; index++) {
      const rule = output[index];
      const item = source?.[Number(rule.style[marker])];
      if (!item) throw new Error('Stilmallen kunde inte läsas utan att ändra ordningen.');
      if (item.nested && item.selector.includes(',')) {
        if (seen.has(item)) { output.splice(index--, 1); continue; }
        // Splitting a selector list changes nesting's maximum specificity.
        seen.add(item); rule.selectors = []; rule.selectorsAdd = item.selector;
      }
      rule.style = { ...item.style };
      if (item.nested) rule.cmsCssNested = item.nested;
      rule.cmsCssGroups = item.groups;
      if (item.raw !== undefined) rule.cmsCssRaw = item.raw;
      const last = item.groups.at(-1)?.header;
      if (last) {
        const match = /^@([\w-]+)\s*(.*)$/s.exec(last);
        rule.atRuleType = match[1]; rule.mediaText = match[2];
      }
    }
  }
  function render() {
    queued = false;
    if (disposed) return;
    const doc = editor.Canvas.getDocument();
    if (!doc?.head) return;
    if (!style || style.ownerDocument !== doc || !style.isConnected) {
      style?.remove();
      style = doc.createElement('style');
      style.dataset.cmsEditorStyles = '';
      doc.head.append(style);
    }
    if (doc.head.lastElementChild !== style) doc.head.append(style);
    const css = editorCss(rules.models);
    if (style.textContent !== css) style.textContent = css;
  }
  function schedule() { if (!queued && !disposed) { queued = true; queueMicrotask(() => { if (queued) render(); }); } }
  // Grapes's transient selected-state preview is canvas-only. Its shallow rule
  // still uses the native view; exported/owned CSS deliberately excludes it.
  const suppress = event => { if (!event.rule.get('shallow')) event.css = ''; schedule(); };
  editor.on('parse:css:before', before);
  editor.on('parse:css', parsed);
  editor.on('css:mount:before', suppress);
  editor.on('load canvas:frame:load', render);
  editor.on('selector:update', schedule);
  rules.on('add remove reset change', schedule);
  return { render, destroy() {
    disposed = true; style?.remove();
    editor.off('parse:css:before', before); editor.off('parse:css', parsed);
    editor.off('css:mount:before', suppress); editor.off('load canvas:frame:load', render);
    editor.off('selector:update', schedule); rules.off('add remove reset change', schedule);
  } };
}
