/* Checkers (English draughts) — mandatory captures, multi-jumps, kings. */
(function () {
  const N = 8;
  let starter = 1;
  Game.init({
    id: 'checkers',
    rules: ['Men move diagonally forward one square; kings move diagonally in any direction.', 'Captures are mandatory: jump over an adjacent enemy piece onto the empty square beyond. Multi-jumps continue with the same piece.', 'Reach the far row to crown a king. Win by capturing all enemy pieces or leaving the opponent without a legal move.', 'Player 1 (red) moves up the board, Player 2 (blue) moves down. 40 moves without a capture is a draw.'],
    controls: { all: 'Click / tap a piece, then a highlighted destination' },
    onStart(g) {
      // board[r][c]: 0 empty, {p, k}
      const b = range(N).map(() => Array(N).fill(null));
      for (let r = 0; r < 3; r++) for (let c = 0; c < N; c++) if ((r + c) % 2 === 1) b[r][c] = { p: 2, k: false };
      for (let r = 5; r < N; r++) for (let c = 0; c < N; c++) if ((r + c) % 2 === 1) b[r][c] = { p: 1, k: false };
      let turn = starter, sel = null, mustJumpWith = null, quiet = 0;
      const grid = UI.grid({ rows: N, cols: N, checker: true, gap: 0, onClick: click });
      g.stage.appendChild(grid.el);
      const dirs = (pc) => pc.k ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : (pc.p === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      function movesFor(r, c) {
        const pc = b[r][c]; if (!pc) return { jumps: [], steps: [] };
        const jumps = [], steps = [];
        for (const [dr, dc] of dirs(pc)) {
          const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
          if (inb(r1, c1) && !b[r1][c1]) steps.push({ r: r1, c: c1 });
          if (inb(r2, c2) && b[r1][c1] && b[r1][c1].p !== pc.p && !b[r2][c2]) jumps.push({ r: r2, c: c2, cap: [r1, c1] });
        }
        return { jumps, steps };
      }
      function allMoves(p) {
        let jumps = [], steps = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c] && b[r][c].p === p) { const m = movesFor(r, c); m.jumps.forEach((x) => jumps.push({ from: [r, c], to: x })); m.steps.forEach((x) => steps.push({ from: [r, c], to: x })); }
        return jumps.length ? { list: jumps, jump: true } : { list: steps, jump: false };
      }
      function render() {
        grid.clear();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const pc = b[r][c]; if (pc) grid.at(r, c).appendChild(h('div', { class: `piece p${pc.p}${pc.k ? ' king' : ''}` })); }
        if (sel) {
          grid.at(sel[0], sel[1]).classList.add('sel');
          legal().filter((m) => m.from[0] === sel[0] && m.from[1] === sel[1]).forEach((m) => grid.at(m.to.r, m.to.c).classList.add('dot'));
        }
        const cnt = count();
        g.points(cnt[1], cnt[2]);
      }
      function count() { const o = { 1: 0, 2: 0 }; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c]) o[b[r][c].p]++; return o; }
      function legal() {
        if (mustJumpWith) return movesFor(mustJumpWith[0], mustJumpWith[1]).jumps.map((x) => ({ from: mustJumpWith, to: x }));
        return allMoves(turn).list;
      }
      function click(r, c) {
        if (g.over) return;
        const L = legal();
        const pc = b[r][c];
        if (sel) {
          const m = L.find((x) => x.from[0] === sel[0] && x.from[1] === sel[1] && x.to.r === r && x.to.c === c);
          if (m) return doMove(m);
        }
        if (pc && pc.p === turn && !mustJumpWith && L.some((x) => x.from[0] === r && x.from[1] === c)) { sel = [r, c]; g.sfx('click'); render(); return; }
        if (!mustJumpWith) { sel = null; render(); }
      }
      function doMove(m) {
        const pc = b[m.from[0]][m.from[1]];
        b[m.from[0]][m.from[1]] = null; b[m.to.r][m.to.c] = pc;
        let crowned = false;
        if (!pc.k && ((pc.p === 1 && m.to.r === 0) || (pc.p === 2 && m.to.r === N - 1))) { pc.k = true; crowned = true; }
        if (m.to.cap) { b[m.to.cap[0]][m.to.cap[1]] = null; quiet = 0; g.sfx('capture'); } else { quiet++; g.sfx('move'); }
        if (m.to.cap && !crowned && movesFor(m.to.r, m.to.c).jumps.length) { mustJumpWith = [m.to.r, m.to.c]; sel = mustJumpWith; render(); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> jumps again`); return; }
        mustJumpWith = null; sel = null;
        const cnt = count();
        if (!cnt[g.other(turn)]) { render(); starter = g.other(starter); return g.win(turn, `All of ${esc(g.name(g.other(turn)))}'s pieces were captured.`); }
        turn = g.other(turn);
        if (!allMoves(turn).list.length) { render(); starter = g.other(starter); return g.win(g.other(turn), `${esc(g.name(turn))} has no legal moves.`); }
        if (quiet >= 40) { render(); starter = g.other(starter); return g.draw('40 moves without a capture.'); }
        render(); g.turn(turn);
      }
      render(); g.turn(turn);
    },
    points: true,
  });
})();
