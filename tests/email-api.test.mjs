import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { handleEmailAdmin, serveMailFile, SCHEDULE_MAX_DAYS } from '../src/cms/email-api.mjs';
import { signFileLink } from '../src/server/contact-secrets.mjs';
import { errorResponse } from '../src/cms/http.mjs';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';

let runtime, authorization;
before(async () => { runtime = await cmsRuntime(); authorization = await runtime.token(); });
after(async () => { await runtime?.close(); });

const origin = 'https://omaryusuf.se';
const START = Date.parse('2026-10-24T10:00:00.000Z');
const MASTER = 'm'.repeat(48);
const KEY = 're_providerKey_1234567890';
const OWNER = 'owner@example.org';
const identity = { email: 'owner@example.test', subject: 'owner-fixture' };
let clock, limiter, bucket;

// A plain R2 stand-in: it records what it was handed and fails loudly when the
// Worker tries to buffer an object.
function stubBucket() {
  const objects = new Map(), deleted = [], buffered = [];
  return {
    objects, deleted, buffered,
    async put(key, body, options) {
      const chunks = [];
      for (const reader = body.getReader(); ;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
      const bytes = Buffer.concat(chunks);
      objects.set(key, { bytes, options });
      return { key, size: bytes.byteLength };
    },
    async get(key) {
      const object = objects.get(key);
      if (!object) return null;
      return { size: object.bytes.byteLength, body: new Blob([object.bytes]).stream(), arrayBuffer() { buffered.push(key); throw new Error('buffered'); }, text() { buffered.push(key); throw new Error('buffered'); } };
    },
    async head(key) { const object = objects.get(key); return object ? { size: object.bytes.byteLength } : null; },
    async delete(keys) { for (const key of [keys].flat()) { deleted.push(key); objects.delete(key); } },
  };
}
const env = (extra = {}) => ({ CMS_DB: runtime.db, CMS_MEDIA: bucket, CONTACT_HASH_SECRET: MASTER, RESEND_API_KEY: KEY, CONTACT_TO: OWNER, CONTACT_RATE_LIMIT: { limit: async ({ key }) => { limiter.keys.push(key); return { success: limiter.success }; } }, ...extra });
function provider(answer = (url, calls) => Response.json({ id: `resend-${calls.length}` })) {
  const calls = [];
  return { calls, fetch: async (url, init) => { calls.push({ url, init, body: init.body ? JSON.parse(init.body) : undefined }); return answer(url, calls); } };
}
const run = async (request, e, transport, project = {}) => {
  const url = new URL(request.url);
  try { return await handleEmailAdmin(request, e, { identity, url, head: async () => project, transport: transport ?? provider().fetch, now: () => clock }); }
  catch (error) { return errorResponse(error, 'mail'); }
};
const post = (path, body, headers = {}) => new Request(origin + path, { method: 'POST', headers: { Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const get = path => new Request(origin + path, { headers: { Origin: origin } });
const uploadRequest = (name, bytes, headers = {}) => ({ method: 'POST', url: origin + '/admin/api/mail/attachment', headers: new Headers({ Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/octet-stream', 'X-CMS-Filename': encodeURIComponent(name), 'Content-Length': String(bytes.byteLength), ...headers }), body: new Blob([bytes]).stream() });
const content = () => ({ subject: 'Hej från verkstaden', preheader: 'En kort rad', blocks: structuredClone(DEFAULT_EMAIL.templates.receipt.blocks), design: structuredClone(DEFAULT_EMAIL.templates.receipt.design) });
const compose = (extra = {}) => ({ requestId: crypto.randomUUID(), to: ['ada@example.net'], cc: [], bcc: [], ...content(), scheduledAt: null, attachments: [], ...extra });
const sentCount = async () => (await runtime.db.prepare('SELECT COUNT(*) AS n FROM cms_sent_mail').first()).n;
const iso = ms => new Date(ms).toISOString();
const addMedia = (mime, published = true) => {
  const id = crypto.randomUUID();
  return runtime.db.prepare('INSERT INTO cms_media(id, object_key, name, mime, bytes, sha256, created_at, published_at) VALUES(?,?,?,?,?,?,?,?)').bind(id, `${id}.${mime.split('/')[1]}`, 'bild', mime, 1200, 'a'.repeat(64), iso(START), published ? iso(START) : null).run().then(() => id);
};
const addFile = (bytes, expiresAt, extra = {}) => {
  const id = crypto.randomUUID();
  bucket.objects.set('mail-private/' + id, { bytes: Buffer.alloc(1), options: {} });
  return runtime.db.prepare('INSERT INTO cms_mail_files(id,object_key,name,mime,bytes,created_at,expires_at,sent_at) VALUES(?,?,?,?,?,?,?,?)').bind(id, 'mail-private/' + id, extra.name ?? 'fil.pdf', 'application/pdf', bytes, iso(START), expiresAt, extra.sentAt ?? null).run().then(() => id);
};
const addSent = (id, scheduledAt = null) => runtime.db.prepare("INSERT INTO cms_sent_mail(request_id,sender,resend_id,kind,recipients,subject,attachments,created_at,scheduled_at,actor) VALUES('mail/' || ?1,'Omar Yusuf <hej@hej.omaryusuf.se>',?1,'custom','{\"to\":[\"ada@example.net\"],\"cc\":[],\"bcc\":[]}','Ämne',0,?,?,'owner')").bind(id, iso(START), scheduledAt).run();
const upload = async (name = 'offert.pdf', bytes = new TextEncoder().encode('%PDF-1.7 test')) => run(uploadRequest(name, bytes), env());

beforeEach(async () => {
  clock = START;
  limiter = { success: true, keys: [] };
  bucket = stubBucket();
  await runtime.db.exec('DELETE FROM cms_sent_mail;');
  await runtime.db.exec('DELETE FROM cms_mail_files;');
});

test('owner-only, write-guarded, bounded', async () => {
  const call = (path, init = {}) => runtime.mf.dispatchFetch(origin + path, init);
  const auth = { 'Cf-Access-Jwt-Assertion': authorization, Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' };
  const routes = [['GET', '/admin/api/contact'], ['POST', '/admin/api/contact', 8192], ['POST', '/admin/api/mail/test', 1048576], ['POST', '/admin/api/mail/send', 1048576], ['GET', '/admin/api/mail/sent'], ['GET', '/admin/api/mail/status?id=x'], ['POST', '/admin/api/mail/cancel', 1024], ['POST', '/admin/api/mail/attachment'], ['POST', '/admin/api/mail/attachment-remove', 1024]];
  for (const [method, path, limit] of routes) {
    const anonymous = await call(path, { method, headers: { Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: '{}' } : {}) });
    assert.equal(anonymous.status, 401, path);
    if (method !== 'POST') continue;
    for (const headers of [{ ...auth, 'X-CMS-Request': '' }, { ...auth, Origin: 'https://evil.example' }, { ...auth, 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await call(path, { method, headers, body: '{}' })).status, 403, path);
    if (limit) assert.equal((await call(path, { method, headers: auth, body: 'x'.repeat(limit + 1) })).status, 413, path);
  }
  assert.equal((await run(uploadRequest('a.pdf', new Uint8Array(1), { 'Content-Length': '31457281' }), env())).status, 413);
  const unsized = uploadRequest('a.pdf', new Uint8Array(1)); unsized.headers.delete('Content-Length');
  assert.equal((await run(unsized, env())).status, 411);
  assert.equal((await call('/mail-file/x/1/y')).status, 403);
});

test('email row is never public', async () => {
  const marker = 'unik-markor-7f3a2c';
  const headers = { 'Cf-Access-Jwt-Assertion': authorization, Origin: origin, 'X-CMS-Request': '1', 'Content-Type': 'application/json' };
  const state = await (await runtime.mf.dispatchFetch(origin + '/admin/api/state', { headers })).json();
  const email = structuredClone(DEFAULT_EMAIL);
  email.shell.tagline = marker;
  const saved = await runtime.mf.dispatchFetch(origin + '/admin/api/save', { method: 'POST', headers, body: JSON.stringify({ project: { ...state.project, email }, baseVersion: state.version, requestId: crypto.randomUUID() }) });
  assert.equal(saved.status, 200, await saved.clone().text());
  assert.equal((await runtime.mf.dispatchFetch(origin + '/data/email.json')).status, 404);
  // The asset layer redirects `@` to `%40`, which the Worker refuses as non-canonical.
  assert.equal((await runtime.mf.dispatchFetch(origin + '/data/@email.json')).status, 400);
  for (const path of ['/@email', '/@email/', '/data/email.json', '/data/@email.json', '/', '/kontakt/', '/data/cards.json', '/sitemap.xml']) {
    const response = await runtime.mf.dispatchFetch(origin + path, { redirect: 'manual' });
    if (path.includes('email')) assert.notEqual(response.status, 200, path);
    assert.ok(!(await response.text()).includes(marker), path);
  }
});

test('test mail maps provider errors and is rate-limited', async () => {
  const body = () => ({ requestId: crypto.randomUUID(), template: 'notification', email: null });
  const ok = provider();
  const sent = await run(post('/admin/api/mail/test', body()), env(), ok.fetch);
  assert.equal(sent.status, 200);
  assert.deepEqual(await sent.json(), { id: 'resend-1' });
  assert.equal(ok.calls[0].url, 'https://api.resend.com/emails');
  assert.match(ok.calls[0].init.headers['Idempotency-Key'], /^mail-test\/[0-9a-f-]{36}$/);
  assert.deepEqual(ok.calls[0].body.to, [OWNER]);
  assert.ok(ok.calls[0].body.subject.startsWith('[Prov] '));
  assert.equal(limiter.keys[0], 'admin-mail:' + identity.email);
  assert.equal(await sentCount(), 1);
  const cases = [
    [() => Response.json({ name: 'invalid_api_key', message: 'no' }, { status: 401 }), 502, 'Nyckeln godtas inte av Resend. Klistra in en ny i Inställningar.'],
    [() => Response.json({ message: 'no' }, { status: 403 }), 502, 'Nyckeln godtas inte av Resend. Klistra in en ny i Inställningar.'],
    [() => Response.json({ name: 'validation_error', message: `The key ${KEY} or re_another_key is wrong` }, { status: 422 }), 422, 'Resend: The key [nyckel] or [nyckel] is wrong'],
    [() => Response.json({ message: 'conflict' }, { status: 409 }), 409, 'Samma utskick skickades redan med annat innehåll. Ladda om fliken.'],
    [() => Response.json({}, { status: 429 }), 429, 'Resend begränsar takten. Vänta en minut.'],
    [() => new Response('oops', { status: 500 }), 503, 'Resend svarar inte just nu. Försök igen; samma utskick skickas inte två gånger.'],
    [() => { throw new TypeError(`network ${KEY}`); }, 503, 'Resend svarar inte just nu. Försök igen; samma utskick skickas inte två gånger.'],
    [() => Response.json({ name: 'restricted_api_key', message: 'restricted' }, { status: 401 }), 403, 'Nyckeln saknar behörighet för status och avbryt.'],
  ];
  for (const [answer, status, message] of cases) {
    const response = await run(post('/admin/api/mail/test', body()), env(), provider(answer).fetch);
    assert.equal(response.status, status, message);
    const text = await response.text();
    assert.equal(JSON.parse(text).error, message);
    assert.ok(!text.includes(KEY));
  }
  assert.equal(await sentCount(), 3); // Success plus the ambiguous 500 and network failure.
  limiter.success = false;
  const blocked = provider();
  const limited = await run(post('/admin/api/mail/test', body()), env(), blocked.fetch);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
  assert.equal(blocked.calls.length, 0);
  const unbound = await run(post('/admin/api/mail/test', body()), env({ CONTACT_RATE_LIMIT: undefined }), blocked.fetch);
  assert.equal(unbound.status, 503);
  for (const missing of [{ RESEND_API_KEY: undefined }, { CONTACT_TO: undefined }]) {
    const response = await run(post('/admin/api/mail/test', body()), env(missing), blocked.fetch);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'Formuläret saknar värden. Fyll i Inställningar först.');
  }
  assert.equal(blocked.calls.length, 0);
});

test('recipient limits checked before Resend', async () => {
  const p = provider();
  const many = Array.from({ length: 51 }, (_, index) => `person${index}@example.net`);
  for (const [extra, message] of [
    [{ to: many.slice(0, 20), cc: many.slice(20, 40), bcc: many.slice(40) }, 'Högst 50 mottagare sammanlagt (till, kopia och dold kopia).'],
    [{ to: ['ada@example.net', 'bad'] }, 'Ogiltig adress: bad.'],
    [{ cc: ['x@example.net\nBcc: y@example.net'] }, 'Ogiltig adress: x@example.net\nBcc: y@example.net.'],
    [{ to: [] }, 'Lägg till minst en mottagare.'],
  ]) {
    const response = await run(post('/admin/api/mail/send', compose(extra)), env(), p.fetch);
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error, message);
  }
  assert.equal(p.calls.length, 0);
  const sent = await run(post('/admin/api/mail/send', compose({ to: ['Ada@Example.net', 'b@example.net'], cc: ['ada@example.net'], bcc: ['B@example.net', 'c@example.net'] })), env(), p.fetch);
  assert.equal(sent.status, 200);
  assert.deepEqual(p.calls[0].body.to, ['Ada@Example.net', 'b@example.net']);
  assert.equal(p.calls[0].body.cc, undefined);
  assert.deepEqual(p.calls[0].body.bcc, ['c@example.net']);
});

test('attachment size and type checked before send', async () => {
  const p = provider();
  const future = iso(START + 86400000);
  const avif = await addMedia('image/avif');
  const unpublished = await addMedia('image/png', false);
  const full = await addFile(31457280, future), extra = await addFile(1, future);
  const expired = await addFile(10, iso(START - 1000));
  const used = await addFile(10, future, { sentAt: iso(START) });
  const soon = await addFile(10, iso(START + 1800000));
  for (const [attachments, message] of [
    [[{ kind: 'upload', id: full }, { kind: 'upload', id: extra }], 'Bilagorna blir för stora för ett mejl (högst 40 MB efter kodning).'],
    [[{ kind: 'resource', id: avif }], 'Filtypen kan inte skickas som bilaga.'],
    [[{ kind: 'resource', id: unpublished }], 'Filen är inte publicerad än. Bifoga den från datorn i stället.'],
    [[{ kind: 'upload', id: expired }], 'Bilagan har gått ut. Ladda upp den igen.'],
    [[{ kind: 'upload', id: used }], 'Bilagan har gått ut. Ladda upp den igen.'],
    [[{ kind: 'upload', id: soon }], 'Bilagan har gått ut. Ladda upp den igen.'],
    [Array.from({ length: 11 }, () => ({ kind: 'upload', id: full })), 'Högst 10 bilagor per mejl.'],
  ]) {
    const response = await run(post('/admin/api/mail/send', compose({ attachments })), env(), p.fetch);
    assert.equal(response.status, 422, message);
    assert.equal((await response.json()).error, message);
  }
  const exe = await upload('setup.exe');
  assert.equal(exe.status, 422);
  assert.match((await exe.json()).error, /^Filtypen kan inte skickas som bilaga\. Tillåtna:/);
  assert.equal(p.calls.length, 0);
  assert.equal((await run(post('/admin/api/mail/send', compose({ attachments: [{ kind: 'upload', id: full }] })), env(), p.fetch)).status, 200);
  assert.equal(p.calls.length, 1);
});

test('signed link: tampered, expired, other object refused; valid streams', async () => {
  const created = await upload("Omar's offert (å).pdf", new TextEncoder().encode('%PDF-1.7 hela filen'));
  assert.equal(created.status, 201);
  const { id, size, mime, expiresAt } = await created.json();
  assert.equal(size, 19);
  assert.equal(mime, 'application/pdf');
  assert.equal(expiresAt, iso(START + 86400000));
  assert.equal(bucket.objects.get('mail-private/' + id).options.httpMetadata.contentType, 'application/pdf');
  const other = (await (await upload('annan.pdf')).json()).id;
  const exp = Math.floor(START / 1000) + 3600;
  const link = await signFileLink(env(), id, exp);
  const fetchLink = (path, method = 'GET', at = START) => serveMailFile(new Request(origin + path, { method }), env(), () => at);
  const valid = await fetchLink(link);
  assert.equal(valid.status, 200);
  assert.equal(await valid.text(), '%PDF-1.7 hela filen');
  assert.equal(valid.headers.get('Content-Disposition'), "attachment; filename*=UTF-8''Omar%27s%20offert%20%28%C3%A5%29.pdf");
  assert.equal(valid.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(valid.headers.get('X-Robots-Tag'), 'noindex');
  assert.deepEqual(bucket.buffered, []);
  const head = await fetchLink(link, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
  const sig = link.split('/').at(-1);
  const far = Math.floor(START / 1000) + SCHEDULE_MAX_DAYS * 86400 + 3600 + 61;
  for (const [path, at] of [
    [`/mail-file/${id}/${exp}/${sig[0] === 'A' ? 'B' : 'A'}${sig.slice(1)}`, START],
    [link, (exp + 1) * 1000],
    [link.replace(id, other), START],
    [`/mail-file/${id}/${exp + 1}/${sig}`, START],
    [await signFileLink(env(), id, far), START],
    [await signFileLink(env(), crypto.randomUUID(), exp), START],
    [link + '/extra', START],
  ]) assert.equal((await fetchLink(path, 'GET', at)).status, 403, path);
  assert.equal((await fetchLink(await signFileLink(env(), id, far - 1))).status, 200);
  assert.equal((await fetchLink(link, 'POST')).status, 405);
  bucket.objects.delete('mail-private/' + id);
  assert.equal((await fetchLink(link)).status, 404);
});

test('expired uploads are cleaned at the next upload or send', async () => {
  const old = await addFile(10, iso(START - 1000)), kept = await addFile(10, iso(START + 1000));
  assert.equal((await upload()).status, 201);
  assert.deepEqual(bucket.deleted, ['mail-private/' + old]);
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_mail_files WHERE id = ?').bind(old).first(), null);
  assert.ok(await runtime.db.prepare('SELECT id FROM cms_mail_files WHERE id = ?').bind(kept).first());
  const attachment = (await (await upload()).json()).id;
  const stale = await addFile(10, iso(START - 5));
  bucket.deleted.length = 0;
  const p = provider();
  const scheduled = START + 2 * 86400000;
  const sent = await run(post('/admin/api/mail/send', compose({ scheduledAt: iso(scheduled), attachments: [{ kind: 'upload', id: attachment }] })), env(), p.fetch);
  assert.equal(sent.status, 200);
  assert.deepEqual(bucket.deleted, ['mail-private/' + stale]);
  const exp = Math.floor(scheduled / 1000) + 3600;
  const [file] = p.calls[0].body.attachments;
  assert.equal(file.filename, 'offert.pdf');
  assert.ok(file.path.startsWith(`${origin}/mail-file/${attachment}/${exp}/`));
  const row = await runtime.db.prepare('SELECT sent_at, expires_at FROM cms_mail_files WHERE id = ?').bind(attachment).first();
  assert.equal(row.sent_at, iso(START));
  assert.equal(row.expires_at, iso(exp * 1000));
  clock = scheduled + 1800 * 1000;
  assert.equal((await serveMailFile(new Request(file.path), env(), () => clock)).status, 200);
  const immediate = await (await upload()).json();
  // A second send needs its own Resend id: resend_id is UNIQUE.
  const now = provider(() => Response.json({ id: 'immediate-1' }));
  assert.equal((await run(post('/admin/api/mail/send', compose({ attachments: [{ kind: 'upload', id: immediate.id }] })), env(), now.fetch)).status, 200);
  assert.ok(now.calls[0].body.attachments[0].path.includes(`/${Math.floor(Date.parse(immediate.expiresAt) / 1000)}/`));
  const immediateRow = await runtime.db.prepare('SELECT sent_at, expires_at FROM cms_mail_files WHERE id = ?').bind(immediate.id).first();
  assert.equal(immediateRow.sent_at, iso(clock));
  assert.equal(immediateRow.expires_at, immediate.expiresAt);
});

test('an immediate send with an upload is retry-safe', async () => {
  const { id } = await (await upload()).json();
  const request = compose({ attachments: [{ kind: 'upload', id }] });
  const calls = [];
  const timeout = async (url, init) => { calls.push(init); throw new DOMException('timed out', 'TimeoutError'); };
  const failed = await run(post('/admin/api/mail/send', request), env(), timeout);
  assert.equal(failed.status, 503);
  assert.equal(await sentCount(), 1);
  assert.equal((await requestRow('mail/' + request.requestId)).resend_id, null);
  const listed = (await (await run(get('/admin/api/mail/sent'), env())).json()).items;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].confirmed, false);
  assert.equal((await runtime.db.prepare('SELECT claimed_by FROM cms_mail_files WHERE id = ?').bind(id).first()).claimed_by, 'mail/' + request.requestId);
  clock = START + 5 * 60000;
  const ok = async (url, init) => { calls.push(init); return Response.json({ id: 'resend-retry' }); };
  assert.equal((await run(post('/admin/api/mail/send', request), env(), ok)).status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.equal(await sentCount(), 1);
  assert.equal((await runtime.db.prepare('SELECT sent_at FROM cms_mail_files WHERE id = ?').bind(id).first()).sent_at, iso(clock));
});

test('schedule window enforced', async () => {
  const p = provider();
  for (const [at, message] of [
    [START - 1000, 'Tiden har redan passerat. Välj en tid minst en minut fram.'],
    [START + 30000, 'Tiden har redan passerat. Välj en tid minst en minut fram.'],
    [START + (SCHEDULE_MAX_DAYS * 86400 + 1) * 1000, `Resend kan schemalägga högst ${SCHEDULE_MAX_DAYS} dagar fram.`],
  ]) {
    const response = await run(post('/admin/api/mail/send', compose({ scheduledAt: iso(at) })), env(), p.fetch);
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error, message);
  }
  assert.match(`Resend kan schemalägga högst ${SCHEDULE_MAX_DAYS} dagar fram.`, /30/);
  assert.equal(p.calls.length, 0);
  const at = START + SCHEDULE_MAX_DAYS * 86400000;
  const response = await run(post('/admin/api/mail/send', compose({ scheduledAt: iso(at) })), env(), p.fetch);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).scheduledAt, iso(at));
  assert.equal(p.calls[0].body.scheduled_at, iso(at));
});

test('sixth send in a minute is refused', async () => {
  limiter.success = false;
  const p = provider();
  const response = await run(post('/admin/api/mail/send', compose()), env(), p.fetch);
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error, 'Vänta en minut innan nästa utskick.');
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal(p.calls.length, 0);
});

test('ambiguous provider failures keep unconfirmed intents listed', async () => {
  for (const answer of [() => { throw new DOMException('timeout', 'TimeoutError'); }, () => new Response('down', { status: 500 }), () => new Response('not json'), () => Response.json({}), () => Response.json({ id: '../evil' })]) {
    const attachment = (await (await upload()).json()).id;
    const request = compose({ attachments: [{ kind: 'upload', id: attachment }] });
    const response = await run(post('/admin/api/mail/send', request), env(), provider(answer).fetch);
    assert.equal(response.status, 503);
    assert.equal((await requestRow('mail/' + request.requestId)).resend_id, null);
    const row = await runtime.db.prepare('SELECT sent_at, claimed_by FROM cms_mail_files WHERE id = ?').bind(attachment).first();
    assert.deepEqual(row, { sent_at: null, claimed_by: 'mail/' + request.requestId });
  }
  const { items } = await (await run(get('/admin/api/mail/sent'), env())).json();
  assert.equal(items.length, 5);
  assert.ok(items.every(item => item.id === null && !item.confirmed));
});

test('Kantfall 29: definitive Resend refusals delete fresh intent and release uploads', async () => {
  const attachment = (await (await upload()).json()).id;
  for (const status of [400, 401, 403, 409, 422, 429]) {
    const response = await run(post('/admin/api/mail/send', compose({ attachments: [{ kind: 'upload', id: attachment }] })), env(), provider(() => Response.json({ message: 'refused' }, { status })).fetch);
    assert.notEqual(response.status, 200);
    assert.equal((await response.json()).details.refused, true);
    assert.equal(await sentCount(), 0);
    assert.deepEqual(await runtime.db.prepare('SELECT sent_at, claimed_by FROM cms_mail_files WHERE id = ?').bind(attachment).first(), { sent_at: null, claimed_by: null });
  }
  assert.equal((await run(post('/admin/api/mail/attachment-remove', { id: attachment }), env())).status, 200);
  assert.equal(await sentCount(), 0);
});

test('a refusal on a retry retains an older ambiguous intent and its claim', async () => {
  const { id } = await (await upload()).json();
  const request = compose({ attachments: [{ kind: 'upload', id }] });
  assert.equal((await run(post('/admin/api/mail/send', request), env(), provider(() => new Response('down', { status: 500 })).fetch)).status, 503);
  assert.equal((await run(post('/admin/api/mail/send', request), env(), provider(() => Response.json({ message: 'conflict' }, { status: 409 })).fetch)).status, 409);
  assert.equal((await requestRow('mail/' + request.requestId)).resend_id, null);
  assert.equal((await runtime.db.prepare('SELECT claimed_by FROM cms_mail_files WHERE id = ?').bind(id).first()).claimed_by, 'mail/' + request.requestId);
});

test('custom mail replies go to the site address', async () => {
  const p = provider();
  const request = compose();
  const response = await run(post('/admin/api/mail/send', request), env(), p.fetch);
  assert.equal(response.status, 200);
  const result = await response.json();
  const body = p.calls[0].body;
  assert.equal(body.reply_to, undefined);
  assert.match(body.from, /@hej\.omaryusuf\.se>?$/);
  assert.equal(result.from, body.from);
  assert.equal(result.scheduledAt, null);
  assert.ok(!p.calls[0].init.body.includes(OWNER));
  assert.equal(p.calls[0].init.headers['Idempotency-Key'], `mail/${request.requestId}`);
  assert.equal(p.calls[0].init.headers.Authorization, `Bearer ${KEY}`);
});

test('sent list holds no secrets and is owner-only', async () => {
  const p = provider();
  assert.equal((await run(post('/admin/api/mail/send', compose({ cc: ['cc@example.net'] })), env(), p.fetch)).status, 200);
  const response = await run(get('/admin/api/mail/sent'), env());
  assert.equal(response.status, 200);
  const text = await response.text();
  const { items } = JSON.parse(text);
  assert.equal(items.length, 1);
  assert.equal(items[0].confirmed, true);
  assert.deepEqual(Object.keys(items[0]), ['id', 'confirmed', 'kind', 'to', 'cc', 'bcc', 'subject', 'createdAt', 'scheduledAt', 'canceledAt', 'attachments']);
  assert.deepEqual([items[0].id, items[0].kind, items[0].to, items[0].cc, items[0].bcc], ['resend-1', 'custom', ['ada@example.net'], ['cc@example.net'], []]);
  for (const secret of [KEY, MASTER]) assert.ok(!text.includes(secret));
});

test('status and cancel use only listed ids; restricted key is not an error', async () => {
  await addSent('later', iso(START + 3600000));
  await addSent('now');
  const unknown = provider();
  assert.equal((await run(get('/admin/api/mail/status?id=other'), env(), unknown.fetch)).status, 404);
  assert.equal((await run(post('/admin/api/mail/cancel', { id: 'other' }), env(), unknown.fetch)).status, 404);
  assert.equal(unknown.calls.length, 0);
  const delivered = provider(() => Response.json({ id: 'now', last_event: 'delivered' }));
  assert.deepEqual(await (await run(get('/admin/api/mail/status?id=now'), env(), delivered.fetch)).json(), { id: 'now', status: 'delivered', label: 'Levererat' });
  assert.equal(delivered.calls[0].url, 'https://api.resend.com/emails/now');
  assert.equal(delivered.calls[0].init.method, 'GET');
  const odd = provider(() => Response.json({ last_event: 'mystery' }));
  assert.equal((await (await run(get('/admin/api/mail/status?id=now'), env(), odd.fetch)).json()).label, 'Okänd status (mystery)');
  const restricted = provider(() => Response.json({ name: 'restricted_api_key', message: 'This API key is restricted' }, { status: 401 }));
  const status = await run(get('/admin/api/mail/status?id=now'), env(), restricted.fetch);
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), { id: 'now', restricted: true });
  const cancelRestricted = await run(post('/admin/api/mail/cancel', { id: 'later' }), env(), restricted.fetch);
  assert.equal(cancelRestricted.status, 200);
  assert.deepEqual(await cancelRestricted.json(), { id: 'later', restricted: true });
  const late = await run(post('/admin/api/mail/cancel', { id: 'now' }), env(), unknown.fetch);
  assert.equal(late.status, 409);
  assert.equal((await late.json()).error, 'Mejlet är redan på väg och kan inte stoppas.');
  const cancel = provider(() => Response.json({ object: 'email', id: 'later' }));
  const canceled = await run(post('/admin/api/mail/cancel', { id: 'later' }), env(), cancel.fetch);
  assert.deepEqual(await canceled.json(), { id: 'later', canceledAt: iso(START) });
  assert.equal(cancel.calls[0].url, 'https://api.resend.com/emails/later/cancel');
  assert.equal((await runtime.db.prepare("SELECT canceled_at FROM cms_sent_mail WHERE resend_id = 'later'").first()).canceled_at, iso(START));
});

test('removing an unsent upload deletes it once', async () => {
  const { id } = await (await upload()).json();
  const removed = await run(post('/admin/api/mail/attachment-remove', { id }), env());
  assert.deepEqual(await removed.json(), { removed: true });
  assert.ok(bucket.deleted.includes('mail-private/' + id));
  assert.equal((await run(post('/admin/api/mail/attachment-remove', { id }), env())).status, 404);
});

test('missing mail tables and missing master fail clearly', async () => {
  const missing = { prepare() { throw new Error('D1_ERROR: no such table: cms_sent_mail: SQLITE_ERROR'); } };
  const response = await run(get('/admin/api/mail/sent'), env({ CMS_DB: missing }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'Mejltabellerna saknas. Kör databasens migrering.');
  const noMaster = await run(uploadRequest('a.pdf', new Uint8Array(4)), env({ CONTACT_HASH_SECRET: undefined }));
  assert.equal(noMaster.status, 503);
  assert.equal((await noMaster.json()).error, 'Huvudnyckeln saknas.');
  assert.equal((await serveMailFile(get(await signFileLink(env(), crypto.randomUUID(), Math.floor(START / 1000) + 60)), env({ CONTACT_HASH_SECRET: undefined }), () => START)).status, 403);
});

test('only the latest 100 are kept', async () => {
  const p = provider();
  for (let index = 0; index < 101; index += 1) assert.equal((await run(post('/admin/api/mail/test', { requestId: crypto.randomUUID(), template: 'receipt', email: null }), env(), p.fetch)).status, 200);
  assert.equal(await sentCount(), 100);
  assert.equal(await runtime.db.prepare("SELECT id FROM cms_sent_mail WHERE resend_id = 'resend-1'").first(), null);
  assert.ok(await runtime.db.prepare("SELECT id FROM cms_sent_mail WHERE resend_id = 'resend-101'").first());
});

// D1 that loses the second batch (the finalize after the intent insert) once.
const flakyDb = () => { let batches = 0; return { prepare: sql => runtime.db.prepare(sql), batch: statements => (++batches === 2 ? Promise.reject(new Error('D1_ERROR: finalize lost')) : runtime.db.batch(statements)) }; };
const requestRow = requestId => runtime.db.prepare('SELECT resend_id FROM cms_sent_mail WHERE request_id = ?').bind(requestId).first();

test('a lost response replays the confirmed result without Resend', async () => {
  const { id: file } = await (await upload()).json();
  const p = provider();
  const request = compose({ attachments: [{ kind: 'upload', id: file }] });
  const first = await (await run(post('/admin/api/mail/send', request), env(), p.fetch)).json();
  assert.equal(first.id, 'resend-1');
  assert.ok((await runtime.db.prepare('SELECT sent_at FROM cms_mail_files WHERE id = ?').bind(file).first()).sent_at);
  const replay = await run(post('/admin/api/mail/send', request), env(), p.fetch);
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), first);
  assert.equal(p.calls.length, 1);
  assert.equal(await sentCount(), 1);
  const test = { requestId: crypto.randomUUID(), template: 'receipt', email: null };
  const sent = await (await run(post('/admin/api/mail/test', test), env(), p.fetch)).json();
  assert.deepEqual(await (await run(post('/admin/api/mail/test', test), env(), p.fetch)).json(), sent);
  assert.equal(p.calls.length, 2);
});

test('an accepted send whose finalize failed is confirmed by the retry', async () => {
  const p = provider(() => Response.json({ id: 'accepted-1' }));
  const e = env({ CMS_DB: flakyDb() });
  const request = compose({ scheduledAt: iso(START + 86400000) });
  assert.equal((await run(post('/admin/api/mail/send', request), e, p.fetch)).status, 503);
  assert.equal((await requestRow('mail/' + request.requestId)).resend_id, null);
  const listed = (await (await run(get('/admin/api/mail/sent'), env())).json()).items;
  assert.deepEqual([listed[0].id, listed[0].confirmed], [null, false]);
  assert.equal((await run(get('/admin/api/mail/status?id=accepted-1'), env(), p.fetch)).status, 404);
  const retry = await run(post('/admin/api/mail/send', request), e, p.fetch);
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).id, 'accepted-1');
  assert.equal(p.calls.length, 2);
  assert.equal(p.calls[0].init.headers['Idempotency-Key'], p.calls[1].init.headers['Idempotency-Key']);
  assert.equal(p.calls[0].init.body, p.calls[1].init.body);
  assert.equal((await requestRow('mail/' + request.requestId)).resend_id, 'accepted-1');
  assert.equal(await sentCount(), 1);
});

