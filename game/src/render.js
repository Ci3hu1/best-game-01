// Lumen Moth — everything the player sees: the night sky, the garden, the
// moth, the bats, the HUD and the title / end screens. No game logic here.
import { CONFIG } from './config.js';
import { STATES } from './world.js';

const W = CONFIG.view.width;
const H = CONFIG.view.height;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.moonGlow = null;
  }

  render(game, now) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    // Screen shake on hits.
    if (game.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
    }
    this.drawSky(game, now);
    this.drawFireflies(game, now);
    if (game.state !== STATES.TITLE) {
      this.drawBlooms(game);
      this.drawPetals(game);
      this.drawWebs(game, now);
      this.drawBats(game);
      this.drawPlayer(game, now);
      this.drawParticles(game);
      this.drawPulseRing(game);
      this.drawFloaters(game);
    } else {
      this.drawTitleMoth(game, now);
    }
    ctx.restore();

    if (game.state === STATES.TITLE) this.drawTitle(game);
    else {
      this.drawHud(game, now);
      if (game.banner) this.drawBanner(game);
      if (game.state === STATES.GAME_OVER) this.drawGameOver(game);
      if (game.state === STATES.VICTORY) this.drawVictory(game);
    }
  }

  // ------------------------------------------------------------------ sky
  drawSky(game, now) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b1030');
    grad.addColorStop(0.55, '#1a1445');
    grad.addColorStop(1, '#2c1a4d');
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // The moon, top right.
    const mx = W - 150;
    const my = 92;
    const glow = ctx.createRadialGradient(mx, my, 10, mx, my, 120);
    glow.addColorStop(0, 'rgba(255,244,200,0.5)');
    glow.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 130, my - 130, 260, 260);
    ctx.fillStyle = '#fff6cf';
    ctx.beginPath();
    ctx.arc(mx, my, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230,205,140,0.5)';
    ctx.beginPath();
    ctx.arc(mx - 14, my - 8, 9, 0, Math.PI * 2);
    ctx.arc(mx + 12, my + 14, 6, 0, Math.PI * 2);
    ctx.arc(mx + 18, my - 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Stars, twinkling.
    for (const star of game.stars) {
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(star.phase));
      ctx.globalAlpha = twinkle * star.depth;
      ctx.fillStyle = '#dfe8ff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Rolling hill silhouettes at the bottom, for depth.
    ctx.fillStyle = '#120e2a';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, H - 70);
    for (let x = 0; x <= W; x += 80) {
      ctx.lineTo(x, H - 70 - Math.sin(x * 0.008 + 1.2) * 26);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0d0a20';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, H - 34);
    for (let x = 0; x <= W; x += 90) {
      ctx.lineTo(x, H - 34 - Math.sin(x * 0.011 + 4) * 16);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  drawFireflies(game, now) {
    const ctx = this.ctx;
    for (const fly of game.fireflies) {
      const glow = 0.35 + 0.65 * Math.abs(Math.sin(fly.phase * 2));
      ctx.globalAlpha = glow * 0.8;
      ctx.fillStyle = `rgb(${fly.hue})`;
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = glow * 0.18;
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // -------------------------------------------------------------- entities
  drawBlooms(game) {
    const ctx = this.ctx;
    for (const bloom of game.blooms) {
      const pulse = 1 + Math.sin(bloom.pulsePhase) * 0.08;
      ctx.save();
      ctx.globalAlpha = bloom.alpha;
      ctx.translate(bloom.x, bloom.y);
      // Glow halo.
      const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      halo.addColorStop(0, bloom.color.glow);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 46, 0, Math.PI * 2);
      ctx.fill();
      // Six petals.
      ctx.fillStyle = bloom.color.petal;
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i / 6) * Math.PI * 2);
        ctx.beginPath();
        ctx.ellipse(0, -13 * pulse, 8.5, 13 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Bright core.
      ctx.fillStyle = bloom.color.core;
      ctx.beginPath();
      ctx.arc(0, 0, 8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(-2.5, -2.5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPetals(game) {
    const ctx = this.ctx;
    for (const petal of game.petals) {
      const bob = Math.sin(petal.phase) * 4;
      ctx.save();
      ctx.translate(petal.x, petal.y + bob);
      const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 52);
      halo.addColorStop(0, 'rgba(255,230,109,0.5)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();
      // Crescent moonpetal.
      ctx.fillStyle = '#ffe66d';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0.3, Math.PI * 2 - 0.3);
      ctx.arc(6, -3, 13, Math.PI * 1.15, Math.PI * 0.85, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawWebs(game, now) {
    const ctx = this.ctx;
    for (const web of game.webs) {
      ctx.save();
      ctx.translate(web.x, web.y);
      ctx.rotate(Math.sin(web.phase) * 0.15);
      ctx.strokeStyle = 'rgba(220,200,255,0.5)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * web.radius, Math.sin(a) * web.radius);
        ctx.stroke();
      }
      for (let r = 9; r <= web.radius; r += 9) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBats(game) {
    const ctx = this.ctx;
    for (const bat of game.bats) {
      const flap = Math.sin(bat.wingPhase) * 0.55;
      ctx.save();
      ctx.translate(bat.x, bat.y);
      ctx.scale(bat.dir, 1);
      // Wings.
      ctx.fillStyle = '#3a2b52';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-16, -18 - flap * 22, -34, -6 - flap * 14);
      ctx.quadraticCurveTo(-20, 2, -12, 6);
      ctx.quadraticCurveTo(-6, 8, 0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(16, -18 - flap * 22, 34, -6 - flap * 14);
      ctx.quadraticCurveTo(20, 2, 12, 6);
      ctx.quadraticCurveTo(6, 8, 0, 4);
      ctx.closePath();
      ctx.fill();
      // Body.
      ctx.fillStyle = '#241a38';
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ears.
      ctx.fillStyle = '#241a38';
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.lineTo(-11, -15);
      ctx.lineTo(-4, -8);
      ctx.closePath();
      ctx.moveTo(8, -6);
      ctx.lineTo(11, -15);
      ctx.lineTo(4, -8);
      ctx.closePath();
      ctx.fill();
      // Glowing eyes.
      ctx.fillStyle = '#ff5d73';
      ctx.beginPath();
      ctx.arc(5, -2, 2.6, 0, Math.PI * 2);
      ctx.arc(11, -2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPlayer(game, now) {
    const ctx = this.ctx;
    const p = game.player;
    // Blink while invulnerable.
    if (p.invulnerable && Math.floor(now * 12) % 2 === 0) return;

    // Glow trail.
    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const alpha = (i / p.trail.length) * 0.25;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3 + (i / p.trail.length) * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    const flap = Math.sin(p.wingPhase) * 0.6;
    const snare = p.snared ? 0.35 : 1;

    // Halo.
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 52);
    halo.addColorStop(0, 'rgba(255,233,168,0.55)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fill();

    // Wings: two big glowing wings that flap.
    ctx.scale(p.facing, 1);
    const wingGrad = ctx.createLinearGradient(0, -26, 0, 10);
    wingGrad.addColorStop(0, '#fff3c4');
    wingGrad.addColorStop(0.6, '#ffd166');
    wingGrad.addColorStop(1, '#ff9e5e');
    ctx.fillStyle = wingGrad;
    ctx.globalAlpha = 0.95 * snare;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * (0.5 + flap * 0.35));
      ctx.beginPath();
      ctx.ellipse(side * 13, -8, 15, 20, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(side * 11, 10, 10, 12, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Wing spots.
    ctx.fillStyle = 'rgba(122,217,255,0.85)';
    ctx.beginPath();
    ctx.arc(-13, -10, 3.4, 0, Math.PI * 2);
    ctx.arc(13, -10, 3.4, 0, Math.PI * 2);
    ctx.fill();
    // Body.
    ctx.fillStyle = '#5b3a1e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head + antennae.
    ctx.fillStyle = '#3d2712';
    ctx.beginPath();
    ctx.arc(0, -15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d2712';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-3, -19);
    ctx.quadraticCurveTo(-8, -28, -12, -26);
    ctx.moveTo(3, -19);
    ctx.quadraticCurveTo(8, -28, 12, -26);
    ctx.stroke();
    // Eyes.
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.arc(-2.6, -16, 1.8, 0, Math.PI * 2);
    ctx.arc(2.6, -16, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Snare ring.
    if (p.snared) {
      ctx.save();
      ctx.strokeStyle = 'rgba(199,146,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26 + Math.sin(now * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawParticles(game) {
    const ctx = this.ctx;
    for (const p of game.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawPulseRing(game) {
    const ctx = this.ctx;
    const ring = game.pulseRing;
    if (!ring) return;
    const t = ring.age / 0.45;
    const radius = 20 + t * CONFIG.pulse.radius;
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.strokeStyle = '#7ad9ff';
    ctx.lineWidth = 5 * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = (1 - t) * 0.25;
    ctx.fillStyle = '#7ad9ff';
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFloaters(game) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.font = '700 20px system-ui, sans-serif';
    for (const f of game.floaters) {
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  drawTitleMoth(game, now) {
    // A large moth hovering over the title screen's garden.
    const ctx = this.ctx;
    const cx = W / 2;
    const cy = 300 + Math.sin(now * 1.1) * 10;
    ctx.save();
    ctx.translate(cx, cy);
    const flap = Math.sin(now * 5) * 0.5;
    const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, 130);
    halo.addColorStop(0, 'rgba(255,233,168,0.5)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.fill();
    const wingGrad = ctx.createLinearGradient(0, -60, 0, 26);
    wingGrad.addColorStop(0, '#fff3c4');
    wingGrad.addColorStop(0.6, '#ffd166');
    wingGrad.addColorStop(1, '#ff9e5e');
    ctx.fillStyle = wingGrad;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * (0.45 + flap * 0.3));
      ctx.beginPath();
      ctx.ellipse(side * 32, -18, 36, 48, side * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(side * 26, 24, 24, 28, side * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(122,217,255,0.9)';
    ctx.beginPath();
    ctx.arc(-32, -22, 8, 0, Math.PI * 2);
    ctx.arc(32, -22, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3a1e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d2712';
    ctx.beginPath();
    ctx.arc(0, -36, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d2712';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -44);
    ctx.quadraticCurveTo(-18, -64, -28, -60);
    ctx.moveTo(7, -44);
    ctx.quadraticCurveTo(18, -64, 28, -60);
    ctx.stroke();
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.arc(-6, -38, 4, 0, Math.PI * 2);
    ctx.arc(6, -38, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ------------------------------------------------------------------ HUD
  drawHud(game, now) {
    const ctx = this.ctx;
    // Top bar.
    ctx.fillStyle = 'rgba(8,10,28,0.55)';
    roundRect(ctx, 0, 0, W, 52, 0);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '700 24px system-ui, sans-serif';
    const scoreText = `SCORE  ${game.score.toLocaleString('en-US')}`;
    ctx.fillText(scoreText, 22, 27);
    // Best score, right of the score (measure while the 24px font is active).
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.fillStyle = 'rgba(223,232,255,0.75)';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(`BEST ${game.best.toLocaleString('en-US')}`, 22 + scoreWidth + 26, 27);

    // Wave + progress, centred.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText(`NIGHT ${game.wave} / ${CONFIG.waves.total}`, W / 2, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    roundRect(ctx, W / 2 - 110, 34, 220, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#7ad9ff';
    roundRect(ctx, W / 2 - 110, 34, 220 * game.waveProgress, 8, 4);
    ctx.fill();

    // Lives as hearts, right side.
    const heartX = W - 30;
    for (let i = 0; i < CONFIG.player.maxLives; i++) {
      const x = heartX - i * 32;
      const filled = i < game.player.lives;
      this.drawHeart(x, 26, filled ? '#ff5d73' : 'rgba(255,255,255,0.18)');
    }

    // Combo meter under the top bar, left.
    if (game.combo >= 2) {
      const mult = game.comboMultiplier;
      ctx.textAlign = 'left';
      ctx.fillStyle = mult >= 4 ? '#ff7ad9' : '#ffd166';
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.fillText(`COMBO ×${mult}`, 22, 78);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      roundRect(ctx, 22, 90, 120, 6, 3);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      roundRect(ctx, 22, 90, 120 * (game.comboTimer / CONFIG.combo.windowSeconds), 6, 3);
      ctx.fill();
    }

    // Pulse charges, bottom left.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7ad9ff';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillText('PULSE  [SPACE / CLICK]', 22, H - 44);
    for (let i = 0; i < CONFIG.pulse.maxCharges; i++) {
      const x = 22 + i * 26;
      const y = H - 24;
      ctx.beginPath();
      ctx.arc(x + 9, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = i < game.player.pulseCharges ? '#7ad9ff' : 'rgba(255,255,255,0.15)';
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(223,232,255,0.6)';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText('Move: WASD / arrows / mouse   ·   M: mute', 22, H - 66);
  }

  drawHeart(x, y, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-11, -2, -7, -11, 0, -5);
    ctx.bezierCurveTo(7, -11, 11, -2, 0, 8);
    ctx.fill();
    ctx.restore();
  }

  drawBanner(game) {
    const ctx = this.ctx;
    const b = game.banner;
    const remaining = b.until - game.time;
    const alpha = Math.min(1, remaining < 0.5 ? remaining / 0.5 : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 44px Georgia, serif';
    ctx.shadowColor = 'rgba(255,209,102,0.7)';
    ctx.shadowBlur = 24;
    ctx.fillText(b.text, W / 2, H / 2 - 90);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(b.sub, W / 2, H / 2 - 48);
    ctx.restore();
  }

  // --------------------------------------------------------------- screens
  panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(8,10,28,0.72)';
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,233,168,0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 18);
    ctx.stroke();
  }

  drawTitle(game) {
    const ctx = this.ctx;
    // Dim the sky a touch so the title reads.
    ctx.fillStyle = 'rgba(6,8,22,0.45)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 84px Georgia, serif';
    ctx.shadowColor = 'rgba(255,209,102,0.8)';
    ctx.shadowBlur = 30;
    ctx.fillText('LUMEN MOTH', W / 2, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.fillText('A glowmoth drinks the night garden — eight nights till dawn', W / 2, 192);

    this.panel(ctx, W / 2 - 330, 430, 660, 190);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 21px system-ui, sans-serif';
    ctx.fillText('HOW TO PLAY', W / 2, 468);
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '400 18px system-ui, sans-serif';
    ctx.fillText('Fly with WASD / arrow keys or your mouse', W / 2, 500);
    ctx.fillText('Drink glowing blooms to score — chain them for a ×5 combo', W / 2, 528);
    ctx.fillText('Dodge the bats. Webs snare you. SPACE / click pulses bats away', W / 2, 556);
    ctx.fillText('Clear all 8 nights to see the dawn', W / 2, 584);

    const blink = 0.8 + 0.2 * Math.sin(game.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#ffd166';
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillText('— PRESS ENTER OR CLICK TO BEGIN —', W / 2, 664);
    ctx.globalAlpha = 1;

    if (game.best > 0) {
      ctx.fillStyle = 'rgba(223,232,255,0.75)';
      ctx.font = '600 17px system-ui, sans-serif';
      ctx.fillText(`Best score: ${game.best.toLocaleString('en-US')}`, W / 2, 700 - 8);
    }
  }

  drawGameOver(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,8,22,0.55)';
    ctx.fillRect(0, 0, W, H);
    this.panel(ctx, W / 2 - 320, 170, 640, 340);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8fa3';
    ctx.font = '800 52px Georgia, serif';
    ctx.fillText('THE NIGHT FADES', W / 2, 250);
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(`The garden dims at Night ${game.wave}`, W / 2, 300);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.fillText(`SCORE  ${game.score.toLocaleString('en-US')}`, W / 2, 356);
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(`Best ${game.best.toLocaleString('en-US')}   ·   Blooms ${game.stats.bloomsCollected}   ·   Bats dodged ${game.stats.batsDodged}`, W / 2, 396);
    const blink = 0.8 + 0.2 * Math.sin(game.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#ffd166';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillText('— PRESS R OR CLICK TO FLY AGAIN —', W / 2, 462);
    ctx.globalAlpha = 1;
  }

  drawVictory(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,214,130,0.14)';
    ctx.fillRect(0, 0, W, H);
    this.panel(ctx, W / 2 - 320, 170, 640, 340);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe66d';
    ctx.font = '800 52px Georgia, serif';
    ctx.shadowColor = 'rgba(255,230,109,0.8)';
    ctx.shadowBlur = 26;
    ctx.fillText('DAWN BREAKS', W / 2, 250);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText('Eight nights drunk dry — the garden wakes in gold', W / 2, 300);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.fillText(`SCORE  ${game.score.toLocaleString('en-US')}`, W / 2, 356);
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(`Best ${game.best.toLocaleString('en-US')}   ·   Blooms ${game.stats.bloomsCollected}   ·   Pulses ${game.stats.pulsesUsed}`, W / 2, 396);
    const blink = 0.8 + 0.2 * Math.sin(game.time * 3);
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#ffd166';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillText('— PRESS R OR CLICK TO PLAY AGAIN —', W / 2, 462);
    ctx.globalAlpha = 1;
  }
}
