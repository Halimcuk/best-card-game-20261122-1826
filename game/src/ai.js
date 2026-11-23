// ai.js — how Ash, the Ember Knight, picks a card.
// Ash reads the card you just played and answers it: it would rather win cheap
// than win big, so it saves its Crowns and its strong cards for later rounds.
import { effectivePower, hasSuitAdvantage, isCrown } from './deck.js';

/** Score a candidate reply: lower is a card Ash would rather spend. */
function replyCost(card, playerCard) {
  let cost = card.power;
  if (hasSuitAdvantage(card, playerCard)) cost -= 4;
  if (isCrown(card)) cost += 6;
  return cost;
}

export function chooseRivalCard(rivalHand, playerCard, rng) {
  if (rivalHand.length === 0) return -1;
  // Ash judges your card by its raw power: your suit bonus depends on the
  // card Ash has not picked yet, so it cannot be counted here.
  const playerPower = playerCard.power;
  // Replies that beat the player's card, cheapest first.
  const winning = rivalHand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => effectivePower(card, playerCard) > playerPower)
    .sort((a, b) => replyCost(a.card, playerCard) - replyCost(b.card, playerCard));
  if (winning.length > 0) {
    // Sometimes (1 in 5) Ash bluffs with a middling card instead of the cheapest win.
    if (winning.length > 1 && rng() < 0.2) return winning[1].index;
    return winning[0].index;
  }
  // Cannot win: spend the weakest card, but keep a Crown if there is any other choice.
  const sorted = rivalHand
    .map((card, index) => ({ card, index }))
    .sort((a, b) => a.card.power - b.card.power);
  const spendable = sorted.filter(({ card }) => !isCrown(card));
  return (spendable[0] ?? sorted[0]).index;
}

/** Ash's opening taunts, one shown per game on the title screen. */
export const RIVAL_TAUNTS = [
  '“Your embers are mine, Warden.”',
  '“I have dueled a hundred Wardens. None kept their flame.”',
  '“Play boldly. Caution burns just as fast.”',
];
