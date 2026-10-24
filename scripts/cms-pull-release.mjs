import { readFile, readdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { checkCompatibility } from '../src/cms/compatibility.mjs';

// Read-only release gate (A1c). Pulls stored revisions and the whole cms_media
// table with fixed-version SELECTs (never a join against cms_head, never
// `wrangler d1 export`, which blocks the database), rebuilds them on the
// migrations schema in local SQLite and fails closed.
const PAGE = 400000;

export const d1 = database => ({
  prepare(sql) {
    const statement = database.prepare(sql); let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() { return statement.get(...args) ?? null; },
      async all() { return { results: statement.all(...args) }; },
    };
  },
});

// Pure core: rows in, verdict out. revisions: [{ version, project: gzip bytes }].
export async function releaseVerdict({ revisions, media }, { seed, initial }) {
  const database = new DatabaseSync(':memory:', { enableForeignKeyConstraints: false });
  try {
    for (const file of (await readdir('migrations')).filter(name => name.endsWith('.sql')).sort()) database.exec(await readFile(`migrations/${file}`, 'utf8'));
    // Name exactly the columns we hold values for; later migrations add columns with defaults.
    const insert = (table, row) => database.prepare(`INSERT INTO ${table}(${Object.keys(row).map(key => `"${key.replaceAll('"', '""')}"`)}) VALUES (${Object.keys(row).map(() => '?')})`).run(...Object.values(row));
    for (const { version, project } of revisions) insert('cms_revisions', { version, request_id: `release-${version}`, base_version: version - 1, actor: '', created_at: '', payload_hash: '', project, manifest: '[]', summary: '' });
    for (const row of media) insert('cms_media', row);
    database.exec('PRAGMA query_only = ON');
    return await checkCompatibility(d1(database), { seed, initial });
  } finally { database.close(); }
}

// Allowlisted failures are tolerated only outside the head revision.
export function gateFailures(result, head, allow = new Set()) {
  return result.revisions.filter(item => !item.compatible && (item.version === head || !allow.has(item.version)));
}

function select(sql) {
  const run = spawnSync('npx', ['wrangler', 'd1', 'execute', 'CMS_DB', '--remote', '--json', '--command', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) throw new Error(`wrangler exited ${run.status ?? run.error?.code}`);
  const [statement] = JSON.parse(run.stdout);
  if (!statement?.success || !Array.isArray(statement.results)) throw new Error('unexpected wrangler output');
  return statement.results;
}

const integer = value => { const number = Number(value); if (!Number.isSafeInteger(number) || number < 0) throw new Error(`invalid version ${value}`); return number; };

function pullRevision(version) {
  const [row] = select(`SELECT length(project) AS bytes, hex(substr(project, 1, ${PAGE})) AS hex FROM cms_revisions WHERE version = ${version}`);
  if (!row) throw new Error(`revision ${version} missing`);
  const parts = [Buffer.from(row.hex ?? '', 'hex')];
  for (let offset = PAGE + 1; offset <= row.bytes; offset += PAGE) parts.push(Buffer.from(select(`SELECT hex(substr(project, ${offset}, ${PAGE})) AS hex FROM cms_revisions WHERE version = ${version}`)[0]?.hex ?? '', 'hex'));
  const project = Buffer.concat(parts);
  if (project.length !== row.bytes) throw new Error(`revision ${version} read ${project.length} of ${row.bytes} bytes`);
  return { version, project };
}

async function main() {
  const all = process.argv.includes('--all');
  const allow = new Set((process.argv.find(arg => arg.startsWith('--allow='))?.slice(8).split(',').filter(Boolean) ?? []).flatMap(range => {
    const [from, to = from] = range.split('-').map(integer);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }));
  let head, revisions, media;
  try {
    head = integer(select('SELECT version FROM cms_head WHERE id = 1')[0]?.version);
    const versions = all ? select('SELECT version FROM cms_revisions ORDER BY version').map(row => integer(row.version)) : head ? [head] : [];
    revisions = versions.map(pullRevision);
    media = select('SELECT * FROM cms_media');
  } catch (error) { throw new Error(`D1 unreadable (${error.message})`); }
  const { seed, initial } = await import('../.generated/cms-seed.mjs');
  const result = await releaseVerdict({ revisions, media }, { seed, initial });
  const failures = gateFailures(result, head, allow);
  console.log(JSON.stringify({ head, checked: result.revisions.length, failures, allowed: result.revisions.filter(item => !item.compatible && !failures.includes(item)) }, null, 2));
  if (failures.length) process.exitCode = 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await main().catch(error => { console.error(`cms-pull-release: ${error.message}; deploy blocked.`); process.exitCode = 1; });
