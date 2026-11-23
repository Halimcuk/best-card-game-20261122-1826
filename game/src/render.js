// render.js — draws the duel table into the DOM: hands, arena, life bars, overlays.
import { suitOf, isCrown, describeCard } from './deck.js';
import { START_LIFE } from './state.js';
import { RIVAL_TAUNTS } from './ai.js';

const $ = (id) => document.getElementById(id);

/** One face-up card element. `onPick` fires when the player clicks it. */
export function renderCardElement(card, { onPick = null, index = -1, selected = false, dealt = false } = {}) {
  const suit = suitOf(card);
  const el = document.createElement('div');
  el.className = `card suit-${suit.key}${isCrown(card) ? ' crown' : ''}${selected ? ' selected' : ''}${dealt ? ' dealt' : ''}`;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', describeCard(card));
  el.innerHTML =
    `<span class="corner"><b>${card.power}</b>${suit.glyph}</span>` +
    `<span class="power">${card.power}</span>` +
    `<span class="suit-glyph">${suit.glyph}</span>` +
    `<span class="suit-name">${suit.name}</span>`;
  if (onPick) {
    el.addEventListener('click', () => onPick(index));
  }
  return el;
}

/** One face-down rival card (a patterned back, never revealing its value). */
export function renderCardBackElement() {
  const el = document.createElement('div');
  el.className = 'card back';
  el.setAttribute('aria-label', 'Face-down rival card');
  el.innerHTML = '<span class="back-glyph">◆</span>';
  return el;
}

/** The rival hand: face-down backs, one per card still held. */
export function renderRivalHand(game) {
  const row = $('rival-hand');
  row.replaceChildren();
  game.rivalHand.forEach(() => row.appendChild(renderCardBackElement()));
}

/** The player's hand: clickable cards, the selected one lifted. */
export function renderPlayerHand(game, onPick) {
  const row = $('player-hand');
  row.replaceChildren();
  game.playerHand.forEach((card, index) => {
    row.appendChild(renderCardElement(card, {
      onPick, index, selected: game.selected === index, dealt: game.phase === 'playing',
    }));
  });
}

/** Life bars, round counters, deck size and the ember tally in the HUD. */
export function renderHud(game) {
  $('player-life-num').textContent = `${game.playerLife} ❤`;
  $('rival-life-num').textContent = `${game.rivalLife} ❤`;
  $('player-life-fill').style.width = `${(game.playerLife / START_LIFE) * 100}%`;
  $('rival-life-fill').style.width = `${(game.rivalLife / START_LIFE) * 100}%`;
  $('player-life-fill').classList.toggle('low', game.playerLife <= 6);
  $('rival-life-fill').classList.toggle('low', game.rivalLife <= 6);
  $('player-score').textContent = `Rounds ${game.playerRounds}`;
  $('rival-score').textContent = `Rounds ${game.rivalRounds}`;
  $('round-label').textContent = `Round ${game.round}`;
  $('deck-label').textContent = `Deck ${game.deck.length}`;
  $('ember-label').textContent = `🔥 Embers ${game.embers}`;
}

/** The two arena slots and the result banner between them. */
export function renderArena(game) {
  const playerSlot = $('player-slot');
  const rivalSlot = $('rival-slot');
  playerSlot.replaceChildren();
  rivalSlot.replaceChildren();
  if (game.playerPlayed) {
    const el = renderCardElement(game.playerPlayed, { dealt: false });
    el.classList.add('played');
    if (game.lastResult?.winner === 'player') el.classList.add('winner-glow');
    playerSlot.appendChild(el);
  } else {
    playerSlot.innerHTML = '<span class="slot-hint">Your card lands here</span>';
  }
  if (game.rivalPlayed) {
    const el = renderCardElement(game.rivalPlayed, { dealt: false });
    el.classList.add('played');
    if (game.lastResult?.winner === 'rival') el.classList.add('winner-glow');
    rivalSlot.appendChild(el);
  } else {
    rivalSlot.innerHTML = '<span class="slot-hint">Rival plays here</span>';
  }
  const banner = $('result-banner');
  if (game.lastResult) {
    banner.innerHTML = game.lastResult.winner === 'player'
      ? `<b>You take the round!</b><br>${game.lastResult.text}`
      : game.lastResult.winner === 'rival'
        ? `<b>Ash takes the round.</b><br>${game.lastResult.text}`
        : `<b>Dead even.</b><br>${game.lastResult.text}`;
  } else if (game.phase === 'playing') {
    banner.textContent = 'Play a card to begin the duel.';
  }
  $('next-round').hidden = game.phase !== 'resolved';
}

