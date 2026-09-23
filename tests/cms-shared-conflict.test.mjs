import assert from 'node:assert/strict';
import test from 'node:test';

import { initial } from '../.generated/cms-seed.mjs';
import { publishSite, readSite } from '../src/cms/store.mjs';
import { projectChanges } from '../src/cms/project-changes.mjs';
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
    legacy.pages[0].html = legacy.pages[0].html.replace(
      /Lite hjärna\. Lite hjärta\.<br[^>]*>Ganska mycket nyfikenhet\./,
      divergentTagline,
    );
    assert.ok(legacy.pages[0].html.includes(divergentTagline), 'fixture must contain a divergent footer variant');

    await publishSite(runtime.db, {
      project: legacy,
      baseVersion: 0,
      requestId: crypto.randomUUID(),
      actor: 'owner@example.test',
    });

    const stateResponse = await request('state');
    assert.equal(stateResponse.status, 200, await stateResponse.clone().text());
    const recoverable = await stateResponse.json();
    assert.equal(recoverable.version, 1);
    assert.equal(recoverable.project.sharedContentConflicts?.length, 1);

    const conflict = recoverable.project.sharedContentConflicts[0];
    assert.equal(conflict.key, 'footer.tagline');
    assert.equal(conflict.options.length, 2);
    assert.ok(conflict.options.every(option => option.value && option.label && option.pages.length));
    const chosen = conflict.options.find(option => option.value.includes('Lite hjärna. Lite hjärta.'));
    assert.ok(chosen, 'the original stored footer variant must be selectable');
    assert.equal(recoverable.project.sharedContent['footer.tagline'], chosen.value);

    const { sharedContentConflicts: _conflicts, ...repairProject } = recoverable.project;
    const changes = projectChanges(recoverable.project, repairProject);
    changes.sharedContent = repairProject.sharedContent;
    const repaired = await post('save', {
      changes,
      baseVersion: recoverable.version,
      requestId: crypto.randomUUID(),
    });
    assert.equal(repaired.status, 200, await repaired.clone().text());
    assert.equal((await repaired.json()).version, 2);

    const repairedStateResponse = await request('state');
    assert.equal(repairedStateResponse.status, 200, await repairedStateResponse.clone().text());
    const state = await repairedStateResponse.json();
    assert.equal(state.version, 2);
    assert.equal(state.project.sharedContent['footer.tagline'], chosen.value);
    assert.equal(state.project.sharedContentConflicts, undefined);
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
