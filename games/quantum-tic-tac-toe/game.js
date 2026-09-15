/* Quantum Tic-Tac-Toe — every turn places an entangled pair of marks; measure the collapse to win. */
(function () {
  let starter = 1;
  Game.init({
    id: 'quantum-tic-tac-toe',
    rules: [
      'A turn is a PAIR: put your mark on two different squares at once. A square may hold at most one mark from each player, so a square can be shared (entangled) or full.',
      'A square with both marks counts for both players until something forces a collapse — that is what makes three-in-a-row tricky.',
      'Complete a line of three squares all holding your mark and you win — unless your rival completes a line on the same turn. Then the cleaner line wins: fewer entangled squares. Equal tangles favour the player who just moved.',
      'A square with a single mark is classical: your rival cannot use it. When nobody can add a pair, the player with more marks on the board wins.',
    ],
    controls: { all: 'Tap two squares to place your pair · <kbd>Z</kbd> undoes the pending square' },
    onStart(g) {
      const marks = range(9).map(() => ({ 1: false, 2: false }));
      let turn = starter, sel = [], pairs = { 1: 0, 2: 0 };
      const grid = UI.grid({ rows: 3, cols: 3, size: 104, gap: 6, onClick: (r, c) => click(r * 3 + c) });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, note);
      const free = (p) => { const o = []; for (let i = 0; i < 9; i++) if (!marks[i][p] && !(marks[i][1] && marks[i][2])) o.push(i); return o; };
      const has = (i, p) => marks[i][p];
      const ent = (i) => marks[i][1] && marks[i][2];
      const LINES = UI.lines(3, 3, 3).map((l) => l);
      const winLines = (p) => LINES.filter((l) => l.every((i) => has(i, p)));
      function render() {
        grid.each((cell, r, c) => {
          const i = r * 3 + c;
          cell.innerHTML = ''; cell.className = 'cell';
          const both = ent(i);
          if (both) {
            cell.appendChild(h('div', { style: { display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 } },
              h('span', { text: 'X', style: { color: g.color(1), fontSize: 'calc(var(--cell) * .42)', fontWeight: 900 } }),
              h('span', { text: 'O', style: { color: g.color(2), fontSize: 'calc(var(--cell) * .42)', fontWeight: 900 } })));
            cell.style.background = 'linear-gradient(135deg, color-mix(in srgb, var(--p1) 26%, var(--surface2)), color-mix(in srgb, var(--p2) 26%, var(--surface2)))';
          } else if (marks[i][1] || marks[i][2]) {
            const p = marks[i][1] ? 1 : 2;
            cell.textContent = p === 1 ? 'X' : 'O';
            cell.classList.add('p' + p);
            cell.style.fontWeight = 900; cell.style.fontSize = 'calc(var(--cell) * .6)';
          } else if (free(turn).length < 2) cell.style.opacity = .6;
          if (sel.includes(i)) cell.classList.add('sel');
          else if (!marks[i][1] && !marks[i][2]) cell.classList.add('dot');
          else if (!both) cell.style.outline = '1px dashed #ffffff18';
        });
        const w1 = winLines(1).length, w2 = winLines(2).length;
        note.innerHTML = `pairs played ${pairs[1]}–${pairs[2]} · ${free(turn).length} squares you can still use${w1 || w2 ? ` · <b>lines standing: ${w1} vs ${w2}</b>` : ''}`;
      }
      function click(i) {
        if (g.over) return;
        if (sel.includes(i)) { sel = sel.filter((x) => x !== i); g.sfx('click'); return render(); }
        if (!marks[i][turn] && !(marks[i][1] && marks[i][2])) {
          sel.push(i); g.sfx('click');
          if (sel.length === 2) commit();
          return render();
        }
        g.sfx('bad');
      }
      function commit() {
        const me = turn, you = 3 - me;
        sel.forEach((i) => { marks[i][me] = true; });
        pairs[me]++; sel = [];
        const mine = winLines(me), yours = winLines(you);
        const tangle = (l) => l.filter(ent).length;
        if (mine.length || yours.length) {
          const best = (arr) => arr.reduce((a, b) => (tangle(b) < tangle(a) ? b : a));
          let winner = 0;
          if (mine.length && !yours.length) winner = me;
          else if (yours.length && !mine.length) winner = you;
          else winner = tangle(best(mine)) <= tangle(best(yours)) ? me : you;   // the mover wins equal collapses
          grid.each((cell, r, c) => { if (ent(r * 3 + c)) cell.classList.add('flash'); });
          const line = best(winner === me ? mine : yours);
          line.forEach((i) => grid.at(Math.floor(i / 3), i % 3).classList.add('win'));
          starter = 3 - starter;
          return g.win(winner, `${winner === me ? 'Your pair collapsed the board' : 'The rival line was cleaner'} — ${line.map((i) => ent(i) ? '⚛' : '◆').join('')} · ${tangle(line)} entangled square${tangle(line) === 1 ? '' : 's'}.`);
        }
        g.sfx('move');
        turn = you;
        if (free(turn).length < 2) {                       // stuck? hand the pair back
          if (free(3 - turn).length < 2) return end();
          g.toast(`${esc(g.name(turn))} cannot form a pair — turn skipped`, 1000);
          turn = 3 - turn;
        }
        g.turn(turn); render();
      }
      function end() {
        starter = 3 - starter;
        if (pairs[1] === pairs[2]) return g.draw(`Both sides entangled ${pairs[1]} pairs with no clean line.`);
        const w = pairs[1] > pairs[2] ? 1 : 2;
        g.win(w, `Squares exhausted — ${pairs[w] * 2} marks held by ${esc(g.name(w))} vs ${pairs[3 - w] * 2}.`);
      }
      g.key('KeyZ', () => { if (sel.length) { sel = []; render(); g.toast('pair cancelled', 600); } });
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
