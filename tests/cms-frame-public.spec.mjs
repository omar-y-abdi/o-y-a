import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { parseFragment, serialize } from 'parse5';
import * as css from 'css-tree';
import { seed, legacyInitial } from '../.generated/cms-seed.mjs';
import { normalizeStoredProject } from '../src/cms/legacy-project.mjs';
import { toFrameProject } from '../src/cms/frame-converter.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { waitCanvas } from './helpers/cms-browser-qa.mjs';
import { legacyFrameIdentities, footerId } from './helpers/frame-identities.mjs';

// Keep raster/compositing off the host GPU and pin color/text rendering.
// File scope is required: launchOptions changes Playwright's worker fixture.
test.use({ launchOptions: {
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: [
    ...(process.env.CHROMIUM_PATH ? ['--no-sandbox'] : []),
    '--disable-gpu', '--force-color-profile=srgb', '--disable-lcd-text',
  ],
} });

test('F2: real studio Save preserves legacy bookmarks and new shared styles reach projected footer identities', async ({ page, context }) => {
  test.setTimeout(90_000);
  const original = validateProject(legacyFrameIdentities(legacyInitial), seed);
  const runtime = await cmsRuntime({ project: original });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  try {
    await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(runtime.url + '/admin/');
    await waitCanvas(page);
    await expect(page.frameLocator('#editor iframe.gjs-frame').locator('footer')).toHaveAttribute('id', 'legacy-footer-home');
    await page.locator('#page-description').fill('Orelaterad ändring med bevarade äldre bokmärken.');
    const previewResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/admin/api/preview');
    await page.locator('[data-action=lock]').click();
    expect((await previewResponse).status()).toBe(200);
    await expect(page.frameLocator('#preview-stage iframe').locator('footer')).toHaveAttribute('id', 'legacy-footer-home');
    const saveResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/admin/api/save' && response.request().method() === 'POST');
    await page.locator('[data-action=save]').click();
    expect((await saveResponse).status()).toBe(200);
    await expect(page.locator('#save-status')).toHaveText('Alla ändringar sparade · v2');
    await page.goto(runtime.url + '/#legacy-footer-home');
    await expect(page.locator('footer:target')).toHaveAttribute('id', 'legacy-footer-home');
    await page.locator('a[href="/om/#legacy-footer-about"]').click();
    await expect(page.locator('footer:target')).toHaveAttribute('id', 'legacy-footer-about');
    const stored = await readSite(runtime.db);
    const canonical = footerId(stored.project.frame.html);
    stored.project.frame.css += `#${canonical}{color:#123456}`;
    const headers = { 'Cf-Access-Jwt-Assertion': await runtime.token(), Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' };
    const post = (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { method: 'POST', headers, body: JSON.stringify(body) });
    const styledSave = await post('save', { project: stored.project, baseVersion: stored.version, requestId: crypto.randomUUID() });
    expect(styledSave.status, await styledSave.clone().text()).toBe(200);
    const previewPage = await context.newPage();
    try {
      const idless = original.pages.find(item => footerId(item.html) === null);
      expect(idless).toBeTruthy();
      for (const id of ['home', 'about', idless.id]) {
        const item = stored.project.pages.find(candidate => candidate.id === id);
        const expected = footerId(original.pages.find(candidate => candidate.id === id).html);
        await page.goto(runtime.url + item.path);
        await expect(page.locator('[data-cms-node]')).toHaveCount(0);
        expect(await page.locator('footer').getAttribute('id')).toBe(expected);
        await expect(page.locator('footer')).toHaveCSS('color', 'rgb(18, 52, 86)');
        const preview = await post('preview', { project: stored.project, pageId: id });
        expect(preview.status, await preview.clone().text()).toBe(200);
        await previewPage.setContent((await preview.json()).html);
        expect(await previewPage.locator('[data-cms-node]').count()).toBeGreaterThan(0);
        expect(await previewPage.locator('footer').getAttribute('id')).toBe(expected);
        await expect(previewPage.locator('footer')).toHaveCSS('color', 'rgb(18, 52, 86)');
      }
    } finally { await previewPage.close(); }
    expect(errors).toEqual([]);
  } finally { await runtime.close(); }
});

test('raw v185 opens the authenticated studio, previews, first-saves and reloads without preconversion', async ({ page, context }) => {
  test.setTimeout(90_000);
  const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  const runtime = await cmsRuntime({ project: raw });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  try {
    expect((await readSite(runtime.db, undefined, { raw: true })).project).toEqual(raw);
    await context.addCookies([{ name: 'CF_Authorization', value: await runtime.token(), url: runtime.url }]);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const stateResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/admin/api/state');
    await page.goto(runtime.url + '/admin/');
    const state = await stateResponse;
    expect(state.status(), await state.text()).toBe(200);
    expect((await state.json()).project.schemaVersion).toBe(2);
    await waitCanvas(page);
    await expect(page.locator('[data-page-id]')).toHaveCount(raw.pages.length);
    await expect(page.locator('#page-description')).toHaveValue(raw.pages.find(item => item.id === 'home').description);
    // The real read path converts only its response, not persisted history.
    expect((await readSite(runtime.db, undefined, { raw: true })).project).toEqual(raw);
    const description = 'Första webbläsarsparningen från den råa v185-versionen.';
    await page.locator('#page-description').fill(description);
    const previewResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/admin/api/preview');
    await page.locator('[data-action=lock]').click();
    const preview = await previewResponse;
    expect(preview.status(), await preview.text()).toBe(200);
    const frame = page.frameLocator('#preview-stage iframe');
    await expect(frame.locator('main h1')).toBeVisible();
    await expect(frame.locator('meta[name=description]')).toHaveAttribute('content', description);
    const saveResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/admin/api/save' && response.request().method() === 'POST');
    await page.locator('[data-action=save]').click();
    const saved = await saveResponse;
    expect(saved.status(), await saved.text()).toBe(200);
    await expect(page.locator('#save-status')).toHaveText('Alla ändringar sparade · v2');
    const stored = await readSite(runtime.db);
    expect(stored.project.schemaVersion).toBe(2);
    expect(stored.project.pages.map(item => item.id)).toEqual(raw.pages.map(item => item.id));
    expect(stored.project.pages.find(item => item.id === 'home').description).toBe(description);
    await page.reload();
    await waitCanvas(page);
    await expect(page.locator('#page-description')).toHaveValue(description);
    await page.goto(runtime.url + '/');
    await expect(page.locator('meta[name=description]')).toHaveAttribute('content', description);
    await expect(page.locator('main h1')).toBeVisible();
    expect(errors).toEqual([]);
  } finally { await runtime.close(); }
});

// Independent baseline applies only the named owner decisions to legacy data.
function approvedBaseline(project) {
  const result = normalizeStoredProject(structuredClone(project), seed.legacy);
  for (const page of result.pages) {
    const tree = parseFragment(page.html);
    for (const node of elements(tree)) if ((attribute(node, 'class') ?? '').split(/\s+/).includes('footer-signoff')) {
      const text = node.childNodes.filter(child => child.nodeName === '#text');
      expect(text).toHaveLength(1);
      text[0].value = 'Thanks for stopping by. ';
    }
    page.html = serialize(tree);
    if (page.path !== '/') continue;
    let removed = 0;
    const styles = css.parse(page.css);
    css.walk(styles, { visit: 'Rule', enter(rule, item, list) {
      if (['#iua9', '#iyi2x6'].includes(css.generate(rule.prelude))) { list.remove(item); removed++; }
    } });
    expect(removed).toBe(2);
    page.css = css.generate(styles);
  }
  return result;
}

async function prepareCapture(page) {
  const loading = await page.locator('img').evaluateAll(images => images.map(image => {
    const value = image.getAttribute('loading');
    image.loading = 'eager';
    return value;
  }));
  if (!loading.length) return;
  try {
    await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete)), { timeout: 2_000 }).toBe(true);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  } finally {
    await page.locator('img').evaluateAll((images, values) => images.forEach((image, index) => {
      if (index >= values.length) return;
      if (values[index] === null) image.removeAttribute('loading');
      else image.setAttribute('loading', values[index]);
    }), loading);
  }
}

