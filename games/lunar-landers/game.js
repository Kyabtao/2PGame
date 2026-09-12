/* Lunar Landers — split-screen landing with fuel; first soft landing wins. */
(function () {
  const W = 800, H = 520;
  Game.init({
    id: 'lunar-landers',
    rules: ['Each lander has a limited fuel supply. Rotate and fire the main engine to control your descent.', 'Land on your green pad with vertical speed under 40, horizontal speed under 25 and nearly upright, or you crash.', 'First safe landing wins. If you crash and your rival then lands, they win; if both crash, it is a draw. Out of fuel? Good luck.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> rotate · <kbd>W</kbd> thrust', p2: '<kbd>←</kbd>/<kbd>→</kbd> rotate · <kbd>↑</kbd> thrust' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const ground = new Float32Array(W + 1); { let y = 420; for (let x = 0; x <= W; x++) { if (x % 40 === 0) y = clamp(y + rndf(-40, 40), 330, 490); ground[x] = y; } }
      const pads = { 1: { x: 60 + rnd(220), w: 70 }, 2: { x: 460 + rnd(220), w: 70 } };
      for (const p of [1, 2]) { const pad = pads[p]; const y = ground[pad.x | 0]; for (let x = pad.x; x <= pad.x + pad.w; x++) ground[x | 0] = y; }
      const land = { 1: { x: 150, y: 60, vx: rndf(10, 30), vy: 0, a: 0, fuel: 100, state: 'fly' }, 2: { x: W - 150, y: 60, vx: rndf(-30, -10), vy: 0, a: 0, fuel: 100, state: 'fly' } };
      const ctl = { 1: { l: 'KeyA', r: 'KeyD', t: 'KeyW' }, 2: { l: 'ArrowLeft', r: 'ArrowRight', t: 'ArrowUp' } };
      const stars = range(60).map(() => [Math.random() * W, Math.random() * 300]);
      let t = 0;
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) {
          const l = land[p], c = ctl[p]; if (l.state !== 'fly') continue;
          if (g.down(c.l)) l.a -= 2.2 * dt; if (g.down(c.r)) l.a += 2.2 * dt;
          l.thrust = g.down(c.t) && l.fuel > 0;
          if (l.thrust) { l.vx += Math.sin(l.a) * 90 * dt; l.vy -= Math.cos(l.a) * 90 * dt; l.fuel -= 14 * dt; }
          l.vy += 35 * dt; l.x += l.vx * dt; l.y += l.vy * dt;
          if (l.x < 10 || l.x > W - 10) { l.x = clamp(l.x, 10, W - 10); l.vx = 0; }
          const gy = ground[clamp(l.x | 0, 0, W)];
          if (l.y + 12 >= gy) {
            const pad = pads[p]; const onPad = l.x >= pad.x && l.x <= pad.x + pad.w;
            const soft = Math.abs(l.vy) < 40 && Math.abs(l.vx) < 25 && Math.abs(((l.a % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI) < 0.3;
            l.y = gy - 12; l.state = onPad && soft ? 'landed' : 'crash'; l.vx = l.vy = 0;
            if (l.state === 'landed') { g.sfx('win'); draw(); return g.win(p, `Touched down safely in ${t.toFixed(1)}s.`); }
            g.sfx('explode');
            if (land[3 - p].state === 'crash') { draw(); return g.draw('Both landers crashed.'); }
            g.status(`${esc(g.name(p))} crashed ${onPad ? '(too fast!)' : '(missed the pad)'}`);
          }
        }
        g.points(Math.max(0, land[1].fuel) | 0, Math.max(0, land[2].fuel) | 0);
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#05060f'); stars.forEach(([x, y]) => UI.circle(ctx, x, y, 1, '#fff9'));
        ctx.fillStyle = '#4a4a5a'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x++) ctx.lineTo(x, ground[x]); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        for (const p of [1, 2]) { const pad = pads[p]; UI.rect(ctx, pad.x, ground[pad.x | 0] - 4, pad.w, 6, g.color(p)); UI.text(ctx, g.name(p).slice(0, 10), pad.x + pad.w / 2, ground[pad.x | 0] + 16, { color: g.color(p), font: 'bold 11px system-ui' }); }
        for (const p of [1, 2]) {
          const l = land[p]; ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a);
          if (l.state === 'crash') { UI.text(ctx, '💥', 0, 0, { font: '28px system-ui' }); ctx.restore(); continue; }
          UI.roundRect(ctx, -10, -12, 20, 18, 4, g.color(p)); UI.rect(ctx, -14, 6, 6, 8, '#ccc'); UI.rect(ctx, 8, 6, 6, 8, '#ccc');
          if (l.thrust) { ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(0, 20 + Math.random() * 10); ctx.lineTo(5, 8); ctx.fillStyle = '#ffa94d'; ctx.fill(); }
          ctx.restore();
          const hx = p === 1 ? 14 : W - 150; UI.text(ctx, `fuel ${Math.max(0, l.fuel) | 0}  vy ${l.vy | 0}  vx ${l.vx | 0}`, hx, 16, { color: g.color(p), font: '12px monospace', align: 'left' });
        }
      }
    },
  });
})();
