import { parseFragment, serialize, serializeOuter } from 'parse5';
import * as css from 'css-tree';
import { HttpError } from './http.mjs';
import { attribute, elements } from './html-tree.mjs';
import { preparePage, validateHtml, validateCss } from './validation.mjs';
import { mapFrameCss, frameStyleIds } from './frame-ids.mjs';

const fail = message => { throw new HttpError(422, message); };
const hasClass = (node, name) => (attribute(node, 'class') ?? '').split(/\s+/).includes(name);
export const legacySeed = seed => seed.legacy ?? seed;
const escapedAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function validateFrameIds(input, { contracts = [], originalContracts = [], frameKeys = {} } = {}) {
  if (input === undefined) return undefined;
  const id = value => typeof value === 'string' && value.length > 0 && value.length <= 20000 && !/[\u0000\r]/.test(value) && !/^cms-(?:preview|win)-/.test(value);
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype || Object.keys(input).length > 12000) fail('Sidramens äldre ID:n är ogiltiga.');
  for (const [key, pair] of Object.entries(input)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:>-]{0,119}$/.test(key) || !Array.isArray(pair) || pair.length !== 2 || !id(pair[0]) || pair[1] !== null && !id(pair[1])) fail('Sidramens äldre ID:n är ogiltiga.');
    const contract = contracts.find(item => item.key === key);
    if (contract && Object.hasOwn(contract.attrs, 'id')) {
      const original = originalContracts.find(item => item.key === frameKeys[key]);
      if (pair[1] !== (original ? original.attrs.id ?? null : contract.attrs.id)) fail('Ett skyddat ID i sidramen får inte ändras.');
    }
    if ([pair[0], pair[1]].some(value => ['top', 'main', 'mobile-menu', 'privacy-title'].includes(value)) && pair[1] !== pair[0]) fail('Ett skyddat ID i sidramen får inte ändras.');
    // Removed nodes and deliberate canonical ID edits no longer use the old
    // projection. Retaining its receipt allows Undo to restore it exactly.
  }
  return Object.fromEntries(Object.entries(input).map(([key, pair]) => [key, [...pair]]));
}

export function effectiveFrameIds(frame, page) {
  return frame.nodes.map(node => {
    const current = attribute(node, 'id'), key = attribute(node, 'data-cms-node');
    const pair = key && Object.hasOwn(page.frameIds ?? {}, key) ? page.frameIds[key] : null;
    return pair && current === pair[0] ? pair[1] : current;
  }).filter(Boolean);
}

function activeFrameIds(frame, page) {
  if (!page.frameIds) return [];
  return elements(parseFragment(frame.html, { scriptingEnabled: true, sourceCodeLocationInfo: true })).flatMap(node => {
    const key = attribute(node, 'data-cms-node'), pair = key && Object.hasOwn(page.frameIds, key) ? page.frameIds[key] : null;
    return pair && attribute(node, 'id') === pair[0] ? [{ node, key, from: pair[0], to: pair[1] }] : [];
  });
}

export function frameCss(frame, page) {
  if (!frame) return '';
  const ids = new Map(activeFrameIds(frame, page).map(item => [item.from, { id: item.to, key: item.key }]));
  try { return mapFrameCss(frame.css, ids); }
  catch (error) { fail(error.message); }
}

function projectedFrameHtml(frame, page) {
  const aliases = activeFrameIds(frame, page);
  if (!aliases.length) return frame.html;
  const styled = aliases.some(item => item.to === null) ? frameStyleIds(frame.css) : new Set();
  const edits = aliases.map(({ node, key, from, to }) => {
    const location = node.sourceCodeLocation.attrs.id;
    const replacement = to === null ? styled.has(from) ? `data-cms-frame-id="${key}"` : '' : `id="${escapedAttribute(to)}"`;
    return { start: location.startOffset, end: location.endOffset, replacement };
  });
  return edits.sort((a, b) => b.start - a.start).reduce((html, edit) => html.slice(0, edit.start) + edit.replacement + html.slice(edit.end), frame.html);
}

export function splitPage(html) {
  const tree = parseFragment(html, { scriptingEnabled: true });
  const mains = elements(tree).filter(node => node.tagName === 'main');
  if (mains.length !== 1 || mains[0].parentNode !== tree) fail('Sidramen behöver exakt ett huvudinnehåll på översta nivån.');
  const main = mains[0], page = serializeOuter(main);
  const slot = parseFragment('<main></main>').childNodes[0];
  slot.parentNode = tree;
  tree.childNodes[tree.childNodes.indexOf(main)] = slot;
  return { html: serialize(tree), page, tree };
}

