import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));

test('Cloudflare deploy applies D1 migrations before publishing the Worker', () => {
  assert.equal(pkg.scripts['deploy:cloudflare'], 'wrangler d1 migrations apply CMS_DB --remote && wrangler deploy');
  assert.equal(pkg.scripts.deploy, 'npm run check && npm run deploy:cloudflare');
});
