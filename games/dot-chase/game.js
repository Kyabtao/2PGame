/* Dot Chase — Pac-Man style asymmetric: one eats dots, one hunts; two halves, swap roles. */
(function () {
  const MAP = [
    '###################',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#.................#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.###.#.###.####',
    '   #.#.......#.#   ',
    '####.#.##.##.#.####',
    '#......#   #......#',
    '####.#.#####.#.####',
    '   #.#.......#.#   ',
    '####.#.#####.#.####',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#..#...........#..#',
    '##.#.#.#####.#.#.##',
    '#....#...#...#....#',
    '#.######.#.######.#',
    '#.................#',
    '###################'];
  const ROWS = MAP.length, COLS = MAP[0].length, CELL = 26, W = COLS * CELL, H = ROWS * CELL, HALF = 60;
  Game.init({
    id: 'dot-chase',
    rules: ['Two halves of 60 seconds. In each half one player is the <b>Runner</b> eating dots, the other is the <b>Ghost</b> hunting.', 'Runner scores 1 per dot. If the ghost catches the runner, the runner loses 10 dots of score and respawns.', 'Roles swap for the second half. Highest runner score wins.'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', p2: 'Arrows' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; let half = 1, runner = 1, t = HALF, dots, ents;
      const setup = () => { dots = new Set(); for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (MAP[r][c] === '.') dots.add(r * COLS + c); ents = { [runner]: mkEnt(1, 1), [3 - runner]: mkEnt(ROWS - 2, COLS - 2) }; };
      const mkEnt = (r, c) => ({ r, c, x: c * CELL + CELL / 2, y: r * CELL + CELL / 2, d: [0, 0], want: [0, 0], prog: 0 });
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      const open = (r, c) => { c = (c + COLS) % COLS; return r >= 0 && r < ROWS && MAP[r][c] !== '#'; };
      setup();
      const label = () => g.status(`Half ${half}: <span class="pc${runner}">${esc(g.name(runner))}</span> runs · <span class="pc${3 - runner}">${esc(g.name(3 - runner))}</span> hunts`);
      draw(); label();
      await g.countdown(3);
      let caughtCd = 0;
      g.loop((dt) => {
        t -= dt; caughtCd -= dt;
        for (const p of [1, 2]) {
          const e = ents[p], c = ctl[p]; const sp = (p === runner ? 5.2 : 4.9) * CELL;
          if (g.down(c.u)) e.want = [-1, 0]; else if (g.down(c.d)) e.want = [1, 0]; else if (g.down(c.l)) e.want = [0, -1]; else if (g.down(c.r)) e.want = [0, 1];
          // at cell centre, decide direction
          const cx = e.c * CELL + CELL / 2, cy = e.r * CELL + CELL / 2;
          if (Math.abs(e.x - cx) < 2 && Math.abs(e.y - cy) < 2) {
            e.x = cx; e.y = cy;
            if (open(e.r + e.want[0], e.c + e.want[1])) e.d = e.want;
            if (!open(e.r + e.d[0], e.c + e.d[1])) e.d = [0, 0];
          }
          e.x += e.d[1] * sp * dt; e.y += e.d[0] * sp * dt;
          if (e.x < 0) e.x += W; if (e.x > W) e.x -= W;
          const nr = Math.floor(e.y / CELL), nc = Math.floor(e.x / CELL);
          if (open(nr, nc)) { e.r = nr; e.c = (nc + COLS) % COLS; }
          if (p === runner) { const k = e.r * COLS + e.c; if (dots.has(k)) { dots.delete(k); score[runner]++; g.points(score[1], score[2]); if (dots.size % 7 === 0) g.sfx('tick'); } }
        }
        const a = ents[1], b = ents[2];
        if (caughtCd <= 0 && dist(a.x, a.y, b.x, b.y) < CELL * 0.8) { score[runner] = Math.max(0, score[runner] - 10); g.points(score[1], score[2]); g.sfx('explode'); ents[runner] = mkEnt(1, 1); ents[3 - runner] = mkEnt(ROWS - 2, COLS - 2); caughtCd = 1; }
        if (t <= 0 || dots.size === 0) {
          if (half === 1) { half = 2; runner = 3 - runner; t = HALF; setup(); label(); g.toast('Half time — swap roles!', 1500); g.sfx('go'); return; }
          draw(); if (score[1] === score[2]) return g.draw(`${score[1]} dots each.`); return g.win(score[1] > score[2] ? 1 : 2, `${Math.max(score[1], score[2])} dots to ${Math.min(score[1], score[2])}.`);
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0b0d18');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (MAP[r][c] === '#') UI.roundRect(ctx, c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4, 4, '#2643a8'); else if (dots.has(r * COLS + c)) UI.circle(ctx, c * CELL + CELL / 2, r * CELL + CELL / 2, 3, '#ffe8a3'); }
        for (const p of [1, 2]) { const e = ents[p]; if (p === runner) { UI.circle(ctx, e.x, e.y, CELL * .42, g.color(p)); ctx.fillStyle = '#0b0d18'; ctx.beginPath(); ctx.moveTo(e.x, e.y); const ang = Math.atan2(e.d[0], e.d[1]) || 0; const m = 0.35 + Math.sin(performance.now() / 60) * 0.3; ctx.arc(e.x, e.y, CELL * .42, ang - m, ang + m); ctx.closePath(); ctx.fill(); } else { UI.roundRect(ctx, e.x - CELL * .4, e.y - CELL * .42, CELL * .8, CELL * .8, 8, g.color(p)); UI.circle(ctx, e.x - 4, e.y - 3, 3, '#fff'); UI.circle(ctx, e.x + 4, e.y - 3, 3, '#fff'); } }
        UI.text(ctx, `${Math.ceil(Math.max(0, t))}s`, W / 2, 10, { color: '#fff', font: 'bold 12px monospace' });
      }
    },
  });
})();
