/* Tic-Tac-Toe Blind — you only see your own marks; the rival's moves are spoken coordinates. */
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  let starter = 1;
  Game.init({
    id: 'tic-tac-toe-blind',
    rules: [
      'Plain tic-tac-toe played BLIND: your own marks are visible, your rival’s squares appear as ghostly question marks.',
      'Every move is announced in the log (“P1 → center”), so keeping the rival’s board in your head is the whole game.',
      'First three-in-a-row wins the row of sight; full board = draw. The revealed grid settles any dispute.',
    ],
    controls: { all: 'Tap a square · best of 3 boards' },
    points: true,
    onStart(g) {
      const wins = { 1: 0, 2: 0 };
      let board, turn, moves, r = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const grid = UI.grid({ rows: 3, cols: 3, size: 92, onClick: (rr, cc) => play(rr * 3 + cc) });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, grid.el, stat.el);
      const NAMES = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'low-left', 'low', 'low-right'];
      function newBoard() {
        r++;
        if (r > 3 || over) return end();
        board = Array(9).fill(0); moves = 0; turn = starter;
        grid.clear();
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        info.innerHTML = `board ${r}/3 · <b class="pc${turn}">${esc(g.name(turn))}</b> — mark a square`;
        grid.each((cell, rr, cc) => {
          const v = board[rr * 3 + cc];
          cell.innerHTML = '';
          cell.className = 'cell';
          if (v && (v === turn || over)) cell.appendChild(h('span', { text: v === 1 ? 'X' : 'O', style: { fontWeight: 800, fontSize: '1.6rem', color: v === 1 ? '#1565c0' : '#c62828' } }));
          else if (v) cell.appendChild(h('span', { text: '?', style: { fontWeight: 700, fontSize: '1.3rem', opacity: .4 } }));
        });
        stat.set('a', wins[1]); stat.set('b', wins[2]);
        g.points(wins[1], wins[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — your board is only in your head`);
      }
      function play(i) {
        if (over || board[i]) return g.sfx('bad');
        board[i] = turn; moves++;
        g.toast(`${g.name(turn)} → ${NAMES[i]}`, 1500);
        g.sfx('move');
        const line = LINES.find((l) => l.every((k) => board[k] === turn));
        if (line) {
          wins[turn]++; starter = g.other(turn); over = false;
          draw();
          line.forEach((k) => grid.at(Math.floor(k / 3), k % 3).classList.add('win'));
          g.sfx('win');
          setTimeout(newBoard, 1600);
          return;
        }
        if (moves === 9) { starter = g.other(starter); g.sfx('coin'); draw(); g.toast('full board — drawn sight', 1400); setTimeout(newBoard, 1500); return; }
        turn = g.other(turn);
        draw();
      }
      function end() {
        over = true;
        board.forEach((v, i) => { if (v) { grid.at(Math.floor(i / 3), i % 3).innerHTML = ''; grid.at(Math.floor(i / 3), i % 3).appendChild(h('span', { text: v === 1 ? 'X' : 'O', style: { fontWeight: 800, color: v === 1 ? '#1565c0' : '#c62828' } })); } });
        starter = 3 - starter;
        g.turn();
        if (wins[1] === wins[2]) return g.draw(`Three boards, nobody saw more: ${wins[1]} each.`);
        g.win(wins[1] > wins[2] ? 1 : 2, `Blind board ends ${wins[1]}–${wins[2]}.`);
      }
      newBoard();
    },
    onStop() { starter = 3 - starter; },
  });
})();
