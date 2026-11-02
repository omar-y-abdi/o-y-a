import { seedAsset } from '../../.generated/cms-build.mjs';
import { readBounded } from '../api/http.mjs';
import { digest } from './digest.mjs';

let completed;

async function readDefinitions(env) {
  const response = await env.ASSETS.fetch(new Request('https://assets.local' + seedAsset.path));
  try {
    if (response.status !== 200) throw new Error('CMS_SEED_STATUS');
    const bytes = await readBounded(response, seedAsset.bytes);
    if (bytes?.byteLength !== seedAsset.bytes || await digest(bytes) !== seedAsset.sha256) throw new Error('CMS_SEED_IDENTITY');
    const definitions = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!definitions || Object.keys(definitions).sort().join(',') !== 'initial,seed'
      || definitions.seed?.studioKey !== seedAsset.studioKey || !Array.isArray(definitions.seed.pages)
      || definitions.initial?.schemaVersion !== 2 || !Array.isArray(definitions.initial.pages)) throw new Error('CMS_SEED_FORMAT');
    return definitions;
  } catch (error) {
    // A status/header refusal may leave a body unread. Cleanup must not mask
    // the original internal failure or turn it into a caller's 400/413.
    try { await response.body?.cancel(); } catch { /* The read may already have canceled/closed the stream. */ }
    throw error;
  }
}

// Each cold request owns its I/O. Sharing a pending fetch across requests can
// strand another waiter when the owning handler finishes. Only completed
// plain definitions are reusable; failures never overwrite a successful copy.
export async function loadAdminSeed(env) {
  if (completed) return completed;
  const definitions = await readDefinitions(env);
  completed ??= definitions;
  return completed;
}