async function mainLayout(page) {
  return page.locator('main').evaluate(main => {
    const elements = [main, ...main.querySelectorAll('*')];
    const keys = new Map(elements.map((node, index) => [node, node.id ? `#${node.id}` : `${node.localName}[${index}]`]));
    const box = rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    const styles = new Map(elements.map(node => [node, getComputedStyle(node)]));
    const visible = node => {
      for (let parent = node; parent && main.contains(parent); parent = parent.parentElement) {
        const style = styles.get(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || +style.opacity === 0 || parent.classList.contains('sr-only')) return false;
      }
      return true;
    };
    const nodes = [], painted = [], textFragments = [], defects = {};
    const record = (key, fraction) => { if (fraction > 0) defects[key] = Math.max(defects[key] ?? 0, fraction); };
    function clipping(key, node, rect) {
      const area = rect.width * rect.height;
      if (!area) return;
      const clip = (name, bounds, x, y) => {
        const width = x ? Math.max(0, Math.min(rect.x + rect.width, bounds.x + bounds.width) - Math.max(rect.x, bounds.x)) : rect.width;
        const height = y ? Math.max(0, Math.min(rect.y + rect.height, bounds.y + bounds.height) - Math.max(rect.y, bounds.y)) : rect.height;
        record(`clip ${key} by ${name}`, 1 - width * height / area);
      };
      clip('viewport', { x: 0, width: innerWidth }, true, false);
      for (let parent = node; parent && main.contains(parent); parent = parent.parentElement) {
        const style = styles.get(parent), x = /^(hidden|clip|auto|scroll)$/.test(style.overflowX), y = /^(hidden|clip|auto|scroll)$/.test(style.overflowY);
        if ((x || y) && (style.display !== 'inline' || parent instanceof SVGElement)) clip(keys.get(parent), parent.getBoundingClientRect(), x, y);
      }
    }
    for (const node of elements) {
      if (!visible(node) || node instanceof SVGElement && node.localName !== 'svg') continue;
      const rect = node.getBoundingClientRect(), key = keys.get(node), style = styles.get(node);
      if (!rect.width || !rect.height) continue;
      const parent = node.parentElement, parentStyle = styles.get(parent);
      nodes.push({ key, tag: node.localName, viewBox: node.getAttribute('viewBox'), box: box(rect), width: style.width, height: style.height, minHeight: style.minHeight, right: style.right, translate: style.translate, transform: style.transform, padding: style.padding, overflow: style.overflow, parent: parentStyle ? { key: keys.get(parent), width: parentStyle.width, padding: parentStyle.padding, box: box(parent.getBoundingClientRect()) } : null });
      clipping(key, node, rect);
      if (node.matches('img,svg')) painted.push({ key, owner: key, rects: [box(rect)] });
      const text = [...node.childNodes].flatMap((child, index) => {
        if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim() || node.matches('script,style,noscript')) return [];
        const range = document.createRange();
        range.selectNodeContents(child);
        const rects = [...range.getClientRects()].filter(rect => rect.width && rect.height).map(box), textKey = `${key}/text[${index}]`;
        rects.forEach(rect => clipping(textKey, node, rect));
        painted.push({ key: textKey, owner: key, rects });
        return [{ key: textKey, range, world: rects }];
      });
      if (!text.length) continue;
      // Same-owner text uses its layout plane: rotated axis-aligned world boxes
      // overlap even when the underlying lines do not. Keep every world box for
      // clipping and collisions with other owners. Identity preserves the
      // containing block while neutralizing only this owner's transform.
      const originalStyle = node.getAttribute('style');
      const neutralize = style.transform !== 'none';
      const originalTransform = style.transform, transformValue = node.style.getPropertyValue('transform'), transformPriority = node.style.getPropertyPriority('transform');
      const dimensions = () => [getComputedStyle(node).width, getComputedStyle(node).height, node.offsetWidth, node.offsetHeight];
      const beforeDimensions = dimensions();
      try {
        if (neutralize) {
          node.style.setProperty('transition', 'none', 'important');
          // Flush the disabled transition before changing its target value.
          if (getComputedStyle(node).transitionProperty !== 'none') throw new Error(`Could not disable text transition for ${key}`);
          node.style.setProperty('transform', 'matrix(1,0,0,1,0,0)', 'important');
          if (getComputedStyle(node).transform !== 'matrix(1, 0, 0, 1, 0, 0)') throw new Error(`Could not neutralize text transform for ${key}`);
        }
        const origin = node.getBoundingClientRect(), fragments = [];
        for (const item of text) {
          const local = [...item.range.getClientRects()].filter(rect => rect.width && rect.height).map(rect => ({ x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height }));
          if (local.length !== item.world.length || JSON.stringify(dimensions()) !== JSON.stringify(beforeDimensions)) throw new Error(`Local text measurement changed layout for ${key}`);
          textFragments.push({ key: item.key, world: item.world, local });
          fragments.push(...local.map(rect => ({ key: item.key, rect })));
        }
        for (let index = 0; index < fragments.length; index++) for (const right of fragments.slice(index + 1)) overlap(`${fragments[index].key} / ${right.key}`, fragments[index].rect, right.rect);
      } finally {
        if (neutralize) {
          if (transformValue) node.style.setProperty('transform', transformValue, transformPriority);
          else node.style.removeProperty('transform');
          // Restore and flush the original target while transitions remain off.
          const restoredTransform = getComputedStyle(node).transform;
          if (originalStyle === null) node.removeAttribute('style');
          else node.setAttribute('style', originalStyle);
          if (restoredTransform !== originalTransform || getComputedStyle(node).transform !== originalTransform) throw new Error(`Local text measurement changed the restored transform for ${key}`);
        }
      }
    }
    function overlap(key, left, right) {
      const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
      const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
      record(`overlap ${key}`, width * height / Math.min(left.width * left.height, right.width * right.height));
    }
    for (let index = 0; index < painted.length; index++) for (const right of painted.slice(index + 1)) {
      const left = painted[index];
      if (left.owner === right.owner) continue;
      for (const a of left.rects) for (const b of right.rects) overlap(`${left.key} / ${right.key}`, a, b);
    }
    for (const parent of elements) {
      if (!(parent instanceof HTMLElement)) continue;
      const siblings = [...parent.children].filter(node => (node instanceof HTMLElement || node.localName === 'svg') && visible(node) && !['absolute', 'fixed'].includes(styles.get(node).position) && styles.get(node).float === 'none').map(node => ({ key: keys.get(node), rect: node.getBoundingClientRect() })).filter(({ rect }) => rect.width && rect.height);
      for (let index = 0; index < siblings.length; index++) for (const right of siblings.slice(index + 1)) overlap(`flow ${siblings[index].key} / ${right.key}`, siblings[index].rect, right.rect);
    }
    return { viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, nodes, textFragments, defects };
  });
}

