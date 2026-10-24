import { HttpError } from '../cms/http.mjs';
import { isEmailAddress } from './email-render.mjs';

// Contact settings saved in D1, encrypted under a key derived from
// CONTACT_HASH_SECRET. No value, ciphertext or master ever leaves this module
// in an error, and nothing here logs.
export const SECRET_NAMES = Object.freeze(['RESEND_API_KEY', 'CONTACT_TO', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY']);
const FORMATS = {
  RESEND_API_KEY: [value => /^re_[A-Za-z0-9_]{8,200}$/.test(value), 'Resend-nyckeln ska börja med re_ och sakna blanksteg.'],
  CONTACT_TO: [isEmailAddress, 'Mottagaradressen är inte en giltig mejladress.'],
  TURNSTILE_SITE_KEY: [value => /^0x[A-Za-z0-9_-]{10,100}$/.test(value), 'Robotskyddets webbplatsnyckel ser inte rätt ut.'],
  TURNSTILE_SECRET_KEY: [value => /^0x[A-Za-z0-9_-]{10,200}$/.test(value), 'Robotskyddets hemliga nyckel ser inte rätt ut.'],
};
const utf8 = value => new TextEncoder().encode(value);
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

export const masterReady = env => typeof env.CONTACT_HASH_SECRET === 'string' && env.CONTACT_HASH_SECRET.length >= 32;

async function derive(master, info, algorithm, usages) {
  const base = await crypto.subtle.importKey('raw', utf8(master), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: utf8(info) }, base, algorithm, false, usages);
}
const secretKey = master => derive(master, 'omaryusuf.se/contact-secrets/aes-256-gcm/v1', { name: 'AES-GCM', length: 256 }, ['encrypt', 'decrypt']);
const linkKey = master => derive(master, 'omaryusuf.se/mail-file-link/hmac-sha256/v1', { name: 'HMAC', hash: 'SHA-256', length: 256 }, ['sign', 'verify']);

export function validateSecretValue(name, value) {
  if (!SECRET_NAMES.includes(name)) return { ok: false, message: `Okänt värde: ${name}.` };
  if (value === '') return { ok: true, value };
  const [valid, message] = FORMATS[name];
  return typeof value === 'string' && value.length <= 1024 && valid(value) ? { ok: true, value } : { ok: false, message };
}

export async function encryptSecret(master, name, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: utf8(name), tagLength: 128 }, await secretKey(master), utf8(value)));
  return { iv, ciphertext };
}

export async function decryptSecret(master, name, { iv, ciphertext }) {
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv), additionalData: utf8(name), tagLength: 128 }, await secretKey(master), new Uint8Array(ciphertext));
    return { ok: true, value: new TextDecoder('utf-8', { fatal: true }).decode(plain) };
  } catch { return { ok: false }; }
}

export async function readContactSettings(env) {
  // Every name is present in `values`, so `{ ...env, ...values }` never lets an
  // unreadable or undecryptable saved value fall back to the env binding.
  const values = Object.fromEntries(SECRET_NAMES.map(name => [name, undefined])), states = {}, updatedAt = {};
  let rows = [];
  // Missing binding, missing table (before 0007) or a D1 error: env only.
  if (env.CMS_DB) try { rows = (await env.CMS_DB.prepare('SELECT name, iv, ciphertext, updated_at FROM cms_contact_secrets').all()).results ?? []; } catch { rows = []; }
  const master = masterReady(env) ? env.CONTACT_HASH_SECRET : null;
  for (const name of SECRET_NAMES) {
    const row = rows.find(row => row.name === name);
    if (row) {
      updatedAt[name] = row.updated_at;
      const result = master ? await decryptSecret(master, name, row) : { ok: false };
      if (result.ok) { values[name] = result.value; states[name] = 'saved'; }
      else states[name] = master ? 'unreadable' : 'missing';
    } else if (typeof env[name] === 'string' && env[name]) { values[name] = env[name]; states[name] = 'environment'; }
    else states[name] = 'missing';
  }
  return { values, states, updatedAt };
}

export async function writeContactSecrets(env, patch, actor) {
  if (!masterReady(env)) throw new HttpError(503, 'Huvudnyckeln saknas. Inget sparades.');
  const entries = Object.entries(patch);
  for (const [name, value] of entries) {
    const result = validateSecretValue(name, value);
    if (!result.ok) throw new HttpError(422, result.message, { field: name });
  }
  const now = new Date().toISOString();
  const statements = await Promise.all(entries.map(async ([name, value]) => {
    if (value === '') return env.CMS_DB.prepare('DELETE FROM cms_contact_secrets WHERE name = ?').bind(name);
    const { iv, ciphertext } = await encryptSecret(env.CONTACT_HASH_SECRET, name, value);
    return env.CMS_DB.prepare('INSERT INTO cms_contact_secrets(name,iv,ciphertext,updated_at,updated_by) VALUES(?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET iv=excluded.iv, ciphertext=excluded.ciphertext, updated_at=excluded.updated_at, updated_by=excluded.updated_by')
      .bind(name, iv.buffer, ciphertext.buffer, now, actor);
  }));
  if (statements.length) await env.CMS_DB.batch(statements);
}

export async function signFileLink(env, id, exp) {
  if (!masterReady(env)) throw new HttpError(503, 'Huvudnyckeln saknas.');
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await linkKey(env.CONTACT_HASH_SECRET), utf8(`${id}\n${exp}`)));
  return `/mail-file/${id}/${exp}/${base64url(signature)}`;
}

// Format, signature and "not expired". The upper bound of the window belongs
// to the caller, which owns SCHEDULE_MAX_DAYS.
export async function verifyFileLink(env, id, exp, sig, nowSeconds) {
  if (!masterReady(env) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id) || !/^\d{1,12}$/.test(exp) || Number(exp) < nowSeconds || !/^[A-Za-z0-9_-]{43}$/.test(sig)) return false;
  const signature = Uint8Array.from(atob(sig.replaceAll('-', '+').replaceAll('_', '/') + '='), char => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', await linkKey(env.CONTACT_HASH_SECRET), signature, utf8(`${id}\n${exp}`));
}
