// Shared by the Worker, the studio bundle and Node tests: keep it pure.
import { resourceSlots } from '../content/resources.mjs';

const ORIGIN = 'https://omaryusuf.se';
export const SENDING_DOMAIN = 'hej.omaryusuf.se';
export const PLACEHOLDERS = Object.freeze(['namn', 'mejl', 'meddelande']);
export const FONTS = Object.freeze(['Arial,Helvetica,sans-serif', 'Georgia,serif', 'Verdana,Geneva,sans-serif', 'Tahoma,Geneva,sans-serif', 'Trebuchet MS,Helvetica,sans-serif', 'Courier New,Courier,monospace']);
// Inline links `[label](url)`. Escaping never touches []()\s, so the validator
// (raw text) and the renderer (escaped text) see the same matches.
export const INLINE_LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const PLACEHOLDER = new RegExp(`\\{(${PLACEHOLDERS.join('|')})\\}`, 'g');

export const isEmailAddress = value => typeof value === 'string' && value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value) && value.split('@')[0].length <= 64 && !value.split('@')[0].includes('..') && !value.startsWith('.') && !value.split('@')[0].endsWith('.');

const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const style = (size, lineHeight, marginTop, marginBottom, letterSpacing, color) => ({ size, lineHeight, marginTop, marginBottom, letterSpacing, bold: false, color });
const design = (band, bandText, bandPadding, cardPadding) => ({
  width: 600, radius: 15, buttonRadius: 7, font: FONTS[0], page: { y: 32, x: 16 }, bandPadding, cardPadding,
  palette: { background: '#fff0b3', card: '#fffdf6', band, bandText, text: '#20261e', secondary: '#525a45', accent: '#234ce7', border: '#9ca38a', button: '#ffda44', buttonText: '#20261e' },
});