function layoutIncreases(actual, reference) {
  return Object.entries(actual.defects).flatMap(([defect, fraction]) => {
    const previous = reference.defects[defect] ?? 0;
    return fraction > previous + 1e-6 ? [{ defect, fraction, previous }] : [];
  });
}

test('Q9: geometry guard rejects new or increased defects against raw at the same width, retaining existing defects', async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 844 });
  await page.setContent('<style>*{box-sizing:border-box}body{margin:0}#clip{width:100px;overflow:hidden}#label{width:80px;height:20px}#first,#second{height:20px}</style><main><div id="clip"><div id="label">Läsbar text</div></div><section id="first">Första raden</section><section id="second">Andra raden</section></main>');
  const before = await mainLayout(page);
  expect(before.defects).toEqual({});
  await page.locator('#clip').evaluate(node => { node.style.width = '10px'; });
  await page.locator('#label').evaluate(node => { node.style.height = '5px'; node.style.overflow = 'hidden'; });
  await page.locator('#second').evaluate(node => { node.style.marginTop = '-5px'; });
  const after = await mainLayout(page);
  expect(after.defects['clip #label by #clip']).toBeGreaterThan(0);
  expect(after.defects['clip #label/text[0] by #label']).toBeGreaterThan(0);
  expect(after.defects['overlap flow #first / #second']).toBeGreaterThan(0);
  expect(layoutIncreases(after, before).map(item => item.defect)).toContain('overlap flow #first / #second');
  expect(layoutIncreases(after, after)).toEqual([]);
  const defect = 'clip #label by #clip', fraction = after.defects[defect];
  const raw = { defects: { ...after.defects, [defect]: fraction - 5e-7 } };
  expect(layoutIncreases(after, raw)).toEqual([]);
  raw.defects[defect] = fraction - 2e-6;
  expect(layoutIncreases(after, raw)).toEqual([{ defect, fraction, previous: fraction - 2e-6 }]);
});

