export function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
const paths = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  diagonal: '<path d="M6 18 18 6M6 6h12v12"/>',
  down: '<path d="M12 4v16m-6-6 6 6 6-6"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 8V4H4v11h4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14q4 5 8 0M9 8v2m6-2v2"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4c0-1 .3-2-.7-3 3 0 6-1.5 6-6 0-1.2-.4-2.3-1.2-3.2.1-.4.6-2-.1-3.8 0 0-1.2-.4-4 1.5a14 14 0 0 0-7 0C5 1.6 3.8 2 3.8 2c-.7 1.8-.2 3.4-.1 3.8A5 5 0 0 0 2.5 9c0 4.5 3 6 6 6-.8.8-.8 1.7-.8 3v4" transform="translate(2 0) scale(.85 1)"/>',
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
export function flower(cls = '') {
  const points = Array.from({ length: 32 }, (_, i) => { const r = i % 2 ? 37 : 48; const a = i * Math.PI / 16; return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`; }).join(' ');
  return `<svg class="flower ${cls}" width="100" height="100" viewBox="0 0 100 100" aria-hidden="true"><polygon points="${points}" fill="currentColor"/><g fill="var(--ink)"><ellipse cx="38" cy="42" rx="3.5" ry="6"/><ellipse cx="62" cy="42" rx="3.5" ry="6"/></g><path d="M34 58Q50 77 67 56" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" fill="none"/></svg>`;
}
export function machine({ workshop = false } = {}) {
  return `<div class="machine-stage ${workshop ? 'machine-stage--workshop' : ''}" data-machine>
    <span class="stage-doodle doodle-plus" aria-hidden="true">✳</span><span class="stage-doodle doodle-ring" aria-hidden="true"></span>
    <div class="machine-note" aria-hidden="true">Psst. Den funkar<br>på riktigt.<svg width="65" height="48" viewBox="0 0 65 48"><path d="M3 3Q55 0 48 36m-9-9 9 10 10-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
    <div class="machine-shadow" aria-hidden="true"></div>
    <div class="machine-body">
      <div class="machine-top"><span><i class="status-dot"></i> GLÄDJEVERKET</span><span>OY / 01</span></div>
      <div class="machine-display" aria-hidden="true">
        <span class="display-cross cross-1">+</span><span class="display-cross cross-2">+</span>
        <div class="display-orbit"></div><div class="joy-ball"><span class="ball-highlight"></span><span class="eye eye-left"><i></i></span><span class="eye eye-right"><i></i></span><span class="cheek cheek-left"></span><span class="cheek cheek-right"></span><span class="ball-smile"></span></div>
        <span class="display-caption">LITE MER :) I SYSTEMET</span>
      </div>
      <div class="machine-controls" aria-hidden="true"><div class="meter"><i></i><span>HUMÖR</span></div><div class="machine-label">SMÅ VINSTER<br><strong>STOR KNAPP.</strong></div><div class="knob"><i></i></div></div>
      <button class="machine-button" data-print disabled>${icon('smile')}<span>Ge mig en liten vinst</span>${icon('arrow')}</button>
      <div class="printer-slot" aria-hidden="true"></div>
      <span class="screw screw-1" aria-hidden="true"></span><span class="screw screw-2" aria-hidden="true"></span>
    </div>
    <div class="machine-lever" aria-hidden="true"><div class="lever-stick"></div><div class="lever-ball"></div><div class="lever-base"></div></div>
    <div class="receipt" hidden data-receipt>
      <button class="receipt-close" data-receipt-close aria-label="Stäng kvittot">${icon('close')}</button>
      <p class="receipt-kicker">EN LITEN VINST FRÅN OMAR</p>
      <p class="receipt-message" data-card-message></p>
      <div class="receipt-total"><span>Att betala</span><strong>Ett litet leende.</strong></div>
      <div class="receipt-barcode" aria-hidden="true"></div><p class="receipt-bottom">Spara känslan. Kvittot är valfritt.</p>
      ${workshop ? '' : '<a href="/verkstad/" class="receipt-link">Fler små vinster →</a>'}
    </div>
    <div class="machine-under"><span aria-hidden="true">↳</span> Inga mynt. Ingen motprestation.</div>
    <p class="sr-only" data-machine-status role="status" aria-live="polite" aria-atomic="true"></p>
    <noscript><p class="noscript-note">Maskinen behöver JavaScript. Här är en vinst ändå: du måste inte vara produktiv varje sekund.</p></noscript>
  </div>`;
}
export function breadcrumb(page) {
  return `<nav class="breadcrumb" aria-label="Brödsmulor"><a href="/">Hem</a><span aria-hidden="true">/</span><span aria-current="page">${escape(page.name)}</span></nav>`;
}
