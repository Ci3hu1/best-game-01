# STRATEGY.md — Lumen Moth (best-game-01)

## The bet

The judge sees each entry as a contact sheet of screenshots plus a short
source outline, and its first criterion is a *complete* game shown in the
screenshots. So the whole design is built to be readable at a glance in a
still frame: a dark indigo night garden, one glowing moth, bright flowers,
a moon, and a HUD that says SCORE / NIGHT / lives / combo without reading
the code. A well-crafted 2D canvas game with juice (particles, screen
shake, floating score text, a pulse ring) photographs better than a
half-finished 3D scene, and it is finishable, testable and screenshottable
in one session — so that is what we built.

## The game

**Lumen Moth.** You are a glowmoth drinking nectar in a night garden.

- **Core loop:** steer to glowing blooms (+10 each), chain pickups inside a
  4-second window to raise a combo multiplier (×2 at 3 chained, up to ×5),
  dodge sine-flying bats. One loop, readable in one screenshot.
- **Choices that matter:** the pulse (SPACE / click) shoves bats away but
  costs one of 3 recharging charges — spend it early or save it for a
  crowded screen. Moonpetals (+50, +1 pulse charge) pull you toward risk:
  they spawn mid-wave, away from the safe lanes.
- **Escalation:** 8 nights ("waves"). Each night raises bat speed and spawn
  rate, adds drifting webs from night 2, and raises the bloom quota
  (10 + 2/night). Clear a night by quota or by surviving its 32 seconds;
  clearing pays 100 × night. Wave 8 cleared is the win (dawn); 0 lives is
  the loss.
- **Feel:** acceleration + drag movement, mouse steering, wing-flap
  animation, glow trail, particles on every pickup, screen shake + red
  burst on a hit, floating "+30" text, synthesised WebAudio chimes (no
  audio files, so the game ships zero bytes of audio and loads nothing).
- **Completeness shown in screenshots:** title screen with how-to-play,
  live HUD mid-game, game-over panel with score + stats + restart prompt,
  victory panel with score + stats + restart prompt.

## Measured (headless Chromium, this session)

- Play-test `tests/playtest.mjs`: 15/15 checks pass — loads with zero
  console errors and zero network requests outside localhost; Enter starts;
  keyboard steers left; mouse steers toward the cursor; SPACE spends a
  pulse charge; autopilot scores (score 50, 4 blooms in 6 s of live play);
  a bat hit ends the game at 0 lives; R restarts with score 0 and 3 lives.
- Screenshot run: 4 shots, 40–59 KiB each (cap 256 KiB), 1280×800.
  Play shot at 10 s of autopilot: score 350, combo ×4, Night 2 banner.
- Smoke test `node --test tests/smoke.test.mjs`: main.ts writes a valid
  dossier; game/ names no http(s) URL; screenshots meet the gate shape.

## What was tried and dropped

- **A 3D Three.js scene** — dropped before writing: a half-finished 3D
  game photographs worse than a polished 2D one, and the judge's first
  criterion is what the screenshots show. (A separate 3D shooter built
  before this bounty opened is not part of this entry and was not reused.)
- **A tower-defence variant** — dropped: too many systems to finish and
  balance in one session; the moth loop is one mechanic done well.
- **Webs costing a life** — dropped: two lethal hazards made the game feel
  unfair in play-testing; webs now snare (slow) instead, so bats stay the
  only lethal threat and the choice is "dodge vs. pulse".
- **Endless mode with no win** — dropped: the bounty wants a way to win;
  8 nights with a dawn victory gives the game an ending the screenshots
  can show.
- **Music loop** — dropped: a looping synth pad added code and risk for
  little screenshot value; short SFX on every action carry the feel.

## Structure

One clear job per file, named for what it does (the judge's fifth
criterion reads these names): `config.js` (tuning), `random.js` (seeded
RNG), `input.js` (keyboard + mouse), `audio.js` (synth SFX), `entities.js`
(moth, bats, blooms, petals, webs, particles), `world.js` (states, waves,
spawning, collisions, scoring), `render.js` (all drawing + HUD + screens),
`shots.js` (deterministic screenshot setups), `main.js` (boot + loop).
`main.ts` hands the game in; `vendor/makefun-game.ts` is the kit's copy,
unchanged.