test('a pending scheduled send survives eviction and stays cancellable', async () => {
  const p = provider();
  const pending = await (await run(post('/admin/api/mail/send', compose({ scheduledAt: iso(START + 86400000) })), env(), p.fetch)).json();
  for (let index = 0; index < 101; index += 1) assert.equal((await run(post('/admin/api/mail/test', { requestId: crypto.randomUUID(), template: 'receipt', email: null }), env(), p.fetch)).status, 200);
  assert.equal(await sentCount(), 101);
  const { items } = await (await run(get('/admin/api/mail/sent'), env())).json();
  assert.equal(items.length, 101);
  assert.ok(items.some(item => item.id === pending.id));
  const cancel = provider(() => Response.json({ object: 'email', id: pending.id }));
  assert.deepEqual(await (await run(post('/admin/api/mail/cancel', { id: pending.id }), env(), cancel.fetch)).json(), { id: pending.id, canceledAt: iso(START) });
  assert.equal((await run(post('/admin/api/mail/test', { requestId: crypto.randomUUID(), template: 'receipt', email: null }), env(), p.fetch)).status, 200);
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_sent_mail WHERE resend_id = ?').bind(pending.id).first(), null);
});

test('an upload a confirmed send used cannot be removed', async () => {
  const { id } = await (await upload()).json();
  assert.equal((await run(post('/admin/api/mail/send', compose({ attachments: [{ kind: 'upload', id }] })), env(), provider().fetch)).status, 200);
  const removed = await run(post('/admin/api/mail/attachment-remove', { id }), env());
  assert.equal(removed.status, 404);
  assert.ok(!bucket.deleted.includes('mail-private/' + id));
  assert.ok(bucket.objects.has('mail-private/' + id));
});

