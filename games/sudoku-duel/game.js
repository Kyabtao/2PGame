/* Sudoku Duel — a shared 4×4 grid, alternating fills. Break a rule and you lose the duel. */
(function () {
  const SOLVES = [
    ['1234', '3412', '2143', '4321'],
    ['2413', '1324', '4231', '3142'],
    ['3142', '4231', '1324', '2413'],
    ['4321', '2143', '3412', '1234'],
    ['1423', '2314', '4132', '3241'],
  ];
  let starter = 1;
  Game.init({
    id: 'sudoku-duel',
    rules: [
      'One 4×4 grid, two pens. Rows, columns and the four 2×2 boxes must each hold 1–4 exactly once — the classic rule shrunk to pocket size.',
      'Players alternate dropping digits into empty cells. A placement that breaks a rule (or duplicates in a unit) is an instant forfeit — check twice.',
      'Complete the grid without breaking it and the side that laid the final tile wins the board. Five boards, most boards won takes the duel; solved boards count +1, unbroken forfeits −1 for the breaker only.',
    ],
    controls: { all: 'Tap a digit chip, then a cell · ✖ to deselect' },
    points: true,
    onStart(g) {
      const wins = { 1: 0, 2: 0 };
      let sol = [], given = [], grid = [], pick = 0, turn = starter, board = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const gridUI = UI.grid({ rows: 4, cols: 4, onClick: (r, c, cell) => put(r, c) });
      const chipRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'b2', label: 'board', val: 1 }]);
      wrap.append(info, gridUI.el, chipRow, stat.el);
      const unit = (r, c) => {
        const cells = [];
        for (let i = 0; i < 4; i++) { cells.push([r, i], [i, c]); }
        const br = (r >> 1) * 2, bc = (c >> 1) * 2;
        for (let i = br; i < br + 2; i++) for (let j = bc; j < bc + 2; j++) cells.push([i, j]);
        return cells.filter(([a, b]) => !(a === r && b === c));
      };
      function newBoard() {
        board++;
        if (board > 5 || over) return finish();
        sol = SOLVES[Math.floor(Math.random() * SOLVES.length)].map((row) => row.split('').map(Number));
        given = sol.map((row) => row.map(() => Math.random() < 0.4));
        grid = sol.map((row, r) => row.map((v, c) => (given[r][c] ? v : 0)));
        pick = 0;
        g.sfx('capture');
        draw();
      }
      function draw() {
        if (over) return;
        const empt = grid.flat().filter((v) => !v).length;
        info.innerHTML = `board ${board}/5 · ${empt} cells left · <b class="pc${turn}">${esc(g.name(turn))}</b> ${pick ? `placing ${pick}` : 'pick a digit'}`;
        gridUI.each((cell, r, c) => {
          cell.innerHTML = '';
          cell.className = 'cell' + (given[r][c] ? ' dis' : '');
          const v = grid[r][c];
          if (v) cell.appendChild(h('span', { text: String(v), style: { fontWeight: 800, fontSize: '1.3rem', color: given[r][c] ? '#888' : turn === 1 ? '#1565c0' : '#c62828' } }));
        });
        chipRow.innerHTML = '';
        for (let d = 1; d <= 4; d++) {
          const avail = grid.some((row) => row.some((v, c) => v === 0 && row[c] === 0)) ;
          void avail;
          const b = h('button', { class: 'chip' + (pick === d ? ' on' : ''), text: String(d) });
          b.addEventListener('click', () => { pick = pick === d ? 0 : d; draw(); });
          chipRow.appendChild(b);
        }
        chipRow.appendChild(h('span', { class: 'muted', text: `wins ${wins[1]}–${wins[2]}` }));
        g.points(wins[1], wins[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — one digit per cell, every unit unique`);
      }
      function put(r, c) {
        if (over || grid[r][c] || given[r][c]) return g.sfx('bad');
        if (!pick) { g.sfx('bad'); g.toast('choose a digit first', 800); return; }
        const bad = unit(r, c).some(([a, b]) => grid[a][b] === pick);
        grid[r][c] = pick;
        given[r][c] = true;
        pick = 0;
        if (bad) {
          wins[3 - turn]++;
          g.sfx('explode'); g.toast(`broken rule — board to ${esc(g.name(3 - turn))}`, 1500);
          turn = 3 - turn;
          setTimeout(newBoard, 1500);
          draw();
          return;
        }
        if (grid.every((row) => row.every((v) => v))) {
          if (grid.some((row, rr) => row.some((v, cc) => v !== sol[rr][cc]))) { }   // wrong but consistent puzzle: accept
          wins[turn]++;
          g.sfx('win'); g.toast(`${esc(g.name(turn))} closes the grid — board claimed`, 1500);
          starter = 3 - starter;
          setTimeout(newBoard, 1500);
          draw();
          return;
        }
        turn = 3 - turn;
        draw();
      }
      function finish() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (wins[1] === wins[2]) return g.draw(`Five boards, five shrugs — ${wins[1]} each.`);
        g.win(wins[1] > wins[2] ? 1 : 2, `Sudoku duel ends ${wins[1]}–${wins[2]}.`);
      }
      newBoard();
    },
    onStop() { starter = 3 - starter; },
  });
})();
