import { $, escape, toast, dialog, confirmAction, dateLabel } from './dom.mjs';
import { api, send } from './api.mjs';
import { DEFAULT_EMAIL, FONTS, SENDING_DOMAIN, isEmailAddress, renderCustom, renderEmail, resolveSlots, senderAddress } from '../../server/email-render.mjs';
import { resourceSlots } from '../../content/resources.mjs';

// The owner's mail desk. Plain DOM, one module. Template edits go through the
// studio's change(), so draft, undo, backup and Save all apply; the server's
// 422 is the authority and `details.field` is a JSON path that this view maps
// back onto the field carrying the same `data-email-path`.
const SAMPLE = { name: 'Mira Test', email: 'mira@example.org', message: 'En fråga från provmejlet.' };
const EMAIL_PATH = /^(templates|sender|shell)\./;
const KINDS = { receipt: 'Kvitto till besökaren', notification: 'Avisering till dig' };
const TABS = [['receipt', KINDS.receipt], ['notification', KINDS.notification], ['compose', 'Skriv mejl'], ['sent', 'Skickade'], ['settings', 'Inställningar']];
const LISTS = [['to', 'Till'], ['cc', 'Kopia'], ['bcc', 'Dold kopia']];
const MAX_RECIPIENTS = 50, MAX_ATTACHMENTS = 10, MAX_UPLOAD = 31457280, MAX_ENCODED = 41943040;
const RESOURCE_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const INVALID = Symbol('invalid');
const MAX_BLOCKS = 40;
const COLORS = [['background', 'Bakgrund'], ['card', 'Kort'], ['band', 'Band'], ['bandText', 'Bandtext'], ['text', 'Text'], ['secondary', 'Sekundär'], ['accent', 'Accent'], ['border', 'Kant'], ['button', 'Knapp'], ['buttonText', 'Knapptext']];
const TEXT_COLORS = COLORS.filter(([key]) => ['text', 'secondary', 'accent', 'bandText'].includes(key));
const ALIGN = [['left', 'Vänster'], ['center', 'Mitten']];
const STYLED = new Set(['heading', 'label', 'text']);
const BAND_TYPES = ['heading', 'label', 'text', 'image'];
const MEDIA_PATH = /^\/media\/[0-9a-f-]{36}\.(png|jpg|gif)$/;

// New blocks are built in the validator's key order (id, type, section, then
// the type's fields), because projectChanges compares with JSON.stringify.
const look = (size, lineHeight, marginTop, marginBottom, letterSpacing, color) => ({ size, lineHeight, marginTop, marginBottom, letterSpacing, bold: false, color });
const ink = section => section === 'band' ? 'bandText' : 'text';
const TYPES = {
  heading: { name: 'Rubrik', icon: 'H', make: section => ({ level: 2, text: 'Ny rubrik', style: look(30, 33, 0, 22, -1, ink(section)) }) },
  label: { name: 'Etikett', icon: 'Aa', make: section => ({ text: 'ETIKETT', style: look(10, 16, 0, 12, 1, ink(section)) }) },
  text: { name: 'Text', icon: '¶', make: section => ({ text: 'Skriv något vänligt här.', style: look(16, 26, 0, 17, 0, ink(section)), rule: null }) },
  image: { name: 'Bild', icon: '▧', make: section => ({ src: 'emailStatic', msoSrc: null, alt: null, width: 96, height: 96, placement: section === 'band' ? 'beside' : 'block', align: 'left' }) },
  button: { name: 'Knapp', icon: '▭', make: () => ({ label: 'Läs mer', href: 'https://omaryusuf.se/', align: 'left' }) },
  divider: { name: 'Avdelare', icon: '—', make: () => ({ gap: 16 }) },
  receiptRow: { name: 'Rad med etikett och värde', icon: '≡', make: () => ({ label: 'Etikett', value: 'Värde' }) },
  visitor: { name: 'Besökarens uppgifter', icon: '☺', make: () => ({ fromLabel: 'FRÅN', messageLabel: 'MEDDELANDE', emptyMessage: 'Inget meddelande. Bara en öppen dörr till ett samtal.', emptyMessageText: 'Inget meddelande lämnades.' }) },
};

const state = { tab: 'receipt', device: 'desktop', selected: null, open: { design: false, text: false }, sent: null, sentError: '', status: {}, settings: null, settingsError: '' };
// Skriv mejl lives only here: never part of the project, never saved by Save.
let ctx, root, observer, previewTimer, sentLoad = null, settingsLoad = null, compose = null;

export const isEmailField = path => typeof path === 'string' && EMAIL_PATH.test(path);

const emailOf = project => project.email ?? DEFAULT_EMAIL;
const keys = path => path.split(/[.\[\]]+/).filter(Boolean);
const getPath = (object, path) => keys(path).reduce((node, key) => node?.[key], object);
const setPath = (object, path, value) => { const parts = keys(path), last = parts.pop(); parts.reduce((node, key) => node[key], object)[last] = value; };
const panel = () => root.querySelector('[data-email-panel]');
const mounted = () => Boolean(root?.isConnected);
const composing = () => compose ??= newCompose();
// The template-shaped object being edited: a draft template, or the compose state.
const target = () => state.tab === 'compose' ? composing() : emailOf(ctx.project()).templates[state.tab];
const basePath = () => state.tab === 'compose' ? '' : `templates.${state.tab}.`;
const withPath = (scope, path) => [...scope.querySelectorAll('[data-email-path]')].find(node => node.dataset.emailPath === path);
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const newId = blocks => { let id; do { id = Array.from(crypto.getRandomValues(new Uint8Array(8)), n => ID_CHARS[n % 36]).join(''); } while (blocks.some(block => block.id === id)); return id; };
const summary = block => String(block.type === 'receiptRow' ? `${block.label}: ${block.value}` : block.type === 'image' ? block.alt || resourceSlots[block.src]?.name || 'Bild' : block.type === 'divider' ? 'Avdelare' : block.type === 'visitor' ? 'Besökarens uppgifter' : block.text ?? block.label).replace(/\s+/g, ' ').slice(0, 40);

// Edits to project.email. The first edit starts from DEFAULT_EMAIL; an edit that
// changes nothing leaves the project (and its absent `email` key) untouched.
function update(edit, group) {
  const project = ctx.project(), before = emailOf(project), next = structuredClone(before);
  edit(next);
  if (JSON.stringify(next) !== JSON.stringify(before)) ctx.change({ ...project, email: next }, group);
}
// Structural edit of the open template, or of the compose state.
const mutate = (change, group = '') => state.tab === 'compose' ? change(composing()) : update(email => change(email.templates[state.tab]), group);

