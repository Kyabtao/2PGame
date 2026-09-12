/* Ski Slalom — split-screen downhill, same gates; missed gate = time penalty; trees crash you. */
(function () {
  const PW = 380, PH = 520, GAP = 40, W = PW * 2 + GAP, H = PH, LEN = 6000, GATES = 20;
  Game.init({
    id: 'ski-slalom',
    rules: ['Race down the same slalom course. Steer left and right; you can\'t slow down much.', 'Pass between each pair of flags. Missing a gate adds a 2-second penalty; hitting a tree stops you for a moment.', 'Lowest total time (run + penalties) wins.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd>', p2: '<kbd>←</kbd>/<kbd>→</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const gates = range(GATES).map((i) => ({ y: 400 + i * (LEN - 800) / GATES, x: rndf(90, PW - 90), w: 90, passed: {}, judged: {} }));
      const trees = range(60).map(() => ({ x: rndf(20, PW - 20), y: rndf(300, LEN - 200) })).filter((tr) => !gates.some((gt) => Math.abs(gt.y - tr.y) < 60 && Math.abs(gt.x - tr.x) < 90));
      const S = { 1: { x: PW / 2, y: 0, vx: 0, stun: 0, pen: 0, done: 0 }, 2: { x: PW / 2, y: 0, vx: 0, stun: 0, pen: 0, done: 0 } };
      let t = 0;
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) {
          const s = S[p]; if (s.done) continue; s.stun -= dt;
          const l = g.down(p === 1 ? 'KeyA' : 'ArrowLeft'), r = g.down(p === 1 ? 'KeyD' : 'ArrowRight');
          s.vx += ((r ? 1 : 0) - (l ? 1 : 0)) * 900 * dt; s.vx *= Math.pow(0.05, dt); s.x = clamp(s.x + s.vx * dt, 12, PW - 12);
          const speed = s.stun > 0 ? 60 : 420 - Math.abs(s.vx) * 0.3; s.y += speed * dt;
          for (const gt of gates) { if (!gt.judged[p] && s.y > gt.y) { gt.judged[p] = true; if (Math.abs(s.x - gt.x) < gt.w / 2) { gt.passed[p] = true; g.sfx('tick'); } else { s.pen += 2; g.sfx('bad'); } } }
          if (s.stun <= 0) for (const tr of trees) if (Math.abs(tr.x - s.x) < 14 && Math.abs(tr.y - s.y) < 16) { s.stun = 0.8; g.sfx('explode'); break; }
          if (s.y >= LEN) { s.done = t + s.pen; g.sfx('score'); }
        }
        g.points(Math.round(S[1].y / LEN * 100), Math.round(S[2].y / LEN * 100));
        if (S[1].done && S[2].done) { draw(); if (Math.abs(S[1].done - S[2].done) < 0.005) return g.draw('Identical times!'); const w = S[1].done < S[2].done ? 1 : 2; return g.win(w, `${S[w].done.toFixed(2)}s vs ${S[3 - w].done.toFixed(2)}s (incl. penalties ${S[1].pen}s / ${S[2].pen}s).`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0e1020');
        for (const p of [1, 2]) {
          const s = S[p]; ctx.save(); ctx.translate(p === 2 ? PW + GAP : 0, 0); ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.clip(); UI.rect(ctx, 0, 0, PW, PH, '#eef3f8');
          const cam = s.y - 120;
          for (let i = 0; i < 40; i++) UI.circle(ctx, (i * 73) % PW, ((i * 131) - cam * 1) % PH + (((i * 131) - cam) % PH < 0 ? PH : 0), 1.5, '#d5dde8');
          gates.forEach((gt) => { const y = gt.y - cam; if (y < -20 || y > PH + 20) return; const col = gt.judged[p] ? (gt.passed[p] ? '#51cf66' : '#ff6b6b') : (gates.indexOf(gt) % 2 ? '#4dabf7' : '#ff922b'); UI.rect(ctx, gt.x - gt.w / 2 - 3, y - 14, 6, 20, col); UI.rect(ctx, gt.x + gt.w / 2 - 3, y - 14, 6, 20, col); ctx.setLineDash([4, 6]); ctx.strokeStyle = col + '66'; ctx.beginPath(); ctx.moveTo(gt.x - gt.w / 2, y); ctx.lineTo(gt.x + gt.w / 2, y); ctx.stroke(); ctx.setLineDash([]); });
          trees.forEach((tr) => { const y = tr.y - cam; if (y < -30 || y > PH + 30) return; ctx.beginPath(); ctx.moveTo(tr.x, y - 22); ctx.lineTo(tr.x + 14, y + 8); ctx.lineTo(tr.x - 14, y + 8); ctx.closePath(); ctx.fillStyle = '#2f7a38'; ctx.fill(); UI.rect(ctx, tr.x - 3, y + 8, 6, 8, '#6b4a2a'); });
          const fy = LEN - cam; if (fy < PH + 20) { for (let i = 0; i < PW / 16; i++) UI.rect(ctx, i * 16, fy, 16, 10, i % 2 ? '#111' : '#fff'); }
          const y = s.y - cam; ctx.save(); ctx.translate(s.x, y); ctx.rotate(s.vx / 900); UI.rect(ctx, -9, -4, 4, 26, '#333'); UI.rect(ctx, 5, -4, 4, 26, '#333'); UI.roundRect(ctx, -8, -14, 16, 20, 5, s.stun > 0 ? '#888' : g.color(p)); UI.circle(ctx, 0, -18, 6, '#ffe0b3'); ctx.restore();
          UI.text(ctx, `${g.name(p)}  +${s.pen}s`, PW / 2, 14, { color: g.color(p), font: 'bold 13px system-ui' }); if (s.done) UI.text(ctx, `${s.done.toFixed(2)}s`, PW / 2, PH / 2, { color: '#1c2238', font: 'bold 28px monospace' });
          ctx.restore();
        }
        UI.text(ctx, t.toFixed(1), W / 2, 14, { color: '#fff', font: 'bold 13px monospace' });
      }
    },
  });
})();
