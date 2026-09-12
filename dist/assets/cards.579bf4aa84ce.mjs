let bankPromise;
export async function loadCards() {
  if (!bankPromise) bankPromise = fetch('/data/cards.json', {credentials:'same-origin',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)})
    .then(response => { if (!response.ok) throw new Error('Card bank unavailable'); return response.json(); })
    .catch(error => { bankPromise=null;throw error; });
  return bankPromise;
}
export const getCard = (id, cards) => cards.find(card => card.id === id) ?? null;
export function createDeck(cards, random = Math.random) {
  const decks = new Map();
  return (flavor, previous) => {
    const group = ['kind','joke','pause','roast'].includes(flavor) ? flavor : 'kind';
    let deck = decks.get(group);
    if (!deck?.length) {
      deck = cards.filter(card => card.flavor === group);
      for (let i = deck.length - 1; i > 0; i--) {
        const value = random();
        const j = Number.isFinite(value) ? Math.max(0,Math.min(i,Math.floor(value*(i+1)))) : 0;
        [deck[i],deck[j]] = [deck[j],deck[i]];
      }
      if (deck.at(-1)?.id === previous) [deck[0],deck[deck.length-1]] = [deck.at(-1),deck[0]];
      decks.set(group,deck);
    }
    if (deck.at(-1)?.id === previous && deck.length > 1) [deck[0],deck[deck.length-1]] = [deck.at(-1),deck[0]];
    return deck.pop();
  };
}
