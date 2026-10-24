import { reportFailure } from './diagnostics.mjs';
import { HttpError, json, readJson, requireWriteRequest } from './http.mjs';
import { resolveResources } from './resources.mjs';
import { validateCustomMail, validateEmailSettings } from './email-validate.mjs';
import { contactReady } from '../server/contact.mjs';
import { masterReady, readContactSettings, SECRET_NAMES, signFileLink, verifyFileLink, writeContactSecrets } from '../server/contact-secrets.mjs';
import { DEFAULT_EMAIL, isEmailAddress, renderCustom, renderEmail, senderAddress } from '../server/email-render.mjs';

// The owner's mail desk. Only POST /emails, GET /emails/{id} and
// POST /emails/{id}/cancel are called. Every check runs before the provider
// call, and a row is stored only after Resend confirms an id.
export const SCHEDULE_MAX_DAYS = 30;
const RESEND = 'https://api.resend.com/emails';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESEND_ID = /^[A-Za-z0-9_-]{1,100}$/;
const SAMPLE = { name: 'Mira Test', email: 'mira@example.org', message: 'En fråga från provmejlet.' };
const PUBLIC_VALUES = new Set(['TURNSTILE_SITE_KEY', 'CONTACT_TO']);
const FILE_TYPES = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', txt: 'text/plain', csv: 'text/csv', ics: 'text/calendar', zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
const RESOURCE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_FILE_BYTES = 31457280;
const STATUS_LABELS = { scheduled: 'Schemalagt', queued: 'I kö', sent: 'Skickat', delivered: 'Levererat', delivery_delayed: 'Försenat', bounced: 'Studsade', complained: 'Markerat som skräp', opened: 'Öppnat', clicked: 'Klickat', canceled: 'Avbrutet', failed: 'Misslyckades' };
const UNAVAILABLE = 'Resend svarar inte just nu. Försök igen; samma utskick skickas inte två gånger.';
const NOT_CONFIGURED = 'Formuläret saknar värden. Fyll i Inställningar först.';
const INVALID_SEND = 'Utskicket är ogiltigt.';
const iso = ms => new Date(ms).toISOString();
const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);
const reject = (message, field) => new HttpError(422, message, field ? { field } : undefined);

function sanitise(message, key) {
  let text = typeof message === 'string' ? message : 'okänt fel';
  if (typeof key === 'string' && key) text = text.split(key).join('[nyckel]');
  return text.replace(/re_[A-Za-z0-9_]+/g, '[nyckel]').slice(0, 300);
}

