/* Leap Frog — 3×5 pond, one gap. Slide or jump a run of frogs; last one able to move wins. */
(function () {
  const ROWS = 3, COLS = 5, CAP = 50;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let starter = 1;
  Game.init({
    id: 'leap-frog',
    rules: [
      'Each side has five frogs: one on the top row, one on the bottom row. The middle row is open water.',
      'On your turn move one frog: slide into an adjacent empty square, or jump in a straight line over a row of frogs and land in the empty square right behind them.',
      'You must move. If you have no legal move at all, you lose.',
      'Get all five frogs onto your rival’s home row to win instantly. After 50 moves the frogs furthest across the pond win.',
    ],
    controls: { all: 'Tap a frog, then tap a highlighted square' },
    onStart(g) {
      const b = [Array(COLS).fill(1), Array(COLS).fill(0), Array(COLS).fill(2)];
      let turn = starter, plies = 0, sel = null;
      const grid = UI.grid({ rows: ROWS, cols: COLS, size: 74, gap: 6, onClick: click });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, note);
      const inb = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
      function jumps(r, c) {
        const out = [];
        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = c + dc;
          if (!inb(nr, nc)) continue;
          if (!b[nr][nc]) { out.push([nr, nc]); continue; }
          let rr = nr, cc = nc;
          while (inb(rr + dr, cc + dc) && b[rr + dr][cc + dc]) { rr += dr; cc += dc; }
          if (inb(rr + dr, cc + dc) && !b[rr + dr][cc + dc]) out.push([rr + dr, cc + dc]);
        }
        return out;
      }
      const myMoves = (p) => { const m = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (b[r][c] === p) jumps(r, c).forEach(([rr, cc]) => m.push([r, c, rr, cc])); return m; };
      const advance = (p) => { let s = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (b[r][c] === p) s += p === 1 ? r : (ROWS - 1 - r); return s; };
      function render() {
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          if (b[r][c]) {
            const f = h('div', { class: 'piece p' + b[r][c], text: '🐸', style: { fontSize: 'calc(var(--cell) * .58)', lineHeight: 1, background: b[r][c] === 1 ? 'color-mix(in srgb, var(--p1) 30%, transparent)' : 'color-mix(in srgb, var(--p2) 30%, transparent)', borderRadius: '12px' } });
            cell.appendChild(f);
          }
          if (sel && sel[0] === r && sel[1] === c) cell.classList.add('sel');
          if (sel) jumps(sel[0], sel[1]).forEach(([rr, cc]) => { if (rr === r && cc === c) cell.classList.add('dot'); });
          if (b[r][c] === turn && !sel) cell.classList.add('hl');
        });
        note.textContent = `Advance ${advance(1)} vs ${advance(2)} · moves left: ${myMoves(1).length} / ${myMoves(2).length} · ply ${plies}/${CAP}`;
      }
      function click(r, c) {
        if (g.over) return;
        if (b[r][c] === turn) { sel = (sel && sel[0] === r && sel[1] === c) ? null : [r, c]; g.sfx('click'); return render(); }
        if (!sel) return g.sfx('bad');
        if (!jumps(sel[0], sel[1]).some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
        b[r][c] = turn; b[sel[0]][sel[1]] = 0; sel = null; plies++;
        g.sfx('move');
        const home = turn === 1 ? ROWS - 1 : 0;
        let all = true;
        for (let c2 = 0; c2 < COLS; c2++) if (b[home][c2] !== turn) all = false;
        render();
        if (all) { starter = 3 - starter; return g.win(turn, `All five frogs crossed the pond!`); }
        turn = 3 - turn;
        if (!myMoves(turn).length) { starter = 3 - starter; return g.win(3 - turn, `${esc(g.name(turn))} is boxed in with no legal jump.`); }
        if (plies >= CAP) { const a = advance(1), c3 = advance(2); starter = 3 - starter; if (a === c3) return g.draw(`Move limit reached with both shoal in place (${a}).`); return g.win(a > c3 ? 1 : 2, `Move limit — advance ${a} vs ${c3}.`); }
        g.turn(turn); render();
      }
      if (!myMoves(turn).length) { /* impossible at start, guarded anyway */ }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
