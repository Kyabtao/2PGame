/* Game of the Amazons — 8×8 variant, 3 amazons each. Move like a queen, then shoot an arrow like a queen. */
(function () {
  const N = 8;
  let starter = 1;
  Game.init({
    id: 'amazons',
    rules: ['Each player has three amazons. On your turn move one amazon like a chess queen (any distance, no jumping).', 'Then, from its new square, shoot an arrow like a queen move. The arrow\'s square is burned for the rest of the game.', 'The first player unable to make a full move (move + shoot) loses.'],
    controls: { all: 'Click / tap an amazon, a destination, then a target for the arrow' },
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0)); // 0 empty, 1/2 amazon, 9 burned
      [[7, 2], [7, 5], [5, 0]].forEach(([r, c]) => { b[r][c] = 1; }); [[0, 2], [0, 5], [2, 7]].forEach(([r, c]) => { b[r][c] = 2; });
      let turn = starter, sel = null, shooting = null;
      const grid = UI.grid({ rows: N, cols: N, checker: true, gap: 0, onClick: click });
      g.stage.appendChild(grid.el);
      const rays = (r, c) => { const out = []; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < N && cc >= 0 && cc < N && !b[rr][cc]) { out.push([rr, cc]); rr += dr; cc += dc; } } return out; };
      const canMove = (p) => b.some((row, r) => row.some((v, c) => v === p && rays(r, c).length));
      function render() {
        grid.each((cell, r, c) => { cell.innerHTML = ''; cell.classList.remove('sel', 'dot'); cell.style.background = ''; if (b[r][c] === 9) cell.style.background = '#111'; else if (b[r][c]) cell.appendChild(h('div', { class: 'piece p' + b[r][c] }, '♛')); });
        if (shooting) { grid.at(shooting[0], shooting[1]).classList.add('sel'); rays(shooting[0], shooting[1]).forEach(([r, c]) => grid.at(r, c).classList.add('dot')); }
        else if (sel) { grid.at(sel[0], sel[1]).classList.add('sel'); rays(sel[0], sel[1]).forEach(([r, c]) => grid.at(r, c).classList.add('dot')); }
      }
      function click(r, c) {
        if (g.over) return;
        if (shooting) {
          if (!rays(shooting[0], shooting[1]).some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
          b[r][c] = 9; shooting = null; g.sfx('hit');
          turn = 3 - turn; render();
          if (!canMove(turn)) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} has no legal move left.`); }
          g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: move an amazon`); return;
        }
        if (sel && rays(sel[0], sel[1]).some(([rr, cc]) => rr === r && cc === c)) { b[r][c] = turn; b[sel[0]][sel[1]] = 0; shooting = [r, c]; sel = null; g.sfx('move'); render(); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: shoot an arrow`); return; }
        if (b[r][c] === turn) { sel = [r, c]; g.sfx('click'); } else sel = null;
        render();
      }
      render(); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: move an amazon`);
    },
  });
})();
