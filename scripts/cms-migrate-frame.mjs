import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { select, pullRevision, releaseVerdict } from './cms-pull-release.mjs';
import { toFrameProject, toLegacyProject } from '../src/cms/frame-converter.mjs';
import { validateProject } from '../src/cms/project.mjs';

const hash = project => createHash('sha256').update(JSON.stringify(project)).digest('hex');

export function frameMigration(snapshot, seed, { reverse = false, expectedVersion, expectedHash } = {}) {
  const sourceHash = hash(snapshot.project);
  if (!Number.isSafeInteger(snapshot.version) || snapshot.version < 1 || expectedVersion !== undefined && expectedVersion !== snapshot.version || expectedHash !== undefined && expectedHash !== sourceHash) throw new Error('Huvudrevisionen matchar inte förväntad version och kontrollsumma. Ingenting skrevs.');
  if (snapshot.project.schemaVersion === (reverse ? 1 : 2)) throw new Error('Huvudrevisionen har redan det valda formatet.');
  const converted = reverse ? toLegacyProject(snapshot.project, seed) : toFrameProject(snapshot.project, seed);
  const project = validateProject(converted, seed);
  return { project, expectedVersion: snapshot.version, expectedHash: sourceHash, projectHash: hash(project), reverse };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--reverse', '--dry-run', '--local'].includes(arg) && !/^--(?:expect-version|expect-hash|request-id|origin|persist-to)=/.test(arg))) throw new Error('Använd --dry-run eller --apply, valfritt --reverse, --expect-version=N, --expect-hash=SHA256, --request-id=UUID, --origin=URL samt --local --persist-to=SÖKVÄG för kopian.');
  const value = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const apply = args.includes('--apply'), reverse = args.includes('--reverse');
  if (apply && args.includes('--dry-run')) throw new Error('Välj --dry-run eller --apply.');
  const expectedVersion = value('expect-version') === undefined ? undefined : Number(value('expect-version'));
  const expectedHash = value('expect-hash');
  const local = args.includes('--local'), persistTo = value('persist-to');
  if (persistTo && !local) throw new Error('--persist-to kräver --local.');
  if (apply && (expectedVersion === undefined || !/^[0-9a-f]{64}$/.test(expectedHash ?? ''))) throw new Error('--apply kräver --expect-version och --expect-hash från den repeterade migreringen.');
  const version = Number(select('SELECT version FROM cms_head WHERE id = 1', { local, persistTo })[0]?.version);
  const row = pullRevision(version, { local, persistTo });
  const snapshot = { version, project: JSON.parse(gunzipSync(row.project).toString('utf8')) };
  const { seed, initial } = await import('../.generated/cms-seed.mjs');
  const intent = frameMigration(snapshot, seed, { reverse, expectedVersion, expectedHash });
  const verdict = await releaseVerdict({ revisions: [{ version, project: gzipSync(JSON.stringify(intent.project)) }], media: select('SELECT * FROM cms_media', { local, persistTo }) }, { seed, initial });
  const failure = verdict.revisions.find(item => !item.compatible);
  if (failure) throw new Error(`Migreringen kan inte publiceras: ${failure.error}`);
  const requestId = value('request-id') ?? randomUUID();
  console.log(JSON.stringify({ dryRun: !apply, reverse, expectedVersion: intent.expectedVersion, expectedHash: intent.expectedHash, projectHash: intent.projectHash, requestId, beforeBytes: Buffer.byteLength(JSON.stringify(snapshot.project)), afterBytes: Buffer.byteLength(JSON.stringify(intent.project)) }, null, 2));
  if (!apply) return;
  if (local && !value('origin')) throw new Error('--local --apply kräver kopians uttryckliga --origin.');
  const origin = new URL(value('origin') ?? 'https://omaryusuf.se');
  const localOrigin = ['localhost', '127.0.0.1'].includes(origin.hostname);
  if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password || (local ? !localOrigin || !['http:', 'https:'].includes(origin.protocol) : origin.protocol !== 'https:' || origin.hostname !== 'omaryusuf.se')) throw new Error('Migreringens origin behöver matcha produktionen eller den uttryckligen valda lokala kopian.');
  const cookie = process.env.CMS_MIGRATION_COOKIE;
  if (!cookie) throw new Error('--apply kräver CMS_MIGRATION_COOKIE för samma Cloudflare Access-kontroll som studion.');
  const { project: _project, ...body } = intent;
  const response = await fetch(new URL('/admin/api/migrate-frame', origin), { method: 'POST', redirect: 'error', headers: { Cookie: cookie, Origin: origin.origin, 'Content-Type': 'application/json', 'X-CMS-Request': '1' }, body: JSON.stringify({ ...body, requestId }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? `Migreringen avvisades (${response.status}).`);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await main().catch(error => { console.error(error.message); process.exitCode = 1; });
