import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initial, legacyInitial, seed } from '../.generated/cms-seed.mjs';
import { nodeWorker, nodeCms } from './helpers/cms-node.mjs';
import { previewPayload } from '../src/cms/preview-project.mjs';
import { previewBaseline } from '../src/cms/preview-store.mjs';
import { validateProjectWithReferences } from '../src/cms/project.mjs';
import { normalizeClientProject } from '../src/cms/frame-converter.mjs';
import { legacyFrameIdentities } from './helpers/frame-identities.mjs';
import { resourceReferences } from '../src/cms/resources.mjs';
import { DEFAULT_EMAIL } from '../src/server/email-render.mjs';

const worker = await nodeWorker();
const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const origin = 'https://omaryusuf.se';
const html = async response => { assert.equal(response.status, 200, await response.clone().text()); return (await response.json()).html; };
const embedded = source => JSON.parse(source.match(/<script type="application\/json" id="cms-preview-data">([\s\S]*?)<\/script>/)[1]);
async function publish(runtime, project = initial, baseVersion = 185) {
  const response = await runtime.fetch('/admin/api/save', { project, baseVersion, requestId: crypto.randomUUID() });
  assert.equal(response.status, 200, await response.clone().text());
  return (await response.json()).version;
}

test('target preview has no revision read, and only exact server facts skip immutable HTML/CSS validation', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await publish(runtime);
    const project = (await (await runtime.fetch('/admin/api/state')).json()).project;
    const payload = structuredClone(previewPayload(project, 'page', 'about'));
    runtime.queries.length = 0; runtime.blobSizes.length = 0; globalThis.cmsValidationCalls = [];
    const first = await html(await runtime.fetch('/admin/api/preview', payload));
    assert.deepEqual(globalThis.cmsValidationCalls, [], 'matching page/frame facts avoid security reparsing');
    assert.deepEqual(runtime.blobSizes, []);
    assert.ok(runtime.queries.every(sql => !/\bcms_revisions\b/.test(sql)));
    assert.ok(runtime.queries.every(sql => !/^\s*(?:INSERT|UPDATE|DELETE)\b/i.test(sql)), 'preview never writes its cache');
    assert.deepEqual(embedded(first).cards, []);
    const baseline = await previewBaseline(runtime.db, payload.project, seed, origin);
    assert.equal(baseline.pages.length, 1);
    assert.ok(baseline.validatedFrame.nodes.length);
    const otherOrigin = await previewBaseline(runtime.db, payload.project, seed, 'https://different.example');
    assert.deepEqual(otherOrigin.pages, []);
    assert.equal(otherOrigin.validatedFrame, undefined);

    for (const mutate of [
      input => { input.pages[0].html = input.pages[0].html.replace('</main>', '<p>Ny förhandsvisning</p></main>'); },
      input => { input.frame.html = input.frame.html.replace('Thanks for stopping by.', 'En ny sidfot.'); },
      input => { input.pages[0].css += 'main{color:#123456}'; },
    ]) {
      const changed = structuredClone(payload); mutate(changed.project);
      assert.notDeepEqual(changed, payload);
      globalThis.cmsValidationCalls = [];
      await html(await runtime.fetch('/admin/api/preview', changed));
      assert.ok(globalThis.cmsValidationCalls.length > 0, 'changed structural identity misses persisted facts');
    }
    await runtime.db.prepare("UPDATE cms_studio_heads SET build_key='obsolete'").run();
    globalThis.cmsValidationCalls = [];
    assert.equal(await html(await runtime.fetch('/admin/api/preview', payload)), first);
    assert.ok(globalThis.cmsValidationCalls.includes('validateHtml'));
  } finally { delete globalThis.cmsValidationCalls; runtime.close(); }
});

