import assert from 'node:assert/strict';
import test from 'node:test';
import { captureHostProcesses } from './helpers/browser-processes.mjs';

test('failed-browser process evidence is bounded metadata or explicit platform unavailability', async () => {
  const result = await captureHostProcesses([{ id: process.pid, type: 'test-node' }, { id: '../self', type: 'invalid' }, { id: -1, type: 'invalid' }]);
  if (process.platform !== 'linux') {
    assert.match(result.unavailable, /Linux-only/);
    return;
  }
  assert.equal(result.processes.length, 1);
  const current = result.processes[0];
  assert.equal(current.id, process.pid);
  assert.equal(current.executable.value, process.execPath);
  assert.match(current.status.value, /State:/);
  assert.ok(current.threads.length > 0 && current.threads.length <= 48);
  assert.equal(current.threads[0].tid, process.pid);
  assert.ok(current.threads.every(thread => /^[RSDZTWtXxKPI]$/.test(thread.state.state)));
  assert.equal(current.status.value.includes('Uid:'), false, 'retain only the named diagnostic fields');
  assert.ok(Object.hasOwn(result.pressure, 'cpu'));
  assert.ok(Object.hasOwn(result.cgroup, 'cpu.stat'));
});

test('failed-browser process evidence tolerates a process that has exited', async () => {
  const result = await captureHostProcesses([{ id: 2147483647, type: 'exited' }]);
  if (process.platform !== 'linux') { assert.match(result.unavailable, /Linux-only/); return; }
  assert.equal(result.processes[0].executable.unavailable, 'ENOENT');
  assert.equal(result.processes[0].status.unavailable, 'ENOENT');
  assert.equal(result.processes[0].tasksUnavailable, 'ENOENT');
});
