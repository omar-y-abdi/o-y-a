import { toBlob } from 'html-to-image';
import { defaultWinDesign } from '../content/win-design.mjs';

const surfaces = new WeakMap();
const set = (node, name, value) => { if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value, 'important'); };

export function renderWin(host, card) {
  const document = host.ownerDocument;
  const design = card.design ?? defaultWinDesign(card);
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const template = document.createElement('template');
  template.innerHTML = design.html;
  const content = template.content.firstElementChild;
  const text = content?.matches('[data-card-text]') ? content : content?.querySelector('[data-card-text]');
  if (!content || !text || !['DIV', 'SPAN', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'PRE', 'STRONG', 'EM', 'B', 'I'].includes(text.tagName)) throw new Error('Vinstens textbehållare stöds inte. Rätta designen i studion.');
  text.replaceChildren(...card.text.split('\n').flatMap((line, index) => [...(index ? [document.createElement('br')] : []), document.createTextNode(line)]));
  const viewport = document.createElement('cms-win-viewport');
  const frame = document.createElement('cms-win-fit');
  for (const node of [viewport, frame]) {
    node.style.cssText = 'all:initial!important;font:inherit!important;color:inherit!important;line-height:inherit!important;text-align:inherit!important;display:flow-root!important;position:relative!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;transform-origin:0 0!important;';
  }
  set(viewport, 'overflow', 'hidden');
  frame.append(content); viewport.append(frame);
  root.replaceChildren(viewport);
  const style = new document.defaultView.CSSStyleSheet();
  style.replaceSync(':host{display:block;position:relative;text-align:left}*{box-sizing:border-box}' + design.css);
  root.adoptedStyleSheets = [style];
  const state = { card: structuredClone(card), viewport, frame, content, disposed: false };
  state.fit = () => {
    if (state.disposed) return;
    state.layoutWidth = Math.max(1, host.clientWidth);
    set(frame, 'width', `${state.layoutWidth}px`);
    set(frame, 'transform', 'none');
    const origin = frame.getBoundingClientRect();
    const boxes = [content, ...content.querySelectorAll('*')].map(node => node.getBoundingClientRect()).filter(box => box.width || box.height);
    const left = Math.min(0, ...boxes.map(box => box.left - origin.left));
    const top = Math.min(0, ...boxes.map(box => box.top - origin.top));
    const right = Math.max(0, ...boxes.map(box => box.right - origin.left));
    const bottom = Math.max(0, ...boxes.map(box => box.bottom - origin.top));
    state.bounds = { left, top, width: Math.max(1, Math.ceil(right - left)), height: Math.max(1, Math.ceil(bottom - top)) };
    const scale = Math.min(1, state.layoutWidth / state.bounds.width);
    set(frame, 'transform', `translate(${-left * scale}px,${-top * scale}px) scale(${scale})`);
    set(viewport, 'height', `${state.bounds.height * scale}px`);
    set(viewport, 'width', `${state.layoutWidth}px`);
    set(host, 'height', `${state.bounds.height * scale}px`);
  };
  disposeWin(host);
  state.observer = new document.defaultView.ResizeObserver(state.fit);
  state.observer.observe(host); state.observer.observe(content);
  surfaces.set(host, state);
  state.fit();
  document.fonts.ready.then(() => state.fit());
  return content;
}

export function disposeWin(host) {
  const state = surfaces.get(host);
  if (state) { state.disposed = true; state.observer.disconnect(); surfaces.delete(host); }
}

export async function exportWin(host) {
  const document = host.ownerDocument;
  const source = surfaces.get(host);
  if (!source) throw new Error('Förhandsvisa vinsten innan den exporteras.');
  await document.fonts.ready;
  const clone = document.createElement('div');
  const inherited = document.defaultView.getComputedStyle(host);
  clone.style.cssText = `position:fixed;left:-100000px;top:0;width:${Math.max(1, host.clientWidth)}px;`;
  clone.style.font = inherited.font; clone.style.color = inherited.color;
  for (const name of Array.from(inherited)) if (name.startsWith('--')) clone.style.setProperty(name, inherited.getPropertyValue(name));
  document.body.append(clone);
  try {
    renderWin(clone, source.card);
    await document.fonts.ready;
    const state = surfaces.get(clone);
    state.fit(); state.observer.disconnect(); state.disposed = true;
    const { left, top, width, height } = state.bounds;
    if (width * 2 > 8192 || height * 2 > 8192 || width * height * 4 > 32000000) throw new Error('Vinstens export är för stor. Minska designens storlek före export.');
    set(state.frame, 'transform', `translate(${-left}px,${-top}px)`);
    set(state.viewport, 'width', `${width}px`); set(state.viewport, 'height', `${height}px`);
    // html-to-image clones inline shorthand priorities before computed styles.
    // Flatten our `all` reset on the disposable export surface so it cannot
    // reset the cloned fitting translation and clip the authored design.
    for (const node of [state.viewport, state.frame]) {
      const computed = document.defaultView.getComputedStyle(node);
      const values = Array.from(computed, name => [name, computed.getPropertyValue(name)]).filter(([name]) => name !== 'all');
      node.style.cssText = '';
      for (const [name, value] of values) node.style.setProperty(name, value, 'important');
    }
    const blob = await toBlob(state.viewport, { pixelRatio: 2, width, height, cacheBust: false });
    if (!blob) throw new Error('Image export returned no data');
    return blob;
  } finally { disposeWin(clone); clone.remove(); }
}
