import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPIRED_RENDERED_SQL, RENDERED_RETENTION_MS } from '../src/cms/store.mjs';

export const FREE_WRITE_LIMIT = 100000;
const WRITE_BUDGET = 90000;
const VERSION_PAGE = 20;
const integer = (value, name) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${name} must be a non-negative integer`);
  return number;
};

// Reruns select only remaining rows. No cursor can skip an unfinished page.
// Reserve 10,000 writes for other activity; estimate both table and PK writes
// before each DELETE, then account for the actual D1 rows_written receipt.
export async function pruneRendered(query, { apply = false, writtenToday = 0, maxBatches = 1, now, log = console.log } = {}) {
  writtenToday = integer(writtenToday, 'writtenToday');
  maxBatches = integer(maxBatches, 'maxBatches');
  if (!maxBatches) throw new Error('maxBatches must be positive');
  const currentTime = async () => now ? now() : Date.parse((await query("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') AS now")).results[0].now);
  const startedAt = await currentTime();
  const day = new Date(startedAt).toISOString().slice(0, 10);
  const cutoff = new Date(startedAt - RENDERED_RETENTION_MS).toISOString();
  const expired = EXPIRED_RENDERED_SQL.replace('?', `'${cutoff}'`);
  const { results: [total] } = await query(`SELECT count(*) AS rows FROM cms_rendered WHERE ${expired}`);
  log(`${apply ? 'APPLY' : 'DRY RUN'}: ${total.rows} eligible rows; estimated writes including PK: ${total.rows * 2}; cutoff ${cutoff}; @resources and @email retained`);
  let rowsDeleted = 0, rowsWritten = 0;
  for (let batch = 0; batch < maxBatches; batch++) {
    if (new Date(await currentTime()).toISOString().slice(0, 10) !== day) throw new Error('UTC day changed. Read current daily usage and resume.');
    const { results: versions } = await query(`SELECT version, count(*) AS rows FROM cms_rendered WHERE ${expired} GROUP BY version ORDER BY version LIMIT ${VERSION_PAGE}`);
    if (!versions.length) break;
    const ids = versions.map(row => integer(row.version, 'version'));
    const rows = versions.reduce((sum, row) => sum + integer(row.rows, 'rows'), 0);
    const estimatedWrites = rows * 2;
    log(`versions ${ids.join(',')}: ${rows} rows; estimated ${estimatedWrites} writes; daily ${writtenToday + rowsWritten}/${FREE_WRITE_LIMIT}`);
    if (!apply) break;
    if (writtenToday + rowsWritten + estimatedWrites > WRITE_BUDGET) {
      log(`Budget stop: keep ${FREE_WRITE_LIMIT - WRITE_BUDGET} writes reserved; resume with fresh daily usage (or after 00:00 UTC).`);
      break;
    }
    const result = await query(`DELETE FROM cms_rendered WHERE version IN (${ids.join(',')}) AND ${expired}`);
    if (!Number.isSafeInteger(result.meta?.rows_written) || result.meta.rows_written < 0 || !Number.isSafeInteger(result.meta?.changes) || result.meta.changes < 0) throw new Error(`D1 write receipt missing for versions ${ids.join(',')}. Check daily usage before resuming.`);
    rowsWritten += result.meta.rows_written;
    rowsDeleted += result.meta.changes;
    log(`deleted ${result.meta.changes}; written ${result.meta.rows_written}; daily ${writtenToday + rowsWritten}/${FREE_WRITE_LIMIT}`);
    if (result.meta.changes === 0) throw new Error('No progress. Inspect the database before resuming.');
    if (writtenToday + rowsWritten > WRITE_BUDGET) throw new Error('D1 writes exceeded the estimate. Stop and inspect daily usage.');
  }
  return { rowsDeleted, rowsWritten, writtenToday: writtenToday + rowsWritten };
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: {
    apply: { type: 'boolean', default: false }, remote: { type: 'boolean', default: false },
    config: { type: 'string' }, database: { type: 'string', default: 'CMS_DB' },
    'persist-to': { type: 'string' }, 'written-today': { type: 'string' }, 'max-batches': { type: 'string', default: '1' },
    help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log('node scripts/cms-prune-rendered.mjs [--config PATH] [--persist-to PATH] [--remote] [--apply --written-today N] [--max-batches N]');
    console.log('Local, dry-run and one batch by default. Rehearse on a copy first. Before remote apply: stop other writes, take a Time Travel bookmark, read account-wide D1 writes for the current UTC day. Rerun to resume.');
    return;
  }
  if (values.apply && values['written-today'] === undefined) throw new Error('--apply requires --written-today from current account-wide D1 usage');
  const directory = await mkdtemp(join(tmpdir(), 'cms-prune-'));
  try {
    const file = join(directory, 'statement.sql');
    const query = async sql => {
      await writeFile(file, sql);
      const run = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', values.database, values.remote ? '--remote' : '--local', '--json', '--file', file, ...(values.config ? ['--config', values.config] : []), ...(values['persist-to'] ? ['--persist-to', values['persist-to']] : [])], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
      if (run.error || run.status !== 0) throw new Error(`D1 command failed: ${run.error?.message ?? run.stderr ?? run.status}`);
      const [result] = JSON.parse(run.stdout);
      if (!result?.success || !Array.isArray(result.results)) throw new Error('D1 command returned no successful receipt');
      return result;
    };
    await pruneRendered(query, { apply: values.apply, writtenToday: values['written-today'] ?? 0, maxBatches: values['max-batches'] });
  } finally { await rm(directory, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
