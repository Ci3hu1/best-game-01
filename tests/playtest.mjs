// Lumen Moth — headless play-test + screenshot taker. Drives the cached
// Chromium over CDP with Node's built-in WebSocket (no dependencies).
// Usage: node tests/playtest.mjs [--shots-only]
// Checks: page loads with no console errors and no network request outside
// localhost; the game starts, plays, scores, loses and restarts; then takes
// 4 screenshots (title, play, game over, victory) into screenshots/.
// Exit code 0 only when every check passes and every screenshot is written.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = join(here, '..');
const shotsOnly = process.argv.includes('--shots-only');
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;
const PORT = 9222;
const BASE = 'http://localhost:8080';

const failures = [];
const notes = [];
function check(name, ok, detail = '') {
  if (ok) notes.push(`PASS ${name}${detail ? ` — ${detail}` : ''}`);
  else failures.push(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  return false;
}

// --- static server (serve.ts) ------------------------------------------------
const server = spawn('node', ['serve.ts'], { cwd: repo, stdio: 'ignore' });
if (!(await waitFor(`${BASE}/index.html`))) {
  console.error('static server did not come up');
  server.kill();
  process.exit(1);
}

// --- chromium ----------------------------------------------------------------
// Fresh profile each run, so localStorage (best score) is deterministic.
rmSync('/tmp/lumen-chrome-profile', { recursive: true, force: true });
const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`,
  '--window-size=1280,800',
  '--user-data-dir=/tmp/lumen-chrome-profile',
  'about:blank',
], { stdio: 'ignore' });
if (!(await waitFor(`http://localhost:${PORT}/json/version`))) {
  console.error('chromium did not come up');
  server.kill();
  chrome.kill();
  process.exit(1);
}

const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 1;
const pending = new Map();
const consoleErrors = [];
const networkUrls = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(`exception: ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description ?? ''}`);
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
  } else if (msg.method === 'Network.requestWillBeSent') {
    networkUrls.push(msg.params.request.url);
  } else if (msg.method === 'Network.loadingFailed') {
    consoleErrors.push(`network failed: ${msg.params.errorText}`);
  }
};
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error(`evaluate failed: ${JSON.stringify(res.exceptionDetails)}`);
  return res.result.value;
}
async function key(type, keyName, code, vk) {
  await send('Input.dispatchKeyEvent', { type, key: keyName, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
}
async function navigate(url) {
  await send('Page.navigate', { url });
  await sleep(1800);
}

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

try {
  if (!shotsOnly) {
    // --- interactive play-test --------------------------------------------
    await navigate(`${BASE}/`);
    check('page loads', (await evaluate(`document.title`)).includes('Lumen Moth'));
    check('game object exposed', await evaluate(`!!window.__game`));
    check('starts on title screen', (await evaluate(`window.__game.state`)) === 'title');

    // Start with Enter, then steer with keys and the mouse.
    await key('keyDown', 'Enter', 'Enter', 13);
    await key('keyUp', 'Enter', 'Enter', 13);
    await sleep(400);
    check('Enter starts the game', (await evaluate(`window.__game.state`)) === 'playing');
    const x0 = await evaluate(`window.__game.player.x`);
    await key('keyDown', 'a', 'KeyA', 65);
    await sleep(600);
    await key('keyUp', 'a', 'KeyA', 65);
    const x1 = await evaluate(`window.__game.player.x`);
    check('keyboard steers left', x1 < x0 - 20, `x ${x0.toFixed(0)} -> ${x1.toFixed(0)}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1000, y: 300 });
    await sleep(800);
    const x2 = await evaluate(`window.__game.player.x`);
    check('mouse steers toward cursor', x2 > x1 + 20, `x ${x1.toFixed(0)} -> ${x2.toFixed(0)}`);

    // Pulse spends a charge.
    const charges0 = await evaluate(`window.__game.player.pulseCharges`);
    await key('keyDown', ' ', 'Space', 32);
    await key('keyUp', ' ', 'Space', 32);
    await sleep(200);
    const charges1 = await evaluate(`window.__game.player.pulseCharges`);
    check('space fires the pulse', charges1 === charges0 - 1, `${charges0} -> ${charges1}`);

    // Autopilot plays: score must rise and blooms must be collected.
    await evaluate(`window.__game.autopilot = true`);
    await sleep(6000);
    const score = await evaluate(`window.__game.score`);
    const blooms = await evaluate(`window.__game.stats.bloomsCollected`);
    check('autopilot scores', score > 0 && blooms > 0, `score ${score}, blooms ${blooms}`);
    check('HUD shows score', await evaluate(`window.__game.score > 0`));

    // Force a fatal bat hit: one life left, bat teleported onto the moth.
    await evaluate(`window.__game.autopilot = false; window.__game.player.lives = 1; window.__game.player.invulnerableUntil = 0; window.__game.bats.push({ x: window.__game.player.x, y: window.__game.player.y, radius: 20, vx: 0, vy: 0, phase: 0, wingPhase: 0, dir: 1, baseY: window.__game.player.y, dead: false, offscreen: false, update() {} })`);
    await sleep(500);
    check('bat hit ends the game', (await evaluate(`window.__game.state`)) === 'game-over', await evaluate(`window.__game.state`));
    check('lives hit zero', (await evaluate(`window.__game.player.lives`)) === 0);

    // Restart with R.
    await key('keyDown', 'r', 'KeyR', 82);
    await key('keyUp', 'r', 'KeyR', 82);
    await sleep(400);
    check('R restarts after game over', (await evaluate(`window.__game.state`)) === 'playing');
    check('restart resets score and lives',
      (await evaluate(`window.__game.score`)) === 0 && (await evaluate(`window.__game.player.lives`)) === 3);

    // No console errors, no failed requests, no network beyond localhost.
    check('no console errors or exceptions', consoleErrors.length === 0, consoleErrors.join(' | '));
    const external = networkUrls.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:') && u !== 'about:blank');
    check('no network requests outside localhost', external.length === 0, external.join(', '));
  }

  // --- screenshots ----------------------------------------------------------
  const shots = [
    ['1-title.jpg', '?shot=start&seed=7'],
    ['2-play.jpg', '?shot=play&seed=7'],
    ['3-gameover.jpg', '?shot=end&seed=7'],
    ['4-victory.jpg', '?shot=win&seed=7'],
  ];
  mkdirSync(join(repo, 'screenshots'), { recursive: true });
  for (const [name, query] of shots) {
    await navigate(`${BASE}/${query}`);
    const state = await evaluate(`window.__game.state`);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    const file = join(repo, 'screenshots', name);
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    const size = (await import('node:fs')).statSync(file).size;
    check(`screenshot ${name} (${state}) under 256 KiB`, size <= 262144, `${(size / 1024).toFixed(0)} KiB`);
    notes.push(`SHOT ${name} state=${state} score=${await evaluate(`window.__game.score`)} size=${(size / 1024).toFixed(0)} KiB`);
  }
} finally {
  ws.close();
  chrome.kill();
  server.kill();
}

console.log([...notes, ...failures].join('\n'));
if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed.');
