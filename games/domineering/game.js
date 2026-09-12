/* Domineering — 8×8; Player 1 places vertical dominoes, Player 2 horizontal; no move = loss. */
(function () {
  const N = 8;
  let starter = 1;
  Game.init({
    id: 'domineering',
    rules: ['<span class="pc1">Player 1</span> places dominoes <b>vertically</b> (covering two cells stacked), <span class="pc2">Player 2</span> places them <b>horizontally</b>.', 'Dominoes must cover two empty adjacent cells.', 'The first player who cannot place a domino on their turn loses.'],
    controls: { all: 'Hover to preview, click / tap the top (or left) cell of the domino' },
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      let turn = starter, count = 0;
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: place });
      grid.each((cell, r, c) => { cell.addEventListener('mouseenter', () => hover(r, c, true)); cell.addEventListener('mouseleave', () => hover(r, c, false)); });
      g.stage.appendChild(grid.el);
      const second = (r, c, p) => p === 1 ? [r + 1, c] : [r, c + 1];
      const fits = (r, c, p) => { const [r2, c2] = second(r, c, p); return r2 < N && c2 < N && !b[r][c] && !b[r2][c2]; };
      const anyMove = (p) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(r, c, p)) return true; return false; };
      function hover(r, c, on) { if (g.over) return; const [r2, c2] = second(r, c, turn); if (!fits(r, c, turn)) return; [grid.at(r, c), grid.at(r2, c2)].forEach((cell) => { cell.style.background = on ? g.color(turn) + '66' : ''; }); }
      function place(r, c) {
        if (g.over || !fits(r, c, turn)) return g.sfx('bad');
        const [r2, c2] = second(r, c, turn); b[r][c] = turn; b[r2][c2] = turn; count++;
        [grid.at(r, c), grid.at(r2, c2)].forEach((cell) => { cell.style.background = g.color(turn); cell.style.borderRadius = '0'; cell.classList.add('static'); });
        grid.at(r, c).style.borderRadius = turn === 1 ? '10px 10px 0 0' : '10px 0 0 10px'; grid.at(r2, c2).style.borderRadius = turn === 1 ? '0 0 10px 10px' : '0 10px 10px 0';
        g.sfx('move');
        turn = 3 - turn;
        if (!anyMove(turn)) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} has nowhere to place a ${turn === 1 ? 'vertical' : 'horizontal'} domino after ${count} pieces.`); }
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> places a ${turn === 1 ? 'vertical ▯' : 'horizontal ▭'} domino`);
      }
      g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> places a ${turn === 1 ? 'vertical ▯' : 'horizontal ▭'} domino`);
    },
  });
})();
