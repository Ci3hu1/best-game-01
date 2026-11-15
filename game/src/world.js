// Lumen Moth — the game itself: states, waves, spawning, collisions and
// scoring. render.js draws whatever state this holds; main.js drives it.
import { CONFIG } from './config.js';
import { Bat, Bloom, Floater, Moonpetal, Particle, Player, Web, collides } from './entities.js';
import { makeRng, range } from './random.js';
import { SoundBank } from './audio.js';

export const STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  WAVE_CLEAR: 'wave-clear',
  GAME_OVER: 'game-over',
  VICTORY: 'victory',
};

export class Game {
  constructor({ seed = null } = {}) {
    this.rng = makeRng(seed);
    this.seed = seed;
    this.sounds = new SoundBank();
    this.state = STATES.TITLE;
    this.player = new Player(CONFIG.view.width / 2, CONFIG.view.height / 2);
    this.bats = [];
    this.blooms = [];
    this.petals = [];
    this.webs = [];
    this.particles = [];
    this.floaters = [];
    this.stars = [];
    this.fireflies = [];
    this.score = 0;
    this.best = 0;
    this.wave = 1;
    this.waveTime = 0; // seconds into the current wave
    this.waveCollected = 0; // blooms collected this wave
    this.combo = 0;
    this.comboTimer = 0;
    this.bloomTimer = 0;
    this.batTimer = 1.2;
    this.webTimer = 4;
    this.petalSpawnedThisWave = false;
    this.shake = 0;
    this.banner = null; // { text, sub, until }
    this.time = 0;
    this.pulseRing = null; // { x, y, age } expanding ring after a pulse
    this.autopilot = false; // shots.js drives the moth for screenshots
    this.stats = { bloomsCollected: 0, batsDodged: 0, pulsesUsed: 0, wavesCleared: 0 };

    try {
      this.best = Number(window.localStorage.getItem('lumen-moth-best') || 0) || 0;
    } catch {
      this.best = 0;
    }
    this.buildSky();
  }

  buildSky() {
    const { width, height } = CONFIG.view;
    this.stars = [];
    for (let i = 0; i < CONFIG.ambient.stars; i++) {
      this.stars.push({
        x: this.rng() * width,
        y: this.rng() * height,
        size: 0.6 + this.rng() * 1.8,
        phase: this.rng() * Math.PI * 2,
        speed: 0.4 + this.rng() * 1.4,
        depth: 0.2 + this.rng() * 0.8,
      });
    }
    this.fireflies = [];
    for (let i = 0; i < CONFIG.ambient.fireflies; i++) {
      this.fireflies.push({
        x: this.rng() * width,
        y: range(this.rng, 80, height - 40),
        phase: this.rng() * Math.PI * 2,
        speed: 0.3 + this.rng() * 0.7,
        hue: this.rng() < 0.7 ? '190,255,170' : '255,230,140',
      });
    }
  }

  get comboMultiplier() {
    return Math.min(1 + Math.floor(this.combo / 3), CONFIG.combo.maxMultiplier);
  }

  get waveQuota() {
    return CONFIG.waves.bloomQuotaBase + CONFIG.waves.bloomQuotaPerWave * (this.wave - 1);
  }

  get waveProgress() {
    return Math.min(1, this.waveCollected / this.waveQuota);
  }

  get playing() {
    return this.state === STATES.PLAYING || this.state === STATES.WAVE_CLEAR;
  }

  start() {
    this.player.reset(CONFIG.view.width / 2, CONFIG.view.height * 0.55);
    this.bats = [];
    this.blooms = [];
    this.petals = [];
    this.webs = [];
    this.particles = [];
    this.floaters = [];
    this.score = 0;
    this.wave = 1;
    this.waveTime = 0;
    this.waveCollected = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.bloomTimer = 0.4;
    this.batTimer = 1.6;
    this.webTimer = 5;
    this.petalSpawnedThisWave = false;
    this.shake = 0;
    this.banner = null;
    this.pulseRing = null;
    this.stats = { bloomsCollected: 0, batsDodged: 0, pulsesUsed: 0, wavesCleared: 0 };
    this.state = STATES.PLAYING;
    this.sounds.ensure();
    this.spawnBloom();
    this.spawnBloom();
    this.showBanner(`Night ${this.wave}`, 'Drink the blooms — dodge the bats', 2.2);
  }

