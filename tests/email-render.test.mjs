import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_EMAIL, renderEmail, renderCustom, plainText, canonStyles, senderAddress, resolveSlots, isEmailAddress } from '../src/server/email-render.mjs';

const fixture = name => Object.fromEntries(['html', 'txt', 'subject'].map(ext => [ext, readFileSync(new URL(`./fixtures/email/${name}.${ext}`, import.meta.url), 'utf8')]));
const styleCount = html => html.match(/style="/g).length;
// The visitors the fixtures were frozen with (design §1.5).
const CASES = [
  ['receipt', 'receipt', undefined],
  ['notification', 'notification', { name: 'Mira <Test> & "co"', email: 'mira@example.org', message: 'Rad 1\nRad 2 <b>' }],
  ['notification-empty', 'notification', { name: 'Mira', email: 'mira@example.org', message: '' }],
];
const customMail = blocks => ({ subject: 'Hej', preheader: 'Kort', blocks, design: DEFAULT_EMAIL.templates.receipt.design });

test("default templates reproduce today's mails", () => {
  for (const email of [undefined, null, DEFAULT_EMAIL]) for (const [name, kind, visitor] of CASES) {
    const expected = fixture(name), actual = renderEmail(email, kind, { visitor });
    assert.equal(actual.subject, expected.subject, `${name} subject`);
    assert.equal(actual.text, expected.txt, `${name} text`);
    assert.equal(canonStyles(actual.html), canonStyles(expected.html), `${name} html`);
    assert.equal(styleCount(actual.html), styleCount(expected.html), `${name} style count`);
    assert.equal(actual.from, 'Omar Yusuf <hej@hej.omaryusuf.se>');
  }
});

test('canonStyles only reorders declarations inside style attributes', () => {
  assert.equal(canonStyles('<td style="b:2;a:1;">x</td>'), canonStyles('<td style="a:1;b:2;">x</td>'));
  assert.notEqual(canonStyles('<td style="a:1;">x</td>'), canonStyles('<td style="a:2;">x</td>'));
  assert.notEqual(canonStyles('<td style="a:1;">x</td>'), canonStyles('<td style="a:1;">y</td>'));
});

test('visitor fields and block text are escaped in html, raw in text', () => {
  const visitor = { name: '<script>alert(1)</script> $&', email: 'mira@example.org', message: `& " ' [x](javascript:alert(1)) {mejl}` };
  const mail = renderEmail(undefined, 'notification', { visitor });
  assert.ok(mail.html.includes('&lt;script&gt;alert(1)&lt;/script&gt; $&amp;'));
  assert.ok(!mail.html.includes('<script'));
  assert.ok(mail.html.includes('&amp; &quot; &#39; [x](javascript:alert(1)) {mejl}'));
  assert.ok(!mail.html.includes('href="javascript:'));
  assert.ok(mail.text.includes('Namn: <script>alert(1)</script> $&\n'));
  // One substitution pass: a placeholder inside visitor input stays literal.
  assert.ok(mail.text.includes(`& " ' [x](javascript:alert(1)) {mejl}`));

  const template = structuredClone(DEFAULT_EMAIL);
  template.templates.notification.subject = 'Från {namn}';
  template.templates.notification.blocks[1].text = 'Hej {namn} [svara](mailto:{mejl})';
  const filled = renderEmail(template, 'notification', { visitor: { name: 'Mira\r\nBcc: x <y>', email: 'mira@example.org', message: '' } });
  assert.equal(filled.subject, 'Från Mira Bcc: x <y>');
  assert.ok(filled.html.includes('Hej Mira\r\nBcc: x &lt;y&gt; <a href="mailto:mira@example.org" style="color:#20261e;">svara</a>'));

  const blocks = [...DEFAULT_EMAIL.templates.receipt.blocks.slice(0, 3), { id: 'custom01', type: 'text', section: 'card', text: `<b>"hi" & 'x'</b>`, style: DEFAULT_EMAIL.templates.receipt.blocks[5].style, rule: null }];
  const custom = renderCustom(customMail(blocks), undefined);
  assert.ok(custom.html.includes('&lt;b&gt;&quot;hi&quot; &amp; &#39;x&#39;&lt;/b&gt;'));
  assert.ok(custom.text.includes(`<b>"hi" & 'x'</b>`));
});

test('receipt never reflects input', () => {
  const visitor = { name: 'INJECT_ME', email: 'INJECT_ME', message: 'INJECT_ME' };
  const mail = renderEmail(DEFAULT_EMAIL, 'receipt', { visitor });
  for (const part of [mail.subject, mail.html, mail.text]) assert.ok(!part.includes('INJECT_ME'));
  const template = structuredClone(DEFAULT_EMAIL);
  template.templates.receipt.subject = '{namn}';
  assert.equal(renderEmail(template, 'receipt', { visitor }).subject, '{namn}');
});

test('images use the given origin and resources; footer links stay on the site', () => {
  const resources = resolveSlots({ emailAnimated: '/media/00000000-0000-4000-8000-000000000001.gif' }, [{ src: '/media/00000000-0000-4000-8000-000000000001.gif', alt: 'Egen "bild"' }]);
  assert.deepEqual(resources.emailAnimated, { src: '/media/00000000-0000-4000-8000-000000000001.gif', alt: 'Egen "bild"' });
  assert.deepEqual(resources.emailStatic, { src: '/mail/omar-smile.png', alt: 'En gul figur som ler tillbaka' });
  const mail = renderEmail(undefined, 'receipt', { resources, origin: 'https://preview.example' });
  assert.ok(mail.html.includes('<img src="https://preview.example/media/00000000-0000-4000-8000-000000000001.gif" alt="Egen &quot;bild&quot;"'));
  assert.ok(mail.html.includes('<img src="https://preview.example/mail/omar-smile.png"'));
  assert.ok(mail.html.includes('<a href="https://omaryusuf.se/integritet/"'));
  assert.ok(mail.html.includes('href="https://omaryusuf.se/verkstad/"'));
});

test('plain text, sender and custom mail', () => {
  assert.equal(senderAddress(undefined), 'Omar Yusuf <hej@hej.omaryusuf.se>');
  assert.equal(senderAddress({ ...DEFAULT_EMAIL, sender: { name: 'Studion', local: 'post' } }), 'Studion <post@hej.omaryusuf.se>');
  assert.equal(plainText(DEFAULT_EMAIL.templates.receipt.blocks.slice(8)), '/ Omar\n\nTa en liten omväg till verkstaden →: https://omaryusuf.se/verkstad/\n\nKvittot tar inte emot svar. Något mer på hjärtat? Postluckan finns kvar. (https://omaryusuf.se/kontakt/)');
  const custom = renderCustom(customMail(DEFAULT_EMAIL.templates.receipt.blocks), { ...DEFAULT_EMAIL, sender: { name: 'Studion', local: 'post' } });
  assert.equal(custom.subject, 'Hej');
  assert.equal(custom.from, 'Studion <post@hej.omaryusuf.se>');
  assert.ok(custom.html.includes('<title>Ett brev från Studion</title>'));
  assert.ok(custom.text.endsWith('\n\nIntegritet: https://omaryusuf.se/integritet/'));
  assert.ok(Object.isFrozen(DEFAULT_EMAIL.templates.receipt.blocks[0].style));
  for (const value of ['mira@example.org', 'a.b+c@sub.example.se']) assert.equal(isEmailAddress(value), true, value);
  for (const value of ['mira@example', 'a..b@example.org', '.a@example.org', 'a.@example.org', 'a@b@example.org', 42]) assert.equal(isEmailAddress(value), false, String(value));
});

test('renderer is pure', () => {
  const source = readFileSync(new URL('../src/server/email-render.mjs', import.meta.url), 'utf8');
  assert.deepEqual([...source.matchAll(/^import\b.*from\s+'([^']+)';$/gm)].map(match => match[1]), ['../content/resources.mjs']);
  assert.equal(source.match(/\bimport\b/g).length, 1);
  assert.doesNotMatch(source, /\benv\b|\bfetch\b|\bDate\b|Math\.random|\bcrypto\b|\bconsole\b|\bprocess\b|node:/);
});