test('X5: custom mail validates only draft identity and never takes the head sender', async () => {
  const draft = structuredClone(DEFAULT_EMAIL);
  draft.sender = { name: 'Verkstaden', local: 'verkstad' };
  const p = provider();
  draft.shell.brand = 'Osparat varumärke';
  draft.templates = null; // Irrelevant to renderCustom.
  const response = await run(post('/admin/api/mail/send', compose({ identity: { sender: draft.sender, shell: draft.shell } })), env(), p.fetch);
  assert.equal(response.status, 200);
  assert.equal(p.calls[0].body.from, 'Verkstaden <verkstad@hej.omaryusuf.se>');
  assert.equal((await response.json()).from, p.calls[0].body.from);
  assert.ok(p.calls[0].body.html.includes('Osparat varumärke'));
  const bad = structuredClone(DEFAULT_EMAIL);
  bad.sender.local = 'hej@evil.example';
  const refused = provider();
  assert.equal((await run(post('/admin/api/mail/send', compose({ identity: { sender: bad.sender, shell: bad.shell } })), env(), refused.fetch)).status, 422);
  assert.equal(refused.calls.length, 0);
  assert.equal(await sentCount(), 1);
  // A draft without settings is DEFAULT_EMAIL, as the studio previews it, even when the head has its own.
  const published = structuredClone(DEFAULT_EMAIL);
  published.sender = { name: 'Publicerad', local: 'publicerad' };
  const fallback = provider(() => Response.json({ id: 'fallback-default' }));
  assert.equal((await run(post('/admin/api/mail/send', compose()), env(), fallback.fetch, { email: published })).status, 200);
  assert.equal(fallback.calls[0].body.from, 'Omar Yusuf <hej@hej.omaryusuf.se>');
});

