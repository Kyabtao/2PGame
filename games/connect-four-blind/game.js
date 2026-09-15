/* Connect Four Blind — gravity works, but your rival’s discs are invisible. Track them by ear. */
(function () {
  const ROWS = 6, COLS = 7;
  let starter = 1;
  Game.init({
    id: 'connect-four-blind',
    rules: [
      'Regular Connect Four columns and gravity — except your rival’s discs render as fogged slots. Only the drop log (“P2 → column D”) tells you where they landed.',
      'A fourth-in-a-row is checked honestly by the board, fogged or not.',
      'The grid fills or a line forms; four boards decide the match, and the loser of the last exchange starts the next.',
    ],
    controls: { all: 'Tap a column · four boards' },
    points: true,
    onStart(g) {
      const wins = { 1: 0, 2: 0 };
      let b, turn, moves, r = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const grid = UI.grid({ rows: ROWS, cols: COLS, onClick: (rr, cc) => drop(cc) });
      grid.each((cell) => { cell.style.borderRadius = '50%'; cell.style.background = '#10204a'; });
      grid.el.style.background = '#2653c9';
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, grid.el, stat.el);
      const LET = 'ABCDEFG';
      function winLine(rr, cc, p) {
        for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          const cells = [[rr, cc]];
          for (const s of [1, -1]) { let a = rr + dr * s, c2 = cc + dc * s; while (a >= 0 && a < ROWS && c2 >= 0 && c2 < COLS && b[a][c2] === p) { cells.push([a, c2]); a += dr * s; c2 += dc * s; } }
          if (cells.length >= 4) return cells;
        }
        return null;
      }
      function newBoard() {
        r++;
        if (r > 4 || over) return end();
        b = range(ROWS).map(() => Array(COLS).fill(0));
        turn = starter; moves = 0;
        grid.each((cell) => { cell.innerHTML = ''; cell.className = 'cell'; cell.style.background = '#10204a'; });
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        info.innerHTML = `board ${r}/4 · <b class="pc${turn}">${esc(g.name(turn))}</b> drops`;
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) {
          const cell = grid.at(rr, cc);
          cell.innerHTML = '';
          const v = b[rr][cc];
          if (v === turn) cell.appendChild(h('div', { class: 'piece p' + turn }));
          else if (v) cell.appendChild(h('span', { text: '·', style: { opacity: .35, fontSize: '1.6rem', color: '#fff' } }));
        }
        stat.set('a', wins[1]); stat.set('b', wins[2]);
        g.points(wins[1], wins[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — picture their stack`);
      }
      function drop(c) {
        if (over) return;
        let rr = ROWS - 1; while (rr >= 0 && b[rr][c]) rr--;
        if (rr < 0) { g.sfx('bad'); return; }
        b[rr][c] = turn; moves++;
        g.toast(`${g.name(turn)} → column ${LET[c]}, row ${ROWS - rr}`, 1400);
        g.sfx('move');
        const line = winLine(rr, c, turn);
        if (line) {
          wins[turn]++; starter = g.other(turn);
          line.forEach(([a, c2]) => grid.at(a, c2).classList.add('win'));
          over = true; g.turn();
          g.sfx('win');
          setTimeout(() => { over = false; newBoard(); }, 1500);
          return;
        }
        if (moves === ROWS * COLS) { starter = g.other(starter); g.sfx('coin'); setTimeout(newBoard, 1400); }
        else turn = g.other(turn);
        draw();
      }
      function end() {
        over = true;
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) if (b[rr][cc]) {
          const cell = grid.at(rr, cc); cell.innerHTML = '';
          cell.appendChild(h('span', { text: b[rr][cc] === 1 ? '①' : '②', style: { color: b[rr][cc] === 1 ? '#8ecbff' : '#ffb3a7', fontSize: '1.3rem', fontWeight: 800 } }));
        }
        starter = 3 - starter;
        g.turn();
        if (wins[1] === wins[2]) return g.draw(`Four foggy boards, ${wins[1]}–${wins[2]}.`);
        g.win(wins[1] > wins[2] ? 1 : 2, `Blind drops end ${wins[1]}–${wins[2]}.`);
      }
      newBoard();
    },
    onStop() { starter = 3 - starter; },
  });
})();
