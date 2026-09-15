/* Star Battle — six zones, one star per row, column and zone, no touching. Out-of-moves loses. */
(function () {
  const N = 6;
  let starter = 1;
  Game.init({
    id: 'star-battle',
    rules: [
      `The ${N}×${N} grid is carved into ${N} random zones (shown by colour). Six stars must be placed in total.`,
      'Every row, every column and every zone may hold exactly ONE star, and no two stars may touch — not even diagonally.',
      'On your turn place a star on any legal square. If you have no legal square left, you lose.',
      'Stars placed by both players stay on the board — the sixth star simply ends the battle.',
    ],
    controls: { all: 'Tap a highlighted square to place a star' },
    onStart(g) {
      // build zones: N seeds grown one cell at a time (breadth-first, random order)
      const zone = range(N).map(() => Array(N).fill(-1));
      const front = [];
      for (let z = 0; z < N; z++) { let r, c, guard = 0; do { r = rnd(N); c = rnd(N); guard++; } while (zone[r][c] >= 0 && guard < 60); if (zone[r][c] < 0) { zone[r][c] = z; front.push([z, r, c]); } }
      while (front.length) {
        const i = rnd(front.length); const [z, r, c] = front.splice(i, 1)[0];
        const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        let moved = false;
        for (const [dr, dc] of dirs) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= N || cc < 0 || cc >= N || zone[rr][cc] >= 0) continue;
          zone[rr][cc] = z; front.push([z, rr, cc]); moved = true; break;
        }
        if (!moved) { for (const [dr, dc] of dirs) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && zone[rr][cc] < 0) { zone[rr][cc] = z; front.push([z, rr, cc]); break; } } }
      }
      // fill any orphan cells (disconnected zone leftovers) into a neighbour's zone
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (zone[r][c] < 0) {
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && zone[rr][cc] >= 0) { zone[r][c] = zone[rr][cc]; break; } }
        if (zone[r][c] < 0) zone[r][c] = 0;
      }
      const b = range(N).map(() => Array(N).fill(0));
      let turn = starter, stars = 0;
      const grid = UI.grid({ rows: N, cols: N, gap: 4, onClick: click });
      const TINT = ['#3a4a7a', '#4a3a6a', '#2f5a4a', '#5a3f33', '#33526a', '#4f4a2f'];
      const note = h('div', { class: 'muted', style: { fontSize: '.82rem' } });
      g.stage.append(grid.el, note);
      const busy = () => { const rows = Array(N).fill(0), cols = Array(N).fill(0), zs = Array(N).fill(0); const occ = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c]) { rows[r]++; cols[c]++; zs[zone[r][c]]++; occ.push([r, c]); } return { rows, cols, zs, occ }; };
      function legal(r, c, st) {
        if (b[r][c]) return false;
        if (st.rows[r] || st.cols[c] || st.zs[zone[r][c]]) return false;
        return !st.occ.some(([rr, cc]) => Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1);
      }
      function all() { const st = busy(); const o = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (legal(r, c, st)) o.push([r, c]); return o; }
      function render() {
        const st = busy();
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          cell.style.background = TINT[zone[r][c]];
          cell.appendChild(h('span', { text: String(zone[r][c] + 1), style: { position: 'absolute', top: 2, left: 3, fontSize: '.55rem', opacity: .4 } }));
          if (b[r][c]) { cell.appendChild(h('div', { text: '⭐', style: { fontSize: 'calc(var(--cell) * .62)', color: g.color(b[r][c]), textShadow: `0 0 10px ${g.color(b[r][c])}` } })); cell.classList.add('p' + b[r][c]); }
          else if (legal(r, c, st)) cell.classList.add('dot');
        });
        note.textContent = `${stars}/${N} stars placed · ${all().length} legal squares left for ${g.name(turn)}`;
      }
      function click(r, c) {
        if (g.over) return;
        if (!legal(r, c, busy())) return g.sfx('bad');
        b[r][c] = turn; stars++; g.sfx('score');
        render();
        if (stars === N) { starter = 3 - starter; return g.win(turn, `The sixth star completes the puzzle — placed by ${esc(g.name(turn))}.`); }
        turn = 3 - turn;
        if (!all().length) { starter = 3 - starter; return g.win(3 - turn, `${esc(g.name(turn))} has no legal square left (${stars} of ${N} stars placed).`); }
        g.turn(turn); render();
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
