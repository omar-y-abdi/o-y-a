import { HttpError } from './http.mjs';
import { FONTS, INLINE_LINK, PLACEHOLDERS, SENDING_DOMAIN } from '../server/email-render.mjs';
import { resourceSlots } from '../content/resources.mjs';

const INVALID = 'Mejlinställningarna är ogiltiga.';
const COLORS = ['background', 'card', 'band', 'bandText', 'text', 'secondary', 'accent', 'border', 'button', 'buttonText'];
const TEXT_COLORS = ['text', 'secondary', 'accent', 'bandText'];
const MEDIA = /^\/media\/[0-9a-f-]{36}\.(png|jpg|gif)$/;
const FIELDS = {
  heading: ['level', 'text', 'style'],
  label: ['text', 'style'],
  text: ['text', 'style', 'rule'],
  image: ['src', 'msoSrc', 'alt', 'width', 'height', 'placement', 'align'],
  button: ['label', 'href', 'align'],
  divider: ['gap'],
  receiptRow: ['label', 'value'],
  visitor: ['fromLabel', 'messageLabel', 'emptyMessage', 'emptyMessageText'],
};
const CARD_ONLY = new Set(['button', 'divider', 'receiptRow', 'visitor']);

const fail = (message, field) => { throw new HttpError(422, message, { field }); };
const at = (path, key) => typeof key === 'number' ? `${path}[${key}]` : path ? `${path}.${key}` : key;

function record(value, path, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(INVALID, path);
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`Okänt fält i mejlen: ${at(path, key)}.`, at(path, key));
  return value;
}
function string(value, path, name, max, min, control) {
  wellFormed(value, path);
  if (typeof value === 'string' && control.test(value)) fail(`${name} får bara vara en rad.`, path);
  if (typeof value !== 'string' || value.length < min || value.length > max) fail(`${name} saknas eller är för lång (högst ${max} tecken).`, path);
  return value;
}
function wellFormed(value, path) {
  if (typeof value === 'string' && !value.isWellFormed()) fail('Fältet innehåller ogiltiga Unicode-tecken.', path);
}
const line = (value, path, name, max, min = 1) => string(value, path, name, max, min, /[\u0000-\u001f\u007f]/);
// Multi-line fields keep LF; every other control character is refused.
function lines(value, path, name, max) {
  if (typeof value === 'string' && /[\u0000-\u0009\u000b-\u001f\u007f]/.test(value)) fail(`${name} innehåller ogiltiga tecken.`, path);
  return string(value, path, name, max, 1, /(?!)/);
}
function int(value, path, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) fail(`${name} måste vara ett heltal mellan ${min} och ${max}.`, path);
  return value;
}
function choice(value, path, allowed, message = INVALID) {
  if (!allowed.includes(value)) fail(message, path);
  return value;
}
function bool(value, path) {
  if (typeof value !== 'boolean') fail(INVALID, path);
  return value;
}
function href(value, path) {
  wellFormed(value, path);
  let url;
  try { url = typeof value === 'string' && value.length <= 2000 ? new URL(value) : null; } catch { url = null; }
  if (!url || !(url.protocol === 'https:' && url.hostname || url.protocol === 'mailto:')) fail('Länken måste börja med https: eller mailto:.', path);
  return value;
}
const image = (value, path) => Object.hasOwn(resourceSlots, value) || typeof value === 'string' && MEDIA.test(value) ? value : fail('Välj en bild ur webbplatsens resurser.', path);

// kind: 'receipt' | 'notification' | 'custom'. Only the notification may name the visitor (P7).
function placeholders(value, path, kind) {
  for (const [, name] of value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)) {
    if (!PLACEHOLDERS.includes(name)) { if (kind === 'notification') fail(`Okänt fält {${name}}. Använd {namn}, {mejl} eller {meddelande}.`, path); }
    else if (kind !== 'notification') fail(`${kind === 'receipt' ? 'Kvittot' : 'Mejlet'} får inte innehålla besökarens uppgifter ({namn}, {mejl}, {meddelande}).`, path);
  }
  return value;
}
function inlineText(value, path, kind) {
  for (const [, , url] of value.matchAll(INLINE_LINK)) href(url, path);
  return placeholders(value, path, kind);
}

function textStyle(value, path) {
  const s = record(value, path, ['size', 'lineHeight', 'marginTop', 'marginBottom', 'letterSpacing', 'bold', 'color']);
  return {
    size: int(s.size, at(path, 'size'), 'Textstorleken', 8, 64),
    lineHeight: int(s.lineHeight, at(path, 'lineHeight'), 'Radhöjden', 10, 80),
    marginTop: int(s.marginTop, at(path, 'marginTop'), 'Avståndet ovanför', 0, 80),
    marginBottom: int(s.marginBottom, at(path, 'marginBottom'), 'Avståndet nedanför', 0, 80),
    letterSpacing: int(s.letterSpacing, at(path, 'letterSpacing'), 'Teckenavståndet', -3, 6),
    bold: bool(s.bold, at(path, 'bold')),
    color: choice(s.color, at(path, 'color'), TEXT_COLORS, 'Välj en av mallens textfärger.'),
  };
}

