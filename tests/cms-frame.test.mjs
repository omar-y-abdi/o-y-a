import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFragment, serialize } from 'parse5';
import { seed, initial, legacyInitial } from '../.generated/cms-seed.mjs';
import * as conversion from '../src/cms/frame-converter.mjs';
import * as frame from '../src/cms/frame.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { projectChanges, applyProjectChanges, validateProjectChanges } from '../src/cms/project-changes.mjs';
import { Draft } from '../src/cms/client/draft.mjs';
import { mergeProjects } from '../src/cms/client/merge.mjs';
import { draftBackup, readDraftBackup } from '../src/cms/client/recovery.mjs';
import { publicationChunks } from '../src/cms/store.mjs';
import { resourceReferences, replaceResource } from '../src/cms/resources.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { normalizeStoredProject as legacyProject } from '../src/cms/legacy-project.mjs';
import { preAgentFooterProject } from './helpers/pre-agent-footer.mjs';
import { validateCss } from '../src/cms/validation.mjs';

const v185 = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const footerCount = html => elements(parseFragment(html)).filter(node => node.tagName === 'footer').length;
const nodeKeys = html => elements(parseFragment(html, { scriptingEnabled: false })).map(node => [node.tagName, attribute(node, 'data-cms-node') ?? null]);

function publicIdentity(html, ownerDecisions = false) {
  const tree = parseFragment(html);
  function visit(node, inMain = false) {
    inMain ||= node.tagName === 'main';
    if (node.attrs) {
      const classes = (attribute(node, 'class') ?? '').split(/\s+/);
      if (!inMain && ownerDecisions && classes.includes('footer-signoff')) for (const child of node.childNodes) if (child.nodeName === '#text') child.value = 'Thanks for stopping by. ';
      node.attrs = node.attrs.filter(item => item.name !== 'data-cms-node' && (inMain || item.name !== 'data-cms-frame-id') && (inMain || item.name !== 'id' || ['mobile-menu', 'privacy-title'].includes(item.value)));
      for (const item of node.attrs) if (item.name === 'class') item.value = item.value.trim().replace(/\s+/g, ' ');
      node.attrs.sort((left, right) => left.name.localeCompare(right.name));
    }
    if (!inMain) node.childNodes = (node.childNodes ?? []).filter(child => child.nodeName !== '#text' || child.value.trim());
    (node.childNodes ?? []).forEach(child => visit(child, inMain));
  }
  visit(tree);
  return serialize(tree);
}

test('B8: all fifteen v185 public identities retain main and frame semantics except approved decisions', () => {
  const before = legacyProject(structuredClone(v185), seed.legacy);
  const after = validateProject(conversion.toFrameProject(v185, seed), seed);
  assert.equal(before.pages.length, 15);
  for (const page of before.pages) {
    const next = after.pages.find(item => item.id === page.id);
    assert.equal(publicIdentity(frame.composePage(after.frame, next)), publicIdentity(page.html, true), page.path);
  }
});

test('B8/C4: v185 keys survive editor composition and rollback, while publication omits them', async t => {
  const before = legacyProject(structuredClone(v185), seed.legacy);
  const after = validateProject(conversion.toFrameProject(v185, seed), seed);
  const rows = publicationChunks(after).flat();
  const reverse = validateProject(conversion.toLegacyProject(after, seed), seed);
  const again = validateProject(conversion.toFrameProject(reverse, seed), seed);
  assert.equal(before.pages.length, 15);
  for (const page of before.pages) {
    await t.test(page.path, () => {
      const next = after.pages.find(item => item.id === page.id);
      assert.deepEqual(nodeKeys(next.html), nodeKeys(frame.splitPage(page.html).page), `${page.path}: main`);
      assert.deepEqual(nodeKeys(frame.composePage(after.frame, next)), nodeKeys(page.html), `${page.path}: editor composition`);
      assert.deepEqual(nodeKeys(rows.find(row => row.path === page.path).html), nodeKeys(page.html).map(([tag]) => [tag, null]), `${page.path}: publication omits only editor keys`);
      assert.deepEqual(nodeKeys(reverse.pages.find(item => item.id === page.id).html), nodeKeys(page.html), `${page.path}: rollback`);
      assert.deepEqual(nodeKeys(frame.composePage(again.frame, again.pages.find(item => item.id === page.id))), nodeKeys(page.html), `${page.path}: second migration`);
    });
  }
  const home = after.pages.find(page => page.path === '/');
  assert.match(home.html, /<p class="noscript-note" data-cms-node="n123">/);
  for (const definition of seed.pages) {
    const original = seed.legacy.pages.find(item => item.id === definition.id);
    for (const contract of definition.contracts) {
      assert.deepEqual(contract, original.contracts.find(item => item.key === contract.key), `${definition.id}: ${contract.key}`);
    }
  }
});