test('preview proofs commit and expire with their head, including a failed fact write and concurrent publishers', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    await publish(runtime);
    const read = () => runtime.sqlite.prepare('SELECT * FROM cms_preview_facts ORDER BY target').all();
    const before = read();
    assert.equal(before.length, initial.pages.length + 1);
    runtime.sqlite.exec("CREATE TRIGGER fail_preview_facts BEFORE INSERT ON cms_preview_facts BEGIN SELECT RAISE(ABORT,'proof write failed'); END");
    const next = structuredClone(initial); next.pages[0].description += ' Nästa';
    const refused = await runtime.fetch('/admin/api/save', { project: next, baseVersion: 186, requestId: crypto.randomUUID() });
    assert.equal(refused.status, 503);
    assert.deepEqual(read(), before);
    assert.equal(runtime.sqlite.prepare('SELECT version FROM cms_head').get().version, 186);
    assert.equal(runtime.sqlite.prepare('SELECT version FROM cms_studio_heads').get().version, 186);
    runtime.sqlite.exec('DROP TRIGGER fail_preview_facts');
    const attempts = await Promise.all([initial, next].map(project => runtime.fetch('/admin/api/save', { project, baseVersion: 186, requestId: crypto.randomUUID() })));
    assert.deepEqual(attempts.map(response => response.status).sort(), [200, 409]);
    assert.equal(read().length, initial.pages.length + 1);
    assert.ok(read().every(row => row.version === 187));
    assert.deepEqual(runtime.sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { runtime.close(); }
});

test('a new build cannot promote stale stored page facts into newly trusted preview proofs', () => {
  const old = structuredClone(initial), nextSeed = { ...seed, studioKey: 'f'.repeat(64) };
  assert.notEqual(nextSeed.studioKey, seed.studioKey);
  const changed = validateProjectWithReferences(old, nextSeed, old, { origins: [origin] }).project;
  assert.notEqual(changed.pages[0].facts.validationKey, old.pages[0].facts.validationKey);
  old.pages[0].html += '<script>accepted only by an obsolete policy</script>';
  assert.throws(() => validateProjectWithReferences(old, nextSeed, old, { origins: [origin] }), { status: 422 });
});

test('preview scopes publication relationships without weakening target HTML, CSS, controls or local references', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const source = structuredClone(initial);
    source.pages.find(page => page.id === 'home').html = '<script>unrelated unsafe page</script>';
    source.cards[0].design = { html: '<script>unused card</script>', css: '' };
    const about = source.pages.find(page => page.id === 'about');
    about.html = about.html.replace('</main>', '<a href="/not-yet-created/">Nästa sida</a></main>');
    assert.deepEqual(embedded(await html(await runtime.fetch('/admin/api/preview', { project: source, pageId: 'about' }))).cards, []);
    assert.equal((await runtime.fetch('/admin/api/validate', { project: source })).status, 422);
    for (const mutate of [
      project => { project.pages[0].html += '<script>alert(1)</script>'; },
      project => { project.pages[0].html += '<img src="/favicon.svg" alt="" onerror="alert(1)">'; },
      project => { project.pages[0].css += 'main{background:url(javascript:alert(1))}'; },
      project => { project.pages[0].html = project.pages[0].html.replace('</main>', '<a href="#missing-local-anchor">Lokal länk</a></main>'); },
      project => { project.pages[0].html = project.pages[0].html.replace('</main>', '<p aria-labelledby="missing-local-label">Text</p></main>'); },
      project => { project.frame.html = project.frame.html.replace('data-consent="deny"', 'data-consent="allow"'); },
      project => { project.frame.css += '[data-cms-frame-id]{color:red}'; },
    ]) {
      const payload = previewPayload(initial, 'page', 'about');
      payload.project = structuredClone(payload.project); mutate(payload.project);
      payload.project.pages[0].facts = initial.pages.find(page => page.id === 'about').facts;
      assert.equal((await runtime.fetch('/admin/api/preview', payload)).status, 422);
    }
    assert.equal((await runtime.fetch('/admin/api/preview', { project: initial, pageId: 'about', cardId: initial.cards[0].id })).status, 422);
  } finally { runtime.close(); }
});

