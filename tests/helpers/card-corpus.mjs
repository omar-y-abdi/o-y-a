export function representativeCards(cards, size = 24) {
  if (size > cards.length) throw new RangeError(`Cannot pick ${size} cards from a bank of ${cards.length}`);
  const anchors = new Set();
  const firstOfFlavor = new Map();
  cards.forEach((card, index) => { if (!firstOfFlavor.has(card.flavor)) firstOfFlavor.set(card.flavor, index); });
  for (const index of firstOfFlavor.values()) anchors.add(index);
  let longest = 0, shortest = 0;
  cards.forEach((card, index) => {
    if (card.text.length > cards[longest].text.length) longest = index;
    if (card.text.length < cards[shortest].text.length) shortest = index;
  });
  anchors.add(longest).add(shortest);
  if (anchors.size > size) throw new RangeError(`${anchors.size} required cards exceed the requested ${size}`);
  const rest = cards.map((_, index) => index).filter(index => !anchors.has(index));
  const quota = size - anchors.size;
  const strided = Array.from({ length: quota }, (_, step) => rest[Math.floor(step * rest.length / quota)]);
  return [...anchors, ...strided].sort((a, b) => a - b).map(index => cards[index]);
}
