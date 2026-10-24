import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { validateCss, validateHtml } from '../src/cms/validation.mjs';

// The studio's own createEditor runs in a bare page, so the tests reach the
// GrapesJS editor (window.__ed) and the studio handle (window.__studio) without
// product code exposing them. Same file runs in chromium, firefox and webkit.
const ORIGIN = 'http://studio.test';
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
  const out = await build({ stdin: { contents: "import { createEditor } from './src/cms/client/editor.mjs'; window.createEditor = createEditor;", resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022' });
  harness = out.outputFiles[0].text;
  gjsCss = await readFile('node_modules/grapesjs/dist/css/grapes.min.css', 'utf8');
  studioCss = await readFile('src/cms/styles.css', 'utf8');
});

async function openStudio(page, { html, css = '', bodyClass = 'page-test' }) {
  await page.setViewportSize({ width: 1600, height: 1400 });
  await page.route(`${ORIGIN}/**`, route => {
    const files = { '/': ['text/html', SHELL], '/harness.js': ['text/javascript', harness], '/grapes.css': ['text/css', gjsCss], '/studio.css': ['text/css', studioCss], '/canvas.css': ['text/css', CANVAS_CSS], '/pic.svg': ['image/svg+xml', PIC] };
    const [type, body] = files[new URL(route.request().url()).pathname] ?? ['text/plain', 'missing'];
    return route.fulfill({ status: body === 'missing' ? 404 : 200, contentType: type, body });
  });
  await page.goto(`${ORIGIN}/`);
  await page.evaluate(([html, css, bodyClass]) => new Promise(resolve => {
    window.__studio = window.createEditor({ page: { html, css, path: '/t/', bodyClass }, cssPath: '/canvas.css', assets: [], onChange() {}, onSelect() {}, onAssetPick: null,
      onReady: editor => {
        window.__ed = editor; window.__resizes = [];
        editor.on('component:resize', ({ type }) => window.__resizes.push(type));
        // As the studio's fit() does (app.mjs:128).
        editor.Canvas.setCoords(0, 24);
        resolve();
      } });
  }), [html, css, bodyClass]);
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
  await dragCorner(page, 60, 60);
  expect(await page.evaluate(() => window.__ed.getWrapper().find('#grp')[0].getAttributes().transform), `g transform; ${lastDrag}`).toMatch(/scale\(/);
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
  }
});
