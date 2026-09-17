import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveManagedSvgOperation } from '../src/cms/client/managed-svg-save.mjs';

function harness({ fail = '', changed = false, operation = null } = {}) {
  const calls = [];
  let currentOperation = operation;
  let applied = null;
  let dirty = true;
  const project = { resources: { icon: '/old.png' } };
  const failAt = name => { calls.push(name); if (fail === name) throw new Error(name); };
  return {
    calls,
    state: () => ({ operation: currentOperation, applied, dirty }),
    run: () => saveManagedSvgOperation({
      source: '<svg viewBox="0 0 10 10"><g opacity=".4"></g></svg>',
      baseVersion: 2,
      operation: currentOperation,
      project: () => project,
      unchanged: () => !changed,
      onOperation(value) { currentOperation = value; },
      stage: async input => { failAt('stage'); return { svg: input.svg, operation: { id: 'op', state: 'staged', svg: input.svg } }; },
      rasterize: async () => { failAt('rasterize'); return 'png'; },
      upload: async () => { failAt('upload'); return { id: 'png' }; },
      prepare: async () => { failAt('prepare'); return { operation: { ...currentOperation, state: 'prepared', derivativeId: 'png' } }; },
      finalize: async ({ project: before }) => { failAt('finalize'); return { operation: { ...currentOperation, state: 'committed', derivativeId: 'png' }, svg: currentOperation.svg, asset: { version: 3 }, project: { ...before, resources: { icon: '/png.png' } } }; },
      apply(next) { calls.push('apply'); applied = next; },
      complete: async () => { failAt('complete'); return { operation: { ...currentOperation, state: 'completed' } }; },
      clean() { calls.push('clean'); dirty = false; },
    }),
  };
}

for (const phase of ['rasterize', 'upload', 'prepare']) test(`managed SVG ${phase} failure leaves canonical finalize untouched and dirty state recoverable`, async () => {
  const value = harness({ fail: phase });
  await assert.rejects(value.run(), new RegExp(phase));
  assert.ok(!value.calls.includes('finalize'), value.calls);
  assert.ok(!value.calls.includes('clean'), value.calls);
  assert.equal(value.state().dirty, true);
  assert.equal(value.state().operation?.state, 'staged');
});

test('managed SVG finalize failure stays prepared and never clears dirty state', async () => {
  const value = harness({ fail: 'finalize' });
  await assert.rejects(value.run(), /finalize/);
  assert.equal(value.state().operation.state, 'prepared');
  assert.ok(!value.calls.includes('apply'));
  assert.ok(!value.calls.includes('clean'));
});

test('managed SVG changed-project race records committed recovery but does not apply or clean', async () => {
  const value = harness({ changed: true });
  await assert.rejects(value.run(), error => error.code === 'managed-svg-reconcile');
  assert.equal(value.state().operation.state, 'committed');
  assert.ok(!value.calls.includes('apply'));
  assert.ok(!value.calls.includes('complete'));
  assert.ok(!value.calls.includes('clean'));
});

test('managed SVG retry reuses the operation id for the PNG derivative after prepare failure', async () => {
  const uploadIds = [];
  let operation = null;
  let prepareAttempts = 0;
  const run = () => saveManagedSvgOperation({
    source: '<svg viewBox="0 0 10 10"><g></g></svg>',
    baseVersion: 2,
    operation,
    project: () => ({ resources: {} }),
    unchanged: () => true,
    onOperation(value) { operation = value; },
    stage: async input => ({ svg: input.svg, operation: operation ?? { id: '11111111-1111-4111-8111-111111111111', state: 'staged', svg: input.svg } }),
    rasterize: async () => 'png',
    upload: async (_file, derivativeId) => { uploadIds.push(derivativeId); return { id: derivativeId }; },
    prepare: async () => {
      prepareAttempts += 1;
      if (prepareAttempts === 1) throw new Error('prepare');
      return { operation: { ...operation, state: 'prepared', derivativeId: uploadIds.at(-1) } };
    },
    finalize: async ({ project }) => ({ operation: { ...operation, state: 'committed' }, svg: operation.svg, asset: { version: 3 }, project }),
    apply() {},
    complete: async () => ({ operation: { ...operation, state: 'completed' } }),
    clean() {},
  });

  await assert.rejects(run(), /prepare/);
  await run();
  assert.deepEqual(uploadIds, ['11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111']);
});

test('managed SVG complete failure keeps committed operation dirty after project application', async () => {
  const value = harness({ fail: 'complete' });
  await assert.rejects(value.run(), /complete/);
  assert.equal(value.state().operation.state, 'committed');
  assert.ok(value.calls.includes('apply'));
  assert.ok(!value.calls.includes('clean'));
});

test('managed SVG committed retry skips raster/upload and completes reconciliation before cleaning', async () => {
  const source='<svg viewBox="0 0 10 10"><g opacity=".4"></g></svg>';
  const value = harness({ operation: { id: 'op', state: 'committed', derivativeId: 'png', svg: source } });
  await value.run();
  assert.ok(!value.calls.includes('stage'), value.calls);
  assert.ok(!value.calls.includes('rasterize'), value.calls);
  assert.ok(!value.calls.includes('upload'), value.calls);
  assert.deepEqual(value.calls, ['finalize', 'apply', 'complete', 'clean']);
  assert.equal(value.state().dirty, false);
});
