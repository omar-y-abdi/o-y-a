import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('quality runs public startup with both Chromium projects', async () => {
  const runner = await source('scripts/run-quality-browser.mjs');
  assert.match(runner, /\['web-e2e', 'npm', \['run', 'test:public-pages'\]/, 'The web-e2e gate must run test:public-pages');
  const { scripts } = JSON.parse(await source('package.json'));
  const runs = scripts['test:public-pages'].split('&&').map(run => run.trim());
  assert.ok(runs.some(run => run.includes('tests/public-startup.spec.mjs') && run.includes('--project=chromium ')), 'Startup must run in the chromium project');
  assert.ok(runs.some(run => run.includes('--project=chromium-webgl')), 'The WebGL project must stay in the public gate');
});

test('CI runs public startup for each compatibility matrix engine', async () => {
  const workflow = await source('.github/workflows/ci.yml');
  const job = workflow.split('\n  editor-compatibility:\n')[1]?.split('\n  stored-revisions:')[0];
  assert.ok(job);
  assert.match(job, /browser: \[firefox, webkit\]/);
  assert.match(job, /run: npx playwright test --project=\$\{\{ matrix\.browser \}\} --no-deps/);
  const config = await source('playwright.config.mjs');
  for (const engine of ['firefox', 'webkit']) {
    const project = config.split('\n').find(line => line.includes(`name: '${engine}'`));
    assert.ok(project?.includes("'public-startup.spec.mjs'"), `${engine} must select the startup spec`);
  }
});

test('QA documents the startup spec without claiming it selects engines itself', async () => {
  const qa = await source('docs/QA.md');
  assert.ok(qa.includes('tests/public-startup.spec.mjs'));
  assert.doesNotMatch(qa, /That file selects Chromium, Firefox and WebKit within its suites/);
});

test('CI and QA do not promise the removed card-export report', async () => {
  const [workflow, qa] = await Promise.all([source('.github/workflows/ci.yml'), source('docs/QA.md')]);
  assert.doesNotMatch(workflow, /output\/card-export\/card-export-report\.json/);
  assert.doesNotMatch(qa, /output\/card-export\//);
});
