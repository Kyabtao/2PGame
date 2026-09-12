/* Space Duel — Spacewar! style: rotate, thrust, shoot, central gravity well, wrapping edges. */
(function () {
  const W = 800, H = 560, TARGET = 5;
  Game.init({
    id: 'space-duel',
    rules: ['Rotate and thrust your ship; the screen wraps around. A star in the middle pulls everything towards it — touch it and you burn.', 'Shoot the other ship to score. First to ' + TARGET + ' hits wins. Falling into the star gives the point to your opponent.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> rotate · <kbd>W</kbd> thrust · <kbd>E</kbd> fire', p2: '<kbd>←</kbd>/<kbd>→</kbd> rotate · <kbd>↑</kbd> thrust · <kbd>/</kbd> fire' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyE', label: 'Fire' }] }, { side: 2, dpad: { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'Slash', label: 'Fire' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; let ships, shots = [], flash = 0, pause = 0;
      const stars = range(80).map(() => [Math.random() * W, Math.random() * H, Math.random() * 1.5 + .3]);
      const reset = () => { ships = { 1: { x: 120, y: H / 2, vx: 0, vy: 60, a: -Math.PI / 2, cd: 0 }, 2: { x: W - 120, y: H / 2, vx: 0, vy: -60, a: Math.PI / 2, cd: 0 } }; shots = []; };
      reset();
      const ctl = { 1: { l: 'KeyA', r: 'KeyD', t: 'KeyW', f: 'KeyE' }, 2: { l: 'ArrowLeft', r: 'ArrowRight', t: 'ArrowUp', f: 'Slash' } };
      g.key(['KeyE', 'Slash'], (code) => { const p = code === 'KeyE' ? 1 : 2; const s = ships[p]; if (pause > 0 || s.cd > 0) return; s.cd = 0.3; shots.push({ p, x: s.x + Math.cos(s.a) * 16, y: s.y + Math.sin(s.a) * 16, vx: s.vx + Math.cos(s.a) * 320, vy: s.vy + Math.sin(s.a) * 320, life: 1.6 }); g.sfx('hit'); });
      const wrap = (o) => { if (o.x < 0) o.x += W; if (o.x > W) o.x -= W; if (o.y < 0) o.y += H; if (o.y > H) o.y -= H; };
      const gravity = (o, dt) => { const dx = W / 2 - o.x, dy = H / 2 - o.y; const d2 = Math.max(400, dx * dx + dy * dy); const f = 90000 / d2; const d = Math.sqrt(d2); o.vx += dx / d * f * dt; o.vy += dy / d * f * dt; };
      const point = (to, why) => { score[to]++; g.points(score[1], score[2]); g.sfx('explode'); flash = 0.4; if (score[to] >= TARGET) { draw(); return g.win(to, why); } pause = 1.2; g.status(why); };
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; if (pause <= 0) reset(); draw(); return; }
        for (const p of [1, 2]) {
          const s = ships[p], c = ctl[p]; s.cd -= dt;
          if (g.down(c.l)) s.a -= 3.5 * dt; if (g.down(c.r)) s.a += 3.5 * dt;
          if (g.down(c.t)) { s.vx += Math.cos(s.a) * 220 * dt; s.vy += Math.sin(s.a) * 220 * dt; s.thrust = true; } else s.thrust = false;
          gravity(s, dt); const sp = Math.hypot(s.vx, s.vy); if (sp > 320) { s.vx *= 320 / sp; s.vy *= 320 / sp; }
          s.x += s.vx * dt; s.y += s.vy * dt; wrap(s);
          if (dist(s.x, s.y, W / 2, H / 2) < 22) return point(3 - p, `${esc(g.name(p))} fell into the star!`);
        }
        if (dist(ships[1].x, ships[1].y, ships[2].x, ships[2].y) < 24) { flash = .4; g.sfx('explode'); pause = 1.2; g.status('Ships collided!'); return; }
        for (const s of shots) { s.life -= dt; gravity(s, dt); s.x += s.vx * dt; s.y += s.vy * dt; wrap(s); if (dist(s.x, s.y, W / 2, H / 2) < 20) s.life = 0; for (const p of [1, 2]) if (s.p !== p && dist(s.x, s.y, ships[p].x, ships[p].y) < 14) { s.life = 0; return point(3 - p, `${esc(g.name(3 - p))} hit ${esc(g.name(p))}!`); } }
        shots = shots.filter((s) => s.life > 0);
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#05060f');
        stars.forEach(([x, y, r]) => UI.circle(ctx, x, y, r, '#ffffff88'));
        const grd = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, 60); if (grd && grd.addColorStop) { grd.addColorStop(0, '#fff7c2'); grd.addColorStop(0.3, '#ffb347'); grd.addColorStop(1, 'transparent'); ctx.fillStyle = grd; ctx.fillRect(W / 2 - 60, H / 2 - 60, 120, 120); }
        UI.circle(ctx, W / 2, H / 2, 18, '#fff3b0');
        for (const p of [1, 2]) { const s = ships[p]; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-12, 10); ctx.lineTo(-6, 0); ctx.lineTo(-12, -10); ctx.closePath(); ctx.fillStyle = g.color(p); ctx.fill(); if (s.thrust) { ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(-20 - Math.random() * 8, 0); ctx.lineTo(-8, -4); ctx.fillStyle = '#ffa94d'; ctx.fill(); } ctx.restore(); }
        shots.forEach((s) => UI.circle(ctx, s.x, s.y, 3, g.color(s.p)));
        if (flash > 0) { flash -= 0.016; UI.rect(ctx, 0, 0, W, H, `rgba(255,255,255,${flash * 0.5})`); }
      }
    },
  });
})();
