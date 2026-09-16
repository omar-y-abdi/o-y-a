import { test, afterAll as after } from 'vitest';
import assert from 'node:assert/strict';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { decodeRaster } from '../src/cms/raster-integrity.mjs';
import { inspectAsset } from '../src/cms/assets.mjs';
import { publishSite } from '../src/cms/store.mjs';
import { validateProject } from '../src/cms/project.mjs';
import { seed, initial } from '../.generated/cms-seed.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';
import { cmsRuntime } from './helpers/cms-runtime.mjs';

const runtime = await cmsRuntime();
after(() => runtime.close());
const projectWith = src => {
  const project = structuredClone(initial);
  project.pages[0].html = project.pages[0].html.replace('</main>', `<img src="${src}" alt="Retained image"></main>`);
  return validateProject(project, seed);
};

test('merge: release and publication reject the same unregistered media reference', async () => {
  const project = projectWith(`/media/${crypto.randomUUID()}.png`);
  await assert.rejects(publishSite(runtime.db, { project, baseVersion: 0, requestId: crypto.randomUUID(), actor: 'owner@example.test' }), error => error.status === 422);
  const report = await checkCompatibility(runtime.db, { seed, initial: project });
  assert.equal(report.compatible, false, 'A release must not approve a revision that publication rejects');
  assert.equal(report.revisions[0].compatible, false);
});

test('merge: release checks validation readiness without mutating legacy media', async () => {
  const id = crypto.randomUUID(), key = id + '.png';
  await runtime.db.prepare('INSERT INTO cms_media(id, object_key, name, mime, bytes, width, height, alt, sha256, created_at, validation_version) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, key, 'Legacy', 'image/png', 33, 2, 2, 'Legacy image', 'test-hash', new Date().toISOString(), 0).run();
  const project = projectWith('/media/' + key);
  const report = await checkCompatibility(runtime.db, { seed, initial: project });
  assert.equal(report.compatible, false, 'Existing but unverified media requires a validation pass before release');
  const row = await runtime.db.prepare('SELECT validation_version, published_at FROM cms_media WHERE id=?').bind(id).first();
  assert.equal(row.validation_version, 0); assert.equal(row.published_at, null);
  // The SQL-only checker verifies recorded readiness, not the remote R2 bytes.
  await runtime.db.prepare('UPDATE cms_media SET validation_version=1 WHERE id=?').bind(id).run();
  assert.equal((await checkCompatibility(runtime.db, { seed, initial: project })).compatible, true);
});

test('merge: an HTTP-200 decoder error body is not evidence of successful image decoding', async () => {
  const bytes = Buffer.from(rasterFixtures.png, 'base64'), info = inspectAsset(bytes);
  const env = { CMS_IMAGES: { input() { return { transform() { return { async output() { return { response() { return new Response('<html>service error</html>'); } }; } }; } }; } } };
  await assert.rejects(decodeRaster(env, bytes, info), error => error.message === 'CMS_IMAGES_INVALID_OUTPUT');
});

test('merge: WebP decoder output may arrive with its header split between stream chunks', async () => {
  const bytes = Buffer.from(rasterFixtures.png, 'base64'), output = Buffer.from(rasterFixtures.webp, 'base64');
  const env = { CMS_IMAGES: { input() { return { transform() { return { async output() { return { response() {
    return new Response(new ReadableStream({ start(controller) {
      for (const chunk of [output.subarray(0, 3), output.subarray(3, 9), output.subarray(9)]) controller.enqueue(chunk);
      controller.close();
    } }));
  } }; } }; } }; } } };
  await assert.doesNotReject(decodeRaster(env, bytes, inspectAsset(bytes)));
});
