import { isResizableComponent, svgGroupResizeOptions } from './position.mjs';

export const normalStyleSectors = [
  { id: 'layout', name: 'Layout & storlek', open: true, buildProps: ['display', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'overflow', 'flex-direction', 'justify-content', 'align-items', 'gap'], properties: [{ property: 'display', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none'].map(id => ({ id, label: id })) }] },
  { id: 'typografi', name: 'Typografi', open: true, buildProps: ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'color', 'text-decoration', 'text-transform'] },
  { id: 'spacing', name: 'Avstånd', open: false, buildProps: ['margin', 'padding'] },
  { id: 'surface', name: 'Yta & kanter', open: false, buildProps: ['background-color', 'background', 'border', 'border-radius', 'box-shadow', 'opacity'] },
  { id: 'position', name: 'Position', open: false, buildProps: ['position', 'top', 'right', 'bottom', 'left', 'z-index', 'transform'] },
  { id: 'layout-advanced', name: 'Rutnät & flex', open: false, buildProps: ['grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'flex-wrap', 'flex-grow', 'flex-shrink', 'order', 'row-gap', 'column-gap'] },
];

export const websiteStyleSectors = [
  { id: 'cms-color-text', name: 'Text & förgrund', open: true, buildProps: ['color', 'text-decoration-color'] },
  { id: 'cms-color-surface', name: 'Yta & ton', open: true, buildProps: ['background-color', 'background', 'opacity'] },
  { id: 'cms-color-border', name: 'Kanter', open: false, buildProps: ['border-color', 'outline-color'] },
  { id: 'cms-color-svg', name: 'SVG', open: false, buildProps: ['fill', 'stroke', 'stroke-width'] },
  { id: 'cms-color-effects', name: 'Djup & effekter', open: false, buildProps: ['box-shadow', 'text-shadow', 'filter'] },
];


export const svgStyleSectors = [
  { id: 'cms-svg-fill', name: 'Fyllning', open: true, buildProps: ['fill', 'fill-opacity', 'fill-rule', 'opacity'] },
  { id: 'cms-svg-stroke', name: 'Kontur', open: true, buildProps: ['stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset'] },
];

export function configureVisualComponent(component, { managedSvg = false } = {}) {
  const tag = String(component.get?.('tagName') ?? '').toLowerCase();
  component.set({
    resizable: managedSvg && tag === 'svg' ? false : tag === 'g' ? svgGroupResizeOptions(component) : isResizableComponent(component) && { currentUnit: 0, unitWidth: 'px', unitHeight: 'px' },
    // Canvas move can reparent/reorder. Structural movement belongs in Layers;
    // precise visual movement is exposed by the inspector nudge controls.
    toolbar: [],
  });
  return component;
}

// A drag writes px into the device's rule. Width caps at the container and
// height becomes a floor over `auto`, so one drag never fixes the box on other
// widths. `height: auto` also replaces a stored px height in the same rule.
export function responsiveResizeStyle(style, tag) {
  const next = { ...style };
  if (next.width && next.width !== 'auto') next.width = `min(${next.width},100%)`;
  if (next.height && next.height !== 'auto') {
    if (tag !== 'img') next['min-height'] = next.height;
    next.height = 'auto';
  }
  return next;
}

// Pasted content is plain text only: Word and Docs markup would fail validation
// or publish foreign inline styles. Line breaks become <br>.
export function pastedTextHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r\n|\r|\n/g, '<br>');
}

export function applyStyleMode(editor, mode = 'normal') {
  const manager = editor.StyleManager;
  const definitions = mode === 'website' ? websiteStyleSectors : mode === 'svg' ? svgStyleSectors : normalStyleSectors;
  for (const sector of [...manager.getSectors({ array: true })]) manager.removeSector(sector.getId?.() ?? sector.get('id'));
  definitions.forEach((sector, at) => manager.addSector(sector.id, { ...sector }, { at }));
  return definitions;
}