const largeBlocks = kind => {
  const text = DEFAULT_EMAIL.templates.receipt.blocks.find(block => block.type === 'text');
  const blocks = Array.from({ length: kind === 'notification' ? 39 : 40 }, (_, index) => ({ ...structuredClone(text), id: `fill${String(index).padStart(4, '0')}`, section: index ? 'card' : 'band', text: '€'.repeat(2000) }));
  if (kind === 'notification') blocks.push(structuredClone(DEFAULT_EMAIL.templates.notification.blocks.find(block => block.type === 'visitor')));
  return blocks;
};

test('E3 reads full three-byte templates and both 10000-character text versions', async () => {
  const email = structuredClone(DEFAULT_EMAIL);
  for (const kind of ['receipt', 'notification']) {
    email.templates[kind].blocks = largeBlocks(kind);
    email.templates[kind].text = '€'.repeat(10000);
  }
  const request = { requestId: crypto.randomUUID(), template: 'receipt', email };
  assert.ok(new TextEncoder().encode(JSON.stringify(request)).byteLength > 256 * 1024);
  assert.equal((await run(post('/admin/api/mail/test', request), env(), provider().fetch)).status, 200);
  email.templates.notification.subject = '';
  const p = provider();
  assert.equal((await run(post('/admin/api/mail/test', { ...request, requestId: crypto.randomUUID() }), env(), p.fetch)).status, 422);
  assert.equal(p.calls.length, 0); // E3 still validates both templates.
});

