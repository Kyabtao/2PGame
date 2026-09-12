/* Isolation — 7×7; move like a king, then remove any empty tile. */
(function () {
  const N = 7;
  let starter = 1;
  Game.init({
    id: 'isolation',
    rules: ['Each player has one pawn. On your turn first move it one square in any direction (like a chess king) to an empty tile.', 'Then remove any remaining empty tile from the board.', 'If you cannot move at the start of your turn, you lose.'],
    controls: { all: 'Click / tap a highlighted square to move, then click a tile to remove it' },
    onStart(g) {
      const tiles = range(N).map(() => Array(N).fill(true));
      const pos = { 1: [N - 1, 3], 2: [0, 3] };
      let turn = starter, phase = 'move';
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: click });
      g.stage.appendChild(grid.el);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const occupied = (r, c) => (pos[1][0] === r && pos[1][1] === c) || (pos[2][0] === r && pos[2][1] === c);
      const movesOf = (p) => { const out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const r = pos[p][0] + dr, c = pos[p][1] + dc; if (inb(r, c) && tiles[r][c] && !occupied(r, c)) out.push([r, c]); } return out; };
      function render() {
        grid.each((cell, r, c) => {
          cell.className = 'cell' + (tiles[r][c] ? '' : ' off');
          cell.innerHTML = '';
          if (pos[1][0] === r && pos[1][1] === c) cell.appendChild(h('div', { class: 'piece p1' }, '♟'));
          if (pos[2][0] === r && pos[2][1] === c) cell.appendChild(h('div', { class: 'piece p2' }, '♟'));
        });
        if (phase === 'move') movesOf(turn).forEach(([r, c]) => grid.at(r, c).classList.add('dot'));
      }
      function click(r, c) {
        if (g.over) return;
        if (phase === 'move') {
          if (!movesOf(turn).some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
          pos[turn] = [r, c]; phase = 'remove'; g.sfx('move'); render();
          g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: remove a tile`);
        } else {
          if (!tiles[r][c] || occupied(r, c)) return g.sfx('bad');
          tiles[r][c] = false; g.sfx('capture');
          turn = 3 - turn; phase = 'move'; render();
          if (!movesOf(turn).length) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} is isolated with no moves.`); }
          g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: move your pawn`);
        }
      }
      render(); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: move your pawn`);
    },
  });
})();
