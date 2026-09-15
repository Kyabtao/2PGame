/* Memory Maze — one player hides the walking route, the other probes it square by square. */
(function () {
  const N = 5, MISSES = 12;
  let starter = 1;
  Game.init({
    id: 'memory-maze',
    rules: [
      'The hider walks a hidden route from the left edge to the right edge of a 5×5 maze — one square per column, never lifting diagonally further than one row. The seeker cannot see the trail, only its start.',
      'Seekers pick one square per probe: a hit stays revealed and the trail grows; a miss is branded as a wall. Twelve misses and the maze swallows you — reveal the whole path first and you escape with the round.',
      'Roles swap after every probe round (hider auto-plots on reroll). Best of four rounds; a full escape scores 2, a swallowed seeker 2 to the hider.',
    ],
    controls: { all: 'Hider: 🎲 plot / reroute · Seeker: tap squares to probe' },
    points: true,
    onStart(g) {
      const wins = { 1: 0, 2: 0 };
      let round = 0, over = false, path = [], hits = new Set(), misses = new Set(), hider = 1, seeker = 1, phase = 'plot', revealed = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const gridUI = UI.grid({ rows: N, cols: N, onClick: (r, c) => probe(r, c) });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'r', label: 'round', val: 1 }]);
      wrap.append(info, gridUI.el, btnRow, stat.el);
      function plotPath() {
        path = [];
        let r = Math.floor(Math.random() * N);
        for (let c = 0; c < N; c++) {
          path.push([r, c]);
          const drift = Math.floor(Math.random() * 3) - 1;
          r = Math.max(0, Math.min(N - 1, r + drift));
        }
        hits = new Set(); misses = new Set(); revealed = 1;
      }
      function newRound() {
        round++;
        if (round > 4 || over) return finish();
        hider = round % 2 ? starter : 3 - starter;
        seeker = 3 - hider;
        phase = 'plot';
        plotPath();
        draw();
        g.sfx('capture');
        g.toast(`${esc(g.name(hider))} walks the route… ${esc(g.name(seeker))} gets the probes`, 1600);
        setTimeout(() => { phase = 'seek'; draw(); g.turn(seeker, `<span class="pc${seeker}">${esc(g.name(seeker))}</span> — probe a square`); }, 1200);
      }
      function draw() {
        if (over) return;
        info.innerHTML = `round ${round}/4 · misses ${misses.size}/${MISSES} · path squares ${Math.floor(hits.size * 10 / N) / 2}/${N}`;
        gridUI.each((cell, r, c) => {
          cell.innerHTML = '';
          cell.className = 'cell';
          const i = path.findIndex(([pr, pc]) => pr === r && pc === c);
          if (hits.has(r + ',' + c)) cell.appendChild(h('span', { text: i === 0 ? '▶' : '●', style: { color: '#2e7d32', fontSize: '1.2rem' } }));
          else if (misses.has(r + ',' + c)) cell.appendChild(h('span', { text: '✖', style: { color: '#b71c1c', fontSize: '1.1rem', opacity: .8 } }));
          else if (phase === 'plot' && i === 0) cell.appendChild(h('span', { text: '▶', style: { color: '#2e7d32' } }));
          if (phase === 'plot') void 0;
        });
        btnRow.innerHTML = '';
        if (phase === 'plot') {
          btnRow.appendChild(h('button', { class: 'chip', text: '🎲 reroute', onclick: () => { plotPath(); g.sfx('click'); draw(); } }));
          btnRow.appendChild(h('button', { class: 'btn primary', text: '🥷 send the seeker in', onclick: () => { phase = 'seek'; draw(); } }));
        }
        stat.set('a', wins[1]); stat.set('b', wins[2]); stat.set('r', Math.min(round, 4) + '/4');
        g.points(wins[1], wins[2]);
        g.turn(phase === 'plot' ? hider : seeker, phase === 'plot' ? `<span class="pc${hider}">${esc(g.name(hider))}</span> — the route is plotted in secret` : `<span class="pc${seeker}">${esc(g.name(seeker))}</span> — find the whole trail`);
      }
      function probe(r, c) {
        if (phase !== 'seek' || over) return g.sfx('bad');
        const key = r + ',' + c;
        if (hits.has(key) || misses.has(key)) return g.sfx('bad');
        const i = path.findIndex(([pr, pc]) => pr === r && pc === c);
        if (i >= 0) {
          hits.add(key); g.sfx('coin');
          if (hits.size === N) { wins[seeker] += 2; g.sfx('win'); g.toast('the seeker traced every step — clean escape', 1800); return setTimeout(newRound, 1800); }
        } else {
          misses.add(key); g.sfx('bad');
          if (misses.size >= MISSES) { wins[hider] += 2; g.sfx('explode'); g.toast('the maze swallows the seeker', 1600); return setTimeout(newRound, 1700); }
        }
        draw();
      }
      function finish() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (wins[1] === wins[2]) return g.draw(`Four trips through the maze, nothing gained: ${wins[1]}–${wins[2]}.`);
        g.win(wins[1] > wins[2] ? 1 : 2, `Memory wins the maze duel ${wins[1]}–${wins[2]}.`);
      }
      newRound();
    },
    onStop() { starter = 3 - starter; },
  });
})();
