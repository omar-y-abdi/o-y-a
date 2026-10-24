import { escape } from './dom.mjs';
import { DEFAULT_EMAIL, renderEmail, resolveSlots } from '../../server/email-render.mjs';

// The owner's mail desk. Plain DOM, one module. Template edits go through the
// studio's change(), so draft, undo, backup and Save all apply; the server's
// 422 is the authority and `details.field` is a JSON path that this view maps
// back onto the field carrying the same `data-email-path`.
const SAMPLE = { name: 'Mira Test', email: 'mira@example.org', message: 'En fråga från provmejlet.' };
const EMAIL_PATH = /^(templates|sender|shell)\./;
const KINDS = { receipt: 'Kvitto till besökaren', notification: 'Avisering till dig' };
const TABS = [['receipt', KINDS.receipt], ['notification', KINDS.notification]];
const INVALID = Symbol('invalid');

const state = { tab: 'receipt', device: 'desktop' };
let ctx, root, observer, previewTimer;

export const isEmailField = path => typeof path === 'string' && EMAIL_PATH.test(path);

const emailOf = project => project.email ?? DEFAULT_EMAIL;
const keys = path => path.split(/[.\[\]]+/).filter(Boolean);
const setPath = (object, path, value) => { const parts = keys(path), last = parts.pop(); parts.reduce((node, key) => node[key], object)[last] = value; };
const panel = () => root.querySelector('[data-email-panel]');
const mounted = () => Boolean(root?.isConnected);

// Edits to project.email. The first edit starts from DEFAULT_EMAIL; an edit that
// changes nothing leaves the project (and its absent `email` key) untouched.
function update(mutate, group) {
  const project = ctx.project(), before = emailOf(project), next = structuredClone(before);
  mutate(next);
  if (JSON.stringify(next) !== JSON.stringify(before)) ctx.change({ ...project, email: next }, group);
}

const attrs = (path, type) => `data-email-path="${escape(path)}"${type ? ` data-email-type="${type}"` : ''}`;
const field = (label, path, control, hint = '') => `<div class="email-field" data-email-field="${escape(path)}"><label class="inspector-field"><span>${label}</span>${control}</label>${hint ? `<small class="email-hint">${hint}</small>` : ''}</div>`;
const textInput = (path, value, max) => `<input type="text" maxlength="${max}" value="${escape(value)}" ${attrs(path)}>`;

function templateHtml(kind) {
  const template = emailOf(ctx.project()).templates[kind], base = `templates.${kind}.`;
  return `<h2 class="email-panel-title">${KINDS[kind]}</h2>
${kind === 'receipt' ? `<label class="email-check"><input type="checkbox" role="switch" ${attrs(base + 'enabled', 'bool')} ${template.enabled ? 'checked' : ''}> Skicka kvitto till besökaren</label>` : ''}
${field('Ämne', base + 'subject', textInput(base + 'subject', template.subject, 200))}
${field('Förtext', base + 'preheader', textInput(base + 'preheader', template.preheader, 200), 'Den lilla raden som visas efter ämnet i inkorgen.')}
${kind === 'notification' ? '<p class="email-hint">Fält: {namn} {mejl} {meddelande}</p>' : ''}`;
}

const PANELS = { receipt: () => templateHtml('receipt'), notification: () => templateHtml('notification') };
const PREVIEWED = new Set(['receipt', 'notification']);

function previewMail() {
  const project = ctx.project();
  return renderEmail(emailOf(project), state.tab, { resources: resolveSlots(project.resources, ctx.assets()), origin: location.origin, visitor: SAMPLE });
}
const currentDesign = () => emailOf(ctx.project()).templates[state.tab].design;

// The frame is a fixed logical size, scaled down to the pane (as app.mjs preview() does).
function fitPreview() {
  const pane = root?.querySelector('[data-email-preview-pane]'), frame = pane?.querySelector('[data-email-preview-frame]');
  if (!frame || pane.hidden || !PREVIEWED.has(state.tab)) return;
  const mobile = state.device === 'mobile';
  const width = mobile ? 390 : Math.max(640, currentDesign().width + 120), height = mobile ? 844 : 960;
  const available = pane.clientWidth - 2;
  if (available <= 0) return;
  const scale = Math.min(1, available / width), box = frame.parentElement;
  box.style.width = `${Math.floor(width * scale) + 2}px`;
  box.style.height = `${Math.floor(height * scale) + 2}px`;
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.transform = `scale(${scale})`;
}

