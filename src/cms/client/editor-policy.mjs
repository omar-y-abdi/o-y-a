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
    resizable: managedSvg && tag === 'svg' ? false : tag === 'g' ? svgGroupResizeOptions(component) : isResizableComponent(component),
    // Canvas move can reparent/reorder. Structural movement belongs in Layers;
    // precise visual movement is exposed by the inspector nudge controls.
    toolbar: [],
  });
  return component;
}

export function applyStyleMode(editor, mode = 'normal') {
  const manager = editor.StyleManager;
  const definitions = mode === 'website' ? websiteStyleSectors : mode === 'svg' ? svgStyleSectors : normalStyleSectors;
  for (const sector of [...manager.getSectors({ array: true })]) manager.removeSector(sector.getId?.() ?? sector.get('id'));
  definitions.forEach((sector, at) => manager.addSector(sector.id, { ...sector }, { at }));
  return definitions;
}
