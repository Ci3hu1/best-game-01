// Lumen Moth — the things that live in the night garden: the moth, bats,
// blooms, moonpetals, webs, particles and floating score text. Each one is
// plain data plus an update step; render.js owns all drawing.
import { CONFIG } from './config.js';
import { clamp, dist2, lerp, range } from './random.js';

// ---------------------------------------------------------------- player
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.player.radius;
    this.lives = CONFIG.player.startLives;
    this.invulnerableUntil = -1;
    this.snaredUntil = -1;
    this.wingPhase = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.pulseCharges = CONFIG.pulse.maxCharges;
    this.pulseCooldownUntil = 0;
    this.pulseRechargeAt = 0;
    this.trail = []; // recent positions, for the glow trail
    this.gameTime = 0; // gameplay clock, set every update (never wall time)
  }

  get invulnerable() {
    return this.gameTime < this.invulnerableUntil;
  }

  get snared() {
    return this.gameTime < this.snaredUntil;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.lives = CONFIG.player.startLives;
    this.invulnerableUntil = -1;
    this.snaredUntil = -1;
    this.pulseCharges = CONFIG.pulse.maxCharges;
    this.pulseCooldownUntil = 0;
    this.pulseRechargeAt = 0;
    this.trail = [];
  }

  update(dt, input, now, gameTime) {
    this.gameTime = gameTime;
    const cfg = CONFIG.player;
    const move = input.moveVector();
    const snareFactor = this.snared ? 0.45 : 1;

    if (move.x !== 0 || move.y !== 0) {
      this.vx += move.x * cfg.accel * snareFactor * dt;
      this.vy += move.y * cfg.accel * snareFactor * dt;
    } else if (input.mouse.x !== null && now - input.mouse.movedAt < 2.5) {
      // Mouse steering: ease toward the cursor when it moved recently.
      const dx = input.mouse.x - this.x;
      const dy = input.mouse.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        const speed = Math.min(cfg.maxSpeed * snareFactor, d * CONFIG.player.mouseFollow);
        this.vx = lerp(this.vx, (dx / d) * speed, 1 - Math.pow(0.001, dt));
        this.vy = lerp(this.vy, (dy / d) * speed, 1 - Math.pow(0.001, dt));
      }
    } else {
      this.vx *= Math.pow(cfg.drag, dt * 60);
      this.vy *= Math.pow(cfg.drag, dt * 60);
    }

    const speed = Math.hypot(this.vx, this.vy);
    const max = cfg.maxSpeed * snareFactor;
    if (speed > max) {
      this.vx = (this.vx / speed) * max;
      this.vy = (this.vy / speed) * max;
    }
    this.x = clamp(this.x + this.vx * dt, 20, CONFIG.view.width - 20);
    this.y = clamp(this.y + this.vy * dt, 56, CONFIG.view.height - 20);
    if (Math.abs(this.vx) > 20) this.facing = this.vx > 0 ? 1 : -1;
    this.wingPhase += dt * (8 + speed * 0.02);

    // Pulse recharge, one charge at a time (gameplay clock).
    if (this.pulseCharges < CONFIG.pulse.maxCharges && gameTime >= this.pulseRechargeAt) {
      this.pulseCharges += 1;
      this.pulseRechargeAt = gameTime + CONFIG.pulse.rechargeSeconds;
    }

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 14) this.trail.shift();
  }

  tryPulse(gameTime) {
    if (this.pulseCharges <= 0 || gameTime < this.pulseCooldownUntil) return false;
    this.pulseCharges -= 1;
    this.pulseCooldownUntil = gameTime + CONFIG.pulse.cooldownSeconds;
    this.pulseRechargeAt = Math.max(this.pulseRechargeAt, gameTime + CONFIG.pulse.rechargeSeconds);
    return true;
  }
}

// ------------------------------------------------------------------- bat
let batId = 0;
export class Bat {
  constructor(rng, wave, width, height) {
    this.id = batId++;
    const fromLeft = rng() < 0.5;
    this.x = fromLeft ? -30 : width + 30;
    this.y = range(rng, 90, height - 90);
    this.baseY = this.y;
    this.dir = fromLeft ? 1 : -1;
    const speed = Math.min(
      CONFIG.bat.baseSpeed + CONFIG.bat.speedPerWave * (wave - 1),
      CONFIG.bat.maxSpeed,
    );
    this.vx = this.dir * range(rng, speed * 0.85, speed * 1.15);
    this.vy = 0;
    this.radius = CONFIG.bat.radius;
    this.phase = range(rng, 0, Math.PI * 2);
    this.wingPhase = range(rng, 0, Math.PI * 2);
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.phase += dt * CONFIG.bat.sineFreq;
    this.y = this.baseY + Math.sin(this.phase) * CONFIG.bat.sineAmp * 0.6;
    this.wingPhase += dt * 14;
  }