test('E4 reads 40 three-byte compose blocks with maximum recipients and headers', async () => {
  const to = Array.from({ length: 50 }, (_, index) => `${String(index).padStart(64, 'a')}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`);
  const request = compose({ to, subject: '€'.repeat(200), preheader: '€'.repeat(200), blocks: largeBlocks('custom'), identity: { sender: { name: 'N'.repeat(60), local: 'a'.repeat(64) }, shell: { brand: '€'.repeat(40), tagline: '€'.repeat(200) } } });
  assert.ok(new TextEncoder().encode(JSON.stringify(request)).byteLength > 256 * 1024);
  assert.equal((await run(post('/admin/api/mail/send', request), env(), provider().fetch)).status, 200);
});

test('a claimed upload cannot be removed or taken by a different request', async () => {
  const { id } = await (await upload()).json();
  const request = compose({ attachments: [{ kind: 'upload', id }] });
  const p = provider(async () => {
    assert.equal((await run(post('/admin/api/mail/attachment-remove', { id }), env())).status, 404);
    assert.ok(bucket.objects.has('mail-private/' + id));
    const other = provider();
    assert.equal((await run(post('/admin/api/mail/send', compose({ attachments: request.attachments })), env(), other.fetch)).status, 422);
    assert.equal(other.calls.length, 0);
    return Response.json({ id: 'reserved' });
  });
  assert.equal((await run(post('/admin/api/mail/send', request), env(), p.fetch)).status, 200);
  assert.ok(!bucket.deleted.includes('mail-private/' + id));
});

