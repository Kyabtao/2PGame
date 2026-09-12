/* Block Battle — side-by-side falling blocks with garbage lines. */
(function () {
  const COLS = 10, ROWS = 20;
  const SHAPES = { I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]] };
  const COLORS = { I: '#4dd0e1', O: '#ffd54f', T: '#ba68c8', S: '#81c784', Z: '#e57373', J: '#64b5f6', L: '#ffb74d', G: '#6b7280' };
  Game.init({
    id: 'block-battle',
    rules: ['Classic falling blocks, side by side. Clear lines to score; clearing 2+ lines at once sends garbage rows to your rival (lines − 1).', 'When a stack reaches the top, that player loses.', 'Both players receive the same sequence of pieces.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> move · <kbd>W</kbd> rotate · <kbd>S</kbd> soft drop · <kbd>Q</kbd> hard drop', p2: '<kbd>←</kbd>/<kbd>→</kbd> move · <kbd>↑</kbd> rotate · <kbd>↓</kbd> soft drop · <kbd>/</kbd> hard drop' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, labels: { up: '⟳' }, buttons: [{ code: 'KeyQ', label: 'Drop' }] }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, labels: { up: '⟳' }, buttons: [{ code: 'Slash', label: 'Drop' }] }],
    async onStart(g) {
      const CELL = Math.floor(clamp((window.innerHeight - 260) / ROWS, 14, 24));
      const wrap = h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '1.5rem' } });
      const seq = []; const bag = () => shuffle(Object.keys(SHAPES));
      const pieceAt = (i) => { while (seq.length <= i) seq.push(...bag()); return seq[i]; };
      const P = {};
      for (const p of [1, 2]) {
        const { canvas, ctx } = UI.canvas(COLS * CELL, ROWS * CELL);
        const nextC = UI.canvas(4 * CELL, 4 * CELL);
        wrap.appendChild(h('div', { class: 'col' }, h('div', { class: 'pc' + p, style: { fontWeight: 700 } }, g.name(p)), h('div', { class: 'row', style: { alignItems: 'flex-start' } }, canvas, h('div', { class: 'col' }, h('span', { class: 'tag' }, 'next'), nextC.canvas))));
        P[p] = { ctx, nctx: nextC.ctx, grid: range(ROWS).map(() => Array(COLS).fill(null)), idx: 0, cur: null, fall: 0, lines: 0, pending: 0, alive: true };
      }
      g.stage.appendChild(wrap);
      const rot = (m) => m[0].map((_, i) => m.map((row) => row[i]).reverse());
      const fits = (s, m, x, y) => m.every((row, r) => row.every((v, c) => !v || (x + c >= 0 && x + c < COLS && y + r < ROWS && (y + r < 0 || !s.grid[y + r][x + c]))));
      const spawn = (s) => { const k = pieceAt(s.idx++); s.cur = { k, m: SHAPES[k].map((r) => r.slice()), x: Math.floor(COLS / 2) - 1, y: -1 }; if (!fits(s, s.cur.m, s.cur.x, s.cur.y)) s.alive = false; };
      const lock = (s, p) => {
        s.cur.m.forEach((row, r) => row.forEach((v, c) => { if (v && s.cur.y + r >= 0) s.grid[s.cur.y + r][s.cur.x + c] = s.cur.k; }));
        let cleared = 0; s.grid = s.grid.filter((row) => { if (row.every(Boolean)) { cleared++; return false; } return true; }); while (s.grid.length < ROWS) s.grid.unshift(Array(COLS).fill(null));
        if (cleared) { s.lines += cleared; g.sfx(cleared >= 4 ? 'win' : 'score'); if (cleared >= 2) P[3 - p].pending += cleared - 1; } else g.sfx('move');
        g.points(P[1].lines, P[2].lines);
        if (s.pending) { for (let i = 0; i < s.pending; i++) { s.grid.shift(); const row = Array(COLS).fill('G'); row[rnd(COLS)] = null; s.grid.push(row); } s.pending = 0; }
        spawn(s);
      };
      const act = (p, a) => { const s = P[p]; if (!s.alive || !s.cur || g.over) return; const c = s.cur; if (a === 'l' && fits(s, c.m, c.x - 1, c.y)) c.x--; if (a === 'r' && fits(s, c.m, c.x + 1, c.y)) c.x++; if (a === 'rot') { const m = rot(c.m); for (const k of [0, -1, 1, -2, 2]) if (fits(s, m, c.x + k, c.y)) { c.m = m; c.x += k; break; } } if (a === 'down') { if (fits(s, c.m, c.x, c.y + 1)) c.y++; else lock(s, p); } if (a === 'hard') { while (fits(s, c.m, c.x, c.y + 1)) c.y++; lock(s, p); } };
      const keys = { KeyA: [1, 'l'], KeyD: [1, 'r'], KeyW: [1, 'rot'], KeyS: [1, 'down'], KeyQ: [1, 'hard'], ArrowLeft: [2, 'l'], ArrowRight: [2, 'r'], ArrowUp: [2, 'rot'], ArrowDown: [2, 'down'], Slash: [2, 'hard'] };
      g.key(Object.keys(keys), (code) => act(...keys[code]), { repeat: true });
      spawn(P[1]); spawn(P[2]); draw();
      await g.countdown(3);
      let t = 0;
      g.loop((dt) => {
        t += dt; const speed = Math.max(0.12, 0.8 - t / 90);
        for (const p of [1, 2]) { const s = P[p]; if (!s.alive) continue; s.fall += dt; if (s.fall >= speed) { s.fall = 0; act(p, 'down'); } }
        if (!P[1].alive || !P[2].alive) { draw(); if (!P[1].alive && !P[2].alive) return g.draw('Both stacks topped out.'); const w = P[1].alive ? 1 : 2; return g.win(w, `${esc(g.name(3 - w))} topped out. Lines: ${P[1].lines} – ${P[2].lines}.`); }
        draw();
      });
      function draw() {
        for (const p of [1, 2]) {
          const s = P[p], ctx = s.ctx; UI.rect(ctx, 0, 0, COLS * CELL, ROWS * CELL, '#0b0d18');
          s.grid.forEach((row, r) => row.forEach((v, c) => { if (v) UI.roundRect(ctx, c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2, 3, COLORS[v]); }));
          if (s.cur) { let gy = s.cur.y; while (fits(s, s.cur.m, s.cur.x, gy + 1)) gy++; s.cur.m.forEach((row, r) => row.forEach((v, c) => { if (!v) return; UI.roundRect(ctx, (s.cur.x + c) * CELL + 1, (gy + r) * CELL + 1, CELL - 2, CELL - 2, 3, COLORS[s.cur.k] + '33'); if (s.cur.y + r >= 0) UI.roundRect(ctx, (s.cur.x + c) * CELL + 1, (s.cur.y + r) * CELL + 1, CELL - 2, CELL - 2, 3, COLORS[s.cur.k]); })); }
          if (s.pending) UI.rect(ctx, 0, ROWS * CELL - s.pending * CELL, 4, s.pending * CELL, '#ff6b6b');
          UI.rect(s.nctx, 0, 0, 4 * CELL, 4 * CELL, '#151a2e'); const nk = pieceAt(s.idx); SHAPES[nk].forEach((row, r) => row.forEach((v, c) => { if (v) UI.roundRect(s.nctx, (c + 0.5) * CELL, (r + 1) * CELL, CELL - 2, CELL - 2, 3, COLORS[nk]); }));
        }
      }
    },
  });
})();
