import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { parseFragment } from 'parse5';
import { seed, initial, legacyInitial } from '../.generated/cms-seed.mjs';
import { frameDefinitions, composePage, splitPage, validateFrameKeys } from '../src/cms/frame.mjs';
import { toFrameProject, normalizeClientProject } from '../src/cms/frame-converter.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { attribute, elements } from '../src/cms/html-tree.mjs';
import { frameMigration } from '../scripts/cms-migrate-frame.mjs';
import { releaseVerdict } from '../scripts/cms-pull-release.mjs';

// Rebuild the pure seed definitions too, so a stale generated module cannot
// hide a regression that prevents the next build from writing its new initial.
function currentSeed() {
  return frameDefinitions({ ...seed.legacy, pages: legacyInitial.pages.map(page => ({ ...page, contracts: seed.legacy.pages.find(item => item.id === page.id).contracts })) });
}
const privacyKeys = html => elements(parseFragment(html)).filter(node => attribute(node, 'data-privacy-open') !== undefined).map(node => attribute(node, 'data-cms-node'));

test('B8: generated schema-2 initial validates directly and from its legacy build input', () => {
  assert.equal(initial.schemaVersion, 2);
  assert.doesNotThrow(() => validateProject(structuredClone(initial), seed));
  const current = currentSeed(), generated = toFrameProject(structuredClone(legacyInitial), current);
  assert.ok(generated.pages.every(page => Object.keys(page.frameKeys).length > 0));
  assert.doesNotThrow(() => validateProject(generated, current));
  assert.ok(legacyInitial.pages.every(page => page.frameKeys === undefined), 'Legacy build input has no frame aliases');
});

test('B8: every generated page uses its template aliases and legal pages keep both privacy button keys', () => {
  const current = currentSeed();
  const project = validateProject(toFrameProject(structuredClone(legacyInitial), current), current);
  const legal = ['/integritet/', '/kakor/', '/villkor/', '/tillganglighet/'];
  assert.equal(project.pages.filter(page => legal.includes(page.path)).length, 4);
  for (const page of project.pages) {
    const original = legacyInitial.pages.find(item => item.id === page.id);
    assert.equal(page.html, splitPage(original.html).page, `${page.path}: main keys stay in the full template namespace`);
    for (const [old, scoped] of Object.entries(current.scopeKeys[page.sourceId])) {
      if (scoped.startsWith('f-')) assert.equal(page.frameKeys[scoped], old, `${page.path}: ${scoped}`);
    }
    const composed = composePage(project.frame, page);
    assert.deepEqual(privacyKeys(composed), privacyKeys(original.html), page.path);
    if (legal.includes(page.path)) {
      assert.equal(current.scopeKeys[page.sourceId]['k1gatap4-1'], 'f-k1gatap4');
      assert.equal(page.frameKeys['f-k1gatap4'], 'k1gatap4-1');
      assert.deepEqual(privacyKeys(composed), ['k1gatap4', 'k1gatap4-1'], page.path);
    }
  }
});

test('B8: protected frame aliases follow trusted template lineage, never arbitrary ordinal suffixes', () => {
  const current = currentSeed();
  assert.doesNotThrow(() => validateFrameKeys({ 'f-k1gatap4': 'k1gatap4-1' }, current.scopeKeys.privacy));
  assert.equal(validateFrameKeys(undefined, current.scopeKeys.blank), undefined, 'New pages may omit legacy aliases');
  for (const [aliases, scope] of [
    [{ 'f-k1gatap4': 'k1gatap4' }, current.scopeKeys.privacy],
    [{ 'f-k1gatap4': 'k1gatap4-1' }, current.scopeKeys.home],
    [{ 'f-k1gatap4': 'k1gatap4-2' }, current.scopeKeys.privacy],
  ]) assert.throws(() => validateFrameKeys(aliases, scope), /äldre nodnycklar är ogiltiga/);
  const copy = toFrameProject(structuredClone(legacyInitial), current);
  const source = copy.pages.find(page => page.path === '/integritet/');
  copy.pages.push({ ...source, id: 'privacy-copy', sourceId: 'privacy', path: '/integritetskopia/' });
  assert.doesNotThrow(() => validateProject(copy, current), 'A duplicate keeps the source template alias map');
});

test('B8: a legacy initial beginning with a legal page keeps canonical frame contracts', () => {
  const current = currentSeed(), legacy = structuredClone(legacyInitial);
  const index = legacy.pages.findIndex(page => page.path === '/integritet/');
  legacy.pages.unshift(...legacy.pages.splice(index, 1));
  const converted = toFrameProject(legacy, current);
  assert.doesNotThrow(() => validateProject(converted, current));
  for (const contract of current.frame.contracts) assert.ok(converted.frame.html.includes(`data-cms-node="${contract.key}"`), contract.key);
});

test('B8: legacy ingress, head migration, rollback and release checks share the legal-page alias mapping', async () => {
  const current = currentSeed();
  const fixture = JSON.parse(await readFile('tests/fixtures/cms-v185-project.json', 'utf8'));
  for (const [version, legacy] of [[1, legacyInitial], [185, fixture]]) {
    const client = validateProject(normalizeClientProject(structuredClone(legacy), current), current);
    const migrated = frameMigration({ version, project: legacy }, current).project;
    assert.deepEqual(migrated, client, `v${version}: stored and client ingress agree`);
    const reversed = frameMigration({ version: version + 1, project: migrated }, current, { reverse: true }).project;
    assert.ok(reversed.pages.every(page => page.frameKeys === undefined), 'Reverse conversion removes schema-2 aliases');
    const again = frameMigration({ version: version + 2, project: reversed }, current).project;
    for (const page of migrated.pages) assert.deepEqual(privacyKeys(composePage(again.frame, again.pages.find(item => item.id === page.id))), privacyKeys(composePage(migrated.frame, page)), page.path);
    const verdict = await releaseVerdict({ revisions: [{ version, project: gzipSync(JSON.stringify(legacy)) }, { version: version + 1, project: gzipSync(JSON.stringify(migrated)) }], media: [] }, { seed: current, initial: migrated });
    // Initial comes first; retained history is newest first.
    assert.deepEqual(verdict.revisions.map(item => [item.version, item.compatible]), [[0, true], [version + 1, true], [version, true]]);
  }
});
