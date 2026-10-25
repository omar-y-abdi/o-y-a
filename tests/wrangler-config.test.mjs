import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

test('private attachment query credentials are redacted from Worker logs and traces', async () => {
  const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
  assert.equal(config.observability.redact_query_string, true);
});

test('private attachment retention has an hourly scheduled trigger', async () => {
  const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
  assert.deepEqual(config.triggers.crons, ['17 * * * *']);
});

// A15: the deleted staging Worker shared production's D1 and R2. Only wrangler.jsonc may bind them.
test('only wrangler.jsonc binds the production D1 database and R2 bucket', async () => {
  const configs = await Promise.all((await readdir('.')).filter(name => /^wrangler.*\.jsonc?$/.test(name)).map(async name => [name, await readFile(name, 'utf8')]));
  const production = new Map(configs).get('wrangler.jsonc');
  const bucket = production.match(/"bucket_name"\s*:\s*"([^"]+)"/)?.[1];
  assert.ok(bucket, 'wrangler.jsonc binds an R2 bucket');
  for (const binding of ['07048c08-64ee-413d-ae08-2ec947c533ae', bucket]) {
    assert.deepEqual(configs.filter(([, text]) => text.includes(binding)).map(([name]) => name), ['wrangler.jsonc'], binding);
  }
});
