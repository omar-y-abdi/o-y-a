import { expect } from '@playwright/test';
import { test, SHELL, openModulePage, editor, nextFrames, attachPng } from './helpers/modules-runtime.mjs';
import { CardFailure, assertLayout, waitForRenderedCard, sampleCards } from './helpers/modules-card-export.mjs';

// Python names and assertions are retained for the orchestrator's parity run.
// The isolated DOM adapter needs injection; footer-cms-browser.spec.mjs uses
// the unmodified studio and CSP for navigation/save/preview coverage.
test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', bypassCSP: true });
test.setTimeout(120_000);

test('R14-active-typing-newlines-composition-flush', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const frame = await editor(page, modules.page), heading = frame.locator('h1').first();
  await heading.dispatchEvent('dblclick');
  await expect(heading).toHaveAttribute('contenteditable', 'true');
  await heading.press('ControlOrMeta+A'); await heading.press('Backspace');
  await heading.pressSequentially('Still editing', { delay: 15 });
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => ({ visible: handle.editor.Canvas.getDocument().querySelector('h1').innerText, saved: snapshots.at(-1)?.html ?? '', active: handle.editor.Canvas.getDocument().querySelector('h1').isContentEditable }));
  expect(state.active).toBe(true); expect(state.saved).toContain('Still editing');
  await heading.press('Shift+Enter'); await heading.pressSequentially('Second line', { delay: 15 });
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => snapshots.at(-1).html.includes('Second line'))).toBe(true);
  expect(await page.evaluate(() => handle.editor.Canvas.getDocument().querySelector('h1').isContentEditable)).toBe(true);
  await heading.evaluate(el => { window.composingElement = el; el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); });
  await heading.evaluate(el => {
    el.append(document.createTextNode(' 日本語'));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, inputType: 'insertCompositionText', data: '日本語' }));
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '日本語' }));
  });
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => snapshots.at(-1).html.includes('日本語'))).toBe(true);
  expect(await heading.evaluate(el => el === window.composingElement && el.isContentEditable)).toBe(true);
  await heading.pressSequentially('!'); await page.evaluate(() => handle.flush());
  expect(await page.evaluate(() => snapshots.at(-1).html.includes('!'))).toBe(true);
});

test('R23-live-text-active-inactive-serialization-stable', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const value = await page.evaluate(() => {
    const model = {};
    const activeHtml = '<main><button disabled=""><span data-cms-node="text">before</span></button><input disabled=""><br/><noscript><p>Keep no-script content</p></noscript><table><tbody><tr><td>Table cell</td></tr></tbody></table><svg viewBox="0 0 2 2"><path d="M0 0h2v2z"></path></svg></main>';
    const inactiveHtml = '<main><button disabled><span data-cms-node="text">after</span></button><input disabled><br><noscript><p>Keep no-script content</p></noscript><table><tbody><tr><td>Table cell</td></tr></tbody></table><svg viewBox="0 0 2 2"><path d="M0 0h2v2z"></path></svg></main>';
    const active = cmsTest.liveHtml({ getWrapper: () => ({ getInnerHTML(options) {
      if (!options?.attributes) return activeHtml;
      const attrs = options.attributes(model, {});
      return activeHtml.replace('<span data-cms-node="text">', `<span data-cms-capture="${attrs['data-cms-capture']}" data-cms-node="text">`);
    } }) }, { el: { isConnected: true }, model, getChildrenContainer: () => ({ innerHTML: 'after' }) });
    const inactive = cmsTest.liveHtml({ getWrapper: () => ({ getInnerHTML: () => inactiveHtml }) }, null);
    const roundtrip = cmsTest.liveHtml({ getWrapper: () => ({ getInnerHTML: () => active }) }, null);
    const serialize = html => cmsTest.liveHtml({ getWrapper: () => ({ getInnerHTML: () => html }) }, null);
    const fragments = { row: serialize('<tr><td>Standalone row</td></tr>'), cell: serialize('<td>Standalone cell</td>'), title: serialize('<title>Standalone title</title>') };
    const canonical = value => { const template = document.createElement('template'); template.innerHTML = value; return template.innerHTML; };
    const structure = value => { const parsed = new DOMParser().parseFromString(value, 'text/html'); return { noScript: parsed.querySelector('noscript p')?.textContent, tableCell: parsed.querySelector('table td')?.textContent, svgPath: parsed.querySelector('svg path')?.namespaceURI }; };
    return { same: active === inactive, stable: active === roundtrip, canonicalSame: canonical(active) === canonical(inactive), fragments,
      fragmentTagsPreserved: /<tr\b/.test(fragments.row) && /<td\b/.test(fragments.row) && fragments.row.includes('Standalone row') && /<td\b/.test(fragments.cell) && fragments.cell.includes('Standalone cell') && /<title\b/.test(fragments.title) && fragments.title.includes('Standalone title'),
      activeHasEdit: active.includes('after') && !active.includes('before'), inactiveHasEdit: inactive.includes('after') && !inactive.includes('before'),
      activeStructure: structure(active), inactiveStructure: structure(inactive),
      hasBooleanAndVoid: active.includes('disabled') && inactive.includes('disabled') && active.includes('<input') && inactive.includes('<input') && active.includes('<br') && inactive.includes('<br') };
  });
  expect(value.activeHasEdit).toBe(true); expect(value.inactiveHasEdit).toBe(true);
  expect(value.fragmentTagsPreserved).toBe(true);
  const expected = { noScript: 'Keep no-script content', tableCell: 'Table cell', svgPath: 'http://www.w3.org/2000/svg' };
  expect(value.activeStructure).toEqual(expected); expect(value.inactiveStructure).toEqual(expected);
  expect(value.hasBooleanAndVoid).toBe(true); expect(value.canonicalSame).toBe(true); expect(value.stable).toBe(true);
  expect(value.same, 'RTE and inactive model serializers must not create a phantom HTML diff').toBe(true);
  await editor(page, modules.page);
  const eligibility = await page.evaluate(() => {
    const root = handle.editor.getWrapper(), fallback = root.find('noscript')[0];
    if (!fallback) return null;
    const chain = [];
    for (let node = fallback; node; node = node.parent()) chain.push({ tag: node.get('tagName') ?? 'wrapper', editable: Boolean(node.get('editable')) });
    return { chain, editableAncestors: chain.filter(node => node.editable).map(node => node.tag) };
  });
  expect(eligibility).toBeTruthy(); expect(eligibility.editableAncestors).toEqual([]);
});