test('removal between eligibility and intent prevents sending and releases partial claims', async () => {
  const ids = [(await (await upload()).json()).id, (await (await upload()).json()).id];
  let first = true;
  const db = { prepare: sql => runtime.db.prepare(sql), async batch(statements) {
    if (first) {
      first = false;
      assert.equal((await run(post('/admin/api/mail/attachment-remove', { id: ids[1] }), env())).status, 200);
    }
    return runtime.db.batch(statements);
  } };
  const p = provider();
  const response = await run(post('/admin/api/mail/send', compose({ attachments: ids.map(id => ({ kind: 'upload', id })) })), env({ CMS_DB: db }), p.fetch);
  assert.equal(response.status, 422);
  assert.match((await response.json()).error, /Bilagan.*tagits bort/);
  assert.equal(p.calls.length, 0);
  assert.equal(await sentCount(), 0);
  assert.equal((await runtime.db.prepare('SELECT claimed_by FROM cms_mail_files WHERE id = ?').bind(ids[0]).first()).claimed_by, null);
});

test('unconfirmed retries stop after 23 hours for E3 and E4', async () => {
  for (const kind of ['test', 'send']) {
    clock = START;
    const request = kind === 'test' ? { requestId: crypto.randomUUID(), template: 'receipt', email: null } : compose();
    const p = provider(() => { throw new DOMException('timeout', 'TimeoutError'); });
    const send = () => run(post('/admin/api/mail/' + kind, request), env(), p.fetch);
    assert.equal((await send()).status, 503);
    clock = START + 23 * 3600000;
    assert.equal((await send()).status, 503); // Boundary still within window.
    clock += 1;
    const expired = await send();
    assert.equal(expired.status, 409);
    const error = await expired.json();
    assert.match(error.error, /https:\/\/resend.com\/emails/);
    assert.equal(error.details.uncertain, true);
    assert.equal(p.calls.length, 2);
    assert.equal((await requestRow(`${kind === 'test' ? 'mail-test' : 'mail'}/${request.requestId}`)).resend_id, null);
  }
});

