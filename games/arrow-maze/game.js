/* Arrow Maze — rotate the arrow tiles, walk your token to the far goal. */
(function () {
  const N = 5, CAP = 60;
  const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const GLYPH = ['▲', '▶', '▼', '◀'];
  let starter = 1;
  Game.init({
    id: 'arrow-maze',
    rules: [
      'Every square of the 5×5 maze holds an arrow. Two runners start on opposite goals.',
      `On your turn either rotate any arrow a quarter turn clockwise, or step your runner in the direction of the arrow you are standing on.`,
      'You cannot step onto the other runner or off the board, so use the edges to fence your rival in.',
      'Reach the goal square on the opposite side to win. After 60 moves the runner nearest the goal wins.',
    ],
    controls: { all: 'Tap an arrow to rotate it · tap your own runner to step' },
    onStart(g) {
      const a = range(N).map(() => range(N).map(() => rnd(4)));
      const pos = { 1: [2, 0], 2: [2, N - 1] };
      const goal = { 1: [2, N - 1], 2: [2, 0] };
      let turn = starter, plies = 0;
      const grid = UI.grid({ rows: N, cols: N, size: 74, gap: 5, onClick: click });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, note);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const dist = (p) => Math.abs(pos[p][0] - goal[p][0]) + Math.abs(pos[p][1] - goal[p][1]);
      function render() {
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          cell.style.background = 'var(--surface2)';
          const isGoal = goal[1][0] === r && goal[1][1] === c ? 1 : goal[2][0] === r && goal[2][1] === c ? 2 : 0;
          if (isGoal) cell.style.background = `color-mix(in srgb, ${g.color(isGoal)} 18%, var(--surface2))`;
          cell.appendChild(h('div', { text: GLYPH[a[r][c]], style: { fontSize: 'calc(var(--cell) * .62)', color: '#aeb8d8', transition: 'transform .12s' } }));
          const who = pos[1][0] === r && pos[1][1] === c ? 1 : pos[2][0] === r && pos[2][1] === c ? 2 : 0;
          if (who) cell.appendChild(h('div', { class: 'piece p' + who, style: { position: 'absolute', width: '34%', height: '34%', bottom: '4%', right: '4%', boxShadow: `0 0 0 2px ${g.color(who)}` } }));
          if (who === turn) cell.classList.add('hl');
        });
        note.textContent = `ply ${plies}/${CAP} · ${g.name(1)} is ${dist(1)} away · ${g.name(2)} is ${dist(2)} away`;
      }
      function click(r, c) {
        if (g.over) return;
        if (pos[turn][0] === r && pos[turn][1] === c) return step();
        a[r][c] = (a[r][c] + 1) % 4; g.sfx('click');
        plies++; after();
      }
      function step() {
        const [r, c] = pos[turn]; const [dr, dc] = DIRS[a[r][c]];
        const nr = r + dr, nc = c + dc;
        if (!inb(nr, nc)) { g.sfx('bad'); g.toast('Your arrow points off the board', 800); return; }
        if (pos[3 - turn][0] === nr && pos[3 - turn][1] === nc) { g.sfx('bad'); g.toast('Blocked by the other runner', 800); return; }
        pos[turn] = [nr, nc]; g.sfx('move');
        render();
        if (nr === goal[turn][0] && nc === goal[turn][1]) { starter = 3 - starter; return g.win(turn, `${esc(g.name(turn))} followed the arrows home in ${plies + 1} moves.`); }
        plies++; after();
      }
      function after() {
        render();
        if (plies >= CAP) {
          starter = 3 - starter;
          if (dist(1) === dist(2)) return g.draw(`Move limit — both runners ${dist(1)} squares from home.`);
          return g.win(dist(1) < dist(2) ? 1 : 2, `Move limit — ${Math.min(dist(1), dist(2))} squares away vs ${Math.max(dist(1), dist(2))}.`);
        }
        turn = 3 - turn; g.turn(turn); render();
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