test('Q9: rotated text retains local defects after translation while tighter lines and other owners still collide', async ({ page }) => {
  await page.setContent('<style>body{margin:0}#label{position:absolute;left:100px;top:1963px;width:68px;height:68px;transform:rotate(15deg);font:12px/16px Arial}#other{position:absolute;left:300px;top:2055px}</style><main><span id="label">SNÄLL<br>INTERNET</span><span id="other">ANNAN</span></main>');
  const before = await mainLayout(page);
  await page.locator('#label').evaluate(node => { node.style.top = '2055px'; });
  const translated = await mainLayout(page);
  const self = layout => Object.fromEntries(Object.entries(layout.defects).filter(([key]) => key.startsWith('overlap #label/text[') && !key.includes('#other')));
  expect(self(translated)).toEqual(self(before));
  expect(translated.textFragments.filter(item => item.key.startsWith('#label/')).map(item => item.local)).toEqual(before.textFragments.filter(item => item.key.startsWith('#label/')).map(item => item.local));
  expect(await page.locator('#label').getAttribute('style')).toBe('top: 2055px;');
  await page.locator('#label').evaluate(node => { node.style.lineHeight = '2px'; });
  const tighter = await mainLayout(page);
  expect(layoutIncreases(tighter, translated).some(item => item.defect.startsWith('overlap #label/text['))).toBe(true);
  await page.locator('#other').evaluate(node => { node.style.left = '100px'; node.style.top = '2055px'; });
  const collision = await mainLayout(page);
  expect(layoutIncreases(collision, tighter).some(item => item.defect.includes('#label/text[') && item.defect.includes('#other/text['))).toBe(true);
});

