/* MetaSquares — 8×8; score for every square (any size/tilt) whose four corners you own. First to 150 (with a lead of 15) wins. */
(function () {
  const N = 8, TARGET = 150;
  let starter = 1;
  Game.init({
    id: 'metasquares',
    rules: ['Take turns placing a stone on an empty point of the 8×8 grid.', 'Whenever the four corners of a square (any size, straight or tilted) are all yours, you score. Axis-aligned squares of side s score s², tilted squares score by the size of their bounding box.', `First to ${TARGET} points wins (must also lead by 15). If the board fills, the higher score wins.`],
    controls: { all: 'Click / tap an empty point' },
    points: true,
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      const score = { 1: 0, 2: 0 }; const found = new Set();
      let turn = starter, moves = 0;
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: place });
      g.stage.appendChild(grid.el);
      const log = h('div', { class: 'log', style: { maxWidth: '480px' } });
      g.stage.appendChild(log);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      function squaresThrough(r, c, p) {
        const out = [];
        for (let dr = -(N - 1); dr < N; dr++) for (let dc = 0; dc < N; dc++) {
          if (dr === 0 && dc === 0) continue; if (dr <= 0 && dc === 0) continue;
          // vector (dr,dc) is one side; square corners: A, A+v, A+v+w, A+w where w = (-dc, dr)
          const pts = [[r, c], [r + dr, c + dc], [r + dr - dc, c + dc + dr], [r - dc, c + dr]];
          if (!pts.every(([rr, cc]) => inb(rr, cc) && b[rr][cc] === p)) continue;
          const key = pts.map((x) => x.join(',')).sort().join('|');
          if (found.has(key)) continue;
          out.push({ key, pts, size: (Math.abs(dr) + Math.abs(dc)) ** 2 });
        }
        return out;
      }
      function place(r, c) {
        if (g.over || b[r][c]) return g.sfx('bad');
        b[r][c] = turn; moves++; grid.at(r, c).appendChild(h('div', { class: 'piece p' + turn })); g.sfx('move');
        const sqs = squaresThrough(r, c, turn);
        if (sqs.length) {
          let gained = 0; sqs.forEach((s) => { found.add(s.key); gained += s.size; s.pts.forEach(([rr, cc]) => { const cell = grid.at(rr, cc); cell.classList.add('flash'); setTimeout(() => cell.classList.remove('flash'), 500); }); });
          score[turn] += gained; g.points(score[1], score[2]); g.sfx('score');
          log.prepend(h('div', { html: `<span class="pc${turn}">${esc(g.name(turn))}</span> +${gained} (${sqs.length} square${sqs.length > 1 ? 's' : ''})` }));
        }
        const lead = Math.abs(score[1] - score[2]);
        if ((score[turn] >= TARGET && lead >= 15) || moves === N * N) {
          starter = 3 - starter;
          if (score[1] === score[2]) return g.draw(`${score[1]} points each.`);
          const w = score[1] > score[2] ? 1 : 2; return g.win(w, `${score[w]} points to ${score[3 - w]}.`);
        }
        turn = 3 - turn; g.turn(turn);
      }
      g.turn(turn);
    },
  });
})();
