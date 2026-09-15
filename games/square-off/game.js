/* Square Off — dot grid, four corners of any axis-aligned square wins its area in points. */
(function () {
  const N = 6;
  let starter = 1;
  Game.init({
    id: 'square-off',
    rules: [
      'Players alternate claiming dots on the 6×6 grid — X and O.',
      'You score every square (any size, sides horizontal/vertical) whose four corners are yours and which was not scored before.',
      'A square of side 1 scores 1 point, side 2 scores 4, side 3 scores 9, up to 25 for the full board.',
      'Completing a square earns you another move. When every dot is taken the higher score wins.',
    ],
    controls: { all: 'Click / tap an empty dot' },
    points: true,
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      const done = new Set();
      let turn = starter, moves = 0;
      const sc = { 1: 0, 2: 0 };
      const grid = UI.grid({ rows: N, cols: N, gap: 8, onClick: play });
      grid.el.style.background = '#241d14';
      grid.each((cell) => { cell.style.background = 'transparent'; cell.classList.add('static'); });
      const log = h('div', { class: 'log', style: { maxWidth: '420px' } });
      g.stage.append(grid.el, log);
      // draw a dot in the middle of each cell
      grid.each((cell) => cell.appendChild(h('div', { style: { width: '26%', height: '26%', borderRadius: '50%', background: '#cfd6ea', margin: 'auto', transition: 'background .15s' } })));
      const dots = () => { const out = []; grid.each((cell, r, c) => out[r * N + c] = cell.firstChild); return out; };
      const dotEl = dots();

      function squares(r, c, p) {
        const hits = [];
        for (let s = 1; s < N; s++) {
          for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            const r2 = r + dr * s, c2 = c + dc * s, r3 = r + (dc ? dc * s : dr * s), c3 = c + (dr ? dr * s : dc * s);
            // corners: (r,c), (r2,c), (r,c2), (r2,c2)
            if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) continue;
            if (b[r2][c] === p && b[r][c2] === p && b[r2][c2] === p) {
              const top = Math.min(r, r2), lft = Math.min(c, c2);
              const id = `${top},${lft},${s}`;
              if (!done.has(id)) { done.add(id); hits.push({ s, id, cells: [[top, lft], [top, lft + s], [top + s, lft], [top + s, lft + s]] }); }
            }
          }
        }
        return hits;
      }

      function render() {
        grid.each((cell, r, c) => {
          const on = b[r][c];
          dotEl[r * N + c].style.background = on ? g.color(on) : '#cfd6ea';
          cell.classList.toggle('hl', !!on);
          if (on) cell.style.setProperty('--pc', g.color(on));
        });
        g.points(sc[1], sc[2]);
      }

      function play(r, c) {
        if (g.over || b[r][c]) return g.sfx('bad');
        b[r][c] = turn; moves++;
        const hits = squares(r, c, turn);
        if (hits.length) {
          let pts = 0;
          hits.forEach((q) => {
            pts += q.s * q.s;
            q.cells.forEach(([rr, cc]) => grid.at(rr, cc).classList.add('win'));
            setTimeout(() => grid.each((cell) => cell.classList.remove('win')), 700);
          });
          sc[turn] += pts;
          g.sfx('score');
          log.prepend(h('div', { html: `<b class="pc${turn}">${esc(g.name(turn))}</b> ${hits.map((q) => `${q.s}×${q.s}`).join(' + ')} = +${pts}` }));
        } else g.sfx('move');
        render();
        if (moves === N * N) return end();
        if (!hits.length) turn = 3 - turn;
        g.turn(turn, hits.length ? `<span class="pc${turn}">${esc(g.name(turn))}</span> scores — go again!` : undefined);
        render();
      }

      function end() {
        starter = 3 - starter;
        if (sc[1] === sc[2]) return g.draw(`All dots taken — ${sc[1]} points each.`);
        const w = sc[1] > sc[2] ? 1 : 2;
        g.win(w, `${sc[w]} points to ${sc[3 - w]}.`);
      }

      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
