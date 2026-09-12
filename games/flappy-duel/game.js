/* Flappy Duel — two birds, same pipes; survive longer (or both crash = draw). */
(function () {
  const W = 800, H = 500;
  Game.init({
    id: 'flappy-duel',
    rules: ['Tap to flap. Both birds fly through the same gaps.', 'Hit a pipe, the floor or the ceiling and you are out. The bird that survives longer wins; pipes passed are shown as points.', 'If both crash on the same frame, it is a draw.'],
    controls: { p1: '<kbd>W</kbd> or <kbd>Space</kbd>', p2: '<kbd>↑</kbd> or <kbd>Enter</kbd>' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyW', label: 'FLAP', huge: true }] }, { side: 2, buttons: [{ code: 'ArrowUp', label: 'FLAP', huge: true }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const birds = { 1: { y: H / 2 - 40, vy: 0, alive: true, score: 0, x: 180 }, 2: { y: H / 2 + 40, vy: 0, alive: true, score: 0, x: 220 } };
      let pipes = [], t = 0, next = 0, speed = 170;
      const flap = (p) => { const b = birds[p]; if (b.alive) { b.vy = -330; g.sfx('pop'); } };
      g.key(['KeyW', 'Space'], () => flap(1)); g.key(['ArrowUp', 'Enter'], () => flap(2));
      UI.pointer(canvas, { down: (pt) => flap(pt.x < W / 2 ? 1 : 2) }, W, H);
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt; next -= dt; speed = 170 + t * 4;
        if (next <= 0) { next = 1.6; const gap = Math.max(130, 180 - t * 1.5); pipes.push({ x: W + 40, top: rndf(60, H - 60 - gap), gap, passed: { 1: false, 2: false } }); }
        pipes.forEach((pp) => { pp.x -= speed * dt; }); pipes = pipes.filter((pp) => pp.x > -80);
        const crash = { 1: false, 2: false };
        for (const p of [1, 2]) { const b = birds[p]; if (!b.alive) continue; b.vy += 1000 * dt; b.y += b.vy * dt; if (b.y < 12 || b.y > H - 12) crash[p] = true; for (const pp of pipes) { if (b.x + 12 > pp.x && b.x - 12 < pp.x + 60 && (b.y - 12 < pp.top || b.y + 12 > pp.top + pp.gap)) crash[p] = true; if (!pp.passed[p] && pp.x + 60 < b.x) { pp.passed[p] = true; b.score++; g.sfx('coin'); } } }
        g.points(birds[1].score, birds[2].score);
        if (crash[1] || crash[2]) { g.sfx('explode'); birds[1].alive = !crash[1]; birds[2].alive = !crash[2]; draw(); if (crash[1] && crash[2]) return g.draw(`Both crashed at ${birds[1].score} pipes.`); return g.win(crash[1] ? 2 : 1, `${esc(g.name(crash[1] ? 1 : 2))} crashed after ${birds[crash[1] ? 1 : 2].score} pipes.`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#70c5ce');
        for (let i = 0; i < 6; i++) UI.circle(ctx, ((i * 160 + t * 20) % (W + 100)) - 50, 60 + (i % 3) * 40, 24, '#ffffffaa');
        pipes.forEach((pp) => { UI.rect(ctx, pp.x, 0, 60, pp.top, '#5cb85c'); UI.rect(ctx, pp.x - 4, pp.top - 20, 68, 20, '#4a9d4a'); UI.rect(ctx, pp.x, pp.top + pp.gap, 60, H, '#5cb85c'); UI.rect(ctx, pp.x - 4, pp.top + pp.gap, 68, 20, '#4a9d4a'); });
        UI.rect(ctx, 0, H - 14, W, 14, '#ded895');
        for (const p of [1, 2]) { const b = birds[p]; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(clamp(b.vy / 600, -0.5, 0.8)); UI.circle(ctx, 0, 0, 13, b.alive ? g.color(p) : '#777'); UI.circle(ctx, 5, -4, 4, '#fff'); UI.circle(ctx, 6, -4, 2, '#000'); ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(20, 5); ctx.lineTo(10, 8); ctx.fillStyle = '#ffa94d'; ctx.fill(); ctx.restore(); }
      }
    },
  });
})();
