/* 110m Hurdles — alternate keys to run, jump key to hurdle; clipping a hurdle stumbles you. */
(function () {
  const W = 800, H = 320, LEN = 110;
  Game.init({
    id: 'hurdles',
    rules: ['Alternate your two run keys to build speed. Press jump just before each of the ten hurdles.', 'Clip a hurdle and you stumble, losing most of your speed. Jumping too early wastes time in the air.', 'First across 110 m wins.'],
    controls: { p1: '<kbd>Q</kbd> ↔ <kbd>W</kbd> run · <kbd>E</kbd> jump', p2: '<kbd>O</kbd> ↔ <kbd>P</kbd> run · <kbd>[</kbd> jump' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyQ', label: 'L', wide: true }, { code: 'KeyW', label: 'R', wide: true }, { code: 'KeyE', label: 'JUMP', wide: true }] }, { side: 2, buttons: [{ code: 'KeyO', label: 'L', wide: true }, { code: 'KeyP', label: 'R', wide: true }, { code: 'BracketLeft', label: 'JUMP', wide: true }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const HURDLES = range(10).map((i) => 13.72 + i * 9.14);
      const R = { 1: { x: 0, v: 0, last: null, y: 0, vy: 0, stumble: 0, done: 0, cleared: 0 }, 2: { x: 0, v: 0, last: null, y: 0, vy: 0, stumble: 0, done: 0, cleared: 0 } };
      let t = 0, started = false;
      const keys = { KeyQ: [1, 'a'], KeyW: [1, 'b'], KeyO: [2, 'a'], KeyP: [2, 'b'] };
      g.key(Object.keys(keys), (code) => { const [p, k] = keys[code]; const r = R[p]; if (!started || r.done || r.stumble > 0 || r.last === k) return; r.last = k; r.v = Math.min(r.v + 1.4, 10.5); });
      g.key(['KeyE', 'BracketLeft'], (code) => { const r = R[code === 'KeyE' ? 1 : 2]; if (!started || r.done || r.y < 0 || r.stumble > 0) return; r.vy = 4.2; g.sfx('pop'); });
      draw();
      await g.countdown(3, 'On your marks…');
      started = true; g.sfx('go');
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) {
          const r = R[p]; if (r.done) continue; r.stumble -= dt;
          r.v *= Math.pow(r.y > 0 ? 0.9 : 0.25, dt); r.x += r.v * dt;
          if (r.y > 0 || r.vy > 0) { r.vy -= 14 * dt; r.y += r.vy * dt; if (r.y <= 0) { r.y = 0; r.vy = 0; } }
          for (const hx of HURDLES) { if (!r['h' + hx] && r.x >= hx) { r['h' + hx] = true; if (r.y > 0.55) { r.cleared++; g.sfx('tick'); } else { r.stumble = 0.9; r.v *= 0.2; g.sfx('bad'); } } }
          if (r.x >= LEN) { r.done = t; g.sfx('score'); }
        }
        g.points(R[1].x | 0, R[2].x | 0);
        if (R[1].done || R[2].done) { const w = R[1].done && (!R[2].done || R[1].done <= R[2].done) ? 1 : 2; const pb = g.best('time', R[w].done, w, true); draw(); return g.win(w, `${R[w].done.toFixed(2)}s, ${R[w].cleared}/10 hurdles clean${pb ? ' — new record!' : ''}.`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#b5451b'); UI.rect(ctx, 0, H / 2 - 1, W, 2, '#fff');
        for (const p of [1, 2]) {
          const r = R[p]; const y0 = p === 1 ? H / 4 + 30 : 3 * H / 4 + 20; const cam = r.x - 15; const sx = (m) => (m - cam) * 7;
          for (let m = 0; m <= LEN; m += 10) { const x = sx(m); if (x > -20 && x < W + 20) { UI.rect(ctx, x, y0 - 70, 1, 80, '#ffffff44'); } }
          HURDLES.forEach((hx) => { const x = sx(hx); if (x < -20 || x > W + 20) return; UI.rect(ctx, x - 2, y0 - 30, 4, 30, '#eee'); UI.rect(ctx, x - 10, y0 - 32, 20, 6, r['h' + hx] && r.stumble > 0 && Math.abs(r.x - hx) < 3 ? '#ff6b6b' : '#fff'); });
          const fx = sx(LEN); if (fx > -20 && fx < W + 20) UI.rect(ctx, fx, y0 - 80, 5, 90, '#fff');
          const x = sx(r.x), y = y0 - r.y * 40; const leg = Math.sin(t * 22 * (r.v / 6)) * 10 * Math.min(1, r.v / 4);
          if (r.stumble > 0) { UI.roundRect(ctx, x - 20, y - 16, 40, 16, 6, g.color(p)); UI.text(ctx, '💫', x, y - 30, { font: '18px system-ui' }); }
          else { UI.roundRect(ctx, x - 10, y - 44, 20, 30, 6, g.color(p)); UI.circle(ctx, x, y - 52, 9, '#ffe0b3'); UI.rect(ctx, x - 7 + leg, y - 14, 5, 14, '#333'); UI.rect(ctx, x + 2 - leg, y - 14, 5, 14, '#333'); }
          UI.text(ctx, `${g.name(p)}  ${r.x.toFixed(0)} m`, 70, y0 - 84, { color: '#fff', font: 'bold 12px system-ui', align: 'left' });
        }
        UI.text(ctx, started ? t.toFixed(2) + 's' : 'READY', W / 2, H - 12, { color: '#fff', font: 'bold 16px monospace' });
      }
    },
  });
})();
