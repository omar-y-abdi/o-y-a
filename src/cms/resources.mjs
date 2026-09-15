import { parseFragment, serialize } from 'parse5';
import { parse as parseCss, generate as generateCss, walk as walkCss } from 'css-tree';
import { HttpError } from './http.mjs';
import { resourceSlots } from '../content/resources.mjs';
import { ID_REFERENCES } from './id-references.mjs';
import { applyBuiltinState } from './media-lifecycle.mjs';
const SITE_ORIGIN = 'https://omaryusuf.se';
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[4-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const media = new RegExp(`^/media/${uuid}\\.(?:png|jpg|gif|webp|avif|woff2)$`, 'i');
const font = new RegExp(`^cms-font-${uuid}$`, 'i');
const builtIn = new Set(Object.values(resourceSlots).map(asset => asset.src));
const slotNames = Object.keys(resourceSlots);

function validResourceSrc(value) { return typeof value === 'string' && (builtIn.has(value) || media.test(value)); }
export function validateResources(value) {
  const result = {};
  for (const name of slotNames) {
    const src = value?.[name] ?? resourceSlots[name].src;
    if (!validResourceSrc(src) || !src.startsWith('/media/') && src !== resourceSlots[name].src) throw new HttpError(422, `Resursen ${resourceSlots[name].name} är ogiltig.`);
    result[name] = src;
  }
  if (value && Object.keys(value).some(name => !slotNames.includes(name))) throw new HttpError(422, 'Resursregistret innehåller en okänd plats.');
  return result;
}

function cssUrl(value) { try { return JSON.parse(`"${value.replaceAll('"','\\"')}"`); } catch { return value; } }
function cssText(value) { return { type: 'String', loc: null, value }; }
function mapEditor(value, handlers) {
  const visit = current => {
    if (!current || typeof current !== 'object') return;
    if (Array.isArray(current)) return current.forEach(visit);
    if (current.src && typeof current.src === 'string') current.src = handlers.url(current.src);
    if (current.href && typeof current.href === 'string') current.href = handlers.url(current.href);
    if (current.style && typeof current.style === 'object') for (const [name, raw] of Object.entries(current.style)) {
      if (name === 'font-family') current.style[name] = handlers.font(raw);
      current.style[name] = rewriteCss(`x{${name}:${current.style[name]}}`, handlers).replace(/^x\{|\}$/g,'').replace(new RegExp(`^${name}:`),'');
    }
    for (const child of Object.values(current)) if (child && typeof child === 'object') visit(child);
  };
  visit(value);
}
function rewriteHtml(html, handlers) {
  const tree = parseFragment(html, { scriptingEnabled: true });
  function visit(node) {
    if (node.attrs) for (const attribute of node.attrs) {
      if (['src','href','action','poster'].includes(attribute.name)) attribute.value = handlers.url(attribute.value);
      else if (attribute.name === 'srcset') attribute.value = attribute.value.split(',').map(entry => { const match = entry.trim().match(/^(\S+)(.*)$/); return match ? handlers.url(match[1]) + match[2] : entry; }).join(', ');
      else if (attribute.name === 'style') attribute.value = rewriteCss(`x{${attribute.value}}`, handlers).replace(/^x\{|\}$/g,'');
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(tree); return serialize(tree);
}
function rewriteCss(css, handlers) {
  let ast; try { ast = parseCss(css, { positions: false }); } catch { return css; }
  walkCss(ast, node => {
    if (node.type === 'Url') node.value = handlers.url(cssUrl(node.value));
    if (node.type === 'Declaration' && node.property === 'font-family') {
      walkCss(node.value, family => { if (family.type === 'Identifier' || family.type === 'String') family.value = handlers.font(family.value); });
    }
  });
  return generateCss(ast);
}
function mapProject(project, handlers, editor = true) {
  const result = structuredClone(project);
  for (const page of result.pages) {
    page.html = rewriteHtml(page.html, handlers); page.css = rewriteCss(page.css, handlers);
    if (editor) mapEditor(page.project, handlers);
  }
  for (const card of result.cards) if (card.design) { card.design.html = rewriteHtml(card.design.html, handlers); card.design.css = rewriteCss(card.design.css, handlers); if (editor) mapEditor(card.design.project, handlers); }
  result.theme.fontFamily = handlers.font(result.theme.fontFamily);
  return result;
}

export function resourceReferences(project, origin = SITE_ORIGIN) {
  const counts = new Map();
  const add = src => { if (builtIn.has(src) || media.test(src)) counts.set(src, (counts.get(src) ?? 0) + 1); };
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
    return [slot, { src, alt: asset.alt || resourceSlots[slot].alt, mime: asset.mime, width: asset.width, height: asset.height }];
  }));
}

export function resourceCatalog(seed, assets, project, builtinState = []) {
  const slots = resolvedResources(project, assets);
  const states = new Map(builtinState.map(row => [row.src,row]));
  const builtins = seed.assets.map(asset => applyBuiltinState({ ...asset, ...(asset.slot ? slots[asset.slot] : {}) }, states.get(asset.src))).filter(Boolean);
  return [...builtins,...assets];
}

export async function resolveResources(db, project) {
  const keys = Object.values(validateResources(project.resources)).filter(src => src.startsWith('/media/')).map(src => src.slice(7));
  const rows = keys.length ? await db.prepare('SELECT object_key, mime, width, height, alt FROM cms_media WHERE object_key IN (SELECT value FROM json_each(?))').bind(JSON.stringify(keys)).all() : { results: [] };
  return resolvedResources(project, rows.results.map(row => ({ ...row, src: '/media/' + row.object_key })));
}