test('R18-canonical-content-reloads-without-divergent-editor-data', async ({ page, modules }) => {
  for (const legacy of [{ pages: [{ component: '<main><h1>Different text</h1></main>' }] }, { pages: {} }]) {
    await openModulePage(page, modules);
    const canvas = await editor(page, { ...modules.page, html: '<main><h1>Canonical text</h1></main>', css: 'h1{color:rgb(201,32,17)}', project: legacy });
    await expect(canvas.locator('h1')).toHaveText('Canonical text');
    expect(await canvas.locator('h1').evaluate(el => getComputedStyle(el).color)).toBe('rgb(201, 32, 17)');
  }
});

test('R20-preserve-rich-structure-and-simple-newlines', { tag: '@modules-serial' }, async ({ page, modules }) => {
  await openModulePage(page, modules);
  const frame = await editor(page, { ...modules.page, html: '<main><h1>Hello <span id="accent-word" class="accent">world</span>.</h1><p>Simple<br>line</p></main>', css: '.accent{color:rgb(201,32,17)}', project: null });
  await page.evaluate(() => { window.accentModel = handle.editor.getWrapper().find('#accent-word')[0]; accentModel.addStyle({ 'font-size': '31px' }); });
  await page.evaluate(() => { const ed = handle.editor, c = ed.getWrapper().find('h1')[0]; cmsTest.componentInspector(c, ed, { assets: [], change() { handle.flush(true); }, onError(message) { throw Error(message); }, pickImage() {} }); });
  await expect(page.locator('#element-text')).toBeVisible();
  expect(await frame.locator('#accent-word').evaluate(el => getComputedStyle(el).fontSize)).toBe('31px');
  await page.locator('#element-text').fill('Hello world.!'); await page.evaluate(() => handle.flush());
  await expect(frame.locator('h1 #accent-word.accent')).toHaveCount(1);
  expect(await page.evaluate(() => handle.editor.getWrapper().find('#accent-word')[0] === accentModel)).toBe(true);
  await page.locator('#element-text').fill('Hello wXorld.!');
  await expect(frame.locator('#accent-word')).toHaveText('wXorld');
  expect(await frame.locator('#accent-word').evaluate(el => getComputedStyle(el).fontSize)).toBe('31px');
  const heading = frame.locator('h1'); await heading.dispatchEvent('dblclick');
  await expect(heading).toHaveAttribute('contenteditable', 'true');
  await heading.press('End'); await heading.pressSequentially('?'); await page.waitForTimeout(700);
  expect(await frame.locator('.accent').evaluate(el => getComputedStyle(el).color)).toBe('rgb(201, 32, 17)');
  expect(await page.evaluate(() => snapshots.at(-1).html.includes('class="accent"'))).toBe(true);
  await heading.press('Escape');
  await page.evaluate(() => { const ed = handle.editor; cmsTest.componentInspector(ed.getWrapper().find('p')[0], ed, { assets: [], change() { handle.flush(true); }, onError(message) { throw Error(message); }, pickImage() {} }); });
  await page.locator('#element-text').fill('Simple\nchanged'); await page.evaluate(() => handle.flush());
  expect(await page.evaluate(() => snapshots.at(-1).html.includes('changed'))).toBe(true);
});

test('R20-text-ranges-unicode-links-and-escaping', async ({ page, modules }) => {
  await openModulePage(page, modules);
  await page.evaluate(() => {
    const original = '<span id="word" class="accent">Hi 😀</span> <em id="emphasis">world</em><br><a id="link" href="/om/">next</a>';
    for (const next of ['Hi 😀 world\nnext!', 'Hi 😃 world\nnext', 'Hi 😀 new world\nnext', 'Hi 😀 world next', 'Hi 😀\nworld\nnext', '<img src=x onerror=1>', '', 'Replacement\n日本語', 'Hi 😀 world\nnext']) {
      const html = cmsTest.replaceEditableText(original, next);
      if (cmsTest.editableText(html) !== next) throw Error(JSON.stringify({ next, html }));
      const t = document.createElement('template'); t.innerHTML = html;
      for (const selector of ['span#word.accent', 'em#emphasis', 'a#link[href="/om/"]']) if (!t.content.querySelector(selector)) throw Error('Lost ' + selector);
      if (t.content.querySelector('img')) throw Error('Plain text became markup');
    }
  });
});

