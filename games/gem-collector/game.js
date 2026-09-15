/* Gem Collector — two miners on an 8×8 field, move one step, gems are worth 1/2/3/5. */
(function () {
  const N = 8, GEMS = 21, CAP = 46;
  const VALS = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 5];
  let starter = 1;
  Game.init({
    id: 'gem-collector',
    rules: [
      `Twenty gems are scattered over the ${N}×${N} field: chips are worth 1, rubies 2, emeralds 3 and the five 💎 diamonds 5.`,
      'On your turn move your miner one square up, down, left or right — you collect whatever gem is on the square you land on.',
      'You may never stand on the same square as your rival, and gems do not come back once taken.',
      `When every gem is claimed, or after ${CAP} moves, the higher wallet wins.`,
    ],
    controls: { all: 'Tap a highlighted neighbouring square' },
    points: true,
    onStart(g) {
      const gem = range(N).map(() => Array(N).fill(0));
      const pos = { 1: [0, 0], 2: [N - 1, N - 1] };
      let left = 0, turn = starter, plies = 0;
      const purse = { 1: 0, 2: 0 };
      while (left < GEMS) { const r = rnd(N), c = rnd(N); if (!gem[r][c] && !(pos[1][0] === r && pos[1][1] === c) && !(pos[2][0] === r && pos[2][1] === c)) { gem[r][c] = pick(VALS); left++; } }
      const ICON = { 1: '⚪', 2: '🔶', 3: '🟢', 5: '💎' };
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: click });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, note);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const steps = (p) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [pos[p][0] + dr, pos[p][1] + dc]).filter(([rr, cc]) => inb(rr, cc) && !(pos[3 - p][0] === rr && pos[3 - p][1] === cc));
      const remaining = () => { let n = 0, v = 0; gem.forEach((row) => row.forEach((x) => { if (x) { n++; v += x; } })); return { n, v }; };
      function render() {
        const opts = steps(turn);
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          if (gem[r][c]) cell.appendChild(h('div', { text: ICON[gem[r][c]], style: { fontSize: 'calc(var(--cell) * .6)' } }));
          if (pos[1][0] === r && pos[1][1] === c) cell.appendChild(h('div', { class: 'piece p1', style: { position: 'absolute', inset: '12%', width: '76%', height: '76%', boxShadow: '0 0 0 2px #fff' } }));
          if (pos[2][0] === r && pos[2][1] === c) cell.appendChild(h('div', { class: 'piece p2', style: { position: 'absolute', inset: '12%', width: '76%', height: '76%', boxShadow: '0 0 0 2px #fff' } }));
          if (opts.some(([rr, cc]) => rr === r && cc === c)) cell.classList.add('dot');
        });
        g.points(purse[1], purse[2]);
        const rem = remaining();
        note.textContent = `${rem.n} gems left (${rem.v} points on the field) · ply ${plies}/${CAP}`;
      }
      function click(r, c) {
        if (g.over || !steps(turn).some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
        pos[turn] = [r, c];
        if (gem[r][c]) { purse[turn] += gem[r][c]; g.sfx(gem[r][c] >= 3 ? 'coin' : 'pop'); gem[r][c] = 0; }
        else g.sfx('move');
        plies++;
        render();
        const rem = remaining();
        if (!rem.n || plies >= CAP) return end(rem);
        turn = 3 - turn; g.turn(turn); render();
      }
      function end(rem) {
        starter = 3 - starter;
        g.status('');
        if (purse[1] === purse[2]) return g.draw(rem && rem.n ? `${CAP} moves and both wallets on ${purse[1]} — the field still held ${rem.n} gems.` : `Every gem claimed and both miners finished on ${purse[1]} points.`);
        const w = purse[1] > purse[2] ? 1 : 2;
        g.win(w, `${purse[w]} points to ${purse[3 - w]}${rem && rem.n ? ` with ${rem.n} gems still buried` : ''}.`);
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
