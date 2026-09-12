/* Snake Duel — two snakes, shared food, collisions. */
(function () {
  const COLS = 40, ROWS = 26, CELL = 18, W = COLS * CELL, H = ROWS * CELL;
  Game.init({
    id: 'snake-duel',
    rules: ['Each snake moves constantly. Eat 🍎 to grow (and to score a point).', 'Hitting a wall, your own body or the other snake kills you — the survivor wins. Head-on collision is a draw.', 'If both are alive after 90 seconds, the longer snake wins.'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', p2: 'Arrows' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const sn = { 1: { body: [[6, 13], [5, 13], [4, 13]], d: [1, 0], nd: [1, 0], grow: 0, ate: 0 }, 2: { body: [[33, 13], [34, 13], [35, 13]], d: [-1, 0], nd: [-1, 0], grow: 0, ate: 0 } };
      let food = []; let t = 90;
      const occupied = (x, y) => sn[1].body.some(([a, b]) => a === x && b === y) || sn[2].body.some(([a, b]) => a === x && b === y) || food.some((f) => f[0] === x && f[1] === y);
      const spawn = () => { let x, y, n = 0; do { x = rnd(COLS); y = rnd(ROWS); } while (occupied(x, y) && n++ < 200); food.push([x, y]); };
      spawn(); spawn(); spawn();
      const map = { KeyW: [1, 0, -1], KeyS: [1, 0, 1], KeyA: [1, -1, 0], KeyD: [1, 1, 0], ArrowUp: [2, 0, -1], ArrowDown: [2, 0, 1], ArrowLeft: [2, -1, 0], ArrowRight: [2, 1, 0] };
      g.key(Object.keys(map), (code) => { const [p, dx, dy] = map[code]; const s = sn[p]; if (dx === -s.d[0] && dy === -s.d[1]) return; s.nd = [dx, dy]; });
      UI.pointer(canvas, { down: (pt) => { const p = pt.x < W / 2 ? 1 : 2; const s = sn[p]; const [hx, hy] = s.body[0]; const ax = pt.x - hx * CELL, ay = pt.y - hy * CELL; if (Math.abs(ax) > Math.abs(ay)) { if (Math.sign(ax) !== -s.d[0]) s.nd = [Math.sign(ax), 0]; } else if (Math.sign(ay) !== -s.d[1]) s.nd = [0, Math.sign(ay)]; } }, W, H);
      draw();
      await g.countdown(3);
      let acc = 0;
      g.loop((dt) => {
        acc += dt; t -= dt;
        if (t <= 0) { const l1 = sn[1].body.length, l2 = sn[2].body.length; if (l1 === l2) return g.draw('Time up — equal length.'); return g.win(l1 > l2 ? 1 : 2, `Time up — longer snake (${Math.max(l1, l2)} vs ${Math.min(l1, l2)}).`); }
        const step = 1 / 9;
        while (acc >= step) {
          acc -= step;
          const heads = {};
          for (const p of [1, 2]) { const s = sn[p]; s.d = s.nd; heads[p] = [s.body[0][0] + s.d[0], s.body[0][1] + s.d[1]]; }
          const dead = { 1: false, 2: false };
          for (const p of [1, 2]) {
            const [x, y] = heads[p]; if (x < 0 || y < 0 || x >= COLS || y >= ROWS) dead[p] = true;
            for (const q of [1, 2]) { const body = sn[q].body; const len = sn[q].grow > 0 ? body.length : body.length - 1; for (let i = 0; i < len; i++) if (body[i][0] === x && body[i][1] === y) dead[p] = true; }
          }
          if (heads[1][0] === heads[2][0] && heads[1][1] === heads[2][1]) dead[1] = dead[2] = true;
          if (dead[1] || dead[2]) { g.sfx('explode'); draw(); if (dead[1] && dead[2]) return g.draw('Both snakes crashed.'); return g.win(dead[1] ? 2 : 1, `${esc(g.name(dead[1] ? 1 : 2))}'s snake crashed.`); }
          for (const p of [1, 2]) { const s = sn[p]; s.body.unshift(heads[p]); const fi = food.findIndex((f) => f[0] === heads[p][0] && f[1] === heads[p][1]); if (fi >= 0) { food.splice(fi, 1); s.grow += 2; s.ate++; g.sfx('coin'); spawn(); } if (s.grow > 0) s.grow--; else s.body.pop(); }
          g.points(sn[1].body.length, sn[2].body.length);
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0b0d18');
        ctx.fillStyle = '#10152a'; for (let x = 0; x < COLS; x++) for (let y = (x % 2); y < ROWS; y += 2) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        food.forEach(([x, y]) => UI.text(ctx, '🍎', x * CELL + CELL / 2, y * CELL + CELL / 2 + 1, { font: `${CELL - 2}px system-ui` }));
        for (const p of [1, 2]) sn[p].body.forEach(([x, y], i) => { ctx.globalAlpha = i === 0 ? 1 : 0.85; UI.roundRect(ctx, x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2, 4, i === 0 ? '#fff' : g.color(p)); }); ctx.globalAlpha = 1;
        UI.text(ctx, fmtTime(Math.max(0, t) * 1000), W / 2, 14, { color: '#9aa4c7', font: 'bold 14px monospace' });
      }
    },
  });
})();