test('R15-public-modules-ignore-author-preview-markers', async ({ page, modules }) => {
  await openModulePage(page, modules, SHELL.replace('<div id="editor">', '<div hidden id="cms-preview-data">{"cards":[{"id":"spoof"}]}</div><div id="editor">'));
  const value = await page.evaluate(async () => {
    window.fetch = async url => Response.json(url.includes('cards') ? [{ id: 'validated', flavor: 'kind', text: 'Safe' }] : {});
    const cards = await cmsTest.loadCards(); await cmsTest.loadCopy(); return cards.map(c => c.id);
  });
  expect(value).toEqual(['validated']);
});

test('R21-transform-fit-mobile-and-png-export', async ({ page, modules }, testInfo) => {
  await openModulePage(page, modules);
  const value = await page.evaluate(async () => {
    const results = [];
    for (const width of [600, 240]) {
      const host = document.createElement('div'); host.style.width = width + 'px'; document.body.append(host);
      const design = { html: '<article class="custom-card"><p data-card-text></p></article>', css: '.custom-card{box-sizing:border-box;width:400px;height:180px;padding:20px;background:rgb(250,200,30);transform:rotate(12deg) translate(18px,-10px)}' };
      const node = cmsTest.renderWin(host, { id: 'test', flavor: 'kind', text: 'Visible win\nSecond line', design });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const transform = getComputedStyle(node).transform, blob = await cmsTest.exportWin(host), bytes = new Uint8Array(await blob.arrayBuffer()), dv = new DataView(bytes.buffer);
      const png = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
      const image = new Image(); image.src = png; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data, colors = new Set();
      for (let i = 0; i < pixels.length; i += 4 * 17) if (pixels[i + 3]) colors.add(pixels[i] + ',' + pixels[i + 1] + ',' + pixels[i + 2]);
      results.push({ png, colors: colors.size, width, transform, inline: node.style.transform, text: node.querySelector('[data-card-text]').innerText, pngWidth: dv.getUint32(16), pngHeight: dv.getUint32(20), blobBytes: bytes.length });
    }
    return results;
  });
  for (const row of value) {
    await attachPng(testInfo, `rotated-${row.width}.png`, row.png);
    expect(row.colors).toBeGreaterThan(2); expect(row.inline).toBe('');
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).not.toContain(row.transform);
    expect(row.text).toContain('Second line'); expect(row.pngWidth).toBeGreaterThan(800); expect(row.pngHeight).toBeGreaterThan(360);
  }
  expect(value[0].pngWidth).toBe(value[1].pngWidth);
});

test('merge-overflow-export-pixels-and-live-host-isolation', async ({ page, modules }, testInfo) => {
  await openModulePage(page, modules);
  const rows = await page.evaluate(async () => {
    const results = [];
    for (const width of [600, 280]) {
      const host = document.createElement('div'); host.style.cssText = `width:${width}px;font-family:serif;color:rgb(20,30,40)`; document.body.append(host);
      const card = { id: 'overflow', flavor: 'kind', text: 'Do not crop\nSecond line', design: { html: '<section><i class="marker"></i><p data-card-text></p></section>', css: 'section{width:400px;height:180px;transform:rotate(12deg);background:rgb(255,230,140);position:relative}.marker{position:absolute;left:12px;top:-28px;width:12px;height:12px;background:rgb(255,0,0)}p{padding:35px}' } };
      const design = cmsTest.renderWin(host, card);
      await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const before = host.shadowRoot.innerHTML, hostBefore = host.getAttribute('style'), blob = await cmsTest.exportWin(host), image = new Image();
      const png = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob); });
      image.src = png; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 240 && pixels[i + 1] < 10 && pixels[i + 2] < 10 && pixels[i + 3] > 240) red++;
      const marker = design.querySelector('.marker').getBoundingClientRect(), outer = host.getBoundingClientRect();
      results.push({ width, red, png, pngWidth: image.width, pngHeight: image.height, unchanged: before === host.shadowRoot.innerHTML && hostBefore === host.getAttribute('style'), inside: marker.left >= outer.left - 1 && marker.right <= outer.right + 1 && marker.top >= outer.top - 1 && marker.bottom <= outer.bottom + 1 });
      cmsTest.disposeWin(host); host.remove();
    }
    return results;
  });
  for (const row of rows) {
    await attachPng(testInfo, `overflow-${row.width}.png`, row.png);
    expect(row.red, 'Export clipped the overflowing marker').toBeGreaterThan(400);
    expect(row.inside, 'The preview also must contain the visible overflow').toBe(true);
    expect(row.unchanged, 'Export mutated the live card').toBe(true);
  }
  expect(rows[0].pngWidth).toBe(rows[1].pngWidth); expect(rows[0].pngHeight).toBe(rows[1].pngHeight);
});

test('merge-wrapper-style-isolation', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const value = await page.evaluate(() => {
    const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:200px;top:500px;width:600px'; document.body.append(host);
    const design = cmsTest.renderWin(host, { id: 'isolation', flavor: 'kind', text: 'Visible', design: { html: '<section><p data-card-text></p><span hidden>hidden</span></section>', css: '*{opacity:.5!important}section{width:400px;height:180px}' } });
    return { height: host.getBoundingClientRect().height, outer: getComputedStyle(host.shadowRoot.firstElementChild).opacity, inner: getComputedStyle(design.parentElement).opacity, design: getComputedStyle(design).opacity };
  });
  expect(value.height).toBeLessThan(250); expect(value.outer).toBe('1'); expect(value.inner).toBe('1'); expect(value.design).toBe('0.5');
});

