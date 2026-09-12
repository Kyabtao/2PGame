/* Gomoku — 15×15, exactly five (or more) in a row wins. */
(function () {
  const N = 15;
  let starter = 1;
  Game.init({
    id: 'gomoku',
    rules: ['Take turns placing a stone on any empty intersection of the 15×15 board.', 'First to make an unbroken line of five (or more) stones wins.', 'Full board without a line is a draw. The loser starts the next round.'],
    controls: { all: 'Click / tap an empty point' },
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      let turn = starter, moves = 0, lastCell = null;
      const grid = UI.grid({ rows: N, cols: N, gap: 1, onClick: play });
      grid.el.style.background = '#c8a15a'; grid.el.style.padding = '4px';
      grid.each((cell) => { cell.style.background = '#d9b46c'; cell.style.borderRadius = '2px'; });
      g.stage.appendChild(grid.el);
      g.turn(turn);
      function play(r, c) {
        if (g.over || b[r][c]) return;
        b[r][c] = turn; moves++;
        if (lastCell) lastCell.classList.remove('hl');
        lastCell = grid.at(r, c);
        lastCell.appendChild(h('div', { class: 'piece', style: { background: turn === 1 ? '#111' : '#fafafa', width: '85%', height: '85%' } }));
        lastCell.classList.add('hl');
        g.sfx('move');
        for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          const cells = [[r, c]];
          for (const s of [1, -1]) { let rr = r + dr * s, cc = c + dc * s; while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr][cc] === turn) { cells.push([rr, cc]); rr += dr * s; cc += dc * s; } }
          if (cells.length >= 5) { cells.forEach(([rr, cc]) => grid.at(rr, cc).classList.add('win')); starter = 3 - turn; return g.win(turn, `Five in a row after ${moves} stones.`); }
        }
        if (moves === N * N) { starter = 3 - starter; return g.draw('The board is full.'); }
        turn = 3 - turn; g.turn(turn);
      }
    },
  });
})();
