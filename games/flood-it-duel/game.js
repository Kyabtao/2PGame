/* Flood-It Duel — shared 14×14 board; P1 floods from top-left, P2 from bottom-right; most tiles wins. */
(function () {
  let starter = 1;
  const COLORS = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b'];
  Game.init({
    id: 'flood-it-duel',
    rules: ['A shared board of coloured tiles. You start from a corner (top-left vs bottom-right) with your territory being the tiles connected to it of the same colour.', 'On your turn pick a colour: your whole territory changes to it and absorbs any touching tiles of that colour. You can\'t pick your opponent\'s current colour.', 'When the board is fully claimed, the bigger territory wins.'],
    controls: { all: 'Tap a colour button · <kbd>1</kbd>–<kbd>6</kbd>' },
    points: true,
    onStart(g) {
      const N = 14; const board = range(N).map(() => range(N).map(() => rnd(6))); const own = range(N).map(() => Array(N).fill(0));
      own[0][0] = 1; own[N - 1][N - 1] = 2; if (board[0][0] === board[N - 1][N - 1]) board[N - 1][N - 1] = (board[N - 1][N - 1] + 1) % 6;
      let turn = starter;
      const size = UI.fit(N, N, 1);              // 14x14 board, sized to the screen
      const grid = UI.grid({ rows: N, cols: N, size, gap: 1, cls: 'static' });
      const btns = h('div', { class: 'row' }); g.stage.append(grid.el, btns);
      const colorOf = (p) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (own[r][c] === p) return board[r][c]; return -1; };
      const expand = (p) => { const col = colorOf(p); let changed = true; while (changed) { changed = false; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (own[r][c] !== p) continue; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && !own[rr][cc] && board[rr][cc] === col) { own[rr][cc] = p; changed = true; } }); } } };
      expand(1); expand(2);
      const count = (p) => own.flat().filter((o) => o === p).length;
      const render = () => {
        grid.each((cell, r, c) => { cell.style.background = COLORS[board[r][c]]; cell.style.outline = own[r][c] ? `2px solid ${own[r][c] === 1 ? '#fff' : '#000'}` : 'none'; cell.style.outlineOffset = '-2px'; cell.style.opacity = own[r][c] ? 1 : 0.75; });
        btns.innerHTML = ''; COLORS.forEach((col, i) => { const forbidden = i === colorOf(3 - turn) || i === colorOf(turn); btns.appendChild(h('button', { class: 'btn big', style: { background: col, color: '#0009', minWidth: '3rem', opacity: forbidden ? 0.3 : 1 }, text: String(i + 1), disabled: forbidden, onclick: () => play(i) })); });
        g.points(count(1), count(2)); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${count(1)} vs ${count(2)} tiles`);
      };
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'], (c) => play(+c.slice(-1) - 1));
      function play(i) {
        if (g.over || i === colorOf(3 - turn) || i === colorOf(turn)) return;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (own[r][c] === turn) board[r][c] = i;
        expand(turn); g.sfx('move');
        const free = own.flat().filter((o) => !o).length;
        // if a player cannot gain any tile, skip
        if (free === 0 || (!canGain(1) && !canGain(2))) { render(); starter = 3 - starter; const a = count(1), b = count(2); if (a === b) return g.draw(`${a} tiles each.`); return g.win(a > b ? 1 : 2, `${Math.max(a, b)} – ${Math.min(a, b)} tiles.`); }
        turn = 3 - turn; if (!canGain(turn)) { g.toast(`${g.name(turn)} can't expand — skipped`, 900); turn = 3 - turn; }
        render();
      }
      function canGain(p) { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (own[r][c] !== p) continue; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && !own[rr][cc] && board[rr][cc] !== colorOf(3 - p)) return true; } } return false; }
      render();
    },
  });
})();
