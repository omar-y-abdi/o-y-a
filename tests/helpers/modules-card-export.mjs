import { expect } from '@playwright/test';

export class CardFailure extends Error {}

export async function waitForRenderedCard(page, expectedText) {
  let state;
  await expect.poll(async () => {
    const host = page.locator('[data-win-artwork]');
    state = await host.count() ? await host.evaluate(host => {
      const root = host.shadowRoot, text = root?.querySelector('[data-card-text]'), content = text?.closest('.win-design');
      if (!text || !content) return null;
      const box = element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const size = element => ({ clientWidth: element.clientWidth, clientHeight: element.clientHeight, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight });
      const overflows = element => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
      const range = document.createRange(); range.selectNodeContents(text);
      return { shadowReady: Boolean(text && content), text: text.textContent, host: box(host), textBox: box(text), contentBox: box(content), lineCount: range.getClientRects().length, contentSize: size(content), textSize: size(text), overflow: overflows(content) || overflows(text) };
    }) : null;
    return Boolean(state?.shadowReady && state.text === expectedText);
  }, { timeout: 20_000, intervals: [100], message: `cardens shadow-DOM-rendering blev inte klar för ${expectedText.slice(0, 70)}` }).toBe(true);
  return state;
}

export function assertLayout(cardId, expectedText, state) {
  const { host, textBox: text, contentBox: content } = state;
  if (state.text !== expectedText) throw new CardFailure(`${cardId}: fel text i exportdesignen`);
  if (state.overflow) throw new CardFailure(`${cardId}: text/content overflow i win-design (design=${JSON.stringify(state.contentSize)}, text=${JSON.stringify(state.textSize)})`);
  if (text.left < host.left - 1 || text.top < host.top - 1 || text.right > host.right + 1 || text.bottom > host.bottom + 1) throw new CardFailure(`${cardId}: text bounds utanför exportkortet ${JSON.stringify(text)} / ${JSON.stringify(host)}`);
  if (content.left < host.left - 1 || content.top < host.top - 1 || content.right > host.right + 1 || content.bottom > host.bottom + 1) throw new CardFailure(`${cardId}: design bounds utanför exportkortet ${JSON.stringify(content)} / ${JSON.stringify(host)}`);
  if (state.lineCount < 1) throw new CardFailure(`${cardId}: texten saknar layoutlinjer`);
}

export function sampleCards(cards) {
  const flavors = Map.groupBy(cards, card => card.flavor), selected = new Map();
  // Preserve Python's first/longest/shortest-per-flavor sample by default.
  for (const group of flavors.values()) {
    const longest = group.reduce((a, b) => Array.from(b.text).length > Array.from(a.text).length ? b : a);
    const shortest = group.reduce((a, b) => Array.from(b.text).length < Array.from(a.text).length ? b : a);
    for (const card of [group[0], longest, shortest]) selected.set(card.id, card);
  }
  const raw = process.env.CMS_MODULE_CARD_SAMPLE_SIZE;
  if (raw === undefined) return [...selected.values()];
  const count = raw === 'all' ? cards.length : Number(raw);
  if (!Number.isSafeInteger(count) || count < selected.size || count > cards.length) throw new Error(`CMS_MODULE_CARD_SAMPLE_SIZE must be an integer from ${selected.size} to ${cards.length}, or all.`);
  // Round-robin keeps every flavor represented when extending the parity sample.
  for (let index = 0; selected.size < count; index++) {
    for (const group of flavors.values()) {
      if (selected.size === count) break;
      if (group[index]) selected.set(group[index].id, group[index]);
    }
  }
  return [...selected.values()];
}
