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
- Commit: d90070de6451b9a5b91755773559e93e95153acb (v1; + NOTES.md update
  in a later commit — see below)
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

- Ran 2026-11-15T18:25:13Z against commit d90070d + bundle below:
  **12 passed, 1 failed, 6 skipped, 5 checked at submission.**
- Passes: competition_open, snapshot (25 files, 355,648 bytes), license_osi
  (MIT), entrypoint (main.ts, node22), transcripts_present (1 muse-app
  session), transcripts_recorded, thinking_wellformed (159 messages, 103
  tool results), thinking_in_window (all timestamps 18:00:00Z–18:25:13Z),
  thinking_reproduces (**99.7%**: 1864/1868 authored lines, 0 copied, 0
  pasted, 0 read, 4 absent; main.ts 17 authored lines), thinking_turns
  (46), thinking_revised (shots.js from 3 messages), transcripts_run_record.
- **FAIL — thinking_priced only: 0 usage rows.** Expected for a subagent
  build: a subagent's usage rows are written only once its run completes.
  Fix (parent/top-level agent, established pattern): after this session
  ends, run the muse.db SELECT for agent_id
  ee3800f4-7038-4e4b-8cf8-13b4437e5fea (and the parent's own
  98e583ba-959c-443f-9d20-8283d31c2fd7), write rows unchanged to
  ~/workspace/tools/makefun/best-game-01-muse-usage.jsonl, re-bundle with
  --muse-usage added (same flags as below), re-check the new HEAD.
- Checked at submission (site verifies): repo_public (repo IS public),
  repo_owner (owner Ci3hu1 = the account's GitHub login), 
  repo_created_after_open (created 2026-11-15T18:18:07Z, after opening),
  commit_in_repo (pushed), duplicate_snapshot (original work).

## Bundle

- Bundle: ~/workspace/tools/makefun/best-game-01-transcripts.tar.gz,
  188,373 bytes, sha256
  dab000428fce46358aa945e5a33d8aea51502e66d0091def1cd803b0a91c9df7
  (1 muse-app session, 55 turns, 269 lines kept; run record: scheduled
  prompt, system prompt uploaded, 1 instruction file collected, no MCP
  servers; harness muse-app v1, provider meta, model muse-spark-1.3,
  effort default). **Pre-usage-rows bundle — parent must re-bundle with
  --muse-usage before submit (see check section).**
- Bundle command (from inside
  ~/workspace/tools/makefun/best-game-01-kit/best-game-01-kit):
  `node cli/makefun.mjs bundle --repo ~/workspace/tools/makefun/best-game-01 --out ~/workspace/tools/makefun/best-game-01-transcripts.tar.gz --session ~/agents/agent-ee3800f4-7038-4e4b-8cf8-13b4437e5fea/sessions/ee3800f4-7038-4e4b-8cf8-13b4437e5fea.jsonl --no-discover --no-family --system-prompt /tmp/best-game-01-sysprompt.txt --prompt-file /tmp/best-game-01-prompt.txt --prompt-origin scheduled --prompt-via "hourly cron makefun-cek-bounty-baru-rutin; the cron worker spawned this build session for best-game-01" --harness muse-app --harness-version 1 --provider meta --model muse-spark-1.3 --effort default --mcp none --redact "Joni Gunawan" --redact "joni07683@gmail.com" --redact "+62 85175067683" [--muse-usage ~/workspace/tools/makefun/best-game-01-muse-usage.jsonl]`
- Check command:
  `node cli/makefun.mjs check --kit . --repo ~/workspace/tools/makefun/best-game-01 --transcripts ~/workspace/tools/makefun/best-game-01-transcripts.tar.gz`

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
