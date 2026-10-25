import { reportFailure } from './diagnostics.mjs';
import { cleanupMailFiles, discardMailUpload, removeMailFile, MAIL_FILE_LIFETIME } from './mail-files.mjs';
import { HttpError, errorResponse, json, readJson, requireWriteRequest } from './http.mjs';
import { resolveResources } from './resources.mjs';
import { validateCustomMail, validateEmailIdentity, validateEmailSettings } from './email-validate.mjs';
import { contactReady } from '../server/contact.mjs';
import { masterReady, readContactSettings, SECRET_NAMES, signFileLink, verifyFileLink, writeContactSecrets } from '../server/contact-secrets.mjs';
import { DEFAULT_EMAIL, isEmailAddress, renderCustom, renderEmail } from '../server/email-render.mjs';

// The owner's mail desk. Only POST /emails, GET /emails/{id} and
// POST /emails/{id}/cancel are called. Every check runs before the provider
// call. An intent is stored first; ambiguous answers leave it unconfirmed.
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
  // Explicit provider refusal, independent of the CMS status/message mapping.
  const refused = (status, message) => Object.assign(new HttpError(status, message, { refused: true }), { resendRefused: true });
  if (status === 401 && error?.name === 'restricted_api_key') {
    if (restrictedOk) return { restricted: true };
    throw refused(403, 'Nyckeln saknar behörighet för status och avbryt.');
  }
  if (status === 401 || status === 403) throw refused(502, 'Nyckeln godtas inte av Resend. Klistra in en ny i Inställningar.');
  if (status === 400 || status === 422) throw refused(422, `Resend: ${sanitise(error?.message, key)}`);
  // A 409 can mean another same-key request is still running or was accepted
  // with different bytes. Neither response disproves delivery.
  if (status === 409) throw new HttpError(409, error?.name === 'concurrent_idempotent_requests'
    ? 'Samma utskick behandlas redan. Vänta och försök igen med samma utskick.'
    : 'Utskickets identitet används redan. Kontrollera mejlet i Resend: https://resend.com/emails', { uncertain: true });
  if (status === 429) throw refused(429, 'Resend begränsar takten. Vänta en minut.');
  throw new HttpError(503, UNAVAILABLE);
}

function sentId(result) {
  if (typeof result?.id !== 'string' || !RESEND_ID.test(result.id)) throw new HttpError(503, 'Resend bekräftade inte utskicket.');
  return result.id;
}

// Every send is keyed by its Idempotency-Key (`mail/…` or `mail-test/…`) in
// cms_sent_mail.request_id. The intent row is written before Resend is called
// and confirmed (resend_id set) after it answers, so:
// - a retry of a confirmed request returns the stored result without Resend;
// - a retry of a young unconfirmed one calls Resend with the same key;
// - after 23 hours an unconfirmed request requires manual checking in Resend.
// Pending scheduled sends and all unconfirmed intents are never evicted.
const PENDING = "(COALESCE(scheduled_at, '') > ?1 AND canceled_at IS NULL) OR resend_id IS NULL";
const sentByRequest = (env, requestId) => env.CMS_DB.prepare('SELECT resend_id, scheduled_at, sender, created_at FROM cms_sent_mail WHERE request_id = ?').bind(requestId).first();

// A later refusal cannot disprove delivery on the first attempt.
async function uncertainResponse(response) {
  const body = await response.json();
  if (body.details?.uncertain) return json(body, response.status, Object.fromEntries(response.headers));
  return json({ ...body, error: `${body.error} Det första försöket kan redan ha skickats. Kontrollera mejlet i Resend: https://resend.com/emails`, details: { ...body.details, uncertain: true } }, response.status, Object.fromEntries(response.headers));
}

function requireRetryWindow(existing, nowMs) {
  if (existing && nowMs - Date.parse(existing.created_at) > 23 * 3600000) throw new HttpError(409, 'Utskicket är äldre än 23 timmar och kan redan ha skickats. Kontrollera mejlet i Resend: https://resend.com/emails', { uncertain: true });
}

