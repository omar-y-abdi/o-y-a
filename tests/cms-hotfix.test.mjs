import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const steps = pkg.scripts['deploy:cloudflare'].split('&&').map(step => step.trim());
const at = pattern => steps.findIndex(step => pattern.test(step));

test('Cloudflare deploy gates on stored revisions, then applies D1 migrations, before publishing the Worker', () => {
  const gate = at(/^node scripts\/cms-pull-release\.mjs$/), migrate = at(/^(npx )?wrangler d1 migrations apply CMS_DB --remote$/), deploy = at(/^(npx )?wrangler deploy\b/);
  assert.equal(gate, 0, 'the read-only release gate runs first');
  assert.ok(migrate > gate, 'migrations follow the gate');
  assert.ok(deploy > migrate, 'migrations run before wrangler deploy');
  assert.equal(steps.filter(step => /\bwrangler deploy\b/.test(step)).length, 1);
  assert.ok(!/[;|]/.test(pkg.scripts['deploy:cloudflare']), 'only && chaining, so any failure stops the deploy');
  assert.equal(pkg.scripts.deploy, 'npm run check && npm run deploy:cloudflare');
});