test('B8: reverse conversion keeps keyless legacy SVG nodes without colliding with retained positional keys', () => {
  const project = validateProject(conversion.toFrameProject(v185, seed), seed);
  const reversed = conversion.toLegacyProject(project, seed);
  const home = reversed.pages.find(page => page.path === '/');
  const nodes = elements(parseFragment(home.html, { scriptingEnabled: false }));
  const keyed = key => nodes.filter(node => attribute(node, 'data-cms-node') === key);
  assert.equal(keyed('n297').length, 1, 'The key belongs only to the existing about-teaser div');
  assert.equal(attribute(keyed('n297')[0], 'id'), 'ib1sav');
  assert.equal(keyed('n298').length, 1, 'The key belongs only to the existing eyebrow paragraph');
  assert.equal(keyed('n298')[0].tagName, 'p');
  for (const id of ['iac4d6-2', 'ivigq7', 'idz8rd', 'i450ry', 'iwhqvl', 'iv9cfx']) {
    const node = nodes.find(node => attribute(node, 'id') === id);
    assert.ok(node, id);
    assert.equal(attribute(node, 'data-cms-node'), undefined, id);
  }
  assert.doesNotThrow(() => validateProject(reversed, seed));
});

test('B8: frame key projections survive page delta, backup and recovery; malformed aliases stop', () => {
  const base = validateProject(conversion.toFrameProject(v185, seed), seed);
  const index = base.pages.findIndex(page => page.path === '/projekt/furl/');
  assert.ok(Object.values(base.pages[index].frameKeys).includes(null), 'A legacy keyless frame node has an explicit absence projection');
  const edited = structuredClone(base);
  edited.pages[index].description = 'En uppdaterad beskrivning.';
  const changes = validateProjectChanges(projectChanges(base, edited));
  assert.deepEqual(changes.pages.upsert[0].frameKeys, base.pages[index].frameKeys);
  const recovered = validateProject(applyProjectChanges(base, changes), seed, base, { publication: false });
  assert.deepEqual(recovered.pages[index].frameKeys, base.pages[index].frameKeys);
  const location = globalThis.location;
  try {
    globalThis.location = { origin: 'https://frame.test' };
    assert.deepEqual(readDraftBackup(draftBackup(recovered, 185)).project.pages[index].frameKeys, base.pages[index].frameKeys);
  } finally { if (location === undefined) delete globalThis.location; else globalThis.location = location; }
  const contract = seed.frame.contracts[0].key;
  for (const aliases of [null, [], { 'f-n0': '" onload="bad' }, { 'f-n0': 'n0', 'f-n1': 'n0' }, { [contract]: 'kforged' }, { [contract]: null }, { 'u-new-node': 'n0' }]) {
    const forged = structuredClone(base);
    forged.pages[0].frameKeys = aliases;
    assert.throws(() => validateProject(forged, seed), /äldre nodnycklar är ogiltiga/);
  }
});

test('B8: publication distinguishes absent legacy keys from new frame identities', () => {
  const key = 'u-0123456789abcdef0123456789abcdef';
  const shared = { html: `<header><span data-cms-node="f-n0">Äldre text</span><br data-cms-node="f-n1"><p data-cms-node="${key}">Ny ramnod</p></header><main></main>`, css: '' };
  const page = { html: '<main></main>', path: '/', frameKeys: { 'f-n0': null, 'f-n1': null } };
  assert.deepEqual(frame.validateFrameKeys(page.frameKeys), page.frameKeys, 'Several legacy nodes may have no public key');
  assert.equal(frame.composePage(shared, page), `<header><span>Äldre text</span><br><p data-cms-node="${key}">Ny ramnod</p></header><main></main>`);
  assert.equal(shared.html.includes('data-cms-node="f-n1"'), true, 'Internal frame identity stays intact');
});