test('R12-clone-anchor-aria-svg-and-style', async ({ page, modules }) => {
  await openModulePage(page, modules);
  await editor(page, { ...modules.page, html: '<main id="main"><section id="original"><h2 id="target">Label</h2><p aria-labelledby="target">Copy</p><a href="#target">Jump</a><svg><defs><linearGradient id="paint"><stop offset="0" stop-color="red"></stop></linearGradient></defs><rect width="10" height="10" fill="url(#paint)"></rect></svg></section></main>', css: '#target{color:rgb(201,32,17)}', project: null });
  const result = await page.evaluate(() => {
    const original = handle.editor.getWrapper().find('#original')[0], clone = original.clone();
    original.parent().append(clone); cmsTest.remapClone(original, clone, handle.editor);
    const target = clone.find('h2')[0].getId(), paint = clone.find('linearGradient')[0]?.getId() ?? clone.find('lineargradient')[0]?.getId();
    const ids = new Map([['target', 'target-copy'], ['paint', 'paint-copy']]);
    return { target, href: clone.find('a')[0].getAttributes().href, label: clone.find('p')[0].getAttributes()['aria-labelledby'], paint,
      fill: clone.find('rect')[0].getAttributes().fill, color: getComputedStyle(clone.find('h2')[0].getEl()).color,
      escapedSelector: cmsTest.mapCloneCss(String.raw`#tar\67 et,[data-note="#target"]/*#target*/`, ids, true),
      escapedUrl: cmsTest.mapCloneCss(String.raw`url("#pa\69 nt") "url(#paint)" /*url(#paint)*/`, ids),
      cloneSelector: cmsTest.hasCloneSelector('#target-copy,[data-note="#target-copy"]', new Set(['target-copy'])), quotedOnly: cmsTest.hasCloneSelector('[data-note="#target-copy"]/*#target-copy*/', new Set(['target-copy'])) };
  });
  expect(result.target).not.toBe('target'); expect(result.href).toBe('#' + result.target); expect(result.label).toBe(result.target);
  expect(result.fill).toBe('url(#' + result.paint + ')'); expect(result.color).toBe('rgb(201, 32, 17)');
  expect(result.escapedSelector).toBe('#target-copy,[data-note="#target"]/*#target*/');
  expect(result.escapedUrl).toBe('url(#paint-copy) "url(#paint)" /*url(#paint)*/');
  expect(result.cloneSelector).toBe(true); expect(result.quotedOnly).toBe(false);
});

test('cms-duplicate-inline-section-preserves-style', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const frame = await editor(page, { ...modules.page, html: '<main><section id="copy-section" aria-labelledby="copy-target" style="padding:19px;color:rgb(201,32,17)"><h2 id="copy-target">Local clone target</h2><a href="#copy-target">Local clone link</a><svg viewBox="0 0 10 10"><defs><clipPath id="copy-clip"><circle cx="5" cy="5" r="5"></circle></clipPath></defs><rect width="10" height="10" clip-path="url(#copy-clip)"></rect></svg></section></main>', css: '', project: null });
  await page.evaluate(() => { const ed = handle.editor; ed.select(ed.getWrapper().find('#copy-target')[0]); handle.setStyleMode('normal'); });
  await page.waitForTimeout(100);
  await page.evaluate(() => { const ed = handle.editor, section = ed.getWrapper().find('#copy-section')[0]; ed.select(section); handle.setStyleMode('normal'); cmsTest.componentInspector(section, ed, { assets: [], change() { handle.flush(true); }, onError(message) { throw Error(message); }, pickImage() {} }); });
  await page.waitForTimeout(100); await page.locator('#duplicate-element').click(); await page.waitForTimeout(100);
  await page.evaluate(() => handle.setStyleMode('normal')); await page.waitForTimeout(100);
  await expect(frame.getByText('Local clone target', { exact: true })).toHaveCount(2);
  await page.evaluate(() => handle.flush());
  const result = await page.evaluate(() => {
    const nodes = [...handle.editor.Canvas.getDocument().querySelectorAll('section:has(h2#copy-target),section:has(h2[id^="copy-target-"])')];
    return { css: snapshots.at(-1)?.css ?? '', nodes: nodes.map(node => ({ id: node.id, padding: getComputedStyle(node).padding, color: getComputedStyle(node).color, heading: node.querySelector('h2').id, href: node.querySelector('a').getAttribute('href'), clip: node.querySelector('clipPath').id, clipRef: node.querySelector('rect').getAttribute('clip-path') })) };
  });
  expect(result.nodes).toHaveLength(2); expect(result.nodes[0].id).not.toBe(result.nodes[1].id);
  for (const node of result.nodes) {
    expect(node.padding).toBe('19px'); expect(node.color).toBe('rgb(201, 32, 17)'); expect(node.href).toBe('#' + node.heading); expect(node.clipRef).toBe('url(#' + node.clip + ')');
  }
  expect(result.css).toContain('padding:19px'); expect(result.css).toContain('color:rgb(201,32,17)');
  expect(result.css).not.toContain('color:black'); expect(result.css).not.toContain('border:0 solid black');
});

test('export-layout-scaled-card-not-fitting-wrapper', async ({ page, modules }) => {
  await openModulePage(page, modules, '<!doctype html><div data-win-artwork></div>');
  const card = modules.fixture.cards[0];
  for (const width of [240, 316, 600]) {
    await page.evaluate(({ card, width }) => { const host = document.querySelector('[data-win-artwork]'); host.style.width = width + 'px'; cmsTest.renderWin(host, card); }, { card, width });
    await page.evaluate(() => document.fonts.ready); await nextFrames(page);
    assertLayout(card.id, card.text, await waitForRenderedCard(page, card.text));
  }
});

