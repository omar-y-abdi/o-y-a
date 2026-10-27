import { validateProject } from './project.mjs';
import { digest, publicationChunks, publicationMedia, readHistory, readSite } from './store.mjs';
import { resolvedResources } from './resources.mjs';
import { normalizeStoredProject, chooseFrame } from './frame-converter.mjs';
import { readStudioVersion } from './studio-store.mjs';
import { isDeepStrictEqual } from 'node:util';

function* restorable(project) {
  const conflict = project.frameConflicts?.[0];
  if (!conflict) { yield project; return; }
  for (const option of conflict.options) yield* restorable(chooseFrame(project, option.value, conflict.key));
}

// No cache and no writes: a release must accept every retained restorable
// revision under its own contracts, security policy and storage limits.
export async function checkCompatibility(db, { seed, initial }) {
  const results = [], studioRefreshRequired = [];
  async function check(version, project) {
    try {
      const converted = normalizeStoredProject(structuredClone(project), seed, initial);
      const canonical = await readStudioVersion(db, version);
      if (canonical && (await digest(canonical.parts.join('')) !== canonical.hash || !isDeepStrictEqual(canonical.resources, converted.resources) || !isDeepStrictEqual(JSON.parse(canonical.parts.join('')), JSON.parse(JSON.stringify(converted))))) {
        results.push({ version, compatible: false, error: 'Studions lagrade text avviker från revisionens aktuella representation. Repetera CPU-migreringen med det föreslagna bygget innan driftsättning.' });
        return;
      }
      for (const candidate of restorable(converted)) {
        const normalized = validateProject(candidate, seed);
        publicationChunks(normalized, resolvedResources(normalized, await publicationMedia(db, normalized)));
      }
      if (canonical && canonical.buildKey !== seed.studioKey) studioRefreshRequired.push({ version, reason: 'build-key-changed' });
      results.push({ version, compatible: true });
    } catch (error) {
      if (![413, 422].includes(error.status)) throw error;
      results.push({ version, compatible: false, error: error.message });
    }
  }
  await check(0, initial);
  let cursor;
  do {
    const history = await readHistory(db, cursor);
    for (const item of history.items) await check(item.version, (await readSite(db, item.version)).project);
    cursor = history.next;
  } while (cursor);
  return { compatible: results.every(item => item.compatible), revisions: results, studioRefreshRequired };
}
