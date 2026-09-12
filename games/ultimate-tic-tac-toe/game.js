/* Ultimate Tic-Tac-Toe — 9 small boards; your cell choice sends the opponent to that board. */
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const winner = (cells) => { for (const l of LINES) if (cells[l[0]] && cells[l[0]] !== 3 && cells[l[0]] === cells[l[1]] && cells[l[1]] === cells[l[2]]) return cells[l[0]]; return cells.every((x) => x) ? 3 : 0; };
  let starter = 1;
  Game.init({
    id: 'ultimate-tic-tac-toe',
    rules: ['Nine tic-tac-toe boards arranged as a big board. Win three small boards in a row to win.', 'The cell you pick (its position inside the small board) decides which small board your opponent must play in next.', 'If that board is already won or full, the opponent may play anywhere. Full small boards with no winner count for nobody.'],
    controls: { all: 'Click / tap a cell in the highlighted board' },
    onStart(g) {
      const small = range(9).map(() => Array(9).fill(0));
      const big = Array(9).fill(0);
      let turn = starter, next = -1, moves = 0;
      const size = Math.floor(clamp((Math.min(window.innerWidth, window.innerHeight - 220) - 60) / 9, 22, 44));
      const wrap = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '8px', background: '#0b0d18', padding: '8px', borderRadius: '14px' } });
      const grids = range(9).map((bi) => { const gr = UI.grid({ rows: 3, cols: 3, size, gap: 3, onClick: (r, c) => play(bi, r * 3 + c) }); gr.el.style.position = 'relative'; wrap.appendChild(gr.el); return gr; });
      g.stage.appendChild(wrap);
      function render() {
        grids.forEach((gr, bi) => {
          gr.each((cell, r, c) => { const v = small[bi][r * 3 + c]; cell.textContent = v ? (v === 1 ? 'X' : 'O') : ''; cell.className = 'cell' + (v ? ' p' + v : ''); });
          const active = !g.over && !big[bi] && (next === -1 || next === bi);
          gr.el.style.outline = active ? `3px solid ${g.color(turn)}` : 'none';
          gr.el.style.opacity = active || big[bi] ? '1' : '.55';
          let ov = gr.el.querySelector('.bigmark');
          if (big[bi] && !ov) { ov = h('div', { class: 'bigmark', style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 2.2 + 'px', fontWeight: 900, color: big[bi] === 3 ? '#9aa4c7' : g.color(big[bi]), background: '#1c2238ee', borderRadius: '12px' }, text: big[bi] === 3 ? '–' : big[bi] === 1 ? 'X' : 'O' }); gr.el.appendChild(ov); }
        });
      }
      function play(bi, ci) {
        if (g.over || big[bi] || small[bi][ci] || (next !== -1 && next !== bi)) return g.sfx('bad');
        small[bi][ci] = turn; moves++; g.sfx('move');
        const w = winner(small[bi]);
        if (w) { big[bi] = w; if (w !== 3) g.sfx('score'); }
        const W = winner(big);
        if (W && W !== 3) { render(); starter = 3 - W; return g.win(W, `${esc(g.name(W))} took three boards in a row.`); }
        if (W === 3 || big.every((x) => x)) { const c1 = big.filter((x) => x === 1).length, c2 = big.filter((x) => x === 2).length; render(); starter = 3 - starter; if (c1 === c2) return g.draw('No line on the big board.'); const ww = c1 > c2 ? 1 : 2; return g.win(ww, `More small boards won (${Math.max(c1, c2)}–${Math.min(c1, c2)}).`); }
        next = big[ci] ? -1 : ci;
        turn = 3 - turn; render();
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> plays in ${next === -1 ? 'any board' : 'the highlighted board'}`);
      }
      render(); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> plays anywhere`);
    },
  });
})();
