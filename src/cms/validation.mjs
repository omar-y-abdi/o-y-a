import { parse, parseFragment, serialize, serializeOuter } from 'parse5';
import * as css from 'css-tree';
import { HttpError } from './http.mjs';
import { ID_REFERENCES } from './id-references.mjs';
import { validateEditorShape } from './editor-schema.mjs';
import { attribute as attr, walk as traverse } from './html-tree.mjs';
import { RESERVED } from './routes.mjs';

export const VALIDATION_POLICY = 'cms-policy-3-canonical-editor-widget-preview';

const TAGS = new Set('a abbr address article aside b bdi bdo blockquote br button caption cite code col colgroup dd del details dfn dialog div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i img input kbd label legend li main mark nav noscript ol optgroup option output p picture pre progress q rp rt ruby s samp section select small source span strike strong sub summary sup table tbody td textarea tfoot th thead time tr u ul var svg g path circle rect ellipse line polyline polygon defs lineargradient radialgradient stop clippath title desc mask pattern use'.split(' '));
const ATTRS = new Set('id class title role lang dir tabindex hidden inert href target rel src srcset sizes alt width height loading decoding type name value checked disabled required readonly multiple min max step minlength maxlength autocomplete placeholder for rows cols method action novalidate open aria-label aria-labelledby aria-describedby aria-controls aria-live aria-atomic aria-hidden aria-expanded aria-pressed aria-current aria-disabled aria-invalid aria-busy scope colspan rowspan start reversed datetime cite download style viewbox fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset stroke-opacity d points x y x1 x2 y1 y2 cx cy r rx ry transform opacity offset stop-color stop-opacity gradientunits gradienttransform clip-path clip-rule preserveaspectratio xmlns'.split(' '));
const STATE_ATTRIBUTES = ['type', 'name', 'required', 'hidden', 'disabled', 'readonly', 'multiple', 'checked', 'method', 'action', 'novalidate', 'min', 'max', 'step', 'minlength', 'maxlength'];
const FIXED = new Set(['id', 'type', 'name', 'required', 'hidden', 'disabled', 'role', 'autocomplete', 'method', 'action', 'novalidate', 'readonly', 'multiple', ...STATE_ATTRIBUTES, ...ID_REFERENCES]);
const CONTROLS = new Set(['input', 'textarea', 'select', 'button', 'fieldset', 'output', 'option', 'optgroup']);
const semanticValue = node => ['option', 'button'].includes(node.tagName) || node.tagName === 'input' && ['radio', 'checkbox', 'hidden'].includes(attr(node, 'type'));
const AT_RULES = new Set(['media', 'supports', 'keyframes', '-webkit-keyframes', 'font-face', 'layer', 'container', 'starting-style']);
const LOCKED_CLASSES = new Set(['fika-board', 'repeat-line', 'folded-line', 'eye', 'memory-card', 'memory-front', 'memory-back']);

function invalid(message) { throw new HttpError(422, message); }
function plainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }

export function validatePagePath(value) {
  if (typeof value !== 'string' || value.length > 160 || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/.test(value)) invalid('Sidans adress måste vara en ledig, vanlig sökväg, till exempel /projekt/nytt/.');
  if (RESERVED.has(value.split('/')[1])) invalid(`Adressen ${value} är reserverad.`);
  return value;
}

export function resourceUrl(value) {
  if (typeof value !== 'string' || value.length > 512 || /[\u0000-\u0020\\]/.test(value)) return false;
  if (/^#[a-zA-Z][\w:.-]*$/.test(value)) return true;
  if (value === '/favicon.svg' || value === '/apple-touch-icon.png') return true;
  return /^\/(?:assets|social|mail)\/[a-zA-Z0-9._/-]+\.(?:png|jpe?g|gif|webp|avif|svg|woff2)$/.test(value) && !value.includes('..')
    || /^\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|jpg|gif|webp|avif|woff2)$/.test(value);
}

function linkUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return false;
  if (value.startsWith('#')) return /^#[\w:.-]*$/.test(value);
  if (value.startsWith('/') && !value.startsWith('//')) return !value.includes('..') && !/^\/(?:admin|api|cdn-cgi)(?:[/?#]|$)/.test(value);
  try {
    const url = new URL(value);
    return ['https:', 'mailto:', 'tel:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function validateCss(source, context = 'stylesheet') {
  if (typeof source !== 'string' || source.length > 200000) invalid('Stilmallen är för stor eller saknas.');
  let tree;
  try { tree = css.parse(source, { context, parseCustomProperty: true }); }
  catch { invalid('Stilmallen innehåller ogiltig CSS.'); }
  css.walk(tree, function (node) {
    if (node.type === 'Raw') invalid('Stilmallen innehåller CSS som inte kan kontrolleras säkert.');
    if (node.type === 'AttributeSelector' && /(^|\|)data-cms-node$/i.test(css.ident.decode(node.name.name))) invalid('Stilmallen får inte använda studions interna nodnycklar.');
    if (node.type === 'Atrule' && !AT_RULES.has(css.ident.decode(node.name).toLowerCase())) invalid('Den här CSS-regeln är inte tillåten.');
    if (node.type === 'Url' && !resourceUrl(node.value)) invalid('CSS får bara hämta webbplatsens egna bilder och typsnitt.');
    if (node.type === 'Function') {
      const name = css.ident.decode(node.name).toLowerCase();
      if (['expression', 'url'].includes(name)) invalid('Exekverbar eller osäker CSS är inte tillåten.');
      if (name === 'image-set' || name === '-webkit-image-set') {
        node.children.forEach(child => { if (child.type === 'String' && !resourceUrl(child.value)) invalid('Bildreferensen är inte tillåten.'); });
      }
    }
    if (node.type === 'Declaration' && ['behavior', '-moz-binding'].includes(css.ident.decode(node.property).toLowerCase())) invalid('Exekverbar CSS är inte tillåten.');
  });
  return css.generate(tree);
}

function checkAttribute(name, value, tag) {
  const lower = name.toLowerCase();
  if (typeof value !== 'string' || value.length > 20000 || /^on/i.test(lower) || /^data-gjs/i.test(lower)
    || (!ATTRS.has(lower) && !/^aria-[a-z-]+$/.test(lower) && !/^data-[a-z0-9-]+$/.test(lower))) invalid(`Attributet ${name} är inte tillåtet.`);
  if (lower === 'id' && /^cms-(?:preview|win)-/.test(value) || lower.startsWith('data-cms-') && !['data-cms-node','data-cms-shared'].includes(lower)) invalid('Interna preview-markörer får inte användas i redigerbart innehåll.');
  if (lower === 'xmlns' && value !== 'http://www.w3.org/2000/svg') invalid('Okänd SVG-namnrymd.');
  if (lower === 'style') validateCss(value, 'declarationList');
  if (['src', 'poster'].includes(lower) && !resourceUrl(value)) invalid('Bilder måste väljas från webbplatsens egna resurser.');
  if (lower === 'srcset') {
    for (const part of value.split(',')) {
      const [url, descriptor, ...rest] = part.trim().split(/\s+/);
      if (!resourceUrl(url) || rest.length || descriptor && !/^\d+(?:\.\d+)?[wx]$/.test(descriptor)) invalid('Bildens storleksreferenser är ogiltiga.');
    }
  }
  if (lower === 'href' && (tag === 'use' ? !/^#[a-zA-Z][\w:.-]*$/.test(value) : !linkUrl(value))) invalid('Länken har en otillåten adress.');
  if (lower === 'action' && value !== '/api/contact') invalid('Formuläret får inte byta mottagare.');
  if (lower === 'method' && value.toLowerCase() !== 'post') invalid('Formuläret måste använda POST.');
  if (lower === 'target' && !['_self', '_blank'].includes(value)) invalid('Länkens mål är ogiltigt.');
  if (lower === 'data-cms-shared' && !/^[a-z][a-z0-9.-]{0,79}$/.test(value)) invalid('Gemensamt innehåll har en ogiltig nyckel.');
  if (lower === 'tabindex' && !['0', '-1'].includes(value)) invalid('Tabbordningen måste följa dokumentet.');
  if (['fill', 'stroke', 'clip-path'].includes(lower)) validateCss(`${lower}:${value}`, 'declarationList');
}

// Contract identity comes from what a functional element is, never from where it sits.
const IDENTITY_ATTRS = new Set(['name', 'type', 'for', 'action', 'method']);
const SPECIAL_IDS = ['main', 'mobile-menu', 'share-url'];
const classesOf = node => (attr(node, 'class') ?? '').split(/\s+/);
const isFunctionalAttr = a => a.name.startsWith('data-') && !a.name.startsWith('data-cms-');
function isSpecial(node) {
  return node.attrs.some(isFunctionalAttr) || node.tagName === 'form' || node.tagName === 'label' || CONTROLS.has(node.tagName) || node.tagName === 'noscript' || SPECIAL_IDS.includes(attr(node, 'id')) || classesOf(node).some(name => LOCKED_CLASSES.has(name));
}
function signature(node) {
  const parts = node.attrs.filter(a => isFunctionalAttr(a) || IDENTITY_ATTRS.has(a.name) || a.name === 'value' && semanticValue(node)).map(a => `${a.name}=${a.value}`);
  if (SPECIAL_IDS.includes(attr(node, 'id'))) parts.push(`id=${attr(node, 'id')}`);
  for (const name of classesOf(node)) if (LOCKED_CLASSES.has(name)) parts.push(`.${name}`);
  return `${node.tagName}|${parts.sort().join('&')}`;
}
function fnv(text) { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h = Math.imul(h ^ text.charCodeAt(i), 0x01000193); } return (h >>> 0).toString(36); }
// Document-order list of [element, key]. Equal signatures get an ordinal suffix.
function identityKeys(elements) {
  const seen = new Map();
  return elements.filter(isSpecial).flatMap(node => {
    if (attr(node, 'data-skift-link') !== undefined) return [[node, 'skift-nav']];
    if (attr(node, 'data-skift-mobile-link') !== undefined) return [[node, 'skift-nav-mobile']];
    const base = 'k' + fnv(signature(node)), count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const key = count ? `${base}-${count}` : base, pairs = [[node, key]];
    // The print control writes its live label into the first span: that span is part of the contract.
    const label = attr(node, 'data-print') !== undefined && node.childNodes?.find(child => child.tagName === 'span');
    if (label) pairs.push([label, `${key}>span`]);
    return pairs;
  });
}
function setKey(node, key) {
  const existing = node.attrs.find(a => a.name === 'data-cms-node');
  if (existing) existing.value = key; else node.attrs.push({ name: 'data-cms-node', value: key });
}
const textOf = node => { let text = ''; traverse(node, child => { if (child.nodeName === '#text') text += child.value; }); return text.replace(/\s+/g, ' ').trim(); };

export function preparePage(document) {
  const tree = parse(document, { scriptingEnabled: false });
  let body;
  traverse(tree, node => { if (node.tagName === 'body') body = node; });
  if (!body) invalid('Dokumentets body saknas.');
  const contracts = [];
  let index = 0;
  const all = []; traverse(body, node => { if (node.tagName && node !== body) all.push(node); });
  const identity = new Map(identityKeys(all));
  traverse(body, node => {
    if (!node.tagName || node === body) return;
    const skiftDesktop = attr(node, 'data-skift-link') !== undefined;
    const skiftMobile = attr(node, 'data-skift-mobile-link') !== undefined;
    // Other nodes keep their positional keys: only contract nodes get signature keys.
    const positional = skiftDesktop ? 'skift-nav' : skiftMobile ? 'skift-nav-mobile' : `n${index++}`;
    const key = identity.get(node) ?? positional;
    node.attrs.push({ name: 'data-cms-node', value: key });
    const functional = node.attrs.some(a => a.name.startsWith('data-') && !a.name.startsWith('data-cms-'));
    const classes = (attr(node, 'class') ?? '').split(/\s+/);
    const inForm = node.tagName === 'form' || node.tagName === 'label' || CONTROLS.has(node.tagName);
    const special = functional || inForm || node.tagName === 'noscript' || ['main', 'mobile-menu', 'share-url'].includes(attr(node, 'id')) || classes.some(name => LOCKED_CLASSES.has(name));
    if (special) {
      contracts.push({ key, tag: node.tagName, attrs: Object.fromEntries(node.attrs.filter(a => FIXED.has(a.name) || a.name === 'value' && semanticValue(node) || a.name.startsWith('data-') && !a.name.startsWith('data-cms-')).map(a => [a.name, a.value])), classes: classes.filter(Boolean) });
      // The print control reads its first span as the live button label.
      if (functional && attr(node, 'data-print') !== undefined) contracts.at(-1).span = true;
      // Owner decision 2026-10-24: a consent button's label is part of its contract.
      if (attr(node, 'data-consent') !== undefined) contracts.at(-1).text = textOf(node);
      if (skiftDesktop || skiftMobile) Object.assign(contracts.at(-1), { containerClass: skiftDesktop ? 'primary-nav' : 'mobile-menu', attrs: { ...contracts.at(-1).attrs, href: '/play/skift/' } });
    }
  });
  // Fallback HTML belongs to the trusted source template, not authored markup.
  // Record it after every descendant has received its stable editor key.
  traverse(body, node => {
    if (node.tagName === 'noscript') contracts.find(item => item.key === attr(node, 'data-cms-node')).fallback = serializeOuter(node);
  });
  const keys = new Set(contracts.map(item => item.key));
  const contractsByKey = new Map(contracts.map(item => [item.key, item]));
  traverse(body, node => {
    const contract = contractsByKey.get(attr(node, 'data-cms-node'));
    if (!contract) return;
    if (contract.span) contract.spanKey = attr(node.childNodes?.find(child => child.tagName === 'span'), 'data-cms-node');
    let parent = node.parentNode;
    while (parent && !keys.has(attr(parent, 'data-cms-node'))) parent = parent.parentNode;
    contract.parent = parent ? attr(parent, 'data-cms-node') : null;
  });
  return { html: serialize(body), contracts, bodyClass: attr(body, 'class') ?? '' };
}

function canonicalFallback(source) {
  const tree = parseFragment(source, { scriptingEnabled: false });
  // Editor keys are identity bookkeeping, not part of the trusted fallback markup.
  traverse(tree, node => { if (node.attrs) node.attrs = node.attrs.filter(a => a.name !== 'data-cms-node').sort((a, b) => a.name.localeCompare(b.name)); });
  return serialize(tree);
}

export function validateHtml(source, contracts = [], includeNodes = false, fallbacks = contracts) {
  if (typeof source !== 'string' || source.length > 500000) invalid('Sidans innehåll är för stort eller saknas.');
  const tree = parseFragment(source, { scriptingEnabled: true });
  const nodes = new Map();
  const ids = new Set();
  const protectedKeys = new Set(contracts.map(contract => contract.key));
  const elements = [];
  traverse(tree, node => {
    if (!node.tagName) return;
    elements.push(node);
    const tag = node.tagName.toLowerCase();
    if (!TAGS.has(tag)) invalid(`Elementet ${node.tagName} får inte läggas in i webbplatsen.`);
    if (tag === 'noscript') {
      const fallback = fallbacks.find(item => item.fallback && item.key === attr(node, 'data-cms-node'));
      if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !fallback || canonicalFallback(serializeOuter(node)) !== canonicalFallback(fallback.fallback)) invalid('JavaScript-fallback får bara komma från den skyddade källmallen.');
      // GrapesJS reorders attributes. Accept an identical inert source tree,
      // then emit the trusted bytes, never the browser-sensitive candidate.
      const trusted = parseFragment(fallback.fallback, { scriptingEnabled: true }).childNodes[0];
      node.attrs = trusted.attrs; node.childNodes = trusted.childNodes;
      node.childNodes.forEach(child => { child.parentNode = node; });
    }
    for (const item of node.attrs) checkAttribute(item.prefix ? `${item.prefix}:${item.name}` : item.name, item.value, tag);
    const id = attr(node, 'id');
    if (id) {
      if (ids.has(id)) invalid(`ID:t ${id} används flera gånger.`);
      ids.add(id);
    }
    const key = attr(node, 'data-cms-node');
    const contract = contracts.find(item => item.key === key);
    if (contracts.length && node.attrs.some(item => item.name.startsWith('data-') && !item.name.startsWith('data-cms-') && !Object.hasOwn(contract?.attrs ?? {}, item.name))) invalid('Ett element får inte ta över en annan funktions kopplingar.');
    if (contracts.length && !contract && (node.tagName === 'form' || CONTROLS.has(node.tagName))) invalid('Nya namngivna formulärkontroller får inte ändra en skyddad funktion.');
    if (contracts.length && node.attrs.some(item => item.name.startsWith('data-') && !item.name.startsWith('data-cms-')) && !protectedKeys.has(key)) invalid('Funktionskopplingar får inte dupliceras eller skapas som vanlig layout.');
    if (key) {
      if (nodes.has(key)) invalid('Ett skyddat element har dubblerats.');
      nodes.set(key, node);
    }
    if (tag === 'a' && attr(node, 'target') === '_blank') {
      const rel = node.attrs.find(item => item.name === 'rel');
      const value = [...new Set([...(rel?.value ?? '').split(/\s+/).filter(Boolean), 'noopener', 'noreferrer'])].join(' ');
      if (rel) rel.value = value; else node.attrs.push({ name: 'rel', value });
    }
  });
  for (const contract of contracts) {
    const node = nodes.get(contract.key);
    if (!node || node.tagName !== contract.tag) invalid('Ett element som behövs för navigation, formulär eller lekar saknas.');
    if (contract.containerClass && !(attr(node.parentNode, 'class') ?? '').split(/\s+/).includes(contract.containerClass)) invalid('Spellänken måste ligga kvar i toppmenyn.');
    if (Object.hasOwn(contract, 'parent')) {
      let parent = node.parentNode;
      while (parent && !protectedKeys.has(attr(parent, 'data-cms-node'))) parent = parent.parentNode;
      if ((parent ? attr(parent, 'data-cms-node') : null) !== contract.parent) invalid('Ett funktionselement har flyttats utanför sin funktion. Flytta hela gruppen i stället.');
    }
    for (const [name, value] of Object.entries(contract.attrs)) if (attr(node, name) !== value) invalid('Ett skyddat funktionsattribut har ändrats.');
    if (contract.text !== undefined && textOf(node) !== contract.text) invalid('Samtyckesknappens text är låst.');
    if (CONTROLS.has(node.tagName) || node.tagName === 'form') {
      for (const name of STATE_ATTRIBUTES) if (attr(node, name) !== contract.attrs[name]) invalid('Ett skyddat formulärfält har fått ändrat tillstånd.');
      if (semanticValue(node) && attr(node, 'value') !== contract.attrs.value) invalid('Ett funktionsvärde får inte ändras.');
    }
    if (contract.spanKey && attr(node.childNodes?.find(child => child.tagName === 'span'), 'data-cms-node') !== contract.spanKey) invalid('Maskinknappens första textfält måste behålla sin identitet.');
    const classes = (attr(node, 'class') ?? '').split(/\s+/);
    if (contract.classes.some(name => !classes.includes(name))) invalid('En klass som behövs för sidans funktion har tagits bort.');
    if (contract.span && !node.childNodes?.some(child => child.tagName === 'span')) invalid('Maskinknappens textfält måste finnas kvar.');
  }
  const html = serialize(tree);
  if (serialize(parseFragment(html, { scriptingEnabled: true })) !== html) invalid('HTML ändrar betydelse när webbläsaren läser den.');
  return includeNodes ? { html, nodes: elements } : html;
}

export function validateEditorData(data, contracts = []) {
  validateEditorShape(data);
  if (!plainObject(data) || JSON.stringify(data).length > 1000000) invalid('Editorprojektet är ogiltigt eller för stort.');
  let count = 0;
  function inspect(value, depth = 0, key = '') {
    if (depth > 80 || ++count > 100000) invalid('Editorprojektet är för komplext.');
    if (Array.isArray(value)) { value.forEach(item => inspect(item, depth + 1, key)); return; }
    if (!value || typeof value !== 'object') return;
    if (!plainObject(value)) invalid('Editorprojektet innehåller en ogiltig datatyp.');
    if (value.tagName?.toLowerCase() === 'noscript') {
      const fallback = contracts.find(item => item.key === value.attributes?.['data-cms-node'] && item.fallback);
      if (!fallback) invalid('Editorprojektets fallback saknar en skyddad källmall.');
      const node = parseFragment(fallback.fallback, { scriptingEnabled: true }).childNodes[0];
      value.attributes = Object.fromEntries(node.attrs.map(item => [item.name, item.value]));
      value.components = [];
      value.content = node.childNodes.map(child => child.value ?? '').join('');
    }
    // Editor controls are reconstructed by trusted code. Never persist custom
    // toolbar markup or trait configuration supplied inside a document.
    delete value.toolbar;
    delete value.traits;
    for (const name of ['label', 'icon', 'custom-name', ...(key === 'selectors' ? [] : ['name'])]) {
      if (typeof value[name] === 'string' && value[name].includes('<')) invalid('Editorns etiketter får inte innehålla HTML.');
    }
    for (const name of Object.keys(value)) if (['__proto__', 'prototype', 'constructor', 'script', 'script-export', 'scripts', 'script-props'].includes(name)) invalid('Exekverbar kod eller osäkra projektfält är inte tillåtna.');
    const documentShell = key === 'docEl' && value.tagName === 'html';
    if (value.tagName && !TAGS.has(String(value.tagName).toLowerCase()) && value.tagName !== 'body' && !documentShell) invalid('Otillåten elementtyp i editorprojektet.');
    if (['script', 'iframe', 'video', 'map', 'object', 'embed'].includes(value.type)) invalid('Aktiva inbäddningar är inte tillåtna.');
    if (value.src !== undefined && !resourceUrl(value.src)) invalid('Editorbilden måste komma från mediebiblioteket.');
    if (value.href !== undefined && !linkUrl(value.href)) invalid('Editorlänken har en otillåten adress.');
    if (value.atRuleType && !AT_RULES.has(css.ident.decode(String(value.atRuleType)).toLowerCase())) invalid('Projektet innehåller en otillåten CSS-regel.');
    if (value.mediaText) validateCss(`@media ${value.mediaText}{.cms-check{color:inherit}}`);
    if (value.selectors) {
      if (!Array.isArray(value.selectors)) invalid('Stilens väljare är ogiltiga.');
      for (const selector of value.selectors) {
        const name = typeof selector === 'string' ? selector : selector?.name;
        if (typeof name !== 'string' || name.length > 1000 || /[<\u0000-\u001f]/.test(name)) invalid('Stilens väljare är ogiltiga.');
        try { css.parse(name, { context: 'selectorList' }); } catch { invalid('Stilens väljare är ogiltiga.'); }
      }
    }
    if (value.selectorsAdd) {
      if (typeof value.selectorsAdd !== 'string' || /[<\u0000-\u001f]/.test(value.selectorsAdd)) invalid('Stilens extra väljare är ogiltig.');
      try { css.parse(value.selectorsAdd, { context: 'selectorList' }); } catch { invalid('Stilens extra väljare är ogiltig.'); }
    }
    if (value.dataSources?.length) invalid('Externa datakällor får inte läggas till i editorn.');
    // GrapesJS text nodes hold literal text and escape it on export. Treating
    // them as HTML would double-encode ampersands on each save/reload cycle.
    if (typeof value.content === 'string' && value.type !== 'textnode') value.content = validateHtml(value.content, [], false, contracts);
    if (typeof value.components === 'string') value.components = validateHtml(value.components, [], false, contracts);
    if (plainObject(value.attributes)) for (const [name, attribute] of Object.entries(value.attributes)) checkAttribute(name, String(attribute), String(value.tagName ?? 'div').toLowerCase());
    if (plainObject(value.style)) {
      for (const [name, rule] of Object.entries(value.style)) {
        if (!/^--?[a-zA-Z][\w-]*$|^[a-zA-Z][\w-]*$/.test(name) || typeof rule !== 'string' && typeof rule !== 'number') invalid('Ogiltig stilegenskap i editorprojektet.');
        validateCss(`${name}:${rule}`, 'declarationList');
      }
    }
    for (const [name, child] of Object.entries(value)) if (name !== 'attributes' && name !== 'style') inspect(child, depth + 1, name);
  }
  inspect(data);
  return data;
}

// Signature keys start with "k"; older builds wrote only positional "n" keys.
export const hasSignatureKeys = html => html.includes('data-cms-node="k');
function keyed(source) {
  const tree = parseFragment(source, { scriptingEnabled: true }), all = [];
  traverse(tree, node => { if (node.tagName) all.push(node); });
  return { tree, pairs: identityKeys(all) };
}

// Re-key trusted stored HTML from older builds on read, so the editor finds
// every contract under the key the server validates. Never for incoming HTML.
export function rekeyHtml(source) {
  if (typeof source !== 'string' || hasSignatureKeys(source)) return source;
  const { tree, pairs } = keyed(source);
  for (const [node, key] of pairs) setKey(node, key);
  return serialize(tree);
}

const own = (table, key) => typeof key === 'string' && table && Object.hasOwn(table, key) ? table[key] : undefined;
// Tabs, drafts and backups from builds up to e5592bc carry positional keys.
// Rename them through that build's frozen map (src/cms/legacy-keys.json),
// chosen by template lineage as validateProject chooses contracts (page id,
// then sourceId, then blank). Never from the draft's attributes or a revision.
export function migrateKeys(project, legacy) {
  if (!Array.isArray(project?.pages) || !legacy) return project;
  const pages = project.pages.map(page => {
    if (typeof page?.html !== 'string' || hasSignatureKeys(page.html)) return page;
    const map = own(legacy.pages, page.id) ?? own(legacy.pages, page.sourceId) ?? legacy.blank;
    const tree = parseFragment(page.html, { scriptingEnabled: true });
    let renamed = false;
    traverse(tree, node => {
      const old = node.tagName && attr(node, 'data-cms-node'), key = own(map, old);
      if (key && key !== old) { setKey(node, key); renamed = true; }
    });
    return renamed ? { ...page, html: serialize(tree) } : page;
  });
  return pages.every((page, index) => page === project.pages[index]) ? project : { ...project, pages };
}