const discardIntent = async (db, requestId) => {
  const [removed] = await db.batch([
    db.prepare('DELETE FROM cms_sent_mail WHERE request_id = ? AND resend_id IS NULL AND send_attempts = 1').bind(requestId),
    db.prepare('UPDATE cms_mail_files SET claimed_by = NULL WHERE claimed_by = ?1 AND sent_at IS NULL AND NOT EXISTS (SELECT 1 FROM cms_sent_mail WHERE request_id = ?1)').bind(requestId),
  ]);
  return removed.meta.changes === 1;
};

async function discardFreshIntent(db, requestId) {
  try { return await discardIntent(db, requestId); }
  catch (error) { reportFailure(error, 'mail'); return false; }
}

async function deliver(env, existing, intent, call, reserve = [], uploadCount = 0) {
  const db = env.CMS_DB;
  // Register every attempt before it can reach Resend, including retries with
  // no attachments. A fresh refusal can discard only a never-shared intent.
  const results = await db.batch([
    ...(existing ? [] : [db.prepare('INSERT INTO cms_sent_mail(request_id,kind,recipients,subject,sender,attachments,created_at,scheduled_at,actor,send_attempts) VALUES(?,?,?,?,?,?,?,?,?,0)')
      .bind(intent.requestId, intent.kind, JSON.stringify(intent.recipients), intent.subject, intent.sender, intent.attachments, intent.createdAt, intent.scheduledAt, intent.actor)]),
    ...reserve,
    db.prepare('UPDATE cms_sent_mail SET send_attempts = send_attempts + 1 WHERE request_id = ? AND resend_id IS NULL').bind(intent.requestId),
  ]);
  if (results.at(-1)?.meta?.changes !== 1) throw new HttpError(409, 'Ett annat försök ändrade utskicket. Kontrollera mejlet i Resend: https://resend.com/emails', { uncertain: true });
  if (uploadCount && results.at(-2)?.meta?.changes !== uploadCount) {
    const discarded = !existing && await discardFreshIntent(db, intent.requestId);
    const error = reject('Bilagan har tagits bort eller används av ett annat utskick. Ladda upp den igen.', 'attachments');
    if (!discarded) error.details.uncertain = true;
    throw error;
  }
  try { return sentId(await call()); }
  catch (error) {
    // A fresh intent that Resend refused stores nothing (Kantfall 29). An older
    // intent may stand for an accepted send, so it stays for the next retry.
    if (!existing && error.resendRefused && !await discardFreshIntent(db, intent.requestId)) error.details = { ...error.details, uncertain: true };
    throw error;
  }
}

const finalize = (env, requestId, id, nowMs, extra = []) => env.CMS_DB.batch([
  env.CMS_DB.prepare('UPDATE cms_sent_mail SET resend_id = ? WHERE request_id = ?').bind(id, requestId),
  ...extra,
  env.CMS_DB.prepare(`DELETE FROM cms_sent_mail WHERE id NOT IN (SELECT id FROM cms_sent_mail ORDER BY id DESC LIMIT 100) AND NOT (${PENDING})`).bind(iso(nowMs)),
]);

async function rateLimited(env, identity) {
  if (typeof env.CONTACT_RATE_LIMIT?.limit !== 'function') throw new HttpError(503, 'Hastighetsgränsen saknas. Inget skickades.');
  if ((await env.CONTACT_RATE_LIMIT.limit({ key: 'admin-mail:' + identity.email })).success) return null;
  return json({ error: 'Vänta en minut innan nästa utskick.' }, 429, { 'Retry-After': '60' });
}

