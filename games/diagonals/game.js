/* Diagonals — chain your stones corner to corner using diagonal steps only. */
(function () {
  const N = 7;
  let starter = 1;
  Game.init({
    id: 'diagonals',
    rules: [
      `Players drop stones on the ${N}×${N} board. Diagonal steps only — a chain may move ↘↙↗↖ and nothing else.`,
      `${'Red'} must link the LEFT edge to the RIGHT edge with a chain of their own stones; Blue must link TOP to BOTTOM.`,
      'You may drop a stone anywhere free, so sitting on a square your rival needs is the only way to block them.',
      'The first to complete the link wins — and because moves alternate, whoever finishes it first takes the round. A full board with no link is a draw.',
    ],
    controls: { all: 'Click / tap an empty square' },
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      let turn = starter, moves = 0;
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: play });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } }, `${g.name(1)}: left → right · ${g.name(2)}: top → bottom`);
      g.stage.append(grid.el, note);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      function linked(p) {
        const seen = new Set(); const q = [];
        for (let r = 0; r < N; r++) {
          const s = p === 1 ? [r, 0] : [0, r];
          if (b[s[0]][s[1]] === p) { q.push(s); seen.add(s.join(',')); }
        }
        while (q.length) {
          const [r, c] = q.pop();
          if (p === 1 ? c === N - 1 : r === N - 1) return true;
          for (const [dr, dc] of DIAG) {
            const rr = r + dr, cc = c + dc;
            if (!inb(rr, cc) || b[rr][cc] !== p || seen.has(rr + ',' + cc)) continue;
            seen.add(rr + ',' + cc); q.push([rr, cc]);
          }
        }
        return false;
      }
      function render() {
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          const on = b[r][c];
          cell.style.background = on ? `color-mix(in srgb, ${g.color(on)} 26%, var(--surface2))` : 'var(--surface2)';
          if (on) cell.appendChild(h('div', { class: 'piece p' + on }));
        });
        // highlight the two goal bands
        for (let r = 0; r < N; r++) { grid.at(r, 0).style.boxShadow = 'inset 0 0 0 2px var(--p1)'; grid.at(r, N - 1).style.boxShadow = 'inset 0 0 0 2px var(--p1)'; grid.at(0, r).style.boxShadow = 'inset 0 0 0 2px var(--p2)'; grid.at(N - 1, r).style.boxShadow = 'inset 0 0 0 2px var(--p2)'; }
      }
      function play(r, c) {
        if (g.over || b[r][c]) return g.sfx('bad');
        b[r][c] = turn; moves++; g.sfx('move'); render();
        if (linked(turn)) { starter = 3 - starter; return g.win(turn, `${esc(g.name(turn))} cut a diagonal chain across the board in ${moves} stones.`); }
        if (moves === N * N) { starter = 3 - starter; return g.draw('The board is full — neither chain closed.'); }
        turn = 3 - turn; g.turn(turn); render();
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
