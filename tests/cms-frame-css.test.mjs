import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import * as css from 'css-tree';
import { validateCss } from '../src/cms/validation.mjs';
import { mapFrameCss as serverMap } from '../src/cms/frame-ids.mjs';
import { mapFrameCss as editorMap } from '../src/cms/client/frame-css.mjs';
import { selectorId } from '../src/cms/frame-id-selectors.mjs';

const canonical = source => css.generate(css.parse(source, { parseCustomProperty: true }));
const identitySemantics = source => {
  const tree = css.parse(source, { parseCustomProperty: true });
  css.walk(tree, node => {
    if (node.type === 'IdSelector') node.name = css.ident.encode(css.ident.decode(node.name));
    if (node.type === 'AttributeSelector' && node.value?.type === 'Identifier') node.value = { type: 'String', value: css.ident.decode(node.value.name) };
  });
  return css.generate(tree);
};
const ids = new Map([['abc', { id: 'historical-footer' }], ['frame:node', { id: 'other.node' }]]);
const samples = [
  '#abc{color:#abc;--hash:#abc;--literal:"{ #abc url(#abc) }";clip-path:url(#abc)!important}',
  '/* #abc { untouched } */ #abc, [id = "abc" s], [id=abc] { color: #abc; --label: "#abc"; }',
  ':is(#abc,[id="abc"]):not([data-label="#abc"]),#frame\\:node{color:#abc;filter:url("#abc")}',
  '#\\61 bc{clip-path:url( \'#\\61 bc\' );--space:"a  b";--escaped:"\\61 bc"}',
  '[\\69 d="abc"], [*|id="other"], [|id="other"] {clip-path:URL(#abc)}',
  '@supports selector(:is(#abc,[id="abc"])) { #abc { color:#abc } }',
  '@supports (color:#abc) { #abc { --colour:#abc;clip-path:url(#abc) } }',
  '@supports (--literal:selector(#abc)) { #abc { color:#abc } }',
  '@supports ((color:#abc) and selector(#abc)) { #abc { color:#abc } }',
  '@supports (selector(#abc) + 3) { #abc { color:#abc } }',
  '@supports unknown(selector(#abc)) { #abc { color:#abc } }',
  '@supports url("#abc") { #abc { clip-path:url("#abc") } }',
  '@supports (url("#abc") + 3) { #abc { color:#abc } }',
  '@supports sel\\65 ctor(#abc) { #abc { color:#abc } }',
  '@s\\75 pports selector(#abc) { #abc { color:#abc } }',
  '@container style(--literal:selector(#abc)){#abc{color:#abc}}',
  '@font-face {font-family:"#abc";src:url(#abc);--colour:#abc}',
  '@keyframes pulse {from{color:#abc;clip-path:url("#abc")}50%{opacity:.5}to{clip-path:url(#frame\\:node)}}',
  '@-webkit-keyframes pulse {0%{color:#abc}100%{clip-path:url(#abc)}}',
  '@layer base, extra;@layer base{@media(min-width:1px){#abc{color:#abc}}}',
  '#abc{@layer inner{& #frame\\:node{color:#abc}}}',
  '#abc{@l\\61 yer inner{color:#abc}}',
  '@container card (min-width:1px){#abc{color:#abc;@media(min-width:2px){clip-path:url(#abc);& #frame\\:node{color:#abc}}}}',
  '@starting-style{#abc{opacity:0}}#abc{@starting-style{opacity:0}&:is(#abc,[id="abc"]){color:#abc}}',
  '#abc{--literal:[#abc "{#abc}"];--fallback:var(--unknown,#abc);color:#abc;}',
  '#abc{#abc:red;*color:#abc}',
];

for (const [index, source] of samples.entries()) test(`editor frame CSS token projection matches authoritative AST: ${index + 1}`, () => {
  const checked = validateCss(source), projected = editorMap(source, ids);
  assert.equal(canonical(projected), serverMap(checked, ids));
  const inverse = new Map([...ids].map(([from, target]) => [target.id, { id: from }]));
  assert.equal(identitySemantics(editorMap(projected, inverse)), identitySemantics(checked));
});

test('editor frame CSS changes only mapped token spans', () => {
  const source = '/* #abc */ #abc {\n color: #abc !important; --literal: "{ #abc }"; /* keep  two spaces */\n}';
  assert.equal(editorMap(source, ids), source.replace('*/ #abc {', '*/ #historical-footer {'));
  assert.equal(editorMap(source, new Map([['unrelated', { id: 'new-id' }]])), source);
  assert.equal(editorMap(source, new Map()), source);
});

