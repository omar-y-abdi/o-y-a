import { captureHostProcesses } from './browser-processes.mjs';

async function bounded(operation, timeout = 1500) {
  let timer;
  const startedAt = Date.now();
  try {
    const result = await Promise.race([
      operation.then(value => ({ value }), error => ({ error: String(error) })),
      new Promise(resolve => { timer = setTimeout(() => resolve({ unavailable: `No response within ${timeout}ms` }), timeout); }),
    ]);
    return { ...result, startedAt, receivedAt: Date.now() };
  } finally { clearTimeout(timer); }
}

// Only called after a failed assertion and its ordinary DOM/HTTP observations.
// No sessions, tracing, console markers or debugger intervention alter startup.
export async function captureCardFailure(page, browser, readPoll) {
  const sessions = [];
  let disposed = false;
  async function connect(factory) {
    const result = await bounded(Promise.resolve().then(factory).then(session => {
      if (disposed) void bounded(session.detach());
      else sessions.push(session);
      return session;
    }));
    const { value: session, ...receipt } = result;
    return { session, receipt: { ...receipt, connected: !!session } };
  }
  try {
    const [connection, target] = await Promise.all([
      connect(() => browser.newBrowserCDPSession()),
      connect(() => page.context().newCDPSession(page)),
    ]);
    const version = connection.session ? bounded(connection.session.send('Browser.getVersion')) : null;
    const processes = connection.session ? (async () => {
      const before = await bounded(connection.session.send('SystemInfo.getProcessInfo'));
      const hostBefore = before.value ? await bounded(captureHostProcesses(before.value.processInfo), 750) : null;
      await new Promise(resolve => setTimeout(resolve, 500));
      const after = await bounded(connection.session.send('SystemInfo.getProcessInfo'));
      const hostAfter = after.value ? await bounded(captureHostProcesses(after.value.processInfo), 750) : null;
      return { before, after, hostBefore, hostAfter };
    })() : null;
    const dom = target.session ? bounded(target.session.send('Runtime.evaluate', {
      // The fresh protocol session uses the default context, independently of
      // Playwright's pending Frame.evaluate/utility-script observation path.
      expression: `(() => {
        const host = document.querySelector('[data-win-artwork]');
        return { path: location.pathname, readyState: document.readyState,
          artwork: !!host, connected: !!host?.isConnected, shadow: !!host?.shadowRoot,
          text: host?.shadowRoot?.querySelector('[data-card-text]')?.textContent?.slice(0, 1000) ?? null };
      })()`,
      returnByValue: true, timeout: 1500,
    }), 2000).then(result => ({ ...result, pollAtResponse: readPoll() })) : null;
    return {
      connections: { browser: connection.receipt, page: target.receipt },
      version: await version, processes: await processes, dom: await dom,
      // A later direct-CDP response may reflect recovery. It does not by itself
      // establish the cause of the original stalled observation.
      pollAtCaptureEnd: readPoll(),
    };
  } finally {
    disposed = true;
    await Promise.all(sessions.map(session => bounded(session.detach())));
  }
}
