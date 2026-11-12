export async function loadDeck(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Deck HTTP ${response.status}`);
  return response.json();
}

export function createDeckRun(cards) {
  let index = 0;
  return {
    get index() { return index; },
    get length() { return cards.length; },
    get current() { return cards[index]; },
    advance() { if (index < cards.length) index += 1; },
    reset() { index = 0; },
  };
}