test('export-layout-rejects-real-clipping', async ({ page, modules }) => {
  await openModulePage(page, modules, '<!doctype html><div data-win-artwork style="width:316px"></div>');
  const card = modules.fixture.cards[0];
  for (const name of ['card-height', 'text-height', 'text-width', 'outside-host']) {
    await page.evaluate(card => cmsTest.renderWin(document.querySelector('[data-win-artwork]'), card), card);
    await page.evaluate(() => document.fonts.ready); await nextFrames(page);
    await page.evaluate(name => {
      const root = document.querySelector('[data-win-artwork]').shadowRoot.querySelector('.win-design'), slot = root.querySelector('[data-card-text]');
      if (name === 'card-height') root.style.cssText += ';min-height:0!important;height:80px!important;overflow:hidden!important';
      if (name === 'text-height') slot.style.cssText += ';flex:0 0 10px!important;max-height:10px!important;overflow:hidden!important';
      if (name === 'text-width') slot.style.cssText += ';white-space:nowrap!important;overflow-wrap:normal!important;overflow:hidden!important';
      if (name === 'outside-host') root.parentElement.style.setProperty('transform', 'translateX(800px)', 'important');
    }, name);
    const state = await waitForRenderedCard(page, card.text);
    expect(() => assertLayout(card.id, card.text, state), 'The export check accepted real clipping: ' + name).toThrow(CardFailure);
  }
});

test('representative-card-exports', async ({ page, modules }, testInfo) => {
  await openModulePage(page, modules, '<!doctype html><div data-win-artwork style="width:316px"></div>');
  const sample = sampleCards(modules.fixture.cards);
  expect(sample.length).toBeGreaterThan(0);
  expect(new Set(sample.map(card => card.id)).size).toBe(sample.length);
  if (process.env.CMS_MODULE_CARD_SAMPLE_SIZE !== undefined) expect(sample.length).toBe(process.env.CMS_MODULE_CARD_SAMPLE_SIZE === 'all' ? modules.fixture.cards.length : Number(process.env.CMS_MODULE_CARD_SAMPLE_SIZE));
  testInfo.setTimeout(Math.max(120_000, sample.length * 20_000));
  await testInfo.attach('card-sample.json', { body: JSON.stringify(sample.map(card => card.id)), contentType: 'application/json' });
  let exported = 0;
  for (const card of sample) {
    await page.evaluate(async card => {
      const root = cmsTest.renderWin(document.querySelector('[data-win-artwork]'), card), slot = root.matches('[data-card-text]') ? root : root.querySelector('[data-card-text]');
      if (slot.innerText !== card.text) throw Error('Invisible text ' + card.id);
      await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, card);
    assertLayout(card.id, card.text, await waitForRenderedCard(page, card.text));
    const result = await page.evaluate(async () => {
      const blob = await cmsTest.exportWin(document.querySelector('[data-win-artwork]')), bitmap = await createImageBitmap(blob);
      const result = { width: bitmap.width, height: bitmap.height, bytes: blob.size }; bitmap.close(); return result;
    });
    expect(result.width, card.id).toBeGreaterThan(0); expect(result.height, card.id).toBeGreaterThan(0); expect(result.bytes, card.id).toBeGreaterThanOrEqual(1000);
    exported++;
  }
  expect(exported).toBe(sample.length);
});

test('CI-preview-srcdoc-readiness', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const initialCount = await page.evaluate(html => {
    const frame = document.createElement('iframe'); frame.id = 'preview-race'; frame.srcdoc = html; document.body.append(frame);
    return frame.contentDocument.querySelectorAll('script[type=module]').length;
  }, modules.fixture.preview);
  expect(initialCount, 'The reproduction must observe the initial empty iframe').toBe(0);
  const preview = page.frameLocator('#preview-race');
  await expect(preview.locator('body[data-cms-preview=true]')).toBeAttached();
  await expect(preview.locator('head script[type=module][src*="/assets/main."]')).toHaveCount(1);
  expect(await preview.locator('head script[type=module][src*="/assets/main."]').getAttribute('src')).toBe(modules.fixture.main);
});

test('merge-export-inherited-theme-and-current-width', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const value = await page.evaluate(async () => {
    const host = document.createElement('div'); host.style.cssText = 'width:600px;--card-accent:rgb(255,0,0)'; document.body.append(host);
    cmsTest.renderWin(host, { id: 'context', flavor: 'kind', text: 'Inherited color', design: { html: '<section><p data-card-text></p></section>', css: 'section{width:100%;height:80px;background:var(--card-accent)}' } });
    await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    host.style.width = '280px';
    const blob = await cmsTest.exportWin(host), image = new Image(), url = URL.createObjectURL(blob);
    try {
      image.src = url; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      return { width: image.width, pixel: [...ctx.getImageData(20, image.height - 20, 1, 1).data] };
    } finally { URL.revokeObjectURL(url); cmsTest.disposeWin(host); host.remove(); }
  });
  expect(value.width, 'Export used a stale viewport width').toBe(560);
  expect(value.pixel, 'Export lost inherited design variables').toEqual([255, 0, 0, 255]);
});

