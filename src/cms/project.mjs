import { parseFragment } from 'parse5';
import { HttpError } from './http.mjs';
import { validateCss, validateEditorData, validateHtml, validatePagePath, VALIDATION_POLICY } from './validation.mjs';
import { resolveSiteLink } from './routes.mjs';
import { referencedIds } from './id-references.mjs';
import { validateResources, resourceReferences } from './resources.mjs';
import { cardState } from '../content/win-transfer.mjs';
import { normalizeSharedProject, sharedValues } from './shared.mjs';

import { validateTheme } from './theme.mjs';
export { fontFamilies, defaultTheme, themeCss } from './theme.mjs';
const FLAVORS = ['kind', 'joke', 'pause', 'roast'];

function fail(message) { throw new HttpError(422, message); }
function text(value, name, max = 200, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(`${name} saknas eller har ogiltig längd.`);
  return value.trim();
}
function elements(html) {
  const found = [];
  function visit(node) { if (node.tagName) found.push(node); for (const child of node.childNodes ?? []) visit(child); }
  visit(parseFragment(html, { scriptingEnabled: true }));
  return found;
}
const attribute = (node, name) => node.attrs.find(item => item.name === name)?.value;

export function validateProject(input, seed, baseline, { origins = [], publication = true } = {}) {
  input = normalizeSharedProject(input);
  if (!input || input.schemaVersion !== 1 || !Array.isArray(input.pages) || input.pages.length < 1 || input.pages.length > 64) fail('Projektets sidregister är ogiltigt.');
  const ids = new Set();
  const paths = new Set();
  const pages = input.pages.map(page => {
    if (!page || typeof page !== 'object' || Array.isArray(page)) fail('Varje sida måste vara ett giltigt sidobjekt.');
    const saved = baseline?.pages.find(item => item.id === page.id);
    const id = text(page.id, 'Sidans identitet', 80);
    if (!/^[a-zA-Z0-9-]+$/.test(id) || ids.has(id)) fail('Varje sida måste ha en unik identitet.');
    ids.add(id);
    const original = seed.pages.find(item => item.id === id);
    const path = original?.noindex && page.path === '/404.html' ? page.path : validatePagePath(page.path);
    if (paths.has(path)) fail(`Adressen ${path} används redan.`);
    paths.add(path);
    if (original && path !== original.path) fail('Befintliga sidors sökväg kan inte ändras i studion.');
    const name = text(page.name, 'Sidans namn', 80);
    const title = text(page.title, 'SEO-titeln', 120);
    const description = text(page.description, 'SEO-beskrivningen', 320);
    const sourceId = original ? undefined : seed.pages.some(item => item.id === page.sourceId) ? page.sourceId : 'blank';
    const template = original?.template ?? seed.pages.find(item => item.id === sourceId)?.template ?? seed.blank.template;
    const compatible = original && original.contract === VALIDATION_POLICY && original.sourceHash === page.sourceHash;
    const contracts = compatible ? original.contracts : [];
    const validation = compatible && saved?.html === page.html ? { html: saved.html, ids: referencedIds(saved.html) } : validateHtml(page.html, contracts, origins);
    const html = validation.html;
    const css = compatible && saved?.css === page.css ? saved.css : validateCss(page.css);
    if (page.project != null) validateEditorData(page.project, contracts);
    const project = null;
    return { id, sourceId, path, name, title, description, template, html, css, project, ...(original ? { sourceHash: original.sourceHash, contract: original.contract } : {}) };
  });
  const targets = new Map(pages.map(page => [page.path, referencedIds(page.html)]));
  for (const page of pages) {
    const combined = `${page.html}\n${page.css}`;
    for (const match of combined.matchAll(/(?:href|src|action)=["']([^"']+)["']|url\(\s*["']?([^)'"]+)/gi)) {
      const value = match[1] ?? match[2];
      const link = resolveSiteLink(value, page.path, origins);
      if (link.kind !== 'page') continue;
      if (!targets.has(link.path)) fail(`Länken ${value} på ${page.name} pekar på en sida som inte finns.`);
      if (link.fragment && !targets.get(link.path).has(link.fragment)) fail(`Länken ${value} på ${page.name} pekar på ett element som inte finns.`);
    }
  }
  const normalizedCards = (input.cards ?? []).map(card => {
    if (!card || typeof card !== 'object' || Array.isArray(card)) fail('En liten vinst är inte giltig.');
    const id = text(card.id, 'Vinstens identitet', 80);
    if (!/^[a-zA-Z0-9-]+$/.test(id)) fail('Vinstens identitet får bara innehålla bokstäver, siffror och bindestreck.');
    const flavor = text(card.flavor, 'Vinstens kategori', 20);
    if (!FLAVORS.includes(flavor)) fail('Vinstens kategori är ogiltig.');
    const state=cardState(card); if(!['active','archived','trash'].includes(state))fail('Vinstens tillstånd är ogiltigt.');
    const result = { id, flavor, text: text(card.text, 'Vinstens text', 500), ...(state==='active'?{}:{state}) };
    if (card.design) {
      const html = validateHtml(card.design.html ?? '').html;
      const slots = elements(html).filter(node => attribute(node, 'data-card-text') !== undefined);
      if (slots.length !== 1) fail('Vinstdesignen måste ha exakt ett textfält för vinsten.');
      const slot = slots[0];
      if (slot.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'blockquote', 'pre', 'strong', 'em', 'b', 'i'].includes(slot.tagName)) fail('Vinsttexten behöver en vanlig textbehållare, inte ett formulärfält eller SVG.');
      for (let node = slot; node?.tagName; node = node.parentNode) if (attribute(node, 'hidden') !== undefined || attribute(node, 'inert') !== undefined || attribute(node, 'aria-hidden') === 'true' || ['noscript', 'template', 'select', 'textarea', 'dialog'].includes(node.tagName)) fail('Vinsttexten får inte ligga i en dold eller inaktiv behållare.');
      if (card.design.project != null) validateEditorData(card.design.project);
      result.design = { html, css: validateCss(card.design.css ?? ''), project: null };
    }
    return result;
  });
  if (normalizedCards.length < 4 || normalizedCards.length > 2000 || new Set(normalizedCards.map(card => card.id)).size !== normalizedCards.length) fail('Vinstbanken måste ha unika identiteter och en rimlig storlek.');
  for (const flavor of FLAVORS) if (!normalizedCards.some(card => card.flavor === flavor && cardState(card)==='active')) fail(`Minst en aktiv vinst saknas för kategorin ${flavor}.`);
  const runtime = Object.fromEntries(Object.entries(seed.runtime).map(([key, original]) => {
    const candidate = text(input.runtime?.[key] ?? original, `Funktionstexten ${key}`, 400);
    const placeholders = value => [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match => match[1]).sort().join(',');
    if (placeholders(candidate) !== placeholders(original)) fail(`Funktionstexten ${key} måste behålla sina dynamiska värden.`);
    return [key, candidate];
  }));
  const result = { schemaVersion: 1, pages, cards: normalizedCards, runtime, theme: validateTheme(input.theme), resources: validateResources(input.resources), sharedContent: sharedValues({pages,input:input.sharedContent??{}}) };
  if (publication) for (const path of resourceReferences(result).keys()) {
    if (path.startsWith('/media/') || ['/login', '/login/'].includes(path)) continue;
    const link = resolveSiteLink(path, '/', origins);
    if (link.kind === 'page' && targets.has(link.path) || seed.staticPaths?.includes(path)) continue;
    fail(`Resursen ${path} saknas i webbplatsens byggda resursregister.`);
  }
  return result;
}