export function composePage(frame, page, { year = new Date().getUTCFullYear() } = {}) {
  if (!frame) return page.html;
  let html = projectedFrameHtml(frame, page).replace(/(<span\b[^>]*>© )\d{4}( Omar Yusuf<\/span>)/, (_all, before, after) => before + year + after);
  html = html.replace(/ data-cms-node="([^"]*)"/g, (all, key) => {
    if (!Object.hasOwn(page.frameKeys ?? {}, key)) return all;
    // Null preserves a legacy keyless node; an unmapped new node keeps its key.
    const original = page.frameKeys[key];
    return original === null ? '' : ` data-cms-node="${original}"`;
  });
  // Navigation state is a projection of the route, never shared draft content.
  html = html.replace(/<nav\b[^>]*class="[^"]*\b(?:primary-nav|mobile-menu)\b[^"]*"[^>]*>[\s\S]*?<\/nav>/g, nav => nav.replace(/<a\b([^>]*\bhref="([^"]+)"[^>]*)>/g, (all, attrs, href) => {
    const primary = /class="[^"]*\bprimary-nav\b/.test(nav);
    if (!(primary && ['/om/', '/verkstad/'].includes(href) || /\bdata-skift-(?:mobile-)?link=/.test(attrs))) return all;
    attrs = attrs.replace(/\saria-current="[^"]*"/g, '');
    return `<a${attrs}${href === page.path ? ' aria-current="page"' : ''}>`;
  }));
  // Comments and attributes can contain the slot's spelling. Only the actual
  // parsed element identifies where page content belongs; preserve other bytes.
  const tree = parseFragment(html, { scriptingEnabled: true, sourceCodeLocationInfo: true });
  const mains = elements(tree).filter(node => node.tagName === 'main');
  const slot = mains[0], location = slot?.sourceCodeLocation;
  if (mains.length !== 1 || slot.parentNode !== tree || slot.attrs.length || slot.childNodes.length || !location?.endTag) fail('Sidramen behöver exakt en tom plats för huvudinnehållet.');
  return html.slice(0, location.startOffset) + page.html + html.slice(location.endOffset);
}

export function frameShape(html) {
  const tree = parseFragment(html, { scriptingEnabled: true });
  function clean(node) {
    if (node.attrs) {
      node.attrs = node.attrs.filter(item => item.name !== 'data-cms-node' && (item.name !== 'id' || ['mobile-menu', 'privacy-title'].includes(item.value)));
      for (const item of node.attrs) if (item.name === 'class') item.value = item.value.trim().replace(/\s+/g, ' ');
      node.attrs.sort((a, b) => a.name.localeCompare(b.name));
    }
    node.childNodes = (node.childNodes ?? []).filter(child => child.nodeName !== '#text' || child.value.trim());
    node.childNodes.forEach(clean);
  }
  clean(tree);
  return serialize(tree);
}

export function projectFrame(html, ownerDecisions = true) {
  const tree = parseFragment(html, { scriptingEnabled: true });
  for (const node of elements(tree)) {
    if (node.tagName === 'a' && (hasClass(node.parentNode, 'primary-nav') || hasClass(node, 'shift-link'))) {
      node.attrs = node.attrs.filter(item => item.name !== 'aria-current');
    }
    if (ownerDecisions && hasClass(node, 'footer-signoff')) {
      const text = node.childNodes.filter(child => child.nodeName === '#text');
      if (text.length !== 1) fail('Sidramens avslutning behöver kontrolleras innan den kan konverteras.');
      if (['Thanks for stopping by.', 'Tack för titten. På riktigt.'].includes(text[0].value.trim())) text[0].value = 'Thanks for stopping by. ';
    }
  }
  return serialize(tree);
}

