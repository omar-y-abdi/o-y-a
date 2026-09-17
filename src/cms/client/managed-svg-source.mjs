const PRESENTATION = new Set([
  'fill', 'fill-opacity', 'fill-rule', 'opacity', 'stroke', 'stroke-width', 'stroke-opacity',
  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset',
]);

function cssTranslate(value) {
  const match = String(value ?? '').trim().match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))px(?:\s+(-?(?:\d+(?:\.\d+)?|\.\d+))px)?$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] ?? 0)];
}

function components(root) {
  const result = [];
  const visit = component => { result.push(component); component.components?.().forEach(visit); };
  root.components?.().forEach(visit);
  return result;
}

export function materializeManagedSvg(html, editor) {
  const document = new DOMParser().parseFromString(html, 'image/svg+xml');
  const root = document.documentElement;
  if (root?.localName !== 'svg' || document.querySelector('parsererror')) throw new Error('SVG-källan kunde inte serialiseras säkert.');
  const nodes = [root, ...root.querySelectorAll('*')];
  const byId = new Map(nodes.filter(node => node.id).map(node => [node.id, node]));
  const byIdentity = new Map(nodes.map(node => [node.getAttribute('data-cms-node'), node]).filter(([id]) => id));
  for (const component of components(editor.getWrapper())) {
    const attrs = component.getAttributes?.() ?? {};
    const node = attrs.id ? byId.get(attrs.id) : attrs['data-cms-node'] ? byIdentity.get(attrs['data-cms-node']) : null;
    if (!node) continue;
    const style = component.getStyle?.() ?? {};
    for (const [property, value] of Object.entries(style)) if (PRESENTATION.has(property) && String(value).trim()) node.setAttribute(property, String(value).trim());
    const liveTransform = String(attrs.transform ?? '').trim();
    if (liveTransform) node.setAttribute('transform', liveTransform);
    const liveTranslate = cssTranslate(style.translate);
    if (liveTranslate && (liveTranslate[0] || liveTranslate[1])) {
      const transform = [node.getAttribute('transform'), `translate(${liveTranslate[0]} ${liveTranslate[1]})`].filter(Boolean).join(' ');
      node.setAttribute('transform', transform);
    }
    if (attrs['data-cms-translate']) node.setAttribute('data-cms-translate', String(attrs['data-cms-translate']).trim());
  }
  for (const node of nodes) {
    node.removeAttribute('data-cms-node');
    node.removeAttribute('style');
    for (const attribute of [...node.attributes]) if (attribute.name.startsWith('data-gjs-')) node.removeAttribute(attribute.name);
  }
  return new XMLSerializer().serializeToString(root);
}
