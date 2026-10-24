import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { seed, initial } from '../.generated/cms-seed.mjs';
import { checkCompatibility } from '../src/cms/compatibility.mjs';
import { d1 } from './cms-pull-release.mjs';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/cms-check-release.mjs path/to/trusted-d1-export.sql');
// D1 exec() splits on newlines, including those inside exported text literals.
// Use SQLite's real SQL parser. This is a local copy, never the live database.
const database = new DatabaseSync(':memory:', { enableForeignKeyConstraints: false });
try {
  database.exec(await readFile(file, 'utf8'));
  database.exec('PRAGMA query_only = ON');
  const result = await checkCompatibility(d1(database), { seed, initial });
  console.log(JSON.stringify(result, null, 2));
  if (!result.compatible) process.exitCode = 1;
} finally { database.close(); }
