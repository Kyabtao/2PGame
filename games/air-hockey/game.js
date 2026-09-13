/* Air Hockey — vertical table, mallets, puck physics, first to 7. */
(function () {
  const W = 480, H = 720, TARGET = 7, GOAL = 140;
  Game.init({
    id: 'air-hockey',
    rules: ['Player 1 defends the bottom goal, Player 2 the top. Mallets cannot cross the centre line.', 'Hit the puck into the opposite goal. The faster you swing, the harder the shot.', `First to ${TARGET} goals wins.`],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> (or drag)', p2: 'Arrows (or drag)' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; const MR = 28, PR = 18;
      const M = { 1: { x: W / 2, y: H - 100, vx: 0, vy: 0 }, 2: { x: W / 2, y: 100, vx: 0, vy: 0 } };
      const puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 }; let pause = 0;
      const pointers = {};
      UI.pointer(canvas, { down: (pt) => { pointers[pt.id] = pt.y > H / 2 ? 1 : 2; target(pt); }, move: (pt) => { if (pt.held) target(pt); }, up: (pt) => { delete pointers[pt.id]; } }, W, H);
      const targets = {};
      function target(pt) { const p = pointers[pt.id]; if (!p) return; targets[p] = { x: pt.x, y: pt.y }; }
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      const serve = (to) => { puck.x = W / 2; puck.y = to === 1 ? H / 2 + 80 : H / 2 - 80; puck.vx = 0; puck.vy = 0; };
      serve(1 + rnd(2)); draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; draw(); return; }
        for (const p of [1, 2]) {
          const m = M[p], c = ctl[p]; const ox = m.x, oy = m.y;
          if (targets[p]) { m.x += (targets[p].x - m.x) * Math.min(1, dt * 18); m.y += (targets[p].y - m.y) * Math.min(1, dt * 18); }
          const dx = (g.down(c.r) ? 1 : 0) - (g.down(c.l) ? 1 : 0), dy = (g.down(c.d) ? 1 : 0) - (g.down(c.u) ? 1 : 0);
          if (dx || dy) { m.x += dx * 520 * dt; m.y += dy * 520 * dt; delete targets[p]; }
          m.x = clamp(m.x, MR, W - MR); m.y = p === 1 ? clamp(m.y, H / 2 + MR, H - MR) : clamp(m.y, MR, H / 2 - MR);
          m.vx = (m.x - ox) / dt; m.vy = (m.y - oy) / dt;
        }
        puck.x += puck.vx * dt; puck.y += puck.vy * dt; puck.vx *= Math.pow(0.7, dt); puck.vy *= Math.pow(0.7, dt);
        if (puck.x < PR) { puck.x = PR; puck.vx = Math.abs(puck.vx); g.sfx('bounce'); } if (puck.x > W - PR) { puck.x = W - PR; puck.vx = -Math.abs(puck.vx); g.sfx('bounce'); }
        const inGoal = puck.x > W / 2 - GOAL / 2 && puck.x < W / 2 + GOAL / 2;
        if (puck.y < PR) { if (inGoal) return goal(1); puck.y = PR; puck.vy = Math.abs(puck.vy); g.sfx('bounce'); }
        if (puck.y > H - PR) { if (inGoal) return goal(2); puck.y = H - PR; puck.vy = -Math.abs(puck.vy); g.sfx('bounce'); }
        for (const p of [1, 2]) { const m = M[p]; const d = dist(m.x, m.y, puck.x, puck.y); if (d < MR + PR) { const nx = (puck.x - m.x) / (d || 1), ny = (puck.y - m.y) / (d || 1); puck.x = m.x + nx * (MR + PR + 1); puck.y = m.y + ny * (MR + PR + 1); const rel = (puck.vx - m.vx) * nx + (puck.vy - m.vy) * ny; if (rel < 0) { puck.vx -= 1.8 * rel * nx; puck.vy -= 1.8 * rel * ny; } const sp = Math.hypot(puck.vx, puck.vy); if (sp > 1100) { puck.vx *= 1100 / sp; puck.vy *= 1100 / sp; } g.sfx('hit'); } }
        draw();
      });
      function goal(p) { score[p]++; g.points(score[1], score[2]); g.sfx('score'); if (score[p] >= TARGET) { draw(); return g.win(p, `${score[1]} – ${score[2]}`); } g.status(`⚽ Goal for ${esc(g.name(p))}!`); pause = 1; serve(3 - p); M[1].y = H - 100; M[2].y = 100; }
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#f1f3f5');
        ctx.strokeStyle = '#ced4da'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, H / 2, 70, 0, Math.PI * 2); ctx.stroke();
        UI.rect(ctx, W / 2 - GOAL / 2, 0, GOAL, 8, g.color(1)); UI.rect(ctx, W / 2 - GOAL / 2, H - 8, GOAL, 8, g.color(2));
        ctx.beginPath(); ctx.arc(W / 2, 0, 90, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, H, 90, Math.PI, 0); ctx.stroke();
        UI.text(ctx, score[2], 40, H / 2 - 40, { color: '#4dabf766', font: 'bold 48px system-ui' }); UI.text(ctx, score[1], 40, H / 2 + 40, { color: '#ff6b6b66', font: 'bold 48px system-ui' });
        for (const p of [1, 2]) { const m = M[p]; UI.circle(ctx, m.x, m.y + 3, MR, '#0003'); UI.circle(ctx, m.x, m.y, MR, g.color(p)); UI.circle(ctx, m.x, m.y, MR * 0.5, '#fff8'); }
        UI.circle(ctx, puck.x, puck.y + 2, PR, '#0004'); UI.circle(ctx, puck.x, puck.y, PR, '#212529');
      }
    },
  });
})();
