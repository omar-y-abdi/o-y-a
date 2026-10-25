import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { validateCss } from '../src/cms/validation.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';

const generated = [
  '[data-consent]::after{content:"Bara nödvändiga"}',
  '[data-privacy-dialog] [data-consent]::before{content:"Tillåt statistik"}',
  'button:after{content:attr(title)}',
  '*::before{content:var(--label)}',
  '@media(min-width:1px){:is(button)::after{c\\6f ntent:"Etikett"!important}}',
  '@keyframes label{to{content:"Etikett"}}',
  '[data-consent]::after{content:"" / "Tillåt statistik"}',
  '[data-consent]::after{content:url(/favicon.svg)}',
];

test('A1b: generated labels are rejected independently of selector, escapes and nesting', () => {
  for (const source of generated) assert.throws(() => validateCss(source), { status: 422, message: /genererat innehåll/ }, source);
  for (const value of ['none', 'normal', '""', "''"]) assert.match(validateCss(`.decoration::after{content:${value};display:block}`), /display:block/);
});

const runtime = await cmsRuntime();
after(() => runtime.close());
const cookie = 'CF_Authorization=' + await runtime.token();
const post = (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { method: 'POST', headers: { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify(body) });

test('A1b: full Save, delta Save and restore reject generated labels without publishing', async () => {
  const saved = await publishSite(runtime.db, { project: initial, baseVersion: 0, requestId: crypto.randomUUID(), actor: runtime.email });
  for (const css of generated) {
    const project = structuredClone(initial);
    project.pages[0].css = css;
    for (const [path, body] of [
      ['save', { project, baseVersion: saved.version, requestId: crypto.randomUUID() }],
      ['save', { changes: projectChanges(initial, project), baseVersion: saved.version, requestId: crypto.randomUUID() }],
      ['recover', { project, pendingSave: null }],
    ]) {
      const response = await post(path, body);
      assert.equal(response.status, 422, `${path}: ${await response.clone().text()}`);
      assert.match(await response.text(), /genererat innehåll/);
      assert.equal((await readSite(runtime.db)).version, saved.version);
    }
  }
});

test('A1b: unchanged CSS accepted under the previous policy is checked again on Save and restore', async () => {
  const old = structuredClone((await readSite(runtime.db)).project);
  const page = old.pages[0];
  page.css = generated[0];
  const source = seed.pages.find(item => item.id === page.id) ?? seed.blank;
  page.facts = { ...page.facts, validationKey: JSON.stringify(['cms-policy-5-html-namespace', source.contracts, true]) };
  const head = (await readSite(runtime.db)).version;
  const saved = await publishSite(runtime.db, { project: old, baseVersion: head, requestId: crypto.randomUUID(), actor: runtime.email });
  for (const [path, body] of [
    ['save', { project: old, baseVersion: saved.version, requestId: crypto.randomUUID() }],
    ['recover', { project: old, pendingSave: null }],
  ]) {
    const response = await post(path, body);
    assert.equal(response.status, 422, await response.clone().text());
    assert.match(await response.text(), /genererat innehåll/);
  }
});