test('young unconfirmed intents survive eviction and remain listed beyond latest 100', async () => {
  const request = compose({ subject: 'Obekräftat äldre utskick' });
  assert.equal((await run(post('/admin/api/mail/send', request), env(), provider(() => new Response('down', { status: 500 })).fetch)).status, 503);
  const p = provider();
  for (let index = 0; index < 101; index++) assert.equal((await run(post('/admin/api/mail/test', { requestId: crypto.randomUUID(), template: 'receipt', email: null }), env(), p.fetch)).status, 200);
  const { items } = await (await run(get('/admin/api/mail/sent'), env())).json();
  assert.equal(items.length, 101);
  assert.ok(items.some(item => item.subject === request.subject && !item.confirmed));
  assert.equal(await sentCount(), items.length);
});

test('cleanup relinquishes D1 rows before deleting R2 objects', async () => {
  const old = await addFile(10, iso(START - 1));
  const remove = bucket.delete;
  bucket.delete = async keys => {
    assert.equal(await runtime.db.prepare('SELECT id FROM cms_mail_files WHERE id = ?').bind(old).first(), null);
    await remove(keys);
  };
  assert.equal((await upload()).status, 201);
  assert.ok(!bucket.objects.has('mail-private/' + old));
});

test('remove succeeds and reports private orphan when R2 deletion fails', async t => {
  const { id } = await (await upload()).json();
  const logs = [];
  t.mock.method(console, 'error', entry => logs.push(JSON.parse(entry)));
  bucket.delete = async () => { throw new Error('R2_ERROR: unavailable'); };
  const removed = await run(post('/admin/api/mail/attachment-remove', { id }), env());
  assert.equal(removed.status, 200);
  assert.deepEqual(await removed.json(), { removed: true });
  assert.equal(await runtime.db.prepare('SELECT id FROM cms_mail_files WHERE id = ?').bind(id).first(), null);
  assert.ok(bucket.objects.has('mail-private/' + id));
  assert.ok(logs.some(entry => entry.event === 'cms_failure' && entry.operation === 'mail' && entry.code === 'storage-r2'));
});

