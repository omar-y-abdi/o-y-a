import { parseFragment, serialize } from 'parse5';
import { HttpError } from './http.mjs';
import { attribute, elements } from './html-tree.mjs';
import { preparePage, validateHtml, validateCss, migrateKeys } from './validation.mjs';
import LEGACY_KEYS from './legacy-keys.json' with { type: 'json' };
import { normalizeStoredProject as normalizeLegacyProject, normalizeClientProject as normalizeLegacyClient, refreshDevelopers, normalizeSharedValue, DEFAULT_SHARED_CONTENT } from './legacy-project.mjs';
import { splitPage, composePage, frameCss, frameShape, projectFrame, splitPageCss, responsiveHomeCss, legacySeed, validateFrame } from './frame.mjs';
import { mapFrameCss } from './frame-ids.mjs';

const fail = message => { throw new HttpError(422, message); };
const definition = (seed, page) => seed.pages.find(item => item.id === page.id) ?? seed.pages.find(item => item.id === page.sourceId) ?? seed.blank;

function scopedHtml(html, map, frame) {
  const tree = parseFragment(html, { scriptingEnabled: true });
  for (const node of elements(tree)) {
    if (frame && node.tagName === 'main') { node.attrs = []; continue; }
    const key = node.attrs.find(item => item.name === 'data-cms-node');
    if (key) key.value = (/^(?:k|skift-nav)/.test(key.value) && map?.[key.value]) || (frame ? `f-${key.value}` : key.value);
  }
  return serialize(tree);
}

function frameKeys(canonical, original) {
  const nodes = html => elements(parseFragment(html, { scriptingEnabled: false }));
  const source = nodes(original), target = nodes(canonical);
  if (source.length !== target.length || source.some((node, index) => node.tagName !== target[index].tagName || node.namespaceURI !== target[index].namespaceURI)) fail('Sidramens äldre nodnycklar kan inte kopplas entydigt till den gemensamma ramen.');
  return Object.fromEntries(target.flatMap((node, index) => {
    const key = attribute(node, 'data-cms-node'), old = attribute(source[index], 'data-cms-node');
    return key ? [[key, old ?? null]] : [];
  }));
}

export function legacyClientProject(input, seed) {
  const legacy = legacySeed(seed);
  return normalizeLegacyClient(migrateKeys(refreshDevelopers(input, legacy), LEGACY_KEYS), legacy);
}

