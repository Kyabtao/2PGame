/* Fox & Hounds — 8×8 dark squares; fox moves diagonally any direction, hounds only forward (down). Roles swap each round. */
(function () {
  const N = 8;
  let foxPlayer = 1;
  Game.init({
    id: 'fox-and-hounds',
    rules: ['Played on the dark squares. The fox starts at the bottom, four hounds start on the top row.', 'The fox moves one square diagonally in any direction. Hounds move one square diagonally <b>downward</b> only. No captures.', 'The fox wins by reaching the top row (or if the hounds cannot move). The hounds win by trapping the fox so it cannot move.', 'Roles swap every round. The fox moves first.'],
    controls: { all: 'Click / tap a piece, then a highlighted square' },
    onStart(g) {
      const foxP = foxPlayer, houndP = 3 - foxPlayer;
      let fox = [N - 1, 0]; const hounds = [[0, 1], [0, 3], [0, 5], [0, 7]];
      let turn = foxP, sel = null;
      const grid = UI.grid({ rows: N, cols: N, checker: true, gap: 0, onClick: click });
      g.stage.appendChild(grid.el);
      g.stage.appendChild(h('div', { class: 'muted' }, `🦊 ${g.name(foxP)} is the fox · 🐕 ${g.name(houndP)} runs the hounds`));
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const occ = (r, c) => (fox[0] === r && fox[1] === c) || hounds.some(([hr, hc]) => hr === r && hc === c);
      const foxMoves = () => [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([dr, dc]) => [fox[0] + dr, fox[1] + dc]).filter(([r, c]) => inb(r, c) && !occ(r, c));
      const houndMoves = (i) => [[1, -1], [1, 1]].map(([dr, dc]) => [hounds[i][0] + dr, hounds[i][1] + dc]).filter(([r, c]) => inb(r, c) && !occ(r, c));
      function render() {
        grid.each((cell) => { cell.innerHTML = ''; cell.classList.remove('sel', 'dot'); });
        grid.at(fox[0], fox[1]).appendChild(h('div', { class: 'piece p' + foxP }, '🦊'));
        hounds.forEach(([r, c]) => grid.at(r, c).appendChild(h('div', { class: 'piece p' + houndP }, '🐕')));
        if (sel !== null) { const from = sel === 'fox' ? fox : hounds[sel]; grid.at(from[0], from[1]).classList.add('sel'); (sel === 'fox' ? foxMoves() : houndMoves(sel)).forEach(([r, c]) => grid.at(r, c).classList.add('dot')); }
      }
      function click(r, c) {
        if (g.over) return;
        if (turn === foxP) {
          if (foxMoves().some(([rr, cc]) => rr === r && cc === c)) { fox = [r, c]; g.sfx('move'); sel = null; if (r === 0) { render(); foxPlayer = 3 - foxPlayer; return g.win(foxP, 'The fox slipped past the hounds!'); } turn = houndP; render(); if (!hounds.some((_, i) => houndMoves(i).length)) { foxPlayer = 3 - foxPlayer; return g.win(foxP, 'The hounds are stuck.'); } g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> moves a hound`); return; }
          if (fox[0] === r && fox[1] === c) { sel = 'fox'; g.sfx('click'); } render(); return;
        }
        if (typeof sel === 'number' && houndMoves(sel).some(([rr, cc]) => rr === r && cc === c)) { hounds[sel] = [r, c]; sel = null; g.sfx('move'); turn = foxP; render(); if (!foxMoves().length) { foxPlayer = 3 - foxPlayer; return g.win(houndP, 'The fox is trapped!'); } g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> moves the fox`); return; }
        const hi = hounds.findIndex(([hr, hc]) => hr === r && hc === c);
        if (hi >= 0) { sel = hi; g.sfx('click'); } else sel = null;
        render();
      }
      render(); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> moves the fox`);
    },
  });
})();