function block(value, path, kind, section) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(INVALID, path);
  if (!Object.hasOwn(FIELDS, value.type)) fail(`Okänd blocktyp: ${String(value.type).slice(0, 40)}.`, at(path, 'type'));
  const b = record(value, path, ['id', 'type', 'section', ...FIELDS[value.type]]), type = b.type, f = key => at(path, key);
  if (CARD_ONLY.has(type) && section !== 'card') fail(`Blocktypen ${type} hör bara hemma i kortet.`, f('section'));
  const base = { id: b.id, type, section };
  switch (type) {
    case 'heading': return { ...base, level: choice(b.level, f('level'), [1, 2]), text: inlineText(lines(b.text, f('text'), 'Rubriken', 200), f('text'), kind), style: textStyle(b.style, f('style')) };
    case 'label': return { ...base, text: inlineText(line(b.text, f('text'), 'Etikett', 120), f('text'), kind), style: textStyle(b.style, f('style')) };
    case 'text': {
      const rule = b.rule === null ? null : { gap: int(record(b.rule, f('rule'), ['gap']).gap, at(f('rule'), 'gap'), 'Avståndet', 0, 48) };
      return { ...base, text: inlineText(lines(b.text, f('text'), 'Texten', 2000), f('text'), kind), style: textStyle(b.style, f('style')), rule };
    }
    case 'image': {
      const src = image(b.src, f('src')), msoSrc = b.msoSrc === null ? null : image(b.msoSrc, f('msoSrc'));
      const alt = b.alt === null ? null : line(b.alt, f('alt'), 'Alternativtexten', 200, 0);
      if (alt === null && [src, msoSrc].some(ref => ref !== null && !Object.hasOwn(resourceSlots, ref))) fail('Bilden behöver alternativtext.', f('alt'));
      const placement = choice(b.placement, f('placement'), ['beside', 'block']);
      if ((placement === 'beside') !== (section === 'band')) fail(placement === 'beside' ? 'En bild bredvid texten hör bara hemma i bandet.' : 'En fristående bild hör bara hemma i kortet.', f('placement'));
      return { ...base, src, msoSrc, alt, width: int(b.width, f('width'), 'Bildens bredd', 16, 560), height: int(b.height, f('height'), 'Bildens höjd', 16, 560), placement, align: choice(b.align, f('align'), ['left', 'center']) };
    }
    case 'button': return { ...base, label: line(b.label, f('label'), 'Knapptexten', 120), href: href(b.href, f('href')), align: choice(b.align, f('align'), ['left', 'center']) };
    case 'divider': return { ...base, gap: int(b.gap, f('gap'), 'Avståndet', 0, 48) };
    case 'receiptRow': return { ...base, label: line(b.label, f('label'), 'Etikett', 120), value: line(b.value, f('value'), 'Värdet', 120) };
    case 'visitor':
      if (kind !== 'notification') fail('Besökarens uppgifter hör bara hemma i aviseringen.', path);
      return { ...base, fromLabel: line(b.fromLabel, f('fromLabel'), 'Etikett', 60), messageLabel: line(b.messageLabel, f('messageLabel'), 'Etikett', 60), emptyMessage: line(b.emptyMessage, f('emptyMessage'), 'Texten utan meddelande', 300), emptyMessageText: line(b.emptyMessageText, f('emptyMessageText'), 'Textversionen utan meddelande', 300) };
  }
}

function blocks(value, path, kind) {
  if (Array.isArray(value) && value.length > 40) fail('Mallen får ha högst 40 block.', path);
  if (!Array.isArray(value)) fail(INVALID, path);
  const ids = new Set();
  let card = false;
  const result = value.map((item, index) => {
    const section = choice(item?.section, at(at(path, index), 'section'), ['band', 'card']);
    if (section === 'band' && card) fail('Bandets block måste komma före kortets.', at(at(path, index), 'section'));
    card ||= section === 'card';
    const id = item.id;
    if (typeof id !== 'string' || !/^[a-z0-9]{8}$/.test(id) || ids.has(id)) fail('Varje block behöver en unik identitet.', at(at(path, index), 'id'));
    ids.add(id);
    return block(item, at(path, index), kind, section);
  });
  if (!card || result[0].section !== 'band') fail('Mallen behöver minst ett block i bandet och ett i kortet.', path);
  if (result.filter(item => item.placement === 'beside').length > 1) fail('Bandet kan ha högst en bild bredvid texten.', path);
  if (kind === 'notification' && result.filter(item => item.type === 'visitor').length !== 1) fail('Aviseringen behöver exakt ett block med besökarens uppgifter.', path);
  return result;
}

