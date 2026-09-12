/* Minesweeper Flags — turn-based: reveal a mine to flag it and go again; most mines wins. */
(function () {
  let starter = 1;
  Game.init({
    id: 'minesweeper-flags',
    rules: ['A 12×12 field with 30 hidden mines. Players take turns revealing squares.', 'Reveal a mine and you capture it (and go again!). Reveal a number and your turn ends; blank squares open up as usual.', 'First to capture 16 mines wins.'],
    controls: { all: 'Tap / click squares' },
    points: true,
    onStart(g) {
      const R = 12, C = 12, M = 30, TARGET = Math.floor(M / 2) + 1;
      const flags = { 1: 0, 2: 0 }; let turn = starter, mines = null, open = range(R).map(() => Array(C).fill(false)), owner = range(R).map(() => Array(C).fill(0));
      const size = Math.floor(clamp((Math.min(window.innerWidth, 560) - 30) / C, 24, 44));
      const grid = UI.grid({ rows: R, cols: C, size, gap: 2, onClick: (r, c) => reveal(r, c) });
      grid.each((cell) => { cell.style.background = 'var(--surface2)'; cell.style.fontWeight = 800; cell.style.fontSize = 'calc(var(--cell) * .5)'; });
      g.stage.appendChild(grid.el);
      const nb = (r, c) => { const out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < R && cc >= 0 && cc < C) out.push([rr, cc]); } return out; };
      const place = (sr, sc) => { mines = range(R).map(() => Array(C).fill(false)); let n = 0; while (n < M) { const r = rnd(R), c = rnd(C); if (mines[r][c] || (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1)) continue; mines[r][c] = true; n++; } };
      const count = (r, c) => nb(r, c).filter(([rr, cc]) => mines[rr][cc]).length;
      const COLORS = ['', '#4dabf7', '#51cf66', '#ff6b6b', '#cc5de8', '#ff922b', '#20c997', '#f1f3f5', '#adb5bd'];
      const show = (r, c) => { const cell = grid.at(r, c); if (mines[r][c]) { cell.textContent = '🚩'; cell.style.background = `color-mix(in srgb, ${g.color(owner[r][c])} 55%, var(--surface))`; } else { const n = count(r, c); cell.textContent = n || ''; cell.style.color = COLORS[n]; cell.style.background = 'var(--surface)'; } cell.classList.add('static'); };
      const status = () => { g.points(flags[1], flags[2]); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${M - flags[1] - flags[2]} mines left`); };
      function reveal(r, c) {
        if (g.over || open[r][c]) return;
        if (!mines) place(r, c);
        open[r][c] = true;
        if (mines[r][c]) { owner[r][c] = turn; flags[turn]++; show(r, c); g.sfx('capture'); status(); if (flags[turn] >= TARGET) { starter = 3 - starter; return g.win(turn, `${flags[turn]} mines to ${flags[3 - turn]}.`); } return; }
        // flood fill
        const stack = [[r, c]]; while (stack.length) { const [rr, cc] = stack.pop(); show(rr, cc); if (count(rr, cc) === 0) nb(rr, cc).forEach(([a, b]) => { if (!open[a][b] && !mines[a][b]) { open[a][b] = true; stack.push([a, b]); } }); }
        g.sfx('click'); turn = 3 - turn; status();
      }
      status();
    },
  });
})();
