/* Kōnane — 8×8 Hawaiian checkers. Opening removals, then only orthogonal jump captures. */
(function () {
  const N = 8;
  let starter = 1;
  Game.init({
    id: 'konane',
    rules: ['The board starts full, colours alternating. Player 1 (black) first removes one of their stones from the centre or a corner; Player 2 then removes one of theirs adjacent to that gap.', 'After that, the only legal move is a jump: leap orthogonally over an adjacent enemy stone into an empty square, removing it. Multiple jumps in a straight line are allowed (your choice how far).', 'The first player with no legal jump loses.'],
    controls: { all: 'Click / tap a stone, then a highlighted landing square' },
    points: true,
    onStart(g) {
      const b = range(N).map((r) => range(N).map((c) => ((r + c) % 2 === 0 ? 1 : 2)));
      let turn = starter, phase = 'open1', sel = null, removed = null;
      const grid = UI.grid({ rows: N, cols: N, checker: true, gap: 0, onClick: click });
      g.stage.appendChild(grid.el);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const jumpsFrom = (r, c) => {
        const p = b[r][c]; const out = [];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let rr = r, cc = c; const caps = [];
          while (inb(rr + 2 * dr, cc + 2 * dc) && b[rr + dr][cc + dc] === 3 - p && !b[rr + 2 * dr][cc + 2 * dc]) { caps.push([rr + dr, cc + dc]); rr += 2 * dr; cc += 2 * dc; out.push({ to: [rr, cc], caps: caps.slice() }); }
        }
        return out;
      };
      const anyJump = (p) => b.some((row, r) => row.some((v, c) => v === p && jumpsFrom(r, c).length));
      const count = (p) => b.flat().filter((x) => x === p).length;
      const openCells = () => {
        if (phase === 'open1') return [[0, 0], [N - 1, N - 1], [3, 3], [4, 4], [0, N - 1], [N - 1, 0], [3, 4], [4, 3]].filter(([r, c]) => b[r][c] === turn);
        return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [removed[0] + dr, removed[1] + dc]).filter(([r, c]) => inb(r, c) && b[r][c] === turn);
      };
      function render() {
        grid.each((cell, r, c) => { cell.innerHTML = ''; cell.classList.remove('sel', 'dot', 'hl'); if (b[r][c]) cell.appendChild(h('div', { class: 'piece p' + b[r][c], style: { background: b[r][c] === 1 ? '#151515' : '#f3f3f3', outline: `2px solid ${g.color(b[r][c])}` } })); });
        if (phase.startsWith('open')) openCells().forEach(([r, c]) => grid.at(r, c).classList.add('hl'));
        else if (sel) { grid.at(sel[0], sel[1]).classList.add('sel'); jumpsFrom(sel[0], sel[1]).forEach((j) => grid.at(j.to[0], j.to[1]).classList.add('dot')); }
        g.points(count(1), count(2));
      }
      const label = () => phase.startsWith('open') ? `<span class="pc${turn}">${esc(g.name(turn))}</span>: remove one of your stones` : `<span class="pc${turn}">${esc(g.name(turn))}</span> jumps`;
      function click(r, c) {
        if (g.over) return;
        if (phase.startsWith('open')) {
          if (!openCells().some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
          b[r][c] = 0; removed = [r, c]; g.sfx('capture');
          phase = phase === 'open1' ? 'open2' : 'jump'; turn = 3 - turn; render(); g.turn(turn, label()); return;
        }
        if (sel) { const j = jumpsFrom(sel[0], sel[1]).find((x) => x.to[0] === r && x.to[1] === c); if (j) { b[r][c] = turn; b[sel[0]][sel[1]] = 0; j.caps.forEach(([rr, cc]) => { b[rr][cc] = 0; }); sel = null; g.sfx('capture'); turn = 3 - turn; render(); if (!anyJump(turn)) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} has no jump available.`); } g.turn(turn, label()); return; } }
        if (b[r][c] === turn && jumpsFrom(r, c).length) { sel = [r, c]; g.sfx('click'); } else sel = null;
        render();
      }
      render(); g.turn(turn, label());
      g.stage.appendChild(h('div', { class: 'muted' }, `${g.name(1)} plays black · ${g.name(2)} plays white`));
    },
  });
})();