test('Q9: local text measurement restores transitioned transforms without starting an animation', async ({ page }) => {
  await page.setContent('<style>#label{display:block;width:68px;height:68px;transform:rotate(15deg);transition:transform 60s linear}</style><main><span id="label" style="color:blue">SNÄLL<br>INTERNET</span></main>');
  const state = () => page.locator('#label').evaluate(node => ({ style: node.getAttribute('style'), transform: getComputedStyle(node).transform, transition: getComputedStyle(node).transition, animations: node.getAnimations().map(animation => animation.playState) }));
  const before = await state();
  expect(before.animations).toEqual([]);
  await mainLayout(page);
  expect(await state()).toEqual(before);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await state()).toEqual(before);
});

function publicIdentity(body) {
  function visit(node, inMain = false) {
    inMain ||= node.tagName === 'MAIN';
    if (node.nodeType === Node.TEXT_NODE) return inMain || node.textContent.trim() ? node.textContent : null;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const attrs = [...node.attributes].filter(attr => !['data-cms-node', 'data-cms-version'].includes(attr.name) && (inMain || attr.name !== 'id' || ['top', 'mobile-menu', 'privacy-title'].includes(attr.value))).map(attr => [attr.name, attr.name === 'class' ? attr.value.trim().replace(/\s+/g, ' ') : attr.value]).sort(([a], [b]) => a.localeCompare(b));
    // With scripting enabled NOSCRIPT contains raw HTML text. DOMParser's
    // detached document disables scripting: compare the real fallback nodes
    // with the same attribute policy, without rewriting ordinary text.
    const children = node.tagName === 'NOSCRIPT'
      ? new DOMParser().parseFromString('<!doctype html><body>' + node.innerHTML, 'text/html').body.childNodes
      : node.childNodes;
    return { tag: node.tagName, attrs, children: [...children].map(child => visit(child, inMain)).filter(child => child !== null) };
  }
  return visit(body);
}

test('C4: public identity compares noscript fallback content and attributes while ignoring only editor keys', async ({ browser }) => {
  const html = keyed => `<main id="main"><noscript><a${keyed ? ' data-cms-node="legacy-key"' : ''} href="/kontakt/" data-privacy-open>Skriv till oss</a><p>&lt;b data-cms-node="fallback-literal"&gt;</p></noscript><p>data-cms-node="ordinary-literal"</p></main>`;
  const identities = [];
  for (const javascript of [true, false]) {
    const context = await browser.newContext({ javaScriptEnabled: javascript });
    try {
      const page = await context.newPage();
      const identity = () => page.locator('body').evaluate(publicIdentity);
      await page.setContent(html(true));
      expect(await page.locator('noscript').evaluate(node => node.firstChild.nodeName)).toBe(javascript ? '#text' : 'A');
      const original = await page.locator('body').innerHTML(), expected = await identity();
      expect(await page.locator('body').innerHTML()).toBe(original);
      expect(expected.children[0].children[0].children).toEqual([
        { tag: 'A', attrs: [['data-privacy-open', ''], ['href', '/kontakt/']], children: ['Skriv till oss'] },
        { tag: 'P', attrs: [], children: ['<b data-cms-node="fallback-literal">'] },
      ]);
      await page.setContent(html(false));
      expect(await identity()).toEqual(expected);
      identities.push(expected);
      for (const [before, after] of [
        ['Skriv till oss', 'Ändrad reservtext'],
        ['href="/kontakt/"', 'href="/om/"'],
        [' data-privacy-open', ''],
        ['fallback-literal', 'changed-fallback-literal'],
        ['ordinary-literal', 'changed-ordinary-literal'],
      ]) {
        await page.setContent(html(false).replace(before, after));
        expect(await identity(), `${before} remains part of public identity, js=${javascript}`).not.toEqual(expected);
      }
    } finally { await context.close(); }
  }
  expect(identities[0]).toEqual(identities[1]);
});

