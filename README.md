# Lumen Moth

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Ci3hu1/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Ci3hu1/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Lumen Moth** — a glowmoth drinks the night garden. Fly through eight nights, drink glowing blooms to score, chain them into a ×5 combo, dodge the bats, slip the webs, and survive till dawn. A complete 2D canvas arcade game: title screen, HUD (score, night, lives, combo, pulse), wave-clear bonuses, game-over and victory screens, restart, and synthesised sound — no network request, no assets to download.

## Run it

```sh
node serve.ts
# open http://localhost:8080 in desktop Chrome
```

Or open `game/index.html` from any static server. The game is plain static files under `game/` (ES modules, no library, no build step).

## How to play

- **Move** — WASD / arrow keys, or your mouse (the moth eases toward the cursor)
- **Pulse** — `SPACE` or click: a radial burst that shoves nearby bats away (3 charges, they recharge)
- **Score** — blooms are worth 10 × your combo multiplier (up to ×5); a rare moonpetal is worth 50 and refunds a pulse charge
- **Danger** — a bat costs a life (3 lives); a web snares you and slows you down
- **Win** — clear all 8 nights (collect each night's bloom quota or survive its length) to see the dawn; **lose** — run out of lives
- **Restart** — `R` or click on the end screens; `M` mutes

## Play-test it

```sh
node tests/playtest.mjs   # headless Chromium: plays, scores, dies, restarts, takes screenshots
node --test tests/smoke.test.mjs
```

`tests/playtest.mjs` drives the cached Chromium over CDP (Node's built-in WebSocket, no dependencies) and writes the entry's screenshots into `screenshots/`.

## Layout

- `game/` — the game: `index.html` + `src/` (config, random, input, audio, entities, world, render, shots, main), one clear job per file
- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library
- `vendor/makefun-game.ts` — the kit's library, unchanged
- `screenshots/` — 4 real renders of the game's own code (title, play, game over, victory)
- `tests/` — headless play-test + smoke test
- `STRATEGY.md` — the design rationale, measured play-test numbers, and what was tried and dropped

---

<sub>Entered on [make.fun](https://make.fun/?ref=cc7tcnw6&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
