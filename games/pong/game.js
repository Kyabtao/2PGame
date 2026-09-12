/* Pong — first to 7. */
(function () {
  const W = 800, H = 500, PW = 12, PH = 90, TARGET = 7;
  Game.init({
    id: 'pong',
    rules: ['Move your paddle to return the ball. Hitting with the paddle edge angles the shot; the ball speeds up with each hit.', `First to ${TARGET} points wins the round.`],
    controls: { p1: '<kbd>W</kbd> / <kbd>S</kbd>', p2: '<kbd>↑</kbd> / <kbd>↓</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const p = { 1: { y: H / 2 - PH / 2, s: 0 }, 2: { y: H / 2 - PH / 2, s: 0 } };
      const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 8 };
      let serving = 0, server = 1 + rnd(2), trail = [];
      const score = { 1: 0, 2: 0 };
      // touch drag on canvas halves
      UI.pointer(canvas, { down: drag, move: (pt) => { if (pt.held) drag(pt); } }, W, H);
      function drag(pt) { const who = pt.x < W / 2 ? 1 : 2; p[who].y = clamp(pt.y - PH / 2, 0, H - PH); }
      const serve = () => { ball.x = W / 2; ball.y = H / 2; const a = rndf(-0.6, 0.6); const sp = 380; ball.vx = (server === 1 ? 1 : -1) * sp * Math.cos(a); ball.vy = sp * Math.sin(a); trail = []; };
      draw();
      await g.countdown(3);
      serve();
      g.loop((dt) => {
        const sp = 460;
        if (g.down('KeyW')) p[1].y -= sp * dt; if (g.down('KeyS')) p[1].y += sp * dt;
        if (g.down('ArrowUp')) p[2].y -= sp * dt; if (g.down('ArrowDown')) p[2].y += sp * dt;
        p[1].y = clamp(p[1].y, 0, H - PH); p[2].y = clamp(p[2].y, 0, H - PH);
        if (serving > 0) { serving -= dt; if (serving <= 0) serve(); draw(); return; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        trail.push([ball.x, ball.y]); if (trail.length > 10) trail.shift();
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); g.sfx('bounce'); }
        if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy); g.sfx('bounce'); }
        const hit = (who, px) => { const py = p[who].y; if (ball.y + ball.r >= py && ball.y - ball.r <= py + PH) { const rel = (ball.y - (py + PH / 2)) / (PH / 2); const speed = Math.min(900, Math.hypot(ball.vx, ball.vy) * 1.06 + 10); const ang = rel * 1.0; ball.vx = (who === 1 ? 1 : -1) * speed * Math.cos(ang); ball.vy = speed * Math.sin(ang); ball.x = who === 1 ? px + PW + ball.r : px - ball.r; g.sfx('hit'); } };
        if (ball.vx < 0 && ball.x - ball.r <= 30 + PW && ball.x - ball.r > 30 - 20) hit(1, 30);
        if (ball.vx > 0 && ball.x + ball.r >= W - 30 - PW && ball.x + ball.r < W - 30 + 20) hit(2, W - 30 - PW);
        if (ball.x < -20 || ball.x > W + 20) { const scorer = ball.x < 0 ? 2 : 1; score[scorer]++; g.points(score[1], score[2]); g.sfx('score'); server = 3 - scorer; if (score[scorer] >= TARGET) { draw(); return g.win(scorer, `${score[1]} – ${score[2]}`); } serving = 1; ball.x = W / 2; ball.y = H / 2; ball.vx = ball.vy = 0; }
        draw();
      });
      function draw() {
        ctx.clearRect(0, 0, W, H); UI.rect(ctx, 0, 0, W, H, '#0b0d18');
        ctx.setLineDash([10, 14]); ctx.strokeStyle = '#2f3958'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
        UI.text(ctx, score[1], W / 4, 60, { font: 'bold 64px system-ui', color: '#ff6b6b44' }); UI.text(ctx, score[2], 3 * W / 4, 60, { font: 'bold 64px system-ui', color: '#4dabf744' });
        UI.roundRect(ctx, 30, p[1].y, PW, PH, 5, g.color(1)); UI.roundRect(ctx, W - 30 - PW, p[2].y, PW, PH, 5, g.color(2));
        trail.forEach(([x, y], i) => UI.circle(ctx, x, y, ball.r * (i / trail.length), '#ffffff33'));
        UI.circle(ctx, ball.x, ball.y, ball.r, '#fff');
      }
    },
  });
})();
