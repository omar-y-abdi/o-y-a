import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EMAIL, renderEmail } from '../src/server/email-render.mjs';
import { validateEmailSettings, validateCustomMail } from '../src/cms/email-validate.mjs';

const MEDIA = '/media/00000000-0000-4000-8000-000000000001.png';
const edited = change => { const email = structuredClone(DEFAULT_EMAIL); change(email); return email; };
function rejects(input, field, message, validate = validateEmailSettings) {
  assert.throws(() => validate(input), error => {
    assert.equal(error.status, 422);
    assert.equal(error.details.field, field);
    if (message) assert.equal(error.message, message);
    return true;
  });
}
const receipt = email => email.templates.receipt;
const custom = change => { const mail = { subject: 'Hej', preheader: '', blocks: structuredClone(DEFAULT_EMAIL.templates.receipt.blocks), design: structuredClone(DEFAULT_EMAIL.templates.receipt.design) }; change?.(mail); return mail; };

test('absent email stays absent and the defaults pass their own rules', () => {
  assert.equal(validateEmailSettings(undefined), undefined);
  assert.equal(validateEmailSettings(null), undefined);
  const validated = validateEmailSettings(structuredClone(DEFAULT_EMAIL));
  assert.deepEqual(validated, DEFAULT_EMAIL);
  assert.equal(JSON.stringify(validated), JSON.stringify(DEFAULT_EMAIL));
  for (const kind of ['receipt', 'notification']) {
    const visitor = { name: 'Mira', email: 'mira@example.org', message: 'Hej' };
    assert.deepEqual(renderEmail(validated, kind, { visitor }), renderEmail(DEFAULT_EMAIL, kind, { visitor }));
  }
});

test('output is rebuilt from the whitelist and unknown keys are refused at any depth', () => {
  rejects({ ...structuredClone(DEFAULT_EMAIL), extra: 1 }, 'extra', 'Okänt fält i mejlen: extra.');
  rejects(edited(email => { receipt(email).design.palette.extra = '#000000'; }), 'templates.receipt.design.palette.extra', 'Okänt fält i mejlen: templates.receipt.design.palette.extra.');
  rejects(edited(email => { receipt(email).blocks[5].style.italic = true; }), 'templates.receipt.blocks[5].style.italic');
  rejects(edited(email => { receipt(email).blocks[5].onclick = 'x'; }), 'templates.receipt.blocks[5].onclick');
  rejects(edited(email => { email.schemaVersion = 2; }), 'schemaVersion', 'Mejlinställningarna är ogiltiga.');
  rejects([], '', 'Mejlinställningarna är ogiltiga.');
  rejects(edited(email => { delete email.templates.notification; }), 'templates.notification', 'Mejlinställningarna är ogiltiga.');
});

test('line breaks in subject or sender name are rejected with the field', () => {
  rejects(edited(email => { receipt(email).subject = 'Hej\nBcc: x@example.org'; }), 'templates.receipt.subject', 'Ämne får bara vara en rad.');
  rejects(edited(email => { email.templates.notification.preheader = 'a\rb'; }), 'templates.notification.preheader', 'Förtext får bara vara en rad.');
  rejects(edited(email => { email.sender.name = 'Omar\r\nBcc: x'; }), 'sender.name', 'Avsändarnamn får bara vara en rad.');
  rejects(edited(email => { receipt(email).blocks[0].text = 'A\nB'; }), 'templates.receipt.blocks[0].text', 'Etikett får bara vara en rad.');
  rejects(edited(email => { email.sender.name = 'Omar <x@y.se>'; }), 'sender.name');
  rejects(edited(email => { email.sender.local = 'hej@evil.test'; }), 'sender.local', 'Avsändaradressen får bara innehålla a–z, 0–9, punkt, bindestreck och understreck före @hej.omaryusuf.se.');
  for (const local of ['a..b', '.a', 'Hej', '']) rejects(edited(email => { email.sender.local = local; }), 'sender.local');
  assert.equal(validateEmailSettings(edited(email => { email.sender = { name: "Studio O'Yusuf-2", local: 'post.kontakt' }; })).sender.local, 'post.kontakt');
});

test('too long text, 41 blocks and unknown type are rejected', () => {
  rejects(edited(email => { receipt(email).blocks[5].text = 'x'.repeat(2001); }), 'templates.receipt.blocks[5].text', 'Texten saknas eller är för lång (högst 2000 tecken).');
  rejects(edited(email => { receipt(email).subject = ''; }), 'templates.receipt.subject', 'Ämne saknas eller är för lång (högst 200 tecken).');
  rejects(edited(email => { receipt(email).text = 'x'.repeat(10001); }), 'templates.receipt.text');
  rejects(edited(email => { const blocks = receipt(email).blocks; while (blocks.length < 41) blocks.push({ ...blocks[5], id: `pad${String(blocks.length).padStart(5, '0')}` }); }), 'templates.receipt.blocks', 'Mallen får ha högst 40 block.');
  rejects(edited(email => { receipt(email).blocks[3].type = 'video'; }), 'templates.receipt.blocks[3].type', 'Okänd blocktyp: video.');
  rejects(edited(email => { receipt(email).blocks[5].style.size = 65; }), 'templates.receipt.blocks[5].style.size', 'Textstorleken måste vara ett heltal mellan 8 och 64.');
  rejects(edited(email => { receipt(email).design.width = 600.5; }), 'templates.receipt.design.width');
  rejects(edited(email => { receipt(email).design.font = 'Comic Sans MS'; }), 'templates.receipt.design.font', 'Välj ett av de mejlsäkra typsnitten.');
});