async function resend(transport, key, path, { method = 'GET', body, idempotency, restrictedOk = false } = {}) {
  let response;
  try {
    response = await transport(RESEND + path, {
      method,
      headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(idempotency ? { 'Idempotency-Key': idempotency } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(12000),
    });
  } catch { throw new HttpError(503, UNAVAILABLE); }
  if (response.ok) return response.json().catch(() => { throw new HttpError(503, UNAVAILABLE); });
  const error = await response.json().catch(() => ({}));
  const status = response.status;
  if (status === 401 && error?.name === 'restricted_api_key') {
    if (restrictedOk) return { restricted: true };
    throw new HttpError(403, 'Nyckeln saknar behörighet för status och avbryt.');
  }
  if (status === 401 || status === 403) throw new HttpError(502, 'Nyckeln godtas inte av Resend. Klistra in en ny i Inställningar.');
  if (status === 400 || status === 422) throw new HttpError(422, `Resend: ${sanitise(error?.message, key)}`);
  if (status === 409) throw new HttpError(409, 'Samma utskick skickades redan med annat innehåll. Ladda om fliken.');
  if (status === 429) throw new HttpError(429, 'Resend begränsar takten. Vänta en minut.');
  throw new HttpError(503, UNAVAILABLE);
}

function sentId(result) {
  if (typeof result?.id !== 'string' || !RESEND_ID.test(result.id)) throw new HttpError(503, 'Resend bekräftade inte utskicket.');
  return result.id;
}

// A retry of a confirmed send replays the same Resend id; DO NOTHING keeps it
// from failing on the UNIQUE column.
const sentStatements = (db, { id, kind, recipients, subject, attachments, createdAt, scheduledAt, actor }) => [
  db.prepare('INSERT INTO cms_sent_mail(resend_id,kind,recipients,subject,attachments,created_at,scheduled_at,actor) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(resend_id) DO NOTHING')
    .bind(id, kind, JSON.stringify(recipients), subject, attachments, createdAt, scheduledAt, actor),
  db.prepare('DELETE FROM cms_sent_mail WHERE id NOT IN (SELECT id FROM cms_sent_mail ORDER BY id DESC LIMIT 100)'),
];

async function rateLimited(env, identity) {
  if (typeof env.CONTACT_RATE_LIMIT?.limit !== 'function') throw new HttpError(503, 'Hastighetsgränsen saknas. Inget skickades.');
  if ((await env.CONTACT_RATE_LIMIT.limit({ key: 'admin-mail:' + identity.email })).success) return null;
  return json({ error: 'Vänta en minut innan nästa utskick.' }, 429, { 'Retry-After': '60' });
}

async function cleanup(env, now) {
  try {
    const { results } = await env.CMS_DB.prepare('SELECT id, object_key FROM cms_mail_files WHERE expires_at < ? ORDER BY expires_at LIMIT 20').bind(iso(now())).all();
    if (!results.length) return;
    await env.CMS_MEDIA.delete(results.map(row => row.object_key));
    await env.CMS_DB.prepare('DELETE FROM cms_mail_files WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(results.map(row => row.id))).run();
  } catch (error) { reportFailure(error, 'mail'); }
}

async function settingsView(env) {
  const { values, states, updatedAt } = await readContactSettings(env);
  return {
    master: masterReady(env) ? 'ok' : 'missing',
    rateLimit: typeof env.CONTACT_RATE_LIMIT?.limit === 'function',
    forwarding: null,
    ready: contactReady({ ...env, ...values }),
    values: Object.fromEntries(SECRET_NAMES.map(name => {
      const value = values[name];
      const entry = { state: states[name], hint: value ? value.slice(-4) : null, updatedAt: updatedAt[name] ?? null };
      return [name, PUBLIC_VALUES.has(name) ? { ...entry, value: value ?? null } : entry];
    })),
  };
}

async function sentRow(env, id) {
  const row = typeof id === 'string' && RESEND_ID.test(id) ? await env.CMS_DB.prepare('SELECT scheduled_at, canceled_at FROM cms_sent_mail WHERE resend_id = ?').bind(id).first() : null;
  if (!row) throw new HttpError(404, 'Utskicket finns inte i listan.');
  return row;
}

async function providerKey(env) {
  const { values } = await readContactSettings(env);
  if (!values.RESEND_API_KEY) throw new HttpError(503, NOT_CONFIGURED);
  return values;
}

function recipients(body) {
  const seen = new Set(), lists = {};
  for (const field of ['to', 'cc', 'bcc']) {
    const list = body[field] ?? [];
    if (!Array.isArray(list)) throw reject(INVALID_SEND, field);
    lists[field] = [];
    for (const address of list) {
      if (!isEmailAddress(address)) throw reject(`Ogiltig adress: ${String(address).slice(0, 254)}.`, field);
      if (seen.has(address.toLowerCase())) continue;
      seen.add(address.toLowerCase());
      lists[field].push(address);
    }
  }
  if (!lists.to.length) throw reject('Lägg till minst en mottagare.', 'to');
  if (seen.size > 50) throw reject('Högst 50 mottagare sammanlagt (till, kopia och dold kopia).', 'to');
  return lists;
}

function scheduleTime(value, nowMs) {
  if (value === null || value === undefined) return null;
  const ms = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(ms)) throw reject('Tiden är ogiltig.', 'scheduledAt');
  if (ms <= nowMs + 60000) throw reject('Tiden har redan passerat. Välj en tid minst en minut fram.', 'scheduledAt');
  if (ms > nowMs + SCHEDULE_MAX_DAYS * 86400000) throw reject(`Resend kan schemalägga högst ${SCHEDULE_MAX_DAYS} dagar fram.`, 'scheduledAt');
  return ms;
}

async function attachmentFiles(env, list = [], nowMs) {
  if (!Array.isArray(list)) throw reject(INVALID_SEND, 'attachments');
  if (list.length > 10) throw reject('Högst 10 bilagor per mejl.', 'attachments');
  const files = [];
  for (const item of list) {
    if (!isRecord(item) || Object.keys(item).length !== 2 || !['resource', 'upload'].includes(item.kind) || typeof item.id !== 'string' || !UUID.test(item.id)) throw reject(INVALID_SEND, 'attachments');
    if (item.kind === 'resource') {
      const row = await env.CMS_DB.prepare('SELECT object_key, name, mime, bytes FROM cms_media WHERE id = ? AND published_at IS NOT NULL AND trashed_at IS NULL AND deleting_at IS NULL').bind(item.id).first();
      if (!row) throw reject('Filen är inte publicerad än. Bifoga den från datorn i stället.', 'attachments');
      if (!RESOURCE_TYPES.includes(row.mime)) throw reject('Filtypen kan inte skickas som bilaga.', 'attachments');
      files.push({ ...item, ...row });
    } else {
      const row = await env.CMS_DB.prepare('SELECT name, mime, bytes FROM cms_mail_files WHERE id = ? AND sent_at IS NULL AND expires_at > ?').bind(item.id, iso(nowMs)).first();
      if (!row) throw reject('Bilagan har gått ut. Ladda upp den igen.', 'attachments');
      files.push({ ...item, ...row });
    }
  }
  if (files.reduce((sum, file) => sum + 4 * Math.ceil(file.bytes / 3), 0) > 41943040) throw reject('Bilagorna blir för stora för ett mejl (högst 40 MB efter kodning).', 'attachments');
  return files;
}

async function saveSettings(request, env, { identity, now }) {
  requireWriteRequest(request);
  const body = await readJson(request, 8 * 1024);
  if (!isRecord(body) || !isRecord(body.values)) throw reject('Inställningarna är ogiltiga.');
  await writeContactSecrets(env, body.values, identity.email, now);
  return json(await settingsView(env));
}

async function testMail(request, env, { identity, url, head, transport, now }) {
  requireWriteRequest(request);
  const body = await readJson(request, 256 * 1024);
  if (!isRecord(body) || typeof body.requestId !== 'string' || !UUID.test(body.requestId) || !['receipt', 'notification'].includes(body.template)) throw reject('Provmejlet är ogiltigt.');
  const draft = validateEmailSettings(body.email);
  const project = await head();
  const rendered = renderEmail(draft, body.template, { resources: await resolveResources(env.CMS_DB, project), origin: url.origin, visitor: SAMPLE });
  const values = await providerKey(env);
  if (!isEmailAddress(values.CONTACT_TO)) throw new HttpError(503, NOT_CONFIGURED);
  const limited = await rateLimited(env, identity);
  if (limited) return limited;
  const subject = '[Prov] ' + rendered.subject;
  const id = sentId(await resend(transport, values.RESEND_API_KEY, '', { method: 'POST', idempotency: `mail-test/${body.requestId}`, body: { from: rendered.from, to: [values.CONTACT_TO], subject, html: rendered.html, text: rendered.text } }));
  await env.CMS_DB.batch(sentStatements(env.CMS_DB, { id, kind: 'test', recipients: { to: [values.CONTACT_TO], cc: [], bcc: [] }, subject, attachments: 0, createdAt: iso(now()), scheduledAt: null, actor: identity.email }));
  return json({ id });
}

async function sendMail(request, env, { identity, url, head, transport, now }) {
  requireWriteRequest(request);
  const body = await readJson(request, 256 * 1024);
  if (!isRecord(body) || typeof body.requestId !== 'string' || !UUID.test(body.requestId)) throw reject(INVALID_SEND);
  const nowMs = now();
  const lists = recipients(body);
  const mail = validateCustomMail({ subject: body.subject, preheader: body.preheader, blocks: body.blocks, design: body.design });
  const scheduledMs = scheduleTime(body.scheduledAt, nowMs);
  const files = await attachmentFiles(env, body.attachments, nowMs);
  const values = await providerKey(env);
  if (files.some(file => file.kind === 'upload') && !masterReady(env)) throw new HttpError(503, 'Huvudnyckeln saknas.');
  const project = await head();
  const rendered = renderCustom(mail, project.email, { resources: await resolveResources(env.CMS_DB, project), origin: url.origin });
  const from = senderAddress(project.email ?? DEFAULT_EMAIL);
  const limited = await rateLimited(env, identity);
  if (limited) return limited;
  await cleanup(env, now);
  // Resend fetches a `path` attachment at send time, so a link lives until an
  // hour after the scheduled (or immediate) send.
  const exp = Math.floor((scheduledMs ?? nowMs) / 1000) + 3600;
  const attachments = await Promise.all(files.map(async file => ({
    filename: file.name,
    path: file.kind === 'upload' ? url.origin + await signFileLink(env, file.id, exp) : new URL('/media/' + file.object_key, url.origin).href,
  })));
  const scheduledAt = scheduledMs === null ? null : iso(scheduledMs);
  const id = sentId(await resend(transport, values.RESEND_API_KEY, '', { method: 'POST', idempotency: `mail/${body.requestId}`, body: {
    from, to: lists.to, ...(lists.cc.length ? { cc: lists.cc } : {}), ...(lists.bcc.length ? { bcc: lists.bcc } : {}),
    subject: rendered.subject, html: rendered.html, text: rendered.text,
    ...(scheduledAt ? { scheduled_at: scheduledAt } : {}), ...(attachments.length ? { attachments } : {}),
  } }));
  const uploads = files.filter(file => file.kind === 'upload').map(file => file.id);
  await env.CMS_DB.batch([
    ...sentStatements(env.CMS_DB, { id, kind: 'custom', recipients: lists, subject: rendered.subject, attachments: files.length, createdAt: iso(nowMs), scheduledAt, actor: identity.email }),
    ...(uploads.length ? [env.CMS_DB.prepare('UPDATE cms_mail_files SET sent_at = ?, expires_at = ? WHERE id IN (SELECT value FROM json_each(?))').bind(iso(nowMs), iso(exp * 1000), JSON.stringify(uploads))] : []),
  ]);
  return json({ id, scheduledAt, from });
}

async function sentList(env) {
  const { results } = await env.CMS_DB.prepare('SELECT resend_id, kind, recipients, subject, attachments, created_at, scheduled_at, canceled_at FROM cms_sent_mail ORDER BY id DESC LIMIT 100').all();
  return json({ items: results.map(row => {
    const { to, cc, bcc } = JSON.parse(row.recipients);
    return { id: row.resend_id, kind: row.kind, to, cc, bcc, subject: row.subject, createdAt: row.created_at, scheduledAt: row.scheduled_at, canceledAt: row.canceled_at, attachments: row.attachments };
  }) });
}

async function mailStatus(env, { url, transport }) {
  const id = url.searchParams.get('id');
  await sentRow(env, id);
  const result = await resend(transport, (await providerKey(env)).RESEND_API_KEY, '/' + encodeURIComponent(id), { restrictedOk: true });
  if (result.restricted) return json({ id, restricted: true });
  const status = typeof result.last_event === 'string' ? result.last_event : '';
  return json({ id, status, label: STATUS_LABELS[status] ?? `Okänd status (${status.slice(0, 40)})` });
}

async function cancelMail(request, env, { transport, now }) {
  requireWriteRequest(request);
  const id = (await readJson(request, 1024))?.id;
  const row = await sentRow(env, id);
  if (row.canceled_at) return json({ id, canceledAt: row.canceled_at });
  if (!row.scheduled_at || Date.parse(row.scheduled_at) <= now()) throw new HttpError(409, 'Mejlet är redan på väg och kan inte stoppas.');
  const result = await resend(transport, (await providerKey(env)).RESEND_API_KEY, `/${encodeURIComponent(id)}/cancel`, { method: 'POST', restrictedOk: true });
  if (result.restricted) return json({ id, restricted: true });
  const canceledAt = iso(now());
  await env.CMS_DB.prepare('UPDATE cms_sent_mail SET canceled_at = ? WHERE resend_id = ?').bind(canceledAt, id).run();
  return json({ id, canceledAt });
}

async function uploadFile(request, env, { now }) {
  requireWriteRequest(request, 'application/octet-stream');
  if (!masterReady(env)) throw new HttpError(503, 'Huvudnyckeln saknas.');
  const length = request.headers.get('Content-Length');
  if (length === null || !/^\d+$/.test(length)) throw new HttpError(411, 'Filens storlek saknas.');
  const size = Number(length);
  if (size > MAX_FILE_BYTES) throw new HttpError(413, 'Bilagan får vara högst 30 MB.');
  let name;
  try { name = decodeURIComponent(request.headers.get('X-CMS-Filename') ?? ''); }
  catch { throw new HttpError(400, 'Filens uppgifter kunde inte läsas.'); }
  if (!size || !name || name.length > 120 || /[/\\\u0000-\u001f\u007f]/.test(name)) throw new HttpError(400, 'Filens uppgifter kunde inte läsas.');
  const mime = FILE_TYPES[name.includes('.') ? name.split('.').pop().toLowerCase() : ''];
  if (!mime) throw reject('Filtypen kan inte skickas som bilaga. Tillåtna: pdf, png, jpg, gif, webp, txt, csv, ics, zip, docx, xlsx, pptx.');
  await cleanup(env, now);
  const id = crypto.randomUUID(), key = 'mail-private/' + id;
  // The body streams straight into R2; the Worker never holds the file.
  const object = await env.CMS_MEDIA.put(key, request.body, { httpMetadata: { contentType: mime, contentDisposition: 'attachment' } });
  if (object?.size !== size) {
    await env.CMS_MEDIA.delete(key);
    throw new HttpError(400, 'Filen kom inte fram hel. Försök igen.');
  }
  const expiresAt = iso(now() + 86400000);
  try { await env.CMS_DB.prepare('INSERT INTO cms_mail_files(id,object_key,name,mime,bytes,created_at,expires_at) VALUES(?,?,?,?,?,?,?)').bind(id, key, name, mime, size, iso(now()), expiresAt).run(); }
  catch (error) { await env.CMS_MEDIA.delete(key); throw error; }
  return json({ id, name, size, mime, expiresAt }, 201);
}

async function removeFile(request, env) {
  requireWriteRequest(request);
  const id = (await readJson(request, 1024))?.id;
  const row = typeof id === 'string' && UUID.test(id) ? await env.CMS_DB.prepare('SELECT object_key FROM cms_mail_files WHERE id = ? AND sent_at IS NULL').bind(id).first() : null;
  if (!row) throw new HttpError(404, 'Bilagan finns inte.');
  await env.CMS_MEDIA.delete(row.object_key);
  await env.CMS_DB.prepare('DELETE FROM cms_mail_files WHERE id = ?').bind(id).run();
  return json({ removed: true });
}

const WRITES = {
  '/admin/api/contact': saveSettings,
  '/admin/api/mail/test': testMail,
  '/admin/api/mail/send': sendMail,
  '/admin/api/mail/cancel': cancelMail,
  '/admin/api/mail/attachment': uploadFile,
  '/admin/api/mail/attachment-remove': removeFile,
};

// `head` returns the normalized published project (or the seed before the
// first publish); sender, images and resources always come from it.
export async function handleEmailAdmin(request, env, { identity, url, head, transport = fetch, now = Date.now }) {
  const read = request.method === 'GET' || request.method === 'HEAD';
  if (read && url.pathname === '/admin/api/contact') return json(await settingsView(env));
  if (!env.CMS_DB) throw new HttpError(503, 'Studions lagring är inte tillgänglig.');
  const context = { identity, url, head, transport, now };
  try {
    if (read && url.pathname === '/admin/api/mail/sent') return await sentList(env);
    if (read && url.pathname === '/admin/api/mail/status') return await mailStatus(env, context);
    const handler = WRITES[url.pathname];
    if (!handler) throw new HttpError(404, 'Åtgärden finns inte.');
    return await handler(request, env, context);
  } catch (error) {
    if (/no such table/i.test(String(error?.message ?? ''))) throw new HttpError(503, 'Mejltabellerna saknas. Kör databasens migrering.');
    throw error;
  }
}

// Public, signature-gated download for Resend. One HMAC verify and one D1 read;
// the R2 body is passed through unread.
export async function serveMailFile(request, env, now = Date.now) {
  if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Länken kan bara hämtas.' }, 405, { Allow: 'GET, HEAD' });
  const [, , id = '', exp = '', sig = '', extra] = new URL(request.url).pathname.split('/');
  const nowSeconds = Math.floor(now() / 1000);
  const denied = () => json({ error: 'Länken gäller inte.' }, 403);
  if (extra !== undefined || !env.CMS_DB || !/^\d{1,12}$/.test(exp) || Number(exp) > nowSeconds + SCHEDULE_MAX_DAYS * 86400 + 3600 + 60) return denied();
  if (!await verifyFileLink(env, id, exp, sig, nowSeconds)) return denied();
  const row = await env.CMS_DB.prepare('SELECT name, mime FROM cms_mail_files WHERE id = ?').bind(id).first();
  if (!row) return denied();
  const key = 'mail-private/' + id;
  const object = request.method === 'HEAD' ? await env.CMS_MEDIA.head(key) : await env.CMS_MEDIA.get(key);
  if (!object) return json({ error: 'Filen finns inte längre.' }, 404);
  return new Response(request.method === 'HEAD' ? null : object.body, { headers: {
    'Content-Type': row.mime,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.name)}`,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  } });
}