// An image that uses a resource slot may take the slot's own alt text (null);
// an uploaded image needs text of its own.
const isSlot = ref => ref === null || Object.hasOwn(resourceSlots, ref);
function fixAlt(object, path) {
  const match = /^(.*blocks\[\d+\])\.(src|msoSrc|alt)$/.exec(path);
  if (!match) return;
  const block = getPath(object, match[1]), slots = isSlot(block.src) && isSlot(block.msoSrc);
  if (slots && block.alt === '') block.alt = null;
  else if (!slots && block.alt === null) block.alt = '';
}
function commit(path, value) {
  const apply = object => { setPath(object, path, value); fixAlt(object, path); };
  if (EMAIL_PATH.test(path)) update(apply, `email-${path}`); else apply(composing());
}

// A starting point for Skriv mejl: the receipt's look, a band heading and a card text.
function newCompose() {
  const blocks = [];
  blocks.push({ id: newId(blocks), type: 'heading', section: 'band', ...TYPES.heading.make('band'), level: 1, text: 'Hej!' });
  blocks.push({ id: newId(blocks), type: 'text', section: 'card', ...TYPES.text.make('card'), text: 'Skriv ditt meddelande här.' });
  return { to: [], cc: [], bcc: [], subject: '', preheader: '', blocks, design: structuredClone(emailOf(ctx.project()).templates.receipt.design), scheduledAt: '', attachments: [], requestId: null, fingerprint: '' };
}

const attrs = (path, type) => `data-email-path="${escape(path)}"${type ? ` data-email-type="${type}"` : ''}`;
const field = (label, path, control, hint = '') => `<div class="email-field" data-email-field="${escape(path)}"><label class="inspector-field"><span>${label}</span>${control}</label>${hint ? `<small class="email-hint">${hint}</small>` : ''}</div>`;
const textInput = (path, value, max) => `<input type="text" maxlength="${max}" value="${escape(value)}" ${attrs(path)}>`;
const area = (path, value, max, rows = 3) => `<textarea rows="${rows}" maxlength="${max}" ${attrs(path)}>\n${escape(value)}</textarea>`;
const intInput = (path, value, min, max) => `<input type="number" inputmode="numeric" step="1" min="${min}" max="${max}" value="${escape(value)}" ${attrs(path, 'int')}>`;
const selectInput = (path, value, options, type) => `<select ${attrs(path, type)}>${options.map(([option, label]) => `<option value="${escape(option)}"${String(option) === String(value) ? ' selected' : ''}>${escape(label)}</option>`).join('')}</select>`;
const num = (label, path, value, min, max) => field(label, path, intInput(path, value, min, max));
const check = (label, path, checked, type = 'bool') => `<label class="email-check"><input type="checkbox" ${attrs(path, type)} ${checked ? 'checked' : ''}> ${label}</label>`;
const colorField = (label, path, value) => `<div class="email-field" data-email-field="${escape(path)}"><div class="inspector-field"><span>${label}</span><span class="field-color"><input type="color" value="${escape(value)}" aria-label="${label}, färgväljare" ${attrs(path, 'color')}><input type="text" maxlength="7" spellcheck="false" value="${escape(value)}" aria-label="${label}, hexkod" ${attrs(path, 'hex')}></span></div></div>`;
const group = (title, body) => `<fieldset class="email-group"><legend>${title}</legend><div class="email-fields">${body}</div></fieldset>`;

function imageOptions(current) {
  const slots = Object.entries(resourceSlots).map(([key, slot]) => [key, slot.name]);
  const media = ctx.assets().filter(asset => !asset.builtin && MEDIA_PATH.test(asset.src) && asset.publishedAt && (asset.state ?? 'active') === 'active').map(asset => [asset.src, asset.name]);
  const known = [...slots, ...media];
  return current === null || known.some(([value]) => value === current) ? known : [...known, [current, current]];
}

// `p(rel)` is the JSON path of a field of the block.
function blockFields(block, p) {
  switch (block.type) {
    case 'heading': return field('Nivå', p('level'), selectInput(p('level'), block.level, [[1, 'Stor rubrik'], [2, 'Rubrik']], 'level')) + field('Text', p('text'), area(p('text'), block.text, 200));
    case 'label': return field('Text', p('text'), textInput(p('text'), block.text, 120));
    case 'text': return field('Text', p('text'), area(p('text'), block.text, 2000, 5), 'Länk: [text](https://adress). Ny rad blir radbrytning.') + check('Streckad linje ovanför', p('rule'), block.rule, 'rule') + (block.rule ? num('Avstånd under linjen', p('rule.gap'), block.rule.gap, 0, 48) : '');
    case 'image': return field('Bild', p('src'), selectInput(p('src'), block.src, imageOptions(block.src))) + field('Bild för Outlook', p('msoSrc'), selectInput(p('msoSrc'), block.msoSrc ?? '', [['', 'Samma bild'], ...imageOptions(block.msoSrc)], 'nullable'), 'Outlook visar inte animerade bilder. Välj en stillbild här.') + field('Alternativtext', p('alt'), textInput(p('alt'), block.alt ?? '', 200), 'Tom text betyder bildens egen text. Bilder från Resurser behöver en egen.') + `<div class="email-fields">${num('Bredd', p('width'), block.width, 16, 560)}${num('Höjd', p('height'), block.height, 16, 560)}</div>` + field('Placering', p('align'), selectInput(p('align'), block.align, ALIGN));
    case 'button': return field('Knapptext', p('label'), textInput(p('label'), block.label, 120)) + field('Länk', p('href'), textInput(p('href'), block.href, 2000), 'Börjar med https: eller mailto:.') + field('Placering', p('align'), selectInput(p('align'), block.align, ALIGN));
    case 'divider': return num('Avstånd', p('gap'), block.gap, 0, 48);
    case 'receiptRow': return field('Etikett', p('label'), textInput(p('label'), block.label, 120)) + field('Värde', p('value'), textInput(p('value'), block.value, 120));
    case 'visitor': return field('Etikett för avsändaren', p('fromLabel'), textInput(p('fromLabel'), block.fromLabel, 60)) + field('Etikett för meddelandet', p('messageLabel'), textInput(p('messageLabel'), block.messageLabel, 60)) + field('Text när meddelande saknas', p('emptyMessage'), textInput(p('emptyMessage'), block.emptyMessage, 300)) + field('Text när meddelande saknas, textversion', p('emptyMessageText'), textInput(p('emptyMessageText'), block.emptyMessageText, 300));
    default: return '';
  }
}

const styleFields = (block, p) => num('Storlek', p('style.size'), block.style.size, 8, 64) + num('Radhöjd', p('style.lineHeight'), block.style.lineHeight, 10, 80) + num('Avstånd över', p('style.marginTop'), block.style.marginTop, 0, 80) + num('Avstånd under', p('style.marginBottom'), block.style.marginBottom, 0, 80) + num('Teckenavstånd', p('style.letterSpacing'), block.style.letterSpacing, -3, 6) + field('Färgroll', p('style.color'), selectInput(p('style.color'), block.style.color, TEXT_COLORS)) + check('Fet', p('style.bold'), block.style.bold);

