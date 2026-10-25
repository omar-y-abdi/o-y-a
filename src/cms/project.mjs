import { parseFragment } from 'parse5';
import { HttpError } from './http.mjs';
import { validateCss, validateEditorData, validateHtml, validatePagePath, VALIDATION_POLICY } from './validation.mjs';
import { resolveSiteLink } from './routes.mjs';
import { referencedIds } from './id-references.mjs';
import { validateResources, resourceReferences } from './resources.mjs';
import { normalizeSharedContent, validateSharedInstances, normalizeFooterProject, normalizeSkiftProject } from './legacy-project.mjs';
import { validateFrame, validateFrameKeys, legacySeed } from './frame.mjs';
import { attribute, elements } from './html-tree.mjs';
import { SKIFT_PATH } from '../content/skift.mjs';

import { validateTheme } from './theme.mjs';
import { validateEmailSettings } from './email-validate.mjs';
export { fontFamilies, defaultTheme, themeCss } from './theme.mjs';
const FLAVORS = ['kind', 'joke', 'pause', 'roast'];
const CARD_STATES = new Set(['active', 'archived', 'trash']);

function fail(message) { throw new HttpError(422, message); }
function text(value, name, max = 200, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(`${name} saknas eller har ogiltig längd.`);
  return value.trim();
}

export const validateProject = (input, seed, baseline, options) => validateProjectWithReferences(input, seed, baseline, options).project;