// Transcribes the hand-written mails of emails.mjs before 1b (fixtures in tests/fixtures/email).
export const DEFAULT_EMAIL = freeze({
  schemaVersion: 1,
  sender: { name: 'Omar Yusuf', local: 'hej' },
  shell: { brand: 'omar yusuf', tagline: 'Lite hjärna. Lite hjärta. Lite bus i systemet.' },
  templates: {
    receipt: {
      subject: 'Ditt hej är framme. / Omar',
      preheader: 'Dina uppgifter är framme hos Omar. Här är ditt lilla kvitto.',
      text: 'Tack för att du skrev. Jag har fått dina uppgifter och återkommer till dig.\n\nDet här kvittot kom från maskinen. Nästa svar kommer från människan.\n\n/ Omar\n\nEn liten paus: https://omaryusuf.se/verkstad/\nKvittot tar inte emot svar. Lägg till något via https://omaryusuf.se/kontakt/\nIntegritet: https://omaryusuf.se/integritet/',
      blocks: [
        { id: 'rcpt0001', type: 'label', section: 'band', text: 'GLÄDJEVERKET / POSTAVDELNINGEN', style: style(10, 16, 0, 14, 1, 'bandText') },
        { id: 'rcpt0002', type: 'heading', section: 'band', level: 1, text: 'Det kom\nett litet hej.', style: style(38, 39, 0, 0, -1, 'bandText') },
        { id: 'rcpt0003', type: 'image', section: 'band', src: 'emailAnimated', msoSrc: 'emailStatic', alt: null, width: 96, height: 96, placement: 'beside', align: 'left' },
        { id: 'rcpt0004', type: 'label', section: 'card', text: 'ETT LITET MOTTAGNINGSKVITTO', style: style(10, 16, 0, 12, 1, 'secondary') },
        { id: 'rcpt0005', type: 'heading', section: 'card', level: 2, text: 'Och det är framme.', style: style(30, 33, 0, 22, -1, 'text') },
        { id: 'rcpt0006', type: 'text', section: 'card', text: 'Tack för att du skrev. Jag har fått dina uppgifter och återkommer till dig.', style: style(16, 26, 0, 17, 0, 'text'), rule: null },
        { id: 'rcpt0007', type: 'text', section: 'card', text: 'Det här kvittot kom från maskinen.\nNästa svar kommer från människan.', style: style(16, 26, 0, 26, 0, 'text'), rule: null },
        { id: 'rcpt0008', type: 'receiptRow', section: 'card', label: 'Att betala', value: 'Ett litet leende.' },
        { id: 'rcpt0009', type: 'text', section: 'card', text: '/ Omar', style: style(22, 28, 28, 28, 0, 'accent'), rule: null },
        { id: 'rcpt0010', type: 'button', section: 'card', label: 'Ta en liten omväg till verkstaden →', href: 'https://omaryusuf.se/verkstad/', align: 'left' },
        { id: 'rcpt0011', type: 'text', section: 'card', text: 'Kvittot tar inte emot svar. Något mer på hjärtat? [Postluckan finns kvar.](https://omaryusuf.se/kontakt/)', style: style(11, 19, 20, 0, 0, 'secondary'), rule: null },
      ],
      design: design('#234ce7', '#fffdf6', { top: 28, x: 28, bottom: 22 }, { top: 32, x: 28, bottom: 30 }),
      enabled: true,
    },
    notification: {
      subject: 'Ny post via omaryusuf.se',
      preheader: 'Nya kontaktuppgifter från omaryusuf.se.',
      text: 'Ny post via omaryusuf.se\n\nNamn: {namn}\nMejl: {mejl}\n\n{meddelande}\n\nSvara på det här mejlet för att kontakta personen.',
      blocks: [
        { id: 'note0001', type: 'label', section: 'band', text: 'POSTLUCKAN / NYTT MEDDELANDE', style: style(10, 16, 0, 14, 1, 'secondary') },
        { id: 'note0002', type: 'heading', section: 'band', level: 1, text: 'Någon har knackat på.', style: style(34, 37, 0, 0, 0, 'text') },
        { id: 'note0003', type: 'visitor', section: 'card', fromLabel: 'FRÅN', messageLabel: 'MEDDELANDE', emptyMessage: 'Inget meddelande. Bara en öppen dörr till ett samtal.', emptyMessageText: 'Inget meddelande lämnades.' },
        { id: 'note0004', type: 'text', section: 'card', text: 'Svara på det här mejlet för att skriva direkt till personen.', style: style(12, 20, 0, 0, 0, 'secondary'), rule: { gap: 18 } },
      ],
      design: design('#dfeac8', '#20261e', { top: 28, x: 28, bottom: 28 }, { top: 28, x: 28, bottom: 30 }),
    },
  },
});

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const px = n => n === 0 ? '0' : `${n}px`;
// One pass with a callback: visitor text is never re-scanned and `$&` stays literal.
const fill = (source, values, encode) => values ? source.replace(PLACEHOLDER, (_, key) => encode(values[key])) : source;
const oneLine = value => String(value).replace(/[\u0000-\u001f\u007f]+/g, ' ');
const TABLE = '<table role="presentation" cellpadding="0" cellspacing="0" border="0"';

export const senderAddress = email => `${(email ?? DEFAULT_EMAIL).sender.name} <${(email ?? DEFAULT_EMAIL).sender.local}@${SENDING_DOMAIN}>`;

export function resolveSlots(resources, assets) {
  return Object.fromEntries(Object.entries(resourceSlots).map(([slot, builtin]) => {
    const src = resources?.[slot] ?? builtin.src;
    return [slot, { src, alt: assets.find(asset => asset.src === src)?.alt ?? builtin.alt }];
  }));
}

function textStyle(s, palette, rule = null) {
  return `margin-top:${px(s.marginTop)};margin-bottom:${px(s.marginBottom)};${rule ? `border-top:1px dashed ${palette.border};padding-top:${px(rule.gap)};` : ''}font-size:${s.size}px;line-height:${s.lineHeight}px;${s.letterSpacing ? `letter-spacing:${s.letterSpacing}px;` : ''}${s.bold ? 'font-weight:bold;' : ''}color:${palette[s.color]};`;
}

