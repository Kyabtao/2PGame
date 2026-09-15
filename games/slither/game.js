/* Slither — two growing snakes on one board; outmanoeuvre or outgrow the rival. */
(function () {
  const N = 8;
  let starter = 1;
  Game.init({
    id: 'slither',
    rules: [
      `Each snake starts in an opposite corner of the ${N}×${N} pond. On your turn grow into an orthogonally adjacent free square.`,
      'Snakes never shrink and never move from their tail — every turn adds one scale, so the board fills up fast.',
      'You may not enter a square already covered by either snake.',
      'No free square beside your head means you lose. If the pond fills up, the longer snake wins.',
    ],
    controls: { all: 'Tap a highlighted square next to your head' },
    points: true,
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      const head = { 1: [0, 0], 2: [N - 1, N - 1] };
      b[0][0] = 1; b[N - 1][N - 1] = 2;
      const len = { 1: 1, 2: 1 };
      let turn = starter, moves = 0;
      const grid = UI.grid({ rows: N, cols: N, gap: 2, onClick: click });
      grid.el.style.background = '#0d2b33';
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, note);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const opts = (p) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [head[p][0] + dr, head[p][1] + dc]).filter(([rr, cc]) => inb(rr, cc) && !b[rr][cc]);
      function render() {
        const o = opts(turn);
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          if (b[r][c]) {
            cell.style.background = `color-mix(in srgb, ${g.color(b[r][c])} ${r === head[b[r][c]][0] && c === head[b[r][c]][1] ? 100 : 55}%, #0d2b33)`;
            if (head[b[r][c]][0] === r && head[b[r][c]][1] === c) cell.appendChild(h('div', { text: b[r][c] === 1 ? '🐍' : '🐍', style: { fontSize: 'calc(var(--cell) * .7)', transform: 'scaleX(-1)' } }));
          } else cell.style.background = '#10333d';
          if (o.some(([rr, cc]) => rr === r && cc === c)) cell.classList.add('dot');
        });
        g.points(len[1], len[2]);
        note.textContent = `scales ${len[1]} vs ${len[2]} · ${moves} of ${N * N} squares covered`;
      }
      function click(r, c) {
        if (g.over) return;
        if (!opts(turn).some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
        b[r][c] = turn; head[turn] = [r, c]; len[turn]++; moves++;
        g.sfx('move'); render();
        if (moves === N * N) return end('The pond is full.');
        turn = 3 - turn;
        if (!opts(turn).length) return end(`${esc(g.name(turn))} ran into a wall of scales.`);
        g.turn(turn); render();
      }
      function end(why) {
        starter = 3 - starter;
        if (len[1] === len[2]) return g.draw(`${why} Both snakes ${len[1]} scales long.`);
        const w = len[1] > len[2] ? 1 : 2;
        g.win(w, `${why} ${len[w]} scales to ${len[3 - w]}.`);
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