  get offscreen() {
    return this.x < -60 || this.x > CONFIG.view.width + 60;
  }
}

// ----------------------------------------------------------------- bloom
export const BLOOM_COLORS = [
  { petal: '#ff7ad9', core: '#ffd166', glow: 'rgba(255,122,217,0.55)' },
  { petal: '#7ad9ff', core: '#fff3b0', glow: 'rgba(122,217,255,0.55)' },
  { petal: '#c792ff', core: '#ffe66d', glow: 'rgba(199,146,255,0.55)' },
  { petal: '#ffd166', core: '#ff8fa3', glow: 'rgba(255,209,102,0.55)' },
];

export class Bloom {
  constructor(rng, width, height) {
    this.x = range(rng, 70, width - 70);
    this.y = range(rng, 110, height - 70);
    this.radius = CONFIG.bloom.radius;
    this.color = BLOOM_COLORS[Math.floor(rng() * BLOOM_COLORS.length)];
    this.age = 0;
    this.lifetime = CONFIG.bloom.lifetimeSeconds;
    this.pulsePhase = range(rng, 0, Math.PI * 2);
    this.driftAngle = range(rng, 0, Math.PI * 2);
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.pulsePhase += dt * 2.4;
    this.x += Math.cos(this.driftAngle) * CONFIG.bloom.driftSpeed * dt;
    this.y += Math.sin(this.driftAngle) * CONFIG.bloom.driftSpeed * 0.6 * dt;
    this.x = clamp(this.x, 50, CONFIG.view.width - 50);
    this.y = clamp(this.y, 100, CONFIG.view.height - 50);
  }

  get expired() {
    return this.age >= this.lifetime;
  }

  // Fades out in its last two seconds so the player can see it going.
  get alpha() {
    const remaining = this.lifetime - this.age;
    return remaining < 2 ? Math.max(0.15, remaining / 2) : 1;
  }
}

// -------------------------------------------------------------- moonpetal
export class Moonpetal {
  constructor(rng, width, height) {
    this.x = range(rng, 90, width - 90);
    this.y = range(rng, 120, height - 90);
    this.radius = CONFIG.petal.radius;
    this.age = 0;
    this.lifetime = 12;
    this.phase = range(rng, 0, Math.PI * 2);
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.phase += dt * 1.8;
    this.y += Math.sin(this.phase) * 8 * dt;
  }

  get expired() {
    return this.age >= this.lifetime;
  }
}

// ------------------------------------------------------------------- web
export class Web {
  constructor(rng, width) {
    this.x = range(rng, 60, width - 60);
    this.y = -30;
    this.radius = CONFIG.web.radius;
    this.phase = range(rng, 0, Math.PI * 2);
    this.dead = false;
  }

  update(dt) {
    this.y += CONFIG.web.fallSpeed * dt;
    this.phase += dt * 1.2;
  }

  get offscreen() {
    return this.y > CONFIG.view.height + 40;
  }
}

// ------------------------------------------------------- particles, text
export class Particle {
  constructor(x, y, color, speed, life, size) {
    const angle = Math.random() * Math.PI * 2;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed * (0.4 + Math.random() * 0.8);
    this.vy = Math.sin(angle) * speed * (0.4 + Math.random() * 0.8);
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.92, dt * 60);
    this.vy *= Math.pow(0.92, dt * 60);
    this.life -= dt;
  }

  get dead() {
    return this.life <= 0;
  }

  get alpha() {
    return Math.max(0, this.life / this.maxLife);
  }
}

export class Floater {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.1;
    this.maxLife = 1.1;
  }

  update(dt) {
    this.y -= CONFIG.fx.floaterRise * dt;
    this.life -= dt;
  }

  get dead() {
    return this.life <= 0;
  }

  get alpha() {
    return Math.max(0, this.life / this.maxLife);
  }
}

export function distanceTo(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function collides(a, b) {
  const r = (a.radius || 0) + (b.radius || 0);
  return dist2(a.x, a.y, b.x, b.y) < r * r;
}
