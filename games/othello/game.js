/* Othello / Reversi — 8×8, flanking captures, pass when no moves. */
(function () {
  const N = 8; const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let starter = 1;
  Game.init({
    id: 'othello',
    rules: ['Place a disc so that one or more enemy discs are flanked in a straight line between your new disc and another of yours. Those discs flip.', 'You must move if you can; if you have no legal move your turn is skipped.', 'When neither player can move the game ends; the player with more discs wins.'],
    controls: { all: 'Click / tap a highlighted square' },
    points: true,
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      b[3][3] = 2; b[4][4] = 2; b[3][4] = 1; b[4][3] = 1;
      let turn = starter;
      const grid = UI.grid({ rows: N, cols: N, gap: 2, onClick: play });
      grid.el.style.background = '#14532d';
      grid.each((cell) => { cell.style.background = '#1e7d43'; cell.style.borderRadius = '3px'; });
      g.stage.appendChild(grid.el);
      const flips = (r, c, p) => {
        if (b[r][c]) return [];
        const out = [];
        for (const [dr, dc] of DIRS) {
          const line = []; let rr = r + dr, cc = c + dc;
          while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr][cc] === 3 - p) { line.push([rr, cc]); rr += dr; cc += dc; }
          if (line.length && rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr][cc] === p) out.push(...line);
        }
        return out;
      };
      const moves = (p) => { const m = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (flips(r, c, p).length) m.push([r, c]); return m; };
      const count = () => { const o = { 1: 0, 2: 0 }; b.forEach((row) => row.forEach((v) => { if (v) o[v]++; })); return o; };
      function render() {
        grid.clear();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c]) grid.at(r, c).appendChild(h('div', { class: 'piece p' + b[r][c], style: { background: b[r][c] === 1 ? '#111' : '#f5f5f5' } }));
        moves(turn).forEach(([r, c]) => grid.at(r, c).classList.add('dot'));
        const cnt = count(); g.points(cnt[1], cnt[2]);
      }
      function play(r, c) {
        if (g.over) return;
        const f = flips(r, c, turn);
        if (!f.length) return g.sfx('bad');
        b[r][c] = turn; f.forEach(([rr, cc]) => { b[rr][cc] = turn; });
        g.sfx('move');
        turn = 3 - turn;
        if (!moves(turn).length) {
          turn = 3 - turn;
          if (!moves(turn).length) { render(); return end(); }
          render(); g.toast(`${esc(g.name(3 - turn))} has no move — pass`, 1000); g.turn(turn); return;
        }
        render(); g.turn(turn);
      }
      function end() {
        const cnt = count();
        starter = 3 - starter;
        if (cnt[1] === cnt[2]) return g.draw(`${cnt[1]} – ${cnt[2]} discs.`);
        const w = cnt[1] > cnt[2] ? 1 : 2;
        g.win(w, `${cnt[w]} discs to ${cnt[3 - w]}.`);
      }
      render(); g.turn(turn);
      g.stage.appendChild(h('div', { class: 'muted', style: { fontSize: '.85rem' } }, `${g.name(1)} plays black · ${g.name(2)} plays white`));
    },
  });
})();
