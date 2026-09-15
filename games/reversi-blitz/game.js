/* Reversi Blitz — full Othello rules on a 6×6 board with a 60-second clock each. */
(function () {
  const N = 6, CLOCK = 60;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let starter = 1;
  Game.init({
    id: 'reversi-blitz',
    rules: [
      'Othello rules on a 6×6 board: flank enemy discs between two of yours and they flip.',
      'You must move if you can. No legal move means your turn is skipped.',
      'The game ends when the board is full or neither side can move — most discs wins.',
      `Blitz clock: each player has ${CLOCK} seconds in total. Your flag falls, you lose.`,
    ],
    controls: { all: 'Click / tap a highlighted square' },
    points: true,
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      b[2][2] = 2; b[3][3] = 2; b[2][3] = 1; b[3][2] = 1;
      let turn = starter, passed = 0;
      const left = { 1: CLOCK, 2: CLOCK };
      const grid = UI.grid({ rows: N, cols: N, gap: 2, onClick: play });
      grid.el.style.background = '#123c22';
      grid.each((cell) => { cell.style.background = '#1c6b3c'; cell.style.borderRadius = '3px'; });
      const clock = h('div', { class: 'ticker' });
      g.stage.append(grid.el, clock);
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
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c]) grid.at(r, c).appendChild(h('div', { class: 'piece p' + b[r][c], style: { background: b[r][c] === 1 ? '#141414' : '#f7f7f7' } }));
        moves(turn).forEach(([r, c]) => grid.at(r, c).classList.add('dot'));
        const cnt = count(); g.points(cnt[1], cnt[2]);
        sync();
      }
      function sync() {
        const f = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        clock.innerHTML = `<span class="pc1">${esc(g.name(1))} ${f(left[1])}</span> · <span class="pc2">${esc(g.name(2))} ${f(left[2])}</span>`;
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> to move · <span class="${left[turn] <= 10 ? 'pc' + turn : 'muted'}">${f(left[turn])}</span>`);
      }
      g.every(1000, () => {
        if (g.over) return;
        left[turn] = Math.max(0, left[turn] - 1);
        if (!left[turn]) {
          const cnt = count(), loser = turn;
          if (cnt[3 - loser] === cnt[loser]) return g.draw(`Time — ${cnt[1]} discs each, flag fell on a level board.`);
          // Losing on time only costs you the game if you are not ahead on discs.
          if (cnt[loser] > cnt[3 - loser]) return g.draw(`${esc(g.name(loser))} ran out of time while ahead ${cnt[loser]}–${cnt[3 - loser]} — draw.`);
          return g.win(3 - loser, `${esc(g.name(loser))}'s flag fell · ${cnt[1]}–${cnt[2]} discs.`);
        }
        sync();
      });
      function play(r, c) {
        if (g.over) return;
        const f = flips(r, c, turn);
        if (!f.length) return g.sfx('bad');
        b[r][c] = turn; f.forEach(([rr, cc]) => { b[rr][cc] = turn; });
        passed = 0; g.sfx(f.length > 1 ? 'capture' : 'move');
        turn = 3 - turn;
        if (!moves(turn).length) {
          if (!moves(3 - turn).length) { render(); return end(); }
          passed = 1; render(); g.toast(`${esc(g.name(turn))} has no move — pass`, 900); turn = 3 - turn;
        }
        render();
        const cnt = count();
        if (cnt[1] === 0 || cnt[2] === 0) { starter = 3 - starter; return g.win(cnt[1] ? 1 : 2, `Every enemy disc flipped! ${cnt[1]}–${cnt[2]}.`); }
      }
      function end() {
        const cnt = count(); starter = 3 - starter;
        if (cnt[1] === cnt[2]) return g.draw(`${cnt[1]} – ${cnt[2]} discs.`);
        g.win(cnt[1] > cnt[2] ? 1 : 2, `${Math.max(cnt[1], cnt[2])} discs to ${Math.min(cnt[1], cnt[2])}.`);
      }
      g.every(3000, () => { if (!g.over && !moves(turn).length && !passed) { passed = 1; g.toast(`${esc(g.name(3 - turn))} must pass`, 800); } });
      render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
