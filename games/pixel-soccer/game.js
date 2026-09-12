/* Pixel Soccer — top-down 1v1 with kick; 90-second match; golden goal if tied. */
(function () {
  const W = 800, H = 480, TIME = 90;
  Game.init({
    id: 'pixel-soccer',
    rules: ['Top-down 1v1 football. Run into the ball to dribble, press kick when close for a powerful shot toward where you are facing.', `${TIME} seconds on the clock. If the match is tied, play continues until a golden goal.`, 'Player 1 attacks the right goal, Player 2 the left.'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · kick <kbd>E</kbd>', p2: 'Arrows · kick <kbd>/</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyE', label: 'Kick' }] }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'Slash', label: 'Kick' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; const GOAL = 120; let t = TIME, pause = 0, golden = false;
      const P = { 1: { x: 200, y: H / 2, fx: 1, fy: 0, vx: 0, vy: 0 }, 2: { x: W - 200, y: H / 2, fx: -1, fy: 0, vx: 0, vy: 0 } };
      const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
      const reset = () => { P[1].x = 200; P[1].y = H / 2; P[2].x = W - 200; P[2].y = H / 2; ball.x = W / 2; ball.y = H / 2; ball.vx = ball.vy = 0; };
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      g.key(['KeyE', 'Slash'], (code) => { const p = code === 'KeyE' ? 1 : 2; const s = P[p]; if (pause > 0) return; if (dist(s.x, s.y, ball.x, ball.y) < 34) { ball.vx = s.fx * 620 + s.vx * 0.3; ball.vy = s.fy * 620 + s.vy * 0.3; g.sfx('hit'); } });
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; if (pause <= 0) reset(); draw(); return; }
        t -= dt;
        for (const p of [1, 2]) {
          const s = P[p], c = ctl[p];
          const dx = (g.down(c.r) ? 1 : 0) - (g.down(c.l) ? 1 : 0), dy = (g.down(c.d) ? 1 : 0) - (g.down(c.u) ? 1 : 0);
          if (dx || dy) { const n = Math.hypot(dx, dy); s.fx = dx / n; s.fy = dy / n; }
          s.vx = dx * 260 * (dx && dy ? Math.SQRT1_2 : 1); s.vy = dy * 260 * (dx && dy ? Math.SQRT1_2 : 1);
          s.x = clamp(s.x + s.vx * dt, 16, W - 16); s.y = clamp(s.y + s.vy * dt, 16, H - 16);
          const d = dist(s.x, s.y, ball.x, ball.y);
          if (d < 24) { const nx = (ball.x - s.x) / (d || 1), ny = (ball.y - s.y) / (d || 1); ball.x = s.x + nx * 24; ball.y = s.y + ny * 24; ball.vx = nx * 180 + s.vx * 0.8; ball.vy = ny * 180 + s.vy * 0.8; }
        }
        const a = P[1], b = P[2]; const d = dist(a.x, a.y, b.x, b.y); if (d < 30 && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; a.x -= nx * (30 - d) / 2; a.y -= ny * (30 - d) / 2; b.x += nx * (30 - d) / 2; b.y += ny * (30 - d) / 2; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vx *= Math.pow(0.35, dt); ball.vy *= Math.pow(0.35, dt);
        const inGoalY = ball.y > H / 2 - GOAL / 2 && ball.y < H / 2 + GOAL / 2;
        if (ball.x < 10) { if (inGoalY) return goal(2); ball.x = 10; ball.vx = Math.abs(ball.vx); } if (ball.x > W - 10) { if (inGoalY) return goal(1); ball.x = W - 10; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < 10) { ball.y = 10; ball.vy = Math.abs(ball.vy); } if (ball.y > H - 10) { ball.y = H - 10; ball.vy = -Math.abs(ball.vy); }
        if (t <= 0 && !golden) { if (score[1] !== score[2]) { draw(); return g.win(score[1] > score[2] ? 1 : 2, `Full time ${score[1]} – ${score[2]}.`); } golden = true; g.status('⚡ Golden goal!'); g.sfx('go'); }
        draw();
      });
      function goal(p) { score[p]++; g.points(score[1], score[2]); g.sfx('score'); if (golden) { draw(); return g.win(p, `Golden goal! ${score[1]} – ${score[2]}.`); } g.status(`⚽ GOAL ${esc(g.name(p))}!`); pause = 1.5; }
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#2e8b3a'); for (let i = 0; i < 8; i++) if (i % 2) UI.rect(ctx, i * 100, 0, 100, H, '#2a7f35');
        ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, W - 20, H - 20); ctx.beginPath(); ctx.moveTo(W / 2, 10); ctx.lineTo(W / 2, H - 10); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2); ctx.stroke(); ctx.strokeRect(10, H / 2 - 100, 90, 200); ctx.strokeRect(W - 100, H / 2 - 100, 90, 200);
        UI.rect(ctx, 0, H / 2 - GOAL / 2, 10, GOAL, g.color(2)); UI.rect(ctx, W - 10, H / 2 - GOAL / 2, 10, GOAL, g.color(1));
        for (const p of [1, 2]) { const s = P[p]; UI.circle(ctx, s.x, s.y + 3, 15, '#0004'); UI.circle(ctx, s.x, s.y, 15, g.color(p)); UI.circle(ctx, s.x + s.fx * 10, s.y + s.fy * 10, 5, '#fff'); }
        UI.circle(ctx, ball.x, ball.y + 2, 9, '#0004'); UI.circle(ctx, ball.x, ball.y, 9, '#fff'); UI.circle(ctx, ball.x, ball.y, 4, '#222');
        UI.roundRect(ctx, W / 2 - 60, 14, 120, 26, 8, '#0e1020cc'); UI.text(ctx, `${score[1]}  ${golden ? 'GG' : fmtTime(Math.max(0, t) * 1000)}  ${score[2]}`, W / 2, 27, { color: '#fff', font: 'bold 15px monospace' });
      }
    },
  });
})();