function compareCapture(actual, expected, label, failures) {
  if (!actual || !expected) { failures.push(`${label}: capture missing`); return false; }
  const identity = isDeepStrictEqual(actual.identity, expected.identity);
  const png = actual.screenshot.equals(expected.screenshot);
  if (!identity) failures.push(`${label}: public identity`);
  if (!png) {
    failures.push(`${label}: PNG bytes (${expected.pngPath}, ${actual.pngPath})`);
    const previous = new Map(expected.layout?.nodes.map(node => [node.key, node]) ?? []);
    const changed = (actual.layout?.nodes ?? []).filter(node => previous.has(node.key) && ['width', 'height'].some(axis => Math.abs(node.box[axis] - previous.get(node.key).box[axis]) > .01));
    if (changed.length) failures.push(`${label}: changed main sizes: ${changed.map(node => `${node.key} ${previous.get(node.key).width}×${previous.get(node.key).height} -> ${node.width}×${node.height}`).join('; ')}`);
  }
  return identity && png;
}

async function capture(browser, runtime, pages, version, javascript, width, testInfo, phase, failures, motion = 'reduce') {
  const result = new Map();
  for (const item of pages) {
    const label = `${item.path}, ${width}, js=${javascript}, motion=${motion}`, name = `${phase}-${item.id}-${width}-${javascript ? 'ready' : 'no-js'}-${motion}`;
    let context;
    try {
      // Same cold-context capture as public-evidence.spec.mjs. No browser state,
      // scroll position or pending work carries over from the previous page.
      context = await browser.newContext({ viewport: { width, height: width === 1440 ? 1000 : 844 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: motion, javaScriptEnabled: javascript });
      const page = await context.newPage();
      if (javascript) await page.addInitScript(() => {
        let random = 123456;
        Math.random = () => ((random = Math.imul(random, 1664525) + 1013904223 >>> 0) / 4294967296);
        crypto.getRandomValues = array => { for (let index = 0; index < array.length; index++) array[index] = Math.floor(Math.random() * 0x100000000); return array; };
      });
      const value = await test.step(`${label}, ${phase}`, async () => {
        const response = await page.goto(runtime.url + item.path, { waitUntil: 'networkidle', timeout: 4_000 });
        expect(response.status(), item.path).toBe(item.path === '/404.html' ? 404 : 200);
        expect(response.headers()['x-cms-version'], item.path).toBe(String(version));
        await expect(page.locator('main h1')).toHaveCount(1);
        await expect(page.locator('footer.site-footer')).toHaveCount(1);
        if (javascript) {
          await expect(page.locator('html')).toHaveClass(/js-ready/);
          if (item.path === '/' || item.path === '/verkstad/') await expect(page.locator('[data-print]')).toBeEnabled();
          if (item.path === '/verkstad/') await expect(page.locator('[data-memory-card="0"]')).toBeEnabled();
        }
        await prepareCapture(page);
        await page.evaluate(async () => {
          await document.fonts.ready;
          for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = 0; }
        });
        const pngPath = testInfo.outputPath(`${name}.png`);
        // Native screenshot waits for fonts, including with scripting disabled.
        // The two independent baseline captures below are the stability check.
        const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', timeout: 5_000, path: pngPath });
        const identity = await page.locator('body').evaluate(publicIdentity);
        const rendering = await page.locator('body').evaluate(body => {
          const properties = ['display', 'position', 'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'transform', 'filter', 'opacity'];
          return { fonts: document.fonts.status, images: [...document.images].map(image => ({ src: image.currentSrc, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight })), nodes: [body, ...body.querySelectorAll('.site-header,.brand,.primary-nav,.header-actions,.mobile-menu,main,h1,.site-footer,.footer-back,[data-motion-toggle],[data-menu-toggle],[data-print],[data-memory-grid],[data-contact-form],[data-privacy-status]')].map(node => {
            const style = getComputedStyle(node), box = node.getBoundingClientRect();
            return { tag: node.tagName, id: node.id, box: { x: box.x, y: box.y, width: box.width, height: box.height }, style: Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)])) };
          }) };
        });
        await testInfo.attach(`${name}.json`, { body: JSON.stringify(identity, null, 2), contentType: 'application/json' });
        await testInfo.attach(`${name}-render.json`, { body: JSON.stringify(rendering, null, 2), contentType: 'application/json' });
        await testInfo.attach(`${name}.png`, { path: pngPath, contentType: 'image/png' });
        const layout = item.path === '/' ? await mainLayout(page) : null;
        if (layout) await testInfo.attach(`${name}-main-layout.json`, { body: JSON.stringify(layout, null, 2), contentType: 'application/json' });
        return { identity, screenshot, pngPath, layout };
      }, { timeout: 8_000 });
      result.set(item.path, value);
    } catch (error) { failures.push(`${label}, ${phase}: ${error.stack ?? error}`); }
    finally { await context?.close(); }
  }
  return result;
}