function prepareScope(html, contracts, frame) {
  let tree = parseFragment(html, { scriptingEnabled: false });
  const originals = elements(tree).map(node => attribute(node, 'data-cms-node'));
  if (frame) {
    for (const node of elements(tree)) node.attrs = node.attrs.filter(item => item.name !== 'data-cms-node');
    const prepared = preparePage(`<!doctype html><html><head></head><body>${serialize(tree)}</body></html>`);
    tree = parseFragment(prepared.html, { scriptingEnabled: false });
    contracts = prepared.contracts;
  }
  const nodes = elements(tree), map = {}, names = new Map();
  nodes.forEach((node, index) => {
    if (frame && node.tagName === 'main') { node.attrs = []; return; }
    const attr = node.attrs.find(item => item.name === 'data-cms-node');
    if (!attr) return;
    const generated = attr.value, original = originals[index];
    if (frame) attr.value = `f-${/^(?:k|skift-nav)/.test(generated) ? generated : original ?? generated}`;
    names.set(generated, attr.value);
    if (/^(?:k|skift-nav)/.test(original)) map[original] = attr.value;
  });
  // Main keeps its full-template identities and exact trusted fallbacks. Frame
  // signatures count only frame nodes; publication restores each page's keys.
  const scoped = contracts.filter(contract => names.has(contract.key)).map(contract => ({ ...contract, key: names.get(contract.key), parent: names.get(contract.parent) ?? null, ...(contract.spanKey ? { spanKey: names.get(contract.spanKey) } : {}), ...(frame && contract.fallback ? { fallback: serializeOuter(nodes.find(node => attribute(node, 'data-cms-node') === names.get(contract.key))) } : {}) }));
  return { html: serialize(tree), map, contracts: scoped };
}

export function frameDefinitions(seed) {
  const fullPages = seed.pages, fullBlank = seed.blank;
  const definitions = fullPages.map(page => {
    const split = splitPage(page.html), body = prepareScope(split.page, page.contracts, false), frame = prepareScope(projectFrame(split.html), page.contracts, true);
    return { ...page, html: body.html, contracts: body.contracts, scopeKeys: { ...body.map, ...frame.map } };
  });
  const blankSplit = splitPage(fullBlank.html), blankBody = prepareScope(blankSplit.page, fullBlank.contracts, false), blankFrame = prepareScope(projectFrame(blankSplit.html), fullBlank.contracts, true);
  const home = fullPages.find(page => page.path === '/') ?? fullPages[0];
  const frame = prepareScope(projectFrame(splitPage(home.html).html), home.contracts, true);
  const sharedSlots = Object.fromEntries([...fullPages, fullBlank].map(page => [page.id, Object.fromEntries(elements(parseFragment(page.html)).filter(node => attribute(node, 'data-cms-shared')).map(node => [attribute(node, 'data-cms-shared'), attribute(node, 'data-cms-node')]))]));
  const legacy = { ...seed, pages: fullPages.map(({ html: _html, css: _css, project: _project, ...page }) => page), sharedSlots };
  const scopeKeys = Object.fromEntries([...definitions.map(page => [page.id, page.scopeKeys]), ['blank', { ...blankBody.map, ...blankFrame.map }]]);
  const skiftPage = definitions.find(page => page.template === 'skift');
  // Shared navigation IDs belong to the frame, not the code-owned game.
  const skiftIds = skiftPage ? elements(parseFragment(skiftPage.html)).map(node => attribute(node, 'id')).filter(Boolean) : [];
  return { ...seed, legacy, frame, scopeKeys, skiftPage, skiftIds, pages: definitions.map(({ html: _html, css: _css, project: _project, scopeKeys: _keys, ...page }) => page), blank: { ...fullBlank, html: blankBody.html, contracts: blankBody.contracts } };
}

export function validateFrameKeys(input, scopeKeys = {}) {
  if (input === undefined) return undefined;
  const key = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:>-]{0,119}$/.test(value);
  const expected = new Map(Object.entries(scopeKeys).map(([original, scoped]) => [scoped, original]));
  const valid = (from, to) => key(from) && from.startsWith('f-') && (/^f-(?:k|skift-nav)/.test(from) ? key(to) && to === expected.get(from) : to === null || key(to) && !/^(?:k|skift-nav)/.test(to));
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype || Object.keys(input).length > 12000 || Object.entries(input).some(([from, to]) => !valid(from, to))) fail('Sidramens äldre nodnycklar är ogiltiga.');
  const retained = Object.values(input).filter(value => value !== null);
  if (new Set(retained).size !== retained.length) fail('Sidramens äldre nodnycklar är ogiltiga.');
  return { ...input };
}

