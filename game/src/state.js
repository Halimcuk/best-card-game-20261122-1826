// state.js — the duel itself: dealing, playing a round, damage, and winning.
// Pure game logic: no DOM here, so the rules can be tested on their own.
import { buildDeck, shuffleDeck, dealCards, mulberry32, effectivePower, hasSuitAdvantage, isCrown, describeCard } from './deck.js';
import { chooseRivalCard } from './ai.js';

export const START_LIFE = 20;
export const HAND_SIZE = 5;

/** A fresh duel in the title phase. Pass a seed for a reproducible game. */
export function createGame(seed = (Math.random() * 1e9) | 0) {
  return {
    seed,
    rng: mulberry32(seed),
    phase: 'title', // title | playing | resolved | won | lost
    round: 1,
    playerLife: START_LIFE,
    rivalLife: START_LIFE,
    playerRounds: 0,
    rivalRounds: 0,
    embers: 0,
    deck: [],
    discard: [],
    playerHand: [],
    rivalHand: [],
    playerPlayed: null,
    rivalPlayed: null,
    selected: -1,
    lastResult: null,
    log: [],
  };
}

export function addLog(game, text) {
  game.log.unshift(text);
  if (game.log.length > 30) game.log.length = 30;
}

/** Shuffle a full deck and deal both hands of five. */
export function startGame(game) {
  game.deck = shuffleDeck(buildDeck(), game.rng);
  game.discard = [];
  game.playerHand = dealCards(game.deck, HAND_SIZE);
  game.rivalHand = dealCards(game.deck, HAND_SIZE);
  game.round = 1;
  game.playerLife = START_LIFE;
  game.rivalLife = START_LIFE;
  game.playerRounds = 0;
  game.rivalRounds = 0;
  game.embers = 0;
  game.playerPlayed = null;
  game.rivalPlayed = null;
  game.selected = -1;
  game.lastResult = null;
  game.phase = 'playing';
  game.log = [];
  addLog(game, 'The duel begins. Ash deals five cards each.');
  return game;
}

/** Draw both hands back up to five, reshuffling the discard when the deck runs dry. */
export function drawUp(game) {
  for (const hand of [game.playerHand, game.rivalHand]) {
    while (hand.length < HAND_SIZE) {
      if (game.deck.length === 0) {
        if (game.discard.length === 0) break;
        game.deck = shuffleDeck(game.discard, game.rng);
        game.discard = [];
        addLog(game, 'The discard pile is reshuffled into a new deck.');
      }
      hand.push(game.deck.pop());
    }
  }
}

/**
 * Play the player's selected card against Ash. Returns the round result, or
 * null when the move is not legal right now.
 */
export function playCard(game, handIndex) {
  if (game.phase !== 'playing') return null;
  if (handIndex < 0 || handIndex >= game.playerHand.length) return null;
  const playerCard = game.playerHand.splice(handIndex, 1)[0];
  const rivalIndex = chooseRivalCard(game.rivalHand, playerCard, game.rng);
  const rivalCard = game.rivalHand.splice(rivalIndex, 1)[0];
  game.playerPlayed = playerCard;
  game.rivalPlayed = rivalCard;
  game.selected = -1;
  return resolveRound(game, playerCard, rivalCard);
}

/** Compare the two played cards, deal damage, and score the round. */
export function resolveRound(game, playerCard, rivalCard) {
  const playerPower = effectivePower(playerCard, rivalCard);
  const rivalPower = effectivePower(rivalCard, playerCard);
  const playerAdvantage = hasSuitAdvantage(playerCard, rivalCard);
  const rivalAdvantage = hasSuitAdvantage(rivalCard, playerCard);
  let result;
  if (playerPower > rivalPower) {
    let damage = playerPower - rivalPower;
    if (isCrown(playerCard)) damage *= 2;
    game.rivalLife = Math.max(0, game.rivalLife - damage);
    game.playerRounds += 1;
    if (playerAdvantage) game.embers += 1;
    result = {
      winner: 'player', damage, playerPower, rivalPower,
      text: `You win the round! ${describeCard(playerCard)} (${playerPower}) beats ${describeCard(rivalCard)} (${rivalPower}) — Ash loses ${damage} ❤${playerAdvantage ? ' and you bank an Ember 🔥' : ''}${isCrown(playerCard) ? ' — Crown doubles the damage!' : ''}`,
    };
  } else if (rivalPower > playerPower) {
    let damage = rivalPower - playerPower;
    if (isCrown(rivalCard)) damage *= 2;
    game.playerLife = Math.max(0, game.playerLife - damage);
    game.rivalRounds += 1;
    result = {
      winner: 'rival', damage, playerPower, rivalPower,
      text: `Ash wins the round. ${describeCard(rivalCard)} (${rivalPower}) beats ${describeCard(playerCard)} (${playerPower}) — you lose ${damage} ❤${isCrown(rivalCard) ? ' — Ash plays a Crown, doubling the damage!' : ''}`,
    };
  } else {
    result = {
      winner: 'tie', damage: 0, playerPower, rivalPower,
      text: `A tie! Both cards stand at ${playerPower}. No damage — the embers hold their breath.`,
    };
  }
  game.lastResult = result;
  game.discard.push(playerCard, rivalCard);
  addLog(game, `Round ${game.round}: ${result.text}`);
  drawUp(game);
  if (game.rivalLife <= 0) {
    game.phase = 'won';
    addLog(game, 'Ash falls. The Ember Court is yours!');
  } else if (game.playerLife <= 0) {
    game.phase = 'lost';
    addLog(game, 'Your flame gutters out. Ash takes the court.');
  } else {
    game.phase = 'resolved';
  }
  return result;
}

/** Clear the arena and open the next round after a resolved one. */
export function nextRound(game) {
  if (game.phase !== 'resolved') return false;
  game.playerPlayed = null;
  game.rivalPlayed = null;
  game.lastResult = null;
  game.round += 1;
  game.phase = 'playing';
  return true;
}

/** Back to the title screen, keeping the same seed family for a fresh shuffle. */
export function toTitle(game) {
  game.phase = 'title';
  game.playerPlayed = null;
  game.rivalPlayed = null;
  game.lastResult = null;
  return game;
}