test('block order, sections, ids and the visitor block are enforced', () => {
  rejects(edited(email => { receipt(email).blocks.push({ ...receipt(email).blocks[0], id: 'late0001' }); }), 'templates.receipt.blocks[11].section', 'Bandets block måste komma före kortets.');
  rejects(edited(email => { receipt(email).blocks[4].id = 'rcpt0001'; }), 'templates.receipt.blocks[4].id');
  rejects(edited(email => { receipt(email).blocks = receipt(email).blocks.slice(0, 3); }), 'templates.receipt.blocks', 'Mallen behöver minst ett block i bandet och ett i kortet.');
  rejects(edited(email => { receipt(email).blocks[9].section = 'band'; receipt(email).blocks.splice(3, 0, receipt(email).blocks.splice(9, 1)[0]); }), 'templates.receipt.blocks[3].section', 'Blocktypen button hör bara hemma i kortet.');
  rejects(edited(email => { receipt(email).blocks.splice(3, 0, { ...receipt(email).blocks[2], id: 'second01' }); }), 'templates.receipt.blocks', 'Bandet kan ha högst en bild bredvid texten.');
  rejects(edited(email => { email.templates.notification.blocks.splice(2, 1); }), 'templates.notification.blocks', 'Aviseringen behöver exakt ett block med besökarens uppgifter.');
  rejects(edited(email => { receipt(email).blocks.splice(4, 0, { ...DEFAULT_EMAIL.templates.notification.blocks[2] }); }), 'templates.receipt.blocks[4]', 'Besökarens uppgifter hör bara hemma i aviseringen.');
});

test('foreign image, bad link and non-hex colour are rejected', () => {
  rejects(edited(email => { receipt(email).blocks[2].src = '/assets/x.png'; }), 'templates.receipt.blocks[2].src', 'Välj en bild ur webbplatsens resurser.');
  rejects(edited(email => { receipt(email).blocks[2].msoSrc = '/media/00000000-0000-4000-8000-000000000001.webp'; }), 'templates.receipt.blocks[2].msoSrc');
  rejects(edited(email => { receipt(email).blocks[2].src = MEDIA; }), 'templates.receipt.blocks[2].alt', 'Bilden behöver alternativtext.');
  assert.equal(validateEmailSettings(edited(email => { Object.assign(receipt(email).blocks[2], { src: MEDIA, alt: 'Egen bild' }); })).templates.receipt.blocks[2].src, MEDIA);
  for (const href of ['javascript:alert(1)', 'http://omaryusuf.se/', 'https://', '/kontakt/', 'x'.repeat(2001)]) {
    rejects(edited(email => { receipt(email).blocks[9].href = href; }), 'templates.receipt.blocks[9].href', 'Länken måste börja med https: eller mailto:.');
  }
  rejects(edited(email => { receipt(email).blocks[10].text = 'Se [här](javascript:alert(1))'; }), 'templates.receipt.blocks[10].text', 'Länken måste börja med https: eller mailto:.');
  assert.equal(validateEmailSettings(edited(email => { receipt(email).blocks[9].href = 'mailto:hej@hej.omaryusuf.se'; })).templates.receipt.blocks[9].href, 'mailto:hej@hej.omaryusuf.se');
  for (const colour of ['#FFF', 'red', '#FFFFFF', '#12345g']) {
    rejects(edited(email => { receipt(email).design.palette.accent = colour; }), 'templates.receipt.design.palette.accent', 'Färgen accent måste vara en hexkod som #20261e.');
  }
});

test('placeholders belong only to the notification', () => {
  rejects(edited(email => { receipt(email).subject = 'Hej {namn}'; }), 'templates.receipt.subject', 'Kvittot får inte innehålla besökarens uppgifter ({namn}, {mejl}, {meddelande}).');
  rejects(edited(email => { receipt(email).blocks[5].text = 'Du skrev: {meddelande}'; }), 'templates.receipt.blocks[5].text');
  rejects(edited(email => { receipt(email).text = '{mejl}'; }), 'templates.receipt.text');
  rejects(edited(email => { email.templates.notification.subject = 'Från {x}'; }), 'templates.notification.subject', 'Okänt fält {x}. Använd {namn}, {mejl} eller {meddelande}.');
  const ok = validateEmailSettings(edited(email => { email.templates.notification.subject = 'Från {namn}'; email.templates.notification.blocks[1].text = 'Svara [här](mailto:{mejl})'; }));
  assert.equal(ok.templates.notification.subject, 'Från {namn}');
  assert.equal(validateEmailSettings(edited(email => { receipt(email).subject = 'Hej {x}'; })).templates.receipt.subject, 'Hej {x}');
});

test('custom mail shares the block and design rules', () => {
  const mail = custom();
  assert.deepEqual(validateCustomMail(mail), mail);
  assert.deepEqual(Object.keys(validateCustomMail({ ...mail, to: ['x@example.org'] })), ['subject', 'preheader', 'blocks', 'design']);
  rejects(custom(m => { m.subject = 'Hej {namn}'; }), 'subject', 'Mejlet får inte innehålla besökarens uppgifter ({namn}, {mejl}, {meddelande}).', validateCustomMail);
  rejects(custom(m => { m.blocks.splice(4, 0, { ...DEFAULT_EMAIL.templates.notification.blocks[2] }); }), 'blocks[4]', 'Besökarens uppgifter hör bara hemma i aviseringen.', validateCustomMail);
  rejects(custom(m => { m.design.palette.text = 'black'; }), 'design.palette.text', undefined, validateCustomMail);
  rejects(custom(m => { m.blocks[0].extra = 1; }), 'blocks[0].extra', undefined, validateCustomMail);
  rejects(custom(m => { m.preheader = 'a\nb'; }), 'preheader', 'Förtext får bara vara en rad.', validateCustomMail);
});
