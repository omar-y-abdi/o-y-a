import { previewData } from '../../client/previewdata.mjs';

const data = previewData();
const win = document.querySelector('#cms-win-preview');
if (win && data?.cards.length === 1) {
  const { renderWin } = await import('../../client/win.mjs');
  renderWin(win, data.cards[0]);
}
document.addEventListener('submit', event => event.preventDefault(), true);
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || link.getAttribute('href').startsWith('#')) return;
  const url = new URL(link.getAttribute('href'), document.baseURI);
  event.preventDefault();
  if (url.origin === new URL(document.baseURI).origin) parent.postMessage({ type: 'oy-cms-navigate', path: url.pathname, hash: url.hash }, url.origin);
  else window.open(url.href, '_blank', 'noopener,noreferrer');
});
