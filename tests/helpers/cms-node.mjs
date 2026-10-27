import { build } from 'esbuild';
import { DatabaseSync } from 'node:sqlite';
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { publicationChunks } from '../../src/cms/store.mjs';

// Full Worker handlers with real SQLite transactions and observable BLOB reads.
// Only Access verification/external bindings are replaced. Signed-Access and
// real workerd integration remain covered by cmsRuntime and the API suites.
let workerSource;
export async function nodeWorker() {
  if (!workerSource) {
    const bundle = await build({ entryPoints: ['src/worker.mjs'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', plugins: [{
      name: 'cpu-test-auth',
      setup(plugin) {
        plugin.onLoad({ filter: /[/\\]cms[/\\]auth\.mjs$/ }, () => ({ contents: 'export async function authenticateAdmin(request) { if (request.headers.get("CF-Access-Jwt-Assertion") !== "cpu-test") throw new Error("Missing test auth"); return { email: "owner@example.test", subject: "cpu-test" }; }', loader: 'js' }));
      },
    }] });
    workerSource = bundle.outputFiles[0].text;
  }
  return (await import(`data:text/javascript;base64,${Buffer.from(workerSource).toString('base64')}#${crypto.randomUUID()}`)).default;
}

export async function nodeCms(project, worker, version = 185, { migrationLimit = Infinity } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for (const file of (await readdir('migrations')).filter(name => name.endsWith('.sql') && Number(name.split('_')[0]) <= migrationLimit).sort()) sqlite.exec(await readFile(`migrations/${file}`, 'utf8'));
  const queries = [], blobSizes = [];
  const row = value => value ? Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    if (entry instanceof Uint8Array) { blobSizes.push(entry.byteLength); return [key, Array.from(entry)]; }
    return [key, entry];
  })) : null;
  let transaction = Promise.resolve();
  const db = {
    prepare(sql) {
      queries.push(sql);
      let values = [];
      return {
        bind(...args) { values = args.map(value => value instanceof ArrayBuffer ? new Uint8Array(value) : value); return this; },
        async first() { return row(sqlite.prepare(sql).get(...values)); },
        async all() { return { results: sqlite.prepare(sql).all(...values).map(row) }; },
        async run() { return { meta: sqlite.prepare(sql).run(...values) }; },
      };
    },
    batch(statements) {
      // D1 batches are serialized transactions, not nested SQLite BEGINs.
      const result = transaction.then(async () => {
        sqlite.exec('BEGIN');
        try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec('COMMIT'); return results; }
        catch (error) { sqlite.exec('ROLLBACK'); throw error; }
      });
      transaction = result.catch(() => {});
      return result;
    },
  };
  if (project) {
    sqlite.prepare('INSERT INTO cms_revisions(version,request_id,base_version,actor,created_at,payload_hash,project,manifest,summary) VALUES(?,?,?,?,?,?,?,?,?)').run(version, crypto.randomUUID(), version - 1, 'owner@example.test', '2026-10-11T00:00:00.000Z', 'historical-fixture', gzipSync(JSON.stringify(project)), JSON.stringify(project.pages.map(({ id, path }) => ({ id, path }))), 'fixture');
    sqlite.prepare('UPDATE cms_head SET version=?').run(version);
    for (const item of publicationChunks(project).flat()) sqlite.prepare('INSERT INTO cms_rendered(version,path,html,css,meta) VALUES(?,?,?,?,?)').run(version, item.path, item.html, item.css, JSON.stringify(item.meta));
  }
  const env = { CMS_DB: db, ASSETS: { fetch: async () => new Response('static fixture') } };
  const request = (path, data) => new Request('https://omaryusuf.se' + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { 'CF-Access-Jwt-Assertion': 'cpu-test', Origin: 'https://omaryusuf.se', 'X-CMS-Request': '1', 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return { db, sqlite, env, request, queries, blobSizes, fetch: (path, data) => worker.fetch(request(path, data), env), close: () => sqlite.close() };
}
