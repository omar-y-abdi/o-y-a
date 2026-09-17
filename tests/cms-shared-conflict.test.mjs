import assert from 'node:assert/strict';
import test from 'node:test';

import { initial } from '../.generated/cms-seed.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

const originalTagline = 'Lite hjärna. Lite hjärta.<br>Ganska mycket nyfikenhet.';
const divergentTagline = 'En äldre footer som bara finns på en sida.';

test('divergent legacy shared content is recoverable by choosing one stored variant', async () => {
  const runtime = await cmsRuntime();
  try {
    const cookie = `CF_Authorization=${await runtime.token()}`;
    const request = (path, options = {}) => runtime.mf.dispatchFetch(`${runtime.url}/admin/api/${path}`, {
      ...options,
      headers: { Cookie: cookie, ...options.headers },
    });
    const post = (path, body) => request(path, {
      method: 'POST',
      headers: { Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' },
      body: JSON.stringify(body),
    });

    const legacy = structuredClone(initial);
    delete legacy.sharedContent;
    legacy.pages = legacy.pages.map(page => ({
      ...page,
      html: page.html.replace(/ data-cms-shared="footer\.tagline"/g, ''),
    }));
    legacy.pages[0].html = legacy.pages[0].html.replace(originalTagline, divergentTagline);

    await publishSite(runtime.db, {
      project: legacy,
      baseVersion: 0,
      requestId: crypto.randomUUID(),
      actor: 'owner@example.test',
    });

    const blocked = await request('state');
    assert.equal(blocked.status, 409, await blocked.clone().text());
    const blockedBody = await blocked.json();
    assert.equal(blockedBody.details?.kind, 'shared-content-conflict');
    assert.equal(blockedBody.details?.version, 1);
    assert.equal(blockedBody.details?.conflicts?.length, 1);

    const conflict = blockedBody.details.conflicts[0];
    assert.equal(conflict.key, 'footer.tagline');
    assert.equal(conflict.options.length, 2);
    assert.ok(conflict.options.every(option => option.value && option.label && option.pages.length));
    const chosen = conflict.options.find(option => option.value.includes('Lite hjärna. Lite hjärta.'));
    assert.ok(chosen, 'the original stored footer variant must be selectable');

    const repaired = await post('repair-shared-content', {
      baseVersion: blockedBody.details.version,
      requestId: crypto.randomUUID(),
      selections: { 'footer.tagline': chosen.value },
    });
    assert.equal(repaired.status, 200, await repaired.clone().text());
    assert.equal((await repaired.json()).version, 2);

    const stateResponse = await request('state');
    assert.equal(stateResponse.status, 200, await stateResponse.clone().text());
    const state = await stateResponse.json();
    assert.equal(state.version, 2);
    assert.equal(state.project.sharedContent['footer.tagline'], chosen.value);
    assert.ok(state.project.pages.every(page => page.html.includes('data-cms-shared="footer.tagline"')));
    assert.ok(state.project.pages.every(page => page.html.includes('Lite hjärna. Lite hjärta.')));
    assert.ok(state.project.pages.every(page => !page.html.includes(divergentTagline)));

    const retained = await readSite(runtime.db, 1);
    assert.equal(retained.project.sharedContent, undefined);
    assert.match(retained.project.pages[0].html, /En äldre footer som bara finns på en sida\./);
  } finally {
    await runtime.close();
  }
});