/** The running duel log, newest first. */
export function renderLog(game) {
  const log = $('log');
  log.replaceChildren();
  game.log.slice(0, 6).forEach((line) => {
    const div = document.createElement('div');
    div.textContent = line;
    log.appendChild(div);
  });
}

/** Draw everything for the current game state. */
export function renderAll(game, onPick) {
  renderHud(game);
  renderRivalHand(game);
  renderPlayerHand(game, onPick);
  renderArena(game);
  renderLog(game);
}

// ---- Overlays: title, victory, defeat, rules ----

function showOverlay(html, cardClass = '') {
  const overlay = $('overlay');
  const card = $('overlay-card');
  card.className = `overlay-card ${cardClass}`;
  card.innerHTML = html;
  overlay.hidden = false;
}

export function hideOverlay() {
  $('overlay').hidden = true;
}

export function showTitleOverlay(game, onStart) {
  const taunt = RIVAL_TAUNTS[game.seed % RIVAL_TAUNTS.length];
  showOverlay(`
    <h1>🔥 EMBER COURT 🔥</h1>
    <p class="subtitle">Duel of the Four Suits — you against Ash, the Ember Knight</p>
    <p class="suit-key"><span class="flame">🔥 Flame beats Leaf</span><span class="leaf">🍃 Leaf beats Tide</span><span class="tide">💧 Tide beats Flame</span><span class="stone">🪨 Stone fears none</span></p>
    <div class="rules">
      <b>How to play:</b> each round, play one card from your hand of five.
      The stronger card wins — a suit that beats the other gains <b>+3 power</b>.
      The loser takes damage equal to the difference; a <b>Crown (10)</b> deals double.
      Win with a suit advantage to bank an <b>Ember</b>. First to 0 ❤ loses.
      Click a card or press <b>1–5</b>, then <b>Enter</b> to play.
    </div>
    <p><i>Ash: ${taunt}</i></p>
    <button class="big-btn" id="start-btn">⚔ Begin the duel</button>
  `);
  $('start-btn').addEventListener('click', onStart);
}

export function showRulesOverlay(onClose) {
  showOverlay(`
    <h2>How to play</h2>
    <div class="rules">
      <b>The duel:</b> you and Ash start at 20 ❤. Each round you both play one card
      from a hand of five, then draw back up to five.<br><br>
      <b>Winning a round:</b> compare effective power — base power, +3 when your suit
      beats the rival suit. 🔥 beats 🍃, 🍃 beats 💧, 💧 beats 🔥. 🪨 Stone has no
      advantage and grants none.<br><br>
      <b>Damage:</b> the loser takes damage equal to the power difference (at least 1
      on a win). A Crown card (power 10) doubles the damage it deals.<br><br>
      <b>Embers:</b> winning with a suit advantage banks an Ember — your badge of a
      well-read rival.<br><br>
      <b>Keys:</b> 1–5 select a card · Enter plays it · N next round · R new game.
    </div>
    <button class="big-btn" id="close-rules-btn">Back to the table</button>
  `);
  $('close-rules-btn').addEventListener('click', onClose);
}

export function showEndOverlay(game, onAgain, onTitle) {
  const won = game.phase === 'won';
  showOverlay(`
    <h1>${won ? '👑 VICTORY! 👑' : '💀 DEFEAT 💀'}</h1>
    <p class="subtitle">${won ? 'Ash kneels. The Ember Court is yours, Warden.' : 'Your flame gutters out. Ash keeps the court — this time.'}</p>
    <p class="final-score">Final score — You ${game.playerRounds} rounds · Ash ${game.rivalRounds} rounds · Embers banked ${game.embers}</p>
    <p>Life: you ${game.playerLife} ❤ · Ash ${game.rivalLife} ❤ · ${game.round} rounds played</p>
    <button class="big-btn" id="again-btn">${won ? '⚔ Duel again' : '↻ Try again'}</button>
    <br><button class="ghost-btn" id="title-btn">Back to title</button>
  `, won ? 'win-card' : 'lose-card');
  $('again-btn').addEventListener('click', onAgain);
  $('title-btn').addEventListener('click', onTitle);
}

/** Announce the state for screen readers. */
export function announce(text) {
  $('status').textContent = text;
}