test('failed cancel reconciles canceled status and records it once', async () => {
  await addSent('stuck', iso(START + 3600000));
  const p = provider(url => url.endsWith('/cancel') ? Response.json({ message: 'arbitrary failure' }, { status: 422 }) : Response.json({ id: 'stuck', last_event: 'canceled' }));
  const response = await run(post('/admin/api/mail/cancel', { id: 'stuck' }), env(), p.fetch);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 'stuck', canceledAt: iso(START) });
  assert.deepEqual(p.calls.map(call => [call.url, call.init.method]), [['https://api.resend.com/emails/stuck/cancel', 'POST'], ['https://api.resend.com/emails/stuck', 'GET']]);
  assert.equal((await runtime.db.prepare("SELECT canceled_at FROM cms_sent_mail WHERE resend_id = 'stuck'").first()).canceled_at, iso(START));
  assert.equal((await run(post('/admin/api/mail/cancel', { id: 'stuck' }), env(), p.fetch)).status, 200);
  assert.equal(p.calls.length, 2);
});

test('failed cancel never records canceled from error wording or a failed status check', async () => {
  for (const answer of [() => Response.json({ last_event: 'scheduled' }), () => new Response('down', { status: 500 })]) {
    const id = crypto.randomUUID();
    await addSent(id, iso(START + 3600000));
    const p = provider(url => url.endsWith('/cancel') ? Response.json({ message: 'already canceled' }, { status: 422 }) : answer());
    assert.equal((await run(post('/admin/api/mail/cancel', { id }), env(), p.fetch)).status, 422);
    assert.equal((await runtime.db.prepare('SELECT canceled_at FROM cms_sent_mail WHERE resend_id = ?').bind(id).first()).canceled_at, null);
    assert.equal(p.calls.length, 2);
  }
});
