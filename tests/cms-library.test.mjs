import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { draftResourceText, assetReferenceCount, mediaGallery, assetDetail } from '../src/cms/client/library.mjs';
import { resourceReferences } from '../src/cms/resources.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';

const id = '12345678-1234-4123-8123-123456789abc';
const asset = { id, src: `/media/${id}.png`, mime: 'image/png', name: 'Min bild', state: 'active' };
const font = { ...asset, id: '22345678-1234-4123-8123-123456789abc', mime: 'font/woff2', name: 'Mitt typsnitt' };
font.src = `/media/${font.id}.woff2`;
const cases = {
  page: p => { p.pages[0].html = p.pages[0].html.replace('</main>', `<img src="${asset.src}" alt=""></main>`); },
  twice: p => { p.pages[0].html = p.pages[0].html.replace('</main>', `<img src="${asset.src}" alt=""><img src="${asset.src}" alt=""></main>`); },
  css: p => { p.pages[0].css = `#main{background:url(${asset.src})}`; },
  link: p => { p.pages[0].html = p.pages[0].html.replace('</main>', `<a href="${asset.src}">Bild</a></main>`); },
  frame: p => { p.frame.html += `<img src="${asset.src}" alt="">`; },
  frameCss: p => { p.frame.css = `.site-footer{background:url(${asset.src})}`; },
  win: p => { p.cards[0].design = { html: `<div><img src="${asset.src}" alt=""><span data-card-text>Vinst</span></div>`, css: '' }; },
  theme: p => { p.theme.fontFamily = `cms-font-${font.id}`; },
  slot: p => { p.resources.icon = asset.src; },
};

test('A11: one whole-draft serialization counts all reference domains and omits cached facts', () => {
  for (const [name, change] of Object.entries(cases)) {
    const project = structuredClone(initial);
    change(project);
    const checked = validateProject(project, seed);
    const item = name === 'theme' ? font : asset;
    const expected = name === 'twice' ? 2 : 1;
    assert.equal(resourceReferences(checked).get(item.src), expected, name);
    assert.equal(assetReferenceCount(draftResourceText(checked), item), expected, name);
    checked.pages[0].title = '';
    assert.equal(assetReferenceCount(draftResourceText(checked), item), expected, `${name}: incomplete draft`);
  }
});

function withDom(run) {
  const previous = globalThis.document;
  const targets = new Map(['#special-stage', '#custom-inspector'].map(key => [key, { innerHTML: '' }]));
  globalThis.document = { querySelector: key => targets.get(key) ?? null };
  try { run(targets); } finally { globalThis.document = previous; }
}

test('A11: built-ins and uploads have independent grids and exact visible counts, with usage badges and file chips', () => withDom(targets => {
  const builtin = { ...asset, id: 'builtin-icon', builtin: true, name: 'Original', src: '/favicon.svg' };
  const archived = { ...asset, id: 'archived', name: 'Arkiverad', state: 'archived' };
  const project = structuredClone(initial);
  project.resources.icon = asset.src;
  mediaGallery([builtin, asset, font, archived], '', 'active', { project });
  let nodes = elements(parseFragment(targets.get('#special-stage').innerHTML));
  const group = name => nodes.find(node => attribute(node, 'data-media-group') === name);
  const cards = root => elements(root).filter(node => attribute(node, 'data-asset-id') !== undefined);
  assert.equal(cards(group('builtin')).length, 1);
  assert.equal(cards(group('uploads')).length, 2);
  for (const name of ['builtin', 'uploads']) assert.equal(Number(attribute(group(name), 'data-visible-count')), cards(group(name)).length);
  assert.match(targets.get('#special-stage').innerHTML, /Webbplatsens bilder/);
  assert.match(targets.get('#special-stage').innerHTML, /Mina filer/);
  assert.match(targets.get('#special-stage').innerHTML, /Används/);
  assert.match(targets.get('#special-stage').innerHTML, /Oanvänd/);
  assert.equal(elements(group('builtin')).filter(node => attribute(node, 'data-media-state') !== undefined).length, 0);
  mediaGallery([builtin, asset, font], '', 'active', { project, kind: 'font' });
  nodes = elements(parseFragment(targets.get('#special-stage').innerHTML));
  assert.equal(cards(group('uploads')).length, 1);
  assert.equal(attribute(cards(group('uploads'))[0], 'data-asset-id'), font.id);
  assetDetail(builtin, { currentReferences: 1, historyReferences: null });
  assert.doesNotMatch(targets.get('#custom-inspector').innerHTML, /data-action="(?:archive|restore|trash|delete)-asset"/);
  assert.match(targets.get('#custom-inspector').innerHTML, /data-action="save-asset"/);
  assert.match(targets.get('#custom-inspector').innerHTML, /data-action="replace-asset"/);
}));