// A16: a publication also returns the resource references it computed, so the
// save path walks the project once. References are null for a draft check.
export function validateProjectWithReferences(input, seed, baseline, { origins = [], publication = true } = {}) {
  if (!input || ![1, 2].includes(input.schemaVersion) || !Array.isArray(input.pages) || input.pages.length < 1 || input.pages.length > 64) fail('Projektets sidregister är ogiltigt.');
  const framed = input.schemaVersion === 2;
  if (framed && Object.hasOwn(input, 'sharedContent')) fail('Gemensamt innehåll hör till sidramen i det här projektformatet.');
  if (!framed) { seed = legacySeed(seed); input = normalizeSkiftProject(normalizeFooterProject(input, seed), seed); }
  if (framed && publication && input.frameConflicts?.length) fail('Välj vilken sidram som ska gälla innan du sparar.');
  const frame = framed ? validateFrame(input.frame, seed) : null;
  const frameIds = frame?.nodes.map(node => attribute(node, 'id')).filter(Boolean) ?? [];
  const frameLinks = frame?.nodes.filter(node => node.tagName === 'a').map(node => attribute(node, 'href')).filter(Boolean) ?? [];
  const frameReferences = frame?.nodes.flatMap(node => node.attrs.flatMap(item => referencedIds(item.name, item.value).map(target => [item.name, target]))) ?? [];
  const consentIds = new Set(frame?.nodes.filter(node => attribute(node, 'data-consent') !== undefined).map(node => attribute(node, 'id')).filter(Boolean));
  if (publication && frame?.nodes.some(node => node.tagName === 'h1' || node.tagName === 'img' && attribute(node, 'alt') === undefined)) fail('Sidramen behöver alternativtext och får inte innehålla sidans huvudrubrik.');
  if (input.pages.length > 64) fail('Projektets sidregister är för stort.');
  const ids = new Set();
  // The code-owned game keeps its address; a CMS page there would never serve.
  const paths = new Set([SKIFT_PATH]);
  const checkPage = page => {
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
    // A14: the game template is code-owned and never becomes a CMS page.
    if (source?.template === 'skift') fail('Spelets sida kan inte redigeras i studion.');
    const contracts = source?.contracts ?? [];
    // An exact cache key avoids hash collisions and follows live contracts.
    // Only facts loaded from the trusted database may satisfy this comparison.
    const validationKey = JSON.stringify([VALIDATION_POLICY, contracts, publication]);
    // Facts proven for a publication also satisfy a draft check, which asks for less.
    const compatible = baseline?.schemaVersion === input.schemaVersion && (saved?.facts?.validationKey === validationKey || !publication && saved?.facts?.validationKey === JSON.stringify([VALIDATION_POLICY, contracts, true]));
    let html, facts;
    if (compatible && saved.sourceId === (source?.id ?? 'blank') && page.html === saved.html) {
      html = saved.html; facts = saved.facts;
    } else {
      const checked = validateHtml(page.html, contracts, true);
      html = checked.html;
      const nodes = checked.nodes;
      if (publication && (nodes.filter(node => node.tagName === 'main' && attribute(node, 'id') === 'main').length !== 1 || nodes.filter(node => node.tagName === 'h1').length !== 1)) fail(`${path} behöver ett huvudinnehåll och exakt en huvudrubrik.`);
      if (framed) {
        const roots = parseFragment(html).childNodes.filter(node => node.tagName || node.nodeName === '#text' && node.value.trim());
        if (roots.length !== 1 || roots[0].tagName !== 'main') fail('Sidans innehåll behöver ligga i ett enda huvudinnehåll.');
      }
      facts = { validationKey, ids: nodes.map(node => attribute(node, 'id')).filter(Boolean), links: nodes.filter(node => node.tagName === 'a').map(node => attribute(node, 'href')).filter(Boolean), references: nodes.flatMap(node => node.attrs.flatMap(item => referencedIds(item.name, item.value).map(target => [item.name, target]))) };
      for (const node of nodes) if (publication && node.tagName === 'img' && attribute(node, 'alt') === undefined) fail('Varje bild behöver alternativtext; dekorativa bilder kan ha tom text.');
    }
    if (facts.ids.some(id => frameIds.includes(id))) fail(`Sidramen och ${path} använder samma ID.`);
    if (facts.references?.some(([name, target]) => name === 'for' && consentIds.has(target))) fail('Samtyckesknappens tillgängliga namn är låst.');
    if (publication) for (const [name, target] of [...(facts.references ?? []), ...frameReferences]) {
      if (![...facts.ids, ...frameIds].includes(target) && target !== 'top') fail(`Referensen ${name} till ${target} på ${path} saknar mål.`);
    }
    if (!framed) { const { references: _references, ...legacyFacts } = facts; facts = legacyFacts; }
    const style = compatible && page.css === saved.css ? saved.css : validateCss(page.css ?? '');
    // Import legacy metadata safely, but persist one authoritative representation.
    // Reconstructing from HTML/CSS removes the editor/public split-brain state.
    if (page.project !== undefined && page.project !== null) validateEditorData(page.project, contracts);
    const project = null;
    const frameKeys = framed ? validateFrameKeys(page.frameKeys, seed.scopeKeys?.[source?.id ?? 'blank']) : undefined;
    return { id, path, sourceId: source?.id ?? 'blank', name: text(page.name, 'Sidnamn', 80, publication ? 1 : 0), title: text(page.title, 'Sidtitel', 160, publication ? 1 : 0), description: text(page.description, 'Beskrivning', 320, publication ? 1 : 0), template: source?.template ?? 'custom', bodyClass: source?.bodyClass ?? 'page-custom', noindex: Boolean(original?.noindex), html, css: style, project, facts, ...(frameKeys === undefined ? {} : { frameKeys }), ...(framed || page.footerVersion === undefined ? {} : { footerVersion: page.footerVersion }) };
  };
  // A7: a rejected save names the page it came from.
  const pages = input.pages.map(page => {
    try { return checkPage(page); } catch (error) {
      const label = typeof page?.name === 'string' && page.name || typeof page?.path === 'string' && page.path;
      if (!(error instanceof HttpError) || !label || typeof page.path === 'string' && error.message.includes(page.path)) throw error;
      throw new HttpError(error.status, `${label}: ${error.message}`, error.details);
    }
  });
  if (!paths.has('/')) fail('Startsidan måste finnas kvar.');
  const targets = new Map([[SKIFT_PATH, new Set([...(seed.skiftIds ?? []), ...frameIds])], ...pages.map(page => [page.path, new Set([...page.facts.ids, ...frameIds])])]);
  // A3: every page with a broken link is reported in one 422, not one per save.
  const linkProblem = (page, href) => {
    let link;
    try { link = resolveSiteLink(href, page.path, origins); } catch { return `Länkens adress eller ankare på ${page.path} är ogiltigt.`; }
    if (link.kind === 'external') return null;
    if (link.kind === 'resource') {
      if (link.path === '/login/' || link.path === '/login' || /^\/media\/[0-9a-f-]{36}\.(png|jpg|gif|webp|avif|woff2)$/.test(link.path) || seed.staticPaths?.includes(link.path)) return null;
      return `Länken ${href} på ${page.path} går till en resurs som saknas.`;
    }
    if (!targets.has(link.path)) return `Länken ${href} på ${page.path} går till en sida som saknas. Uppdatera länken innan du sparar.`;
    if (link.hash && link.hash !== 'top' && !targets.get(link.path).has(link.hash)) return `Länken ${href} på ${page.path} saknar ett mål.`;
    return null;
  };
  const brokenLinks = [];
  for (const page of publication ? pages : []) {
    const problem = [...page.facts.links, ...frameLinks].map(href => linkProblem(page, href)).find(Boolean);
    if (problem) brokenLinks.push(problem);
  }
  if (brokenLinks.length) fail(brokenLinks.join(' '));
  const cards = input.cards;
  if (!Array.isArray(cards) || cards.length > 2000) fail('Vinstbiblioteket är ogiltigt eller för stort.');
  const cardIds = new Set();
  const normalizedCards = cards.map(card => {
    if (!card || typeof card.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(card.id) || cardIds.has(card.id) || !FLAVORS.includes(card.flavor)) fail('Varje vinst behöver en unik identitet och en giltig kategori.');
    cardIds.add(card.id);
    const state = card.state ?? 'active';
    if (!CARD_STATES.has(state)) fail('Vinstens status är ogiltig.');
    const result = { id: card.id, flavor: card.flavor, text: text(card.text, 'Vinsttext', 500, publication ? 1 : 0), state };
    if (card.design) {
      const html = validateHtml(card.design.html);
      const tree = parseFragment(html, { scriptingEnabled: true });
      const roots = tree.childNodes.filter(node => node.tagName || node.nodeName === '#text' && node.value.trim());
      if (roots.length !== 1 || !roots[0].tagName) fail('Vinstens design behöver en enda rotbehållare. Lägg nya delar inuti den.');
      const slots = elements(tree).filter(node => attribute(node, 'data-card-text') !== undefined);
      const containers = new Set('div span p h1 h2 h3 h4 h5 h6 section article blockquote pre strong em b i'.split(' '));
      if (slots.length !== 1 || !containers.has(slots[0].tagName) || slots[0].namespaceURI !== 'http://www.w3.org/1999/xhtml') fail('Vinstdesignen behöver exakt en textbehållare som kan visa vinstens text.');
      for (let node = slots[0]; node?.tagName; node = node.parentNode) {
        if (attribute(node, 'hidden') !== undefined || attribute(node, 'inert') !== undefined || attribute(node, 'aria-hidden') === 'true' || ['svg', 'select', 'textarea', 'dialog', 'details'].includes(node.tagName)) fail('Vinstens text får inte placeras i dolt eller inaktivt innehåll.');
      }
      if (card.design.project !== undefined && card.design.project !== null) validateEditorData(card.design.project);
      result.design = { html, css: validateCss(card.design.css ?? ''), project: null };
    }
    return result;
  });
  for (const flavor of FLAVORS) if (!normalizedCards.some(card => card.flavor === flavor && card.state === 'active')) fail('Varje kategori som maskinen visar behöver minst en vinst.');
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
  const sharedContent = framed ? null : normalizeSharedContent(input.sharedContent, seed);
  // A16: a published baseline already passed this check for every page whose HTML it
  // still holds, so only changed pages (all pages when sharedContent changed) are parsed.
  const storedHtml = new Map((baseline?.pages ?? []).map(page => [page.id, page.html]));
  const sharedUnchanged = JSON.stringify(baseline?.sharedContent) === JSON.stringify(sharedContent);
  if (!framed) validateSharedInstances(sharedUnchanged ? pages.filter(page => storedHtml.get(page.id) !== page.html) : pages, sharedContent, { publication, requiredEverywhere: Object.keys(seed.sharedContent ?? {}) });
  // The published head already passed this check, so unchanged mail settings are reused.
  const email = baseline && JSON.stringify(baseline.email) === JSON.stringify(input.email) ? baseline.email : validateEmailSettings(input.email);
  const result = { schemaVersion: input.schemaVersion, pages, cards: normalizedCards, runtime: { ...seed.runtime, ...runtime }, theme: validateTheme(input.theme), resources: validateResources(input.resources), ...(framed ? { frame: { html: frame.html, css: frame.css }, ...(!publication && input.frameConflicts?.length ? { frameConflicts: input.frameConflicts } : {}) } : { sharedContent, ...(input.frameVersion === 2 ? { frameVersion: 2 } : {}) }), ...(email === undefined ? {} : { email }) };
  const references = publication ? resourceReferences(result) : null;
  if (publication && seed.staticPaths) {
    const inventory = new Set(seed.staticPaths);
    for (const path of references.keys()) {
      if (/^\/(?:assets|social|mail|cms-public)\//.test(path) || ['/favicon.svg', '/apple-touch-icon.png'].includes(path)) {
        if (!inventory.has(path)) fail(`Resursen ${path} finns inte i webbplatsens byggda filer.`);
      }
    }
  }
  return { project: result, references };
}
