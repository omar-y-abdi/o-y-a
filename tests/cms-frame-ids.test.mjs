import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment, serialize } from 'parse5';
import { baseInitial, baseSeed, baseValidate, basePublish } from './helpers/base-worker.mjs';
import { seed, legacyInitial } from '../.generated/cms-seed.mjs';
import { legacyFrameIdentities, footerId } from './helpers/frame-identities.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { toFrameProject, toLegacyProject } from '../src/cms/frame-converter.mjs';
import { composePage, frameCss, splitPage, validateFrame, validateFrameIds } from '../src/cms/frame.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { readSite } from '../src/cms/store.mjs';
import { projectChanges, applyProjectChanges, validateProjectChanges } from '../src/cms/project-changes.mjs';
import { Draft } from '../src/cms/client/draft.mjs';
import { draftBackup, readDraftBackup } from '../src/cms/client/recovery.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { mapFrameCss } from '../src/cms/frame-ids.mjs';
import { validateCss } from '../src/cms/validation.mjs';

for (const homeId of ['legacy-footer-home', 'start-button']) test(`F2: actual BASE-valid ${homeId} footer survives state, preview, unrelated Save and public rendering`, async () => {
  const candidate = legacyFrameIdentities(baseInitial), home = candidate.pages.find(page => page.id === 'home');
  home.html = home.html.replaceAll('legacy-footer-home', homeId);
  let frameCollision, mainCollision;
  if (homeId === 'start-button') {
    // Force the allocator past an occupied frame identity. Its next candidate
    // is also a main-only ID: projection must preserve both original targets.
    const frameNodes = elements(parseFragment(splitPage(home.html).html, { scriptingEnabled: true }));
    const index = frameNodes.findIndex(node => node.tagName === 'footer');
    frameCollision = `frame-${index}`; mainCollision = `frame-${index + 1}`;
    const tree = parseFragment(home.html, { scriptingEnabled: false }), nodes = elements(tree);
    nodes.find(node => node.tagName === 'header').attrs.push({ name: 'id', value: frameCollision });
    const main = nodes.find(node => node.tagName === 'main'), marker = parseFragment(`<div id="${mainCollision}" data-cms-node="u-canonical-collision"></div>`).childNodes[0];
    marker.parentNode = main; main.childNodes.push(marker); home.html = serialize(tree);
  }
  const original = baseValidate(candidate, baseSeed, baseInitial);
  const runtime = await cmsRuntime();
  try {
    await basePublish(runtime.db, { project: original, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
    const headers = { 'Cf-Access-Jwt-Assertion': await runtime.token(), Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' };
    const post = (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { method: 'POST', headers, body: JSON.stringify(body) });
    const response = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/state', { headers });
    assert.equal(response.status, 200, await response.clone().text());
    const state = await response.json();
    assert.equal(state.project.frameConflicts, undefined);
    for (const id of ['home', 'about']) {
      const page = state.project.pages.find(item => item.id === id);
      const expected = id === 'home' ? homeId : `legacy-footer-${id}`;
      assert.equal(footerId(composePage(state.project.frame, page)), expected);
      const preview = await post('preview', { project: state.project, pageId: id });
      assert.equal(preview.status, 200, await preview.clone().text());
      assert.equal(footerId((await preview.json()).html), expected);
    }
    state.project.pages[0].description = 'En orelaterad beskrivningsändring.';
    const save = await post('save', { project: state.project, baseVersion: state.version, requestId: crypto.randomUUID() });
    assert.equal(save.status, 200, await save.clone().text());
    for (const [path, id] of [['/', 'home'], ['/om/', 'about']]) {
      const html = await (await runtime.mf.dispatchFetch(runtime.url + path)).text();
      const expected = id === 'home' ? homeId : `legacy-footer-${id}`;
      assert.equal(footerId(html), expected);
      assert.ok(html.includes(`href="#${expected}"`));
      if (id === 'home' && mainCollision) for (const identity of [frameCollision, mainCollision]) assert.equal(elements(parseFragment(html)).filter(node => attribute(node, 'id') === identity).length, 1);
    }
    const game = await (await runtime.mf.dispatchFetch(runtime.url + '/play/skift/')).text();
    assert.equal(elements(parseFragment(game)).filter(node => attribute(node, 'id') === 'start-button').length, 1);
    assert.ok(!seed.skiftIds.includes(footerId(state.project.frame.html)));
    if (frameCollision) assert.notEqual(footerId(state.project.frame.html), frameCollision);
    assert.ok((await readSite(runtime.db)).project.pages.find(page => page.id === 'about').frameIds);
  } finally { await runtime.close(); }
});

test('F2: projected IDs remain atomic through delta, undo, backup and reverse conversion', () => {
  const legacy = legacyFrameIdentities(legacyInitial), project = validateProject(toFrameProject(legacy, seed), seed);
  const changed = structuredClone(project), about = changed.pages.find(page => page.id === 'about');
  about.description += ' Nytt.';
  const delta = projectChanges(project, changed);
  assert.deepEqual(validateProject(applyProjectChanges(project, validateProjectChanges(delta)), seed, project), changed);
  const draft = new Draft(project, 1); draft.change(changed); draft.undo();
  assert.deepEqual(draft.project.pages, project.pages);
  draft.redo(); assert.deepEqual(draft.project.pages, changed.pages);
  const prior = globalThis.location;
  try {
    globalThis.location = { origin: 'https://frame.test' };
    assert.deepEqual(readDraftBackup(draftBackup(changed, 1)).project.pages, changed.pages);
  } finally { if (prior === undefined) delete globalThis.location; else globalThis.location = prior; }
  const reverse = validateProject(toLegacyProject(changed, seed), seed);
  const again = validateProject(toFrameProject(reverse, seed), seed);
  for (const page of changed.pages) {
    const expected = footerId(composePage(changed.frame, page));
    assert.equal(footerId(reverse.pages.find(item => item.id === page.id).html), expected);
    assert.equal(footerId(composePage(again.frame, again.pages.find(item => item.id === page.id))), expected);
  }
});

test('F2: new shared ID styles reach every historical ID and idless page, including reverse migration', () => {
  const project = validateProject(toFrameProject(legacyFrameIdentities(legacyInitial), seed), seed);
  const canonical = footerId(project.frame.html);
  project.frame.css += `#${canonical}{color:#123456}`;
  const changed = validateProject(project, seed);
  for (const page of changed.pages) {
    const id = footerId(composePage(changed.frame, page)), css = frameCss(changed.frame, page);
    if (id) assert.ok(css.includes(`#${id}{color:#123456}`), page.path);
    else {
      const html = composePage(changed.frame, page);
      assert.ok(html.includes('data-cms-frame-id='));
      assert.ok(css.includes('[data-cms-frame-id='));
    }
  }
  const reverse = validateProject(toLegacyProject(changed, seed), seed);
  for (const page of reverse.pages) {
    assert.ok(!page.html.includes('data-cms-frame-id'));
    assert.ok(page.css.includes(`#${footerId(page.html)}{color:#123456}`));
  }
});

test('F2: a later page supplies a canonical identity without assigning an ID to the original idless page', () => {
  const legacy = legacyFrameIdentities(legacyInitial), home = legacy.pages.find(page => page.id === 'home');
  home.html = home.html.replace(' id="legacy-footer-home"', '').replace('href="#legacy-footer-home"', 'href="#top"');
  const project = validateProject(toFrameProject(legacy, seed), seed);
  assert.equal(footerId(project.frame.html), 'legacy-footer-about');
  assert.equal(footerId(composePage(project.frame, project.pages.find(page => page.id === 'home'))), null);
  assert.equal(footerId(composePage(project.frame, project.pages.find(page => page.id === 'about'))), 'legacy-footer-about');
});

test('F2: effective IDs reject duplicates, page collisions, protected overrides and stale link targets', () => {
  const project = validateProject(toFrameProject(legacyFrameIdentities(legacyInitial), seed), seed);
  const about = project.pages.find(page => page.id === 'about');
  const footer = elements(parseFragment(project.frame.html)).find(node => node.tagName === 'footer');
  const key = attribute(footer, 'data-cms-node');
  for (const target of ['main', 'mobile-menu', 'privacy-title']) {
    const changed = structuredClone(project);
    changed.pages.find(page => page.id === 'about').frameIds[key][1] = target;
    assert.throws(() => validateProject(changed, seed), /skyddat ID/);
  }
  const collision = structuredClone(project);
  collision.pages.find(page => page.id === 'about').html = about.html.replace('</main>', '<div id="legacy-footer-about"></div></main>');
  assert.throws(() => validateProject(collision, seed), /samma ID/);
  const renamed = structuredClone(project);
  renamed.frame.html = renamed.frame.html.replace(`id="${footerId(project.frame.html)}"`, 'id="explicit-new-footer"');
  assert.throws(() => validateProject(renamed, seed), /saknar ett mål/);
  assert.throws(() => validateFrame({ ...project.frame, html: project.frame.html.replace('<footer', '<footer data-cms-frame-id="forged"') }, seed), /Interna preview/);
  for (const protectedId of ['top', 'main', 'mobile-menu', 'privacy-title']) {
    for (const value of [null, 'replacement']) assert.throws(() => validateFrameIds({ 'f-protected': [protectedId, value] }), /skyddat ID/);
  }
  const privacy = elements(parseFragment(project.frame.html)).find(node => attribute(node, 'id') === 'privacy-title');
  assert.ok(privacy);
  const protectedDraft = structuredClone(project);
  protectedDraft.pages.find(page => page.id === 'about').frameIds[attribute(privacy, 'data-cms-node')] = ['privacy-title', null];
  assert.throws(() => validateProject(protectedDraft, seed, undefined, { publication: false }), /skyddat ID/);
  for (const value of ['a\u0000b', 'a\rb']) assert.throws(() => validateFrameIds({ 'f-footer': ['canonical', value] }), /ogiltiga/);
  assert.equal(composePage({ html: '<div data-cms-node="constructor"></div><main></main>', css: '' }, { html: '<main></main>', frameIds: {} }), '<div data-cms-node="constructor"></div><main></main>');
});

test('F2: CSS projection distinguishes IDs, colours, strings, exact attribute selectors and local URLs', () => {
  const mapped = mapFrameCss('#abc,[id="abc"]{color:#abc;clip-path:url(#abc);--literal:"#abc"}', new Map([['abc', { id: 'other-id' }]]));
  assert.equal(mapped, '#other-id,[id="other-id"]{color:#abc;clip-path:url(#other-id);--literal:"#abc"}');
});

test('F2: generated public selector markers cannot be authored in frame or page CSS', () => {
  for (const selector of ['[data-cms-frame-id]', '[DATA-CMS-FRAME-ID="f-footer"]', '[data-cms-\\66 rame-id]', '[*|data-cms-frame-id]', ':is([data-cms-frame-id])']) assert.throws(() => validateCss(`${selector}{color:red}`), /interna nodnycklar/);
  assert.doesNotThrow(() => validateCss('#data-cms-frame-id,.data-cms-frame-id,[data-theme]{color:red}'));
  const project = validateProject(toFrameProject(legacyFrameIdentities(legacyInitial), seed), seed);
  for (const target of ['frame', 'page']) {
    const changed = structuredClone(project), value = target === 'frame' ? changed.frame : changed.pages[0];
    value.css += '[data-cms-frame-id="f-footer"]{color:red}';
    assert.throws(() => validateProject(changed, seed, project), /interna nodnycklar/);
  }
  const old = structuredClone(project);
  old.pages[0].css += '[data-cms-frame-id="f-footer"]{color:red}';
  old.pages[0].facts.validationKey = old.pages[0].facts.validationKey.replace('cms-policy-7-frame-markers', 'cms-policy-6-generated-content');
  assert.throws(() => validateProject(structuredClone(old), seed, old), /interna nodnycklar/, 'A trusted cache from the prior policy cannot bypass the new selector boundary');
});

test('F2: ambiguous ID attribute selectors fail closed instead of drifting across page identities', () => {
  const ids = new Map([['legacy-footer', { id: 'canonical-footer' }]]);
  for (const selector of ['[id="LEGACY-FOOTER" i]', '[id^="legacy-"]', '[id$="legacy-footer"]', '[id*="gacy"]', '[id~="legacy-footer"]', '[id|="legacy"]', '[id^="canonical-"]', '[*|id="legacy-footer"]']) {
    assert.throws(() => mapFrameCss(`.site-footer${selector}{color:red}`, ids), /Använd ett exakt ID eller en gemensam klass/);
  }
  assert.equal(mapFrameCss('.site-footer[id^="other-"]{color:red}', ids), '.site-footer[id^="other-"]{color:red}');
  assert.equal(mapFrameCss('[id$="footer"]{color:red}', ids), '[id$="footer"]{color:red}');
  assert.equal(mapFrameCss('[id^="legacy-"]{color:red}', new Map([['legacy-home', { id: 'legacy-about' }]])), '[id^="legacy-"]{color:red}');
  assert.equal(mapFrameCss('[id="LEGACY" i]{color:red}', new Map([['legacy', { id: 'Legacy' }]])), '[id="LEGACY"i]{color:red}');
  assert.equal(mapFrameCss('[id="legacy-footer" s]{color:red}', ids), '[id="canonical-footer"s]{color:red}');
  assert.throws(() => mapFrameCss('.site-footer[id]{color:red}', new Map([['legacy-footer', { id: null, key: 'f-footer' }]])), /Använd ett exakt ID/);
  const project = validateProject(toFrameProject(legacyFrameIdentities(legacyInitial), seed), seed);
  project.frame.css += '.site-footer[id^="legacy-"]{color:red}';
  assert.throws(() => validateProject(project, seed), /Använd ett exakt ID/);
});