test('cms-usability-resize-nudge-and-style-mode', async ({ page, modules }) => {
  await openModulePage(page, modules);
  await editor(page, { ...modules.page, html: '<main><section id="parent"><p id="text">Resize me</p><a id="link" href="/kontakt/" aria-label="Kontakt">Link</a><img id="image" src="/social/omar-yusuf.png" alt="Portrait"><button id="functional" data-print>Print</button><svg id="vector" viewBox="0 0 100 100"><g id="group"><path id="shape" d="M0 0L10 10"></path></g></svg></section></main>', css: '#text{transform:rotate(4deg) scale(.9)}', project: null });
  const result = await page.evaluate(async () => {
    const ed = handle.editor, root = ed.getWrapper();
    const text = root.find('#text')[0], link = root.find('#link')[0], image = root.find('#image')[0], button = root.find('#functional')[0], vector = root.find('#vector')[0], group = root.find('#group')[0], shape = root.find('#shape')[0];
    const parent = text.parent(), index = text.index();
    cmsTest.nudgeComponent(text, 1, 0); cmsTest.nudgeComponent(text, 0, 1, 10);
    const moved = { parentSame: text.parent() === parent, indexSame: text.index() === index, translate: text.getStyle().translate, transform: text.getStyle().transform };
    handle.setStyleMode('website');
    const sectors = ed.StyleManager.getSectors({ array: true }).map(s => ({ id: s.getId(), props: s.getProperties().map(p => p.getName?.() ?? p.get('property')) }));
    handle.setStyleMode('normal');
    const normalProps = ed.StyleManager.getSectors({ array: true }).flatMap(s => s.getProperties().map(p => p.getName?.() ?? p.get('property')));
    const groupResize = group.get('resizable'), el = group.getEl(), before = el.getBoundingClientRect();
    groupResize.onStart(null, { el }); groupResize.updateTarget(el, { w: before.width * 1.5, h: before.height * 1.25 }, { store: true });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const after = el.getBoundingClientRect();
    return { resize: { text: text.get('resizable'), link: link.get('resizable'), image: image.get('resizable'), button: button.get('resizable'), vector: vector.get('resizable'), group: Boolean(groupResize?.onStart && groupResize?.updateTarget), shape: shape.get('resizable') }, groupBounds: { before: { w: before.width, h: before.height }, after: { w: after.width, h: after.height } }, groupTransform: group.getAttributes().transform, toolbar: text.get('toolbar'), moved, sectors, normalProps };
  });
  const px = { currentUnit: 0, unitWidth: 'px', unitHeight: 'px' };
  expect(result.resize).toEqual({ text: px, link: px, image: px, button: false, vector: px, group: true, shape: false });
  expect(result.groupBounds.before.w).toBeGreaterThan(0); expect(result.groupBounds.before.h).toBeGreaterThan(0);
  expect(result.groupBounds.after.w).toBeGreaterThan(result.groupBounds.before.w * 1.4);
  expect(result.groupBounds.after.h).toBeGreaterThan(result.groupBounds.before.h * 1.15);
  expect(result.groupTransform).toContain('scale('); expect(result.toolbar).toEqual([]);
  expect(result.moved.parentSame).toBe(true); expect(result.moved.indexSame).toBe(true);
  expect(result.moved.translate).toBe('1px 10px'); expect(result.moved.transform).toBe('rotate(4deg) scale(0.9)');
  const props = new Set(result.sectors.flatMap(sector => sector.props));
  for (const prop of ['color', 'background-color', 'border-color', 'fill', 'stroke', 'box-shadow', 'text-shadow', 'filter']) expect(props.has(prop), prop).toBe(true);
  for (const forbidden of ['position', 'top', 'left', 'margin', 'padding', 'font-size', 'font-family']) expect(props.has(forbidden), forbidden).toBe(false);
  expect(result.normalProps).toContain('font-family');
});

test('cms-extra-style-rejects-image-urls', async ({ page, modules }) => {
  await openModulePage(page, modules);
  await editor(page, { ...modules.page, html: '<main><p id="text">Style me</p></main>', css: '', project: null });
  const result = await page.evaluate(() => {
    const ed = handle.editor, text = ed.getWrapper().find('#text')[0], errors = [], changes = [];
    cmsTest.componentInspector(text, ed, { assets: [], pickImage() {}, change: () => changes.push(1), onError: message => errors.push(message) });
    const fill = (selector, value) => { document.querySelector(selector).value = value; };
    fill('#extra-property', 'background-image'); fill('#extra-value', 'url(https://example.com/x.png)'); document.querySelector('#apply-property').click();
    const rejected = { errors: [...errors], changes: changes.length, background: text.getStyle()['background-image'] ?? null };
    fill('#extra-property', 'background-image'); fill('#extra-value', 'u\\72l(https://example.com/x.png)'); document.querySelector('#apply-property').click();
    const escaped = { errors: [...errors], changes: changes.length, background: text.getStyle()['background-image'] ?? null };
    errors.length = 1;
    fill('#extra-property', 'aspect-ratio'); fill('#extra-value', '1 / 1'); document.querySelector('#apply-property').click();
    return { rejected, escaped, accepted: { errors: errors.length, changes: changes.length, aspect: text.getStyle()['aspect-ratio'] ?? null } };
  });
  expect(result.rejected).toEqual({ errors: ['Använd Byt bild för bilder.'], changes: 0, background: null });
  expect(result.escaped).toEqual({ errors: ['Använd Byt bild för bilder.', 'Skriv värdet utan omvända snedstreck.'], changes: 0, background: null });
  expect(result.accepted).toEqual({ errors: 1, changes: 1, aspect: '1 / 1' });
});

