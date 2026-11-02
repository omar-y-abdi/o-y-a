import { previewPayload } from '../preview-project.mjs';

// One target is on screen. Reuse its pending/completed HTML across device
// changes, but not a new Draft generation, history snapshot or asset inventory.
export function previewCache(request) {
  let entry;
  return (owner, generation, type, id, project, assets) => {
    const key = [owner, generation, type, id, assets];
    if (!entry || key.some((value, index) => value !== entry.key[index])) {
      const next = { key, promise: request('preview', previewPayload(project, type, id)) };
      entry = next;
      next.promise.catch(() => { if (entry === next) entry = null; });
    }
    return entry.promise;
  };
}
