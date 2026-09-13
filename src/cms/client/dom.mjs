export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let toastTimer;
export function toast(message, error = false) {
  const node = $('#studio-toast');
  node.textContent = message;
  node.hidden = false;
  node.classList.toggle('is-error', error);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, error ? 12000 : 4200);
}
export function dialog(html) {
  $('#dialog-content').innerHTML = html;
  if (!$('#studio-dialog').open) $('#studio-dialog').showModal();
}
export function confirmAction({ title, message, action = 'Fortsätt', danger = false }) {
  return new Promise(resolve => {
    dialog(`<span class="dialog-eyebrow">ETT MEDVETET VAL</span><h2>${escape(title)}</h2><p>${escape(message)}</p><div class="dialog-buttons"><button type="button" class="small-button" data-confirm="no">Avbryt</button><button type="button" class="small-button ${danger ? 'danger' : 'primary'}" data-confirm="yes">${escape(action)}</button></div>`);
    const modal = $('#studio-dialog');
    function complete(value) { modal.removeEventListener('click', click); modal.removeEventListener('cancel', cancel); modal.close(); resolve(value); }
    function click(event) { const button = event.target.closest('[data-confirm]'); if (button) complete(button.dataset.confirm === 'yes'); }
    function cancel(event) { event.preventDefault(); complete(false); }
    modal.addEventListener('click', click);
    modal.addEventListener('cancel', cancel);
  });
}
export const field = (label, id, value, { textarea = false, type = 'text', readonly = false } = {}) => `<label class="inspector-field">${escape(label)}${textarea ? `<textarea id="${id}" ${readonly ? 'readonly' : ''}>${escape(value)}</textarea>` : `<input id="${id}" type="${type}" value="${escape(value)}" ${readonly ? 'readonly' : ''}>`}</label>`;
export const dateLabel = value => new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
