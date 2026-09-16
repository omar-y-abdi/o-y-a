import { parseFragment, serialize } from 'parse5';
import * as css from 'css-tree';
import { mapCssReferences } from './css-references.mjs';
import { HttpError } from './http.mjs';
import { defaultResources, resourceSlots } from '../content/resources.mjs';
import { SITE_ORIGIN } from './routes.mjs';

const URL_ATTRIBUTES = new Set(['src', 'href', 'poster']);
const CSS_ATTRIBUTES = new Set(['style', 'fill', 'stroke', 'clip-path', 'mask', 'filter']);
const fontProperty = property => ['font', 'font-family'].includes(property.toLowerCase()) || property.startsWith('--');

export function validateResources(input = defaultResources) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !Object.hasOwn(defaultResources, key))) throw new HttpError(422, 'Webbplatsens bildplatser är ogiltiga.');
  const result = { ...defaultResources, ...input };
  for (const [slot, value] of Object.entries(result)) {
    if (typeof value !== 'string' || !Object.values(defaultResources).includes(value) && !/^\/media\/[0-9a-f-]{36}\.(png|jpg|gif|webp|avif)$/.test(value)) throw new HttpError(422, 'Välj en bild ur mediebiblioteket för webbplatsens bildplatser.');
    if (slot === 'icon' && !value.endsWith('.png')) throw new HttpError(422, 'Webbplatsikonen behöver en PNG-bild.');
    if (slot.startsWith('email') && !/\.(png|jpg|gif)$/.test(value)) throw new HttpError(422, 'Brevbilder behöver PNG, JPEG eller GIF för e-postklienter.');
  }
  return result;
}

function mapCss(source, handlers, context = 'stylesheet') {
  const tree = css.parse(source, { context, parseCustomProperty: true });
  css.walk(tree, { visit: 'Declaration', enter(node) {
    const value = mapCssReferences(css.generate(node.value), { url: handlers.url, ...(fontProperty(node.property) ? { font: handlers.font } : {}) });
    node.value = css.parse(value, { context: 'value' });
  } });
  return css.generate(tree);
}

function mapAttributes(attributes, handlers) {
  return Object.fromEntries(Object.entries(attributes).map(([name, value]) => {
    if (URL_ATTRIBUTES.has(name)) value = handlers.url(value);
    if (name === 'srcset') value = value.split(',').map(item => { const [url, ...descriptor] = item.trim().split(/\s+/); return [handlers.url(url), ...descriptor].join(' '); }).join(', ');
    if (name === 'style') value = mapCss(value, handlers, 'declarationList');
    else if (CSS_ATTRIBUTES.has(name)) value = mapCssReferences(value, { url: handlers.url });
    return [name, value];
  }));
}

function mapHtml(source, handlers) {
  const tree = parseFragment(source, { scriptingEnabled: true });
  function visit(node) {
    if (node.attrs) {
      const mapped = mapAttributes(Object.fromEntries(node.attrs.map(item => [item.name, item.value])), handlers);
      node.attrs.forEach(item => { item.value = mapped[item.name]; });
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(tree);
  return serialize(tree);
}

function mapEditor(value, handlers) {
  if (Array.isArray(value)) return value.map(item => mapEditor(item, handlers));
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'attributes') result[key] = mapAttributes(entry, handlers);
    else if (key === 'style') result[key] = Object.fromEntries(Object.entries(entry).map(([property, style]) => [property, mapCssReferences(String(style), { url: handlers.url, ...(fontProperty(property) ? { font: handlers.font } : {}) })]));
    else if (URL_ATTRIBUTES.has(key) && typeof entry === 'string') result[key] = handlers.url(entry);
    else if (typeof entry === 'string' && (key === 'components' || key === 'content' && value.type !== 'textnode' && value.tagName !== 'noscript')) result[key] = mapHtml(entry, handlers);
    else result[key] = mapEditor(entry, handlers);
  }
  return result;
}

