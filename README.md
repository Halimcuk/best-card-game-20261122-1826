# 🔥 Ember Court — Duel of the Four Suits

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Halimcuk/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Halimcuk/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

An original card duelling game for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You are the Warden of Embers, duelling Ash the Ember Knight across a green felt court. No build step, no network — just static files that play offline in a desktop browser.

## The game

- **40-card deck, four original suits** — 🔥 Flame, 💧 Tide, 🍃 Leaf, 🪨 Stone — each with powers 1–10. Suits are told apart by colour, shape and name, never by text alone.
- **A suit cycle to read and counter:** Flame beats Leaf, Leaf beats Tide, Tide beats Flame; Stone fears nothing and grants nothing. A suit win is worth **+3 power** and banks an **Ember**.
- **Crowns:** every power-10 card is a Crown — win with one and it deals **double damage**.
- **A real duel:** both sides start at 20 ❤. Each round you play one card from a hand of five; Ash answers with a card chosen to counter yours — winning cheap, saving its Crowns. The loser takes damage equal to the power difference. First to 0 ❤ loses.
- **Full game loop:** title screen → deal → play rounds → victory or defeat screen → one-click rematch. Round log, deck count, life bars, round score and ember tally are always visible.
- **Feel:** cards lift on hover, snap up when selected, deal in with an animation, and the winning card glows gold. WebAudio chimes (generated in code) mark plays, wins and the final flourish — mutable.

## How to play

```sh
node serve.ts
# open http://localhost:8080
```

- **Mouse:** click a card to select it, then click **▶ Play selected card** (or click a card while a round result is showing to move on).
- **Keyboard:** `1–5` select a card, `Enter`/`Space` plays it, `N` next round, `R` new game, `Esc` back to title.
- **Shots:** `?shot=title|play|mechanic|win|lose` opens a preset real game state (used for the screenshots).

## Files

- `game/index.html` — the table
- `game/styles.css` — table, cards and overlays (all art is CSS)
- `game/src/deck.js` — suits, deck, shuffle, power resolution
- `game/src/ai.js` — Ash's counter-picking strategy
- `game/src/state.js` — dealing, rounds, damage, win/lose
- `game/src/render.js` — hands, arena, HUD, overlays
- `game/src/sound.js` — WebAudio chimes, generated in code
- `game/src/main.js` — boot, input, screenshot shots
- `main.ts` — the make.fun entry program (writes `dossier.json`)
- `screenshots/` — real renders of the game in headless Chromium

Built with the make.fun kit. Referral code: `jcrs26fr`.

## License

MIT — see [LICENSE](LICENSE).
