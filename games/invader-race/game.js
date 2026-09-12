/* Invader Race — split-screen shoot-em-up; each clears identical waves; invaders that reach the bottom cost a life. */
(function () {
  const PW = 380, PH = 500, GAP = 40, W = PW * 2 + GAP, H = PH;
  Game.init({
    id: 'invader-race',
    rules: ['Each player defends their own lane against the same formation of invaders.', 'Shoot all 30 invaders first to win. Invaders drop bombs and descend — if one reaches the bottom or a bomb hits you, you lose a life (3 lives).', 'Lose all lives and your rival wins.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> move · <kbd>W</kbd> fire', p2: '<kbd>←</kbd>/<kbd>→</kbd> move · <kbd>↑</kbd> fire' },
    points: true,
    pad: [{ side: 1, dpad: { left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyW', label: 'Fire' }] }, { side: 2, dpad: { left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'ArrowUp', label: 'Fire' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const seed = range(30).map(() => Math.random());
      const mk = (p) => ({ p, x: PW / 2, cd: 0, shots: [], bombs: [], inv: range(30).map((i) => ({ x: 40 + (i % 10) * 34, y: 50 + Math.floor(i / 10) * 32, alive: true })), dir: 1, lives: 3, killed: 0, flash: 0 });
      const S = { 1: mk(1), 2: mk(2) };
      const ctl = { 1: { l: 'KeyA', r: 'KeyD', f: 'KeyW' }, 2: { l: 'ArrowLeft', r: 'ArrowRight', f: 'ArrowUp' } };
      g.key(['KeyW', 'ArrowUp'], (code) => fire(code === 'KeyW' ? 1 : 2));
      function fire(p) { const s = S[p]; if (s.cd > 0 || s.shots.length >= 3 || g.over) return; s.cd = 0.25; s.shots.push({ x: s.x, y: PH - 40 }); g.sfx('hit'); }
      let t = 0;
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) {
          const s = S[p], c = ctl[p]; s.cd -= dt; s.flash -= dt;
          if (g.down(c.l)) s.x -= 300 * dt; if (g.down(c.r)) s.x += 300 * dt; s.x = clamp(s.x, 16, PW - 16);
          const alive = s.inv.filter((i) => i.alive); const speed = 30 + (30 - alive.length) * 4 + t;
          let edge = false; alive.forEach((i) => { i.x += s.dir * speed * dt; if (i.x < 16 || i.x > PW - 16) edge = true; });
          if (edge) { s.dir = -s.dir; alive.forEach((i) => { i.y += 14; i.x = clamp(i.x, 16, PW - 16); }); }
          if (alive.some((i) => i.y > PH - 60)) { s.lives--; g.sfx('bad'); alive.forEach((i) => { i.y -= 120; }); if (s.lives <= 0) { draw(); return g.win(3 - p, `${esc(g.name(p))} was overrun. Kills: ${S[1].killed} – ${S[2].killed}.`); } }
          if (Math.random() < dt * (0.6 + t / 60) && alive.length) { const i = pick(alive); s.bombs.push({ x: i.x, y: i.y + 10 }); }
          s.shots.forEach((sh) => { sh.y -= 520 * dt; for (const i of alive) if (i.alive && Math.abs(sh.x - i.x) < 15 && Math.abs(sh.y - i.y) < 12) { i.alive = false; sh.y = -100; s.killed++; g.sfx('pop'); g.points(S[1].killed, S[2].killed); break; } });
          s.shots = s.shots.filter((sh) => sh.y > -20);
          s.bombs.forEach((b) => { b.y += 220 * dt; if (Math.abs(b.x - s.x) < 16 && b.y > PH - 40 && b.y < PH - 12) { b.y = PH + 100; s.lives--; s.flash = 0.3; g.sfx('explode'); } });
          s.bombs = s.bombs.filter((b) => b.y < PH + 10);
          if (s.lives <= 0) { draw(); return g.win(3 - p, `${esc(g.name(p))}'s ship was destroyed. Kills: ${S[1].killed} – ${S[2].killed}.`); }
          if (s.killed === 30) { draw(); return g.win(p, `Cleared the wave in ${t.toFixed(1)}s.`); }
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0e1020');
        for (const p of [1, 2]) {
          const s = S[p]; ctx.save(); ctx.translate(p === 2 ? PW + GAP : 0, 0); UI.rect(ctx, 0, 0, PW, PH, s.flash > 0 ? '#3a1020' : '#05060f');
          s.inv.forEach((i, k) => { if (!i.alive) return; const row = Math.floor(k / 10); UI.text(ctx, ['👾', '👽', '🛸'][row], i.x, i.y, { font: '22px system-ui' }); });
          s.shots.forEach((sh) => UI.rect(ctx, sh.x - 2, sh.y - 8, 4, 12, '#ffd43b')); s.bombs.forEach((b) => UI.circle(ctx, b.x, b.y, 4, '#ff6b6b'));
          ctx.beginPath(); ctx.moveTo(s.x, PH - 44); ctx.lineTo(s.x + 16, PH - 14); ctx.lineTo(s.x - 16, PH - 14); ctx.closePath(); ctx.fillStyle = g.color(p); ctx.fill();
          UI.text(ctx, '♥'.repeat(Math.max(0, s.lives)), 30, 16, { color: g.color(p), font: 'bold 14px system-ui' }); UI.text(ctx, `${s.killed}/30`, PW - 30, 16, { color: '#9aa4c7', font: 'bold 13px monospace' });
          ctx.restore();
        }
      }
    },
  });
})();
