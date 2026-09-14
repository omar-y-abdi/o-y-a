import { validateProject } from './project.mjs';
import { publicationChunks, publicationMedia, readHistory, readSite } from './store.mjs';
import { resolvedResources } from './resources.mjs';

// No cache and no writes: a release must accept every retained restorable
// revision under its own contracts, security policy and storage limits.
export async function checkCompatibility(db, { seed, initial }) {
  const results = [];
  async function check(version, project) {
    try {
      const normalized = validateProject(structuredClone(project), seed);
      publicationChunks(normalized, resolvedResources(normalized, await publicationMedia(db, normalized)));
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
  return { compatible: results.every(item => item.compatible), revisions: results };
}
