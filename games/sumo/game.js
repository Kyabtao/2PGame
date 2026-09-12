/* Sumo Push — physics shoving in a shrinking ring; best of 5 falls. */
(function () {
  const W = 700, H = 560, TARGET = 3;
  Game.init({
    id: 'sumo',
    rules: ['Push the other wrestler out of the ring. Bumping transfers momentum — charge for a big shove.', 'The <kbd>Dash</kbd> button gives a burst of speed but needs 2 seconds to recharge.', `The ring shrinks over time. First to ${TARGET} falls wins.`],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · dash <kbd>E</kbd>', p2: 'Arrows · dash <kbd>/</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyE', label: 'Dash' }] }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'Slash', label: 'Dash' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; let R = 230, pause = 0, w;
      const reset = () => { w = { 1: { x: W / 2 - 110, y: H / 2, vx: 0, vy: 0, dash: 0, r: 26 }, 2: { x: W / 2 + 110, y: H / 2, vx: 0, vy: 0, dash: 0, r: 26 } }; R = 230; };
      reset();
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD', dash: 'KeyE' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight', dash: 'Slash' } };
      g.key(['KeyE', 'Slash'], (code) => { const p = code === 'KeyE' ? 1 : 2; const s = w[p]; if (pause > 0 || s.dash > 0) return; const sp = Math.hypot(s.vx, s.vy); const ax = sp > 1 ? s.vx / sp : (p === 1 ? 1 : -1), ay = sp > 1 ? s.vy / sp : 0; s.vx += ax * 420; s.vy += ay * 420; s.dash = 2; g.sfx('go'); });
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; if (pause <= 0) reset(); draw(); return; }
        R = Math.max(110, R - 6 * dt);
        for (const p of [1, 2]) {
          const s = w[p], c = ctl[p]; s.dash -= dt;
          const ax = (g.down(c.r) ? 1 : 0) - (g.down(c.l) ? 1 : 0), ay = (g.down(c.d) ? 1 : 0) - (g.down(c.u) ? 1 : 0);
          s.vx += ax * 700 * dt; s.vy += ay * 700 * dt; s.vx *= Math.pow(0.12, dt); s.vy *= Math.pow(0.12, dt);
          s.x += s.vx * dt; s.y += s.vy * dt;
        }
        const a = w[1], b = w[2]; const d = dist(a.x, a.y, b.x, b.y);
        if (d < a.r + b.r) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rel > 0) { a.vx -= rel * nx * 1.1; a.vy -= rel * ny * 1.1; b.vx += rel * nx * 1.1; b.vy += rel * ny * 1.1; g.sfx('hit'); } const over = (a.r + b.r - d) / 2; a.x -= nx * over; a.y -= ny * over; b.x += nx * over; b.y += ny * over; }
        for (const p of [1, 2]) if (dist(w[p].x, w[p].y, W / 2, H / 2) > R + w[p].r * 0.5) { score[3 - p]++; g.points(score[1], score[2]); g.sfx('score'); if (score[3 - p] >= TARGET) { draw(); return g.win(3 - p, `${score[1]} – ${score[2]} falls.`); } pause = 1.2; g.status(`${esc(g.name(p))} is out!`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#2a2118');
        UI.circle(ctx, W / 2, H / 2, R + 10, '#5a4630'); UI.circle(ctx, W / 2, H / 2, R, '#c9a56a');
        ctx.strokeStyle = '#fff8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 0.35, 0, Math.PI * 2); ctx.stroke();
        for (const p of [1, 2]) { const s = w[p]; UI.circle(ctx, s.x + 4, s.y + 6, s.r, '#0004'); UI.circle(ctx, s.x, s.y, s.r, g.color(p)); UI.circle(ctx, s.x, s.y, s.r * .55, '#ffe0b3'); if (s.dash > 0) { ctx.strokeStyle = '#fff6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - s.dash / 2)); ctx.stroke(); } }
      }
    },
  });
})();
