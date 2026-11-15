// Lumen Moth — boot and frame loop. Sizes the canvas to the window, steps
// the game at a fixed 60 Hz, and exposes the game on window.__game so
// play-tests can drive it. ?shot=start|play|end|win renders a deterministic
// screenshot setup (see shots.js); ?seed= picks its layout.
import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Game } from './world.js';
import { Renderer } from './render.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const seedParam = params.get('seed');
const seed = seedParam === null ? null : Number(seedParam) || 7;

const game = new Game({ seed });
const input = new Input(canvas);
const renderer = new Renderer(canvas);

const status = document.getElementById('status');
function announce() {
  if (!status) return;
  status.textContent =
    game.state === 'playing'
      ? `Score ${game.score}, Night ${game.wave} of ${CONFIG.waves.total}, ${game.player.lives} lives`
      : game.state;
}

function resize() {
  const scale = Math.min(window.innerWidth / CONFIG.view.width, window.innerHeight / CONFIG.view.height);
  canvas.width = CONFIG.view.width;
  canvas.height = CONFIG.view.height;
  canvas.style.width = `${Math.floor(CONFIG.view.width * scale)}px`;
  canvas.style.height = `${Math.floor(CONFIG.view.height * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

// Screenshot setups run once, synchronously, before the first frame.
const shot = params.get('shot');
if (shot) {
  setupShot(game, input, shot);
}

// Exposed for automated play-testing (and curious players).
window.__game = game;
window.__input = input;

let last = performance.now();
let announceAt = 0;
function frame(nowMs) {
  const now = nowMs / 1000;
  let dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;
  if (dt <= 0) dt = 1 / 60;

  game.handleGlobalInput(input, now);
  game.update(dt, input, now);
  // Render on the gameplay clock so screenshots are deterministic.
  renderer.render(game, game.time);
  input.endFrame();

  if (now > announceAt) {
    announce();
    announceAt = now + 1;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
