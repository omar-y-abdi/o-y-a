const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
import { defaultResources } from '../../content/resources.mjs';

// A page stays atomic: its HTML, CSS and editor project must travel together.
// Different pages/cards/theme keys merge; overlapping changes remain explicit.
export function mergeProjects(base, local, remote) {
  const conflicts = [];
  function choose(key, before, mine, theirs) {
    if (equal(mine, before)) return theirs;
    if (equal(theirs, before) || equal(mine, theirs)) return mine;
    conflicts.push(key);
    return mine;
  }
  function collection(name) {
    const index = project => new Map(project[name].map(item => [item.id, item]));
    const [before, mine, theirs] = [base, local, remote].map(index);
    return [...new Set([...theirs.keys(), ...mine.keys(), ...before.keys()])]
      .map(id => choose(`${name}:${id}`, before.get(id), mine.get(id), theirs.get(id)))
      .filter(item => item !== undefined);
  }
  function properties(name, fallback = defaultResources) {
    const before = base[name] ?? fallback, mine = local[name] ?? fallback, theirs = remote[name] ?? fallback;
    return Object.fromEntries([...new Set([...Object.keys(before), ...Object.keys(mine), ...Object.keys(theirs)])]
      .map(key => [key, choose(`${name}:${key}`, before[key], mine[key], theirs[key])])
      .filter(([, value]) => value !== undefined));
  }
  return { project: { schemaVersion: 1, pages: collection('pages'), cards: collection('cards'), theme: properties('theme'), runtime: properties('runtime'), resources: properties('resources'), sharedContent: properties('sharedContent', {}) }, conflicts };
}
