import { ID_REFERENCES } from '../id-references.mjs';
import { mapCssReferences } from '../css-references.mjs';
import { resolveSiteLink } from '../routes.mjs';

export function remapClone(original, clone, editor) {
  const pairs = [];
  function pair(source, copy) {
    pairs.push([source, copy]);
    source.components().forEach((child, index) => pair(child, copy.components().at(index)));
  }
  pair(original, clone);
  const ids = new Map(pairs.map(([source, copy]) => [source.getId(), copy.getId()]));
  const copiedIds = new Set(ids.values());
  const id = value => ids.get(value) ?? value;
  const url = value => value.startsWith('#') ? '#' + id(value.slice(1)) : value;
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
      } else if (['style', 'fill', 'stroke', 'clip-path', 'mask', 'filter'].includes(name)) attrs[name] = mapCssReferences(String(value), { url });
    }
    copy.setAttributes(attrs);
    copy.setStyle(Object.fromEntries(Object.entries(copy.getStyle()).map(([name, value]) => [name, mapCssReferences(String(value), { url })])));
  }
  // GrapesJS copies component rules itself. Preserve those IDs and styles;
  // remap local URLs and add scoped copies of compound/global rules as needed.
  for (const rule of [...editor.Css.getAll().models]) {
    const selectors = rule.getSelectorsString();
    let belongsToClone = false;
    mapCssReferences(selectors, { selector: value => { belongsToClone ||= copiedIds.has(value); return value; } });
    const mappedSelectors = mapCssReferences(selectors, { selector: id });
    const style = Object.fromEntries(Object.entries(rule.getStyle()).map(([name, value]) => [name, mapCssReferences(String(value), { url })]));
    const changedStyle = JSON.stringify(style) !== JSON.stringify(rule.getStyle());
    if (belongsToClone) { if (changedStyle) rule.setStyle(style); continue; }
    if (mappedSelectors !== selectors || changedStyle) {
      const scoped = mappedSelectors !== selectors ? mappedSelectors : `#${CSS.escape(clone.getId())}:is(${selectors}),#${CSS.escape(clone.getId())} :is(${selectors})`;
      editor.Css.setRule(scoped, style, { atRuleType: rule.get('atRuleType'), atRuleParams: rule.get('mediaText') });
    }
  }
}