  restart() {
    this.start();
  }

  showBanner(text, sub, seconds) {
    this.banner = { text, sub, until: this.time + seconds };
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        window.localStorage.setItem('lumen-moth-best', String(this.best));
      } catch {
        // Best score is garnish; a blocked storage must not break the game.
      }
    }
  }

  // ------------------------------------------------------------ main step
  update(dt, input, now) {
    this.time += dt;
    this.shake *= Math.pow(CONFIG.fx.shakeDecay, dt * 60);
    if (this.banner && this.time > this.banner.until) this.banner = null;
    if (this.pulseRing) {
      this.pulseRing.age += dt;
      if (this.pulseRing.age > 0.45) this.pulseRing = null;
    }
    this.updateAmbient(dt);
    this.updateParticles(dt);

    if (this.state === STATES.TITLE) {
      // The moth drifts gently behind the title screen.
      this.player.wingPhase += dt * 9;
      return;
    }
    if (this.state === STATES.GAME_OVER || this.state === STATES.VICTORY) return;

    if (this.state === STATES.WAVE_CLEAR) {
      // Banner pause: the world idles for a beat, then the next wave starts.
      // The banner may already have been cleared by the expiry above.
      if (!this.banner || this.time >= this.banner.until) this.nextWave();
      return;
    }

    // --- playing ---
    if (this.autopilot) this.autopilotInput(input, dt);
    this.player.update(dt, input, now, this.time);
    this.waveTime += dt;

    // Combo decay.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this.spawnLogic(dt);
    this.updateEntities(dt);
    this.handleCollisions(this.time);
    this.checkWaveEnd(this.time);
  }

  updateAmbient(dt) {
    for (const star of this.stars) star.phase += dt * star.speed;
    for (const fly of this.fireflies) {
      fly.phase += dt * fly.speed;
      fly.x += Math.sin(fly.phase * 0.7) * 14 * dt;
      fly.y += Math.cos(fly.phase * 0.9) * 10 * dt;
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter((p) => !p.dead);
    for (const f of this.floaters) f.update(dt);
    this.floaters = this.floaters.filter((f) => !f.dead);
  }

  spawnLogic(dt) {
    this.bloomTimer -= dt;
    if (this.bloomTimer <= 0 && this.blooms.length < CONFIG.bloom.maxOnScreen) {
      this.spawnBloom();
      this.bloomTimer = CONFIG.bloom.spawnIntervalSeconds * (0.8 + this.rng() * 0.5);
    }
    this.batTimer -= dt;
    if (this.batTimer <= 0) {
      this.bats.push(new Bat(this.rng, this.wave, CONFIG.view.width, CONFIG.view.height));
      const interval = Math.max(
        CONFIG.bat.minSpawnIntervalSeconds,
        CONFIG.bat.spawnIntervalSeconds - 0.16 * (this.wave - 1),
      );
      this.batTimer = interval * (0.75 + this.rng() * 0.5);
    }
    this.webTimer -= dt;
    if (this.webTimer <= 0 && this.webs.length < CONFIG.web.maxOnScreen && this.wave >= 2) {
      this.webs.push(new Web(this.rng, CONFIG.view.width));
      this.webTimer = CONFIG.web.spawnIntervalSeconds * (0.8 + this.rng() * 0.5);
    }
    // One moonpetal per wave, halfway through it.
    if (!this.petalSpawnedThisWave && this.waveTime > CONFIG.waves.lengthSeconds / 2) {
      this.petals.push(new Moonpetal(this.rng, CONFIG.view.width, CONFIG.view.height));
      this.petalSpawnedThisWave = true;
    }
  }

  spawnBloom() {
    this.blooms.push(new Bloom(this.rng, CONFIG.view.width, CONFIG.view.height));
  }

  updateEntities(dt) {
    for (const b of this.bats) b.update(dt);
    const before = this.bats.length;
    this.bats = this.bats.filter((b) => !b.offscreen && !b.dead);
    this.stats.batsDodged += before - this.bats.length;
    for (const b of this.blooms) b.update(dt);
    this.blooms = this.blooms.filter((b) => !b.expired && !b.dead);
    for (const p of this.petals) p.update(dt);
    this.petals = this.petals.filter((p) => !p.expired && !p.dead);
    for (const w of this.webs) w.update(dt);
    this.webs = this.webs.filter((w) => !w.offscreen && !w.dead);
  }

  handleCollisions(gameTime) {
    const p = this.player;

    for (const bloom of this.blooms) {
      if (bloom.dead) continue;
      const r = CONFIG.bloom.collectRadius + p.radius * 0.4;
      if (Math.hypot(p.x - bloom.x, p.y - bloom.y) < r) {
        bloom.dead = true;
        this.collectBloom(bloom);
      }
    }
    for (const petal of this.petals) {
      if (petal.dead) continue;
      const r = CONFIG.petal.collectRadius + p.radius * 0.4;
      if (Math.hypot(p.x - petal.x, p.y - petal.y) < r) {
        petal.dead = true;
        this.collectPetal(petal);
      }
    }
    for (const web of this.webs) {
      if (web.dead || p.snared) continue;
      if (collides(p, web)) {
        web.dead = true;
        p.snaredUntil = gameTime + CONFIG.web.snareSeconds;
        this.addFloater(p.x, p.y - 30, 'SNARED!', '#c792ff');
        this.burst(p.x, p.y, '#c792ff', 10, 130, 0.5, 3);
        this.sounds.tone({ from: 220, to: 140, seconds: 0.2, type: 'triangle', volume: 0.6 });
      }
    }
    if (!p.invulnerable) {
      for (const bat of this.bats) {
        if (bat.dead) continue;
        if (collides(p, bat)) {
          bat.dead = true;
          this.hitByBat(gameTime);
          break;
        }
      }
    }
  }

  collectBloom(bloom) {
    this.combo += 1;
    this.comboTimer = CONFIG.combo.windowSeconds;
    const points = CONFIG.bloom.basePoints * this.comboMultiplier;
    this.score += points;
    this.waveCollected += 1;
    this.stats.bloomsCollected += 1;
    this.addFloater(bloom.x, bloom.y - 26, `+${points}`, bloom.color.core);
    this.burst(bloom.x, bloom.y, bloom.color.petal, CONFIG.fx.particlesPerCollect, 170, 0.6, 3.5);
    this.sounds.collect(this.comboMultiplier);
  }

  collectPetal(petal) {
    this.score += CONFIG.petal.points;
    if (this.player.pulseCharges < CONFIG.pulse.maxCharges) {
      this.player.pulseCharges += 1;
    }
    this.addFloater(petal.x, petal.y - 28, `+${CONFIG.petal.points}  MOONPETAL`, '#ffe66d');
    this.burst(petal.x, petal.y, '#ffe66d', 22, 220, 0.8, 4);
    this.sounds.petal();
  }

  hitByBat(gameTime) {
    const p = this.player;
    p.lives -= 1;
    p.invulnerableUntil = gameTime + CONFIG.player.invulnerableSeconds;
    this.combo = 0;
    this.comboTimer = 0;
    this.shake = CONFIG.fx.shakeOnHit;
    this.burst(p.x, p.y, '#ff5d73', CONFIG.fx.particlesPerHit, 260, 0.7, 4);
    this.sounds.hit();
    if (p.lives <= 0) {
      this.state = STATES.GAME_OVER;
      this.saveBest();
      this.sounds.gameOver();
    }
  }

  firePulse(gameTime) {
    const p = this.player;
    if (!p.tryPulse(gameTime)) return;
    this.stats.pulsesUsed += 1;
    this.pulseRing = { x: p.x, y: p.y, age: 0 };
    this.sounds.pulse();
    for (const bat of this.bats) {
      const d = Math.hypot(bat.x - p.x, bat.y - p.y);
      if (d < CONFIG.pulse.radius + bat.radius) {
        const angle = Math.atan2(bat.y - p.y, bat.x - p.x);
        bat.vx += Math.cos(angle) * CONFIG.pulse.shove;
        bat.vy += Math.sin(angle) * CONFIG.pulse.shove * 0.4;
        bat.baseY = bat.y;
      }
    }
    this.burst(p.x, p.y, '#7ad9ff', 12, 200, 0.4, 3);
  }

  checkWaveEnd(gameTime) {
    if (this.waveCollected >= this.waveQuota || this.waveTime >= CONFIG.waves.lengthSeconds) {
      const bonus = CONFIG.waves.clearBonusPerWave * this.wave;
      this.score += bonus;
      this.stats.wavesCleared += 1;
      if (this.wave >= CONFIG.waves.total) {
        this.state = STATES.VICTORY;
        this.saveBest();
        this.sounds.victory();
        return;
      }
      this.state = STATES.WAVE_CLEAR;
      this.showBanner(
        `Night ${this.wave} clear!`,
        `Dawn bonus +${bonus} — Night ${this.wave + 1} stirs…`,
        2.4,
      );
      this.sounds.waveClear();
    }
  }

  nextWave() {
    this.wave += 1;
    this.waveTime = 0;
    this.waveCollected = 0;
    this.petalSpawnedThisWave = false;
    this.bats = [];
    this.webs = [];
    this.state = STATES.PLAYING;
    this.showBanner(`Night ${this.wave}`, this.wave >= 6 ? 'The dark grows hungry…' : 'Drink the blooms — dodge the bats', 2.2);
  }

  // ------------------------------------------------------------- helpers
  burst(x, y, color, count, speed, life, size) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, speed, life, size));
    }
  }

  addFloater(x, y, text, color) {
    this.floaters.push(new Floater(x, y, text, color));
  }

  // Autopilot for screenshots / demos: steer toward the nearest bloom,
  // veer away from close bats, pulse when one gets too near.
  autopilotInput(input, dt) {
    const p = this.player;
    let target = null;
    let best = Infinity;
    for (const bloom of this.blooms) {
      const d = Math.hypot(bloom.x - p.x, bloom.y - p.y);
      if (d < best) {
        best = d;
        target = bloom;
      }
    }
    if (!target && this.petals.length > 0) target = this.petals[0];
    if (target) {
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      p.vx += (dx / d) * CONFIG.player.accel * 0.9 * dt;
      p.vy += (dy / d) * CONFIG.player.accel * 0.9 * dt;
    }
    for (const bat of this.bats) {
      const d = Math.hypot(bat.x - p.x, bat.y - p.y);
      if (d < 150) {
        const away = Math.atan2(p.y - bat.y, p.x - bat.x);
        p.vx += Math.cos(away) * CONFIG.player.accel * 0.7 * dt;
        p.vy += Math.sin(away) * CONFIG.player.accel * 0.7 * dt;
        if (d < 110) this.firePulse(this.time);
      }
    }
  }

  // Input that depends on state: start / restart / pulse.
  handleGlobalInput(input, now) {
    const wasTitle = this.state === STATES.TITLE;
    const wasEnd = this.state === STATES.GAME_OVER || this.state === STATES.VICTORY;
    if (input.wasPressed('Enter') || input.wasPressed('MouseClick')) {
      if (wasTitle) this.start();
      else if (wasEnd) this.restart();
    }
    if (input.wasPressed('r') || input.wasPressed('R')) {
      if (wasEnd) this.restart();
    }
    // A click that just started the game must not also spend a pulse.
    if (this.state === STATES.PLAYING && !wasTitle && !wasEnd) {
      if (input.wasPressed(' ') || input.wasPressed('MouseClick')) {
        this.firePulse(this.time);
      }
    }
    if (input.wasPressed('m') || input.wasPressed('M')) {
      this.sounds.enabled = !this.sounds.enabled;
    }
  }
}
