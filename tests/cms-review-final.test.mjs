import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment, serialize } from 'parse5';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial, seed, built } from '../.generated/cms-seed.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { renderPage } from '../src/cms/render.mjs';

let runtime, token;
before(async () => { runtime = await cmsRuntime(); token = await runtime.token(); });
after(async () => runtime?.close());
const origin = 'https://omaryusuf.se';
const admin = (path, data) => runtime.mf.dispatchFetch(origin + '/admin/api/' + path, {
  ...(data === undefined ? {} : { method: 'POST', body: JSON.stringify(data) }),
  headers: { 'Cf-Access-Jwt-Assertion': token, Origin: origin, 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
});
function extra(markup = '') {
  const project = structuredClone(initial);
  project.pages.push({ ...seed.blank, id: 'final-review', sourceId: 'blank', path: '/final-review/', html: seed.blank.html.replace('</main>', markup + '</main>') });
  return project;
}
function mutate(project, visit) {
  for (const page of project.pages) {
    const root = parseFragment(page.html);
    function walk(node) { visit(node); for (const child of node.childNodes ?? []) walk(child); }
    walk(root); page.html = serialize(root);
  }
  return project;
}
const attr = (node, name) => node.attrs?.find(item => item.name === name);
async function rejectedWithoutRevision(project) {
  const before = (await (await admin('state')).json()).version;
  const response = await admin('save', { project, baseVersion: before, requestId: crypto.randomUUID() });
  assert.equal(response.status, 422, (await response.text()).slice(0, 300));
  assert.equal((await (await admin('state')).json()).version, before);
}

test('preview response retains the exact built public main module and preview controller', () => {
  const html = renderPage(initial.pages[0], built, { preview: true, project: initial });
  assert.ok(html.includes(`src="${built.main}"`));
  assert.ok(html.includes(`src="${built.preview}"`));
  assert.ok(!html.includes('application/ld+json'));
});

test('R15: author-controlled preview IDs and markers are rejected without changing the revision', async () => {
  for (const markup of ['<div id="cms-preview-data" hidden>{"cards":[]}</div>', '<div id="cms-win-data">{}</div>', '<section data-cms-preview="true">spoof</section>']) await rejectedWithoutRevision(extra(markup));
});

test('R17: card slots must be renderable text containers, never void, inert or hidden nodes', async () => {
  for (const html of ['<div><input data-card-text></div>', '<div><img data-card-text src="/apple-touch-icon.png" alt=""></div>', '<div><textarea data-card-text></textarea></div>', '<div hidden><p data-card-text></p></div>', '<div aria-hidden="true"><p data-card-text></p></div>', '<dialog><p data-card-text></p></dialog>', '<div><p data-card-text hidden></p></div>', '<div><svg><title data-card-text>hidden</title></svg></div>']) {
    const project = extra(); project.cards[0].design = { html, css: '', project: null };
    await rejectedWithoutRevision(project);
  }
  const project = extra(); project.cards[0].design = { html: '<section><p data-card-text></p></section>', css: '', project: null };
  assert.doesNotThrow(() => validateProject(project, seed));
});

test('R18: editor collection and member shapes are checked before persistence', async () => {
  for (const data of [{ pages: {} }, { pages: [null] }, { pages: [{ frames: {} }] }, { pages: [{ frames: [null] }] }, { pages: [{ component: { tagName: 'main', components: 37 } }] }, { pages: [{ component: { tagName: 3 } }] }, { styles: {} }, { pages: [{ component: { attributes: [] } }] }, { pages: [{ component: { style: [] } }] }, { pages: [{ component: { components: [false] } }] }]) {
    const project = extra(); project.pages.at(-1).project = data; await rejectedWithoutRevision(project);
  }
});

test('R19: radio semantics and hook ownership are immutable even on a protected node', async () => {
  await rejectedWithoutRevision(mutate(structuredClone(initial), node => { if (node.tagName === 'input' && attr(node, 'value')?.value === 'joke') attr(node, 'value').value = 'kind'; }));
  await rejectedWithoutRevision(mutate(structuredClone(initial), node => { if (node.tagName === 'main') node.attrs.push({ name: 'data-contact-form', value: '' }); }));
});

test('R19: added named controls cannot change protected form collections', async () => {
  for (const name of ['email', 'name', 'submit', 'elements']) {
    const project = mutate(structuredClone(initial), node => {
      if (node.tagName === 'form' && attr(node, 'data-contact-form')) {
        const child = parseFragment(`<input name="${name}" value="another@example.test">`).childNodes[0];
        child.parentNode = node; node.childNodes.push(child);
      }
    });
    await rejectedWithoutRevision(project);
  }
});

test('R9: built image references must exist in the generated asset inventory', async () => {
  await rejectedWithoutRevision(extra('<img src="/assets/nonexistent-review-image.png" alt="Missing">'));
  const project = extra(); project.pages.at(-1).css = 'main{background:url(/assets/nonexistent-review-image.png)}';
  await rejectedWithoutRevision(project);
});

test('R19: unnamed controls and ID-only aliases cannot alter protected forms', async () => {
  for (const markup of ['<input id="email">', '<button>Unexpected submit</button>', '<input>']) {
    await rejectedWithoutRevision(mutate(structuredClone(initial), node => {
      if (node.tagName === 'form' && attr(node, 'data-contact-form')) {
        const child = parseFragment(markup).childNodes[0]; child.parentNode = node; node.childNodes.push(child);
      }
    }));
  }
});

test('R19: absent control state cannot be added to disable or bypass the contact contract', async () => {
  for (const name of ['disabled', 'readonly', 'hidden']) await rejectedWithoutRevision(mutate(structuredClone(initial), node => {
    if (node.tagName === 'input' && attr(node, 'name')?.value === 'email') node.attrs.push({ name, value: '' });
  }));
});

test('R19: the first print-label span retains its identity', async () => {
  await rejectedWithoutRevision(mutate(structuredClone(initial), node => {
    if (node.tagName === 'button' && attr(node, 'data-print')) {
      const child = parseFragment('<span>Unexpected label</span>').childNodes[0]; child.parentNode = node; node.childNodes.unshift(child);
    }
  }));
});

test('R18: accepted divergent legacy metadata is removed from persisted state rather than loaded as a second document',async()=>{
  const project=extra('<p>Canonical visible content</p>');
  project.pages.at(-1).project={cmsSchemaVersion:1,pages:[{component:'<main><p>Different legacy content</p></main>'}]};
  const before=(await (await admin('state')).json()).version;
  const response=await admin('save',{project,baseVersion:before,requestId:crypto.randomUUID()});
  assert.equal(response.status,200,await response.clone().text());
  const state=await (await admin('state')).json();
  assert.equal(state.project.pages.at(-1).project,null);
  assert.ok(state.project.pages.at(-1).html.includes('Canonical visible content'));
  const page=await runtime.mf.dispatchFetch(origin+'/final-review/');assert.equal(page.status,200);
  assert.ok((await page.text()).includes('Canonical visible content'));
});
