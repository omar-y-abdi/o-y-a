import { parseFragment } from 'parse5';
import { HttpError } from './http.mjs';
import { validateCss, validateEditorData, validateHtml, validatePagePath, VALIDATION_POLICY } from './validation.mjs';
import { resolveSiteLink } from './routes.mjs';
import { referencedIds } from './id-references.mjs';
import { validateResources } from './resources.mjs';

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
    if (original && path !== original.path) fail('Befintliga adresser behålls så delade länkar fortsätter fungera.');
    const source = original ?? seed.pages.find(item => item.id === page.sourceId) ?? seed.blank;
    if (page.sourceId && page.sourceId !== 'blank' && !seed.pages.some(item => item.id === page.sourceId)) fail('Sidans källmall finns inte.');
    const contracts = source?.contracts ?? [];
    // An exact cache key avoids hash collisions and follows live contracts.
    // Only facts loaded from the trusted database may satisfy this comparison.
    const validationKey = JSON.stringify([VALIDATION_POLICY, contracts, publication]);
    const compatible = saved?.facts?.validationKey === validationKey;
    let html, facts;
    if (compatible && saved.sourceId === (source?.id ?? 'blank') && page.html === saved.html) {
      html = saved.html; facts = saved.facts;
    } else {
      const checked = validateHtml(page.html, contracts, true);
      html = checked.html;
      const nodes = checked.nodes;
      if (publication && (nodes.filter(node => node.tagName === 'main' && attribute(node, 'id') === 'main').length !== 1 || nodes.filter(node => node.tagName === 'h1').length !== 1)) fail(`${path} behöver ett huvudinnehåll och exakt en huvudrubrik.`);
      facts = { validationKey, ids: nodes.map(node => attribute(node, 'id')).filter(Boolean), links: nodes.filter(node => node.tagName === 'a').map(node => attribute(node, 'href')).filter(Boolean) };
      for (const node of nodes) if (publication && node.tagName === 'img' && attribute(node, 'alt') === undefined) fail('Varje bild behöver alternativtext; dekorativa bilder kan ha tom text.');
      for (const node of publication ? nodes : []) for (const item of node.attrs) for (const target of referencedIds(item.name, item.value)) {
        if (!facts.ids.includes(target) && target !== 'top') fail(`Referensen ${item.name} till ${target} på ${path} saknar mål.`);
      }
    }
    const style = compatible && page.css === saved.css ? saved.css : validateCss(page.css ?? '');
    const project = compatible && JSON.stringify(page.project) === JSON.stringify(saved.project) ? saved.project : page.project ? validateEditorData(page.project, contracts) : null;
    return { id, path, sourceId: source?.id ?? 'blank', name: text(page.name, 'Sidnamn', 80, publication ? 1 : 0), title: text(page.title, 'Sidtitel', 160, publication ? 1 : 0), description: text(page.description, 'Beskrivning', 320, publication ? 1 : 0), template: source?.template ?? 'custom', bodyClass: source?.bodyClass ?? 'page-custom', noindex: Boolean(original?.noindex), html, css: style, project, facts };
  });
  if (!paths.has('/')) fail('Startsidan måste finnas kvar.');
  const targets = new Map(pages.map(page => [page.path, new Set(page.facts.ids)]));
  for (const page of publication ? pages : []) for (const href of page.facts.links) {
    let link;
    try { link = resolveSiteLink(href, page.path, origins); } catch { fail('Länkens adress eller ankare är ogiltigt.'); }
    if (link.kind === 'external') continue;
    if (link.kind === 'resource') {
      if (link.path === '/login/' || link.path === '/login' || /^\/media\/[0-9a-f-]{36}\.(png|jpg|gif|webp|avif|woff2)$/.test(link.path) || seed.staticPaths?.includes(link.path)) continue;
      fail(`Länken ${href} på ${page.path} går till en resurs som saknas.`);
    }
    if (!targets.has(link.path)) fail(`Länken ${href} på ${page.path} går till en sida som saknas. Uppdatera länken innan du sparar.`);
    if (link.hash && link.hash !== 'top' && !targets.get(link.path).has(link.hash)) fail(`Länken ${href} på ${page.path} saknar ett mål.`);
  }
  const cards = input.cards;
  if (!Array.isArray(cards) || cards.length > 2000) fail('Vinstbiblioteket är ogiltigt eller för stort.');
  const cardIds = new Set();
  const normalizedCards = cards.map(card => {
    if (!card || typeof card.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(card.id) || cardIds.has(card.id) || !FLAVORS.includes(card.flavor)) fail('Varje vinst behöver en unik identitet och en giltig kategori.');
    cardIds.add(card.id);
    const result = { id: card.id, flavor: card.flavor, text: text(card.text, 'Vinsttext', 500, publication ? 1 : 0) };
    if (card.design) {
      const html = validateHtml(card.design.html);
      const roots = parseFragment(html).childNodes.filter(node => node.tagName || node.nodeName === '#text' && node.value.trim());
      if (roots.length !== 1 || !roots[0].tagName) fail('Vinstens design behöver en enda rotbehållare. Lägg nya delar inuti den.');
      if (elements(html).filter(node => attribute(node, 'data-card-text') !== undefined).length !== 1) fail('Vinstdesignen måste ha exakt ett textfält för vinsten.');
      result.design = { html, css: validateCss(card.design.css ?? ''), project: card.design.project ? validateEditorData(card.design.project) : null };
    }
    return result;
  });
  for (const flavor of FLAVORS) if (!normalizedCards.some(card => card.flavor === flavor)) fail('Varje kategori som maskinen visar behöver minst en vinst.');
  const runtime = {};
  if (!input.runtime || typeof input.runtime !== 'object' || Array.isArray(input.runtime) || Object.keys(input.runtime).length > 300) fail('Funktionstexterna är ogiltiga.');
  for (const [key, value] of Object.entries(input.runtime)) {
    if (!/^[a-z][a-zA-Z0-9_.-]{0,100}$/.test(key) || ['constructor', 'prototype'].includes(key)) fail('Okänd funktionstext.');
    if (Object.keys(seed.runtime ?? {}).length && !Object.hasOwn(seed.runtime, key)) fail('Okänd funktionstext.');
    text(value, 'Funktionstext', 1000, publication ? 1 : 0);
    runtime[key] = value;
    const variables = source => [...new Set([...source.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match => match[1]))].sort().join(',');
    if (publication && variables(value) !== variables(seed.runtime?.[key] ?? '')) fail(`Texten ${key} måste behålla samma dynamiska värden inom klamrar.`);
  }
  return { schemaVersion: 1, pages, cards: normalizedCards, runtime: { ...seed.runtime, ...runtime }, theme: validateTheme(input.theme), resources: validateResources(input.resources) };
}
