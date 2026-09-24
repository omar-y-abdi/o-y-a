const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const validId = (id, kind) => typeof id === 'string' && (kind === 'page' ? /^[a-zA-Z0-9-]{1,80}$/ : /^[a-z0-9-]{1,80}$/).test(id);

const fields = {
  page: new Set(['id', 'path', 'sourceId', 'name', 'title', 'description', 'html', 'css', 'project', 'template', 'bodyClass', 'noindex']),
  card: new Set(['id', 'flavor', 'text', 'state', 'design']),
  design: new Set(['html', 'css', 'project']),
};
const hasOnly = (value, allowed) => Object.keys(value).every(key => allowed.has(key));

export function validateProjectChanges(changes) {
  if (!isRecord(changes) || !Object.keys(changes).length || !hasOnly(changes, new Set(['pages', 'cards', 'runtime', 'theme', 'resources', 'sharedContent']))) throw new TypeError('Invalid changes envelope.');
  const normalized = {};
  for (const kind of ['pages', 'cards']) {
    if (!Object.hasOwn(changes, kind)) continue;
    const group = changes[kind], entity = kind === 'pages' ? 'page' : 'card';
    if (!isRecord(group) || !hasOnly(group, new Set(['upsert', 'remove', 'order']))
      || group.upsert !== undefined && !Array.isArray(group.upsert) || group.remove !== undefined && !Array.isArray(group.remove)) throw new TypeError(`Invalid ${kind} changes.`);
    const upsert = group.upsert ?? [], remove = group.remove ?? [];
    const seen = new Set();
    for (const item of upsert) {
      if (!isRecord(item) || !validId(item.id, entity) || !hasOnly(item, fields[entity]) || seen.has(item.id)) throw new TypeError(`Invalid ${entity} upsert.`);
      seen.add(item.id);
      if (entity === 'card' && item.design !== undefined && item.design !== null && (!isRecord(item.design) || !hasOnly(item.design, fields.design))) throw new TypeError('Invalid card design.');
    }
    const removed = new Set();
    for (const id of remove) {
      if (!validId(id, entity) || removed.has(id) || seen.has(id)) throw new TypeError(`Invalid ${entity} removal.`);
      removed.add(id);
    }
    if (group.order !== undefined && (!Array.isArray(group.order) || group.order.some(id => !validId(id, entity)) || new Set(group.order).size !== group.order.length)) throw new TypeError(`Invalid ${kind} order.`);
    if (!upsert.length && !remove.length && group.order === undefined) throw new TypeError(`Empty ${kind} changes.`);
    normalized[kind] = { upsert, remove, ...(group.order === undefined ? {} : { order: group.order }) };
  }
  for (const key of ['runtime', 'theme', 'resources', 'sharedContent']) {
    if (!Object.hasOwn(changes, key)) continue;
    if (!isRecord(changes[key])) throw new TypeError(`Invalid ${key} replacement.`);
    normalized[key] = changes[key];
  }
  return normalized;
}

function updateCollection(current, group, kind) {
  if (!group) return current;
  const removals = group.remove ?? [], upserts = group.upsert ?? [];
  const currentIds = new Set(current.map(item => item.id));
  if (removals.some(id => !currentIds.has(id))) throw new TypeError(`Unknown ${kind} removal.`);
  const values = current.filter(item => !removals.includes(item.id));
  for (const item of upserts) {
    const index = values.findIndex(value => value.id === item.id);
    if (index < 0) values.push(structuredClone(item));
    else values[index] = structuredClone(item);
  }
  if (group.order === undefined) return values;
  const byId = new Map(values.map(item => [item.id, item]));
  if (group.order.length !== values.length || group.order.some(id => !byId.has(id))) throw new TypeError(`Incomplete ${kind} order.`);
  return group.order.map(id => byId.get(id));
}

export function applyProjectChanges(base, changes) {
  // Inputs are locally generated diffs or server-validated recovery intents;
  // API boundaries own strict validation so the browser need not ship it.
  const project = structuredClone(base);
  project.pages = updateCollection(project.pages, changes.pages, 'pages');
  project.cards = updateCollection(project.cards, changes.cards, 'cards');
  for (const key of ['runtime', 'theme', 'resources', 'sharedContent']) if (Object.hasOwn(changes, key)) project[key] = structuredClone(changes[key]);
  return project;
}

function cleanPage(page) {
  if (!page || typeof page !== 'object' || Array.isArray(page)) return page;
  const { facts: _facts, ...clean } = page;
  return clean;
}

function collectionChanges(before, after, kind) {
  const prior = Array.isArray(before) ? before : [], next = Array.isArray(after) ? after : [];
  const clean = kind === 'pages' ? cleanPage : item => item;
  const old = new Map(prior.filter(item => item && typeof item.id === 'string').map(item => [item.id, item]));
  const currentIds = new Set(next.filter(item => item && typeof item.id === 'string').map(item => item.id));
  const counts = new Map();
  for (const item of next) if (item && typeof item.id === 'string') counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  const upsert = [];
  for (const item of next) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.id !== 'string' || counts.get(item.id) > 1) { upsert.push(structuredClone(clean(item))); continue; }
    const previous = item && old.get(item.id);
    if (!previous || !equal(clean(previous), clean(item))) upsert.push(structuredClone(clean(item)));
  }
  const remove = [...old.keys()].filter(id => !currentIds.has(id));
  const beforeOrder = prior.map(item => item?.id), afterOrder = next.map(item => item?.id);
  const group = { upsert, remove };
  if (!equal(beforeOrder, afterOrder) || !Array.isArray(after)) group.order = afterOrder;
  return upsert.length || remove.length || group.order ? group : null;
}

export function projectChanges(before, after) {
  const changes = {};
  if (before?.schemaVersion !== after?.schemaVersion) throw new TypeError('The project version cannot be changed.');
  const supported = new Set(['schemaVersion', 'pages', 'cards', 'runtime', 'theme', 'resources', 'sharedContent', 'sharedContentConflicts']);
  for (const key of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    if (!supported.has(key) && !equal(before?.[key], after?.[key])) throw new TypeError(`Unsupported project change: ${key}.`);
  }
  for (const key of ['pages', 'cards']) {
    const group = collectionChanges(before?.[key], after?.[key], key);
    if (group) changes[key] = group;
  }
  for (const key of ['runtime', 'theme', 'resources', 'sharedContent']) {
    if (Object.hasOwn(before ?? {}, key) !== Object.hasOwn(after ?? {}, key) || !equal(before?.[key], after?.[key])) changes[key] = structuredClone(after?.[key] ?? null);
  }
  return changes;
}
