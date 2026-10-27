import { open, readdir, readlink } from 'node:fs/promises';

// Read only bounded, non-secret OS metadata after a browser assertion failed.
// No process environment, command line, memory, signal or debugger access.
async function text(path, bytes = 4096) {
  let file;
  try {
    file = await open(path, 'r');
    const buffer = Buffer.alloc(bytes), result = await file.read(buffer, 0, bytes, 0);
    return { value: buffer.subarray(0, result.bytesRead).toString(), truncated: result.bytesRead === bytes };
  } catch (error) { return { unavailable: error.code ?? String(error) }; }
  finally { await file?.close(); }
}

async function thread(pid, tid) {
  const root = `/proc/${pid}/task/${tid}`;
  const [name, state, wait] = await Promise.all([text(`${root}/comm`, 128), text(`${root}/stat`, 2048), text(`${root}/wchan`, 128)]);
  const fields = state.value?.slice(state.value.lastIndexOf(')') + 2).trim().split(/\s+/);
  return { tid, name, wait, state: fields ? { state: fields[0], userTicks: fields[11], systemTicks: fields[12], processor: fields[36] } : state };
}

export async function captureHostProcesses(processes) {
  if (process.platform !== 'linux') return { unavailable: `OS metadata is Linux-only (${process.platform})` };
  const selected = processes.filter(process => Number.isSafeInteger(process.id) && process.id > 0 && process.id <= 2147483647).slice(0, 8);
  const captured = await Promise.all(selected.map(async process => {
    const root = `/proc/${process.id}`;
    const executable = await readlink(`${root}/exe`).then(value => ({ value }), error => ({ unavailable: error.code ?? String(error) }));
    const status = await text(`${root}/status`);
    if (status.value) status.value = status.value.split('\n').filter(line => /^(Name|State|TracerPid|Threads|VmRSS|VmSize|voluntary_ctxt_switches|nonvoluntary_ctxt_switches):/.test(line)).join('\n');
    const tasks = await readdir(`${root}/task`).then(values => ({ values: values.filter(value => /^\d+$/.test(value)).map(Number).sort((a, b) => a === process.id ? -1 : b === process.id ? 1 : a - b) }), error => ({ unavailable: error.code ?? String(error) }));
    const threads = await Promise.all((tasks.values ?? []).slice(0, 48).map(tid => thread(process.id, tid)));
    return { id: process.id, type: process.type, executable, status, threads, threadCount: tasks.values?.length, threadsTruncated: (tasks.values?.length ?? 0) > 48, ...(tasks.unavailable ? { tasksUnavailable: tasks.unavailable } : {}) };
  }));
  const pressure = Object.fromEntries(await Promise.all(['cpu', 'memory', 'io'].map(async name => [name, await text(`/proc/pressure/${name}`)])));
  const cgroup = Object.fromEntries(await Promise.all(['cpu.stat', 'cpu.max', 'memory.current', 'memory.max', 'memory.events'].map(async name => [name, await text(`/sys/fs/cgroup/${name}`)])));
  return { sampledAt: Date.now(), processes: captured, processesTruncated: processes.length > 8, pressure, cgroup };
}
