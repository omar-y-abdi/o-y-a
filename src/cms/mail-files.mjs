import { reportFailure, reportMailOrphan } from './diagnostics.mjs';

export const MAIL_FILE_LIFETIME = 86400000;
export const MAIL_CLEANUP_LIMIT = 20;
const iso = ms => new Date(ms).toISOString();
const PRIVATE_KEY = /^mail-private\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Deletion is terminal. Keep the D1 tombstone until R2 confirms deletion;
// overlapping cleaners and a retry after a lost D1 response are safe.
async function deleteClaimed(env, files) {
  if (!files.length) return;
  await env.CMS_MEDIA.delete(files.map(file => file.object_key));
  await env.CMS_DB.prepare("DELETE FROM cms_mail_files WHERE id IN (SELECT value FROM json_each(?)) AND state = 'deleting'").bind(JSON.stringify(files.map(file => file.id))).run();
}

export async function cleanupMailFiles(env, now = Date.now) {
  const timestamp = iso(now());
  // A failed page moves behind older pending work on the next invocation.
  const { results } = await env.CMS_DB.prepare("UPDATE cms_mail_files SET state = 'deleting', deleting_at = ?1 WHERE id IN (SELECT id FROM cms_mail_files WHERE expires_at <= ?1 OR state = 'deleting' ORDER BY COALESCE(deleting_at, expires_at), id LIMIT ?2) RETURNING id, object_key").bind(timestamp, MAIL_CLEANUP_LIMIT).all();
  await deleteClaimed(env, results);
}

export async function removeMailFile(env, id, now = Date.now) {
  const row = await env.CMS_DB.prepare("UPDATE cms_mail_files SET state = 'deleting', deleting_at = ? WHERE id = ? AND state = 'ready' AND sent_at IS NULL AND claimed_by IS NULL RETURNING id, object_key").bind(iso(now()), id).first();
  if (!row) return false;
  try { await deleteClaimed(env, [row]); }
  catch (error) { reportFailure(error, 'mail'); }
  // It is unavailable immediately; durable cleanup retries storage failure.
  return true;
}

export async function discardMailUpload(env, id, now = Date.now) {
  try {
    const row = await env.CMS_DB.prepare("UPDATE cms_mail_files SET state = 'deleting', deleting_at = ? WHERE id = ? AND sent_at IS NULL AND claimed_by IS NULL RETURNING id, object_key").bind(iso(now()), id).first();
    if (row) await deleteClaimed(env, [row]);
    // A cleaner may already have removed the staging row before a slow PUT
    // completed. Do not publish it again; remove the newly completed object.
    else if (!await env.CMS_DB.prepare('SELECT id FROM cms_mail_files WHERE id = ?').bind(id).first()) await env.CMS_MEDIA.delete('mail-private/' + id);
  } catch (error) {
    reportFailure(error, 'mail');
    reportMailOrphan('mail-private/' + id);
  }
}

// D1 and R2 do not share a transaction. A killed upload can finish its R2 PUT
// after the staging row was cleaned. Sweep old, unregistered objects as well
// as the D1 queue; the persisted cursor makes every page reachable.
export async function sweepMailOrphans(env, now = Date.now) {
  const { cursor, version } = await env.CMS_DB.prepare('SELECT cursor, version FROM cms_mail_cleanup WHERE id = 1').first();
  const page = await env.CMS_MEDIA.list({ prefix: 'mail-private/', limit: MAIL_CLEANUP_LIMIT, ...(cursor ? { cursor } : {}) });
  const candidates = page.objects.filter(object => PRIVATE_KEY.test(object.key) && new Date(object.uploaded).getTime() <= now() - MAIL_FILE_LIFETIME);
  let failure;
  try {
    if (candidates.length) {
      const { results } = await env.CMS_DB.prepare('SELECT object_key FROM cms_mail_files WHERE object_key IN (SELECT value FROM json_each(?))').bind(JSON.stringify(candidates.map(object => object.key))).all();
      const registered = new Set(results.map(row => row.object_key));
      const orphans = candidates.map(object => object.key).filter(key => !registered.has(key));
      if (orphans.length) await env.CMS_MEDIA.delete(orphans);
    }
  } catch (error) { failure = error; }
  const next = page.truncated ? page.cursor : '';
  // Versioned CAS also prevents an old scan from overwriting a wrapped cursor.
  // Failed objects stay in R2 for the next pass; later pages still get a turn.
  await env.CMS_DB.prepare('UPDATE cms_mail_cleanup SET cursor = ?, version = version + 1 WHERE id = 1 AND version = ?').bind(next, version).run();
  if (failure) throw failure;
}

export async function maintainMailFiles(env, now = Date.now) {
  const results = await Promise.allSettled([cleanupMailFiles(env, now), sweepMailOrphans(env, now)]);
  const failures = results.filter(result => result.status === 'rejected');
  for (const failure of failures) reportFailure(failure.reason, 'mail');
  if (failures.length) throw new Error('Private attachment maintenance failed; retained work will be retried.');
}