test('B8: fifteen v185 pages retain exact approved screenshots and public identity at 390/1440 before and after js-ready', async ({ browser }, testInfo) => {
  // fr7 completed 174 captures in 300 s, including setup (~1.72 s/capture).
  // Round to 2 s, add 50% for software rendering, then 60 s setup/cleanup.
  const captureCount = 15 * 2 * 2 * 3;
  test.setTimeout(captureCount * 3_000 + 60_000);
  const session = await browser.newBrowserCDPSession();
  try {
    const profile = await session.send('SystemInfo.getInfo');
    await testInfo.attach('rendering-profile.json', { body: JSON.stringify({ version: browser.version(), gpu: profile.gpu }, null, 2), contentType: 'application/json' });
  } finally { await session.detach(); }
  const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  const before = approvedBaseline(raw), after = validateProject(toFrameProject(raw, seed), seed);
  expect(before.pages).toHaveLength(15);
  const runtime = await cmsRuntime();
  const failures = [];
  try {
    let version = 0;
    for (const javascript of [false, true]) for (const width of [390, 1440]) {
      version = (await publishSite(runtime.db, { project: before, baseVersion: version, requestId: crypto.randomUUID(), actor: runtime.email })).version;
      const baseline = await capture(browser, runtime, before.pages, version, javascript, width, testInfo, 'before-1', failures);
      const repeated = await capture(browser, runtime, before.pages, version, javascript, width, testInfo, 'before-2', failures);
      // Exactly two baseline attempts, both retained. A mismatch fails the gate;
      // do not retry until noisy output happens to agree.
      const stable = new Set();
      for (const item of before.pages) if (compareCapture(repeated.get(item.path), baseline.get(item.path), `${item.path}, ${width}, js=${javascript}, baseline vs baseline`, failures)) stable.add(item.path);
      version = (await publishSite(runtime.db, { project: after, baseVersion: version, requestId: crypto.randomUUID(), actor: runtime.email })).version;
      const migrated = await capture(browser, runtime, before.pages, version, javascript, width, testInfo, 'after', failures);
      for (const item of before.pages) {
        if (stable.has(item.path)) compareCapture(migrated.get(item.path), baseline.get(item.path), `${item.path}, ${width}, js=${javascript}, migrated vs baseline`, failures);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  } finally { await runtime.close(); }
});

test('Q9: Home keeps raw dimensions at 390/414/600/760/1440; 320/360 add no measured clipping or overlap against raw at the same width', async ({ browser }, testInfo) => {
  // 5 widths * 2 scripting modes * 2 motion modes * 3 captures, plus 16 narrow
  // before/after captures. 3 s/capture plus 60 s setup/cleanup gives 288 s.
  test.setTimeout((5 * 2 * 2 * 3 + 16) * 3_000 + 60_000);
  const raw = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  const before = approvedBaseline(raw), after = validateProject(toFrameProject(raw, seed), seed);
  const home = before.pages.find(page => page.path === '/');
  const rawCss = raw.pages.find(page => page.path === '/').css;
  expect(home.css).toBe(css.generate(css.parse(rawCss.replace(/#(?:iua9|iyi2x6)\{[^{}]*\}/g, ''))));
  const runtime = await cmsRuntime(), failures = [], baselines = new Map(), stable = new Set();
  const key = (javascript, motion, width) => `${javascript}/${motion}/${width}`;
  try {
    const original = await publishSite(runtime.db, { project: raw, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
    for (const javascript of [false, true]) for (const motion of ['reduce', 'no-preference']) for (const width of [320, 360]) {
      const rawNarrow = (await capture(browser, runtime, [home], original.version, javascript, width, testInfo, 'q9-raw-narrow', failures, motion)).get('/');
      baselines.set(key(javascript, motion, width), rawNarrow);
    }
    const first = await publishSite(runtime.db, { project: before, baseVersion: original.version, requestId: crypto.randomUUID(), actor: runtime.email });
    for (const javascript of [false, true]) for (const motion of ['reduce', 'no-preference']) for (const width of [390, 414, 600, 760, 1440]) {
      const baseline = (await capture(browser, runtime, [home], first.version, javascript, width, testInfo, 'q9-before-1', failures, motion)).get('/');
      const repeated = (await capture(browser, runtime, [home], first.version, javascript, width, testInfo, 'q9-before-2', failures, motion)).get('/');
      baselines.set(key(javascript, motion, width), baseline);
      if (compareCapture(repeated, baseline, `Q9 /, ${width}, js=${javascript}, motion=${motion}, baseline vs baseline`, failures)) stable.add(key(javascript, motion, width));
    }
    const second = await publishSite(runtime.db, { project: after, baseVersion: first.version, requestId: crypto.randomUUID(), actor: runtime.email });
    for (const javascript of [false, true]) for (const motion of ['reduce', 'no-preference']) {
      for (const width of [390, 414, 600, 760, 1440]) {
        const migrated = (await capture(browser, runtime, [home], second.version, javascript, width, testInfo, 'q9-after', failures, motion)).get('/');
        if (stable.has(key(javascript, motion, width))) compareCapture(migrated, baselines.get(key(javascript, motion, width)), `Q9 /, ${width}, js=${javascript}, motion=${motion}, migrated vs baseline`, failures);
      }
      const reference = baselines.get(key(javascript, motion, 414))?.layout;
      for (const width of [320, 360]) {
        const actual = (await capture(browser, runtime, [home], second.version, javascript, width, testInfo, 'q9-narrow', failures, motion)).get('/')?.layout;
        const rawNarrow = baselines.get(key(javascript, motion, width))?.layout;
        const label = `Q9 /, ${width}, js=${javascript}, motion=${motion}`;
        if (!actual || !reference || !rawNarrow) { failures.push(`${label}: main layout missing`); continue; }
        if (actual.viewport !== width || actual.document !== width || actual.body !== width) failures.push(`${label}: viewport/document/body ${actual.viewport}/${actual.document}/${actual.body}, expected ${width}/${width}/${width}`);
        const sticker = actual.nodes.find(node => node.key === '#i58p9l');
        if (!sticker || sticker.box.x < 0 || sticker.box.x + sticker.box.width > width) failures.push(`${label}: sticker crosses viewport: ${JSON.stringify(sticker)}`);
        const present = new Set(actual.nodes.map(node => node.key));
        for (const node of rawNarrow.nodes) if (!present.has(node.key)) failures.push(`${label}: visible main node lost versus raw ${width}: ${node.key}`);
        // World boxes retain clipping/cross-owner collisions; same-owner text
        // fragments use the owner's untransformed layout plane.
        // Raw at this width is authoritative; 414 only diagnoses narrow layouts.
        const diagnostics = layoutIncreases(actual, reference).map(({ defect, fraction, previous }) => `${defect}: fraction ${fraction}, 414 ${previous}, raw ${width} ${rawNarrow.defects[defect] ?? 0}`);
        for (const node of reference.nodes) if (!present.has(node.key)) diagnostics.push(`visible main node absent versus 414: ${node.key}`);
        console.log(`${label}: 414 diagnostics\n${diagnostics.join('\n') || '(none)'}`);
        for (const { defect, fraction, previous } of layoutIncreases(actual, rawNarrow)) {
          const names = new Set(defect.match(/#[\w-]+|[a-z]+\[\d+\]/g) ?? []);
          const causes = actual.nodes.filter(node => names.has(node.key));
          const rawCauses = rawNarrow.nodes.filter(node => names.has(node.key));
          const fragments = layout => layout.textFragments.filter(item => defect.includes(item.key));
          failures.push(`${label}: ${defect}: fraction ${fraction} exceeds raw ${width} fraction ${previous}; migrated boxes/CSS ${JSON.stringify(causes)}; raw boxes/CSS ${JSON.stringify(rawCauses)}; migrated world/local text ${JSON.stringify(fragments(actual))}; raw world/local text ${JSON.stringify(fragments(rawNarrow))}`);
        }
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  } finally { await runtime.close(); }
});
