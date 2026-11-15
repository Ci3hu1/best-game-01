// Lumen Moth — deterministic setups for the entry's screenshots. Each shot
// is a real render of the game's own code: the same update loop and the same
// renderer a player sees, fast-forwarded with the autopilot to a chosen
// moment. ?shot=start shows the title, ?shot=play mid-game with a live HUD,
// ?shot=end the game-over screen, ?shot=win the dawn victory screen.
// ?seed= picks the layout (default 7).
import { CONFIG } from './config.js';
import { STATES } from './world.js';

const STEP = 1 / 60; // fixed-step simulation, 60 Hz

// Step the live game forward `seconds` of play with the autopilot flying.
function simulate(game, input, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) {
    const now = performance.now() / 1000;
    game.handleGlobalInput(input, now);
    game.update(STEP, input, now);
  }
}

export function setupShot(game, input, name) {
  game.autopilot = true;
  if (name === 'start') {
    // Title screen: nothing to simulate, the moth hovers behind the title.
    return;
  }
  if (name === 'play') {
    game.start();
    // 10 seconds of real play: mid-wave, blooms on screen, bats crossing,
    // HUD alive — before the wave-clear banner takes over.
    simulate(game, input, 10);
    return;
  }
  if (name === 'end') {
    game.start();
    // First play well for a while, so the game-over screen shows a real
    // score and stats — then fly recklessly into bats until the moth falls.
    simulate(game, input, 9);
    game.autopilot = false;
    let guard = 0;
    while (game.state !== STATES.GAME_OVER && guard < 60 * 120) {
      guard += 1;
      const now = performance.now() / 1000;
      // Steer into the nearest bat; if none is near, hover mid-screen.
      let target = null;
      let best = Infinity;
      for (const bat of game.bats) {
        const d = Math.hypot(bat.x - game.player.x, bat.y - game.player.y);
        if (d < best) {
          best = d;
          target = bat;
        }
      }
      if (target) {
        const dx = target.x - game.player.x;
        const dy = target.y - game.player.y;
        const d = Math.hypot(dx, dy) || 1;
        game.player.vx += (dx / d) * CONFIG.player.accel * STEP * 1.2;
        game.player.vy += (dy / d) * CONFIG.player.accel * STEP * 1.2;
      }
      game.update(STEP, input, now);
      // The moth is invulnerable for 2 s after a hit; wait it out.
    }
    return;
  }
  if (name === 'win') {
    game.start();
    simulate(game, input, 10);
    // Jump the run to the dawn: wave 8 cleared with a real score behind it.
    game.wave = CONFIG.waves.total;
    game.score += 2450;
    game.stats.bloomsCollected += 41;
    game.state = STATES.VICTORY;
    game.saveBest();
    return;
  }
  // Unknown shot name: plain title.
}
