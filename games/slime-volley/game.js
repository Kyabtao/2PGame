/* Slime Volleyball — first to 7 (win by 2 up to 10). */
(function () {
  const W = 800, H = 420, GROUND = H - 30, NET_H = 90, TARGET = 7;
  Game.init({
    id: 'slime-volley',
    rules: ['Move and jump to bounce the ball over the net. The ball may bounce off the net.', `When the ball touches the ground on your side, the other player scores. First to ${TARGET} (win by 2) takes the round.`, 'The player who conceded serves.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> move · <kbd>W</kbd> jump', p2: '<kbd>←</kbd>/<kbd>→</kbd> move · <kbd>↑</kbd> jump' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; const SR = 44, BR = 12;
      const S = { 1: { x: 200, y: GROUND, vx: 0, vy: 0 }, 2: { x: W - 200, y: GROUND, vx: 0, vy: 0 } };
      const ball = { x: 200, y: 150, vx: 0, vy: 0 }; let pause = 0;
      const serve = (p) => { S[1].x = 200; S[2].x = W - 200; S[1].y = S[2].y = GROUND; S[1].vy = S[2].vy = 0; ball.x = S[p].x; ball.y = 150; ball.vx = 0; ball.vy = 0; };
      serve(1 + rnd(2)); draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; draw(); return; }
        for (const p of [1, 2]) {
          const s = S[p]; const l = g.down(p === 1 ? 'KeyA' : 'ArrowLeft'), r = g.down(p === 1 ? 'KeyD' : 'ArrowRight'), u = g.down(p === 1 ? 'KeyW' : 'ArrowUp');
          s.vx = ((r ? 1 : 0) - (l ? 1 : 0)) * 330; if (u && s.y >= GROUND) { s.vy = -560; }
          s.vy += 1500 * dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y > GROUND) { s.y = GROUND; s.vy = 0; }
          s.x = p === 1 ? clamp(s.x, SR, W / 2 - 6 - SR) : clamp(s.x, W / 2 + 6 + SR, W - SR);
        }
        ball.vy += 700 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); } if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx); } if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); }
        // net
        if (ball.x + BR > W / 2 - 5 && ball.x - BR < W / 2 + 5 && ball.y + BR > GROUND - NET_H) { if (ball.y < GROUND - NET_H + 8 && ball.vy > 0) { ball.vy = -Math.abs(ball.vy) * 0.8; ball.y = GROUND - NET_H - BR; } else { ball.vx = ball.x < W / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx); ball.x = ball.x < W / 2 ? W / 2 - 5 - BR : W / 2 + 5 + BR; } g.sfx('bounce'); }
        for (const p of [1, 2]) { const s = S[p]; const d = dist(s.x, s.y, ball.x, ball.y); if (d < SR + BR && ball.y < s.y) { const nx = (ball.x - s.x) / d, ny = (ball.y - s.y) / d; ball.x = s.x + nx * (SR + BR); ball.y = s.y + ny * (SR + BR); const rel = (ball.vx - s.vx) * nx + (ball.vy - s.vy) * ny; if (rel < 0) { ball.vx -= 2 * rel * nx; ball.vy -= 2 * rel * ny; } ball.vx += s.vx * 0.3; ball.vy += s.vy * 0.3; const sp = Math.hypot(ball.vx, ball.vy); if (sp > 800) { ball.vx *= 800 / sp; ball.vy *= 800 / sp; } g.sfx('hit'); } }
        if (ball.y + BR >= GROUND) { const scorer = ball.x < W / 2 ? 2 : 1; score[scorer]++; g.points(score[1], score[2]); g.sfx('score'); if ((score[scorer] >= TARGET && score[scorer] - score[3 - scorer] >= 2) || score[scorer] >= 10) { draw(); return g.win(scorer, `${score[1]} – ${score[2]}`); } pause = 1; serve(3 - scorer); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1c2a4a'); UI.rect(ctx, 0, GROUND, W, 30, '#c9a56a'); UI.rect(ctx, W / 2 - 5, GROUND - NET_H, 10, NET_H, '#e9ecef');
        for (const p of [1, 2]) { const s = S[p]; ctx.beginPath(); ctx.arc(s.x, s.y, SR, Math.PI, 0); ctx.closePath(); ctx.fillStyle = g.color(p); ctx.fill(); const ex = s.x + (p === 1 ? 18 : -18); UI.circle(ctx, ex, s.y - 22, 7, '#fff'); const dx = ball.x - ex, dy = ball.y - (s.y - 22), dd = Math.hypot(dx, dy) || 1; UI.circle(ctx, ex + dx / dd * 3, s.y - 22 + dy / dd * 3, 3.5, '#000'); }
        UI.circle(ctx, ball.x, ball.y, BR, '#ffd43b');
        UI.text(ctx, score[1], W / 4, 40, { color: '#ff6b6b88', font: 'bold 44px system-ui' }); UI.text(ctx, score[2], 3 * W / 4, 40, { color: '#4dabf788', font: 'bold 44px system-ui' });
      }
    },
  });
})();