test('cms-page-metadata-maxlength-and-input', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const result = await page.evaluate(() => {
    const calls = [];
    cmsTest.pageInspector({ name: 'Om', path: '/om/', title: 'Om mig', description: 'Kort text' }, { update: (key, value) => calls.push([key, value]), addPage() {}, removePage() {}, protectedPage: false });
    const limits = { name: document.querySelector('#page-name').maxLength, title: document.querySelector('#page-title').maxLength, description: document.querySelector('#page-description').maxLength };
    const title = document.querySelector('#page-title'); title.value = 'Ny titel'; title.dispatchEvent(new Event('input', { bubbles: true }));
    return { limits, calls };
  });
  expect(result.limits).toEqual({ name: 80, title: 160, description: 320 }); expect(result.calls).toEqual([['title', 'Ny titel']]);
});

test('cms-usability-view-state-and-mobile-center', async ({ page, modules }) => {
  await openModulePage(page, modules, SHELL.replace('<aside id="side">', '<aside class="right-panel" id="side" style="height:180px;overflow:auto">'));
  await editor(page, { ...modules.page, html: '<main><div style="height:1000px"><h1 data-cms-node="stable-heading">Heading</h1></div></main>', project: null });
  const result = await page.evaluate(async () => {
    const ed = handle.editor, heading = ed.getWrapper().find('[data-cms-node="stable-heading"]')[0]; ed.select(heading);
    const panel = document.querySelector('.right-panel'); panel.scrollTop = 73;
    const frameWin = ed.Canvas.getWindow(); frameWin.scrollTo(0, 120); ed.Canvas.setZoom(100); ed.Canvas.setCoords(37, 19);
    const snap = cmsTest.captureEditorView(ed, { device: 'mobile', zoom: 100, tab: 'styles' });
    panel.scrollTop = 0; frameWin.scrollTo(0, 0); ed.select(); ed.Canvas.setCoords(0, 0);
    cmsTest.restoreEditorView(ed, snap, { setTab: value => window.restoredTab = value });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const selected = ed.getSelected(), stage = document.querySelector('.gjs-cv-canvas').getBoundingClientRect();
    ed.setDevice('Mobil'); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const mobileBeforeZoom = ed.Canvas.getFrameEl().getBoundingClientRect(); ed.Canvas.setZoom(80);
    const x = cmsTest.centerOffset(stage.width, 390, 80); ed.Canvas.setCoords(x, 0);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const frame = ed.Canvas.getFrameEl().getBoundingClientRect();
    return { scroll: panel.scrollTop, frameScroll: frameWin.scrollY, selected: selected?.getAttributes?.()['data-cms-node'], tab: window.restoredTab, device: ed.Devices.getSelected()?.get('id'), mobileBeforeZoom: { left: mobileBeforeZoom.left, width: mobileBeforeZoom.width }, x, stageWidth: stage.width, frameLeft: frame.left, frameWidth: frame.width, midpointDelta: Math.abs((frame.left + frame.width / 2) - (stage.left + stage.width / 2)) };
  });
  expect(result.scroll).toBe(73); expect(result.frameScroll).toBe(120); expect(result.selected).toBe('stable-heading'); expect(result.tab).toBe('styles'); expect(result.midpointDelta).toBeLessThanOrEqual(1);
});

test('cms-usability-selection-identity-structural-history', async ({ page, modules }) => {
  await openModulePage(page, modules);
  await editor(page, { ...modules.page, html: '<main><div id="first">First</div><div id="second">Second</div></main>', project: null });
  const result = await page.evaluate(async () => {
    const ed = handle.editor, main = ed.getWrapper().find('main')[0], added = main.components().add({ tagName: 'p', components: 'New block' });
    await new Promise(resolve => requestAnimationFrame(resolve));
    const key = added.getAttributes()['data-cms-node'], original = handle.snapshot(true).html;
    added.move(main, { at: 0 }); const reordered = handle.snapshot(true).html; ed.select(added);
    const undoView = cmsTest.captureEditorView(ed); ed.setComponents(original); cmsTest.restoreEditorView(ed, undoView);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const undoSelected = ed.getSelected()?.getAttributes?.()['data-cms-node'], redoView = cmsTest.captureEditorView(ed);
    ed.setComponents(reordered); cmsTest.restoreEditorView(ed, redoView); await new Promise(resolve => requestAnimationFrame(resolve));
    return { key, undoSelected, redoSelected: ed.getSelected()?.getAttributes?.()['data-cms-node'], original, reordered };
  });
  expect(result.key).toBeTruthy(); expect(result.key.startsWith('u-')).toBe(true);
  expect(result.undoSelected).toBe(result.key); expect(result.redoSelected).toBe(result.key);
  expect(result.original).toContain(result.key); expect(result.reordered).toContain(result.key);
});

test('cms-client-shared-content-sync', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const result = await page.evaluate(() => {
    const frame = { html: '<main></main><footer><p data-cms-node="f-node" data-cms-shared="footer.tagline">New <strong>value</strong></p></footer>', css: '' };
    const pages = [
      { id: 'a', path: '/a/', html: '<main id="main"><h1>A</h1></main>' },
      { id: 'b', path: '/b/', html: '<main id="main"><h1>B</h1></main>' },
    ];
    return { frame, pages: pages.map(page => cmsTest.composeEditorPage(page, frame)), stored: pages };
  });
  expect(result.frame.html).toContain('New <strong>value</strong>');
  expect(result.pages[0].html).toContain('data-cms-node="f-node"'); expect(result.pages[1].html).toContain('data-cms-node="f-node"');
  expect(result.pages[1].html).toContain('New <strong>value</strong>');
  expect(result.stored.every(page => !page.html.includes('<footer'))).toBe(true);
});

