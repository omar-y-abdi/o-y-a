import grapesjs from 'grapesjs';
import { fontFamilies } from '../theme.mjs';

const sectors = [
  { name: 'Layout & storlek', open: true, buildProps: ['display', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'overflow', 'flex-direction', 'justify-content', 'align-items', 'gap'], properties: [{ property: 'display', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none'].map(id => ({ id, label: id })) }] },
  { name: 'Typografi', open: true, buildProps: ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'color', 'text-decoration', 'text-transform'] },
  { name: 'Avstånd', open: false, buildProps: ['margin', 'padding'] },
  { name: 'Yta & kanter', open: false, buildProps: ['background-color', 'background', 'border', 'border-radius', 'box-shadow', 'opacity'] },
  { name: 'Position', open: false, buildProps: ['position', 'top', 'right', 'bottom', 'left', 'z-index', 'transform'] },
  { name: 'Rutnät & flex', open: false, properties: ['grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'flex-wrap', 'flex-grow', 'flex-shrink', 'order', 'row-gap', 'column-gap'] },
];

export function createEditor({ page, cssPath, assets, onChange, onSelect, onReady, onAssetPick }) {
  let disposed = false;
  let loading = true;
  let timer;
  const inspector = document.querySelector('#styles-panel');
  const blocksPanel = document.querySelector('#blocks-panel');
  const labelFields = () => { inspector.querySelectorAll('.gjs-sm-property').forEach(property => {
    const label = property.querySelector('.gjs-sm-label')?.textContent.trim();
    if (!label) return;
    property.querySelectorAll('input,select,button').forEach(control => {
      if (!control.getAttribute('aria-label')) control.setAttribute('aria-label', `${label}${control.closest('.gjs-field-units') ? ' enhet' : control.tagName === 'SELECT' ? ' val' : ''}`);
    });
  }); blocksPanel.querySelectorAll('.gjs-block').forEach(block => { block.setAttribute('role', 'button'); block.tabIndex = 0; block.setAttribute('aria-label', block.querySelector('.gjs-block-label')?.textContent ?? 'Lägg till block'); }); };
  const labels = new MutationObserver(labelFields);
  labels.observe(inspector, { childList: true, subtree: true });
  labels.observe(blocksPanel, { childList: true, subtree: true });
  const blockKeys = event => { if (['Enter', ' '].includes(event.key) && event.target.matches('.gjs-block')) { event.preventDefault(); event.target.click(); } };
  blocksPanel.addEventListener('keydown', blockKeys);
  const editor = grapesjs.init({
    container: '#editor', height: '100%', width: '100%',
    telemetry: false, cssIcons: '',
    storageManager: { type: null, autosave: false, autoload: false }, noticeOnUnload: false, panels: { defaults: [] },
    fromElement: false, avoidInlineStyle: true, protectedCss: '',
    selectorManager: { componentFirst: true },
    parser: { optionsHtml: { allowScripts: false, allowUnsafeAttr: false, allowUnsafeAttrValue: false } },
    canvas: { styles: [cssPath], scripts: [], frameContent: '<!doctype html><html lang="sv"><head></head><body></body></html>' },
    canvasCss: 'html{scroll-behavior:auto!important}body{margin:0!important}.gjs-dashed *[data-cms-node]{outline-offset:0}.js-only[hidden]{display:initial!important}',
    deviceManager: { devices: [{ id: 'desktop', name: 'Dator', width: '1440px', widthMedia: '' }, { id: 'mobile', name: 'Mobil', width: '390px', widthMedia: '760px' }] },
    layerManager: { appendTo: '#layers-panel' },
    traitManager: { appendTo: '#traits-panel' },
    styleManager: { appendTo: '#styles-panel', sectors },
    blockManager: { appendTo: '#blocks-panel', appendOnClick: true, blocks: [
      { id: 'section', label: 'Sektion', media: '▭', content: '<section style="padding:64px 40px;min-height:180px"><h2>Din nästa idé.</h2><p>Ge den lite plats.</p></section>' },
      { id: 'columns', label: 'Två kolumner', media: '▥', content: '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;padding:32px"><div style="min-height:100px"><h2>En tanke.</h2></div><div style="min-height:100px"><p>Och en till.</p></div></div>' },
      { id: 'heading', label: 'Rubrik', media: 'H₂', content: '<h2>Lite mer du.</h2>' },
      { id: 'text', label: 'Text', media: 'Aa', content: '<p>Här börjar något nytt.</p>' },
      { id: 'image', label: 'Bild', media: '▧', content: { type: 'image', attributes: { src: '/social/omar-yusuf.png', alt: 'Omar Yusufs gula figur på blå bakgrund' } } },
      { id: 'link', label: 'Knapp / länk', media: '↗', content: '<a href="/kontakt/" class="button button-ink">Säg hej ↗</a>' },
      { id: 'divider', label: 'Avdelare', media: '―', content: '<hr style="border:0;border-top:1px solid currentColor;margin:32px 0">' },
      { id: 'container', label: 'Behållare', media: '□', content: '<div style="padding:24px;min-height:100px"></div>' },
    ] },
    assetManager: { assets: assets.filter(asset => asset.mime.startsWith('image/')).map(asset => ({ src: asset.src, name: asset.name, width: asset.width, height: asset.height })), upload: false, custom: true },
  });
  const base = editor.DomComponents.getType('default');
  editor.on('block:click', () => { if (!editor.getSelected()) editor.select(editor.getWrapper().find('main')[0] ?? editor.getWrapper().components().at(0)); });
  editor.DomComponents.addType('default', { model: { defaults: { ...base.model.prototype.defaults, resizable: true } } });
  const fontProperty = editor.StyleManager.getProperty('typografi', 'font-family') ?? editor.StyleManager.getSectors().find(sector => sector.get('name') === 'Typografi')?.getProperty('font-family');
  fontProperty?.set('options', [...Object.entries(fontFamilies).map(([label, id]) => ({ id, label })), ...assets.filter(asset => asset.mime === 'font/woff2').map(asset => ({ id: `cms-font-${asset.id}`, label: asset.name }))]);
  editor.on('component:create', component => component.on('component:clone', clone => remapClone(component, clone, editor)));
  if (page.project) editor.loadProjectData(page.project);
  else {
    editor.setStyle(page.css);
    // Importing components extracts inline styles into GrapesJS rules.
    // Setting the stylesheet afterward would erase those imported rules.
    editor.setComponents(page.html);
  }
  editor.AssetManager.add(assets.filter(asset => asset.mime.startsWith('image/')).map(asset => ({ src: asset.src, name: asset.name, width: asset.width, height: asset.height })));
  editor.getWrapper().addAttributes({ id: 'top', class: page.bodyClass, 'data-page': page.path });
  if (page.bodyClass === 'page-win') editor.getWrapper().set('droppable', false);
  editor.setDevice('Dator');
  function snapshot(force = false) {
    if (disposed || loading || !force && editor.getDirtyCount() === 0) return null;
    const project = editor.getProjectData();
    project.assets = [];
    return { html: editor.getWrapper().getInnerHTML(), css: editor.getCss(), project };
  }
  function flush() {
    clearTimeout(timer);
    const value = snapshot();
    if (value) { onChange(value); editor.clearDirtyCount(); }
  }
  editor.on('load', () => {
    if (disposed) return;
    const doc = editor.Canvas.getDocument();
    const fontStyle = doc.createElement('style');
    fontStyle.textContent = assets.filter(asset => asset.mime === 'font/woff2').map(asset => `@font-face{font-family:"cms-font-${asset.id}";src:url(${asset.src}) format("woff2");font-display:swap}`).join('');
    doc.head.append(fontStyle);
    doc.documentElement.dataset.motion = 'off';
    doc.documentElement.classList.add('js-ready');
    doc.querySelectorAll('.js-only').forEach(node => { node.hidden = false; });
    doc.querySelectorAll('[data-memory-card],[data-print]').forEach(node => { node.disabled = false; });
    loading = false;
    editor.clearDirtyCount();
    onReady(editor);
  });
  editor.on('update', () => {
    if (disposed || loading) return;
    clearTimeout(timer);
    timer = setTimeout(flush, 250);
  });
  editor.on('component:selected', component => onSelect(component, editor));
  editor.on('component:deselected', () => { if (!editor.getSelected()) onSelect(null, editor); });
  editor.on('asset:custom', props => {
    if (!props.open || !onAssetPick) return;
    onAssetPick(asset => {
      const selected = editor.getSelected();
      if (selected) { selected.set('src', asset.src); selected.addAttributes({ src: asset.src, alt: asset.alt ?? '' }); }
      editor.AssetManager.close();
      flush();
    });
  });
  return { editor, flush, snapshot, destroy() { flush(); disposed = true; clearTimeout(timer); labels.disconnect(); blocksPanel.removeEventListener('keydown', blockKeys); editor.destroy(); } };
}
import { remapClone } from './clone.mjs';
