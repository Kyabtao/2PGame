/* Connect Four — 7×6, four in a row. */
(function () {
  const ROWS = 6, COLS = 7;
  let starter = 1;
  Game.init({
    id: 'connect-four',
    rules: ['Take turns dropping a disc into one of the seven columns; it falls to the lowest free slot.', 'First to connect four discs in a line (any direction) wins.', 'If the grid fills without a line, the round is a draw.'],
    controls: { all: 'Click / tap a column, or press <kbd>1</kbd>–<kbd>7</kbd>' },
    onStart(g) {
      const b = range(ROWS).map(() => Array(COLS).fill(0));
      let turn = starter, moves = 0;
      const grid = UI.grid({ rows: ROWS, cols: COLS, onClick: (r, c) => drop(c) });
      grid.each((cell) => { cell.style.borderRadius = '50%'; cell.style.background = '#0f1a3a'; });
      grid.el.style.background = '#2653c9';
      g.stage.appendChild(grid.el);
      const hover = (c, on) => { for (let r = 0; r < ROWS; r++) grid.at(r, c).style.boxShadow = on && !b[r][c] ? 'inset 0 0 0 2px rgba(255,255,255,.25)' : ''; };
      grid.each((cell, r, c) => { cell.addEventListener('mouseenter', () => hover(c, true)); cell.addEventListener('mouseleave', () => hover(c, false)); });
      g.turn(turn);
      function drop(c) {
        if (g.over) return;
        let r = ROWS - 1; while (r >= 0 && b[r][c]) r--;
        if (r < 0) { g.sfx('bad'); return; }
        b[r][c] = turn; moves++;
        grid.at(r, c).appendChild(h('div', { class: 'piece p' + turn }));
        g.sfx('move');
        const line = winLine(b, r, c, turn);
        if (line) { line.forEach(([rr, cc]) => grid.at(rr, cc).classList.add('win')); starter = g.other(turn); return g.win(turn, `Four in a row after ${moves} discs.`); }
        if (moves === ROWS * COLS) { starter = g.other(starter); return g.draw('The grid is full.'); }
        turn = g.other(turn); g.turn(turn);
      }
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'], (code) => drop(+code.slice(-1) - 1));
    },
  });
  function winLine(b, r, c, p) {
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = [[r, c]];
      for (const s of [1, -1]) { let rr = r + dr * s, cc = c + dc * s; while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && b[rr][cc] === p) { cells.push([rr, cc]); rr += dr * s; cc += dc * s; } }
      if (cells.length >= 4) return cells;
    }
    return null;
  }
})();