function renderPreview() {
  const pane = root.querySelector('[data-email-preview-pane]');
  if (pane.hidden) return;
  const failure = pane.querySelector('[data-email-preview-error]');
  let mail;
  try { mail = previewMail(); }
  catch (error) { failure.textContent = `Förhandsvisningen kunde inte skapas: ${error.message}`; failure.hidden = false; return; }
  failure.hidden = true;
  pane.querySelector('[data-email-preview-note]').textContent = 'Exempeluppgifter · samma mall som utskicket';
  pane.querySelector('[data-email-preview-subject]').textContent = mail.subject || '—';
  pane.querySelector('[data-email-preview-from]').textContent = mail.from;
  pane.querySelector('[data-email-preview-frame]').srcdoc = mail.html;
  fitPreview();
}
function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(() => { if (mounted()) renderPreview(); }, 150); }

function syncTabs() {
  for (const tab of root.querySelectorAll('[data-email-tab]')) {
    const on = tab.dataset.emailTab === state.tab;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
  }
  panel().setAttribute('aria-labelledby', `email-tab-${state.tab}`);
}

// `focus` picks the element to refocus after the panel is rebuilt.
function renderPanel(focus) {
  const stage = root.parentElement, top = stage?.scrollTop ?? 0, previewed = PREVIEWED.has(state.tab);
  panel().dataset.emailPanel = state.tab;
  root.querySelector('.email-layout').dataset.emailLayout = previewed ? 'form' : 'wide';
  root.querySelector('[data-email-preview-pane]').hidden = !previewed;
  panel().innerHTML = PANELS[state.tab]();
  if (previewed) renderPreview();
  if (stage) stage.scrollTop = top;
  focus?.(root)?.focus();
}

// The element for a JSON path, or the nearest ancestor path that has one.
function findField(path) {
  const nodes = [...root.querySelectorAll('[data-email-path],[data-email-field]')];
  for (let at = path; ;) {
    const hit = nodes.find(node => node.dataset.emailPath === at || node.dataset.emailField === at);
    if (hit) return hit;
    const parent = at.replace(/(\.[^.\[\]]+|\[\d+\])$/, '');
    if (parent === at) return null;
    at = parent;
  }
}

// Shows the server's message next to the field that carries `path`.
function markField(path, message) {
  for (const old of root.querySelectorAll('[data-email-error]')) old.remove();
  for (const old of root.querySelectorAll('[aria-invalid]')) old.removeAttribute('aria-invalid');
  const note = document.createElement('p');
  note.className = 'inline-error email-field-error';
  note.setAttribute('role', 'alert');
  note.dataset.emailError = '';
  note.textContent = message;
  const hit = findField(path);
  if (!hit) { panel().prepend(note); return; }
  const wrap = hit.closest('[data-email-field]') ?? hit;
  const control = hit.matches('input,select,textarea') ? hit : wrap.querySelector('input,select,textarea');
  wrap.append(note);
  control?.setAttribute('aria-invalid', 'true');
  wrap.scrollIntoView({ block: 'center' });
  control?.focus({ preventScroll: true });
}

// Save's 422 and mail errors arrive here with the server's JSON path.
export function showEmailError(path, message) {
  if (!mounted()) return;
  const tab = /^templates\.(receipt|notification)\b/.exec(path)?.[1];
  if (tab && tab !== state.tab) { state.tab = tab; syncTabs(); }
  renderPanel();
  markField(path, message);
}

function selectTab(id) {
  if (!PANELS[id]) return;
  state.tab = id;
  syncTabs();
  renderPanel();
}

function readField(element) {
  const type = element.dataset.emailType ?? 'text';
  if (type === 'bool') return element.checked;
  if (type === 'int' || type === 'level') {
    if (element.value.trim() === '' || !element.checkValidity()) return INVALID;
    const number = Number(element.value);
    return Number.isInteger(number) ? number : INVALID;
  }
  return element.value;
}

