const win = document.querySelector('#cms-win-preview');
if (win) {
  const { renderWin } = await import('../../client/win.mjs');
  renderWin(win, JSON.parse(document.querySelector('#cms-win-data').textContent));
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
