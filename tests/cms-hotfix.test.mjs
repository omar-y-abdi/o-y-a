import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const chain = pkg.scripts['deploy:cloudflare'];

function assertDeployOrder(command) {
  const steps = command.split('&&').map(step => step.trim());
  assert.ok(steps.every(step => step && !/[;|&\r\n]/.test(step)), 'only && chaining, so any failure stops the deploy');
  const at = pattern => steps.findIndex(step => pattern.test(step));
  const build = at(/^(?:npm\s+run\s+build|node\s+(?:\.\/)?scripts\/build\.mjs)(?:\s|$)/);
  const gate = at(/^node\s+(?:\.\/)?scripts\/cms-pull-release\.mjs(?:\s|$)/);
  const migrate = steps.findIndex(step => /^(?:npx\s+)?wrangler\s+d1\s+migrations\s+apply\s+CMS_DB(?:\s|$)/.test(step) && /(?:^|\s)--remote(?:\s|$)/.test(step));
  const deployments = steps.map((step, index) => /^(?:npx\s+)?wrangler\s+deploy(?:\s|$)/.test(step) ? index : -1).filter(index => index >= 0);
  assert.ok(build >= 0, 'Workers Builds has no build command, so the deploy must build .generated/ itself');
  assert.ok(gate > build, 'the stored-revision gate runs after the build');
  assert.ok(migrate > gate, 'remote CMS_DB migrations follow the gate');
  assert.equal(deployments.length, 1, 'exactly one Worker publish step');
  const [deploy] = deployments;
  assert.ok(!/(?:^|\s)--dry-run(?:\s|$)/.test(steps[deploy]), 'the deploy chain must publish the Worker');
  assert.ok(deploy > migrate, 'migrations run before wrangler deploy');
}

test('Cloudflare deploy builds, gates on stored revisions, then applies D1 migrations before publishing the Worker', () => {
  assertDeployOrder(chain);
});

test('deploy ordering accepts extra steps and Wrangler flags without fixing literal commands or positions', () => {
  assertDeployOrder('node scripts/build.mjs && node scripts/cms-pull-release.mjs --all && echo ready && npx wrangler d1 migrations apply CMS_DB --config wrangler.jsonc --remote && npx wrangler deploy --config wrangler.jsonc');
});

test('deploy ordering rejects swapping migrations and Worker publication', () => {
  const steps = chain.split('&&');
  const migrate = steps.findIndex(step => /\bwrangler\s+d1\s+migrations\b/.test(step));
  const deploy = steps.findIndex(step => /\bwrangler\s+deploy\b/.test(step));
  assert.ok(migrate >= 0 && deploy >= 0, 'both steps must exist for the mutation');
  [steps[migrate], steps[deploy]] = [steps[deploy], steps[migrate]];
  assert.throws(() => assertDeployOrder(steps.join('&&')), /migrations run before wrangler deploy/);
});

test('deploy ordering rejects missing remote migrations and failure-bypassing chains', () => {
  assert.throws(() => assertDeployOrder(chain.replace(/--remote\b/, '')), /remote CMS_DB migrations/);
  assert.throws(() => assertDeployOrder(chain.replace('&&', ';')), /only && chaining/);
  assert.throws(() => assertDeployOrder(chain.replace('&&', '||')), /only && chaining/);
});
