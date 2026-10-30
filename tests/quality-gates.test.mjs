import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
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

test('retired Python gates preserve their qualified engine registrations', async () => {
  const config = (await import('../playwright.config.mjs')).default;
  const qualified = ['cms-modules.spec.mjs', 'managed-svg-fidelity.spec.mjs', 'test_cms_browser_helpers.spec.mjs', 'test_cms_asset_usage.spec.mjs', 'cms-review-browser.spec.mjs', 'cms-review-final-browser.spec.mjs', 'footer-cms-browser.spec.mjs'];
  for (const engine of ['firefox', 'webkit']) {
    const project = config.projects.find(item => item.name === engine);
    for (const spec of qualified) assert.ok(project.testMatch.includes(spec), `${engine} must retain ${spec}`);
  }
  const [workflow, packageSource, compatibility] = await Promise.all([source('.github/workflows/ci.yml'), source('package.json'), source('scripts/test-cms-compat.mjs')]);
  const { scripts } = JSON.parse(packageSource);
  for (const spec of qualified) {
    assert.ok(scripts['test:cms'].includes(spec), `The Chromium CMS command must retain ${spec}`);
    assert.ok(compatibility.includes(spec), `The explicit compatibility command must retain ${spec}`);
  }
  const remainingRunners = await Promise.all(['scripts/test-cms.mjs', 'scripts/run-quality-browser.mjs', 'scripts/quality.sh'].map(source));
  for (const spec of ['cms-browser.spec.mjs', 'cms-interactions.spec.mjs']) assert.ok(scripts['test:cms'].includes(`tests/${spec}`), `The qualified ${spec} scenarios must remain in the Chromium CMS command`);
  const invoked = workflow + packageSource + compatibility + remainingRunners.join('');
  assert.doesNotMatch(invoked, /'tests\/cms-(?:browser|interactions)\.py'/, 'The qualified standalone Python gates must not run twice');
  assert.doesNotMatch(invoked, /test_cms_(?:browser_helpers|asset_usage)\.py|CMS_SKIP_HELPERS/);
  assert.doesNotMatch(invoked, /tests\/(?:browser|revision_browser|cms-review-browser|cms-review-final-browser|footer-cms-browser)\.py|test_revision_scroll\.py|test-cms-parallel\.mjs|test-footer-cms\.mjs/, 'Retired Python gates and runners must not be invoked');
  assert.doesNotMatch(workflow + packageSource + compatibility, /(?:test|prepare)-cms-modules(?:-parallel)?\.mjs|managed-svg-fidelity\.py/);
});

test('CI and QA do not promise the removed card-export report', async () => {
  const [workflow, qa] = await Promise.all([source('.github/workflows/ci.yml'), source('docs/QA.md')]);
  assert.doesNotMatch(workflow, /output\/card-export\/card-export-report\.json/);
  assert.doesNotMatch(qa, /output\/card-export\//);
});

test('CI selects every functional browser spec and the nested SKIFT unit suite', async () => {
  const [workflow, packageSource, names, qualityRunner] = await Promise.all([source('.github/workflows/ci.yml'), source('package.json'), readdir(new URL('.', import.meta.url)), source('scripts/run-quality-browser.mjs')]);
  const { scripts } = JSON.parse(packageSource);
  // The public command is invoked by quality's web-e2e runner, pinned above,
  // which also names the interaction and revision specs.
  // The evidence capture has no baseline comparison and remains an owner tool.
  const commands = workflow.split('\n').filter(line => !line.trimStart().startsWith('#')).join('\n') + '\n' + scripts['test:public-pages'] + '\n' + qualityRunner;
  const selected = new Set([...commands.matchAll(/tests\/([\w-]+\.spec\.mjs)/g)].map(match => match[1]));
  const functional = names.filter(name => name.endsWith('.spec.mjs') && name !== 'public-evidence.spec.mjs');
  assert.deepEqual(functional.filter(name => !selected.has(name)), [], 'Every functional spec must be named in an executed CI browser command');
  assert.match(workflow, /run: node --test --test-concurrency=1 games\/skift\/tests\/\*\.test\.mjs/);
  const job = workflow.split('\n  functional-browser:\n')[1]?.split('\n  # Manual only.')[0];
  assert.ok(job);
  assert.match(job, /npx playwright install --with-deps chromium/);
  assert.match(job, /run: npm run build/);
  assert.match(job, /--project=chromium --no-deps --workers=2/);
  assert.doesNotMatch(job, /revision_browser|public-interactions/, 'quality owns these specs; a second run only costs time');
});

test('manual retained-history gate requires reviewed exact errors through an environment input', async () => {
  const workflow = await source('.github/workflows/ci.yml');
  assert.match(workflow, /historical_errors_json:[\s\S]*?required: true/);
  assert.match(workflow, /HISTORICAL_ERRORS_JSON: \$\{\{ inputs\.historical_errors_json \}\}/);
  assert.match(workflow, /node scripts\/cms-release-errors\.mjs/);
  assert.match(workflow, /cms-pull-release\.mjs --all --allow=1-4,84-88 --allow-errors="\$CMS_ALLOW_ERRORS_FILE"/);
  assert.doesNotMatch(workflow, /run:.*\$\{\{ inputs\.historical_errors_json/);
});

test('CI installs Python only for the skift release and runs the card corpus split', async () => {
  const workflow = await source('.github/workflows/ci.yml');
  const skiftRelease = workflow.split('\n  skift-release:\n')[1]?.split('\n  editor-compatibility:\n')[0];
  assert.ok(skiftRelease);
  assert.doesNotMatch(workflow.replace(skiftRelease, ''), /setup-python/);
  assert.doesNotMatch(workflow, /requirements-test\.txt/);
  const quality = workflow.split('\n  quality:\n')[1]?.split('\n  skift-release:\n')[0];
  const fullMatrix = workflow.split('\n  card-exports-full:\n')[1];
  assert.ok(quality?.includes('CARD_CORPUS: pr'));
  assert.ok(workflow.includes("'17 2 * * *'"));
  assert.ok(fullMatrix);
  assert.doesNotMatch(fullMatrix, /CARD_CORPUS/, 'The full job must export every card');
  assert.match(fullMatrix, /--grep='all 240 production card exports' --workers=1/);
});
