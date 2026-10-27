import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { canonicalPagePath } from '../src/cms/routes.mjs';
import { validatePagePath } from '../src/cms/validation.mjs';

let runtime, authorization;
before(async () => { runtime = await cmsRuntime(); authorization = await runtime.token(); });
after(async () => { await runtime?.close(); });

test('private attachment namespace cannot be published as a CMS page', async () => {
  const origin = 'https://omaryusuf.se';
  const headers = { 'Cf-Access-Jwt-Assertion': authorization, Origin: origin, 'Content-Type': 'application/json', 'X-CMS-Request': '1' };
  const state = await (await runtime.mf.dispatchFetch(origin + '/admin/api/state', { headers })).json();
  for (const path of ['/mail-file/', '/mail-file/notes/']) {
    assert.equal(canonicalPagePath(path), null);
    assert.throws(() => validatePagePath(path), { status: 422 });
    const project = structuredClone(state.project);
    project.pages.push({ ...state.blank, id: 'private-mail-page', sourceId: 'blank', path, name: 'Privat fil' });
    const response = await runtime.mf.dispatchFetch(origin + '/admin/api/save', { method: 'POST', headers, body: JSON.stringify({ project, baseVersion: state.version, requestId: crypto.randomUUID() }) });
    assert.equal(response.status, 422);
    assert.match((await response.json()).error, /reserverad/);
  }
  assert.equal(validatePagePath('/mail-files/'), '/mail-files/');
  assert.equal((await (await runtime.mf.dispatchFetch(origin + '/admin/api/state', { headers })).json()).version, state.version);
});
