const clock = { now: () => performance.now(), sleep: ms => new Promise(resolve => setTimeout(resolve, ms)) };

export class CheckFailure extends Error {}

// Exact offsets matter: a one-pixel step or a fractional offset is not zero.
export async function waitScrollSettled(page, { timeout = 3000, timer = clock } = {}) {
  const deadline = timer.now() + timeout;
  let previous = await page.evaluate('scrollY'), stable = 0;
  while (timer.now() < deadline) {
    await timer.sleep(80);
    const current = await page.evaluate('scrollY');
    if (current === previous) {
      stable++;
      if (stable >= 3) return current;
    } else stable = 0;
    previous = current;
  }
  throw new CheckFailure(`scrollningen stabiliserades inte (senast ${previous})`);
}

export async function waitAtTop(page, { timeout = 5000, timer = clock } = {}) {
  const deadline = timer.now() + timeout;
  let reached = false;
  while (timer.now() < deadline) {
    if (await page.evaluate('scrollY') === 0) { reached = true; break; }
    await timer.sleep(50);
  }
  if (!reached) throw new CheckFailure('timeout väntade på toppläge');
  const current = await waitScrollSettled(page, { timeout, timer });
  if (current !== 0) throw new CheckFailure(`toppläget flyttades efter klicket: scrollY=${current}`);
  return current;
}

export function fikaCommentCandidates(seconds) {
  const comment = elapsed => {
    const error = Math.abs(elapsed - 5000);
    if (error <= 150) return 'äggklocka';
    if (error <= 600) return 'Lagom bryggt';
    if (elapsed < 3500) return 'espresso';
    if (elapsed < 5000) return 'tjuvstart';
    if (elapsed < 7500) return 'påtår';
    return 'kallna';
  };
  const displayed = seconds * 1000;
  return new Set([comment(displayed - 5), comment(displayed), comment(displayed + 5)]);
}
