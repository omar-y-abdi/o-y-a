import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { seed, initial } from '../.generated/cms-seed.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/cms-check-release.mjs path/to/d1-export.sql');
const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch(){ return new Response("release-check"); } }', compatibilityDate: '2026-09-11', d1Databases: ['CMS_DB'] }));
try {
  const db = await mf.getD1Database('CMS_DB');
  await db.exec(await readFile(file, 'utf8'));
  const result = await checkCompatibility(db, { seed, initial });
  console.log(JSON.stringify(result, null, 2));
  if (!result.compatible) process.exitCode = 1;
} finally { await mf.dispose(); }
