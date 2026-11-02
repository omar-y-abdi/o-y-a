import { digest } from './digest.mjs';

export const frameHash = (project, origin) => digest(JSON.stringify([project.schemaVersion, origin, project.frame.html, project.frame.css ?? '']));
export const pageHash = (project, page, frame, origin) => digest(JSON.stringify([project.schemaVersion, origin, frame, page.id, page.sourceId, page.html, page.css ?? '', page.frameKeys ?? null, page.frameIds ?? null]));

// Validated publication and sealed D1-owner migration transactions write these
// proofs. They contain immutable facts, never mutable media readiness.
export async function previewFacts(project, frame, origin) {
  const hash = await frameHash(project, origin);
  const rows = [{ target: '@frame', hash, origin, facts: JSON.stringify({ nodes: frame.nodes.map(({ tagName, namespaceURI, attrs }) => ({ tagName, namespaceURI, attrs })), resourceReferences: frame.resourceReferences, resourceOrigin: frame.resourceOrigin }) }];
  for (const page of project.pages) rows.push({ target: `page/${page.id}`, hash: await pageHash(project, page, hash, origin), origin, facts: JSON.stringify(page.facts) });
  // Facts are optional accelerators; an unusually large summary gets a miss
  // and full target validation rather than reducing accepted project limits.
  return rows.filter(row => new TextEncoder().encode(JSON.stringify(row)).byteLength + 2 <= 1000000);
}

export async function previewBaseline(db, project, seed, origin) {
  const page = project.pages?.[0], frame = project.frame;
  if (!seed.studioKey || project.schemaVersion !== 2 || !page || typeof page.html !== 'string' || typeof page.css !== 'string' || typeof frame?.html !== 'string' || typeof frame.css !== 'string') return null;
  const frameKey = await frameHash(project, origin), pageKey = await pageHash(project, page, frameKey, origin);
  let rows;
  try {
    rows = await db.prepare("SELECT f.target,f.facts FROM cms_head h JOIN cms_studio_heads s ON s.version=h.version JOIN cms_preview_facts f ON f.version=s.version WHERE h.id=1 AND s.build_key=? AND f.origin=? AND ((f.target='@frame' AND f.content_hash=?) OR (f.target=? AND f.content_hash=?))").bind(seed.studioKey, origin, frameKey, `page/${page.id}`, pageKey).all();
  } catch (error) {
    if (/no such table: (?:main\.)?cms_(?:studio_heads|preview_facts)\b/i.test(String(error?.message ?? error))) return null;
    throw error;
  }
  const found = new Map(rows.results.map(row => [row.target, JSON.parse(row.facts)]));
  return {
    schemaVersion: 2,
    pages: found.has(`page/${page.id}`) ? [{ ...page, facts: found.get(`page/${page.id}`) }] : [],
    ...(found.has('@frame') ? { validatedFrame: { ...frame, ...found.get('@frame') } } : {}),
  };
}

// The canonical body and its immutable proof rows can be read across a Save.
// Pin this query to the body version, never whichever head is current later.
// A disappeared proof set safely leaves the original baseline for validation.
export async function currentBaseline(db, project, version, seed, origin) {
  let rows;
  try {
    rows = await db.prepare('SELECT f.target,f.content_hash,f.facts FROM cms_studio_heads s JOIN cms_preview_facts f ON f.version=s.version WHERE s.version=? AND s.build_key=? AND f.origin=?').bind(version, seed.studioKey, origin).all();
  } catch (error) {
    if (/no such table: (?:main\.)?cms_preview_facts\b/i.test(String(error?.message ?? error))) return project;
    throw error;
  }
  if (!rows.results.length) return project;
  const found = new Map(rows.results.map(row => [row.target, row]));
  const frameKey = await frameHash(project, origin);
  const frameRow = found.get('@frame');
  const pages = await Promise.all(project.pages.map(async page => {
    const row = found.get(`page/${page.id}`);
    if (!row) return page;
    return row.content_hash === await pageHash(project, page, frameKey, origin) ? { ...page, facts: JSON.parse(row.facts) } : page;
  }));
  return { ...project, pages, ...(frameRow?.content_hash === frameKey ? { validatedFrame: { ...project.frame, ...JSON.parse(frameRow.facts) } } : {}) };
}
