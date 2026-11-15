# best-game-01 — Lumen Moth — notes

## Bounty

- Slug: `best-game-01`, title "Make the best game". $1,000 USDC escrowed,
  10 paid places (1st $400, 2nd $200, 3rd $120, 4th–10th $40). Entry fee $0.
- Opens 2026-11-15T18:00:00Z, closes 2026-11-18T18:00:00Z (19 Nov 01:00 WIB).
- 0 submissions when found. Max 5 submissions/day, 10 total.
- Judging: AI judge, pairwise by screenshots + source outline; rank by win
  rate. Dev: each valid entry vs 4 fixed house games + 8 more vs
  nearest-strength house games; top 100 play sealed games. Final heat
  re-judges every final entry afresh.

## Build (fresh session after opening)

- Session started 2026-11-15T18:02:43Z (after the 18:00:00Z opening).
- Repo: https://github.com/Ci3hu1/best-game-01 (created 2026-11-15T18:18:07Z)
- Commit: b8ff7cc681ad314659d37052f1d87a651c6be58e (v1; NOTES.md + bundle
  steps recorded below — update this line if the commit moves)
- Game: **Lumen Moth** — original 2D canvas arcade game. Steer a glowmoth
  (WASD/arrows/mouse), drink glowing blooms (+10 × combo up to ×5), dodge
  sine-flying bats, pulse them away (SPACE/click, 3 recharging charges),
  moonpetals +50, webs snare (slow, no life lost). 8 nights; clear by bloom
  quota or survival; wave 8 cleared = dawn victory; 0 lives = game over.
  Title / HUD / wave banners / game-over / victory screens, restart (R or
  click), synthesised WebAudio SFX, no network requests, no assets.
- Files: `game/` (index.html + 9 src modules, one job each), `main.ts`
  (handoff program), `vendor/makefun-game.ts` (kit copy, unchanged),
  `screenshots/` (4 real renders: title, play, game over, victory),
  `tests/` (headless CDP play-test + node:test smoke test), `STRATEGY.md`,
  `shots.json`, `serve.ts`, MIT LICENSE, README with make.fun badge.
- Repo About set: description + homepage https://make.fun/bounty/best-game-01
  + topics makefun, ai-agents, bounties, games.

## Local verification

- `node tests/playtest.mjs`: 15/15 checks pass — loads with zero console
  errors and zero network requests outside localhost; Enter starts;
  keyboard steers; mouse steers; SPACE spends a pulse charge; autopilot
  scores; bat hit ends the game at 0 lives; R restarts with score 0 and
  3 lives. Screenshots 36–61 KiB each (cap 256 KiB), 1280×800.
- `node --test tests/smoke.test.mjs`: 4/4 pass — main.ts writes a valid
  dossier (schema makefun/dossier/v1, text 60,484 bytes, 4 images);
  game/ names no http(s) URL; screenshots meet the gate shape.
- Screenshot fixes applied after first visual review: HUD score/BEST
  overlap fixed (measured with the right font); prompt blink raised to
  0.8–1.0 so it stays readable; play shot moved to 10 s (mid-wave action,
  score 170, combo ×3); game-over shot now plays 9 s first (score 110,
  6 blooms, 3 bats dodged).

## Kit check

- (fill in after `node cli/makefun.mjs check --kit . --repo <repo> --transcripts <bundle>`)

## Bundle

- (fill in: bundle file, size, sha256, sessions bundled)

## Submit

- DO NOT SUBMIT without Joni's explicit 'Setuju' on the exact entry.
- Submit command (after Setuju; signature valid 10 min; keypair
  ~/workspace/tools/makefun/makefun-keypair.json):
  `node cli/makefun.mjs submit --competition best-game-01 --repo-url https://github.com/Ci3hu1/best-game-01 --commit <sha> --title "Lumen Moth" --bundle <bundle> --keypair ~/workspace/tools/makefun/makefun-keypair.json`
  (run from inside the unpacked kit
  ~/workspace/tools/makefun/best-game-01-kit/best-game-01-kit)
- After submit: claim code ONLY to
  ~/.config/makefun/best-game-01-submission.json (0600); then poll live
  score/rank: GET /api/competitions/best-game-01/live, record both below.

## Live score / rank

- (fill in after submit)
