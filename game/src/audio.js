// Lumen Moth — tiny synthesised sound effects. No audio files: every sound
// is an oscillator + gain envelope built with WebAudio on first use, so the
// game ships zero bytes of audio and still has feedback on every action.
// Audio starts only after a user gesture (browser autoplay policy).
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  // One short tone: frequency glide from `from` to `to` over `seconds`.
  tone({ from, to = from, seconds = 0.12, type = 'sine', volume = 1, delay = 0 }) {
    if (!this.enabled || !this.ctx || !this.master) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t0);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + seconds);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.9 * volume, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.05);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  collect(combo) {
    // A rising chime: higher with the combo multiplier.
    const base = 520 * Math.pow(1.12, Math.min(combo, 5));
    this.tone({ from: base, to: base * 1.5, seconds: 0.14, type: 'sine', volume: 0.8 });
    this.tone({ from: base * 2, seconds: 0.1, type: 'triangle', volume: 0.35, delay: 0.02 });
  }

  petal() {
    this.tone({ from: 660, to: 990, seconds: 0.2, type: 'sine', volume: 0.9 });
    this.tone({ from: 990, to: 1320, seconds: 0.22, type: 'sine', volume: 0.6, delay: 0.07 });
  }

  pulse() {
    this.tone({ from: 300, to: 90, seconds: 0.28, type: 'triangle', volume: 0.9 });
  }

  hit() {
    this.tone({ from: 160, to: 55, seconds: 0.3, type: 'sawtooth', volume: 0.9 });
    this.tone({ from: 90, to: 45, seconds: 0.25, type: 'square', volume: 0.5, delay: 0.02 });
  }

  waveClear() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      this.tone({ from: freq, seconds: 0.22, type: 'triangle', volume: 0.7, delay: i * 0.09 });
    });
  }

  victory() {
    [523, 659, 784, 1047, 1319, 1568].forEach((freq, i) => {
      this.tone({ from: freq, seconds: 0.3, type: 'triangle', volume: 0.7, delay: i * 0.11 });
    });
  }

  gameOver() {
    [392, 330, 262, 196].forEach((freq, i) => {
      this.tone({ from: freq, seconds: 0.3, type: 'sine', volume: 0.7, delay: i * 0.14 });
    });
  }
}