function mapProject(project, handlers, editorData = true) {
  const design = value => ({ ...value, html: mapHtml(value.html, handlers), css: mapCss(value.css ?? '', handlers), ...(editorData ? { project: mapEditor(value.project, handlers) } : {}) });
  return {
    ...project,
    pages: project.pages.map(design),
    cards: project.cards.map(card => card.design ? { ...card, design: design(card.design) } : card),
    theme: { ...project.theme, fontFamily: handlers.font(project.theme.fontFamily) },
    resources: Object.fromEntries(Object.entries(project.resources ?? defaultResources).map(([key, value]) => [key, handlers.url(value)])),
  };
}

export function resourceReferences(project, origin = SITE_ORIGIN) {
  const counts = new Map();
  const add = value => { counts.set(value, (counts.get(value) ?? 0) + 1); return value; };
  mapProject(project, {
    url(value) {
      try { const url = new URL(value, SITE_ORIGIN); if ([SITE_ORIGIN, origin].includes(url.origin) && !value.startsWith('#')) add(url.pathname); } catch { /* Non-resource addresses do not create a dependency. */ }
      return value;
    },
    font(value) { if (/^cms-font-[0-9a-f-]{36}$/.test(value)) add(`/media/${value.slice(9)}.woff2`); return value; },
  }, false);
  return counts;
}

export function replaceResource(project, previous, next, origin = SITE_ORIGIN) {
  if (previous.mime.startsWith('image/') !== next.mime.startsWith('image/')) throw new HttpError(422, 'Bilder och typsnitt kan inte ersätta varandra.');
  let replacements = 0;
  const result = mapProject(project, {
    url(value) {
      try {
        const url = new URL(value, SITE_ORIGIN);
        if ([SITE_ORIGIN, origin].includes(url.origin) && url.pathname === previous.src) {
          replacements++; url.pathname = next.src;
          return value.startsWith('/') ? url.pathname + url.search + url.hash : url.href;
        }
      } catch { /* Preserve addresses that do not refer to the replaced resource. */ }
      return value;
    },
    font(value) { if (previous.mime === 'font/woff2' && value === `cms-font-${previous.id}`) { replacements++; return `cms-font-${next.id}`; } return value; },
  });
  if (previous.slot) { result.resources[previous.slot] = next.src; replacements++; }
  validateResources(result.resources);
  return { project: result, replacements };
}

export function resolvedResources(project, assets = []) {
  const resources = validateResources(project.resources);
  return Object.fromEntries(Object.entries(resources).map(([slot, src]) => {
    const asset = assets.find(asset => asset.src === src) ?? Object.values(resourceSlots).find(asset => asset.src === src);
    if (!asset) throw new HttpError(422, `Bilden för ${resourceSlots[slot].name} saknas i biblioteket.`);
    return [slot, { src, alt: asset.alt ?? resourceSlots[slot].alt, mime: asset.mime, width: asset.width, height: asset.height }];
  }));
}

export function resourceCatalog(seed, assets, project) {
  const slots = resolvedResources(project, [...seed.assets, ...assets]);
  return [...seed.assets.map(asset => ({ ...asset, ...(asset.slot ? slots[asset.slot] : {}) })), ...assets];
}

async function builtinResolutionAssets(db) {
  let rows;
  try { rows = await db.prepare('SELECT source_path, name, alt FROM cms_builtin_resource_state').all(); }
  catch (error) { if (/no such table: cms_builtin_resource_state/i.test(String(error?.message ?? error))) return []; throw error; }
  const states = new Map(rows.results.map(row => [row.source_path, row]));
  return Object.values(resourceSlots).map(asset => {
    const state = states.get(asset.src);
    return { ...asset, name: state?.name ?? asset.name, alt: state?.alt ?? asset.alt ?? '' };
  });
}

export async function resolveResources(db, project) {
  const keys = Object.values(validateResources(project.resources)).filter(src => src.startsWith('/media/')).map(src => src.slice(7));
  const [rows, builtins] = await Promise.all([
    keys.length ? db.prepare('SELECT object_key, mime, width, height, alt FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?)) AND deleting_at IS NULL').bind(JSON.stringify(keys)).all() : Promise.resolve({ results: [] }),
    builtinResolutionAssets(db),
  ]);
  return resolvedResources(project, [...builtins, ...rows.results.map(row => ({ ...row, src: '/media/' + row.object_key }))]);
}
