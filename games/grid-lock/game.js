/* Grid Lock — one step at a time, the square you leave locks forever. Three locks per player. */
(function () {
  const N = 7, LOCKS = 3;
  let starter = 1;
  Game.init({
    id: 'grid-lock',
    rules: [
      `Two tokens race on a ${N}×${N} field. On your turn move one square up, down, left or right onto a free square.`,
      'The square you leave behind locks over and can never be entered again.',
      'Instead of moving you may slam one of your three locks onto any free square (not the one under either token).',
      'No move left at the start of your turn means you lose — cut your rival off to win.',
    ],
    controls: { all: 'Tap a highlighted square to move · 🔒 then a square to lock' },
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0)); // 0 free, 1/2 token, 3 locked
      const pos = { 1: [0, 0], 2: [N - 1, N - 1] };
      b[0][0] = 1; b[N - 1][N - 1] = 2;
      let turn = starter, locks = { 1: LOCKS, 2: LOCKS }, mode = 'move';
      const grid = UI.grid({ rows: N, cols: N, gap: 4, onClick: click });
      const bar = h('div', { class: 'row' });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, bar, note);
      const chips = UI.chips([], { cls: 'row' });
      bar.appendChild(chips.el);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const steps = (p) => { const [r, c] = pos[p]; return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [r + dr, c + dc]).filter(([rr, cc]) => inb(rr, cc) && !b[rr][cc]); };
      const free = () => { const o = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!b[r][c]) o.push([r, c]); return o; };
      function render() {
        const opts = steps(turn);
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          if (b[r][c] === 3) { cell.style.background = '#0a0e1c'; cell.appendChild(h('div', { text: '🔒', style: { opacity: .35, fontSize: 'calc(var(--cell) * .5)' } })); }
          else if (b[r][c]) cell.appendChild(h('div', { class: 'piece p' + b[r][c], style: { boxShadow: `0 0 0 3px ${g.color(b[r][c])}55` } }));
          if (mode === 'move' && opts.some(([rr, cc]) => rr === r && cc === c)) cell.classList.add('dot');
          if (mode === 'lock' && !b[r][c] && locks[turn] > 0) cell.style.outline = '1px dashed #ffffff30';
        });
        chips.set([
          { label: `🚶 Move`, on: mode === 'move', onClick: () => { mode = 'move'; render(); } },
          { label: `🔒 Lock (${locks[turn]})`, on: mode === 'lock', dis: locks[turn] <= 0, onClick: () => { mode = 'lock'; render(); } },
        ]);
        note.textContent = `${free().length} free squares · ${g.name(1)} ${locks[1]} locks · ${g.name(2)} ${locks[2]} locks`;
      }
      function finish(winner, why) { starter = 3 - starter; g.win(winner, why); }
      function click(r, c) {
        if (g.over) return;
        if (mode === 'lock') {
          if (b[r][c] || locks[turn] <= 0) return g.sfx('bad');
          b[r][c] = 3; locks[turn]--; g.sfx('capture');
          return nextTurn(`locked a square`);
        }
        if (!steps(turn).some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
        const [pr, pc] = pos[turn];
        b[pr][pc] = 3; pos[turn] = [r, c]; b[r][c] = turn;
        g.sfx('move'); mode = 'move';
        nextTurn('moved');
      }
      function nextTurn() {
        render();
        turn = 3 - turn; mode = 'move';
        if (!steps(turn).length) { render(); return finish(3 - turn, `${esc(g.name(turn))} is sealed in with ${free().length} free squares left.`); }
        if (!free().length) return finish(steps(1).length > steps(2).length ? 1 : 2, 'The field is full — the side with more exits wins.');
        g.turn(turn); render();
      }
      g.key('KeyL', () => { mode = mode === 'move' && locks[turn] > 0 ? 'lock' : 'move'; render(); });
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
