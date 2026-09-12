/* Tic-Tac-Toe — 3×3, three in a row. */
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  let starter = 1;
  Game.init({
    id: 'tic-tac-toe',
    rules: ['Players alternate placing <b class="pc1">X</b> and <b class="pc2">O</b>.', 'First to get three in a row (horizontal, vertical or diagonal) wins.', 'A full board with no line is a draw. The loser (or the other player after a draw) starts the next round.'],
    controls: { all: 'Click / tap a cell. Keyboard: <kbd>1</kbd>–<kbd>9</kbd> (numpad layout)' },
    onStart(g) {
      const board = Array(9).fill(0);
      let turn = starter; let moves = 0;
      const grid = UI.grid({ rows: 3, cols: 3, size: 96, onClick: (r, c) => play(r * 3 + c) });
      g.stage.appendChild(grid.el);
      g.turn(turn);
      function play(i) {
        if (g.over || board[i]) return;
        board[i] = turn; moves++;
        grid.set(Math.floor(i / 3), i % 3, turn === 1 ? 'X' : 'O', 'p' + turn);
        g.sfx('move');
        const line = LINES.find((l) => l.every((k) => board[k] === turn));
        if (line) {
          line.forEach((k) => grid.at(Math.floor(k / 3), k % 3).classList.add('win'));
          starter = g.other(turn);
          return g.win(turn, `${esc(g.name(turn))} lined up three ${turn === 1 ? 'X' : 'O'}s in ${moves} moves.`);
        }
        if (moves === 9) { starter = g.other(starter); return g.draw('The board is full.'); }
        turn = g.other(turn); g.turn(turn);
      }
      const keys = { Digit7: 0, Digit8: 1, Digit9: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit1: 6, Digit2: 7, Digit3: 8, Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8 };
      g.key(Object.keys(keys), (code) => play(keys[code]));
    },
  });
})();