function blockRow(block, index, template, base) {
  const open = state.selected === block.id, path = `${base}blocks[${index}]`, info = TYPES[block.type];
  const siblings = template.blocks.filter(other => other.section === block.section), at = siblings.indexOf(block);
  const removable = siblings.length > 1 && block.type !== 'visitor';
  return `<li class="email-block${open ? ' is-open' : ''}" data-email-block="${block.id}" data-email-field="${escape(path)}"><div class="email-block-bar"><button type="button" class="email-block-title" data-email-select aria-expanded="${open}" aria-controls="email-block-${block.id}"><span class="email-block-icon" aria-hidden="true">${info.icon}</span><span class="email-block-text">${escape(summary(block))}</span><small>${info.name}</small></button><span class="email-block-tools"><button type="button" data-email-move="up" aria-label="Flytta upp ${info.name.toLowerCase()}"${at === 0 ? ' disabled' : ''}>↑</button><button type="button" data-email-move="down" aria-label="Flytta ned ${info.name.toLowerCase()}"${at === siblings.length - 1 ? ' disabled' : ''}>↓</button><button type="button" data-email-remove aria-label="Ta bort ${info.name.toLowerCase()}"${removable ? '' : ' disabled'}>✕</button></span></div>${open ? `<div class="email-block-edit" id="email-block-${block.id}">${blockFields(block, rel => `${path}.${rel}`)}</div>` : ''}</li>`;
}

const allowedTypes = (section, template, kind) => Object.keys(TYPES).filter(type => section === 'band'
  ? BAND_TYPES.includes(type) && (type !== 'image' || !template.blocks.some(block => block.placement === 'beside'))
  : type !== 'visitor' || kind === 'notification' && !template.blocks.some(block => block.type === 'visitor'));

function blocksSection(template, base, kind) {
  const full = template.blocks.length >= MAX_BLOCKS;
  const part = (section, title) => {
    const rows = template.blocks.map((block, index) => block.section === section ? blockRow(block, index, template, base) : '').join('');
    return `<h4 class="email-section-title">${title}</h4><ul class="email-block-list" data-email-section="${section}">${rows}</ul><select class="email-add" data-email-add="${section}" aria-label="Lägg till block i ${section === 'band' ? 'bandet' : 'kortet'}"${full ? ' disabled' : ''}><option value="">＋ Lägg till block</option>${allowedTypes(section, template, kind).map(type => `<option value="${type}">${TYPES[type].name}</option>`).join('')}</select>`;
  };
  return `<section class="email-blocks" data-email-field="${base}blocks" aria-label="Block"><h3>Block</h3><p class="email-hint">${template.blocks.length} av högst ${MAX_BLOCKS} block. Bandet ligger överst, kortet under.</p>${part('band', 'Band')}${part('card', 'Kort')}</section>`;
}

function designHtml(kind, template, base) {
  const email = emailOf(ctx.project()), d = template.design, dp = `${base}design.`;
  const picked = template.blocks.findIndex(block => block.id === state.selected), block = template.blocks[picked];
  const blockGroup = !block ? '<p class="email-hint">Välj ett block i listan för att ändra dess text här.</p>'
    : STYLED.has(block.type) ? group(`Valt block · ${TYPES[block.type].name}`, styleFields(block, rel => `${base}blocks[${picked}].${rel}`))
    : '<p class="email-hint">Det valda blocket har inga textinställningar.</p>';
  const spacing = [['Sida, över och under', 'page.y', d.page.y], ['Sida, sidor', 'page.x', d.page.x], ['Band, över', 'bandPadding.top', d.bandPadding.top], ['Band, sidor', 'bandPadding.x', d.bandPadding.x], ['Band, under', 'bandPadding.bottom', d.bandPadding.bottom], ['Kort, över', 'cardPadding.top', d.cardPadding.top], ['Kort, sidor', 'cardPadding.x', d.cardPadding.x], ['Kort, under', 'cardPadding.bottom', d.cardPadding.bottom]];
  return `<details class="email-design" data-email-details="design"${state.open.design ? ' open' : ''}><summary>Aktivera design</summary><div class="email-design-body">${blockGroup}${group('Design', num('Bredd', dp + 'width', d.width, 480, 720) + num('Hörnradie', dp + 'radius', d.radius, 0, 32) + num('Knappens hörnradie', dp + 'buttonRadius', d.buttonRadius, 0, 24) + field('Typsnitt', dp + 'font', selectInput(dp + 'font', d.font, FONTS.map(font => [font, font.split(',')[0]]))))}${group('Luft', spacing.map(([label, rel, value]) => num(label, dp + rel, value, 0, 64)).join(''))}${group('Palett', COLORS.map(([key, label]) => colorField(label, `${dp}palette.${key}`, d.palette[key])).join(''))}${kind === 'compose' ? '' : group('Avsändare', field('Avsändarnamn', 'sender.name', textInput('sender.name', email.sender.name, 60)) + field('Avsändaradress', 'sender.local', `<span class="email-suffix"><input type="text" maxlength="64" spellcheck="false" value="${escape(email.sender.local)}" ${attrs('sender.local')}><span>@${SENDING_DOMAIN}</span></span>`, 'Gäller alla mejl härifrån.')) + group('Sidhuvud och sidfot', field('Varumärke', 'shell.brand', textInput('shell.brand', email.shell.brand, 40)) + field('Sidfotens rad', 'shell.tagline', textInput('shell.tagline', email.shell.tagline, 200), 'Gäller alla mejl härifrån.'))}</div></details>`;
}

function templateHtml(kind) {
  const template = target(), base = basePath(), textPath = `${base}text`;
  return `<h2 class="email-panel-title">${KINDS[kind]}</h2>
${kind === 'receipt' ? check('Skicka kvitto till besökaren', `${base}enabled`, template.enabled) : ''}
${designHtml(kind, template, base)}
${field('Ämne', `${base}subject`, textInput(`${base}subject`, template.subject, 200))}
${field('Förtext', `${base}preheader`, textInput(`${base}preheader`, template.preheader, 200), 'Den lilla raden som visas efter ämnet i inkorgen.')}
${kind === 'notification' ? '<p class="email-hint">Fält: {namn} {mejl} {meddelande}</p>' : ''}
${blocksSection(template, base, kind)}
<details class="email-text" data-email-details="text"${state.open.text ? ' open' : ''}><summary>Textversion</summary>${field('Textversion utan formatering', textPath, area(textPath, template.text, 10000, 8), 'Visas i mejlprogram som inte kan visa formatering.')}<button type="button" class="small-button" data-email-text-build>Skapa från blocken</button></details>
<div class="email-actions"><button type="button" class="small-button primary" data-email-test>Provmejl</button><span class="email-hint">Skickar mejlet med exempeluppgifter till din egen adress.</span></div>`;
}

const PANELS = { receipt: () => templateHtml('receipt'), notification: () => templateHtml('notification'), compose: composeHtml, sent: () => sentHtml(), settings: () => settingsHtml() };
const LOADERS = { sent: loadSent, settings: loadSettings };
const panelState = () => ({ sent: state.sentError ? 'error' : state.sent ? 'ready' : 'loading', settings: state.settingsError ? 'error' : state.settings ? 'ready' : 'loading' })[state.tab] ?? 'ready';
const PREVIEWED = new Set(['receipt', 'notification', 'compose']);

