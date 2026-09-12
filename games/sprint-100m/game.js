/* 100m Sprint — alternate two keys; false start penalty. */
(function () {
  const W = 800, H = 300, LEN = 100;
  Game.init({
    id: 'sprint-100m',
    rules: ['Wait for the gun, then alternate your two keys as fast as you can. Pressing the same key twice does nothing.', 'A false start (pressing before the gun) costs you a 1-second freeze.', 'First to cross 100 m wins; your time is recorded as a personal best.'],
    controls: { p1: '<kbd>Q</kbd> ↔ <kbd>W</kbd>', p2: '<kbd>O</kbd> ↔ <kbd>P</kbd>' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyQ', label: 'L', huge: true }, { code: 'KeyW', label: 'R', huge: true }] }, { side: 2, buttons: [{ code: 'KeyO', label: 'L', huge: true }, { code: 'KeyP', label: 'R', huge: true }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const R = { 1: { x: 0, last: null, v: 0, frozen: 0, done: 0 }, 2: { x: 0, last: null, v: 0, frozen: 0, done: 0 } };
      let started = false, t = 0;
      const best = g.getBest('time');
      const keys = { KeyQ: [1, 'a'], KeyW: [1, 'b'], KeyO: [2, 'a'], KeyP: [2, 'b'] };
      g.key(Object.keys(keys), (code) => { const [p, k] = keys[code]; const r = R[p]; if (g.over || r.done) return; if (!started) { r.frozen = 1; g.sfx('bad'); g.status(`False start by ${esc(g.name(p))}!`); return; } if (r.frozen > 0 || r.last === k) return; r.last = k; r.v = Math.min(r.v + 1.6, 12); });
      draw();
      await g.countdown(3, 'On your marks…');
      started = true; g.sfx('go'); g.status('GO!');
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) { const r = R[p]; if (r.done) continue; r.frozen -= dt; if (r.frozen > 0) continue; r.x += r.v * dt; r.v *= Math.pow(0.15, dt); if (r.x >= LEN) { r.x = LEN; r.done = t; g.sfx('score'); } }
        g.points(R[1].x | 0, R[2].x | 0);
        const d1 = R[1].done, d2 = R[2].done;
        if (d1 || d2) { const w = d1 && (!d2 || d1 <= d2) ? 1 : 2; const tm = R[w].done; const pb = g.best('time', tm, w, true); draw(); return g.win(w, `${tm.toFixed(2)}s${pb ? ' — new best time!' : best ? ` (best ${best.v.toFixed(2)}s)` : ''}`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#b5451b');
        for (let i = 0; i <= 10; i++) { const x = 60 + i * 68; UI.rect(ctx, x, 40, 2, H - 80, '#ffffff88'); UI.text(ctx, i * 10 + 'm', x, 26, { color: '#fff', font: '11px system-ui' }); }
        UI.rect(ctx, 0, H / 2 - 1, W, 2, '#fff'); UI.rect(ctx, 60 + 680, 40, 6, H - 80, '#fff');
        for (const p of [1, 2]) { const r = R[p]; const x = 60 + r.x * 6.8, y = p === 1 ? H / 4 + 20 : 3 * H / 4 + 10; const leg = Math.sin(t * 20 * (r.v / 6)) * 10 * Math.min(1, r.v / 4); UI.roundRect(ctx, x - 10, y - 40, 20, 30, 6, r.frozen > 0 ? '#888' : g.color(p)); UI.circle(ctx, x, y - 48, 9, '#ffe0b3'); UI.rect(ctx, x - 7 + leg, y - 12, 5, 14, '#333'); UI.rect(ctx, x + 2 - leg, y - 12, 5, 14, '#333'); UI.text(ctx, g.name(p), 40, y - 30, { color: '#fff', font: 'bold 12px system-ui', align: 'left' }); }
        UI.text(ctx, started ? t.toFixed(2) + 's' : 'READY', W / 2, H - 14, { color: '#fff', font: 'bold 16px monospace' });
        if (best) UI.text(ctx, `best ${best.v.toFixed(2)}s`, W - 60, H - 14, { color: '#fff9', font: '12px monospace' });
      }
    },
  });
})();
