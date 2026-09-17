import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const app = await readFile('src/cms/client/app.mjs', 'utf8');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));

test('asset usage refresh cannot replace an in-progress metadata form', () => {
  assert.doesNotMatch(app, /if \(current === view\) assetDetail\(item, usage\);/,
    'a delayed asset-usage response must not rebuild the metadata form');
  assert.match(app, /if \(current === view\) updateAssetUsage\(usage\);/,
    'asset usage must be updated in place');
});

test('Cloudflare deploy applies D1 migrations before publishing the Worker', () => {
  assert.equal(pkg.scripts['deploy:cloudflare'], 'wrangler d1 migrations apply CMS_DB --remote && wrangler deploy');
  assert.equal(pkg.scripts.deploy, 'npm run check && npm run deploy:cloudflare');
});
