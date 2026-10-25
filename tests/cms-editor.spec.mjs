import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { preparePage, validateCss, validateHtml } from '../src/cms/validation.mjs';
import { splitPage } from '../src/cms/frame.mjs';

// The studio's own createEditor runs in a bare page, so the tests reach the
// GrapesJS editor (window.__ed) and the studio handle (window.__studio) without
// product code exposing them. Same file runs in chromium, firefox and webkit.
const ORIGIN = 'https://studio.test';
const CANVAS_CSS = 'p{margin:0;height:40px}svg,img{display:block}';
// GrapesJS writes an inline height:100% on #editor, overriding the px height
// here. Without a height on html and body that resolves to 0: the canvas iframe
// measured 0 px tall and real mouse events landed on #styles-panel instead.
// The studio stylesheet sizes .gjs-cv-canvas to the whole editor; GrapesJS's default 85% clipped the 1440 px frame and its resize handles.
// Layers and blocks start hidden as in templates.mjs: a visible layers panel scrolled the page on every select.
const SHELL = `<!doctype html><link rel="stylesheet" href="/grapes.css"><link rel="stylesheet" href="/studio.css"><style>html,body{height:100%;margin:0}#editor{width:1600px;height:1300px}</style>
<div id="editor"></div><div id="styles-panel"></div><div id="blocks-panel" hidden></div><div id="layers-panel" hidden></div><div id="traits-panel"></div><script src="/harness.js"></script>`;
const PIC = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#369"/></svg>';
let harness, gjsCss, studioCss;
test.beforeAll(async () => {
  const out = await build({ stdin: { contents: "import { createEditor } from './src/cms/client/editor.mjs'; import { Draft } from './src/cms/client/draft.mjs'; import { liveHtml } from './src/cms/client/live-text.mjs'; import { composeEditorPage } from './src/cms/client/frame-project.mjs'; window.createEditor = createEditor; window.Draft = Draft; window.liveHtml = liveHtml; window.composeEditorPage = composeEditorPage;", resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022' });
  harness = out.outputFiles[0].text;
  gjsCss = await readFile('node_modules/grapesjs/dist/css/grapes.min.css', 'utf8');
  studioCss = await readFile('src/cms/styles.css', 'utf8');
});

async function openStudio(page, { html, css = '', bodyClass = 'page-test', frame }) {
  await page.setViewportSize({ width: 1600, height: 1400 });
  await page.route(`${ORIGIN}/**`, route => {
    const files = { '/': ['text/html', SHELL], '/harness.js': ['text/javascript', harness], '/grapes.css': ['text/css', gjsCss], '/studio.css': ['text/css', studioCss], '/canvas.css': ['text/css', CANVAS_CSS], '/pic.svg': ['image/svg+xml', PIC] };
    const [type, body] = files[new URL(route.request().url()).pathname] ?? ['text/plain', 'missing'];
    return route.fulfill({ status: body === 'missing' ? 404 : 200, contentType: type, body });
  });
  await page.goto(`${ORIGIN}/`);
  expect(await page.evaluate(() => ({ secure: isSecureContext, uuid: typeof crypto.randomUUID })), 'The harness uses the production studio secure context').toEqual({ secure: true, uuid: 'function' });
  await page.evaluate(([html, css, bodyClass, frame]) => new Promise(resolve => {
    window.__studio = window.createEditor({ page: { html, css, path: '/t/', bodyClass }, frame, cssPath: '/canvas.css', assets: [], onChange() {}, onSelect() {}, onAssetPick: null,
      onReady: editor => {
        window.__ed = editor; window.__resizes = [];
        editor.on('component:resize', ({ type }) => window.__resizes.push(type));
        // As the studio's fit() does (app.mjs:128).
        editor.Canvas.setCoords(0, 24);
        resolve();
      } });
  }), [html, css, bodyClass, frame]);
  // A coords change hides the tools and restarts select-comp 300 ms later
  // (grapes.mjs:31774-31781). Wait for that before any click or drag.
  await expect.poll(() => page.evaluate(() => window.__ed.Canvas.getCanvasView().toolsWrapper.style.display), { message: 'tools shown again after setCoords' }).toBe('');
  await expect.poll(() => page.evaluate(() => window.__ed.Commands.isActive('select-comp'))).toBe(true);
}
const nextFrames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const setDevice = async (page, name) => {
  await page.evaluate(name => { window.__ed.setDevice(name); }, name);
  await expect.poll(() => page.evaluate(() => window.__ed.Canvas.getWindow().innerWidth)).toBe(name === 'Mobil' ? 390 : 1440);
  await nextFrames(page);
};
const select = (page, selector) => page.evaluate(selector => { window.__ed.select(window.__ed.getWrapper().find(selector)[0]); }, selector);
const undoSize = page => page.evaluate(() => window.__ed.UndoManager.getStack().length);

// The CSS the editor would save, split into the global and the phone rule of #box.
const boxRules = page => page.evaluate(() => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(window.__ed.getCss());
  const read = rule => Object.fromEntries([...rule.style].map(name => [name, rule.style.getPropertyValue(name).replace(/\s+/g, '')]));
  const out = { global: {}, mobile: {} };
  for (const rule of sheet.cssRules) {
    if (rule.selectorText === '#box') out.global = read(rule);
    else if (rule.cssRules) for (const inner of rule.cssRules) if (inner.selectorText === '#box') out.mobile = read(inner);
  }
  return out;
});
const boxSize = page => page.evaluate(() => {
  const el = window.__ed.getWrapper().find('#box')[0].getEl(), box = el.getBoundingClientRect();
  return { width: box.width, height: box.height, content: el.lastElementChild ? el.lastElementChild.getBoundingClientRect().bottom - box.top : 0 };
});
// Real mouse drag on the selected component's bottom-right handle; returns undo entries added.
let lastDrag = '';
async function dragCorner(page, dx, dy) {
  const handle = page.locator('.gjs-resizer-h-br');
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox(), x = box.x + box.width / 2, y = box.y + box.height / 2, before = await undoSize(page);
  await page.evaluate(() => { window.__resizes.length = 0; });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
  await nextFrames(page);
  const added = await undoSize(page) - before;
  // Seen state for assertion messages: resize events fired and the selection.
  lastDrag = `drag(${dx},${dy}) resize events ${JSON.stringify(await page.evaluate(() => window.__resizes))}, selected ${await page.evaluate(() => window.__ed.getSelected()?.get('tagName'))}`;
  return added;
}

const BOX = '<section><div id="box"><p>Rad ett</p><p>Rad två</p></div></section><section id="next"><p>Nästa</p></section>';
const STARTS = {
  'global height': '#box{height:600px}',
  'phone-only height': '@media (max-width:760px){#box{height:600px}}',
  'global and phone height': '#box{height:600px}@media (max-width:760px){#box{height:500px}}',
};
const RULE = { Dator: 'global', Mobil: 'mobile' };
const px = value => Number.parseFloat(value);

for (const [label, css] of Object.entries(STARTS)) for (const device of ['Dator', 'Mobil']) {
  test(`A2 resize on ${device} from ${label}: shrink leaves the content height, enlarge sets a floor`, async ({ page }) => {
    await openStudio(page, { html: BOX, css });
    await setDevice(page, device);
    await select(page, '#box');
    const key = RULE[device], other = key === 'global' ? 'mobile' : 'global', start = await boxRules(page), startSize = await boxSize(page);

    // Smaller than the content (80 px): the box falls back to its content.
    expect(await dragCorner(page, -120, 40 - startSize.height), `undo entries; ${lastDrag}`).toBe(1);
    let rules = await boxRules(page), size = await boxSize(page);
    expect(rules[key].height).toBe('auto');
    expect(rules[key]['min-height']).toMatch(/^\d+(\.\d+)?px$/);
    expect(rules[key].width).toMatch(/^min\(\d+(\.\d+)?px,100%\)$/);
    expect(rules[other]).toEqual(start[other]);
    expect(Math.abs(size.height - size.content)).toBeLessThanOrEqual(1);

    // Larger than the content: the dragged height is a floor.
    const shrunk = rules;
    const floor = px(rules[key]['min-height']);
    expect(await dragCorner(page, 0, 300), `undo entries; ${lastDrag}`).toBe(1);
    rules = await boxRules(page); size = await boxSize(page);
    expect(rules[key].height).toBe('auto');
    expect(px(rules[key]['min-height'])).toBeGreaterThan(floor + 250);
    expect(Math.abs(size.height - px(rules[key]['min-height']))).toBeLessThanOrEqual(1);
    expect(rules[other]).toEqual(start[other]);
    const saved = await page.evaluate(() => window.__ed.getCss());
    expect(() => validateCss(saved)).not.toThrow();
    // One drag is one undo step: undo restores the rules after the shrink drag.
    await page.evaluate(() => { window.__ed.UndoManager.undo(); });
    expect(await boxRules(page), 'one undo reverts the enlarge drag').toEqual(shrunk);
  });
}

for (const boxSizing of ['content-box', 'border-box']) for (const device of ['Dator', 'Mobil']) {
  test(`A2 resize on ${device} with ${boxSizing}, padding and border follows the rendered box`, async ({ page }) => {
    await openStudio(page, { html: `<main>${BOX}</main>`, css: `#box{box-sizing:${boxSizing};width:240px;height:180px;padding:12px 18px;border:3px solid #369}` });
    await setDevice(page, device);
    await select(page, '#box');
    const before = await boxSize(page), rulesBefore = await boxRules(page), key = RULE[device];
    expect(await dragCorner(page, 30, 100), lastDrag).toBe(1);
    const after = await boxSize(page), rules = await boxRules(page);
    expect(Math.abs(after.width - before.width - 30)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.height - before.height - 100)).toBeLessThanOrEqual(1);
    expect(rules[key].height).toBe('auto');
    expect(px(rules[key]['min-height'])).toBeCloseTo(280, 0);
    const saved = await page.evaluate(() => window.__ed.getCss());
    expect(() => validateCss(saved)).not.toThrow();
    await page.evaluate(() => window.__ed.UndoManager.skip(() => window.__ed.getWrapper().find('main')[0].addStyle({ width: '200px' })));
    expect((await boxSize(page)).width).toBeCloseTo(200, 0);
    await page.evaluate(() => { window.__ed.UndoManager.undo(); });
    expect(await boxRules(page)).toEqual(rulesBefore);
    expect(await boxSize(page)).toEqual(before);
  });
}

test('A2 saved rules and heights are identical after reload', async ({ page }) => {
  await openStudio(page, { html: BOX, css: STARTS['global and phone height'] });
  for (const [device, dy] of [['Dator', -300], ['Mobil', 120]]) {
    await setDevice(page, device);
    await select(page, '#box');
    await dragCorner(page, -80, dy);
  }
  const saved = await page.evaluate(() => window.__studio.snapshot(true));
  const rules = await boxRules(page);
  await setDevice(page, 'Dator');
  const dator = await boxSize(page);
  await setDevice(page, 'Mobil');
  const mobil = await boxSize(page);
  expect(() => validateCss(saved.css)).not.toThrow();
  await openStudio(page, { html: saved.html, css: saved.css });
  await setDevice(page, 'Dator');
  expect((await boxSize(page)).height).toBeCloseTo(dator.height, 0);
  await setDevice(page, 'Mobil');
  expect((await boxSize(page)).height).toBeCloseTo(mobil.height, 0);
  expect(await boxRules(page)).toEqual(rules);
});

test('A2 an SVG icon shrinks to 50x50 and an image keeps its proportions', async ({ page }) => {
  await openStudio(page, { html: '<svg id="box" viewBox="0 0 100 100" width="100" height="100"><path d="M0 0h100v100H0z"/></svg><img id="pic" src="/pic.svg" alt="">', css: '' });
  await select(page, '#box');
  expect(await dragCorner(page, -50, -50), `undo entries; ${lastDrag}`).toBe(1);
  const icon = await boxSize(page);
  expect(icon.width).toBeCloseTo(50, 0);
  expect(icon.height).toBeCloseTo(50, 0);

  await select(page, '#pic');
  await expect(page.locator('.gjs-resizer-h-br')).toBeVisible();
  expect(await dragCorner(page, -100, -50), `undo entries; ${lastDrag}`).toBe(1);
  const pic = await page.evaluate(() => {
    const component = window.__ed.getWrapper().find('#pic')[0], box = component.getEl().getBoundingClientRect();
    return { width: box.width, height: box.height, style: component.getStyle() };
  });
  expect(pic.width).toBeCloseTo(100, 0);
  expect(pic.height).toBeCloseTo(50, 0);
  expect(pic.style.height).toBe('auto');
  expect(pic.style['min-height']).toBeUndefined();
});

test('main text capture preserves the trusted noscript source across native editing', async ({ page, browserName }, info) => {
  const prepared = preparePage('<body><header><p id="frame-heading">Sidram</p></header><main id="main"><h1 id="heading">Före</h1><noscript><p class="noscript-note">JavaScript är avstängt. Rävar &amp; kaffe. &lt;em&gt;ord&lt;/em&gt; &amp;lt;bevara&amp;gt; &quot;citat&quot; <a href="/om/" title="ett &quot;citat&quot; &amp; värde">Läs mer</a></p></noscript></main><footer><p>Avslutning</p></footer></body>');
  const split = splitPage(prepared.html), frame = { html: split.html, css: '' };
  const fallback = prepared.contracts.find(contract => contract.fallback).fallback;
  expect(() => validateHtml(prepared.html, prepared.contracts)).not.toThrow();
  expect(() => validateHtml(prepared.html.replace(fallback, fallback.replace('JavaScript', 'Ändrat innehåll')), prepared.contracts)).toThrow('JavaScript-fallback får bara komma från den skyddade källmallen.');
  await openStudio(page, { html: split.page, frame });
  const capture = () => page.evaluate(([html, frame]) => {
    const wrapper = window.__ed.getWrapper().getInnerHTML();
    const inert = new DOMParser().parseFromString(`<template>${wrapper}</template>`, 'text/html').querySelector('template').innerHTML;
    const live = window.liveHtml(window.__ed, null), snapshot = window.__studio.snapshot(true);
    const combined = snapshot.frame.html.replace('<main></main>', snapshot.html);
    const sources = { original: html, composed: window.composeEditorPage({ html, path: '/t/' }, frame).html, wrapper, inert, live, snapshot: combined };
    const fallback = source => [...source.matchAll(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi)].slice(0, 4).map(match => ({ bytes: new TextEncoder().encode(match[0]).byteLength, source: match[0].slice(0, 2048) }));
    return { html: combined, stages: Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, fallback(source)])) };
  }, [split.page, frame]);
  const before = await capture();
  const heading = page.frameLocator('iframe.gjs-frame').locator('#heading');
  await heading.dblclick();
  await expect(heading).toHaveAttribute('contenteditable', 'true');
  await heading.press('ControlOrMeta+A');
  await heading.pressSequentially('Efter');
  const after = await capture();
  let rejection;
  try { validateHtml(after.html, prepared.contracts); } catch (error) { rejection = error.message; }
  if (rejection || JSON.stringify(before.stages.composed) !== JSON.stringify(before.stages.original)) await info.attach('trusted-fallback-capture.json', { contentType: 'application/json', body: JSON.stringify({ browserName, rejection, before: before.stages, after: after.stages }, null, 2) });
  expect(before.stages.composed).toEqual(before.stages.original);
  expect(after.html).toContain('Efter');
  expect(rejection, 'A native main edit must retain the original trusted fallback; inspect trusted-fallback-capture.json for the first changed stage').toBeUndefined();
  expect(after.stages.snapshot).toEqual(before.stages.original);
  const frameHeading = page.frameLocator('iframe.gjs-frame').locator('#frame-heading');
  await frameHeading.dblclick();
  await expect(frameHeading).toHaveAttribute('contenteditable', 'true');
  await frameHeading.press('ControlOrMeta+A');
  await frameHeading.pressSequentially('Ändrad sidram');
  const frameEdit = await capture();
  expect(frameEdit.html).toContain('Efter');
  expect(frameEdit.html).toContain('Ändrad sidram');
  expect(() => validateHtml(frameEdit.html, prepared.contracts)).not.toThrow();
  expect(frameEdit.stages.snapshot).toEqual(before.stages.original);
});