async function cleanup(env, now) {
  try { await cleanupMailFiles(env, now); }
  catch (error) { reportFailure(error, 'mail'); }
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

async function attachmentFiles(env, list = [], nowMs, requestId) {
  if (!Array.isArray(list)) throw reject(INVALID_SEND, 'attachments');
  if (list.length > 10) throw reject('Högst 10 bilagor per mejl.', 'attachments');
  const files = [], seen = new Set();
  for (const item of list) {
    if (!isRecord(item) || Object.keys(item).length !== 2 || !['resource', 'upload'].includes(item.kind) || typeof item.id !== 'string' || !UUID.test(item.id)) throw reject(INVALID_SEND, 'attachments');
    const key = item.id.toLowerCase();
    if (seen.has(key)) throw reject('Samma bilaga får bara bifogas en gång.', 'attachments');
    seen.add(key);
    if (item.kind === 'resource') {
      const row = await env.CMS_DB.prepare('SELECT object_key, name, mime, bytes FROM cms_media WHERE id = ? AND published_at IS NOT NULL AND trashed_at IS NULL AND deleting_at IS NULL').bind(item.id).first();
      if (!row) throw reject('Filen är inte publicerad än. Bifoga den från datorn i stället.', 'attachments');
      if (!RESOURCE_TYPES.includes(row.mime)) throw reject('Filtypen kan inte skickas som bilaga.', 'attachments');
      files.push({ ...item, ...row });
    } else {
      // An immediate link expires with its upload row, so keep an hour of margin for Resend's fetch.
      const row = await env.CMS_DB.prepare("SELECT name, mime, bytes, expires_at FROM cms_mail_files WHERE id = ? AND state = 'ready' AND sent_at IS NULL AND (claimed_by IS NULL OR claimed_by = ?) AND expires_at > ?").bind(item.id, requestId, iso(nowMs + 3600000)).first();
      if (!row) throw reject('Bilagan har gått ut. Ladda upp den igen.', 'attachments');
      files.push({ ...item, ...row });
    }
  }
  if (files.reduce((sum, file) => sum + 4 * Math.ceil(file.bytes / 3), 0) > 41943040) throw reject('Bilagorna blir för stora för ett mejl (högst 40 MB efter kodning).', 'attachments');
  return files;
}

// Resolve direct and slot-based image references together, including Outlook.
async function requirePublishedImages(db, blocks, resources, path) {
  const refs = blocks.flatMap((block, index) => block.type === 'image' ? ['src', 'msoSrc'].flatMap(field => {
    const src = resources?.[block[field]] ?? block[field];
    return typeof src === 'string' && src.startsWith('/media/') ? [{ key: src.slice(7), field: `${path}[${index}].${field}` }] : [];
  }) : []);
  if (!refs.length) return;
  const { results } = await db.prepare('SELECT object_key FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?)) AND published_at IS NOT NULL AND trashed_at IS NULL AND deleting_at IS NULL').bind(JSON.stringify([...new Set(refs.map(ref => ref.key))])).all();
  const published = new Set(results.map(row => row.object_key));
  const missing = refs.find(ref => !published.has(ref.key));
  if (missing) throw reject('Bilden i blocket är inte publicerad eller har tagits bort. Välj en publicerad bild.', missing.field);
}

async function saveSettings(request, env, { identity, now }) {
  requireWriteRequest(request);
  const body = await readJson(request, 8 * 1024);
  if (!isRecord(body) || !isRecord(body.values)) throw reject('Inställningarna är ogiltiga.');
  await writeContactSecrets(env, body.values, identity.email, now);
  return json(await settingsView(env));
}

// E3 carries full draft settings; E4 carries sender and shell only. Even the
// conservative E3 text budget, 2 * 40 * 2000 * 3 + 2 * 10000 * 3 = 540000
// bytes, leaves ample room for JSON/other fields under 1 MiB. Notification
// actually needs one visitor block in place of a 2000-character text block.
const MAIL_BODY_LIMIT = 1024 * 1024;

async function testMail(request, env, context) {
  const { identity, url, head, transport, now } = context;
  requireWriteRequest(request);
  const body = await readJson(request, MAIL_BODY_LIMIT);
  if (!isRecord(body) || typeof body.requestId !== 'string' || !UUID.test(body.requestId) || !['receipt', 'notification'].includes(body.template)) throw reject('Provmejlet är ogiltigt.');
  const requestId = `mail-test/${body.requestId}`;
  const existing = context.existing = await sentByRequest(env, requestId);
  if (existing?.resend_id) return json({ id: existing.resend_id });
  requireRetryWindow(existing, now());
  const draft = validateEmailSettings(body.email);
  const project = await head();
  await requirePublishedImages(env.CMS_DB, (draft ?? DEFAULT_EMAIL).templates[body.template].blocks, project.resources, `templates.${body.template}.blocks`);
  const resources = await resolveResources(env.CMS_DB, project);
  const rendered = renderEmail(draft, body.template, { resources, origin: url.origin, visitor: SAMPLE });
  const values = await providerKey(env);
  if (!isEmailAddress(values.CONTACT_TO)) throw new HttpError(503, NOT_CONFIGURED);
  const limited = await rateLimited(env, identity);
  if (limited) return limited;
  const subject = '[Prov] ' + rendered.subject, nowMs = now();
  const intent = { requestId, kind: 'test', recipients: { to: [values.CONTACT_TO], cc: [], bcc: [] }, subject, sender: rendered.from, attachments: 0, createdAt: iso(nowMs), scheduledAt: null, actor: identity.email };
  const id = await deliver(env, existing, intent, () => resend(transport, values.RESEND_API_KEY, '', { method: 'POST', idempotency: requestId, body: { from: rendered.from, to: [values.CONTACT_TO], subject, html: rendered.html, text: rendered.text } }));
  await finalize(env, requestId, id, nowMs);
  return json({ id });
}

async function sendMail(request, env, context) {
  const { identity, url, head, transport, now } = context;
  requireWriteRequest(request);
  const body = await readJson(request, MAIL_BODY_LIMIT);
  if (!isRecord(body) || typeof body.requestId !== 'string' || !UUID.test(body.requestId)) throw reject(INVALID_SEND);
  // A confirmed request is answered from storage before any eligibility check:
  // its uploads are already consumed by this very request.
  const requestId = `mail/${body.requestId}`;
  const existing = context.existing = await sentByRequest(env, requestId);
  if (existing?.resend_id) return json({ id: existing.resend_id, scheduledAt: existing.scheduled_at, from: existing.sender });
  const nowMs = now();
  requireRetryWindow(existing, nowMs);
  const lists = recipients(body);
  const mail = validateCustomMail({ subject: body.subject, preheader: body.preheader, blocks: body.blocks, design: body.design });
  // The studio's draft settings (sender, shell), so preview and delivery match;
  // null or absent means DEFAULT_EMAIL, as in the studio preview and the test mail.
  const draft = { ...DEFAULT_EMAIL, ...validateEmailIdentity(body.identity) };
  const scheduledMs = scheduleTime(body.scheduledAt, nowMs);
  const files = await attachmentFiles(env, body.attachments, nowMs, requestId);
  const values = await providerKey(env);
  if (files.some(file => file.kind === 'upload') && !masterReady(env)) throw new HttpError(503, 'Huvudnyckeln saknas.');
  const project = await head();
  await requirePublishedImages(env.CMS_DB, mail.blocks, project.resources, 'blocks');
  const resources = await resolveResources(env.CMS_DB, project);
  const rendered = renderCustom(mail, draft, { resources, origin: url.origin });
  const limited = await rateLimited(env, identity);
  if (limited) return limited;
  await cleanup(env, now);
  // Resend fetches a `path` attachment at send time. A scheduled link lives
  // until an hour after the scheduled time. An immediate link expires with its
  // upload row, so only attachment links are pinned on retry. Republishing can
  // change HTML; Resend's 409 then leaves the earlier outcome uncertain.
  const scheduledExp = scheduledMs === null ? null : Math.floor(scheduledMs / 1000) + 3600;
  const attachments = await Promise.all(files.map(async file => ({
    filename: file.name,
    path: file.kind === 'upload' ? url.origin + await signFileLink(env, file.id, scheduledExp ?? Math.floor(Date.parse(file.expires_at) / 1000)) : new URL('/media/' + file.object_key, url.origin).href,
  })));
  const scheduledAt = scheduledMs === null ? null : iso(scheduledMs);
  const uploads = JSON.stringify(files.filter(file => file.kind === 'upload').map(file => file.id));
  const uploadCount = files.filter(file => file.kind === 'upload').length;
  const intent = { requestId, kind: 'custom', recipients: lists, subject: rendered.subject, sender: rendered.from, attachments: files.length, createdAt: iso(nowMs), scheduledAt, actor: identity.email };
  // Claim every upload atomically with the intent. A scheduled send also keeps
  // its files until an hour after delivery, even if finalize fails.
  // Claims expire with their upload rows; they do not retain files indefinitely.
  const reserve = uploadCount ? [env.CMS_DB.prepare("UPDATE cms_mail_files SET claimed_by = ?1, expires_at = MAX(expires_at, ?2) WHERE id IN (SELECT value FROM json_each(?3)) AND state = 'ready' AND sent_at IS NULL AND (claimed_by IS NULL OR claimed_by = ?1) AND expires_at > ?4 AND EXISTS (SELECT 1 FROM cms_sent_mail WHERE request_id = ?1 AND resend_id IS NULL)").bind(requestId, iso((scheduledExp ?? 0) * 1000), uploads, iso(nowMs + 3600000))] : [];
  const id = await deliver(env, existing, intent, () => resend(transport, values.RESEND_API_KEY, '', { method: 'POST', idempotency: requestId, body: {
    from: rendered.from, to: lists.to, ...(lists.cc.length ? { cc: lists.cc } : {}), ...(lists.bcc.length ? { bcc: lists.bcc } : {}),
    subject: rendered.subject, html: rendered.html, text: rendered.text,
    ...(scheduledAt ? { scheduled_at: scheduledAt } : {}), ...(attachments.length ? { attachments } : {}),
  } }), reserve, uploadCount);
  const [, marked] = await finalize(env, requestId, id, nowMs, uploadCount ? [env.CMS_DB.prepare('UPDATE cms_mail_files SET sent_at = ? WHERE id IN (SELECT value FROM json_each(?))').bind(iso(nowMs), uploads)] : []);
  // Resend has the mail; unexpected storage loss is reported, never resent.
  if (uploadCount && marked?.meta?.changes !== uploadCount) reportFailure(new Error('mail upload missing at finalize'), 'mail');
  return json({ id, scheduledAt, from: rendered.from });
}

// The newest 100 plus every pending scheduled send and unconfirmed intent,
// using the same predicate as eviction. Status and cancel need a confirmed id.
async function sentList(env, { now }) {
  const nowMs = now();
  const { results } = await env.CMS_DB.prepare(`SELECT resend_id, kind, recipients, subject, attachments, created_at, scheduled_at, canceled_at FROM cms_sent_mail WHERE id IN (SELECT id FROM cms_sent_mail ORDER BY id DESC LIMIT 100) OR (${PENDING}) ORDER BY id DESC`).bind(iso(nowMs)).all();
  return json({ items: results.map(row => {
    const { to, cc, bcc } = JSON.parse(row.recipients);
    return { id: row.resend_id, confirmed: row.resend_id !== null, kind: row.kind, to, cc, bcc, subject: row.subject, createdAt: row.created_at, scheduledAt: row.scheduled_at, canceledAt: row.canceled_at, attachments: row.attachments };
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
  const key = (await providerKey(env)).RESEND_API_KEY;
  let result;
  try { result = await resend(transport, key, `/${encodeURIComponent(id)}/cancel`, { method: 'POST', restrictedOk: true }); }
  catch (cancelError) {
    try { result = await resend(transport, key, '/' + encodeURIComponent(id), { restrictedOk: true }); }
    catch (statusError) { reportFailure(statusError, 'mail'); throw cancelError; }
    if (result?.last_event !== 'canceled') throw cancelError;
  }
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
  const createdAt = iso(now()), expiresAt = iso(now() + MAIL_FILE_LIFETIME);
  // Register before R2 writes, but do not expose an incomplete upload. Cleanup
  // can revoke this state while a slow PUT runs; promotion never recreates it.
  await env.CMS_DB.prepare("INSERT INTO cms_mail_files(id,object_key,name,mime,bytes,created_at,expires_at,state) VALUES(?,?,?,?,?,?,?,'uploading')").bind(id, key, name, mime, size, createdAt, expiresAt).run();
  try {
    // The body streams straight into R2; the Worker never holds the file.
    const object = await env.CMS_MEDIA.put(key, request.body, { httpMetadata: { contentType: mime, contentDisposition: 'attachment' } });
    if (object?.size !== size) throw new HttpError(400, 'Filen kom inte fram hel. Försök igen.');
    const promoted = await env.CMS_DB.prepare("UPDATE cms_mail_files SET state = 'ready' WHERE id = ? AND state = 'uploading' AND expires_at > ?").bind(id, iso(now())).run();
    if (promoted.meta.changes !== 1) throw new HttpError(409, 'Bilagan gick ut under uppladdningen. Ladda upp den igen.');
  } catch (error) {
    await discardMailUpload(env, id, now);
    throw error;
  }
  return json({ id, name, size, mime, expiresAt }, 201);
}

async function removeFile(request, env, { now }) {
  requireWriteRequest(request);
  const id = (await readJson(request, 1024))?.id;
  if (typeof id !== 'string' || !UUID.test(id) || !await removeMailFile(env, id, now)) throw new HttpError(404, 'Bilagan finns inte.');
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
// first publish). Images/resources come from it; sender/shell use the draft.
export async function handleEmailAdmin(request, env, { identity, url, head, transport = fetch, now = Date.now }) {
  const read = request.method === 'GET' || request.method === 'HEAD';
  if (read && url.pathname === '/admin/api/contact') return json(await settingsView(env));
  if (!env.CMS_DB) throw new HttpError(503, 'Studions lagring är inte tillgänglig.');
  const context = { identity, url, head, transport, now };
  try {
    if (read && url.pathname === '/admin/api/mail/sent') return await sentList(env, context);
    if (read && url.pathname === '/admin/api/mail/status') return await mailStatus(env, context);
    const handler = WRITES[url.pathname];
    if (!handler) throw new HttpError(404, 'Åtgärden finns inte.');
    const response = await handler(request, env, context);
    return context.existing && !response.ok ? uncertainResponse(response) : response;
  } catch (error) {
    if (/no such table/i.test(String(error?.message ?? ''))) error = new HttpError(503, 'Mejltabellerna saknas. Kör databasens migrering.');
    if (context.existing) return uncertainResponse(errorResponse(error, 'mail'));
    throw error;
  }
}

// Public, signature-gated download for Resend. One HMAC verify and one D1 read;
// the R2 body is passed through unread.
export async function serveMailFile(request, env, now = Date.now) {
  if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Länken kan bara hämtas.' }, 405, { Allow: 'GET, HEAD' });
  const url = new URL(request.url);
  const [, , id = '', exp = '', extra] = url.pathname.split('/');
  const sig = url.searchParams.get('token') ?? '';
  const nowSeconds = Math.floor(now() / 1000);
  const denied = () => json({ error: 'Länken gäller inte.' }, 403);
  if (extra !== undefined || url.searchParams.size !== 1 || !env.CMS_DB || !/^\d{1,12}$/.test(exp) || Number(exp) > nowSeconds + SCHEDULE_MAX_DAYS * 86400 + 3600 + 60) return denied();
  if (!await verifyFileLink(env, id, exp, sig, nowSeconds)) return denied();
  const row = await env.CMS_DB.prepare("SELECT name, mime FROM cms_mail_files WHERE id = ? AND state = 'ready' AND expires_at >= ?").bind(id, iso(now())).first();
  if (!row) return denied();
  const key = 'mail-private/' + id;
  const object = request.method === 'HEAD' ? await env.CMS_MEDIA.head(key) : await env.CMS_MEDIA.get(key);
  if (!object) return json({ error: 'Filen finns inte längre.' }, 404);
  return new Response(request.method === 'HEAD' ? null : object.body, { headers: {
    'Content-Type': row.mime,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.name).replace(/['()*]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase())}`,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  } });
}