test('machine previews validate their entire emitted bank; ordinary and single-card targets omit unrelated designs', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const payload = previewPayload(initial, 'page', 'home');
    assert.equal(embedded(await html(await runtime.fetch('/admin/api/preview', payload))).cards.length, initial.cards.length);
    const broken = structuredClone(initial);
    broken.cards[1].design = { html: '<p data-card-text onclick="bad()"></p>', css: '' };
    assert.equal((await runtime.fetch('/admin/api/preview', { project: broken, pageId: 'home' })).status, 422);
    const ordinary = embedded(await html(await runtime.fetch('/admin/api/preview', { project: broken, pageId: 'about' })));
    assert.deepEqual(ordinary.cards, []);
    const single = embedded(await html(await runtime.fetch('/admin/api/preview', { project: broken, cardId: broken.cards[0].id })));
    assert.deepEqual(single.cards.map(card => card.id), [broken.cards[0].id]);
    payload.project.cards = [];
    assert.equal((await runtime.fetch('/admin/api/preview', payload)).status, 422);
  } finally { runtime.close(); }
});

test('frame identity projection survives cache hits and changes; legacy target-only input remains previewable', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const legacy = legacyFrameIdentities(legacyInitial);
    const project = validateProjectWithReferences(normalizeClientProject(legacy, seed), seed, undefined, { origins: [origin] }).project;
    await publish(runtime, project);
    for (const id of ['home', 'about']) {
      const payload = previewPayload(project, 'page', id);
      const first = await html(await runtime.fetch('/admin/api/preview', payload));
      assert.match(first, new RegExp(`id="legacy-footer-${id}"`));
      assert.equal(await html(await runtime.fetch('/admin/api/preview', payload)), first);
      const old = await html(await runtime.fetch('/admin/api/preview', { project: legacy, pageId: id }));
      assert.match(old, new RegExp(`id="legacy-footer-${id}"`));
    }
    const payload = previewPayload(project, 'page', 'about');
    const pair = Object.values(payload.project.pages[0].frameIds).find(pair => pair[1] === 'legacy-footer-about');
    pair[1] = 'changed-footer-about';
    // The old local link now has no effective target; a cached page must not
    // turn a different projection into trusted prior identity.
    assert.equal((await runtime.fetch('/admin/api/preview', payload)).status, 422);
  } finally { runtime.close(); }
});

test('current media readiness is checked again even with matching structural facts and unchanged head', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const id = crypto.randomUUID(), source = structuredClone(initial);
    const page = source.pages.find(page => page.id === 'about');
    page.html = page.html.replace('</main>', `<img src="/media/${id}.png" alt="Bild"></main>`);
    await runtime.db.prepare('INSERT INTO cms_media(id,object_key,name,mime,bytes,width,height,alt,sha256,created_at,validation_version) VALUES(?,?,?,?,?,?,?,?,?,?,1)').bind(id, `${id}.png`, 'Bild', 'image/png', 20, 1, 1, 'Bild', 'fixture', new Date().toISOString()).run();
    await publish(runtime, source);
    const payload = previewPayload(source, 'page', 'about');
    await html(await runtime.fetch('/admin/api/preview', payload));
    await runtime.db.prepare("UPDATE cms_media SET trashed_at='2026-10-27T00:00:00Z' WHERE id=?").bind(id).run();
    assert.equal((await runtime.fetch('/admin/api/preview', payload)).status, 422);
    await runtime.db.prepare('UPDATE cms_media SET trashed_at=NULL,validation_version=0 WHERE id=?').bind(id).run();
    assert.equal((await runtime.fetch('/admin/api/preview', payload)).status, 422, 'stale validation must check actual storage instead of trusting the HTML proof');
  } finally { runtime.close(); }
});

