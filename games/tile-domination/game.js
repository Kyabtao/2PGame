/* Tile Domination — place tiles, then every free cell goes to the nearest tile. */
(function () {
  const N = 7, EACH = 6;
  let starter = 1;
  Game.init({
    id: 'tile-domination',
    rules: [
      `Take turns placing tiles anywhere on the ${N}×${N} field — you get ${EACH} tiles each.`,
      'When both stacks are spent, every empty cell is claimed by the player whose tile is closest (counting steps up, down, left, right).',
      'Cells reached by both sides on the same turn stay neutral. The larger colour wins.',
    ],
    controls: { all: 'Click / tap an empty square to place a tile' },
    points: true,
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0)); // 0 empty, 1/2 tile
      const own = range(N).map(() => Array(N).fill(0)); // owner of each cell after scoring
      let turn = starter, placed = { 1: 0, 2: 0 };
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: play });
      g.stage.append(grid.el);
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(note);

      function score() {
        // multi-source BFS from all tiles; simultaneous arrival = neutral
        const d = range(N).map(() => Array(N).fill(-1));
        const o = range(N).map(() => Array(N).fill(0));
        let q = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c]) { d[r][c] = 0; o[r][c] = b[r][c]; q.push([r, c]); }
        let head = 0;
        while (head < q.length) {
          const [r, c] = q[head++];
          const nxt = [];
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
            if (d[rr][cc] === -1) { d[rr][cc] = d[r][c] + 1; o[rr][cc] = o[r][c]; nxt.push([rr, cc]); }
            else if (d[rr][cc] === d[r][c] + 1 && o[rr][cc] !== o[r][c]) o[rr][cc] = 3; // contested
          }
          // a cell contested at the same depth must be re-propagated as neutral? no: claim stays from the first arrival
          q.push(...nxt);
        }
        const tot = { 1: 0, 2: 0, 3: 0 };
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) tot[o[r][c]]++;
        return { tot, o };
      }

      function render(final) {
        const { tot, o } = score();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const cell = grid.at(r, c);
          cell.innerHTML = ''; cell.className = 'cell';
          if (b[r][c]) { cell.appendChild(h('div', { class: 'piece p' + b[r][c] })); }
          else if (final && o[r][c] !== 3) cell.style.background = o[r][c] === 1 ? 'color-mix(in srgb, var(--p1) 28%, var(--surface2))' : 'color-mix(in srgb, var(--p2) 28%, var(--surface2))';
          else if (final) cell.style.background = 'var(--surface2)';
          if (final) cell.style.opacity = b[r][c] ? 1 : 0.9;
        }
        g.points(tot[1], tot[2]);
        note.textContent = final ? `Territory ${tot[1]} – ${tot[2]} (${tot[3]} neutral)` : `${g.name(turn)} has ${EACH - placed[turn]} tiles left · territory so far ${tot[1]}–${tot[2]}`;
        return tot;
      }

      function play(r, c) {
        if (g.over || b[r][c] || placed[turn] >= EACH) return g.sfx('bad');
        b[r][c] = turn; placed[turn]++;
        g.sfx('move');
        render();
        if (placed[1] + placed[2] === EACH * 2) return end();
        turn = 3 - turn; g.turn(turn);
        render();
      }

      function end() {
        const tot = render(true);
        starter = 3 - starter;
        if (tot[1] === tot[2]) return g.draw(`Dead heat — ${tot[1]} cells each, ${tot[3]} neutral.`);
        g.win(tot[1] > tot[2] ? 1 : 2, `${Math.max(tot[1], tot[2])} cells to ${Math.min(tot[1], tot[2])} (${tot[3]} neutral).`);
      }

      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
