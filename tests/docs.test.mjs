import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));

test('npm test builds through pretest', () => {
  assert.equal(scripts.pretest, 'npm run build', 'package.json scripts.pretest must build before npm test');
});

test('check uses the test build without building twice', () => {
  assert.equal(scripts.check, 'npm run lint && npm test', 'package.json scripts.check must lint and call npm test without another build');
});

test('check:fast keeps its own build', () => {
  assert.match(scripts['check:fast'], /^npm run build &&/, 'package.json scripts.check:fast must build before its direct test runner');
});

test('root dist output is ignored', () => {
  assert.match(readFileSync('.gitignore', 'utf8'), /^\/dist\/$/m, '.gitignore must ignore /dist/');
});

test('dist output is not tracked by Git', () => {
  const tracked = execFileSync('git', ['ls-files', '--', 'dist/'], { encoding: 'utf8' }).trim();
  assert.equal(tracked, '', 'dist/ must have no tracked files; remove them with git rm -r --cached dist');
});

test('privacy decisions exist at the moved documentation path', () => {
  assert.ok(existsSync('docs/PRIVACY-DECISIONS.md'), 'Missing docs/PRIVACY-DECISIONS.md');
});

test('README and docs relative links resolve to files and headings', () => {
  const files = ['README.md', ...readdirSync('docs', { recursive: true }).filter(file => file.endsWith('.md')).map(file => `docs/${file}`)];
  const slug = text => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
  for (const file of files) {
    const source = readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```/gm, '');
    for (const [, href] of source.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) continue;
      const target = new URL(href, pathToFileURL(resolve(file)));
      assert.ok(existsSync(target), `${file}: missing link target ${href}`);
      if (target.hash) {
        const headings = [...readFileSync(target, 'utf8').matchAll(/^#{1,6} (.+)$/gm)].map(([, text]) => slug(text));
        assert.ok(headings.includes(decodeURIComponent(target.hash.slice(1))), `${file}: missing heading ${href}`);
      }
    }
  }
});
