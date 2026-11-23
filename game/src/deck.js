// deck.js — the four suits, the 40-card Ember deck, and how a duel is scored.
// Suits form a cycle: Flame beats Leaf, Leaf beats Tide, Tide beats Flame.
// Stone beats nothing and loses to nothing: it fears no suit, but earns no bonus.
export const SUITS = [
  { key: 'flame', name: 'Flame', glyph: '🔥', beats: 'leaf' },
  { key: 'tide', name: 'Tide', glyph: '💧', beats: 'flame' },
  { key: 'leaf', name: 'Leaf', glyph: '🍃', beats: 'tide' },
  { key: 'stone', name: 'Stone', glyph: '🪨', beats: null },
];

export const SUIT_BY_KEY = Object.fromEntries(SUITS.map((s) => [s.key, s]));

/** A card: { suit, power }. Power 10 is a Crown card. */
export function makeCard(suit, power) {
  return { suit, power };
}

export function isCrown(card) {
  return card.power === 10;
}

export function suitOf(card) {
  return SUIT_BY_KEY[card.suit];
}

/** True when card's suit beats the foe's suit in the cycle. */
export function hasSuitAdvantage(card, foeCard) {
  const suit = suitOf(card);
  return suit.beats !== null && suit.beats === foeCard.suit;
}

/**
 * Effective power in a duel: base power, +3 when the suit beats the foe's suit.
 * Stone never gains the bonus, and never grants one.
 */
export function effectivePower(card, foeCard) {
  return card.power + (hasSuitAdvantage(card, foeCard) ? 3 : 0);
}

/** One-line description used by the log and screen readers. */
export function describeCard(card) {
  const suit = suitOf(card);
  return `${suit.name} ${card.power}${isCrown(card) ? ' (Crown)' : ''}`;
}

/** A small deterministic RNG (mulberry32) so screenshot shots are reproducible. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The full Ember deck: each suit holds powers 1 through 10, 40 cards in all. */
export function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let power = 1; power <= 10; power++) {
      deck.push(makeCard(suit.key, power));
    }
  }
  return deck;
}

/** Fisher-Yates shuffle driven by the supplied RNG; returns a new array. */
export function shuffleDeck(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Deal `count` cards off the top of the deck (mutates the deck array). */
export function dealCards(deck, count) {
  return deck.splice(0, count);
}
