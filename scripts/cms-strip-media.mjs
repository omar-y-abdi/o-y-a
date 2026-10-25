import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectAsset } from '../src/cms/assets.mjs';
import { cleanRaster, checkRasterContainer } from '../src/cms/raster-integrity.mjs';
import { digest } from '../src/cms/store.mjs';
import { replaceResource } from '../src/cms/resources.mjs';

const MEDIA_PATH = /^\/media\/[0-9a-f-]{36}\.(?:png|jpg|gif|webp|avif|woff2)$/;
const sameBytes = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
const uuid = hex => `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;

async function json(response, operation) {
  if (!response.ok) throw new Error(`${operation} failed (${response.status}): ${await response.text()}`);
  return response.json();
}
const post = (request, path, body) => request('/admin/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(response => json(response, path));

async function mediaList(request) {
  const assets = new Map();
  for (const state of ['active', 'archived', 'trash']) {
    let cursor;
    const seen = new Set();
    do {
      const params = new URLSearchParams({ state, ...(cursor ? { cursor } : {}) });
      const page = await json(await request('/admin/api/assets?' + params), 'media list');
      for (const asset of page.items) assets.set(asset.id, asset);
      cursor = page.next;
      if (cursor && seen.has(cursor)) throw new Error('Media cursor did not advance');
      seen.add(cursor);
    } while (cursor);
  }
  return [...assets.values()];
}

function checkPngExif(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let at = 8; at + 12 <= bytes.length;) {
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    if (type === 'eXIf') throw new Error('PNG eXIf needs review: the upload cleaner does not preserve PNG Orientation. Refusing this source.');
    if (type === 'IEND') break;
    at += view.getUint32(at) + 12;
  }
}

async function prepare(request, asset) {
  if (!MEDIA_PATH.test(asset.src) || asset.deleting) throw new Error(`Media ${asset.id} has no stable source`);
  const response = await request(asset.src);
  if (!response.ok) throw new Error(`Reading media ${asset.id} failed (${response.status})`);
  const original = new Uint8Array(await response.arrayBuffer());
  const info = inspectAsset(original);
  if (info.mime !== asset.mime || info.width !== asset.width || info.height !== asset.height || original.length !== asset.bytes) throw new Error(`Stored metadata mismatch for ${asset.id}`);
  if (['image/webp', 'image/avif'].includes(info.mime)) throw new Error(`Metadata stripping needs review for ${info.mime}: the upload cleaner returns these bytes unchanged`);
  if (info.mime === 'image/png') checkPngExif(original);
  const cleaned = cleanRaster(original, info);
  checkRasterContainer(cleaned, info);
  const after = inspectAsset(cleaned);
  if (JSON.stringify(info) !== JSON.stringify(after)) throw new Error(`Cleaning changed image dimensions or type for ${asset.id}`);
  return { cleaned, changed: !sameBytes(original, cleaned), originalHash: await digest(original), hash: await digest(cleaned) };
}

// Use the supported upload and Save paths: object_key is also the public URL,
// so changing that column in place would break existing and historical links.
// Originals, their rows and every historical revision remain untouched.
export async function stripExistingMedia(request, { apply = false, log = console.log } = {}) {
  const state = await json(await request('/admin/api/state'), 'state');
  const assets = await mediaList(request), plan = [];
  // Complete preflight before any upload. Only one image's bytes stay in memory.
  for (const asset of assets.filter(item => item.mime.startsWith('image/'))) {
    const prepared = await prepare(request, asset);
    if (!prepared.changed) continue;
    const id = uuid(await digest(`cms-strip-v1:${asset.id}:${prepared.hash}`));
    plan.push({ asset, id, hash: prepared.hash, originalHash: prepared.originalHash, bytes: prepared.cleaned.length });
    log(`${apply ? 'PLAN' : 'DRY RUN'} ${asset.id} -> ${id}: ${asset.bytes} -> ${prepared.cleaned.length} bytes`);
  }
  log(`${plan.length} changed uploads; originals retained; ${apply ? 'verify new keys before publishing' : 'no writes'}`);
  if (!apply) return { planned: plan.length, replacements: 0, version: state.version };

  let project = state.project, replacements = 0;
  const copies = [];
  for (const item of plan) {
    const prepared = await prepare(request, item.asset);
    if (prepared.hash !== item.hash || prepared.originalHash !== item.originalHash) throw new Error(`Source changed for ${item.asset.id}; no references have been repointed`);
    const uploaded = await json(await request('/admin/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-CMS-Upload-Id': item.id, 'X-CMS-Filename': encodeURIComponent(item.asset.name), 'X-CMS-Alt': encodeURIComponent(item.asset.alt ?? '') }, body: prepared.cleaned }), 'upload');
    const expectedSrc = `/media/${item.id}.${item.asset.src.split('.').at(-1)}`;
    if (uploaded.id !== item.id || uploaded.src !== expectedSrc || uploaded.mime !== item.asset.mime || uploaded.width !== item.asset.width || uploaded.height !== item.asset.height || uploaded.bytes !== item.bytes || uploaded.name !== item.asset.name || uploaded.alt !== item.asset.alt) throw new Error(`Upload verification failed for ${item.asset.id}`);
    const readback = await request(uploaded.src);
    if (!readback.ok || await digest(new Uint8Array(await readback.arrayBuffer())) !== item.hash) throw new Error(`R2 readback verification failed for ${item.asset.id}; originals and references retained`);
    if (uploaded.state !== item.asset.state && uploaded.state !== 'active') throw new Error(`Copy ${uploaded.id} changed state; inspect it before resuming`);
    const result = replaceResource(project, item.asset, uploaded);
    if (result.replacements) { project = result.project; replacements += result.replacements; }
    copies.push({ original: item.asset, uploaded });
    log(`Verified ${item.id}: ${item.bytes} bytes; ${result.replacements} draft references`);
  }
  let version = state.version;
  if (replacements) {
    const requestId = uuid(await digest(JSON.stringify(['cms-strip-save-v1', state.version, plan.map(item => item.id)])));
    const saved = await post(request, 'save', { project, baseVersion: state.version, requestId });
    version = saved.version;
  }
  // Preserve the copied file's library status; originals retain their own state.
  for (const { original, uploaded } of copies) {
    if (original.state === uploaded.state) continue;
    if (original.state === 'archived') await post(request, 'asset-lifecycle', { id: uploaded.id, action: 'archive', baseVersion: uploaded.version, baseSiteVersion: version, project });
    else if (original.state === 'trash') await post(request, 'asset-lifecycle', { id: uploaded.id, action: 'trash', baseVersion: uploaded.version, baseSiteVersion: version, project });
  }
  log(`Head version ${version}; ${replacements} references replaced; old R2 keys and historical URLs retained`);
  return { planned: plan.length, replacements, version };
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { origin: { type: 'string' }, 'cookie-file': { type: 'string' }, apply: { type: 'boolean', default: false }, help: { type: 'boolean' } } });
  if (values.help) {
    console.log('node scripts/cms-strip-media.mjs --origin URL --cookie-file PATH [--apply]');
    console.log('Dry-run by default. Rehearse on a copy. Before production apply: stop owner edits, take a Time Travel bookmark and preserve R2 originals. Uses authenticated CMS upload, readback and Save; retries adopt deterministic new IDs. A failed run may leave verified unused copies. PNG eXIf needs an Orientation-preserving upload cleaner first; WebP/AVIF need metadata stripping there first.');
    return;
  }
  if (!values.origin || !values['cookie-file']) throw new Error('--origin and --cookie-file are required');
  const origin = new URL(values.origin);
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) throw new Error('Use an HTTPS origin, or a loopback HTTP copy');
  const cookie = (await readFile(values['cookie-file'], 'utf8')).trim();
  if (!cookie || /[\r\n]/.test(cookie)) throw new Error('Cookie file must contain one Cookie header value');
  const request = (path, init = {}) => {
    if (!path.startsWith('/admin/api/') && !MEDIA_PATH.test(path)) throw new Error('Unexpected CMS path');
    return fetch(new URL(path, origin), { ...init, redirect: 'error', headers: { Cookie: cookie, Origin: origin.origin, 'X-CMS-Request': '1', ...init.headers } });
  };
  await stripExistingMedia(request, { apply: values.apply });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
