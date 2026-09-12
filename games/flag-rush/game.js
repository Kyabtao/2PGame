/* Flag Rush — capture the flag 1v1 with tagging on the enemy half. */
(function () {
  const W = 800, H = 480, TARGET = 3;
  Game.init({
    id: 'flag-rush',
    rules: ['Your base and flag are on your side. Run to the enemy flag, grab it, and carry it back to your own base to score.', 'On the <b>enemy</b> half you can be tagged: you are sent home and any flag you carry returns. On your own half you are safe and can tag.', `First to ${TARGET} captures wins. Bushes slow whoever runs through them.`],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', p2: 'Arrows' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; const base = { 1: { x: 60, y: H / 2 }, 2: { x: W - 60, y: H / 2 } };
      const flags = { 1: { x: 60, y: H / 2, carrier: 0 }, 2: { x: W - 60, y: H / 2, carrier: 0 } };
      const pl = { 1: { x: 120, y: H / 2, stun: 0 }, 2: { x: W - 120, y: H / 2, stun: 0 } };
      const bushes = range(10).map(() => ({ x: rndf(200, W - 200), y: rndf(40, H - 40), r: rndf(25, 45) }));
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      const onOwnHalf = (p) => p === 1 ? pl[p].x < W / 2 : pl[p].x > W / 2;
      const home = (p) => { pl[p].x = p === 1 ? 120 : W - 120; pl[p].y = H / 2; pl[p].stun = 1; if (flags[3 - p].carrier === p) { flags[3 - p].carrier = 0; flags[3 - p].x = base[3 - p].x; flags[3 - p].y = base[3 - p].y; } };
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        for (const p of [1, 2]) {
          const s = pl[p], c = ctl[p]; s.stun -= dt; if (s.stun > 0) continue;
          const inBush = bushes.some((b) => dist(s.x, s.y, b.x, b.y) < b.r); const sp = (inBush ? 110 : 230) * (flags[3 - p].carrier === p ? 0.85 : 1);
          const dx = (g.down(c.r) ? 1 : 0) - (g.down(c.l) ? 1 : 0), dy = (g.down(c.d) ? 1 : 0) - (g.down(c.u) ? 1 : 0);
          const n = dx && dy ? Math.SQRT1_2 : 1; s.x = clamp(s.x + dx * sp * n * dt, 14, W - 14); s.y = clamp(s.y + dy * sp * n * dt, 14, H - 14);
          const ef = flags[3 - p]; if (ef.carrier === 0 && dist(s.x, s.y, ef.x, ef.y) < 22) { ef.carrier = p; g.sfx('coin'); g.status(`${esc(g.name(p))} has the flag!`); }
          if (ef.carrier === p) { ef.x = s.x; ef.y = s.y - 20; if (dist(s.x, s.y, base[p].x, base[p].y) < 40) { score[p]++; g.points(score[1], score[2]); g.sfx('score'); ef.carrier = 0; ef.x = base[3 - p].x; ef.y = base[3 - p].y; if (score[p] >= TARGET) { draw(); return g.win(p, `${score[1]} – ${score[2]} captures.`); } g.status(`${esc(g.name(p))} scores!`); home(1); home(2); } }
        }
        if (dist(pl[1].x, pl[1].y, pl[2].x, pl[2].y) < 26 && pl[1].stun <= 0 && pl[2].stun <= 0) { const tagger = onOwnHalf(1) ? 1 : onOwnHalf(2) ? 2 : 0; if (tagger) { home(3 - tagger); g.sfx('hit'); g.status(`${esc(g.name(tagger))} tagged ${esc(g.name(3 - tagger))}!`); } }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W / 2, H, '#3a1f22'); UI.rect(ctx, W / 2, 0, W / 2, H, '#1f2a3a');
        UI.rect(ctx, W / 2 - 2, 0, 4, H, '#fff5');
        for (const p of [1, 2]) { ctx.strokeStyle = g.color(p); ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(base[p].x, base[p].y, 40, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
        bushes.forEach((b) => UI.circle(ctx, b.x, b.y, b.r, '#2f6b2f'));
        for (const p of [1, 2]) { const f = flags[p]; UI.rect(ctx, f.x - 1, f.y - 22, 3, 26, '#ddd'); ctx.beginPath(); ctx.moveTo(f.x + 2, f.y - 22); ctx.lineTo(f.x + 18, f.y - 16); ctx.lineTo(f.x + 2, f.y - 10); ctx.closePath(); ctx.fillStyle = g.color(p); ctx.fill(); }
        for (const p of [1, 2]) { const s = pl[p]; ctx.globalAlpha = s.stun > 0 ? 0.4 : 1; UI.circle(ctx, s.x, s.y, 13, g.color(p)); UI.circle(ctx, s.x, s.y, 6, '#fff'); ctx.globalAlpha = 1; }
      }
    },
  });
})();
