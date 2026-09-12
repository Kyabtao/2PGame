/* Notakto — three 3×3 boards, both players place X; a board with three-in-a-row is dead; whoever kills the last board loses. */
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  let starter = 1;
  Game.init({
    id: 'notakto',
    rules: ['Three tic-tac-toe boards. Both players place <b>X</b>s — there are no Os.', 'When a board gets three X in a row it is dead and cannot be played on any more.', 'The player who completes three-in-a-row on the <b>last</b> live board loses.'],
    controls: { all: 'Click / tap an empty cell on a live board' },
    onStart(g) {
      const boards = range(3).map(() => Array(9).fill(0)); const dead = [false, false, false];
      let turn = starter;
      const wrap = h('div', { class: 'row', style: { gap: '1rem' } });
      const grids = boards.map((_, bi) => { const gr = UI.grid({ rows: 3, cols: 3, size: Math.floor(clamp((window.innerWidth - 80) / 9 - 8, 32, 72)), onClick: (r, c) => play(bi, r * 3 + c) }); gr.el.style.position = 'relative'; wrap.appendChild(gr.el); return gr; });
      g.stage.appendChild(wrap);
      g.turn(turn);
      function play(bi, i) {
        if (g.over || dead[bi] || boards[bi][i]) return g.sfx('bad');
        boards[bi][i] = 1; grids[bi].set(Math.floor(i / 3), i % 3, 'X', 'p' + turn); g.sfx('move');
        const line = LINES.find((l) => l.every((k) => boards[bi][k]));
        if (line) {
          dead[bi] = true; line.forEach((k) => grids[bi].at(Math.floor(k / 3), k % 3).classList.add('win'));
          grids[bi].el.appendChild(h('div', { style: { position: 'absolute', inset: 0, background: '#0008', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' } }, '💀'));
          g.sfx('bad');
          if (dead.every(Boolean)) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} killed the last board.`); }
        }
        turn = 3 - turn; g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>'s turn · ${dead.filter((d) => !d).length} board(s) alive`);
      }
    },
  });
})();
