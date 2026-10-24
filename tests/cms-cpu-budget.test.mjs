import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initial, seed } from '../.generated/cms-seed.mjs';
import { defaultResources } from '../src/content/resources.mjs';
import { validateProjectWithReferences } from '../src/cms/project.mjs';
import { normalizeStoredProject } from '../src/cms/shared-content.mjs';
import { normalizeClientProject } from '../src/cms/api.mjs';
import { resourceReferences } from '../src/cms/resources.mjs';
import { applyProjectChanges, projectChanges, validateProjectChanges } from '../src/cms/project-changes.mjs';
import { publicationChunks } from '../src/cms/store.mjs';
import { validateReferencedMedia } from '../src/cms/assets.mjs';

// A16: the production head (v185, decoded) is the workload. CPU time, not wall
// time, because the Worker limit is CPU time.
const ORIGIN = 'https://omaryusuf.se';
const v185 = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
const baseline = normalizeStoredProject(structuredClone(v185), seed, initial);

const cpuMs = run => {
  const start = process.cpuUsage();
  const result = run();
  const used = process.cpuUsage(start);
  return { ms: (used.user + used.system) / 1000, result };
};
const median = values => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)];

// What the studio sends for a one-page edit, and what /admin/api/save does with it.
const onePageEdit = round => {
  const draft = structuredClone(baseline);
  const page = draft.pages.find(item => item.path === '/om/');
  page.html = page.html.replace('</main>', `<p>Mätning ${round}</p></main>`);
  return projectChanges(baseline, draft);
};
const save = changes => validateProjectWithReferences(normalizeClientProject(applyProjectChanges(baseline, validateProjectChanges(changes)), seed), seed, baseline, { origins: [ORIGIN] });

test('A16: normalizeStoredProject on v185 takes at most 5 ms CPU', () => {
  for (let round = 0; round < 3; round++) normalizeStoredProject(structuredClone(v185), seed, initial);
  const samples = Array.from({ length: 20 }, () => structuredClone(v185)).map(project => cpuMs(() => normalizeStoredProject(project, seed, initial)).ms);
  assert.ok(median(samples) <= 5, `median ${median(samples).toFixed(2)} ms`);
});

test('A16: a one-page Save takes at most 80 ms CPU (median of 20)', () => {
  for (let round = 0; round < 3; round++) save(onePageEdit(`värm ${round}`));
  const samples = Array.from({ length: 20 }, (_, round) => {
    const changes = onePageEdit(round);
    const { ms, result } = cpuMs(() => save(changes));
    assert.ok(result.project.pages.find(item => item.path === '/om/').html.includes(`Mätning ${round}`));
    return ms;
  });
  assert.ok(median(samples) <= 80, `median ${median(samples).toFixed(1)} ms, samples ${samples.map(value => value.toFixed(0)).join(' ')}`);
});

test('A16: one Save walks the whole project for resource references once', async () => {
  // resourceReferences cannot be replaced in an ES module, so count its work:
  // every walk passes the default animated mail image through new URL() once.
  const probe = defaultResources.emailAnimated;
  const NativeURL = URL;
  let hits = 0;
  globalThis.URL = class extends NativeURL {
    constructor(value, base) { super(value, base); if (value === probe) hits++; }
  };
  try {
    resourceReferences(baseline);
    const perWalk = hits;
    assert.ok(perWalk >= 1);
    hits = 0;
    const { project, references } = save(onePageEdit('spion'));
    await validateReferencedMedia({}, project, references);
    publicationChunks(project, undefined, references);
    assert.equal(hits, perWalk, 'validate, media check and rendering share one walk');
  } finally { globalThis.URL = NativeURL; }
});

test('A16: with a baseline, a changed page and a changed sharedContent are still checked against the shared text', () => {
  const run = draft => validateProjectWithReferences(draft, seed, baseline, { origins: [ORIGIN] });
  assert.doesNotThrow(() => run(structuredClone(baseline)));
  const edited = structuredClone(baseline);
  const page = edited.pages.find(item => item.path === '/om/');
  page.html = page.html.replace(/(data-cms-shared="footer\.tagline"[^>]*>)/, '$1Egen text ');
  assert.notEqual(page.html, baseline.pages.find(item => item.path === '/om/').html);
  assert.throws(() => run(edited), error => error.status === 422 && /skiljer sig mellan sidor/.test(error.message));
  const reworded = structuredClone(baseline);
  reworded.sharedContent = { 'footer.tagline': 'En ny rad' };
  assert.throws(() => run(reworded), error => error.status === 422 && /skiljer sig mellan sidor/.test(error.message));
});