test('cms-locked-preview-mobile-center', async ({ page, modules }) => {
  await openModulePage(page, modules, '<!doctype html><div class="preview-stage" style="width:1000px;height:600px"><iframe class="preview-frame" style="width:390px;height:500px"></iframe></div>');
  const result = await page.evaluate(() => {
    const stage = document.querySelector('.preview-stage').getBoundingClientRect(), frame = document.querySelector('.preview-frame').getBoundingClientRect();
    return { midpointDelta: Math.abs((frame.left + frame.width / 2) - (stage.left + stage.width / 2)), stageWidth: stage.width, frameWidth: frame.width };
  });
  expect(result.midpointDelta).toBeLessThanOrEqual(1); expect(Math.abs(result.frameWidth - 390)).toBeLessThanOrEqual(1);
});

test('cms-managed-svg-uses-shared-editor', async ({ page, modules }) => {
  await openModulePage(page, modules);
  const data = { ...modules.page, html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g id="face"><circle id="cheek" cx="50" cy="50" r="40" fill="#ffda44" stroke="#252a24" stroke-width="2"></circle></g></svg>', css: '', project: null };
  const frame = await editor(page, data); await expect(frame.locator('#cheek')).toHaveCount(1);
  const result = await page.evaluate(async data => {
    const ed = handle.editor, cheek = ed.getWrapper().find('#cheek')[0], group = ed.getWrapper().find('#face')[0];
    const resize = group.get('resizable'), el = group.getEl(), beforeRect = el.getBoundingClientRect();
    const before = { fill: cheek.getAttributes().fill, shapeResizable: cheek.get('resizable'), groupResizable: Boolean(resize?.onStart && resize?.updateTarget) };
    resize.onStart(null, { el }); resize.updateTarget(el, { w: beforeRect.width * 1.25, h: beforeRect.height * 1.25 }, { store: true });
    cheek.addStyle({ opacity: '0.42' }); cmsTest.nudgeComponent(group, 3, 4); cmsTest.nudgeComponent(cheek, 2, 1); cheek.addAttributes({ fill: '#234ce7' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const afterRect = el.getBoundingClientRect(), snapshot = handle.snapshot(true), source = cmsTest.materializeManagedSvg(snapshot.html, ed);
    handle.destroy(); window.ready = false;
    window.handle = cmsTest.createEditor({ page: { ...data, html: source, css: '' }, cssPath: '', assets: [], onChange() {}, onSelect() {}, onReady() { ready = true; } });
    await new Promise(resolve => { const check = () => ready ? resolve() : requestAnimationFrame(check); check(); });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const reopened = handle.editor.getWrapper(), reopenedGroup = reopened.find('#face')[0], reopenedCheek = reopened.find('#cheek')[0], reopenedRect = reopenedGroup.getEl().getBoundingClientRect();
    return { before, bounds: { before: [beforeRect.width, beforeRect.height], after: [afterRect.width, afterRect.height], reopened: [reopenedRect.width, reopenedRect.height] }, source, reopened: { opacity: getComputedStyle(reopenedCheek.getEl()).opacity, transform: reopenedGroup.getAttributes().transform, shapeTransform: reopenedCheek.getAttributes().transform } };
  }, data);
  expect(result.before).toEqual({ fill: '#ffda44', shapeResizable: false, groupResizable: true });
  expect(result.bounds.after[0]).toBeGreaterThan(result.bounds.before[0] * 1.15); expect(result.bounds.after[1]).toBeGreaterThan(result.bounds.before[1] * 1.15);
  expect(result.bounds.reopened[0]).toBeGreaterThan(result.bounds.before[0] * 1.15); expect(result.bounds.reopened[1]).toBeGreaterThan(result.bounds.before[1] * 1.15);
  expect(result.reopened.opacity).toBe('0.42'); expect(result.reopened.transform).toContain('translate(3 4)'); expect(result.reopened.transform).toContain('scale(');
  expect(result.reopened.shapeTransform).toContain('translate(2 1)'); expect(result.source).not.toContain('data-cms-node'); expect(result.source).not.toContain('<style');
});

test('cms-managed-svg-preserves-existing-visual-baseline', async ({ page, modules }) => {
  await openModulePage(page, modules, '<!doctype html><canvas id="a" width="192" height="192"></canvas><canvas id="b" width="192" height="192"></canvas>');
  const result = await page.evaluate(async fixture => {
    async function image(src) { const img = new Image(); img.src = src; await img.decode(); return img; }
    async function compare(pngData, svg, width, height) {
      const blob = new Blob([svg], { type: 'image/svg+xml' }), url = URL.createObjectURL(blob);
      try {
        const [a, b] = await Promise.all([image(pngData), image(url)]), ca = document.querySelector('#a'), cb = document.querySelector('#b');
        ca.width = cb.width = width; ca.height = cb.height = height;
        ca.getContext('2d').drawImage(a, 0, 0, width, height); cb.getContext('2d').drawImage(b, 0, 0, width, height);
        const x = ca.getContext('2d').getImageData(0, 0, width, height).data, y = cb.getContext('2d').getImageData(0, 0, width, height).data;
        let total = 0; for (let i = 0; i < x.length; i += 4) total += Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]);
        return total / (width * height * 3 * 255);
      } finally { URL.revokeObjectURL(url); }
    }
    return { mail: await compare(fixture.mailPngData, fixture.mailSvg, 192, 192), icon: await compare(fixture.iconPngData, fixture.iconSvg, 180, 180) };
  }, modules.fixture);
  expect(result.mail).toBeLessThan(.02); expect(result.icon).toBeLessThan(.006);
});
