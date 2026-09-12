/* Cave Copters — hold to rise, release to fall, both fly the same cave. */
(function () {
  const W = 800, H = 480;
  Game.init({
    id: 'cave-copters',
    rules: ['Hold your key to climb, release to fall. The cave twists, narrows and has pillars.', 'Touch the cave walls or a pillar and you crash. Whoever flies further wins; both crashing on the same frame is a draw.'],
    controls: { p1: 'Hold <kbd>W</kbd> or <kbd>Space</kbd>', p2: 'Hold <kbd>↑</kbd> or <kbd>Enter</kbd>' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyW', label: 'HOLD', huge: true }] }, { side: 2, buttons: [{ code: 'ArrowUp', label: 'HOLD', huge: true }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const SEG = 20; const segs = []; let mid = H / 2, gapH = 300, x0 = 0, pillars = [], t = 0, distn = 0;
      const gen = () => { while (segs.length < W / SEG + 4) { mid = clamp(mid + rndf(-22, 22), 80 + gapH / 2 - 40, H - 80 - gapH / 2 + 40); segs.push({ top: mid - gapH / 2, bot: mid + gapH / 2 }); if (Math.random() < 0.08 && distn > 300) pillars.push({ x: x0 + segs.length * SEG, y: mid + rndf(-gapH / 3, gapH / 3), h: 60 }); } };
      gen();
      const cop = { 1: { y: H / 2 - 30, vy: 0, alive: true, x: 160 }, 2: { y: H / 2 + 30, vy: 0, alive: true, x: 200 } };
      let touch = { 1: false, 2: false };
      UI.pointer(canvas, { down: (pt) => { touch[pt.x < W / 2 ? 1 : 2] = true; }, up: () => { touch[1] = touch[2] = false; } }, W, H);
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt; const speed = 220 + t * 6; distn += speed * dt; gapH = Math.max(150, 300 - t * 4);
        x0 -= speed * dt; while (x0 <= -SEG) { x0 += SEG; segs.shift(); } gen();
        pillars.forEach((p) => { p.x -= speed * dt; }); pillars = pillars.filter((p) => p.x > -40);
        const crash = { 1: false, 2: false };
        for (const p of [1, 2]) {
          const c = cop[p]; if (!c.alive) continue;
          const up = g.down(p === 1 ? 'KeyW' : 'ArrowUp') || g.down(p === 1 ? 'Space' : 'Enter') || touch[p];
          c.vy += (up ? -900 : 700) * dt; c.vy = clamp(c.vy, -320, 320); c.y += c.vy * dt;
          const si = Math.floor((c.x - x0) / SEG); const s = segs[clamp(si, 0, segs.length - 1)];
          if (c.y - 10 < s.top || c.y + 10 > s.bot) crash[p] = true;
          if (pillars.some((pl) => Math.abs(pl.x - c.x) < 22 && Math.abs(pl.y - c.y) < pl.h / 2 + 8)) crash[p] = true;
        }
        g.points(distn / 10 | 0, distn / 10 | 0);
        if (crash[1] || crash[2]) { g.sfx('explode'); cop[1].alive = !crash[1]; cop[2].alive = !crash[2]; draw(); const m = `${(distn / 10) | 0} m`; if (crash[1] && crash[2]) return g.draw(`Both crashed at ${m}.`); return g.win(crash[1] ? 2 : 1, `${esc(g.name(crash[1] ? 1 : 2))} crashed at ${m}.`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1a1030');
        ctx.fillStyle = '#5a3d7a'; ctx.beginPath(); ctx.moveTo(0, 0); segs.forEach((s, i) => ctx.lineTo(x0 + i * SEG, s.top)); ctx.lineTo(W + 40, 0); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, H); segs.forEach((s, i) => ctx.lineTo(x0 + i * SEG, s.bot)); ctx.lineTo(W + 40, H); ctx.closePath(); ctx.fill();
        pillars.forEach((p) => UI.roundRect(ctx, p.x - 10, p.y - p.h / 2, 20, p.h, 6, '#7a5a9a'));
        for (const p of [1, 2]) { const c = cop[p]; if (!c.alive) { UI.text(ctx, '💥', c.x, c.y, { font: '26px system-ui' }); continue; } UI.roundRect(ctx, c.x - 16, c.y - 8, 32, 16, 8, g.color(p)); UI.rect(ctx, c.x - 22, c.y - 14 + (Math.floor(performance.now() / 60) % 2) * 2, 44, 3, '#eee'); UI.rect(ctx, c.x - 1, c.y - 12, 2, 5, '#eee'); UI.rect(ctx, c.x - 28, c.y - 3, 14, 4, g.color(p)); }
        UI.text(ctx, `${(distn / 10) | 0} m`, W / 2, 20, { color: '#fff', font: 'bold 16px monospace' });
      }
    },
  });
})();