test('editor frame CSS shares exact/non-exact attribute policy with server', () => {
  const aliases = new Map([['legacy-home', { id: 'legacy-about' }]]);
  for (const source of ['[id^="legacy-"]{color:red}', '[id$="home"]{color:red}', '[id="LEGACY-HOME" i]{color:red}', '[*|id="legacy-home"]{color:red}', '[id="legacy-home"s]{color:red}', ':has([id|="legacy"]){color:red}']) {
    let expected;
    try { expected = serverMap(source, aliases); }
    catch (error) { assert.throws(() => editorMap(source, aliases), candidate => candidate.message.includes('kan ändra betydelse') && error.message.includes('kan ändra betydelse')); continue; }
    assert.equal(canonical(editorMap(source, aliases)), expected);
  }
});

test('editor frame CSS requires concrete editor IDs; public null markers remain server-owned', () => {
  for (const id of [null, undefined, '']) assert.throws(() => editorMap('#abc{color:red}', new Map([['abc', { id, key: 'f-footer' }]])), /CSS kan inte kopplas säkert/);
  const temporary = new Map([['abc', { id: 'frame-editor-1' }]]);
  assert.equal(canonical(editorMap('#abc{clip-path:url(#abc)}', temporary)), serverMap('#abc{clip-path:url(#abc)}', temporary));
});

test('editor frame CSS refuses unknown or unbalanced structures instead of partially rewriting', () => {
  for (const source of ['#abc{color:red', '#abc:is(.other{color:red}', '[id="abc"{color:red}', '@unknown{#abc{color:red}}', '@import url("/other.css");', '#abc{--literal:"bad\n}', '#abc{clip-path:url(bad value)}']) assert.throws(() => editorMap(source, ids), /CSS kan inte kopplas säkert/);
});

test('editor frame CSS refuses nesting that the authoritative validator cannot parse safely', () => {
  for (const source of ['#outer{.child #abc{color:red}}', '#outer{#abc{color:red}}', '#outer{:hover{color:red}}', '#outer{@layer inner{color:#abc;& #abc{color:red}}}', '#abc{--raw:{colour:#abc}}']) {
    assert.throws(() => validateCss(source), /CSS/);
    assert.throws(() => editorMap(source, ids), /CSS kan inte kopplas säkert/);
  }
});

test('editor frame CSS matches server projection across repository styles and every raw v185 page', async t => {
  const files = (await readdir('src/styles')).filter(name => name.endsWith('.css')).sort();
  const sources = await Promise.all(files.map(async name => [`src/styles/${name}`, await readFile(`src/styles/${name}`, 'utf8')]));
  const legacy = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  sources.push(...legacy.pages.map(page => [`v185 ${page.path}`, page.css ?? '']));
  let mapped = 0;
  for (const [label, source] of sources) await t.test(label, () => {
    const tree = css.parse(source, { parseCustomProperty: true }), names = new Set();
    css.walk(tree, node => {
      const id = selectorId(node);
      if (id !== undefined) names.add(id);
      if (node.type === 'Url' && node.value.startsWith('#')) names.add(node.value.slice(1));
    });
    const aliases = new Map([...names].map((id, index) => [id, { id: `frame-differential-${index}` }]));
    assert.ok([...aliases.values()].every(target => !names.has(target.id)), 'Differential targets must not alias original identities');
    mapped += aliases.size;
    // A nonempty map with no relevant IDs still walks the complete grammar and
    // must leave every unrelated source byte, including comments, untouched.
    assert.equal(editorMap(source, new Map([['no-such-frame-id', { id: 'another-unused-frame-id' }]])), source);
    let expected;
    try { expected = serverMap(source, aliases); }
    catch (error) {
      assert.match(error.message, /kan ändra betydelse/);
      assert.throws(() => editorMap(source, aliases), /kan ändra betydelse/);
      return;
    }
    const projected = editorMap(source, aliases);
    assert.equal(canonical(projected), canonical(expected));
    const inverse = new Map([...aliases].map(([from, target]) => [target.id, { id: from }]));
    assert.equal(identitySemantics(editorMap(projected, inverse)), identitySemantics(source));
  });
  assert.ok(mapped > 0, 'The real-source corpus must exercise identity replacements');
});