export function responsiveHomeCss(source, mainHtml) {
  source ??= '';
  const nodes = elements(parseFragment(mainHtml)), ids = new Set(nodes.map(node => attribute(node, 'id')).filter(Boolean));
  // At 320px, contact-band has 320px; human-art and hero-intro have
  // 320 - 2 * 18 = 284px inside section-wrap. Only these v185 boxes exceed it.
  // Keep definite widths elsewhere: percentage caps change shrink-to-fit layout.
  const overflowing = new Set(['iqcvri', 'i1wgyk', 'ibd1n']);
  const sticker = nodes.some(node => attribute(node, 'id') === 'i58p9l' && hasClass(node, 'human-sticker'));
  const flower = nodes.some(node => attribute(node, 'id') === 'iac4d6-2' && hasClass(node, 'human-flower') && attribute(node.parentNode, 'id') === 'i1wgyk' && hasClass(node.parentNode, 'human-art'));
  let tree;
  try { tree = css.parse(source, { positions: true, parseCustomProperty: true }); }
  catch { fail('Startsidan har ogiltig CSS. Mobilstorlekarna kunde inte konverteras.'); }
  const edits = [];
  tree.children.forEach(media => {
    if (media.type !== 'Atrule' || media.name !== 'media' || !media.block || css.generate(media.prelude).replace(/\s/g, '') !== '(max-width:760px)') return;
    const artwork = media.block.children.toArray().find(rule => rule.type === 'Rule' && css.generate(rule.prelude) === '#i1wgyk');
    const artworkWidth = artwork?.block.children.toArray().find(declaration => declaration.type === 'Declaration' && declaration.property === 'width')?.value;
    const originalArtworkWidth = artworkWidth?.type === 'Value' && artworkWidth.children.size === 1 && artworkWidth.children.first.type === 'Dimension' && artworkWidth.children.first.unit.toLowerCase() === 'px' ? css.generate(artworkWidth) : null;
    media.block.children.forEach(rule => {
      if (rule.type !== 'Rule') return;
      const declarations = new Map(), fixed = {}, duplicates = new Set();
      rule.block.children.forEach(declaration => {
        if (declaration.type !== 'Declaration') return;
        if (declarations.has(declaration.property)) duplicates.add(declaration.property);
        declarations.set(declaration.property, declaration);
      });
      for (const property of ['width', 'height']) {
        const value = declarations.get(property)?.value;
        if (value?.type === 'Value' && value.children.size === 1 && value.children.first.type === 'Dimension' && value.children.first.unit.toLowerCase() === 'px') fixed[property] = css.generate(value);
      }
      const label = rule.prelude ? css.generate(rule.prelude) : '(saknas)';
      const offset = sticker && label === '#i58p9l' && declarations.has('right') && css.generate(declarations.get('right').value) === '-20px';
      if (!Object.keys(fixed).length && !offset) return;
      const selectors = rule.prelude?.type === 'SelectorList' ? rule.prelude.children : null, selector = selectors?.first;
      if (selectors?.size !== 1 || selector.children.size !== 1 || selector.children.first.type !== 'IdSelector') fail(`Mobilstorleken ${label} på startsidan saknar ett entydigt element. Kontrollera regeln innan migreringen.`);
      const id = css.ident.decode(selector.children.first.name);
      if (!ids.has(id)) return;
      if (['width', 'height', 'min-height', ...(offset ? ['right'] : [])].some(property => duplicates.has(property))) fail(`Mobilstorleken ${label} på startsidan har dubbla deklarationer. Kontrollera regeln innan migreringen.`);
      // Public Home uses border-box (src/styles/base.css); heights stay fixed.
      const next = fixed.width && overflowing.has(id) ? { width: `min(${fixed.width},100%)` } : {};
      // Its centered parent supplies (100vw - 100%)/2 outside space. Rotation
      // of the 68.8px two-line sticker adds <5px, plus <2px shadow.
      if (offset) next.right = 'max(-20px,calc(7px - (100vw - 100%)/2))';
      // The 249px card stays centered when its 303px parent shrinks. Move the
      // right-anchored flower by half the lost width to retain their alignment.
      if (flower && originalArtworkWidth && id === 'iac4d6-2' && fixed.width === '82px' && fixed.height === '87px' && !declarations.has('right')) {
        edits.push({ start: rule.block.loc.end.offset - 1, end: rule.block.loc.end.offset - 1, text: `${source[rule.block.loc.end.offset - 2] === ';' ? '' : ';'}right:min(0px,calc((100% - ${originalArtworkWidth})/2))` });
      }
      for (const [property, value] of Object.entries(next)) {
        const declaration = declarations.get(property);
        // Token spans preserve surrounding whitespace and comments verbatim.
        const values = declaration.value.children;
        edits.push({ start: values?.first?.loc.start.offset ?? declaration.value.loc.start.offset, end: values?.last?.loc.end.offset ?? declaration.value.loc.end.offset, text: value });
      }
    });
  });
  return edits.sort((left, right) => right.start - left.start).reduce((result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end), source);
}