test('a path-only proof hit still rechecks local anchors and derives template/noindex from the trusted source', async () => {
  const runtime = await nodeCms(raw, worker);
  try {
    const source = structuredClone(initial);
    source.pages.push(
      { ...seed.blank, id: 'preview-custom', sourceId: 'blank', path: '/before/', html: seed.blank.html.replace('</main>', '<a href="/after/#peer-anchor">Till nästa sida</a></main>') },
      { ...seed.blank, id: 'preview-peer', sourceId: 'blank', path: '/after/', html: seed.blank.html.replace('</main>', '<p id="peer-anchor">Målet</p></main>') },
    );
    await publish(runtime, source);
    const project = (await (await runtime.fetch('/admin/api/state')).json()).project;
    const payload = structuredClone(previewPayload(project, 'page', 'preview-custom'));
    await html(await runtime.fetch('/admin/api/preview', payload));
    payload.project.pages[0].template = 'skift';
    payload.project.pages[0].bodyClass = 'untrusted-class';
    payload.project.pages[0].noindex = true;
    const baseline = await previewBaseline(runtime.db, payload.project, seed, origin);
    assert.equal(baseline.pages.length, 1);
    const checked = validateProjectWithReferences(payload.project, seed, baseline, { origins: [origin], preview: { pageId: 'preview-custom' } }).project.pages[0];
    assert.equal(checked.template, 'custom');
    assert.equal(checked.bodyClass, seed.blank.bodyClass ?? 'page-custom');
    assert.equal(checked.noindex, false);
    payload.project.pages[0].path = '/after/';
    assert.equal((await previewBaseline(runtime.db, payload.project, seed, origin)).pages.length, 1, 'path change intentionally retains the structural proof hit');
    const local = await runtime.fetch('/admin/api/preview', payload);
    assert.equal(local.status, 422);
    assert.match((await local.json()).error, /saknar ett mål/);
    payload.project.pages[0].path = '/before/';
    payload.project.pages[0].sourceId = 'home';
    assert.deepEqual((await previewBaseline(runtime.db, payload.project, seed, origin)).pages, []);
    assert.equal((await runtime.fetch('/admin/api/preview', payload)).status, 422);
  } finally { runtime.close(); }
});

test('per-owner reference summaries equal the complete resource walk for legacy, framed and aliased projects', () => {
  const image = '/media/11111111-1111-4111-8111-111111111111.png';
  const other = '/media/22222222-2222-4222-8222-222222222222.png';
  const font = 'cms-font-33333333-3333-4333-8333-333333333333';
  for (const fixture of [legacyInitial, initial, normalizeClientProject(legacyFrameIdentities(legacyInitial), seed)]) {
    const source = structuredClone(fixture);
    source.pages[0].html = source.pages[0].html.replace('</main>', `<img src="${image}" srcset="${image} 1x, ${other} 2x" alt="Referenser"></main>`);
    source.pages[0].css += `main{background-image:url(${other})}`;
    if (source.frame) source.frame.css += `footer{background-image:url(${other})}`;
    source.theme.fontFamily = font;
    source.resources.social = image;
    source.email = structuredClone(DEFAULT_EMAIL);
    for (const template of Object.values(source.email.templates)) {
      const picture = template.blocks.find(block => block.type === 'image');
      if (picture) picture.src = other;
    }
    const checked = validateProjectWithReferences(source, seed, undefined, { origins: [origin] });
    const ordered = references => [...references].sort(([left], [right]) => left.localeCompare(right));
    assert.deepEqual(ordered(checked.references), ordered(resourceReferences(checked.project, origin)), `fresh schema ${source.schemaVersion}`);
    const cached = validateProjectWithReferences(checked.project, seed, checked.project, { origins: [origin] });
    assert.deepEqual(ordered(cached.references), ordered(resourceReferences(cached.project, origin)), `cached schema ${source.schemaVersion}`);
  }
});
