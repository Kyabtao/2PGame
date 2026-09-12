/* Breakthrough — 8×8, two rows of pawns each; move forward/diagonal, capture diagonally; reach the far row. */
(function () {
  const N = 8;
  let starter = 1;
  Game.init({
    id: 'breakthrough',
    rules: ['Each side starts with 16 pawns on its two home rows. Player 1 moves up, Player 2 moves down.', 'A pawn moves one square straight or diagonally forward onto an empty square, and captures only diagonally forward.', 'Reach the opponent\'s home row with any pawn, or capture all enemy pawns, to win. Captures are not mandatory.'],
    controls: { all: 'Click / tap a pawn, then a highlighted square' },
    points: true,
    onStart(g) {
      const b = range(N).map((r) => Array(N).fill(0).map(() => (r < 2 ? 2 : r > 5 ? 1 : 0)));
      let turn = starter, sel = null;
      const grid = UI.grid({ rows: N, cols: N, checker: true, gap: 0, onClick: click });
      g.stage.appendChild(grid.el);
      const dir = (p) => p === 1 ? -1 : 1;
      const movesOf = (r, c) => { const p = b[r][c]; const out = []; const rr = r + dir(p); if (rr < 0 || rr >= N) return out; for (const dc of [-1, 0, 1]) { const cc = c + dc; if (cc < 0 || cc >= N) continue; if (dc === 0 ? !b[rr][cc] : b[rr][cc] !== p) out.push([rr, cc]); } return out; };
      const count = (p) => b.flat().filter((x) => x === p).length;
      function render() {
        grid.each((cell, r, c) => { cell.innerHTML = ''; cell.classList.remove('sel', 'dot'); if (b[r][c]) cell.appendChild(h('div', { class: 'piece p' + b[r][c] }, b[r][c] === 1 ? '▲' : '▼')); });
        if (sel) { grid.at(sel[0], sel[1]).classList.add('sel'); movesOf(sel[0], sel[1]).forEach(([r, c]) => grid.at(r, c).classList.add('dot')); }
        g.points(count(1), count(2));
      }
      function click(r, c) {
        if (g.over) return;
        if (sel && movesOf(sel[0], sel[1]).some(([rr, cc]) => rr === r && cc === c)) {
          const cap = b[r][c] !== 0; b[r][c] = turn; b[sel[0]][sel[1]] = 0; sel = null; g.sfx(cap ? 'capture' : 'move');
          if ((turn === 1 && r === 0) || (turn === 2 && r === N - 1)) { render(); starter = 3 - turn; return g.win(turn, `${esc(g.name(turn))} broke through to the far row.`); }
          if (!count(3 - turn)) { render(); starter = 3 - turn; return g.win(turn, 'All enemy pawns captured.'); }
          turn = 3 - turn; render(); g.turn(turn); return;
        }
        if (b[r][c] === turn) { sel = [r, c]; g.sfx('click'); } else sel = null;
        render();
      }
      render(); g.turn(turn);
    },
  });
})();
