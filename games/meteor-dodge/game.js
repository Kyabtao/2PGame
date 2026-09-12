/* Meteor Dodge — survive falling meteors; last one standing wins the round (best of 5). */
(function () {
  const W = 800, H = 520, TARGET = 3;
  Game.init({
    id: 'meteor-dodge',
    rules: ['Meteors fall faster and faster. Move left/right (and jump) to dodge them.', 'Get hit and you are out for the round; the survivor takes the point. If both get hit at once, no point.', `First to ${TARGET} round wins takes the match.`],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> move · <kbd>W</kbd> jump', p2: '<kbd>←</kbd>/<kbd>→</kbd> move · <kbd>↑</kbd> jump' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; const G = 1500, GROUND = H - 40; let pl, mets, t, spawn, pause = 0, shake = 0;
      const reset = () => { pl = { 1: { x: W * .3, y: GROUND, vy: 0, alive: true }, 2: { x: W * .7, y: GROUND, vy: 0, alive: true } }; mets = []; t = 0; spawn = 0; };
      reset();
      const ctl = { 1: { l: 'KeyA', r: 'KeyD', j: 'KeyW' }, 2: { l: 'ArrowLeft', r: 'ArrowRight', j: 'ArrowUp' } };
      g.key(['KeyW', 'ArrowUp'], (code) => { const p = pl[code === 'KeyW' ? 1 : 2]; if (p.alive && p.y >= GROUND - 1 && pause <= 0) { p.vy = -620; g.sfx('pop'); } });
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; if (pause <= 0) reset(); draw(); return; }
        t += dt; spawn -= dt;
        if (spawn <= 0) { spawn = Math.max(0.12, 0.7 - t * 0.02); const r = rndf(12, 30); mets.push({ x: rndf(r, W - r), y: -r, r, vy: rndf(180, 260) + t * 12, vx: rndf(-60, 60) }); }
        for (const p of [1, 2]) { const s = pl[p], c = ctl[p]; if (!s.alive) continue; if (g.down(c.l)) s.x -= 320 * dt; if (g.down(c.r)) s.x += 320 * dt; s.x = clamp(s.x, 16, W - 16); s.vy += G * dt; s.y += s.vy * dt; if (s.y > GROUND) { s.y = GROUND; s.vy = 0; } }
        for (const m of mets) { m.y += m.vy * dt; m.x += m.vx * dt; for (const p of [1, 2]) { const s = pl[p]; if (s.alive && dist(m.x, m.y, s.x, s.y - 18) < m.r + 16) { s.alive = false; g.sfx('explode'); shake = 0.3; } } }
        mets = mets.filter((m) => m.y < H + 40);
        if (!pl[1].alive || !pl[2].alive) {
          if (pl[1].alive || pl[2].alive) { const wnr = pl[1].alive ? 1 : 2; score[wnr]++; g.points(score[1], score[2]); if (score[wnr] >= TARGET) { draw(); return g.win(wnr, `${score[1]} – ${score[2]} rounds · survived ${t.toFixed(1)}s in the last one.`); } g.status(`${esc(g.name(wnr))} survives the round!`); } else g.status('Both hit — no point.');
          pause = 1.5;
        }
        draw();
      });
      function draw() {
        ctx.save(); if (shake > 0) { shake -= 0.016; ctx.translate(rndf(-6, 6) * shake, rndf(-6, 6) * shake); }
        UI.rect(ctx, -10, -10, W + 20, H + 20, '#0b0d18'); UI.rect(ctx, -10, GROUND + 2, W + 20, 60, '#2d3757');
        mets.forEach((m) => { UI.circle(ctx, m.x, m.y - m.r * 1.4, m.r * .8, '#ffa94d55'); UI.circle(ctx, m.x, m.y, m.r, '#8d6e63'); UI.circle(ctx, m.x - m.r * .3, m.y - m.r * .3, m.r * .3, '#a1887f'); });
        for (const p of [1, 2]) { const s = pl[p]; if (!s.alive) { UI.text(ctx, '💥', s.x, s.y - 20, { font: '30px system-ui' }); continue; } UI.roundRect(ctx, s.x - 14, s.y - 36, 28, 36, 8, g.color(p)); UI.circle(ctx, s.x - 5, s.y - 26, 3, '#fff'); UI.circle(ctx, s.x + 5, s.y - 26, 3, '#fff'); }
        UI.text(ctx, t.toFixed(1) + 's', W / 2, 20, { color: '#9aa4c7', font: 'bold 16px monospace' });
        ctx.restore();
      }
    },
  });
})();
