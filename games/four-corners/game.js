/* Four Corners — win the four 3×3 quadrants; the board's corner squares count double. */
(function () {
  const N = 6;
  let starter = 1;
  Game.init({
    id: 'four-corners',
    rules: [
      'The 6×6 field is split into four 3×3 zones — the corners of the board.',
      'A zone belongs to whoever has the more stones in it. The four corner squares of the board are worth two stones.',
      'You may not play in the zone your rival just played in, unless every other zone is full.',
      'After 36 stones, the player holding more zones wins. Equal zones → count the stones.',
    ],
    controls: { all: 'Click / tap an empty square' },
    points: true,
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      let turn = starter, moves = 0, lastZone = -1;
      const zone = (r, c) => (r < 3 ? 0 : 2) + (c < 3 ? 0 : 1);
      const weight = (r, c) => ((r === 0 || r === N - 1) && (c === 0 || c === N - 1)) ? 2 : 1;
      const grid = UI.grid({ rows: N, cols: N, gap: 4, onClick: play });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, note);
      const tally = () => {
        const z = range(4).map(() => ({ 1: 0, 2: 0 })); const tot = { 1: 0, 2: 0 };
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c]) { z[zone(r, c)][b[r][c]] += weight(r, c); tot[b[r][c]] += weight(r, c); }
        const won = { 1: 0, 2: 0, 0: 0 };
        z.forEach((q) => won[q[1] === q[2] ? 0 : q[1] > q[2] ? 1 : 2]++);
        return { z, tot, won };
      };
      function render() {
        const { z, tot, won } = tally();
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          const zz = zone(r, c), lead = z[zz][1] === z[zz][2] ? 0 : (z[zz][1] > z[zz][2] ? 1 : 2);
          cell.style.background = c === 2 ? 'var(--bg2)' : '';
          if (b[r][c]) cell.appendChild(h('div', { class: 'piece p' + b[r][c] }));
          if (lead && !b[r][c]) cell.style.boxShadow = `inset 0 0 0 2px ${g.color(lead)}55`;
          if (weight(r, c) === 2) cell.append(h('span', { text: '★', style: { position: 'absolute', top: '1px', right: '3px', fontSize: '.6rem', opacity: .5 } }));
        });
        g.points(won[1], won[2]);
        note.textContent = `Zones ${won[1]}–${won[2]}${won[0] ? ` · ${won[0]} tied` : ''} · weighted stones ${tot[1]}–${tot[2]}`;
      }
      function play(r, c) {
        if (g.over || b[r][c]) return g.sfx('bad');
        if (lastZone >= 0 && zone(r, c) === lastZone) {
          const open = [];
          for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) if (!b[rr][cc] && zone(rr, cc) !== lastZone) open.push(1);
          if (open.length) { g.sfx('bad'); g.toast('Not in the zone your rival just used', 900); return; }
        }
        b[r][c] = turn; moves++; lastZone = zone(r, c);
        g.sfx('move'); render();
        if (moves === N * N) return end();
        turn = 3 - turn; g.turn(turn); render();
      }
      function end() {
        const { tot, won } = tally(); starter = 3 - starter;
        if (won[1] !== won[2]) return g.win(won[1] > won[2] ? 1 : 2, `${Math.max(won[1], won[2])} zones to ${Math.min(won[1], won[2])}.`);
        if (tot[1] !== tot[2]) return g.win(tot[1] > tot[2] ? 1 : 2, `Zones tied ${won[1]}–${won[2]} — more stones ${Math.max(tot[1], tot[2])} vs ${Math.min(tot[1], tot[2])}.`);
        g.draw(`Everything level: ${won[1]} zones and ${tot[1]} stones each.`);
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
