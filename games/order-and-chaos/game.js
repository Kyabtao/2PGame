/* Order & Chaos — 6×6; both players may place X or O. Order wants 5 in a row of either; Chaos wants a full board. */
(function () {
  let orderIs = 1;
  Game.init({
    id: 'order-and-chaos',
    rules: ['Played on a 6×6 board. Both players may place <b>either</b> an X or an O on any turn.', '<b>Order</b> wins by making five in a row of the same symbol (either X or O) in any direction.', '<b>Chaos</b> wins if the board fills with no five in a row. Roles swap each round; Order moves first.'],
    controls: { all: 'Pick X or O with the buttons (or <kbd>X</kbd> / <kbd>O</kbd> keys), then click a cell' },
    onStart(g) {
      const ORDER = orderIs, CHAOS = 3 - orderIs;
      const b = range(6).map(() => Array(6).fill(''));
      let turn = ORDER, sym = 'X', moves = 0;
      const grid = UI.grid({ rows: 6, cols: 6, onClick: place });
      const bx = h('button', { class: 'btn big on', text: 'X', onclick: () => setSym('X') }), bo = h('button', { class: 'btn big', text: 'O', onclick: () => setSym('O') });
      g.stage.append(h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Place:'), bx, bo), grid.el, h('div', { class: 'muted' }, `${g.name(ORDER)} is Order (wants five in a row) · ${g.name(CHAOS)} is Chaos (wants a full board)`));
      const roleLabel = (p) => `<span class="pc${p}">${esc(g.name(p))}</span> (${p === ORDER ? 'Order' : 'Chaos'}) plays ${sym}`;
      function setSym(s) { sym = s; bx.classList.toggle('on', s === 'X'); bo.classList.toggle('on', s === 'O'); g.turn(turn, roleLabel(turn)); }
      function fiveLine() { for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) { if (!b[r][c]) continue; for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { const cells = []; for (let k = 0; k < 5; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= 6 || cc < 0 || cc >= 6 || b[rr][cc] !== b[r][c]) break; cells.push([rr, cc]); } if (cells.length === 5) return cells; } } return null; }
      function place(r, c) {
        if (g.over || b[r][c]) return g.sfx('bad');
        b[r][c] = sym; moves++; grid.set(r, c, sym, sym === 'X' ? 'p1' : 'p2'); g.sfx('move');
        const line = fiveLine();
        if (line) { line.forEach(([rr, cc]) => grid.at(rr, cc).classList.add('win')); orderIs = 3 - orderIs; return g.win(ORDER, `Order made five ${sym}s in a row.`); }
        if (moves === 36) { orderIs = 3 - orderIs; return g.win(CHAOS, 'Chaos filled the board without a line.'); }
        turn = 3 - turn; g.turn(turn, roleLabel(turn));
      }
      g.key('KeyX', () => setSym('X')); g.key('KeyO', () => setSym('O'));
      g.turn(turn, roleLabel(turn));
    },
  });
})();
