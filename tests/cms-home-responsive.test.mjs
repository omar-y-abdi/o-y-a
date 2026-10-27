import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFragment } from 'parse5';
import * as css from 'css-tree';
import { seed } from '../.generated/cms-seed.mjs';
import { responsiveHomeCss, splitPage } from '../src/cms/frame.mjs';
import { toFrameProject, toLegacyProject } from '../src/cms/frame-converter.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { frameMigration } from '../scripts/cms-migrate-frame.mjs';

const legacy = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const home = legacy.pages.find(page => page.path === '/');
const main = splitPage(home.html).page;
const targets = {
  'ik4huf': 'div',
  'i3duo': 'div',
  'iqupj3': 'svg',
  'ire4ui': 'span',
  'iqcvri': 'section',
  'im2i7y': 'svg',
  'i24sl8': 'div',
  'i1wgyk': 'div',
  'iac4d6-2': 'svg',
  'i2c2wa': 'span',
  'iwyrnt': 'div',
  'ic5pt6': 'span',
  'idnt1i': 'span',
  'iu4i3t': 'svg',
  'iar5us': 'div',
  'ibd1n': 'p',
  'iu5xq': 'p',
  'ixal5': 'span',
  'i7idu7': 'span',
  'irsvkx': 'span',
};
const overflowing = new Set(['iqcvri', 'i1wgyk', 'ibd1n']);
const mobile = tree => tree.children.toArray().find(node => node.type === 'Atrule' && node.name === 'media' && css.generate(node.prelude).replace(/\s/g, '') === '(max-width:760px)');
const declarations = rule => Object.fromEntries(rule.block.children.toArray().filter(node => node.type === 'Declaration').map(node => [node.property, css.generate(node.value)]));
const rules = source => mobile(css.parse(source)).block.children.toArray();
function outsideMobile(source) {
  const query = mobile(css.parse(source, { positions: true }));
  return source.slice(0, query.loc.start.offset) + source.slice(query.loc.end.offset);
}
function withoutChanges(source) {
  const tree = css.parse(source, { positions: true }), edits = [];
  mobile(tree).block.children.forEach(rule => {
    const id = css.generate(rule.prelude).slice(1);
    rule.block.children.forEach(declaration => {
      if (id === 'iac4d6-2' && declaration.property === 'right') {
        edits.push({ start: declaration.loc.start.offset - 1, end: declaration.loc.end.offset, text: '' });
        return;
      }
      if (!(overflowing.has(id) && declaration.property === 'width' || id === 'i58p9l' && declaration.property === 'right')) return;
      const values = declaration.value.children;
      edits.push({ start: values.first.loc.start.offset, end: values.last.loc.end.offset, text: '<q9>' });
    });
  });
  return edits.sort((a, b) => b.start - a.start).reduce((result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end), source);
}

