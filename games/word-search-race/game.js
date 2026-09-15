/* Word Search Race — five words hide in the letter field. Point at the head and claim them. */
(function () {
  const N = 8, TRIES = 14;
  const POOL = ['TIGER', 'MANGO', 'RIVER', 'CLOUD', 'STONE', 'BEACH', 'LEMON', 'PIANO', 'ROBOT', 'CANDLE', 'FOREST', 'MARKET', 'PUZZLE', 'WINTER', 'ORANGE', 'GARDEN', 'CASTLE', 'BRIDGE'];
  let starter = 1;
  Game.init({
    id: 'word-search-race',
    rules: [
      'A grid of letters with five words tucked inside — horizontally, vertically, or diagonally downwards, forwards only.',
      'On your turn choose a word from the list, then tap the square where it begins. A correct head-square reveals the whole word and scores +2.',
      'A wrong start costs a point and the clock on your nerve — the word stays hidden.',
      'Every word found, or fourteen turns spent, ends the hunt. Most points wins the race; ties break on words claimed.',
    ],
    controls: { all: 'Tap a word chip, then its first square · ✖ to deselect' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const found = { 1: 0, 2: 0 };
      let grid = [], placed = [], list = [], picked = null, turn = starter, t = 0, over = false, shown = new Set();
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const gridUI = UI.grid({ rows: N, cols: N, onClick: (r, c) => claim(r, c) });
      const chipRow = h('div', { class: 'row wrap', style: { justifyContent: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 't', label: 'turn', val: 1 }]);
      wrap.append(info, gridUI.el, chipRow, stat.el);
      const DIRS = [[0, 1], [1, 0], [1, 1]];
      function build() {
        for (let tries = 0; tries < 40; tries++) {
          grid = range(N).map(() => range(N).map(() => ''));
          placed = [];
          const cand = shuffle(POOL.slice()).slice(0, 5);
          let ok = true;
          for (const w of cand) {
            let spot = null;
            for (let s = 0; s < 200 && !spot; s++) {
              const [dr, dc] = DIRS[Math.floor(Math.random() * 3)];
              const r0 = Math.floor(Math.random() * N), c0 = Math.floor(Math.random() * N);
              const rEnd = r0 + dr * (w.length - 1), cEnd = c0 + dc * (w.length - 1);
              if (rEnd >= N || cEnd >= N || rEnd < 0 || cEnd < 0) continue;
              let fits = true;
              for (let k = 0; k < w.length; k++) {
                const cell = grid[r0 + dr * k][c0 + dc * k];
                if (cell && cell !== w[k]) { fits = false; break; }
              }
              if (fits) spot = { w, r: r0, c: c0, dr, dc };
            }
            if (!spot) { ok = false; break; }
            for (let k = 0; k < w.length; k++) grid[spot.r + spot.dr * k][spot.c + spot.dc * k] = w[k];
            placed.push(spot);
          }
          if (ok) break;
        }
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) grid[r][c] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        list = placed.slice();
        shown = new Set();
      }
      function draw() {
        if (over) return;
        info.innerHTML = `hunt ${t}/${TRIES} · ${list.length - shown.size} word${list.length - shown.size === 1 ? '' : 's'} left · <b class="pc${turn}">${esc(g.name(turn))}</b>${picked ? ` claiming ${picked}` : ''}`;
        gridUI.each((cell, r, c) => {
          cell.innerHTML = '';
          cell.className = 'cell';
          cell.appendChild(h('span', { text: grid[r][c], style: { fontWeight: 700 } }));
          const on = list.find((p) => shown.has(p.w) && p.r === r && p.c === c);
          if (on) cell.appendChild(h('span', { text: '·', style: { fontSize: '.55rem' } }));
        });
        chipRow.innerHTML = '';
        list.filter((p) => !shown.has(p.w)).forEach((p) => {
          const b = h('button', { class: 'chip' + (picked === p.w ? ' on' : ''), text: p.w });
          b.addEventListener('click', () => { picked = p.w; draw(); });
          chipRow.appendChild(b);
        });
        chipRow.appendChild(h('button', { class: 'chip', text: '🎲 spot one', onclick: autoPick }));
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('t', `${t}/${TRIES}`);
        g.points(pts[1], pts[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${picked ? 'tap the head letter' : 'choose a word to hunt'}`);
      }
      function autoPick() {
        const hidden = list.filter((p) => !shown.has(p.w));
        picked = hidden.length ? hidden[Math.floor(Math.random() * hidden.length)].w : null;
        g.sfx('click'); draw();
      }
      function claim(r, c) {
        if (over) return;
        if (!picked) {                                    // one-tap hunting: tapping a square grabs the next unfound word
          const hidden = list.filter((p) => !shown.has(p.w));
          if (!hidden.length) return;
          picked = hidden[0].w;
        }
        const p = list.find((x) => !shown.has(x.w) && x.w === picked && x.r === r && x.c === c);
        t++;
        if (p) {
          shown.add(p.w);
          pts[turn] += 2; found[turn]++;
          g.sfx('win'); g.toast(`found ${p.w}! +2`, 1200);
          picked = null;
          if (shown.size === list.length) return end();
        } else {
          pts[turn] = Math.max(0, pts[turn] - 1);
          g.sfx('bad'); g.toast('no word starts there (−1)', 1100);
          picked = null;
        }
        if (t >= TRIES) return end();
        turn = 3 - turn;
        draw();
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) {
          if (found[1] === found[2]) return g.draw(`The letters beat you both: ${pts[1]} apiece.`);
          return g.win(found[1] > found[2] ? 1 : 2, `Points tied — more words claimed decides it ${found[1]}–${found[2]}.`);
        }
        g.win(pts[1] > pts[2] ? 1 : 2, `Word hunt final: ${pts[1]}–${pts[2]}.`);
      }
      build();
      draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
