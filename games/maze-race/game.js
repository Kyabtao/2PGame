/* Maze Race — recursive-backtracker maze; P1 from top-left, P2 from bottom-right; first to the centre. */
(function () {
  const N = 21; // odd
  Game.init({
    id: 'maze-race',
    rules: ['A random maze is generated each round. Player 1 starts top-left, Player 2 bottom-right.', 'Race to the ⭐ in the centre. Moves are one cell at a time; hold a key to keep moving.', 'First to reach the star wins.'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', p2: 'Arrows' },
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const CELL = Math.floor(clamp((Math.min(window.innerWidth - 24, window.innerHeight - 240)) / N, 12, 26)), W = N * CELL, H = N * CELL;
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const wall = range(N).map(() => Array(N).fill(true));
      const carve = (r, c) => { wall[r][c] = false; for (const [dr, dc] of shuffle([[0, 2], [0, -2], [2, 0], [-2, 0]])) { const rr = r + dr, cc = c + dc; if (rr > 0 && cc > 0 && rr < N - 1 && cc < N - 1 && wall[rr][cc]) { wall[r + dr / 2][c + dc / 2] = false; carve(rr, cc); } } };
      carve(1, 1);
      const mid = Math.floor(N / 2); wall[mid][mid] = false; wall[mid][mid - 1] = false; wall[mid][mid + 1] = false; wall[mid - 1][mid] = false; wall[mid + 1][mid] = false;
      // a few extra openings to create alternative routes
      for (let i = 0; i < 12; i++) { const r = 1 + rnd(N - 2), c = 1 + rnd(N - 2); if (wall[r][c] && ((!wall[r - 1][c] && !wall[r + 1][c]) || (!wall[r][c - 1] && !wall[r][c + 1]))) wall[r][c] = false; }
      const pl = { 1: { r: 1, c: 1, cd: 0, trail: [] }, 2: { r: N - 2, c: N - 2, cd: 0, trail: [] } };
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      let t = 0;
      const step = (p, dr, dc) => { const s = pl[p]; const rr = s.r + dr, cc = s.c + dc; if (wall[rr][cc]) return; s.trail.push([s.r, s.c]); s.r = rr; s.c = cc; s.cd = 0.09; if (rr === mid && cc === mid) { draw(); g.sfx('win'); g.win(p, `Reached the centre in ${t.toFixed(1)}s.`); } };
      const map = { KeyW: [1, -1, 0], KeyS: [1, 1, 0], KeyA: [1, 0, -1], KeyD: [1, 0, 1], ArrowUp: [2, -1, 0], ArrowDown: [2, 1, 0], ArrowLeft: [2, 0, -1], ArrowRight: [2, 0, 1] };
      g.key(Object.keys(map), (code) => { const [p, dr, dc] = map[code]; if (pl[p].cd <= 0) step(p, dr, dc); });
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) { const s = pl[p], c = ctl[p]; s.cd -= dt; if (s.cd <= 0) { if (g.down(c.u)) step(p, -1, 0); else if (g.down(c.d)) step(p, 1, 0); else if (g.down(c.l)) step(p, 0, -1); else if (g.down(c.r)) step(p, 0, 1); } }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0b0d18');
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (wall[r][c]) UI.rect(ctx, c * CELL, r * CELL, CELL, CELL, '#2d3757');
        for (const p of [1, 2]) pl[p].trail.forEach(([r, c]) => UI.rect(ctx, c * CELL + CELL * .35, r * CELL + CELL * .35, CELL * .3, CELL * .3, g.color(p) + '55'));
        UI.text(ctx, '⭐', mid * CELL + CELL / 2, mid * CELL + CELL / 2 + 1, { font: `${CELL - 2}px system-ui` });
        for (const p of [1, 2]) UI.circle(ctx, pl[p].c * CELL + CELL / 2, pl[p].r * CELL + CELL / 2, CELL * .38, g.color(p));
      }
    },
  });
})();
