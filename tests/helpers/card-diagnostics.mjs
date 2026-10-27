const PREFIX = 'card-observation:';
const TRACE_LIMIT = 4 * 1024 * 1024;
const TRACE_STOP_MS = 5000;

async function bounded(operation, timeout = 1500) {
  let timer;
  try {
    return await Promise.race([
      operation.then(value => ({ value }), error => ({ error: String(error) })),
      new Promise(resolve => { timer = setTimeout(() => resolve({ unavailable: `No response within ${timeout}ms` }), timeout); }),
    ]);
  } finally { clearTimeout(timer); }
}

// Observations never retry an action, change its result or extend its assertion
// deadline. Only failure capture interrupts JS. The phase ring lives in Node so
// collected markers remain available when the renderer stops answering requests.
export async function cardDiagnostics(page, browser) {
  const phases = [];
  const onConsole = message => {
    const text = message.text();
    if (!text.startsWith(PREFIX)) return;
    phases.push({ at: Date.now(), text: text.slice(PREFIX.length, PREFIX.length + 1000) });
    if (phases.length > 80) phases.shift();
  };
  page.on('console', onConsole);
  const browserSession = await browser.newBrowserCDPSession();
  let pageSession;
  try { pageSession = await page.context().newCDPSession(page); }
  catch (error) { page.off('console', onConsole); await bounded(browserSession.detach()); throw error; }
  let traceFinished = false, discardLateStream = false, completeTrace;
  const tracingComplete = new Promise(resolve => { completeTrace = resolve; });
  browserSession.on('Tracing.tracingComplete', event => {
    completeTrace(event);
    if (discardLateStream && event.stream) void bounded(browserSession.send('IO.close', { handle: event.stream }), 500);
  });
  // One export worker owns this browser. Keep a rolling native trace before the
  // possible stall; successful tests stop/discard it, failures retain bounded bytes.
  const traceStarted = await bounded(browserSession.send('Tracing.start', {
    transferMode: 'ReturnAsStream',
    traceConfig: { recordMode: 'recordContinuously', traceBufferSizeInKb: 1024,
      includedCategories: ['toplevel', 'devtools.timeline', 'v8', 'blink.user_timing'] },
  }));
  async function finishTrace(retain) {
    if (traceFinished) return { alreadyFinished: true };
    traceFinished = true;
    const startedAt = Date.now(), deadline = startedAt + TRACE_STOP_MS;
    const within = operation => bounded(operation, Math.max(1, Math.min(1500, deadline - Date.now() - 500)));
    const end = await within(browserSession.send('Tracing.end'));
    const completed = await within(tracingComplete);
    const metadata = { start: traceStarted, end, completion: completed, limitBytes: TRACE_LIMIT, startedAt };
    const handle = completed.value?.stream;
    if (!handle) {
      discardLateStream = true;
      return { metadata: { ...metadata, elapsedMs: Date.now() - startedAt } };
    }
    const chunks = [];
    let bytes = 0, eof = false, readError;
    try {
      while (retain && !eof && bytes < TRACE_LIMIT && Date.now() < deadline - 500) {
        const read = await within(browserSession.send('IO.read', { handle, size: Math.min(65536, TRACE_LIMIT - bytes) }));
        if (!read.value) { readError = read; break; }
        const data = Buffer.from(read.value.data, read.value.base64Encoded ? 'base64' : 'utf8');
        const accepted = data.subarray(0, TRACE_LIMIT - bytes);
        chunks.push(accepted); bytes += accepted.length;
        eof = !!read.value.eof && accepted.length === data.length;
      }
    } finally { await bounded(browserSession.send('IO.close', { handle }), 500); }
    return { metadata: { ...metadata, bytes, complete: retain && eof, truncated: retain && !eof,
      discarded: !retain, readError, elapsedMs: Date.now() - startedAt },
    ...(retain && bytes ? { trace: Buffer.concat(chunks, bytes) } : {}) };
  }
  const scripts = new Map();
  pageSession.on('Debugger.scriptParsed', script => {
    if (scripts.size < 200) scripts.set(script.scriptId, script.url.slice(0, 500));
  });
  let paused;
  const stopped = new Promise(resolve => { paused = resolve; });
  pageSession.on('Debugger.paused', event => {
    paused({ reason: event.reason, frames: event.callFrames.slice(0, 12).map(frame => ({
      function: frame.functionName.slice(0, 200), url: (frame.url || scripts.get(frame.location.scriptId))?.slice(0, 500), location: frame.location,
    })) });
    // Resume even if this event arrives after our diagnostic deadline.
    void pageSession.send('Debugger.resume').catch(() => {});
  });
  return {
    async capture() {
      const version = bounded(browserSession.send('Browser.getVersion'));
      const targets = bounded(browserSession.send('Target.getTargets')).then(result => 'value' in result
        ? { value: result.value.targetInfos.slice(0, 30).map(target => ({ type: target.type, id: target.targetId, url: target.url.slice(0, 300), attached: target.attached })) } : result);
      const processes = (async () => {
        const beforeAt = Date.now();
        const before = await bounded(browserSession.send('SystemInfo.getProcessInfo'));
        const beforeReceivedAt = Date.now();
        await new Promise(resolve => setTimeout(resolve, 500));
        const afterAt = Date.now();
        const after = await bounded(browserSession.send('SystemInfo.getProcessInfo'));
        return { before, after, beforeAt, beforeReceivedAt, afterAt, afterReceivedAt: Date.now() };
      })();
      // Complete CPU sampling and native tracing before deliberately pausing JS;
      // otherwise our own pause could masquerade as an idle renderer.
      const browserState = { version: await version, targets: await targets, processes: await processes };
      const { trace, metadata: tracing } = await finishTrace(true);
      // A stack may identify interruptible JS. Missing markers or a missing pause
      // cannot by themselves distinguish native work from transport nonresponse.
      const enabled = await bounded(pageSession.send('Debugger.enable'));
      const pause = 'value' in enabled ? await bounded(pageSession.send('Debugger.pause')) : null;
      // A pause event can arrive even if its command acknowledgement times out.
      const stack = pause ? await bounded(stopped) : null;
      return { phases: phases.slice(), ...browserState, tracing, enabled, pause, stack, trace };
    },
    async dispose() {
      page.off('console', onConsole);
      await finishTrace(false);
      await Promise.all([
        bounded(pageSession.send('Debugger.disable')).then(() => bounded(pageSession.detach())),
        bounded(browserSession.detach()),
      ]);
    },
  };
}
