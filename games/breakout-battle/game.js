/* Breakout Battle — split screen, each clears their own wall; miss = lose a life. */
(function () {
  const PW = 380, PH = 500, GAP = 40, W = PW * 2 + GAP, H = PH;
  Game.init({
    id: 'breakout-battle',
    rules: ['Each side has its own paddle, ball and brick wall. Clear your wall first to win.', 'If your ball falls past the paddle you lose one of 3 lives. Lose all lives and the other player wins.', 'Balls speed up slowly. Hit with the paddle edge to angle the shot.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd>', p2: '<kbd>←</kbd>/<kbd>→</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const mk = (p) => { const bricks = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) bricks.push({ x: 10 + c * 45, y: 40 + r * 22, w: 41, h: 18, hp: r < 2 ? 2 : 1, alive: true }); return { p, px: PW / 2 - 40, ball: { x: PW / 2, y: PH - 60, vx: 160 * (Math.random() < .5 ? 1 : -1), vy: -220 }, bricks, lives: 3, cleared: 0, stuck: true }; };
      const S = { 1: mk(1), 2: mk(2) }; const total = S[1].bricks.length;
      const ctl = { 1: { l: 'KeyA', r: 'KeyD' }, 2: { l: 'ArrowLeft', r: 'ArrowRight' } };
      UI.pointer(canvas, { down: dragp, move: (pt) => { if (pt.held) dragp(pt); } }, W, H);
      function dragp(pt) { const p = pt.x < PW + GAP / 2 ? 1 : 2; const lx = pt.x - (p === 2 ? PW + GAP : 0); S[p].px = clamp(lx - 40, 0, PW - 80); S[p].stuck = false; }
      draw();
      await g.countdown(3);
      let t = 0;
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) {
          const s = S[p], c = ctl[p];
          if (g.down(c.l)) { s.px -= 420 * dt; s.stuck = false; } if (g.down(c.r)) { s.px += 420 * dt; s.stuck = false; }
          s.px = clamp(s.px, 0, PW - 80);
          const b = s.ball;
          if (s.stuck) { b.x = s.px + 40; b.y = PH - 40; if (t > 1) s.stuck = false; continue; }
          const sp = 1 + t / 120; b.x += b.vx * sp * dt; b.y += b.vy * sp * dt;
          if (b.x < 7) { b.x = 7; b.vx = Math.abs(b.vx); g.sfx('bounce'); } if (b.x > PW - 7) { b.x = PW - 7; b.vx = -Math.abs(b.vx); g.sfx('bounce'); } if (b.y < 7) { b.y = 7; b.vy = Math.abs(b.vy); g.sfx('bounce'); }
          if (b.vy > 0 && b.y + 7 >= PH - 24 && b.y + 7 <= PH - 8 && b.x >= s.px - 6 && b.x <= s.px + 86) { const rel = (b.x - (s.px + 40)) / 40; const spd = Math.hypot(b.vx, b.vy); const ang = rel * 1.1; b.vx = Math.sin(ang) * spd; b.vy = -Math.abs(Math.cos(ang) * spd); b.y = PH - 31; g.sfx('hit'); }
          if (b.y > PH + 10) { s.lives--; g.sfx('bad'); if (s.lives <= 0) { draw(); return g.win(3 - p, `${esc(g.name(p))} ran out of lives. Bricks: ${S[1].cleared} – ${S[2].cleared}.`); } b.x = s.px + 40; b.y = PH - 40; b.vx = 160 * (Math.random() < .5 ? 1 : -1); b.vy = -220; s.stuck = true; t = Math.max(t, 0); }
          for (const br of s.bricks) { if (!br.alive) continue; if (b.x + 7 > br.x && b.x - 7 < br.x + br.w && b.y + 7 > br.y && b.y - 7 < br.y + br.h) { br.hp--; if (br.hp <= 0) { br.alive = false; s.cleared++; g.points(S[1].cleared, S[2].cleared); } g.sfx('pop'); const ox = Math.min(b.x + 7 - br.x, br.x + br.w - (b.x - 7)), oy = Math.min(b.y + 7 - br.y, br.y + br.h - (b.y - 7)); if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy; break; } }
          if (s.cleared === total) { draw(); return g.win(p, `Cleared the wall first (${S[1].cleared} – ${S[2].cleared}).`); }
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0e1020');
        for (const p of [1, 2]) {
          const s = S[p]; ctx.save(); ctx.translate(p === 2 ? PW + GAP : 0, 0); UI.rect(ctx, 0, 0, PW, PH, '#0b0d18');
          s.bricks.forEach((br) => { if (br.alive) UI.roundRect(ctx, br.x, br.y, br.w, br.h, 3, br.hp > 1 ? '#adb5bd' : g.color(p)); });
          UI.roundRect(ctx, s.px, PH - 24, 80, 12, 6, '#fff'); UI.circle(ctx, s.ball.x, s.ball.y, 7, g.color(p));
          UI.text(ctx, '♥'.repeat(Math.max(0, s.lives)), 30, 16, { color: g.color(p), font: 'bold 14px system-ui' }); UI.text(ctx, g.name(p), PW / 2, 16, { color: '#9aa4c7', font: '13px system-ui' });
          ctx.restore();
        }
      }
    },
  });
})();
