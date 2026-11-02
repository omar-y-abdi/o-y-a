import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewPayload } from '../src/cms/preview-project.mjs';
import { previewCache } from '../src/cms/client/preview-cache.mjs';

const project = { schemaVersion: 2, pages: [{ id: 'home', html: '<main data-machine></main>', css: '', facts: { forged: true }, frameKeys: { 'f-key': 'old-key' }, frameIds: { 'f-id': ['new', 'old'] } }, { id: 'about', html: '<main></main>', css: '' }], cards: [{ id: 'one' }, { id: 'two' }], frame: { html: '<nav></nav><main></main>', css: '' }, runtime: {}, theme: {}, resources: {}, email: { notEmitted: true } };

test('preview transport retains target/frame identity while omitting unrelated pages and unused card banks', () => {
  const home = previewPayload(project, 'page', 'home').project;
  assert.deepEqual(home.pages.map(page => page.id), ['home']);
  assert.equal(home.frame, project.frame);
  assert.deepEqual(home.pages[0].frameKeys, project.pages[0].frameKeys);
  assert.deepEqual(home.pages[0].frameIds, project.pages[0].frameIds);
  assert.equal(home.pages[0].facts, undefined);
  assert.equal(home.email, undefined);
  assert.deepEqual(home.cards, project.cards);
  assert.deepEqual(previewPayload(project, 'page', 'about').project.cards, []);
  const win = previewPayload(project, 'win', 'one').project;
  assert.deepEqual(win.pages, []);
  assert.deepEqual(win.cards, [project.cards[0]]);
  assert.equal(win.frame, undefined);
  assert.throws(() => previewPayload(project, 'page', 'absent'));
  assert.throws(() => previewPayload({ ...project, pages: [project.pages[0], project.pages[0]] }, 'page', 'home'));
});

test('preview shares pending/completed target content and invalidates draft, history, target and mutable asset identity', async () => {
  let calls = 0, complete;
  const load = previewCache(() => { calls++; return new Promise(resolve => { complete = resolve; }); });
  const owner = {}, assets = [];
  const first = load(owner, 0, 'page', 'home', project, assets);
  assert.equal(load(owner, 0, 'page', 'home', project, assets), first);
  complete({ html: 'first' });
  assert.deepEqual(await first, { html: 'first' });
  assert.equal(load(owner, 0, 'page', 'home', project, assets), first, 'desktop/mobile/compare share completed content');
  for (const args of [[owner, 1, 'page', 'home', project, assets], [owner, 1, 'page', 'about', project, assets], [owner, 1, 'page', 'about', project, []], [{}, 1, 'page', 'about', project, assets]]) {
    const pending = load(...args); complete({ html: String(calls) }); await pending;
  }
  assert.equal(calls, 5);
});

test('failed preview is evicted without a late old failure dropping a newer request', async () => {
  const pending = [], load = previewCache(() => new Promise((resolve, reject) => pending.push({ resolve, reject })));
  const owner = {}, assets = [];
  const old = load(owner, 0, 'page', 'home', project, assets);
  const newer = load(owner, 1, 'page', 'home', project, assets);
  pending[0].reject(new Error('old response lost'));
  await assert.rejects(old, /old response lost/);
  assert.equal(load(owner, 1, 'page', 'home', project, assets), newer);
  pending[1].reject(new Error('new response lost'));
  await assert.rejects(newer, /new response lost/);
  const retry = load(owner, 1, 'page', 'home', project, assets);
  assert.notEqual(retry, newer);
  assert.equal(pending.length, 3);
  pending[2].resolve({ html: 'recovered' });
  assert.deepEqual(await retry, { html: 'recovered' });
});