function design(value, path) {
  const d = record(value, path, ['width', 'radius', 'buttonRadius', 'font', 'page', 'bandPadding', 'cardPadding', 'palette']);
  const box = (key, name, keys) => { const v = record(d[key], at(path, key), keys); return Object.fromEntries(keys.map(k => [k, int(v[k], at(at(path, key), k), name, 0, 64)])); };
  const palette = record(d.palette, at(path, 'palette'), COLORS);
  return {
    width: int(d.width, at(path, 'width'), 'Bredden', 480, 720),
    radius: int(d.radius, at(path, 'radius'), 'Hörnradien', 0, 32),
    buttonRadius: int(d.buttonRadius, at(path, 'buttonRadius'), 'Knappens hörnradie', 0, 24),
    font: choice(d.font, at(path, 'font'), FONTS, 'Välj ett av de mejlsäkra typsnitten.'),
    page: box('page', 'Sidans marginal', ['y', 'x']),
    bandPadding: box('bandPadding', 'Bandets utfyllnad', ['top', 'x', 'bottom']),
    cardPadding: box('cardPadding', 'Kortets utfyllnad', ['top', 'x', 'bottom']),
    palette: Object.fromEntries(COLORS.map(token => [token, typeof palette[token] === 'string' && /^#[0-9a-f]{6}$/.test(palette[token]) ? palette[token] : fail(`Färgen ${token} måste vara en hexkod som #20261e.`, at(at(path, 'palette'), token))])),
  };
}

function template(value, path, kind) {
  const t = record(value, path, ['subject', 'preheader', 'text', 'blocks', 'design', ...(kind === 'receipt' ? ['enabled'] : [])]);
  return {
    subject: placeholders(line(t.subject, at(path, 'subject'), 'Ämne', 200), at(path, 'subject'), kind),
    preheader: placeholders(line(t.preheader, at(path, 'preheader'), 'Förtext', 200, 0), at(path, 'preheader'), kind),
    text: placeholders(lines(t.text, at(path, 'text'), 'Textversionen', 10000), at(path, 'text'), kind),
    blocks: blocks(t.blocks, at(path, 'blocks'), kind),
    design: design(t.design, at(path, 'design')),
    ...(kind === 'receipt' ? { enabled: bool(t.enabled, at(path, 'enabled')) } : {}),
  };
}

// Absent (or null, from a delta restoring an older revision) means DEFAULT_EMAIL.
export function validateEmailIdentity(input) {
  if (input === undefined || input === null) return undefined;
  const e = record(input, '', ['sender', 'shell']);
  const sender = record(e.sender, 'sender', ['name', 'local']), shell = record(e.shell, 'shell', ['brand', 'tagline']);
  const name = line(sender.name, 'sender.name', 'Avsändarnamn', 60);
  if (!/^[\p{L}\p{N} .'-]{1,60}$/u.test(name)) fail('Avsändarnamnet får bara innehålla bokstäver, siffror, mellanslag, punkt, apostrof och bindestreck.', 'sender.name');
  const local = sender.local;
  if (typeof local !== 'string' || !/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(local) || local.includes('..')) fail(`Avsändaradressen får bara innehålla a–z, 0–9, punkt, bindestreck och understreck före @${SENDING_DOMAIN}.`, 'sender.local');
  return {
    sender: { name, local },
    shell: { brand: line(shell.brand, 'shell.brand', 'Varumärket', 40), tagline: line(shell.tagline, 'shell.tagline', 'Slogan', 200, 0) },
  };
}

export function validateEmailSettings(input) {
  if (input === undefined || input === null) return undefined;
  const e = record(input, '', ['schemaVersion', 'sender', 'shell', 'templates']);
  if (e.schemaVersion !== 1) fail(INVALID, 'schemaVersion');
  const identity = validateEmailIdentity({ sender: e.sender, shell: e.shell });
  const templates = record(e.templates, 'templates', ['receipt', 'notification']);
  return {
    schemaVersion: 1,
    ...identity,
    templates: { receipt: template(templates.receipt, 'templates.receipt', 'receipt'), notification: template(templates.notification, 'templates.notification', 'notification') },
  };
}

// Skriv mejl: the caller (email-api.mjs) owns recipients, schedule and attachments.
export function validateCustomMail({ subject, preheader, blocks: input, design: look }) {
  return {
    subject: placeholders(line(subject, 'subject', 'Ämne', 200), 'subject', 'custom'),
    preheader: placeholders(line(preheader, 'preheader', 'Förtext', 200, 0), 'preheader', 'custom'),
    blocks: blocks(input, 'blocks', 'custom'),
    design: design(look, 'design'),
  };
}