test('Q9: only three overflowing v185 Home widths and their two decoration offsets change', () => {
  const tags = new Map(elements(parseFragment(main)).map(node => [attribute(node, 'id'), node.tagName]));
  const before = rules(home.css), resized = responsiveHomeCss(home.css, main), after = rules(resized);
  const fixed = before.filter(rule => Object.keys(targets).some(id => css.generate(rule.prelude) === '#' + id));
  assert.equal(fixed.length, 20);
  assert.deepEqual(before.filter(rule => /^[0-9.]+px$/.test(declarations(rule).width)).map(rule => css.generate(rule.prelude)).sort(), Object.keys(targets).map(id => '#' + id).sort());
  assert.equal(after.length, before.length);
  for (const [index, rule] of before.entries()) {
    const id = css.generate(rule.prelude).slice(1), previous = declarations(rule);
    if (id === 'i58p9l') { assert.deepEqual(declarations(after[index]), { ...previous, right: 'max(-20px,calc(7px - (100vw - 100%)/2))' }); continue; }
    if (id === 'iac4d6-2') { assert.deepEqual(declarations(after[index]), { ...previous, right: 'min(0px,calc((100% - 303px)/2))' }); continue; }
    if (!Object.hasOwn(targets, id)) { assert.equal(css.generate(after[index]), css.generate(rule)); continue; }
    assert.equal(tags.get(id), targets[id], id);
    assert.deepEqual(declarations(after[index]), overflowing.has(id) ? { ...previous, width: `min(${previous.width},100%)` } : previous, id);
  }
  assert.equal(withoutChanges(resized), withoutChanges(home.css), 'All height, min-height, margin, translate, border, position and unrelated bytes stay identical');
  assert.equal(outsideMobile(resized), outsideMobile(home.css), 'Desktop CSS bytes stay identical');
  assert.match(resized, /#iqcvri\{width:min\(388px,100%\)\}/);
  assert.match(resized, /#i1wgyk\{width:min\(303px,100%\);height:362px\}/);
  assert.match(resized, /#ibd1n\{height:69px;width:min\(373px,100%\)\}/);
  assert.match(resized, /#iqupj3\{width:99px;height:52px\}/, 'The SVG in the shrink-to-fit machine-note keeps its definite width');
  assert.match(resized, /#im2i7y\{width:191px;height:177px\}/, 'The drawing fits the 201px card content box');
  assert.match(resized, /#i24sl8\{height:347px;width:249px\}/);
  assert.match(resized, /#iklgx\{translate:-19px\}/, 'Pre-existing left clipping stays unchanged');
  const converted = toFrameProject(legacy, seed);
  assert.equal(outsideMobile(converted.pages.find(page => page.path === '/').css), outsideMobile(home.css), 'The complete migration retains desktop CSS bytes');
});

test('Q9: transformation, repeated migration planning and forward/reverse round trips are idempotent', () => {
  const resized = responsiveHomeCss(home.css, main);
  assert.equal(responsiveHomeCss(resized, main), resized);
  const snapshot = { version: 185, project: legacy };
  const intent = frameMigration(snapshot, seed);
  assert.deepEqual(frameMigration(snapshot, seed), intent);
  assert.deepEqual(toFrameProject(intent.project, seed), intent.project);
  assert.throws(() => frameMigration({ version: 186, project: intent.project }, seed), /redan det valda formatet/);
  const reverse = validateProject(toLegacyProject(intent.project, seed), seed);
  const migrated = intent.project.pages.find(page => page.path === '/');
  assert.equal(reverse.pages.find(page => page.path === '/').css, intent.project.frame.css + migrated.css, 'Reverse keeps the approved responsive sizes');
  const again = validateProject(toFrameProject(reverse, seed), seed);
  assert.equal(again.pages.find(page => page.path === '/').css, migrated.css);
  assert.equal([...migrated.css.matchAll(/(?:^|[;{])width:[0-9.]+px(?=[;}])/g)].length, 17);
  assert.equal([...migrated.css.matchAll(/(?:^|[;{])height:[0-9.]+px(?=[;}])/g)].length, 26);
  assert.doesNotMatch(migrated.css + intent.project.frame.css, /#(?:iua9|iyi2x6)\{/);
});

test('Q9: image and box heights, min-heights, other media, frame rules, units and source spacing stay untouched', () => {
  const source = '/* desktop */ #photo { height: 9px }\n@media (max-width:760px) { #frame{height:41px} #photo { width: 300px; height: 200px } #iqcvri { width: 388px /* cap */ ; translate: 2px -1px } #box{height:40px;min-height:8px} #percent{width:90%;height:auto} }\n@media (max-width:759px){#iqcvri{width:280px;height:100px}}';
  const html = '<main><img id="photo"><section id="box"></section><section id="iqcvri"></section><div id="percent"></div></main>';
  const expected = source.replace('width: 388px', 'width: min(388px,100%)');
  assert.equal(responsiveHomeCss(source, html), expected);
  assert.equal(responsiveHomeCss(expected, html), expected);
  assert.equal(responsiveHomeCss('@media(max-width:760px){#iqcvri{width:388px!important;height:50px;min-height:8px}}', html), '@media(max-width:760px){#iqcvri{width:min(388px,100%)!important;height:50px;min-height:8px}}');
  for (const property of ['width', 'height']) {
    assert.throws(() => responsiveHomeCss(`@media(max-width:760px){#box{${property}:40px;${property}:50px}}`, html), { status: 422, message: 'Mobilstorleken #box på startsidan har dubbla deklarationer. Kontrollera regeln innan migreringen.' });
    for (const selector of ['#box img', '.unrelated', '#absent,#other']) {
      assert.throws(() => responsiveHomeCss(`@media(max-width:760px){${selector}{${property}:40px}}`, html), { status: 422, message: `Mobilstorleken ${selector} på startsidan saknar ett entydigt element. Kontrollera regeln innan migreringen.` });
    }
  }
});

test('Q9: only the v185 sticker offset is guarded, in the existing Mobile rule', () => {
  const source = '@media(max-width:760px){#i58p9l{position:absolute;bottom:-40px;right:-20px}}';
  const html = '<main><div id="i58p9l" class="human-sticker">Lite mer<br><strong>varför inte?</strong></div></main>';
  const expected = source.replace('right:-20px', 'right:max(-20px,calc(7px - (100vw - 100%)/2))');
  assert.equal(responsiveHomeCss(source, html), expected);
  assert.equal(responsiveHomeCss(expected, html), expected);
  assert.equal(responsiveHomeCss(source.replace('-20px', '-10px'), html), source.replace('-20px', '-10px'));
  assert.equal(responsiveHomeCss(source, '<main><div id="i58p9l"></div></main>'), source);
  assert.throws(() => responsiveHomeCss(source.replace('right:-20px', 'right:-21px;right:-20px'), html), { status: 422, message: 'Mobilstorleken #i58p9l på startsidan har dubbla deklarationer. Kontrollera regeln innan migreringen.' });
});

test('Q9: the flower retains its alignment with the centered card as their parent narrows', () => {
  const source = '@media(max-width:760px){#i1wgyk{width:303px;height:362px}#iac4d6-2{width:82px;height:87px}}';
  const html = '<main><div id="i1wgyk" class="human-art"><svg id="iac4d6-2" class="human-flower"></svg></div></main>';
  const expected = source.replace('width:303px', 'width:min(303px,100%)').replace('height:87px}', 'height:87px;right:min(0px,calc((100% - 303px)/2))}');
  assert.equal(responsiveHomeCss(source, html), expected);
  assert.equal(responsiveHomeCss(expected, html), expected);
  assert.equal(responsiveHomeCss(source.replace('303px', '290px'), html), expected.replaceAll('303px', '290px'), 'The offset derives from the stored parent width');
  assert.equal(responsiveHomeCss(source.replace('height:87px}', 'height:87px;}'), html), expected, 'An existing declaration terminator is retained');
  const authored = source.replace('height:87px}', 'height:87px;right:5px}');
  assert.equal(responsiveHomeCss(authored, html), authored.replace('width:303px', 'width:min(303px,100%)'), 'An authored offset stays authoritative');
  const unrelated = html.replace('class="human-flower"', 'class="flower"');
  assert.equal(responsiveHomeCss(source, unrelated), source.replace('width:303px', 'width:min(303px,100%)'));
});