test('B8: v185 becomes one frame, complete mains and scoped contracts; only Q9 changes main CSS', () => {
  const before = JSON.stringify(v185);
  const project = validateProject(conversion.toFrameProject(v185, seed), seed);
  assert.equal(project.schemaVersion, 2);
  assert.equal(project.pages.length, 15);
  assert.equal(footerCount(project.frame.html), 1);
  assert.match(project.frame.html, /Thanks for stopping by\./);
  assert.doesNotMatch(project.frame.html, /Tack för titten/);
  assert.equal(project.sharedContent, undefined);
  assert.ok(seed.frame.contracts.length > 0);
  for (const contract of seed.frame.contracts) {
    assert.ok(contract.key.startsWith('f-'), contract.key);
    assert.ok(project.frame.html.includes(`data-cms-node="${contract.key}"`), contract.key);
  }
  for (const page of project.pages) {
    assert.equal(footerCount(page.html), 0, page.path);
    assert.equal(parseFragment(page.html).childNodes.filter(node => node.tagName).length, 1);
    assert.equal(parseFragment(page.html).childNodes.find(node => node.tagName).tagName, 'main');
    if (page.path !== '/') assert.equal(page.css, validateCss(v185.pages.find(old => old.id === page.id).css));
    const composed = frame.composePage(project.frame, page);
    assert.equal(footerCount(composed), 1);
    const keys = elements(parseFragment(composed)).map(node => attribute(node, 'data-cms-node')).filter(Boolean);
    assert.equal(keys.length, new Set(keys).size, page.path);
    const definition = seed.pages.find(item => item.id === page.id || item.id === page.sourceId) ?? seed.blank;
    for (const contract of definition.contracts) assert.ok(page.html.includes(`data-cms-node="${contract.key}"`), `${page.path}: ${contract.key}`);
  }
  assert.doesNotMatch(project.pages[0].css, /#(?:iua9|iyi2x6)\{/);
  assert.match(project.pages[0].css, /#main\{/);
  assert.equal([...project.pages[0].css.matchAll(/(?:^|[;{])width:[0-9.]+px(?=[;}])/g)].length, 17, 'Q9 retains the 17 widths that do not cause overflow');
  assert.equal([...project.pages[0].css.matchAll(/(?:^|[;{])height:[0-9.]+px(?=[;}])/g)].length, 26, 'Q9 preserves all 26 main heights');
  assert.match(project.pages[0].css, /#iqcvri\{width:min\(388px,100%\)\}/);
  assert.match(project.pages[0].css, /#iqupj3\{width:99px;height:52px\}/);
  assert.match(project.pages[0].css, /#im2i7y\{width:191px;height:177px\}/);
  assert.equal(JSON.stringify(v185), before);
});

test('B8: public composition preserves every main tree through forward and reverse conversion', () => {
  const project = conversion.toFrameProject(v185, seed);
  const reverse = conversion.toLegacyProject(project, seed);
  assert.equal(reverse.schemaVersion, 1);
  const roundtrip = conversion.toFrameProject(reverse, seed);
  for (const page of project.pages) {
    const again = roundtrip.pages.find(item => item.id === page.id);
    assert.equal(publicIdentity(frame.composePage(roundtrip.frame, again)), publicIdentity(frame.composePage(project.frame, page)), page.path);
    assert.equal(again.css, page.css);
  }
  const rows = publicationChunks(validateProject(project, seed)).flat();
  for (const page of project.pages) assert.equal(footerCount(rows.find(row => row.path === page.path).html), 1);
  assert.equal(rows.filter(row => row.path === '@frame').length, 1);
});

test('B8: reverse and forward retain later frame text and responsive styles without reapplying the original decisions', () => {
  const project = validateProject(conversion.toFrameProject(v185, seed), seed);
  project.frame.html = project.frame.html.replace('Thanks for stopping by.', 'Tack för titten. På riktigt.');
  assert.match(project.frame.html, /id="iua9"/);
  project.frame.css = '@media (max-width:760px){#iua9{height:450px}}';
  const reverse = validateProject(conversion.toLegacyProject(project, seed), seed);
  assert.equal(reverse.frameVersion, 2);
  const again = validateProject(conversion.toFrameProject(reverse, seed), seed);
  assert.match(again.frame.html, /Tack för titten\. På riktigt\./);
  assert.equal(again.frame.css, validateCss(project.frame.css));
  assert.equal(again.frameVersion, undefined);
  const ambiguous = structuredClone(project);
  ambiguous.frame.css = 'p{color:red}';
  assert.throws(() => conversion.toLegacyProject(ambiguous, seed), /entydigt ägarskap/);
});

test('B8: divergent legacy frames require an owner choice and input remains untouched', () => {
  const legacy = structuredClone(v185);
  legacy.pages[1].html = legacy.pages[1].html.replace('</footer>', '<p>Ägarens andra ram.</p></footer>');
  const before = JSON.stringify(legacy);
  const project = conversion.toFrameProject(legacy, seed);
  assert.ok(project.frameConflicts.length > 0);
  assert.throws(() => validateProject(project, seed), /Välj.*sidram/);
  const chosen = conversion.chooseFrame(project, project.frameConflicts[0].options.at(-1).value);
  assert.equal(chosen.frameConflicts, undefined);
  assert.doesNotThrow(() => validateProject(chosen, seed));
  assert.equal(JSON.stringify(legacy), before);
});

test('B8: retained pre-footer state converts in both directions with explicit frame choice', async () => {
  const legacy = await preAgentFooterProject(), untouched = JSON.stringify(legacy);
  let converted = conversion.toFrameProject(legacy, seed);
  assert.equal(converted.schemaVersion, 2);
  assert.ok(converted.pages.some(page => page.path === '/developers/'));
  assert.ok(converted.frameConflicts.some(conflict => conflict.key === 'frame'));
  const option = converted.frameConflicts.find(conflict => conflict.key === 'frame').options.find(option => option.value.css.includes('282px'));
  assert.ok(option, 'The owner footer size remains an explicit choice');
  converted = conversion.chooseFrame(converted, option.value, 'frame');
  assert.match(converted.frame.html, /href="\/developers\/"/);
  assert.match(converted.frame.html, /data-skift-mobile-link/);
  assert.match(converted.frame.css, /#owner-footer\{height:282px\}/);
  const checked = validateProject(converted, seed);
  const reverse = validateProject(conversion.toLegacyProject(checked, seed), seed);
  const again = validateProject(conversion.toFrameProject(reverse, seed), seed);
  let materialized = 0;
  for (const page of checked.pages) {
    const after = again.pages.find(item => item.id === page.id), restored = reverse.pages.find(item => item.id === page.id);
    const beforeHtml = frame.composePage(checked.frame, page), afterHtml = frame.composePage(again.frame, after);
    assert.equal(publicIdentity(afterHtml), publicIdentity(beforeHtml), page.path);
    const footer = html => elements(parseFragment(html)).find(node => node.tagName === 'footer');
    const beforeFooter = footer(beforeHtml), afterFooter = footer(afterHtml), marker = attribute(beforeFooter, 'data-cms-frame-id');
    const beforeId = attribute(beforeFooter, 'id'), restoredId = attribute(footer(restored.html), 'id'), afterId = attribute(afterFooter, 'id');
    const selector = marker ? `[data-cms-frame-id="${marker}"]` : `#${beforeId}`;
    assert.ok(frame.frameCss(checked.frame, page).includes(`${selector}{height:282px}`), `${page.path}: chosen style`);
    assert.ok(restored.css.includes(`#${restoredId}{height:282px}`), `${page.path}: reverse style`);
    assert.ok(frame.frameCss(again.frame, after).includes(`#${afterId}{height:282px}`), `${page.path}: reimported style`);
    if (marker) {
      materialized++;
      assert.equal(beforeId, undefined);
      assert.match(restoredId, /^frame-legacy-\d+$/);
      assert.equal(afterId, restoredId);
      assert.equal(attribute(afterFooter, 'data-cms-frame-id'), undefined);
    } else assert.equal(afterId, beforeId);
  }
  assert.ok(materialized > 0, 'The chosen shared style reaches originally idless footers through reverse migration');
  assert.equal(JSON.stringify(legacy), untouched);
});

test('B8: pre-sharedContent variants remain choices, ambiguous CSS and unknown formats stop', () => {
  const legacy = structuredClone(legacyInitial);
  delete legacy.sharedContent;
  legacy.pages[1].html = legacy.pages[1].html.replace('Lite hjärna. Lite hjärta.', 'En annan äldre text.');
  const converted = conversion.toFrameProject(legacy, seed);
  assert.equal(converted.frameConflicts[0].key, 'footer.tagline');
  assert.equal(converted.frameConflicts[0].options.length, 2);
  const chosen = conversion.chooseFrame(converted, converted.frameConflicts[0].options[1].value);
  assert.doesNotThrow(() => validateProject(chosen, seed));
  assert.doesNotThrow(() => validateProject(applyProjectChanges(converted, projectChanges(converted, chosen)), seed));
  for (const source of ['p{color:red}', '#frame,#main{color:red}', '#missing{color:red}']) assert.throws(() => frame.splitPageCss(source, '<header id="frame"></header><main></main><footer><p>Ram</p></footer>', '<main id="main"><p>Sida</p></main>', '/'), /entydigt ägarskap/);
  assert.throws(() => conversion.toFrameProject({ ...legacy, schemaVersion: 3 }, seed), /kan inte konverteras/);
});

test('B8: client conversion never re-derives forged consent identities', () => {
  const forged = structuredClone(legacyInitial);
  forged.pages[0].html = forged.pages[0].html.replaceAll(/data-cms-node="(?:k[^"]*|skift-nav[^"]*)"/g, 'data-cms-node="unknown-key"');
  assert.throws(() => conversion.normalizeClientProject(forged, seed), /dubblerats|koppling|funktion/);
  const scoped = structuredClone(initial);
  scoped.sharedContent = { 'footer.tagline': 'Skulle annars ignoreras.' };
  assert.throws(() => validateProject(scoped, seed), /hör till sidramen/);
});

test('B8/A1b: frame contracts survive ordinary template insertion and reject consent identity swaps', () => {
  const full = { ...seed.legacy, pages: legacyInitial.pages.map(page => ({ ...page, contracts: seed.legacy.pages.find(item => item.id === page.id)?.contracts ?? seed.legacy.blank.contracts })) };
  const drifted = structuredClone(full);
  drifted.pages[0].html = drifted.pages[0].html.replace('<footer', '<div>Ny mallrad</div><footer');
  const before = frame.frameDefinitions(full), after = frame.frameDefinitions(drifted);
  assert.deepEqual(after.frame.contracts.map(contract => contract.key), before.frame.contracts.map(contract => contract.key));
  for (const mode of ['values', 'keys', 'both', 'accessible-name']) {
    const project = structuredClone(initial), tree = parseFragment(project.frame.html);
    const [deny, allow] = elements(tree).filter(node => attribute(node, 'data-consent') !== undefined);
    const swap = name => { const left = deny.attrs.find(item => item.name === name), right = allow.attrs.find(item => item.name === name); [left.value, right.value] = [right.value, left.value]; };
    if (['values', 'both'].includes(mode)) swap('data-consent');
    if (['keys', 'both'].includes(mode)) swap('data-cms-node');
    if (mode === 'accessible-name') allow.attrs.push({ name: 'aria-label', value: 'Bara nödvändiga' });
    project.frame.html = serialize(tree);
    for (const publication of [false, true]) assert.throws(() => validateProject(project, seed, initial, { publication }), /funktionsattribut|text är låst|namn är låst/, `${mode}, publication=${publication}`);
  }
});

test('B8: frame delta, undo, redo, backup and merge keep HTML/CSS atomic', () => {
  const base = structuredClone(initial), mine = structuredClone(base), theirs = structuredClone(base);
  mine.frame.html = mine.frame.html.replace('Thanks for stopping by.', 'En ny avslutning.');
  mine.frame.css = '.brand-mark{color:#123456}';
  theirs.frame.css = '.brand-mark{color:#654321}';
  const changes = projectChanges(base, mine);
  assert.deepEqual(Object.keys(changes), ['frame']);
  assert.deepEqual(validateProjectChanges(changes), changes);
  assert.deepEqual(applyProjectChanges(base, changes).frame, mine.frame);
  const draft = new Draft(base, 185);
  draft.change(mine, 'frame');
  assert.equal(draft.undo(), true);
  assert.deepEqual(draft.project.frame, base.frame);
  assert.equal(draft.redo(), true);
  assert.deepEqual(draft.project.frame, mine.frame);
  assert.deepEqual(draft.beginSave().changes, changes);
  const location = globalThis.location;
  try {
    globalThis.location = { origin: 'https://frame.test' };
    assert.deepEqual(readDraftBackup(draftBackup(mine, 185)).project.frame, mine.frame);
  } finally { if (location === undefined) delete globalThis.location; else globalThis.location = location; }
  const merged = mergeProjects(base, mine, theirs);
  assert.deepEqual(merged.conflicts, ['frame']);
  assert.deepEqual(merged.project.frame, mine.frame);
  assert.throws(() => validateProjectChanges({ frame: { html: '', css: '', extra: true } }));
});

test('B8: a new page carries only its main and receives the current shared frame', () => {
  const project = structuredClone(initial);
  project.frame.html = project.frame.html.replace('Thanks for stopping by.', 'Välkommen tillbaka.');
  project.pages.push({ ...seed.blank, id: 'frame-new', sourceId: 'blank', path: '/frame-new/', name: 'Ny sida' });
  const validated = validateProject(project, seed);
  const added = validated.pages.at(-1);
  assert.equal(footerCount(added.html), 0);
  assert.match(frame.composePage(validated.frame, added), /Välkommen tillbaka\./);
});

test('B8: frame-only media is counted once and resource replacement reaches its HTML and CSS', () => {
  const previous = { id: crypto.randomUUID(), mime: 'image/png' }, next = { id: crypto.randomUUID(), mime: 'image/png' };
  previous.src = `/media/${previous.id}.png`; next.src = `/media/${next.id}.png`;
  const project = structuredClone(initial);
  project.frame.html = project.frame.html.replace('</footer>', `<img src="${previous.src}" alt="Ramens bild"></footer>`);
  project.frame.css = `.site-footer{background-image:url(${previous.src})}`;
  assert.equal(resourceReferences(project).get(previous.src), 2);
  const replaced = replaceResource(project, previous, next).project;
  assert.equal(resourceReferences(replaced).has(previous.src), false);
  assert.equal(resourceReferences(replaced).get(next.src), 2);
  assert.match(replaced.frame.html, new RegExp(next.src));
  assert.ok(replaced.frame.css.includes(next.src));
  assert.deepEqual(replaced.pages, project.pages);
});

test('B8: frame Save is 200, recovery retains it and stale concurrent Save is 409', async () => {
  const runtime = await cmsRuntime();
  try {
    const cookie = `CF_Authorization=${await runtime.token()}`;
    const request = (path, body) => runtime.mf.dispatchFetch(`${runtime.url}/admin/api/${path}`, body === undefined
      ? { headers: { Cookie: cookie } }
      : { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify(body) });
    const state = await (await request('state')).json();
    const first = await request('save', { project: state.project, baseVersion: 0, requestId: crypto.randomUUID() });
    assert.equal(first.status, 200, await first.clone().text());
    const baseVersion = (await first.json()).version;
    const changed = structuredClone(state.project);
    changed.frame.html = changed.frame.html.replace('Thanks for stopping by.', 'En gemensam rad.');
    const key = 'u-0123456789abcdef0123456789abcdef';
    changed.frame.html = changed.frame.html.replace('</footer>', `<p data-cms-node="${key}">Ny ramnod</p></footer>`);
    const changes = projectChanges(state.project, changed);
    const save = await request('save', { changes, baseVersion, requestId: crypto.randomUUID() });
    assert.equal(save.status, 200, await save.clone().text());
    const recovered = await request('recover', { project: changed });
    assert.equal(recovered.status, 200, await recovered.clone().text());
    assert.deepEqual((await recovered.json()).project.frame, changed.frame);
    const stale = await request('save', { changes, baseVersion, requestId: crypto.randomUUID() });
    assert.equal(stale.status, 409);
    for (const path of ['/', '/om/']) {
      const response = await runtime.mf.dispatchFetch(runtime.url + path);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /En gemensam rad\./);
      assert.ok(html.includes('<p>Ny ramnod</p>'), `${path}: added frame content survives publication`);
      assert.ok(!html.includes(`data-cms-node="${key}"`), `${path}: editor identity stays out of public markup`);
    }
    const head = await (await request('state')).json();
    assert.deepEqual(head.project.frame, changed.frame);
    const old = structuredClone(legacyInitial);
    old.pages[0].description = 'Ett äldre osäkert sparförsök.';
    const pending = { project: old, baseVersion: head.version, requestId: crypto.randomUUID() };
    const recovery = await request('recover', { project: old, pendingSave: pending });
    assert.equal(recovery.status, 200, await recovery.clone().text());
    const verified = await recovery.json();
    assert.equal(verified.pendingProject.schemaVersion, 2);
    assert.deepEqual(verified.pendingSave, pending, 'Raw replay intent stays byte-compatible');
    const draft = new Draft(head.project, head.version);
    draft.change(verified.project);
    draft.restorePending(verified.pendingSave, verified.pendingProject);
    assert.deepEqual(draft.beginSave(), pending);
    const oldSave = await request('save', draft.beginSave());
    assert.equal(oldSave.status, 200, await oldSave.clone().text());
    const saved = await oldSave.json();
    const replay = await request('save', pending);
    assert.equal(replay.status, 200, await replay.clone().text());
    assert.equal((await replay.json()).replayed, true);
    draft.acknowledge(draft.pendingSnapshot, saved.version, draft.pendingSave);
    assert.equal(draft.saved.schemaVersion, 2);
    assert.equal(draft.pendingSave, null);
  } finally { await runtime.close(); }
});
