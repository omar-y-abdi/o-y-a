import { toBlob } from 'html-to-image';
import { defaultWinDesign } from '../content/win-design.mjs';

const surfaces = new WeakMap();
export function renderWin(host, card) {
  const design = card.design ?? defaultWinDesign(card);
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  // HTML and CSS come only from the server-validated project or bundled seed.
  const template = document.createElement('template');
  template.innerHTML = design.html;
  root.replaceChildren(template.content.cloneNode(true));
  const style = new CSSStyleSheet();
  style.replaceSync(':host{display:block;position:relative;text-align:left}*{box-sizing:border-box}' + design.css);
  root.adoptedStyleSheets = [style];
  const text = root.querySelector('[data-card-text]');
  text.replaceChildren(...card.text.split('\n').flatMap((line, index) => [...(index ? [document.createElement('br')] : []), document.createTextNode(line)]));
  const content = root.firstElementChild;
  const fit = () => {
    content.style.transform = '';
    const scale = Math.min(1, host.clientWidth / Math.max(1, content.offsetWidth));
    const height = `${content.offsetHeight * scale}px`;
    if (host.style.height !== height) host.style.height = height;
    content.style.transformOrigin = '0 0';
    content.style.transform = `scale(${scale})`;
  };
  surfaces.get(host)?.disconnect();
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  observer.observe(content);
  surfaces.set(host, observer);
  fit();
  return content;
}

export async function exportWin(host) {
  const node = host.shadowRoot?.firstElementChild ?? host;
  const blob = await toBlob(node, { pixelRatio: 2, width: node.offsetWidth, height: node.offsetHeight, style: { transform: 'none', margin: '0' }, cacheBust: false });
  if (!blob) throw new Error('Image export returned no data');
  return blob;
}
