import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cmsRuntime } from './helpers/cms-runtime.mjs';
import { initial } from '../.generated/cms-seed.mjs';
import { uploadAsset } from '../src/cms/assets.mjs';
import { draftResourceText, assetReferenceCount } from '../src/cms/client/library.mjs';
import { rasterFixtures } from './helpers/raster-fixtures.mjs';

const runtime = await cmsRuntime();
after(() => runtime.close());
const cookie = 'CF_Authorization=' + await runtime.token();
const headers = { Cookie: cookie, Origin: runtime.url, 'Content-Type': 'application/json', 'X-CMS-Request': '1' };
const post = (path, body) => runtime.mf.dispatchFetch(runtime.url + '/admin/api/' + path, { method: 'POST', headers, body: JSON.stringify(body) });

test('A11: whole-draft badges agree with authoritative destructive checks; history needs only an id', async () => {
  const env = { CMS_DB: runtime.db, CMS_MEDIA: await runtime.mf.getR2Bucket('CMS_MEDIA'), CMS_IMAGES: await runtime.mf.getImagesBinding('CMS_IMAGES') };
  const image = await uploadAsset(env, { id: crypto.randomUUID(), name: 'Bild.png', bytes: Buffer.from(rasterFixtures.png, 'base64') });
  const font = await uploadAsset(env, { id: crypto.randomUUID(), name: 'Typsnitt.woff2', bytes: new Uint8Array(await readFile('tests/fixtures/dm-sans-latin-400-normal.woff2')) });
  for (const kind of ['page', 'twice', 'css', 'link', 'win', 'theme', 'slot']) {
    const project = structuredClone(initial), asset = kind === 'theme' ? font : image;
    if (kind === 'page' || kind === 'twice') project.pages[0].html += `<img src="${asset.src}" alt="">`.repeat(kind === 'twice' ? 2 : 1);
    if (kind === 'css') project.pages[0].css = `#main{background:url(${asset.src})}`;
    if (kind === 'link') project.pages[0].html += `<a href="${asset.src}">Bild</a>`;
    if (kind === 'win') project.cards[0].design = { html: `<div><img src="${asset.src}" alt=""><span data-card-text>Vinst</span></div>`, css: '' };
    if (kind === 'theme') project.theme.fontFamily = `cms-font-${asset.id}`;
    if (kind === 'slot') project.resources.icon = asset.src;
    assert.equal(assetReferenceCount(draftResourceText(project), asset), kind === 'twice' ? 2 : 1, kind);
    const refused = await post('asset-lifecycle', { id: asset.id, action: 'trash', baseVersion: asset.version, baseSiteVersion: 0, project });
    assert.equal(refused.status, 409, `${kind}: ${await refused.clone().text()}`);
  }
  const used = structuredClone(initial);
  used.resources.icon = image.src;
  assert.equal((await post('save', { project: used, baseVersion: 0, requestId: crypto.randomUUID() })).status, 200);
  assert.equal((await post('save', { project: initial, baseVersion: 1, requestId: crypto.randomUUID() })).status, 200);
  const incomplete = structuredClone(initial);
  incomplete.pages[0].title = '';
  assert.equal(assetReferenceCount(draftResourceText(incomplete), image), 0);
  const usage = await post('asset-usage', { id: image.id });
  assert.equal(usage.status, 200, await usage.clone().text());
  assert.deepEqual(await usage.json(), { historyReferences: 1 });
  const trashed = await post('asset-lifecycle', { id: image.id, action: 'trash', baseVersion: image.version, baseSiteVersion: 2, project: initial });
  assert.equal(trashed.status, 200, await trashed.clone().text());
  const asset = (await trashed.json()).asset;
  assert.equal((await post('asset-lifecycle', { id: image.id, action: 'delete', baseVersion: asset.version, baseSiteVersion: 2, project: initial })).status, 409);
  const fonts = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/assets?state=active&kind=font', { headers: { Cookie: cookie } });
  const page = await fonts.json();
  assert.deepEqual(page.items.map(item => item.id), [font.id]);
  assert.equal(page.total, 1);
});

test('A11/C1: history keeps the POST boundary and rejects extra data; removed routes return 404', async () => {
  const id = crypto.randomUUID();
  assert.equal((await post('asset-usage', { id, project: {} })).status, 422);
  const crossed = await runtime.mf.dispatchFetch(runtime.url + '/admin/api/asset-usage', { method: 'POST', headers: { ...headers, Origin: 'https://other.test' }, body: JSON.stringify({ id }) });
  assert.equal(crossed.status, 403);
  for (const path of ['resource-usage', `assets/${id}`]) assert.equal((await post(path, { id })).status, 404, path);
});
