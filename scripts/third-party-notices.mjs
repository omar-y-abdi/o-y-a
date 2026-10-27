import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const digest = value => createHash('sha256').update(value).digest('hex');

// Full license texts are tracked for human review. Installed package drift must
// be reviewed explicitly; esbuild's extracted comments are only supplemental.
export async function verifyNotices(root = '.') {
  const read = path => readFile(resolve(root, path), 'utf8');
  const inventory = JSON.parse(await read('licenses/inventory.json'));
  const sections = [];
  for (const entry of inventory.packages) {
    const base = `node_modules/${entry.name}`;
    const pkg = JSON.parse(await read(`${base}/package.json`));
    if (pkg.version !== entry.version) throw new Error(`Review third-party notice update: ${entry.name}@${pkg.version}`);
    let source = await read(`${base}/${entry.file}`);
    if (entry.from) {
      const start = source.indexOf(entry.from);
      if (start < 0) throw new Error(`Missing license section: ${entry.name}`);
      source = source.slice(start);
    }
    if (digest(source) !== entry.sha256) throw new Error(`Unreviewed license/source bytes: ${entry.name}`);
    const notice = entry.notice ? await read(entry.notice) : source;
    if (entry.notice && digest(notice) !== entry.noticeSha256) throw new Error(`Unreviewed upstream notice bytes: ${entry.notice}`);
    sections.push(`## ${entry.name}\n\n${notice.trimEnd()}`);
  }
  for (const entry of inventory.embedded) {
    const notice = await read(entry.file);
    if (digest(notice) !== entry.sha256) throw new Error(`Unreviewed upstream notice bytes: ${entry.file}`);
    sections.push(`## ${entry.name}\n\n${notice.trimEnd()}`);
  }
  for (const [path, expected] of Object.entries(inventory.reviewedVendorFiles)) {
    if (digest(await read(path)) !== expected) throw new Error(`Reinspect embedded third-party code: ${path}`);
  }
  const notices = sections.join('\n\n') + '\n';
  if (await read('THIRD-PARTY-LICENSES.txt') !== notices) throw new Error('Tracked THIRD-PARTY-LICENSES.txt differs from reviewed full texts');
  return notices;
}

export async function verifyBundleNotices(metafile, root = '.') {
  const inventory = JSON.parse(await readFile(resolve(root, 'licenses/inventory.json'), 'utf8'));
  const packages = new Map(inventory.packages.map(entry => [entry.name, entry.version]));
  for (const input of Object.keys(metafile.inputs)) {
    // Use the last node_modules boundary: nested dependencies have their own
    // identity/version and cannot inherit the parent's notice accidentally.
    const match = input.match(/^(.*(?:^|\/)node_modules\/)((?:@[^/]+\/)?[^/]+)\//);
    if (!match) continue;
    const name = match[2];
    if (!packages.has(name)) throw new Error(`Bundle includes an unreviewed third-party package: ${name}`);
    const pkg = JSON.parse(await readFile(resolve(root, match[1], name, 'package.json'), 'utf8'));
    if (packages.get(name) !== pkg.version) throw new Error(`Bundle includes an unreviewed version: ${name}@${pkg.version}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyNotices();
  for (const path of process.argv.slice(2)) await verifyBundleNotices(JSON.parse(await readFile(path, 'utf8')));
}