function picture(block, ctx) {
  const img = ref => {
    const slot = Object.hasOwn(resourceSlots, ref) ? ctx.resources[ref] : null;
    return `<img src="${esc(new URL(slot ? slot.src : ref, ctx.origin).href)}" alt="${esc(block.alt ?? slot?.alt ?? '')}" width="${block.width}" height="${block.height}" border="0" style="display:block;width:${block.width}px;height:${block.height}px;object-fit:contain;">`;
  };
  return block.msoSrc ? `<!--[if mso]>${img(block.msoSrc)}<![endif]--><!--[if !mso]><!-->${img(block.src)}<!--<![endif]-->` : img(block.src);
}

function renderBlock(block, palette, design, ctx) {
  const inline = text => fill(esc(text).replace(/\n/g, '<br>').replace(INLINE_LINK, (_, label, url) => `<a href="${url}" style="color:${palette.text};">${label}</a>`), ctx.values, esc);
  switch (block.type) {
    case 'heading': return `<h${block.level} style="${textStyle(block.style, palette)}">${inline(block.text)}</h${block.level}>`;
    case 'label': return `<p style="${textStyle(block.style, palette)}">${inline(block.text)}</p>`;
    case 'text': return `<p style="${textStyle(block.style, palette, block.rule)}">${inline(block.text)}</p>`;
    case 'image': return `${TABLE} width="100%"><tr><td align="${block.align}">${picture(block, ctx)}</td></tr></table>`;
    case 'button': return `${TABLE}${block.align === 'center' ? ' align="center"' : ''}><tr><td bgcolor="${palette.button}" style="background-color:${palette.button};border:1px solid ${palette.buttonText};border-radius:${design.buttonRadius}px;"><a href="${esc(block.href)}" style="display:inline-block;padding-top:14px;padding-right:20px;padding-bottom:14px;padding-left:20px;font-size:13px;line-height:20px;font-weight:bold;text-decoration:none;color:${palette.buttonText};">${esc(block.label)}</a></td></tr></table>`;
    case 'divider': return `${TABLE} width="100%"><tr><td style="border-top:1px dashed ${palette.border};padding-top:${block.gap}px;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
    case 'receiptRow': return `${TABLE} width="100%"><tr><td style="border-top:1px dashed ${palette.border};padding-top:16px;font-size:12px;line-height:20px;color:${palette.secondary};">${esc(block.label)}</td><td align="right" style="border-top:1px dashed ${palette.border};padding-top:16px;font-size:12px;line-height:20px;font-weight:bold;color:${palette.text};">${esc(block.value)}</td></tr></table>`;
    case 'visitor': {
      const { name, email, message } = ctx.visitor;
      return `<p style="margin-top:0;margin-bottom:8px;font-size:11px;line-height:17px;color:${palette.secondary};">${esc(block.fromLabel)}</p><p style="margin-top:0;margin-bottom:8px;font-size:23px;line-height:29px;font-weight:bold;color:${palette.text};word-break:break-word;">${esc(name)}</p><p style="margin-top:0;margin-bottom:24px;font-size:15px;line-height:24px;color:${palette.accent};word-break:break-all;">${esc(email)}</p><p style="margin-top:0;margin-bottom:12px;font-size:11px;line-height:17px;color:${palette.secondary};">${esc(block.messageLabel)}</p><p style="margin-top:0;margin-bottom:26px;font-size:16px;line-height:27px;color:${palette.text};white-space:pre-wrap;overflow-wrap:anywhere;">${esc(message || block.emptyMessage)}</p>`;
    }
    default: throw new TypeError(`Unknown email block type: ${block.type}`);
  }
}

function layout(settings, preheader, blocks, design, ctx) {
  const p = design.palette, r = design.radius, bp = design.bandPadding, cp = design.cardPadding;
  const band = blocks.filter(block => block.section === 'band'), card = blocks.filter(block => block.section === 'card');
  const beside = band.find(block => block.type === 'image' && block.placement === 'beside');
  const bandHtml = band.filter(block => block !== beside).map(block => renderBlock(block, p, design, ctx)).join('');
  const content = `<tr><td bgcolor="${p.band}" style="background-color:${p.band};padding-top:${px(bp.top)};padding-right:${px(bp.x)};padding-bottom:${px(bp.bottom)};padding-left:${px(bp.x)};border-top-left-radius:${r}px;border-top-right-radius:${r}px;">`
    + (beside ? `${TABLE} width="100%"><tr><td valign="middle" style="color:${p.bandText};font-family:${design.font};">${bandHtml}</td><td width="${beside.width + 2}" valign="middle">${picture(beside, ctx)}</td></tr></table>` : bandHtml)
    + `</td></tr><tr><td bgcolor="${p.card}" style="background-color:${p.card};padding-top:${px(cp.top)};padding-right:${px(cp.x)};padding-bottom:${px(cp.bottom)};padding-left:${px(cp.x)};border-bottom-left-radius:${r}px;border-bottom-right-radius:${r}px;">${card.map(block => renderBlock(block, p, design, ctx)).join('')}</td></tr>`;
  // The footer links are code-owned: /integritet/ is mandatory in every mail.
  return `<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>Ett brev från ${esc(settings.sender.name)}</title></head><body style="margin:0;padding:0;background-color:${p.background};color:${p.text};font-family:${design.font};"><span style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${p.background};">${esc(preheader)}</span>${TABLE} width="100%" bgcolor="${p.background}"><tr><td align="center" style="padding-top:${px(design.page.y)};padding-right:${px(design.page.x)};padding-bottom:${px(design.page.y)};padding-left:${px(design.page.x)};"><!--[if mso]>${TABLE} width="${design.width}"><tr><td><![endif]-->${TABLE} width="100%" style="max-width:${design.width}px;"><tr><td style="padding-bottom:25px;font-size:22px;line-height:28px;font-weight:bold;color:${p.text};">${esc(settings.shell.brand)}<span style="color:${p.accent};">.</span></td></tr>${content}<tr><td style="padding-top:24px;font-size:11px;line-height:18px;color:${p.secondary};">${esc(settings.shell.tagline)}<br><a href="${ORIGIN}/integritet/" style="color:${p.text};">Integritet</a> · <a href="${ORIGIN}/" style="color:${p.text};">omaryusuf.se</a></td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}

export function renderEmail(email, kind, { resources = resourceSlots, origin = ORIGIN, visitor } = {}) {
  const settings = email ?? DEFAULT_EMAIL, template = settings.templates[kind];
  // Visitor input reaches only the notification; the receipt never reflects it.
  const person = kind === 'notification' ? visitor ?? { name: '{namn}', email: '{mejl}', message: '' } : null;
  const values = kind === 'notification' && visitor ? { namn: visitor.name, mejl: visitor.email, meddelande: visitor.message } : null;
  const emptyText = template.blocks.find(block => block.type === 'visitor')?.emptyMessageText;
  const subject = fill(template.subject, values, oneLine), preheader = fill(template.preheader, values, oneLine);
  return {
    subject,
    html: layout(settings, preheader, template.blocks, template.design, { resources, origin, values, visitor: person }),
    text: fill(template.text, values && { ...values, meddelande: values.meddelande || emptyText }, String),
    from: senderAddress(settings),
  };
}

export function renderCustom(mail, email, { resources = resourceSlots, origin = ORIGIN } = {}) {
  const settings = email ?? DEFAULT_EMAIL;
  return {
    subject: mail.subject,
    html: layout(settings, mail.preheader, mail.blocks, mail.design, { resources, origin, values: null, visitor: null }),
    text: `${plainText(mail.blocks)}\n\nIntegritet: ${ORIGIN}/integritet/`,
    from: senderAddress(settings),
  };
}

export function plainText(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading': case 'label': case 'text': return block.text.replace(INLINE_LINK, (_, label, url) => `${label} (${url})`);
      case 'button': return `${block.label}: ${block.href}`;
      case 'receiptRow': return `${block.label}: ${block.value}`;
      case 'visitor': return `${block.fromLabel}: {namn} <{mejl}>\n\n${block.messageLabel}:\n{meddelande}`;
      case 'image': case 'divider': return null;
      default: throw new TypeError(`Unknown email block type: ${block.type}`);
    }
  }).filter(part => part !== null).join('\n\n');
}

// Inline declaration order differs between today's two mails (P4); sorting
// the declarations inside each style attribute makes them comparable.
export const canonStyles = html => html.replace(/style="([^"]*)"/g, (_, value) => `style="${value.split(';').filter(Boolean).sort().join(';')}"`);
