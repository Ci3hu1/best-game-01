// Lumen Moth — tuning constants. One place for every number that shapes
// how the game feels, so balancing is editing data, not hunting through code.
export const CONFIG = {
  // Logical canvas size. The canvas scales to fit the browser window.
  view: { width: 1280, height: 720 },

  // The moth.
  player: {
    radius: 16,
    accel: 2600, // px/s^2 while a move key is held
    maxSpeed: 420, // px/s
    drag: 0.86, // per-frame velocity retention when no key is held
    mouseFollow: 6.5, // easing toward the mouse when it is the last input
    startLives: 3,
    maxLives: 5,
    invulnerableSeconds: 2,
  },

  // The pulse: a radial burst that shoves bats away. Costs one charge.
  pulse: {
    maxCharges: 3,
    radius: 190,
    shove: 620, // px/s added to a bat's velocity
    rechargeSeconds: 6,
    cooldownSeconds: 0.45,
  },

  // Nectar blooms: the main score source.
  bloom: {
    radius: 24,
    collectRadius: 34,
    basePoints: 10,
    lifetimeSeconds: 14,
    spawnIntervalSeconds: 1.6,
    maxOnScreen: 7,
    driftSpeed: 12,
  },

  // Combo: collecting blooms in quick succession raises the multiplier.
  combo: {
    windowSeconds: 4,
    maxMultiplier: 5,
  },

  // Moonpetals: rare, worth 50 and refund a pulse charge.
  petal: {
    points: 50,
    spawnEveryWave: 1,
    radius: 20,
    collectRadius: 32,
  },

  // Bats: the hazard that costs a life.
  bat: {
    radius: 20,
    baseSpeed: 110,
    speedPerWave: 22,
    maxSpeed: 320,
    spawnIntervalSeconds: 2.4,
    minSpawnIntervalSeconds: 0.9,
    sineAmp: 60,
    sineFreq: 2.2,
  },

  // Webs: slow drifting hazards that snare the moth (no life lost).
  web: {
    radius: 26,
    fallSpeed: 34,
    snareSeconds: 2.2,
    spawnIntervalSeconds: 5.5,
    maxOnScreen: 3,
  },

  // Waves ("nights"). Clear one by collecting its quota of blooms or by
  // surviving its full length; wave 8 cleared is the win.
  waves: {
    total: 8,
    lengthSeconds: 32,
    bloomQuotaBase: 10,
    bloomQuotaPerWave: 2,
    clearBonusPerWave: 100,
  },

  // Juice.
  fx: {
    shakeOnHit: 14,
    shakeDecay: 0.88,
    particlesPerCollect: 14,
    particlesPerHit: 26,
    floaterRise: 46,
  },

  // Ambient dressing.
  ambient: {
    stars: 130,
    fireflies: 26,
  },
};
