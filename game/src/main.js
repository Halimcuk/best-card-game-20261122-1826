// main.js — boots Ember Court: wires the table, the keyboard, and the shots.
// `?shot=title|play|mechanic|win|lose` presets a real game state for screenshots;
// without it the game opens on the title screen like any player would see.
import { createGame, startGame, playCard, nextRound, toTitle, resolveRound } from './state.js';
import { renderAll, showTitleOverlay, showRulesOverlay, showEndOverlay, hideOverlay, announce } from './render.js';
import { playClickSound, playDealSound, playWinRoundSound, playLoseRoundSound, playVictorySound, playDefeatSound, setMuted, isMuted } from './sound.js';
import { makeCard } from './deck.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? 11) || 11;

const game = createGame(seed);
// Handle for automated play-testing (read-only from outside the game itself).
window.__game = game;

/** Redraw the table and announce the newest log line. */
function refresh() {
  renderAll(game, onPickCard);
  if (game.log[0]) announce(game.log[0]);
}

function onPickCard(index) {
  if (game.phase === 'resolved') {
    nextRound(game);
    refresh();
  }
  if (game.phase !== 'playing') return;
  game.selected = index;
  playClickSound();
  refresh();
}

function onPlaySelected() {
  if (game.phase === 'resolved') {
    nextRound(game);
    playDealSound();
    refresh();
    return;
  }
  if (game.phase !== 'playing') return;
  const index = game.selected >= 0 ? game.selected : 0;
  const result = playCard(game, index);
  if (!result) return;
  if (game.phase === 'won') playVictorySound();
  else if (game.phase === 'lost') playDefeatSound();
  else if (result.winner === 'player') playWinRoundSound();
  else if (result.winner === 'rival') playLoseRoundSound();
  else playDealSound();
  refresh();
  if (game.phase === 'won' || game.phase === 'lost') {
    setTimeout(() => showEndOverlay(game, onNewGame, onShowTitle), 700);
  }
}

function onNewGame() {
  hideOverlay();
  startGame(game);
  playDealSound();
  refresh();
}

function onShowTitle() {
  hideOverlay();
  toTitle(game);
  refresh();
  showTitleOverlay(game, onNewGame);
}

function onShowRules() {
  showRulesOverlay(() => {
    hideOverlay();
    if (game.phase === 'title') showTitleOverlay(game, onNewGame);
  });
}

function onToggleSound() {
  setMuted(!isMuted());
  document.getElementById('sound-btn').textContent = isMuted() ? '♪ Sound: off' : '♪ Sound: on';
}

// ---- Screenshot shots: real states reached through the real rules ----

/** Mid-game: two honest rounds played with a fixed seed. */
function applyShotPlay() {
  startGame(game);
  playCard(game, 2);
  nextRound(game);
  playCard(game, 1);
  nextRound(game);
}

/**
 * The key mechanic, shown plainly: Flame 9 over Leaf 4. Flame beats Leaf, so
 * the 9 counts as 12, wins by 8, and banks an Ember — resolved by resolveRound.
 */
function applyShotMechanic() {
  startGame(game);
  const playerCard = makeCard('flame', 9);
  const rivalCard = makeCard('leaf', 4);
  game.playerHand.splice(0, 1);
  game.rivalHand.splice(0, 1);
  game.playerPlayed = playerCard;
  game.rivalPlayed = rivalCard;
  resolveRound(game, playerCard, rivalCard);
}

/** A won duel: Ash at 3 life, holding only weak Stone, meets a Crown (Flame 10). */
function applyShotWin() {
  startGame(game);
  game.rivalLife = 3;
  game.rivalHand = [makeCard('stone', 1), makeCard('stone', 2), makeCard('stone', 3), makeCard('stone', 4), makeCard('stone', 5)];
  game.playerHand[0] = makeCard('flame', 10);
  playCard(game, 0);
}

/** A lost duel: the player at 2 life, holding a weak Stone, meets Ash's Crown. */
function applyShotLose() {
  startGame(game);
  game.playerLife = 2;
  game.playerHand[0] = makeCard('stone', 1);
  game.rivalHand = [makeCard('flame', 10), makeCard('flame', 9), makeCard('flame', 8), makeCard('flame', 7), makeCard('flame', 6)];
  playCard(game, 0);
}

function applyShot() {
  if (shot === 'title') {
    startGame(game);
    refresh();
    showTitleOverlay(game, onNewGame);
    return;
  }
  if (shot === 'play') applyShotPlay();
  else if (shot === 'mechanic') applyShotMechanic();
  else if (shot === 'win') applyShotWin();
  else if (shot === 'lose') applyShotLose();
  refresh();
  if (game.phase === 'won' || game.phase === 'lost') {
    showEndOverlay(game, onNewGame, onShowTitle);
  }
}

// ---- Boot ----

document.getElementById('play-btn').addEventListener('click', onPlaySelected);
document.getElementById('next-round').addEventListener('click', () => {
  nextRound(game);
  playDealSound();
  refresh();
});
document.getElementById('rules-btn').addEventListener('click', onShowRules);
document.getElementById('sound-btn').addEventListener('click', onToggleSound);
document.getElementById('new-btn').addEventListener('click', onNewGame);

document.addEventListener('keydown', (event) => {
  if (event.key >= '1' && event.key <= '5') {
    onPickCard(Number(event.key) - 1);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onPlaySelected();
  } else if (event.key === 'n' || event.key === 'N') {
    if (game.phase === 'resolved') {
      nextRound(game);
      refresh();
    }
  } else if (event.key === 'r' || event.key === 'R') {
    onNewGame();
  } else if (event.key === 'Escape') {
    hideOverlay();
    if (game.phase === 'title') showTitleOverlay(game, onNewGame);
  }
});

if (shot) {
  applyShot();
} else {
  // A fresh visit opens on the title screen over a dealt table.
  startGame(game);
  refresh();
  showTitleOverlay(game, onNewGame);
}
