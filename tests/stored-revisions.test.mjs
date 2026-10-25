import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { seed, initial } from '../.generated/cms-seed.mjs';
import { releaseVerdict, gateFailures } from '../scripts/cms-pull-release.mjs';

const stored = project => gzipSync(JSON.stringify(project));
const head = await readFile('tests/fixtures/cms-v185-project.json', 'utf8');

test('A1c: stored head revision v185 with the cms_media rows it references (none) passes the release gate', async () => {
  assert.equal(head.match(/\/media\/[0-9a-f-]{36}\./g), null);
  const result = await releaseVerdict({ revisions: [{ version: 185, project: stored(JSON.parse(head)) }], media: [] }, { seed, initial });
  assert.deepEqual(result.revisions, [{ version: 0, compatible: true }, { version: 185, compatible: true }]);
  assert.deepEqual(gateFailures(result, 185), []);
});

const image = crypto.randomUUID(), font = crypto.randomUUID();
const project = structuredClone(initial);
project.resources = { ...project.resources, social: `/media/${image}.png` };
project.theme = { ...project.theme, fontFamily: `cms-font-${font}` };
const row = (id, ext, mime, width, height, extra = {}) => ({ id, object_key: `${id}.${ext}`, name: 'Fixture', mime, bytes: 128, width, height, alt: 'Fixture', sha256: `fixture-${id}`, created_at: '2026-10-24T00:00:00Z', validation_version: 1, ...extra });
const rows = (imageExtra, fontExtra) => [row(image, 'png', 'image/png', 1200, 630, imageExtra), row(font, 'woff2', 'font/woff2', null, null, fontExtra)];

for (const [name, media, error] of [
  ['valid image and valid font', rows(), null],
  ['missing cms_media rows', [], 'En vald fil saknas. Ladda upp filen innan du sparar.'],
  ['missing font row', rows().slice(0, 1), 'En vald fil saknas. Ladda upp filen innan du sparar.'],
  ['trashed image', rows({ trashed_at: '2026-10-24T00:00:00Z' }), 'En vald fil saknas. Ladda upp filen innan du sparar.'],
  ['unvalidated font', rows({}, { validation_version: 0 }), 'En vald fil behöver kontrolleras igen innan publicering.'],
]) test(`A1c: head revision media check never skipped: ${name}`, async () => {
  const result = await releaseVerdict({ revisions: [{ version: 7, project: stored(project) }], media }, { seed, initial });
  assert.deepEqual(result.revisions.at(-1), error ? { version: 7, compatible: false, error } : { version: 7, compatible: true });
  assert.equal(gateFailures(result, 7, new Map([[7, error ?? 'Ingen förväntad avvikelse.']])).length, error ? 1 : 0, 'the head revision can never be allowlisted');
});

test('A1c: allowlisted historical failures pass only outside the head revision', async () => {
  const broken = structuredClone(initial); broken.pages[0].title = '';
  const result = await releaseVerdict({ revisions: [{ version: 1, project: stored(broken) }, { version: 2, project: stored(initial) }], media: [] }, { seed, initial });
  assert.equal(result.compatible, false);
  const expected = 'Hem: Sidtitel saknas eller har ogiltig längd.';
  assert.equal(result.revisions.find(item => item.version === 1).error, expected);
  assert.deepEqual(gateFailures(result, 2, new Map([[1, expected]])), []);
  assert.deepEqual(gateFailures(result, 2).map(item => item.version), [1]);
});