test('framed capture preserves incoming fallback tampering for authoritative rejection', async ({ page }) => {
  const prepared = preparePage('<body><header><p>Sidram</p></header><main id="main"><h1 id="heading">Före</h1><noscript><p>JavaScript är avstängt.</p></noscript></main><footer><p>Slut</p></footer></body>');
  const fallback = prepared.contracts.find(contract => contract.fallback).fallback;
  const forged = prepared.html.replace(fallback, fallback.replace('JavaScript är avstängt.', 'Ersatt av ett obetrott utkast.'));
  const split = splitPage(forged);
  await openStudio(page, { html: split.page, frame: { html: split.html, css: '' } });
  const captured = await page.evaluate(() => {
    window.__ed.getWrapper().find('#heading')[0].components('Efter');
    const snapshot = window.__studio.snapshot(true);
    return snapshot.frame.html.replace('<main></main>', snapshot.html);
  });
  expect(captured).toContain('Efter');
  expect(captured).toContain('Ersatt av ett obetrott utkast.');
  expect(() => validateHtml(captured, prepared.contracts)).toThrow('JavaScript-fallback får bara komma från den skyddade källmallen.');
});

const WORD = '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body><!--StartFragment--><p class=MsoNormal style="margin:0cm"><span style="font-size:12.0pt">Rad ett<o:p></o:p></span></p><p class=MsoNormal><span style="font-size:12.0pt">Rad två<o:p></o:p></span></p><!--EndFragment--></body></html>';
const DOCS = `<meta charset='utf-8'><b style="font-weight:normal;" id="docs-internal-guid-1"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000">Rad ett</span><br><span style="font-size:11pt;font-family:Arial,sans-serif;color:#ff0000">Rad två</span></b>`;
for (const [source, html] of [['Word', WORD], ['Google Docs', DOCS]]) {
  test(`A5 pasting ${source} gives plain text with <br> that passes validation`, async ({ page }) => {
    await openStudio(page, { html: '<div><p id="t">Före</p></div>' });
    const canvas = page.frameLocator('iframe.gjs-frame');
    // A user selects the text, then double-clicks it.
    await canvas.locator('#t').click();
    await expect.poll(() => page.evaluate(() => window.__ed.getSelected()?.get('tagName')), { message: 'selected tagName after clicking #t' }).toBe('p');
    await canvas.locator('#t').dblclick();
    await expect(canvas.locator('#t'), 'RTE enabled by dblclick').toHaveAttribute('contenteditable', 'true');
    const result = await canvas.locator('#t').evaluate((el, [html]) => {
      const doc = el.ownerDocument, win = doc.defaultView, selection = doc.getSelection(), range = doc.createRange();
      el.focus(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
      const data = new win.DataTransfer();
      data.setData('text/plain', 'Rad ett\nRad två');
      data.setData('text/html', html);
      const event = new win.ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
      // Firefox gives a script-made paste event an empty clipboardData; attach ours.
      Object.defineProperty(event, 'clipboardData', { value: data });
      el.dispatchEvent(event);
      return el.innerHTML;
    }, [html]);
    // WebKit's insertHTML keeps a placeholder <br> after the last line.
    expect(result.replace(/<br>$/, ''), 'innerHTML after paste').toBe('Rad ett<br>Rad två');
    const saved = await page.evaluate(() => window.__studio.snapshot(true));
    expect(saved.html).not.toMatch(/o:p|class=|style=|<!--/);
    expect(() => validateHtml(saved.html)).not.toThrow();
  });
}

test('A12 shapes inside the managed SVG are selectable, the root stays fixed and a group still resizes', async ({ page }) => {
  await openStudio(page, { bodyClass: 'cms-svg-editor', html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400"><g id="grp"><path id="shape" d="M10 10h40v40H10z" fill="#0000ff"/></g><circle id="dot" cx="75" cy="75" r="10" fill="#00ff00"/></svg>' });
  const selected = () => page.evaluate(() => window.__ed.getSelected()?.get('tagName'));
  const shape = page.frameLocator('iframe.gjs-frame').locator('#shape');
  await shape.hover();
  const hovered = await page.evaluate(() => window.__ed.getModel().get('componentHovered')?.get('tagName'));
  await shape.click();
  await expect.poll(selected, { message: `selected tagName after clicking #shape (hovered before click: ${hovered})` }).toBe('path');
  expect(await page.evaluate(() => window.__ed.getWrapper().find('svg')[0].get('resizable'))).toBe(false);

  await page.evaluate(() => { window.__ed.getSelected().addAttributes({ fill: '#ff0000' }); });
  const fill = id => page.evaluate(id => window.__ed.getWrapper().find(id)[0].getAttributes().fill, id);
  expect(await fill('#shape')).toBe('#ff0000');
  expect(await fill('#dot')).toBe('#00ff00');

  await select(page, '#grp');
  const transform = () => page.evaluate(() => window.__ed.getWrapper().find('#grp')[0].getAttributes().transform ?? '');
  const before = await transform();
  // A12b: one drag is one undo step, one undo restores the pre-drag transform, and the group's rule gets no width/height.
  expect(await dragCorner(page, 60, 60), `undo entries; ${lastDrag}`).toBe(1);
  expect(await transform(), `g transform; ${lastDrag}`).toMatch(/scale\(/);
  const style = await page.evaluate(() => window.__ed.getWrapper().find('#grp')[0].getStyle());
  expect(Object.keys(style).filter(name => ['width', 'height'].includes(name)), `g style ${JSON.stringify(style)}`).toEqual([]);
  await page.evaluate(() => { window.__ed.UndoManager.undo(); });
  expect(await transform(), 'g transform after one undo').toBe(before);
});

// A4: the default RTE action bar. Link and Wrap hand their text to insertHTML as plain text, so each action gets its own paragraph.
const RTE_ACTIONS = [['Bold', /<b\b/], ['Italic', /<i\b/], ['Underline', /<u\b/], ['Strike-through', /<strike\b/],['Link', /<a\b[^>]*href=""/], ['Wrap for style', /<span\b/]];
test('A4 all six RTE actions save, a link with an address saves and an empty link is found and selected', async ({ page }) => {
  await openStudio(page, { html: RTE_ACTIONS.map((_, index) => `<p id="r${index}">Text ${index}</p>`).join('') });
  const canvas = page.frameLocator('iframe.gjs-frame');
  for (const [index, [title]] of RTE_ACTIONS.entries()) {
    await canvas.locator(`#r${index}`).click();
    await expect.poll(() => page.evaluate(() => window.__ed.getSelected()?.get('tagName')), { message: `selected tagName after clicking #r${index}` }).toBe('p');
    await canvas.locator(`#r${index}`).dblclick();
    await expect(canvas.locator(`#r${index}`), `RTE enabled for ${title}`).toHaveAttribute('contenteditable', 'true');
    await canvas.locator(`#r${index}`).evaluate(el => {
      const doc = el.ownerDocument, selection = doc.getSelection(), range = doc.createRange();
      el.focus(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
    });
    await page.locator(`.gjs-rte-action[title="${title}"]`).click();
  }
  // The link action disables the RTE and selects the new anchor, as the inspector then shows #element-href.
  const open = () => page.evaluate(() => window.__ed.getWrapper().find("a[href='']").length);
  expect(await open(), 'anchors without an address').toBe(1);
  const saved = await page.evaluate(() => window.__studio.snapshot(true));
  for (const [title, pattern] of RTE_ACTIONS) expect(saved.html, title).toMatch(pattern);
  expect(() => validateHtml(saved.html), 'an empty link must not be publishable').toThrow('Länken har en otillåten adress.');
  await page.evaluate(() => { const link = window.__ed.getWrapper().find("a[href='']")[0]; window.__ed.select(link); });
  expect(await page.evaluate(() => window.__ed.getSelected()?.get('tagName')), 'the empty link is selected').toBe('a');
  await page.evaluate(() => { window.__ed.getSelected().addAttributes({ href: '/om/' }); });
  expect(await open(), 'anchors without an address after typing /om/').toBe(0);
  const fixed = await page.evaluate(() => window.__studio.snapshot(true));
  expect(() => validateHtml(fixed.html)).not.toThrow();
  expect(fixed.html).toContain('href="/om/"');
});

test('Backspace and Delete remove a fully selected text block', async ({ page }) => {
  for (const key of ['Backspace', 'Delete']) {
    await openStudio(page, { html: '<div><p id="t">Hela texten</p></div>' });
    const canvas = page.frameLocator('iframe.gjs-frame');
    await canvas.locator('#t').click();
    await expect.poll(() => page.evaluate(() => window.__ed.getSelected()?.get('tagName')), { message: `selected tagName after clicking #t before ${key}` }).toBe('p');
    await canvas.locator('#t').dblclick();
    await expect(canvas.locator('#t'), `RTE enabled by dblclick before ${key}`).toHaveAttribute('contenteditable', 'true');
    await canvas.locator('#t').evaluate(el => {
      const doc = el.ownerDocument, selection = doc.getSelection(), range = doc.createRange();
      el.focus(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range);
    });
    await page.keyboard.press(key);
    await expect.poll(() => canvas.locator('#t').evaluate(el => el.textContent.trim()), { message: `text left after ${key}` }).toBe('');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => canvas.locator('#t').evaluate(el => el.textContent.trim()), { message: `text after undo of ${key}` }).toBe('Hela texten');
  }
});


for (const framed of [false, true]) test(`B8: untouched ${framed ? 'framed' : 'legacy'} page switches leave Draft, undo and Save unchanged`, async ({ page }) => {
  await openStudio(page, { html: '<main id="main"><h1>Start</h1></main>' });
  const result = await page.evaluate(async framed => {
    window.__studio.destroy();
    const pages = ['a', 'b'].map(id => ({ id, path: `/${id}/`, bodyClass: 'page-test', html: `<main tabindex='-1' id='main'>\n  <h1 title='Rubrik' id='title'>${id.toUpperCase()}</h1>\n</main>`, css: '', project: null }));
    const project = { schemaVersion: framed ? 2 : 1, pages, cards: [], ...(framed ? { frame: { html: '<header id="header">Sidram</header><main></main><footer id="footer">Avslutning</footer>', css: '' } } : {}) };
    const draft = new window.Draft(project, 185);
    let notifications = 0;
    const open = id => new Promise(resolve => {
      const item = draft.project.pages.find(page => page.id === id);
      window.__studio = window.createEditor({ page: item, frame: draft.project.frame, cssPath: '/canvas.css', assets: [], onSelect() {},
        onChange(values) {
          notifications++;
          const { frame, ...content } = values, previous = draft.project.pages.find(page => page.id === id), next = { ...previous, ...content };
          const frameChanged = frame && JSON.stringify(frame) !== JSON.stringify(draft.project.frame);
          if (JSON.stringify(previous) === JSON.stringify(next) && !frameChanged) return;
          draft.change({ ...draft.project, pages: draft.project.pages.map(page => page.id === id ? next : page), ...(frameChanged ? { frame } : {}) }, frameChanged ? 'frame' : `page-${id}`);
        }, onReady(editor) { window.__ed = editor; resolve(); },
      });
    });
    await open('a');
    const normalized = window.__studio.snapshot(true).html !== pages[0].html;
    for (const id of ['b', 'a']) { window.__studio.destroy(); await open(id); }
    window.__studio.destroy();
    return { notifications, normalized, dirty: draft.dirty, generation: draft.generation, undo: draft.undoStack.length, redo: draft.redoStack.length, unchanged: draft.project === project, save: draft.beginSave() };
  }, framed);
  if (!framed) expect(result.normalized, 'The stored single-quoted HTML deliberately differs from GrapesJS serialization').toBe(true);
  expect(result.notifications).toBe(0);
  expect(result.dirty).toBe(false);
  expect(result.generation).toBe(0);
  expect(result.undo).toBe(0);
  expect(result.redo).toBe(0);
  expect(result.unchanged).toBe(true);
  expect(result.save).toBeNull();
});

for (const consumer of ['svg', 'win']) test(`B8: leaving an untouched ${consumer} editor emits no change and stays clean`, async ({ page }) => {
  await openStudio(page, { html: '<main id="main"><h1>Start</h1></main>' });
  const result = await page.evaluate(async consumer => {
    window.__studio.destroy();
    const html = consumer === 'svg' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path id="shape" fill="#123456" d="M0 0h100v100H0z"/></svg>' : "<div id='card'><p data-card-text>En liten vinst.</p></div>";
    const design = { html, css: '', project: null }, svgDraft = { ...design, dirty: false };
    const draft = new window.Draft({ schemaVersion: 2, pages: [], cards: [{ id: 'win', text: 'En liten vinst.', design }] }, 185);
    let notifications = 0;
    await new Promise(resolve => {
      window.__studio = window.createEditor({ page: { ...design, path: consumer === 'svg' ? '/media/source.svg' : '/verkstad/', bodyClass: consumer === 'svg' ? 'cms-svg-editor' : 'page-win' }, cssPath: '/canvas.css', assets: [], onSelect() {},
        onChange(values) {
          notifications++;
          if (consumer === 'svg') { svgDraft.html = values.html; svgDraft.css = values.css; svgDraft.dirty = true; }
          else {
            const document = new DOMParser().parseFromString(values.html, 'text/html');
            document.querySelectorAll('[data-card-text] br').forEach(br => br.replaceWith('\n'));
            const text = document.querySelector('[data-card-text]')?.textContent ?? draft.project.cards[0].text;
            draft.change({ ...draft.project, cards: [{ ...draft.project.cards[0], text, design: values }] }, 'win-win');
          }
        }, onReady(editor) {
          window.__ed = editor;
          if (consumer === 'svg') { window.__studio.setStyleMode('svg'); editor.select(editor.getWrapper().find('svg')[0]); }
          else editor.getWrapper().find('[data-card-text]')[0].set({ removable: false, copyable: false });
          resolve();
        },
      });
    });
    // Clean SVG navigation retains svgDraft while clearEditor destroys the editor.
    if (consumer === 'svg') window.__studio.flush();
    const navigationAllowed = !svgDraft.dirty;
    window.__studio.destroy();
    return { notifications, navigationAllowed, svgDirty: svgDraft.dirty, svgUnchanged: svgDraft.html === html && svgDraft.css === '', dirty: draft.dirty, undo: draft.undoStack.length, save: draft.beginSave() };
  }, consumer);
  expect(result.notifications).toBe(0);
  if (consumer === 'svg') {
    expect(result.navigationAllowed).toBe(true);
    expect(result.svgDirty).toBe(false);
    expect(result.svgUnchanged).toBe(true);
  }
  expect(result.dirty).toBe(false);
  expect(result.undo).toBe(0);
  expect(result.save).toBeNull();
});

test('B8: a synchronous edit after ready is captured on immediate close before the dirty count advances', async ({ page }) => {
  await openStudio(page, { html: '<main id="main"><h1>Start</h1></main>' });
  const result = await page.evaluate(async () => {
    window.__studio.destroy();
    const changes = [];
    await new Promise(resolve => {
      window.__studio = window.createEditor({ page: { html: '<main id="main"><h1 id="title">Före</h1></main>', css: '', path: '/', bodyClass: '' }, frame: { html: '<header>Sidram</header><main></main><footer>Avslutning</footer>', css: '' }, cssPath: '/canvas.css', assets: [], onSelect() {}, onChange(values) { changes.push(values); },
        onReady(editor) { window.__ed = editor; resolve(); },
      });
    });
    window.__ed.getWrapper().find('#title')[0].components('Sista ändringen.');
    const dirty = window.__ed.getDirtyCount();
    window.__studio.destroy();
    return { dirty, changes };
  });
  expect(result.dirty).toBe(0);
  expect(result.changes).toHaveLength(1);
  expect(result.changes[0].html).toContain('Sista ändringen.');
});

test('B8: native frame edits survive page switch, device styling and Draft undo', async ({ page }) => {
  await openStudio(page, { html: '<main id="main"><h1>A</h1></main>' });
  await page.evaluate(async () => {
    window.__studio.destroy();
    const flower = id => '<svg id="' + id + '" class="brand-mark"><polygon points="0,0 20,0 10,20" fill="currentColor"></polygon></svg>';
    const frame = { html: '<header id="fh" data-cms-node="f-n0">' + flower('logo-a') + '</header><main></main><footer id="ff"><p id="closing" data-cms-node="f-n318">Thanks for stopping by.</p><p id="move">Flytta mig</p>' + flower('logo-b') + '</footer>', css: '' };
    window.__draft = new window.Draft({ schemaVersion: 2, frame, pages: [{ id: 'a', path: '/a/', bodyClass: '', html: '<main id="main"><h1>A</h1></main>', css: '', project: null }, { id: 'b', path: '/b/', bodyClass: '', html: '<main id="main"><h1>B</h1></main>', css: '', project: null }], cards: [] }, 185);
    window.__openFramePage = id => new Promise(resolve => {
      const item = window.__draft.project.pages.find(item => item.id === id);
      window.__studio = window.createEditor({ page: item, frame: window.__draft.project.frame, cssPath: '/canvas.css', assets: [],
        onChange(values) {
          const { frame, ...content } = values;
          window.__draft.change({ ...window.__draft.project, frame, pages: window.__draft.project.pages.map(page => page.id === id ? { ...page, ...content } : page) }, 'frame');
        },
        onSelect() {}, onReady(editor) { window.__ed = editor; window.__resizes = []; editor.on('component:resize', ({ type }) => window.__resizes.push(type)); resolve(); },
      });
    });
    await window.__openFramePage('a');
  });
  await expect(page.frameLocator('.gjs-frame').locator('#ff')).toHaveCount(1);
  await page.evaluate(() => {
    const editor = window.__ed;
    editor.getWrapper().find('#ff')[0].addStyle({ 'min-height': '300px' });
    editor.getWrapper().find('#closing')[0].components('En gemensam avslutning.');
    editor.getWrapper().find('#move')[0].move(editor.getWrapper().find('#ff')[0], { at: 0 });
    const added = editor.getWrapper().find('#ff')[0].append('<p>Ny ramnod</p>')[0];
    const copy = added.clone();
    editor.getWrapper().find('#ff')[0].append(copy);
    window.__newFrameKeys = [added, copy].map(node => node.getAttributes()['data-cms-node']);
    editor.getWrapper().find('#logo-a')[0].addStyle({ color: '#123456' });
    window.__studio.flush(true);
  });
  await expect.poll(() => page.evaluate(() => {
    const doc = window.__ed.Canvas.getDocument();
    return [...doc.querySelectorAll('.brand-mark')].map(node => getComputedStyle(node).color);
  })).toEqual(['rgb(18, 52, 86)', 'rgb(18, 52, 86)']);
  await page.evaluate(async () => { window.__studio.destroy(); await window.__openFramePage('b'); });
  const canvas = page.frameLocator('.gjs-frame');
  await expect(canvas.locator('#closing')).toHaveText('En gemensam avslutning.');
  await expect(canvas.locator('#ff')).toHaveCSS('min-height', '300px');
  const keys = await page.evaluate(() => ({ created: window.__newFrameKeys, saved: window.__draft.project.frame.html, existing: window.__ed.getWrapper().find('#closing')[0].getAttributes()['data-cms-node'], loaded: window.__ed.getWrapper().find('p').map(node => node.getAttributes()['data-cms-node']) }));
  expect(keys.existing).toBe('f-n318');
  expect(new Set(keys.created).size).toBe(2);
  for (const key of keys.created) {
    expect(key).toMatch(/^u-[0-9a-f]{32}$/);
    expect(keys.saved).toContain(`data-cms-node="${key}"`);
    expect(keys.loaded).toContain(key);
  }
  expect(await canvas.locator('#ff').evaluate(node => node.firstElementChild.id)).toBe('move');
  const delta = await page.evaluate(() => window.__draft.beginSave().changes);
  expect(Object.keys(delta)).toEqual(['frame']);
  await page.evaluate(async () => {
    window.__studio.destroy(); window.__draft.undo(); await window.__openFramePage('b');
  });
  await expect(canvas.locator('#closing')).toHaveText('Thanks for stopping by.');
  for (const key of keys.created) await expect(canvas.locator(`[data-cms-node="${key}"]`)).toHaveCount(0);
  await page.evaluate(async () => { window.__studio.destroy(); window.__draft.redo(); await window.__openFramePage('b'); });
  await expect(canvas.locator('#closing')).toHaveText('En gemensam avslutning.');
  for (const key of keys.created) await expect(canvas.locator(`[data-cms-node="${key}"]`)).toHaveText('Ny ramnod');
  await page.evaluate(key => {
    window.__ed.getWrapper().find(`[data-cms-node="${key}"]`)[0].components('Redigerad ramnod');
    window.__studio.flush(true);
  }, keys.created[0]);
  await expect(canvas.locator(`[data-cms-node="${keys.created[0]}"]`)).toHaveText('Redigerad ramnod');
  expect(await page.evaluate(key => {
    const template = document.createElement('template');
    template.innerHTML = window.__draft.project.frame.html;
    return template.content.querySelector(`[data-cms-node="${key}"]`)?.textContent;
  }, keys.created[0])).toBe('Redigerad ramnod');
  await setDevice(page, 'Mobil');
  await page.evaluate(() => { window.__ed.getWrapper().find('#logo-b')[0].addStyle({ color: '#654321' }); window.__studio.flush(true); });
  await expect.poll(() => page.evaluate(() => [...window.__ed.Canvas.getDocument().querySelectorAll('.brand-mark')].map(node => getComputedStyle(node).color))).toEqual(['rgb(101, 67, 33)', 'rgb(101, 67, 33)']);
  await setDevice(page, 'Dator');
  await expect.poll(() => page.evaluate(() => [...window.__ed.Canvas.getDocument().querySelectorAll('.brand-mark')].map(node => getComputedStyle(node).color))).toEqual(['rgb(18, 52, 86)', 'rgb(18, 52, 86)']);
  await page.evaluate(() => { window.__ed.getWrapper().find('#logo-b polygon')[0].addAttributes({ fill: '#abcdef' }); window.__studio.flush(true); });
  await expect.poll(() => page.evaluate(() => [...window.__ed.Canvas.getDocument().querySelectorAll('.brand-mark polygon')].map(node => getComputedStyle(node).fill))).toEqual(['rgb(171, 205, 239)', 'rgb(171, 205, 239)']);
  await select(page, '#ff');
  await nextFrames(page);
  expect(await page.evaluate(() => window.__ed.StyleManager.getSectors().length)).toBe(6);
  expect(await page.evaluate(() => window.__ed.getSelected().get('layerable'))).toBe(true);
  // Content can exceed min-height; the native handle starts at the rendered edge.
  const height = () => canvas.locator('#ff').evaluate(node => node.getBoundingClientRect().height);
  const beforeHeight = await height();
  expect(beforeHeight).toBeGreaterThan(await canvas.locator('#ff').evaluate(node => parseFloat(getComputedStyle(node).minHeight)));
  expect(await dragCorner(page, 0, 100), lastDrag).toBe(1);
  expect(Math.abs(await height() - beforeHeight - 100)).toBeLessThanOrEqual(1);
  const resized = await page.evaluate(() => window.__studio.snapshot(true));
  expect(resized.frame.css).toMatch(/#ff\{[^}]*min-height:/);
  expect(resized.css).not.toContain('#ff');
});

test('B8: CssComposer follows a component across main, keeps clone rules and surfaces unknown ownership without discarding the editor', async ({ page }) => {
  await openStudio(page, { html: '<main id="main"><h1>A</h1></main>' });
  const result = await page.evaluate(async () => {
    window.__studio.destroy();
    await new Promise(resolve => {
      window.__studio = window.createEditor({ page: { html: '<main id="main"><h1>A</h1><p id="owned">Flytta ut</p></main>', path: '/', css: '#owned{color:red}', bodyClass: '' }, frame: { html: '<header><p id="removable">Ta bort</p></header><main></main><footer id="target"></footer>', css: '#removable{color:blue}' }, cssPath: '/canvas.css', assets: [], onChange() {}, onSelect() {}, onError(error) { window.__frameError = error.message; }, onReady(editor) { window.__ed = editor; resolve(); } });
    });
    const editor = window.__ed, root = editor.getWrapper();
    root.find('#owned')[0].move(root.find('#target')[0]);
    root.find('#removable')[0].remove();
    const moved = window.__studio.snapshot(true);
    const copy = root.find('#owned')[0].clone();
    root.find('#target')[0].append(copy);
    const cloned = window.__studio.snapshot(true);
    window.__studio.flush(true);
    const rule = editor.Css.setRule('.ownerless', { color: 'red' });
    const dirtyBeforeClose = editor.getDirtyCount();
    let refused = false;
    try { window.__studio.destroy(); } catch { refused = true; }
    const kept = refused ? editor.getWrapper().find('#target').length : 0;
    if (refused) { editor.Css.getAll().remove(rule); window.__studio.flush(true); }
    return { moved, cloned, copyId: copy.getId(), dirtyBeforeClose, refused, kept, error: window.__frameError };
  });
  expect(result.moved.css).not.toContain('#owned');
  expect(result.moved.frame.css).toContain('#owned');
  expect(result.moved.frame.css).not.toContain('#removable');
  expect(result.cloned.frame.css).toContain('#' + result.copyId);
  expect(result.dirtyBeforeClose, 'GrapesJS defers its dirty count until after this immediate close').toBe(0);
  expect(result.refused).toBe(true);
  expect(result.kept).toBe(1);
  expect(result.error).toContain('saknar ägare');
});