const minLocal = () => { const soon = new Date(Date.now() + 120000); return new Date(soon.getTime() - soon.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const encoded = bytes => 4 * Math.ceil(bytes / 3);
const megabytes = bytes => (bytes / 1048576).toFixed(1).replace('.', ',');
const recipientCount = mail => mail.to.length + mail.cc.length + mail.bcc.length;
const chipItems = (name, mail) => mail[name].map(address => `<li class="email-chip"><span>${escape(address)}</span><button type="button" data-email-chip-remove="${name}" data-email-address="${escape(address)}" aria-label="Ta bort ${escape(address)}">✕</button></li>`).join('');
const chipField = (name, label, mail) => `<div class="email-field" data-email-field="${name}"><span class="email-label" id="email-label-${name}">${label}</span><div class="email-chips"><ul class="email-chip-list" data-email-chip-list="${name}" aria-label="${label}, valda adresser">${chipItems(name, mail)}</ul><input type="text" inputmode="email" autocomplete="off" spellcheck="false" placeholder="namn@exempel.se" aria-labelledby="email-label-${name}" data-email-chip-input="${name}"></div></div>`;
const attachmentState = file => file.status === 'uploading' ? 'Laddar upp…' : file.status === 'error' ? file.message : file.kind === 'resource' ? 'Från Resurser' : 'Uppladdad';
const attachmentItems = mail => mail.attachments.map((file, index) => `<li class="email-attachment" data-email-attachment="${file.status}"><span class="email-attachment-name">${escape(file.name)}</span><small>${megabytes(file.bytes)} MB · ${escape(attachmentState(file))}</small><button type="button" data-email-attachment-remove="${index}" aria-label="Ta bort ${escape(file.name)}"${file.status === 'uploading' ? ' disabled' : ''}>✕</button></li>`).join('') || '<li class="email-hint">Inga bilagor.</li>';
function attachmentTotal(mail) {
  const files = mail.attachments.filter(file => file.status !== 'error'), bytes = files.reduce((sum, file) => sum + encoded(file.bytes), 0);
  return `${files.length} av högst ${MAX_ATTACHMENTS} bilagor · ${megabytes(bytes)} MB av 40 MB efter kodning${bytes > MAX_ENCODED ? '. Över gränsen.' : '.'} En fil från datorn kan skickas inom ett dygn efter uppladdningen.`;
}

function composeHtml() {
  const mail = composing(), email = emailOf(ctx.project());
  return `<h2 class="email-panel-title">Skriv mejl</h2>
<p class="email-hint">Från: ${escape(senderAddress(email))}. Avsändaren ändras under Kvitto eller Avisering. Utkastet finns bara här och sparas inte med webbplatsen.</p>
${LISTS.map(([name, label]) => chipField(name, label, mail)).join('')}
<p class="email-hint" data-email-count>${recipientCount(mail)}/${MAX_RECIPIENTS} mottagare</p>
${designHtml('compose', mail, '')}
${field('Ämne', 'subject', textInput('subject', mail.subject, 200))}
${field('Förtext', 'preheader', textInput('preheader', mail.preheader, 200), 'Den lilla raden som visas efter ämnet i inkorgen.')}
${blocksSection(mail, '', 'compose')}
<section class="email-attachments" data-email-field="attachments" aria-label="Bilagor"><h3>Bilagor</h3><div class="email-actions"><button type="button" class="small-button" data-email-pick-resource>Från Resurser</button></div><div class="email-field"><label class="inspector-field"><span>Från datorn</span><input type="file" multiple data-email-file></label></div><ul class="email-attachment-list" data-email-attachment-list>${attachmentItems(mail)}</ul><p class="email-hint" data-email-attachment-total>${attachmentTotal(mail)}</p></section>
${field('Schemalägg', 'scheduledAt', `<input type="datetime-local" min="${minLocal()}" value="${escape(mail.scheduledAt)}" ${attrs('scheduledAt')}>`, 'Lämna tomt för att skicka direkt. Ett schemalagt mejl kan avbrytas under Skickade tills det skickas.')}
<div class="email-actions"><button type="button" class="small-button primary" data-email-send>${mail.scheduledAt ? 'Schemalägg' : 'Skicka'}</button></div>`;
}

function renderChips() {
  const mail = composing();
  for (const [name] of LISTS) root.querySelector(`[data-email-chip-list="${name}"]`).innerHTML = chipItems(name, mail);
  root.querySelector('[data-email-count]').textContent = `${recipientCount(mail)}/${MAX_RECIPIENTS} mottagare`;
}
function renderAttachments() {
  if (!mounted() || state.tab !== 'compose') return;
  const mail = composing();
  root.querySelector('[data-email-attachment-list]').innerHTML = attachmentItems(mail);
  root.querySelector('[data-email-attachment-total]').textContent = attachmentTotal(mail);
}

// An address, or the reason it cannot be added.
function addAddress(name, token) {
  const mail = composing(), address = token.trim(), all = [...mail.to, ...mail.cc, ...mail.bcc];
  if (!isEmailAddress(address)) return `Ogiltig adress: ${address.slice(0, 80)}.`;
  if (all.some(other => other.toLowerCase() === address.toLowerCase())) return `${address} finns redan bland mottagarna.`;
  if (all.length >= MAX_RECIPIENTS) return 'Högst 50 mottagare sammanlagt (till, kopia och dold kopia).';
  mail[name].push(address);
  return null;
}

// Moves the typed addresses into chips. While typing only finished ones (followed
// by a separator) count; on Enter, comma, blur and send everything does. A
// refused address stays in the input with its reason.
function commitAddresses(name, all) {
  const input = root.querySelector(`[data-email-chip-input="${name}"]`);
  const tokens = input.value.split(/[\s,;]+/).filter(Boolean);
  const take = all || /[\s,;]$/.test(input.value) ? tokens : tokens.slice(0, -1), rest = tokens.slice(take.length);
  let failure = null;
  for (const [index, token] of take.entries()) {
    failure = addAddress(name, token);
    if (failure) { rest.unshift(...take.slice(index)); break; }
  }
  input.value = rest.join(', ');
  renderChips();
  if (failure) markField(name, failure, false);
  return failure;
}

function removeAddress(name, address) {
  const mail = composing();
  mail[name] = mail[name].filter(other => other !== address);
  renderChips();
  root.querySelector(`[data-email-chip-input="${name}"]`).focus();
}

function pickResource() {
  const mail = composing();
  const images = ctx.assets().filter(asset => !asset.builtin && asset.publishedAt && (asset.state ?? 'active') === 'active' && RESOURCE_MIMES.includes(asset.mime));
  dialog(`<span class="dialog-eyebrow">BILAGA FRÅN RESURSER</span><h2>Välj en bild.</h2><p>Bara publicerade bilder kan bifogas. En bild blir publicerad när den används på en sparad sida.</p>${images.length ? `<div class="asset-grid">${images.map(asset => `<button type="button" class="asset-card" data-email-resource="${escape(asset.id)}"${mail.attachments.some(file => file.id === asset.id) ? ' disabled' : ''}><div class="asset-image"><img src="${escape(asset.src)}" alt="${escape(asset.alt ?? '')}"></div><div class="asset-card-meta"><strong>${escape(asset.name)}</strong></div></button>`).join('')}</div>` : '<p>Det finns inga publicerade bilder än.</p>'}<div class="dialog-buttons"><button type="button" class="small-button" data-action="close-dialog">Stäng</button></div>`);
  for (const button of $('#dialog-content').querySelectorAll('[data-email-resource]')) button.addEventListener('click', () => {
    const asset = images.find(item => item.id === button.dataset.emailResource);
    mail.attachments.push({ kind: 'resource', id: asset.id, name: asset.name, bytes: asset.bytes ?? 0, status: 'ready', message: '' });
    $('#studio-dialog').close();
    renderAttachments();
  });
}

// Each file is uploaded on its own (E8); a failure marks that file only.
async function uploadFiles(files) {
  const mail = composing(), queue = [];
  for (const file of files) {
    const entry = { kind: 'upload', id: null, name: file.name, bytes: file.size, status: 'uploading', message: '' };
    const refusal = file.size > MAX_UPLOAD ? 'Bilagan får vara högst 30 MB.' : mail.attachments.filter(other => other.status !== 'error').length >= MAX_ATTACHMENTS ? 'Högst 10 bilagor per mejl.' : '';
    if (refusal) Object.assign(entry, { status: 'error', message: refusal }); else queue.push([file, entry]);
    mail.attachments.push(entry);
  }
  renderAttachments();
  for (const [file, entry] of queue) {
    try {
      const result = await send('/admin/api/mail/attachment', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-CMS-Request': '1', 'X-CMS-Filename': encodeURIComponent(file.name) }, body: file }, 'Filen kunde inte laddas upp.');
      Object.assign(entry, { id: result.id, bytes: result.size, status: 'ready' });
    } catch (error) { Object.assign(entry, { status: 'error', message: error.message }); }
    renderAttachments();
  }
}

async function removeAttachment(index) {
  const mail = composing(), file = mail.attachments[index];
  if (!file || file.status === 'uploading') return;
  if (file.kind === 'upload' && file.id) {
    try { await api('mail/attachment-remove', { id: file.id }); }
    catch (error) { if (error.status !== 404) throw error; }
  }
  mail.attachments.splice(mail.attachments.indexOf(file), 1);
  renderAttachments();
}

// A new requestId per send; a retry of the same content (after a 503 or a lost
// connection) reuses it, so Resend never sends the mail twice.
async function sendMail(button) {
  const mail = composing();
  for (const [name] of LISTS) if (commitAddresses(name, true)) return;
  const files = mail.attachments.filter(file => file.status === 'ready');
  if (mail.attachments.some(file => file.status === 'uploading')) return markField('attachments', 'Vänta tills alla bilagor har laddats upp.');
  if (!mail.to.length) return markField('to', 'Lägg till minst en mottagare.');
  if (!mail.subject.trim()) return markField('subject', 'Ämne saknas eller är för lång (högst 200 tecken).');
  if (files.reduce((sum, file) => sum + encoded(file.bytes), 0) > MAX_ENCODED) return markField('attachments', 'Bilagorna blir för stora för ett mejl (högst 40 MB efter kodning).');
  const time = mail.scheduledAt ? new Date(mail.scheduledAt) : null;
  if (time && Number.isNaN(time.getTime())) return markField('scheduledAt', 'Tiden är ogiltig.');
  const scheduledAt = time?.toISOString() ?? null, count = recipientCount(mail);
  if (!await confirmAction({ title: scheduledAt ? 'Schemalägg mejlet?' : 'Skicka mejlet?', message: `Mejlet "${mail.subject}" skickas till ${count} mottagare${scheduledAt ? ` ${dateLabel(scheduledAt)}` : ' direkt'}.`, action: scheduledAt ? 'Schemalägg' : 'Skicka' })) return;
  const body = { to: mail.to, cc: mail.cc, bcc: mail.bcc, subject: mail.subject, preheader: mail.preheader, blocks: mail.blocks, design: mail.design, scheduledAt, attachments: files.map(file => ({ kind: file.kind, id: file.id })) };
  const fingerprint = JSON.stringify(body);
  if (mail.fingerprint !== fingerprint) { mail.requestId = crypto.randomUUID(); mail.fingerprint = fingerprint; }
  await run(button, async () => {
    const result = await api('mail/send', { requestId: mail.requestId, ...body });
    compose = null;
    state.sent = null;
    state.status = {};
    toast(result.scheduledAt ? `Mejlet är schemalagt ${dateLabel(result.scheduledAt)}.` : 'Mejlet är skickat.');
    if (mounted() && state.tab === 'compose') { selectTab('sent'); root.querySelector('[data-email-tab=sent]').focus(); }
  });
}

// Skickade: the owner's own sends (E5), their live status (E6) and cancel (E7).
const KIND_LABEL = { custom: 'Mejl', test: 'Provmejl' };
const isFuture = item => Boolean(item.scheduledAt) && !item.canceledAt && Date.parse(item.scheduledAt) > Date.now();

function statusCell(item) {
  const status = state.status[item.id];
  if (item.canceledAt) return `Avbrutet ${dateLabel(item.canceledAt)}`;
  if (status?.phase === 'loading') return '<span role="status">Hämtar status…</span>';
  if (status?.phase === 'restricted') return `<span data-email-restricted>Nyckeln saknar behörighet för status och avbryt. <a href="https://resend.com/emails/${escape(encodeURIComponent(item.id))}" target="_blank" rel="noopener">Se utskicket i Resend</a>.</span>`;
  const text = status?.phase === 'done' ? `<strong data-email-status-label>${escape(status.label)}</strong>` : status?.phase === 'error' ? `<span class="email-status-error" role="alert">${escape(status.message)}</span>` : '';
  const cancelable = isFuture(item) && (status?.phase !== 'done' || status.status === 'scheduled');
  return `${text} <button type="button" class="small-button" data-email-check>${status ? 'Uppdatera' : 'Kolla status'}</button>${cancelable ? ' <button type="button" class="small-button danger" data-email-cancel>Avbryt</button>' : ''}`;
}

function sentRow(item) {
  const everyone = [...item.to, ...item.cc, ...item.bcc];
  return `<tr data-email-sent-id="${escape(item.id)}"><td data-label="Tid"><time datetime="${escape(item.createdAt)}">${dateLabel(item.createdAt)}</time></td><td data-label="Slag">${escape(KIND_LABEL[item.kind] ?? item.kind)}</td><td data-label="Till" title="${escape(everyone.join(', '))}">${escape(everyone[0] ?? '—')}${everyone.length > 1 ? ` +${everyone.length - 1}` : ''}</td><td data-label="Ämne">${escape(item.subject)}</td><td data-label="Schemalagd">${item.scheduledAt ? dateLabel(item.scheduledAt) : '—'}</td><td data-label="Status" data-email-status>${statusCell(item)}</td></tr>`;
}

const sentBody = () => state.sentError ? `<p class="inline-error" role="alert">${escape(state.sentError)}</p>`
  : !state.sent ? '<p class="email-hint" role="status">Hämtar utskicken…</p>'
  : !state.sent.length ? '<p class="email-hint">Inga utskick än. Skickade mejl och provmejl visas här.</p>'
  : `<div class="email-table-wrap"><table class="email-table" data-email-sent-table><thead><tr><th scope="col">Tid</th><th scope="col">Slag</th><th scope="col">Till</th><th scope="col">Ämne</th><th scope="col">Schemalagd</th><th scope="col">Status</th></tr></thead><tbody>${state.sent.map(sentRow).join('')}</tbody></table></div>`;

const sentHtml = () => `<div class="email-panel-head"><h2 class="email-panel-title">Skickade</h2><button type="button" class="small-button" data-email-refresh>Uppdatera listan</button></div><div data-email-sent-body>${sentBody()}</div>`;

function renderSentBody() {
  const body = root.querySelector('[data-email-sent-body]');
  if (!body || state.tab !== 'sent') return;
  body.innerHTML = sentBody();
  panel().dataset.emailState = panelState();
}

function renderStatus(id, refocus = false) {
  const row = [...root.querySelectorAll('[data-email-sent-id]')].find(node => node.dataset.emailSentId === id), item = state.sent?.find(entry => entry.id === id);
  if (!row || !item) return;
  const cell = row.querySelector('[data-email-status]');
  cell.innerHTML = statusCell(item);
  if (refocus) cell.querySelector('button')?.focus();
}

async function checkStatus(id, refocus = false) {
  state.status[id] = { phase: 'loading' };
  renderStatus(id);
  try {
    const result = await api(`mail/status?id=${encodeURIComponent(id)}`);
    state.status[id] = result.restricted ? { phase: 'restricted' } : { phase: 'done', status: result.status, label: result.label };
  } catch (error) { state.status[id] = { phase: 'error', message: error.message ?? 'Statusen kunde inte hämtas.' }; }
  renderStatus(id, refocus);
}

// A scheduled mail that has not left yet shows its status at once, so Avbryt is there when needed.
function checkScheduled() { for (const item of state.sent ?? []) if (isFuture(item) && !state.status[item.id]) checkStatus(item.id); }

function loadSent() {
  if (state.sent) return checkScheduled();
  sentLoad ??= api('mail/sent').then(
    ({ items }) => { state.sent = items; state.sentError = ''; },
    error => { state.sentError = error.message ?? 'Utskicken kunde inte hämtas.'; },
  ).then(() => {
    sentLoad = null;
    if (mounted() && state.tab === 'sent') { renderSentBody(); checkScheduled(); }
  });
}

async function cancelSend(id, button) {
  const item = state.sent?.find(entry => entry.id === id);
  if (!item || !await confirmAction({ title: 'Avbryt utskicket?', message: `Mejlet "${item.subject}" är schemalagt ${dateLabel(item.scheduledAt)}. Om du avbryter skickas det inte.`, action: 'Avbryt utskicket', danger: true })) return;
  await run(button, async () => {
    const result = await api('mail/cancel', { id });
    if (result.restricted) state.status[id] = { phase: 'restricted' };
    else { item.canceledAt = result.canceledAt; delete state.status[id]; toast('Utskicket är avbrutet.'); }
    renderStatus(id, true);
  });
}

// Inställningar: the encrypted mail and form settings (E1, E2). Secrets are never
// shown again, never kept in the DOM after a save, and never leave this module
// except in the request that saves them.
const SETTINGS = [['RESEND_API_KEY', 'Resend-nyckel', 'password'], ['CONTACT_TO', 'Mottagare', 'text'], ['TURNSTILE_SITE_KEY', 'Robotskydd, webbplatsnyckel', 'text'], ['TURNSTILE_SECRET_KEY', 'Robotskydd, hemlig nyckel', 'password']];

function settingText(entry) {
  if (entry.state === 'environment') return '✓ Från miljön';
  if (entry.state === 'unreadable') return '⚠ Kan inte läsas. Klistra in igen.';
  if (entry.state !== 'saved') return '✕ Saknas';
  const bits = [entry.hint && `…${entry.hint}`, entry.updatedAt && dateLabel(entry.updatedAt)].filter(Boolean);
  return `✓ Sparad${bits.length ? ` (${bits.join(', ')})` : ''}`;
}

// `kind` and `text` come from the server's view of the settings and are escaped here;
// `link` is code-owned markup appended after the text.
const settingRow = (name, label, kind, text, link = '') => `<li class="email-setting" data-email-setting="${name}"><span class="email-setting-name">${label}</span><span class="email-setting-state" data-email-setting-state="${escape(kind)}">${escape(text)}${link}</span></li>`;
const clearButton = name => root.querySelector(`[data-email-clear="${name}"]`);
const settingInput = name => root.querySelector(`[data-email-setting-input="${name}"]`);
const settingValue = name => state.settings.values[name].value ?? '';

function settingsBody() {
  const view = state.settings;
  if (state.settingsError) return `<p class="inline-error" role="alert">${escape(state.settingsError)}</p><button type="button" class="small-button" data-email-retry>Försök igen</button>`;
  if (!view) return '<p class="email-hint" role="status">Hämtar inställningarna…</p>';
  const missing = [...SETTINGS.filter(([name]) => ['missing', 'unreadable'].includes(view.values[name].state)).map(([, label]) => label.toLowerCase()), ...view.master === 'ok' ? [] : ['huvudnyckel'], ...view.rateLimit ? [] : ['hastighetsgräns']];
  const rows = SETTINGS.map(([name, label]) => settingRow(name, label, view.values[name].state, settingText(view.values[name]))).join('')
    + settingRow('master', 'Huvudnyckel', view.master, view.master === 'ok' ? '✓ Finns' : '✕ Saknas. Inget kan sparas.')
    + settingRow('rateLimit', 'Hastighetsgräns', view.rateLimit ? 'ok' : 'missing', view.rateLimit ? '✓ Aktiv' : '✕ Saknas')
    + settingRow('forwarding', 'Vidarebefordran', 'info', 'Ställs in i Cloudflare. ', '<a href="https://dash.cloudflare.com/" target="_blank" rel="noopener">Öppna Cloudflare</a>');
  const fields = SETTINGS.map(([name, label, kind]) => `<div class="email-field email-setting-field" data-email-field="${name}"><label class="inspector-field"><span>${label}</span><input type="${kind}" autocomplete="off" autocapitalize="off" spellcheck="false"${kind === 'password' ? ' placeholder="Klistra in en ny nyckel"' : ` inputmode="email" value="${escape(settingValue(name))}"`} data-email-setting-input="${name}"></label><button type="button" class="small-button" data-email-clear="${name}" aria-pressed="false">Töm</button></div>`).join('');
  return `<p class="email-banner" data-email-banner="${view.ready ? 'open' : 'closed'}" role="status">${view.ready ? 'Formuläret är öppet' : `Formuläret är stängt${missing.length ? `: ${escape(missing.join(', '))}` : ''}`}</p><ul class="email-settings-list" data-email-settings-list>${rows}</ul><div class="email-settings-form">${fields}<div class="email-actions"><button type="button" class="small-button primary" data-email-save-settings${view.master === 'ok' ? '' : ' disabled'}>Spara inställningar</button><span class="email-hint">${view.master === 'ok' ? 'Nycklar sparas krypterade och visas aldrig igen. Orörda fält behålls.' : 'Huvudnyckeln saknas, så inget kan sparas.'}</span></div></div>`;
}

const settingsHtml = () => `<h2 class="email-panel-title">Inställningar</h2><div data-email-settings-body>${settingsBody()}</div>`;

function renderSettingsBody() {
  const body = root.querySelector('[data-email-settings-body]');
  if (!body || state.tab !== 'settings') return;
  body.innerHTML = settingsBody();
  panel().dataset.emailState = panelState();
}

function loadSettings() {
  if (state.settings || state.settingsError) return;
  settingsLoad ??= api('contact').then(
    view => { state.settings = view; },
    error => { state.settingsError = error.message ?? 'Inställningarna kunde inte hämtas.'; },
  ).then(() => { settingsLoad = null; if (mounted()) renderSettingsBody(); });
}

// "Töm" marks a field to be cleared on save ('' deletes the saved value).
function toggleClear(name, button) {
  const on = button.getAttribute('aria-pressed') !== 'true', input = settingInput(name);
  button.setAttribute('aria-pressed', String(on));
  button.textContent = on ? 'Ångra' : 'Töm';
  input.disabled = on;
  input.value = on || input.type === 'password' ? '' : settingValue(name);
}

// Only the fields the owner changed are sent.
async function saveSettings(button) {
  const values = {};
  for (const [name, , kind] of SETTINGS) {
    const typed = settingInput(name).value.trim();
    if (clearButton(name).getAttribute('aria-pressed') === 'true') values[name] = '';
    else if (kind === 'password' ? typed !== '' : typed !== settingValue(name)) values[name] = typed;
  }
  if (!Object.keys(values).length) return toast('Det finns inget att spara.');
  await run(button, async () => {
    state.settings = await api('contact', { values });
    toast('Inställningarna är sparade.');
    renderSettingsBody();
    root.querySelector('[data-email-save-settings]')?.focus();
  });
}

function previewMail() {
  const project = ctx.project(), options = { resources: resolveSlots(project.resources, ctx.assets()), origin: location.origin };
  if (state.tab === 'compose') { const { subject, preheader, blocks, design } = composing(); return renderCustom({ subject, preheader, blocks, design }, emailOf(project), options); }
  return renderEmail(emailOf(project), state.tab, { ...options, visitor: SAMPLE });
}

// The frame is a fixed logical size, scaled down to the pane (as app.mjs preview() does).
function fitPreview() {
  const pane = root?.querySelector('[data-email-preview-pane]'), frame = pane?.querySelector('[data-email-preview-frame]');
  if (!frame || pane.hidden || !PREVIEWED.has(state.tab)) return;
  const mobile = state.device === 'mobile';
  const width = mobile ? 390 : Math.max(640, target().design.width + 120), height = mobile ? 844 : 960;
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
  pane.querySelector('[data-email-preview-note]').textContent = state.tab === 'compose' ? 'Så här ser mejlet ut hos mottagaren' : 'Exempeluppgifter · samma mall som utskicket';
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
  panel().dataset.emailState = panelState();
  if (previewed) renderPreview();
  LOADERS[state.tab]?.();
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
function markField(path, message, focus = true) {
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
  if (!focus) return;
  wrap.scrollIntoView({ block: 'center' });
  control?.focus({ preventScroll: true });
}

// Save's 422 and the mail errors arrive here with the server's JSON path. The
// view first moves to the tab, block and design group that hold the field.
export function showEmailError(path, message) {
  if (!mounted()) return;
  const before = [state.tab, state.selected, state.open.design].join();
  const tab = /^templates\.(receipt|notification)\b/.exec(path)?.[1];
  if (tab) state.tab = tab;
  else if (/^(sender|shell)\./.test(path) && !KINDS[state.tab]) state.tab = 'receipt';
  const index = /(?:^|\.)blocks\[(\d+)\]/.exec(path)?.[1], block = index === undefined || !PREVIEWED.has(state.tab) ? undefined : target().blocks[index];
  if (block) state.selected = block.id;
  if (/(^|\.)(design|style)\b|^(sender|shell)\./.test(path)) state.open.design = true;
  if ([state.tab, state.selected, state.open.design].join() !== before) { syncTabs(); renderPanel(); }
  markField(path, message);
}

function selectTab(id) {
  if (!PANELS[id]) return;
  state.tab = id;
  state.selected = null;
  syncTabs();
  renderPanel();
}

function readField(element) {
  const type = element.dataset.emailType ?? 'text';
  if (type === 'bool') return element.checked;
  if (type === 'rule') return element.checked ? { gap: 18 } : null;
  if (type === 'nullable') return element.value === '' ? null : element.value;
  if (type === 'color') return element.value.toLowerCase();
  if (type === 'hex') { const hex = element.value.trim().toLowerCase(); return /^#[0-9a-f]{6}$/.test(hex) ? hex : INVALID; }
  if (type === 'int' || type === 'level') {
    if (element.value.trim() === '' || !element.checkValidity()) return INVALID;
    const number = Number(element.value);
    return Number.isInteger(number) ? number : INVALID;
  }
  return element.value;
}

function onField(event) {
  const element = event.target;
  if (element.dataset?.emailAdd !== undefined) { if (element.value) addBlock(element.dataset.emailAdd, element.value); return; }
  const chips = element.dataset?.emailChipInput;
  if (chips) { root.querySelector(`[data-email-field="${chips}"] [data-email-error]`)?.remove(); commitAddresses(chips, event.type === 'change'); return; }
  if (element.dataset?.emailFile !== undefined) { const files = [...element.files]; element.value = ''; if (files.length) uploadFiles(files).catch(report); return; }
  const path = element.dataset?.emailPath;
  if (!path) return;
  const value = readField(element);
  if (value === INVALID) { element.setAttribute('aria-invalid', 'true'); return; }
  element.removeAttribute('aria-invalid');
  element.closest('[data-email-field]')?.querySelector(':scope > [data-email-error]')?.remove();
  commit(path, value);
  const pair = element.closest('.field-color');
  if (pair) for (const other of pair.querySelectorAll('input')) if (other !== element) other.value = value;
  const index = /blocks\[(\d+)\]/.exec(path)?.[1], block = index === undefined ? undefined : target().blocks[index];
  if (block) { const label = root.querySelector(`[data-email-block="${block.id}"] .email-block-text`); if (label) label.textContent = summary(block); }
  if (path === 'scheduledAt') root.querySelector('[data-email-send]').textContent = value ? 'Schemalägg' : 'Skicka';
  if (element.dataset.emailType === 'rule') return renderPanel(scope => withPath(scope, path));
  schedulePreview();
}

function toggleBlock(id) {
  state.selected = state.selected === id ? null : id;
  renderPanel(scope => scope.querySelector(`[data-email-block="${id}"] [data-email-select]`));
}

function addBlock(section, type) {
  const template = target();
  if (!allowedTypes(section, template, state.tab).includes(type) || template.blocks.length >= MAX_BLOCKS) return;
  const block = { id: newId(template.blocks), type, section, ...TYPES[type].make(section) };
  const at = section === 'band' ? template.blocks.filter(other => other.section === 'band').length : template.blocks.length;
  mutate(next => next.blocks.splice(at, 0, block));
  state.selected = block.id;
  renderPanel(scope => scope.querySelector(`[data-email-block="${block.id}"] .email-block-edit [data-email-path]`) ?? scope.querySelector(`[data-email-block="${block.id}"] [data-email-select]`));
}

// Blocks move inside their own section only; the band always stays above the card.
function moveBlock(id, direction) {
  mutate(template => {
    const at = template.blocks.findIndex(block => block.id === id), to = at + (direction === 'up' ? -1 : 1);
    if (at < 0 || template.blocks[to]?.section !== template.blocks[at].section) return;
    [template.blocks[at], template.blocks[to]] = [template.blocks[to], template.blocks[at]];
  });
  renderPanel(scope => { const row = scope.querySelector(`[data-email-block="${id}"]`); return row.querySelector(`[data-email-move=${direction}]:not(:disabled)`) ?? row.querySelector('[data-email-select]'); });
}

function removeBlock(id) {
  const section = target().blocks.find(block => block.id === id)?.section;
  mutate(template => { const at = template.blocks.findIndex(block => block.id === id); if (at >= 0) template.blocks.splice(at, 1); });
  if (state.selected === id) state.selected = null;
  renderPanel(scope => scope.querySelector(`[data-email-add="${section}"]`));
}

function buildText() {
  const email = emailOf(ctx.project()), template = email.templates[state.tab], textPath = `${basePath()}text`;
  const text = renderCustom({ subject: template.subject, preheader: template.preheader, blocks: template.blocks, design: template.design }, email).text;
  update(next => { next.templates[state.tab].text = text; });
  state.open.text = true;
  renderPanel(scope => withPath(scope, textPath));
}

function report(error) {
  toast(error.message ?? 'Åtgärden kunde inte slutföras.', true);
  const path = error.status === 422 ? error.details?.field : undefined;
  if (typeof path === 'string' && mounted()) showEmailError(path, error.message);
}

// One action at a time per button; every failure is shown in Swedish, never swallowed.
async function run(button, action) {
  if (button.disabled) return;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try { await action(); }
  catch (error) { report(error); }
  finally { button.disabled = false; button.removeAttribute('aria-busy'); }
}

async function sendTest(button) {
  const kind = state.tab;
  await run(button, async () => {
    await api('mail/test', { requestId: crypto.randomUUID(), template: kind, email: ctx.project().email ?? null });
    const view = state.settings ?? await api('contact').catch(() => null), to = view?.values.CONTACT_TO.value;
    toast(to ? `Provmejlet är skickat till ${to}.` : 'Provmejlet är skickat.');
  });
}

function onClick(event) {
  const button = event.target.closest('button');
  if (!button || !root.contains(button)) return;
  const id = button.closest('[data-email-block]')?.dataset.emailBlock;
  if (button.dataset.emailTab) return selectTab(button.dataset.emailTab);
  if ('emailBack' in button.dataset) return ctx.back();
  if ('emailSelect' in button.dataset) return toggleBlock(id);
  if (button.dataset.emailMove) return moveBlock(id, button.dataset.emailMove);
  if ('emailRemove' in button.dataset) return removeBlock(id);
  if ('emailTextBuild' in button.dataset) return buildText();
  if ('emailTest' in button.dataset) return sendTest(button);
  if (button.dataset.emailChipRemove) return removeAddress(button.dataset.emailChipRemove, button.dataset.emailAddress);
  if ('emailPickResource' in button.dataset) return pickResource();
  if (button.dataset.emailAttachmentRemove !== undefined) return removeAttachment(Number(button.dataset.emailAttachmentRemove)).catch(report);
  if ('emailSend' in button.dataset) return sendMail(button);
  if (button.dataset.emailClear) return toggleClear(button.dataset.emailClear, button);
  if ('emailSaveSettings' in button.dataset) return saveSettings(button);
  if ('emailRetry' in button.dataset) { state.settingsError = ''; renderSettingsBody(); return loadSettings(); }
  if ('emailRefresh' in button.dataset) { state.sent = null; state.sentError = ''; state.status = {}; renderSentBody(); return loadSent(); }
  const sentId = button.closest('[data-email-sent-id]')?.dataset.emailSentId;
  if ('emailCheck' in button.dataset) return checkStatus(sentId, true);
  if ('emailCancel' in button.dataset) return cancelSend(sentId, button);
  if (button.dataset.emailDevice) {
    state.device = button.dataset.emailDevice;
    for (const other of root.querySelectorAll('[data-email-device]')) other.setAttribute('aria-pressed', String(other === button));
    fitPreview();
  }
}

// The disclosure groups keep their open state across re-renders.
function onToggle(event) {
  const name = event.target.dataset?.emailDetails;
  if (name) state.open[name] = event.target.open;
}

// Arrow keys move between tabs (vertical and horizontal layouts both work).
function onKeydown(event) {
  const chips = event.target.dataset?.emailChipInput;
  if (chips && (event.key === 'Enter' || event.key === ',')) { event.preventDefault(); commitAddresses(chips, true); return; }
  const tab = event.target.closest?.('[data-email-tab]');
  if (!tab) return;
  const tabs = [...root.querySelectorAll('[data-email-tab]')], at = tabs.indexOf(tab);
  const next = { ArrowDown: at + 1, ArrowRight: at + 1, ArrowUp: at - 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  const to = tabs[(next + tabs.length) % tabs.length];
  selectTab(to.dataset.emailTab);
  to.focus();
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
  root.addEventListener('toggle', onToggle, true);
  observer = new ResizeObserver(fitPreview);
  observer.observe(root.querySelector('[data-email-preview-pane]'));
  syncTabs();
  renderPanel();
  root.dataset.emailReady = 'true';
}

// Undo and redo replace the project under the view.
export function refreshEmail() { if (mounted()) renderPanel(); }
