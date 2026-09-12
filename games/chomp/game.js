/* Chomp — 5×8 chocolate bar; bite removes everything below-right; poisoned top-left square loses. */
(function () {
  const ROWS = 5, COLS = 8;
  let starter = 1;
  Game.init({
    id: 'chomp',
    rules: ['The bar is a 5×8 grid of chocolate squares; the top-left square is poisoned.', 'On your turn pick a square: it and every square to the right and below it are eaten.', 'Whoever is forced to eat the poisoned square loses.'],
    controls: { all: 'Hover to preview a bite, click / tap to eat' },
    onStart(g) {
      const b = range(ROWS).map(() => Array(COLS).fill(true));
      let turn = starter;
      const grid = UI.grid({ rows: ROWS, cols: COLS, gap: 3, onClick: bite });
      grid.el.style.background = '#3b2314';
      grid.each((cell, r, c) => {
        cell.style.background = r === 0 && c === 0 ? '#5a2d82' : '#7b4a2a'; cell.style.borderRadius = '4px'; cell.style.boxShadow = 'inset 0 -4px 0 #0005';
        if (r === 0 && c === 0) cell.textContent = '☠️';
        cell.addEventListener('mouseenter', () => preview(r, c, true)); cell.addEventListener('mouseleave', () => preview(r, c, false));
      });
      g.stage.appendChild(grid.el);
      g.turn(turn);
      function preview(r, c, on) { if (!b[r][c]) return; for (let rr = r; rr < ROWS; rr++) for (let cc = c; cc < COLS; cc++) if (b[rr][cc]) grid.at(rr, cc).style.filter = on ? 'brightness(1.5)' : ''; }
      function bite(r, c) {
        if (g.over || !b[r][c]) return;
        let n = 0;
        for (let rr = r; rr < ROWS; rr++) for (let cc = c; cc < COLS; cc++) if (b[rr][cc]) { b[rr][cc] = false; n++; const cell = grid.at(rr, cc); cell.style.background = 'transparent'; cell.style.boxShadow = 'none'; cell.style.filter = ''; cell.style.cursor = 'default'; cell.textContent = ''; }
        g.sfx(r === 0 && c === 0 ? 'bad' : 'capture');
        if (r === 0 && c === 0) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} ate the poisoned square.`); }
        turn = 3 - turn; g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>'s turn (${n} squares eaten)`);
      }
    },
  });
})();
