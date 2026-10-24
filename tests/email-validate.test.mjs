import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';
import { validateEmailIdentity, validateEmailSettings, validateCustomMail } from '../src/cms/email-validate.mjs';

test('identity shares sender and shell rules without depending on templates', () => {
  assert.equal(validateEmailIdentity(undefined), undefined);
  assert.equal(validateEmailIdentity(null), undefined);
  const { sender, shell } = structuredClone(DEFAULT_EMAIL);
  assert.deepEqual(validateEmailIdentity({ sender, shell }), { sender, shell });
  for (const [section, key, value] of [['sender', 'name', 'Omar\nBcc: x'], ['sender', 'local', 'a..b'], ['shell', 'brand', 'x'.repeat(41)], ['shell', 'tagline', 'x'.repeat(201)]]) {
    const input = { sender: { ...sender }, shell: { ...shell } };
    input[section][key] = value;
    for (const validate of [() => validateEmailIdentity(input), () => validateEmailSettings({ ...structuredClone(DEFAULT_EMAIL), ...input })]) {
      assert.throws(validate, error => error.status === 422 && error.details.field === `${section}.${key}`);
    }
  }
  assert.throws(() => validateEmailIdentity({ sender, shell, templates: {} }), error => error.status === 422 && error.details.field === 'templates');
});

// Replace each string leaf: free text, href, enums, IDs, colours and image refs.
// Appending a surrogate to a valid URL must not be repaired by new URL().
function stringLeaves(object, path = []) {
  return Object.entries(object).flatMap(([key, value]) => typeof value === 'string' ? [[...path, key]] : value && typeof value === 'object' ? stringLeaves(value, [...path, key]) : []);
}
const pathLabel = path => path.map((key, index) => /^\d+$/.test(key) ? `[${key}]` : `${index ? '.' : ''}${key}`).join('');

test('every validated string rejects lone high and low surrogates with its field', () => {
  const settings = structuredClone(DEFAULT_EMAIL);
  settings.templates.receipt.blocks[2].alt = 'Alternativtext';
  const template = settings.templates.receipt;
  const mail = { subject: 'Hej', preheader: '', blocks: template.blocks, design: template.design };
  for (const [input, validate] of [[settings, validateEmailSettings], [mail, validateCustomMail], [{ sender: settings.sender, shell: settings.shell }, validateEmailIdentity]]) {
    for (const path of stringLeaves(input)) {
      for (const surrogate of ['\ud800', '\udfff']) {
        const copy = structuredClone(input), parent = path.slice(0, -1).reduce((value, key) => value[key], copy), key = path.at(-1);
        parent[key] += surrogate;
        assert.throws(() => validate(copy), error => error.status === 422 && error.details.field === pathLabel(path), `${pathLabel(path)}: ${surrogate.charCodeAt(0)}`);
      }
    }
  }
});

test('well-formed surrogate pairs remain accepted in text, shell and links', () => {
  const email = structuredClone(DEFAULT_EMAIL);
  email.shell.tagline = 'Hej 👋';
  email.templates.receipt.subject = 'Hej 👋';
  email.templates.receipt.blocks[5].text = 'Hej 👋';
  email.templates.receipt.blocks[9].href = 'https://example.org/👋';
  assert.deepEqual(validateEmailSettings(email), email);
});