export function splitPageCss(source, frameHtml, pageHtml, path, ownerDecisions = true) {
  const inventory = html => {
    const nodes = elements(parseFragment(html));
    return { ids: new Set(nodes.map(node => attribute(node, 'id')).filter(Boolean)), classes: new Set(nodes.flatMap(node => (attribute(node, 'class') ?? '').split(/\s+/)).filter(Boolean)) };
  };
  const frame = inventory(frameHtml), page = inventory(pageHtml);
  frame.ids.add('top');
  const tree = css.parse(validateCss(source ?? ''), { parseCustomProperty: true });
  function partition(children, conditions = []) {
    const result = { frame: new css.List(), page: new css.List() };
    children.forEach(node => {
      if (node.type === 'Atrule' && node.block && ['media', 'supports', 'container', 'layer', 'starting-style'].includes(node.name)) {
        const divided = partition(node.block.children, [...conditions, node]);
        for (const owner of ['frame', 'page']) if (!divided[owner].isEmpty) result[owner].appendData({ ...node, block: { ...node.block, children: divided[owner] } });
        return;
      }
      if (node.type !== 'Rule' || node.prelude?.type !== 'SelectorList') fail(`En CSS-regel på ${path} saknar entydigt ägarskap. Kontrollera sidramen innan du fortsätter.`);
      const ids = [], classes = [];
      css.walk(node.prelude, item => {
        if (item.type === 'IdSelector') ids.push(css.ident.decode(item.name));
        if (item.type === 'ClassSelector') classes.push(css.ident.decode(item.name));
      });
      const owners = new Set();
      for (const id of ids) owners.add(frame.ids.has(id) ? 'frame' : page.ids.has(id) ? 'page' : 'unknown');
      if (!ids.length) for (const name of classes) {
        if (frame.classes.has(name) && !page.classes.has(name)) owners.add('frame');
        else if (page.classes.has(name) && !frame.classes.has(name)) owners.add('page');
      }
      if (owners.size !== 1 || owners.has('unknown')) fail(`CSS-regeln ${css.generate(node.prelude)} på ${path} saknar entydigt ägarskap. Kontrollera sidramen innan du fortsätter.`);
      const owner = [...owners][0];
      if (ownerDecisions && owner === 'frame' && path === '/' && ids.length === 1 && ['iua9', 'iyi2x6'].includes(ids[0]) && conditions.length === 1 && conditions[0].name === 'media' && css.generate(conditions[0].prelude).replace(/\s/g, '') === '(max-width:760px)') return;
      result[owner].appendData(node);
    });
    return result;
  }
  const result = partition(tree.children);
  return { frame: css.generate({ ...tree, children: result.frame }), page: css.generate({ ...tree, children: result.page }) };
}

export function validateFrame(input, seed) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['html', 'css'].includes(key))) fail('Sidramens format är ogiltigt.');
  const checked = validateHtml(input.html, seed.frame?.contracts ?? [], true);
  const tree = parseFragment(checked.html), mains = elements(tree).filter(node => node.tagName === 'main');
  if (mains.length !== 1 || mains[0].parentNode !== tree || mains[0].attrs.length || mains[0].childNodes.length) fail('Sidramen behöver exakt en tom plats för huvudinnehållet.');
  if (checked.nodes.some(node => attribute(node, 'data-cms-shared') && attribute(node, 'data-cms-shared') !== 'footer.tagline')) fail('Sidramen använder en okänd gemensam innehållsplats.');
  if (seed.frame && checked.nodes.filter(node => attribute(node, 'data-cms-shared') === 'footer.tagline').length !== 1) fail('Sidramens gemensamma text behöver finnas exakt en gång.');
  return { html: checked.html, css: validateCss(input.css ?? ''), nodes: checked.nodes.filter(node => node.tagName !== 'main') };
}