function onField(event) {
  const element = event.target, path = element.dataset?.emailPath;
  if (!path) return;
  const value = readField(element);
  if (value === INVALID) { element.setAttribute('aria-invalid', 'true'); return; }
  element.removeAttribute('aria-invalid');
  element.closest('[data-email-field]')?.querySelector('[data-email-error]')?.remove();
  if (EMAIL_PATH.test(path)) update(email => setPath(email, path, value), `email-${path}`);
  schedulePreview();
}

function onClick(event) {
  const button = event.target.closest('button');
  if (!button || !root.contains(button)) return;
  if (button.dataset.emailTab) return selectTab(button.dataset.emailTab);
  if ('emailBack' in button.dataset) return ctx.back();
  if (button.dataset.emailDevice) {
    state.device = button.dataset.emailDevice;
    for (const other of root.querySelectorAll('[data-email-device]')) other.setAttribute('aria-pressed', String(other === button));
    fitPreview();
  }
}

// Arrow keys move between tabs (vertical and horizontal layouts both work).
function onKeydown(event) {
  const tab = event.target.closest?.('[data-email-tab]');
  if (!tab) return;
  const tabs = [...root.querySelectorAll('[data-email-tab]')], at = tabs.indexOf(tab);
  const next = { ArrowDown: at + 1, ArrowRight: at + 1, ArrowUp: at - 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  const target = tabs[(next + tabs.length) % tabs.length];
  selectTab(target.dataset.emailTab);
  target.focus();
}

const shell = () => `<div class="special-heading"><div><p class="special-kicker">POSTLUCKAN</p><h1>Mejl från din webbplats</h1><p>Redigera text och utseende. Förhandsvisningen använder samma mall som utskicket.</p></div><button type="button" class="small-button" data-email-back><span aria-hidden="true">←</span> Tillbaka till sidan</button></div>
<div class="email-layout" data-email-layout="form">
<div class="email-tabs" role="tablist" aria-orientation="${matchMedia('(min-width:1100px)').matches ? 'vertical' : 'horizontal'}" aria-label="Mejlfunktioner">${TABS.map(([id, label]) => `<button type="button" role="tab" id="email-tab-${id}" data-email-tab="${id}" aria-controls="email-panel" aria-selected="false" tabindex="-1">${label}</button>`).join('')}</div>
<div class="email-panel" id="email-panel" role="tabpanel" tabindex="0" data-email-panel></div>
<aside class="email-preview" data-email-preview-pane aria-label="Förhandsvisning"><div class="email-preview-top"><div class="email-device" role="group" aria-label="Förhandsvisningens storlek"><button type="button" data-email-device="desktop" aria-pressed="${state.device === 'desktop'}">Dator</button><button type="button" data-email-device="mobile" aria-pressed="${state.device === 'mobile'}">Mobil</button></div><span class="email-preview-note" data-email-preview-note></span></div><div class="email-subject" data-email-subject-row><strong>Ämne:</strong> <span data-email-preview-subject></span><small data-email-preview-from></small></div><p class="inline-error" role="alert" data-email-preview-error hidden></p><div class="email-frame"><iframe sandbox="" title="Förhandsvisning av mejlet" data-email-preview-frame></iframe></div></aside>
</div>`;

// Called by showSpecial('email'). `context`: { project(), change(project, group), assets(), back() }.
export function mountEmail(stage, context) {
  ctx = context;
  observer?.disconnect();
  clearTimeout(previewTimer);
  root = document.createElement('div');
  root.className = 'email-view';
  root.innerHTML = shell();
  stage.replaceChildren(root);
  root.addEventListener('click', onClick);
  root.addEventListener('input', onField);
  root.addEventListener('change', onField);
  root.addEventListener('keydown', onKeydown);
  observer = new ResizeObserver(fitPreview);
  observer.observe(root.querySelector('[data-email-preview-pane]'));
  syncTabs();
  renderPanel();
  root.dataset.emailReady = 'true';
}

// Undo and redo replace the project under the view.
export function refreshEmail() { if (mounted()) renderPanel(); }
