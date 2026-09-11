import { readConsent, consentCookie } from './privacy.mjs';

document.documentElement.classList.add('js-ready');
document.querySelectorAll('.js-only').forEach(element => { element.hidden = false; });
const root = document.documentElement;
const toastElement = document.querySelector('[data-toast]');
let toastTimer;
export function toast(message) {
  if (!toastElement) return;
  clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.hidden = false;
  toastTimer = setTimeout(() => { toastElement.hidden = true; }, 4800);
}

const menuButton = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('#mobile-menu');
function closeMenu(returnFocus = false) {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Öppna menyn');
  if (returnFocus) menuButton.focus();
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Stäng menyn' : 'Öppna menyn');
  menu.hidden = !open;
});
menu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu && !menu.hidden) closeMenu(true); });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches && menu) closeMenu(); });

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('[data-motion-toggle]');
let motionChoice = /(?:^|;\s*)oy_motion=off(?:;|$)/.test(document.cookie);
function applyMotion() {
  const off = reduced.matches || motionChoice;
  root.dataset.motion = off ? 'off' : 'auto';
  const label = reduced.matches ? 'Rörelser pausade av systeminställningen' : off ? 'Aktivera rörelser' : 'Pausa rörelser';
  motionButton?.setAttribute('aria-label', label);
  motionButton?.setAttribute('aria-pressed', String(off));
  if (motionButton) { motionButton.title = label; motionButton.disabled = reduced.matches; }
  window.dispatchEvent(new Event('oy:motionchange'));
}
motionButton?.addEventListener('click', () => {
  motionChoice = !motionChoice;
  document.cookie = `oy_motion=${motionChoice ? 'off' : 'on'}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  applyMotion();
  toast(motionChoice ? 'Rörelser pausade. Leken fungerar ändå.' : 'Rörelser aktiverade.');
});
reduced.addEventListener('change', applyMotion);
applyMotion();
document.addEventListener('visibilitychange', () => { root.dataset.background = String(document.hidden); });

const dialog = document.querySelector('[data-privacy-dialog]');
const banner = document.querySelector('[data-consent-banner]');
const status = document.querySelector('[data-privacy-status]');
let analyticsAvailable = false;
let sessionDenied = false;
let configChecked = false;
let returnTo = null;
const pending = new Set();
const sent = new Set();
const privacySignal = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
const canTrack = () => analyticsAvailable && !sessionDenied && !privacySignal() && readConsent(document.cookie) === 'allow';
export function track(event) {
  const page = document.body.dataset.page;
  const key = page + ':' + event;
  if (!canTrack() || sent.has(key) || page === '/404.html') return;
  sent.add(key);
  const controller = new AbortController();
  pending.add(controller);
  fetch('/api/event', {
    method: 'POST', credentials: 'same-origin', referrerPolicy: 'no-referrer', signal: controller.signal,
    headers: { 'Content-Type':'application/json', 'X-OY-Consent':'v1' }, body: JSON.stringify({ event, page }),
  }).catch(() => {}).finally(() => pending.delete(controller));
}
function updatePrivacyStatus() {
  if (!status) return;
  const choice = readConsent(document.cookie);
  status.textContent = privacySignal() ? 'Din webbläsare begär ingen spårning. Ingen frivillig statistik skickas.'
    : !configChecked ? 'Kontrollerar om statistik är aktiverad i den här installationen.'
    : !analyticsAvailable ? 'Statistik är inte aktiv i den här installationen. Inga statistikförfrågningar skickas.'
    : !sessionDenied && choice === 'allow' ? 'Ditt nuvarande val: statistik tillåts. Du kan ändra det här.'
    : sessionDenied || choice === 'deny' ? 'Ditt nuvarande val: bara nödvändiga inställningar. Ingen statistik skickas.'
    : 'Du har inte valt ännu. Ingen statistik skickas före ett ja.';
  document.querySelectorAll('[data-consent="allow"]').forEach(button => { button.disabled = !analyticsAvailable || privacySignal(); });
}
function openPrivacy(event) {
  returnTo = event.currentTarget;
  updatePrivacyStatus();
  dialog?.showModal();
}
document.querySelectorAll('[data-privacy-open]').forEach(button => button.addEventListener('click', openPrivacy));
document.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('close', () => { returnTo?.focus(); });
document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.consent;
  if (choice === 'allow' && (!analyticsAvailable || privacySignal())) return;
  if (choice === 'deny') {
    sessionDenied = true;
    for (const request of pending) request.abort();
    pending.clear();
  }
  let persisted = false;
  try {
    document.cookie = consentCookie(choice, location.protocol === 'https:');
    persisted = readConsent(document.cookie) === choice;
  } catch { /* Browser storage can be unavailable even after a user choice. */ }
  if (choice === 'allow' && persisted) sessionDenied = false;
  banner.hidden = true;
  if (dialog.open) dialog.close();
  updatePrivacyStatus();
  if (!persisted) toast(choice === 'deny' ? 'Valet kunde inte sparas. Statistik är pausad här. Kontrollera kakinställningarna innan du byter sida.' : 'Webbläsaren sparade inte ditt val. Ingen frivillig statistik skickas.');
  else toast(choice === 'allow' ? 'Tack. Bara enkel händelsestatistik, inga profiler.' : 'Bara nödvändiga. Precis som du valde.');
  if (choice === 'allow' && persisted) track('page_view');
}));
updatePrivacyStatus();
fetch('/api/config', { credentials:'same-origin', referrerPolicy:'no-referrer', signal:AbortSignal.timeout(4000) })
  .then(response => response.ok ? response.json() : null)
  .then(config => { analyticsAvailable = config?.analytics === true; })
  .catch(() => { analyticsAvailable = false; })
  .finally(() => {
    configChecked = true;
    updatePrivacyStatus();
    if (banner) banner.hidden = !analyticsAvailable || !!readConsent(document.cookie) || privacySignal();
    track('page_view');
  });

document.querySelectorAll('a[href="/projekt/furl/"]').forEach(link => link.addEventListener('click', () => track('project_open')));
const fold = document.querySelector('[data-fold]');
fold?.addEventListener('click', () => {
  const folded = fold.getAttribute('aria-pressed') !== 'true';
  fold.setAttribute('aria-pressed', String(folded));
  fold.childNodes[0].textContent = folded ? 'Vik ut ' : 'Vik ihop ';
  document.querySelectorAll('.repeat-line').forEach(line => { line.hidden = folded; });
  document.querySelector('.folded-line').hidden = !folded;
  document.querySelector('[data-fold-status]').textContent = folded ? 'Tre likadana rader är hopvikta. De finns kvar och visas med ”Vik ut”. En illustration, inte ett prestandatest.' : 'Alla rader visas. Detta är en illustration, inte en körning av Furl eller ett prestandatest.';
});

if (document.querySelector('[data-machine], [data-bubble]')) {
  import('./joy.mjs').then(module => module.initJoy({ toast, track })).catch(() => {
    const note = document.querySelector('[data-machine-status]');
    if (note) note.textContent = 'Maskinen kunde inte starta. Sidans vanliga länkar fungerar fortfarande.';
  });
}
