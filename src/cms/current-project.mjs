import { readSite } from './store.mjs';
import { normalizeStoredProject } from './frame-converter.mjs';
import { readStudioHead, readStudioResources } from './studio-store.mjs';
import { currentBaseline } from './preview-store.mjs';

async function ordinaryCurrent(db, seed, initial) {
  const stored = await readSite(db);
  return { version: stored?.version ?? 0, project: stored ? normalizeStoredProject(stored.project, seed, initial) : initial };
}

// Keep the exact project separate from internal validation facts. Callers may
// apply a delta to project; only the validator receives baseline.
export async function readCurrentProject(db, seed, initial, origin) {
  const canonical = await readStudioHead(db, seed.studioKey);
  if (!canonical) {
    const current = await ordinaryCurrent(db, seed, initial);
    return { ...current, baseline: current.project };
  }
  const project = JSON.parse(canonical.parts.join(''));
  return { version: canonical.version, project, baseline: await currentBaseline(db, project, canonical.version, seed, origin) };
}

export async function readCurrentResources(db, seed, initial) {
  const canonical = await readStudioResources(db, seed.studioKey);
  if (canonical) return { resources: canonical.resources };
  return (await ordinaryCurrent(db, seed, initial)).project;
}