export function toFrameProject(input, seed, { client = false } = {}) {
  if (input?.schemaVersion === 2) return input;
  if (!input || input.schemaVersion !== 1 || !Array.isArray(input.pages)) fail('Projektets format kan inte konverteras till en gemensam sidram.');
  if (input.frameVersion !== undefined && input.frameVersion !== 2) fail('Den äldre sidramens format stöds inte.');
  const ownerDecisions = input.frameVersion !== 2;
  const legacy = legacySeed(seed);
  const normalized = client ? legacyClientProject(input, seed) : normalizeLegacyProject(input, legacy);
  const variants = new Map(), shapes = new Map();
  const entries = normalized.pages.map(page => {
    const old = definition(legacy, page), source = definition(seed, page);
    const keys = seed.scopeKeys?.[source.id];
    const checked = validateHtml(page.html, old?.contracts ?? []);
    const split = splitPage(checked);
    const style = ownerDecisions && page.path === '/' ? responsiveHomeCss(page.css, split.page) : page.css;
    const styles = splitPageCss(style, split.html, split.page, page.path, ownerDecisions);
    const html = projectFrame(split.html, ownerDecisions);
    const scoped = scopedHtml(html, keys, true), shape = frameShape(scoped);
    const nodes = elements(parseFragment(scoped, { scriptingEnabled: true }));
    if (!shapes.has(shape)) shapes.set(shape, { tree: parseFragment(scoped, { scriptingEnabled: true }), entries: [] });
    const entry = { page, html, scoped, shape, nodes, styles, keys, main: split.page };
    shapes.get(shape).entries.push(entry);
    return entry;
  });
  // Every retained historical ID has a canonical counterpart, even when the
  // first page lacked that ID. The code-owned game's main has no page receipt,
  // so its IDs also stay outside the canonical frame's namespace.
  for (const group of shapes.values()) {
    const nodes = elements(group.tree), reserved = new Set(seed.skiftIds ?? []), used = new Set([...reserved, ...nodes.map(node => attribute(node, 'id')).filter(Boolean)]);
    nodes.forEach((node, index) => {
      const current = attribute(node, 'id');
      if (current && !reserved.has(current)) return;
      let id = current || group.entries.map(entry => attribute(entry.nodes[index], 'id')).find(Boolean);
      if (!id) return;
      if (used.has(id)) { let suffix = index; do { id = `frame-${suffix++}`; } while (used.has(id)); }
      used.add(id); node.attrs = [...node.attrs.filter(item => item.name !== 'id'), { name: 'id', value: id }];
    });
    group.html = serialize(group.tree);
  }
  const pages = entries.map(({ page, html, shape, nodes, styles, keys, main }) => {
    const canonical = shapes.get(shape), targets = elements(canonical.tree), ids = new Map(), frameIds = {};
    targets.forEach((node, index) => {
      const from = attribute(node, 'id') ?? null, to = attribute(nodes[index], 'id') ?? null;
      if (from === to) return;
      const key = attribute(node, 'data-cms-node');
      if (!key || from === null) fail('Sidramens äldre ID:n kan inte kopplas entydigt.');
      frameIds[key] = [from, to];
      if (to !== null) ids.set(to, { id: from });
    });
    let style;
    try { style = mapFrameCss(styles.frame, ids); } catch (error) { fail(`${page.path}: ${error.message}`); }
    const value = { html: canonical.html, css: style };
    const signature = JSON.stringify([shape, value.css]);
    const variant = variants.get(signature) ?? { value, label: page.name || page.path, pages: [] };
    variant.pages.push(page.name || page.path);
    variants.set(signature, variant);
    const { facts: _facts, footerVersion: _footer, frameIds: _ids, ...clean } = page;
    return { ...clean, html: scopedHtml(main, keys, false), css: styles.page, project: null, frameKeys: frameKeys(variant.value.html, html), ...(Object.keys(frameIds).length ? { frameIds } : {}) };
  });
  if (!variants.size) fail('Projektet saknar en sidram.');
  const options = [...variants.values()];
  const cards = Array.isArray(normalized.cards) ? normalized.cards.map(card => {
    if (!card?.design) return card;
    return { ...card, design: { ...card.design, project: null } };
  }) : normalized.cards;
  const { sharedContent: _shared, sharedContentConflicts, frameVersion: _version, ...project } = normalized;
  const conflicts = options.length > 1 ? [{ key: 'frame', options }] : [];
  // Preserve the existing choice between pre-sharedContent tagline variants.
  for (const conflict of sharedContentConflicts ?? []) {
    const frameOptions = conflict.options.map(option => {
      const tree = parseFragment(options[0].value.html);
      const target = elements(tree).find(node => attribute(node, 'data-cms-shared') === conflict.key);
      if (!target) fail('Den äldre versionens gemensamma text saknar plats i sidramen.');
      const children = parseFragment(option.value).childNodes;
      target.childNodes = children; children.forEach(child => { child.parentNode = target; });
      return { ...option, value: { html: serialize(tree), css: options[0].value.css } };
    });
    conflicts.push({ key: conflict.key, options: frameOptions });
  }
  return { ...project, schemaVersion: 2, pages, cards, frame: options[0].value, ...(conflicts.length ? { frameConflicts: conflicts } : {}) };
}

export const normalizeStoredProject = (project, seed) => toFrameProject(project, seed);
export const normalizeClientProject = (project, seed) => toFrameProject(project, seed, { client: true });

