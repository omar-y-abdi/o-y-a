import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function gameNotices(packageRoot, dependenciesRoot) {
  const sections = [];
  for (const [name, file] of [['three', 'LICENSE'], ['cannon-es', 'LICENSE'], ['howler', 'LICENSE.md'], ['esbuild', 'LICENSE.md']]) {
    // Missing or changed notices fail the build, including the standalone ZIP.
    const text = await readFile(resolve(dependenciesRoot, name, file), 'utf8');
    sections.push(`## ${name}\n\n${text.trimEnd()}`);
  }
  const notices = sections.join('\n\n') + '\n';
  if (await readFile(resolve(packageRoot, 'THIRD-PARTY-LICENSES.txt'), 'utf8') !== notices) throw new Error('Review SKIFT third-party license changes before building');
  return notices;
}