export function chooseFrame(project, value, key = project.frameConflicts?.[0]?.key) {
  const conflict = project.frameConflicts?.find(item => item.key === key);
  if (!conflict?.options.some(option => JSON.stringify(option.value) === JSON.stringify(value))) fail('Välj en av den äldre versionens sidramar.');
  let frame = value;
  if (key !== 'frame') {
    const tree = parseFragment(project.frame.html), chosen = parseFragment(value.html);
    const target = elements(tree).find(node => attribute(node, 'data-cms-shared') === key);
    const source = elements(chosen).find(node => attribute(node, 'data-cms-shared') === key);
    if (!target || !source) fail('Den gemensamma textens plats saknas i sidramen.');
    target.childNodes = source.childNodes; target.childNodes.forEach(child => { child.parentNode = target; });
    frame = { ...project.frame, html: serialize(tree) };
  }
  const { frameConflicts: _conflicts, ...rest } = project;
  const remaining = project.frameConflicts.filter(item => item !== conflict);
  return { ...rest, frame, ...(remaining.length ? { frameConflicts: remaining } : {}) };
}

export function toLegacyProject(project, seed) {
  if (project?.schemaVersion === 1) return structuredClone(project);
  if (project?.schemaVersion !== 2 || project.frameConflicts?.length) fail('Välj sidram innan projektet återställs till det äldre formatet.');
  const frame = validateFrame(project.frame, seed);
  const pages = project.pages.map(page => {
    validateHtml(page.html, definition(seed, page)?.contracts ?? []);
    let projected = page;
    const withMarkers = composePage(frame, page);
    const markers = elements(parseFragment(withMarkers)).filter(node => attribute(node, 'data-cms-frame-id'));
    if (markers.length) {
      // Schema 1 cannot carry generated selector markers. An explicit reverse
      // migration gives these styled, formerly idless nodes collision-free IDs.
      const ids = new Set(elements(parseFragment(withMarkers)).map(node => attribute(node, 'id')).filter(Boolean));
      const frameIds = structuredClone(page.frameIds);
      let serial = 0;
      for (const node of markers) {
        let id; do { id = `frame-legacy-${serial++}`; } while (ids.has(id)); ids.add(id);
        frameIds[attribute(node, 'data-cms-frame-id')][1] = id;
      }
      projected = { ...page, frameIds };
    }
    const css = frameCss(frame, projected), composed = projected === page ? withMarkers : composePage(frame, projected);
    const styles = splitPageCss(css + page.css, splitPage(composed).html, page.html, page.path, false);
    if (styles.frame !== css || styles.page !== validateCss(page.css ?? '')) fail(`Stilarna på ${page.path} kan inte återställas utan att byta ägare.`);
    const tree = parseFragment(composed, { scriptingEnabled: false });
    const nodes = elements(tree), keys = nodes.map(node => attribute(node, 'data-cms-node'));
    for (const node of nodes) node.attrs = node.attrs.filter(item => item.name !== 'data-cms-node');
    const prepared = preparePage(`<!doctype html><html><head></head><body>${serialize(tree)}</body></html>`);
    const restored = parseFragment(prepared.html, { scriptingEnabled: false });
    elements(restored).forEach((node, index) => {
      const key = node.attrs.find(item => item.name === 'data-cms-node');
      if (/^(?:k|skift-nav)/.test(key.value)) return;
      if (keys[index]) key.value = keys[index];
      else node.attrs = node.attrs.filter(item => item !== key);
    });
    const { facts: _facts, frameKeys: _keys, frameIds: _ids, ...clean } = page;
    return { ...clean, html: serialize(restored), css: css + page.css, project: null, footerVersion: 1 };
  });
  const tree = parseFragment(frame.html), sharedContent = {};
  for (const key of Object.keys(legacySeed(seed).sharedContent ?? DEFAULT_SHARED_CONTENT)) {
    const node = elements(tree).find(item => attribute(item, 'data-cms-shared') === key);
    if (!node) fail('Sidramen saknar den äldre versionens gemensamma text.');
    sharedContent[key] = normalizeSharedValue(serialize(node));
  }
  const { frame: _frame, frameConflicts: _conflicts, ...rest } = project;
  // Older Workers ignore this field. A later forward conversion can preserve
  // frame edits instead of applying the original owner decisions a second time.
  return { ...rest, schemaVersion: 1, frameVersion: 2, pages, sharedContent };
}
