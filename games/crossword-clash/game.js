/* Crossword Clash — two clues, one shared letter, a race down the rails. */
(function () {
  const PUZZ = [
    { h: ['BEACH', 'Sandy shore with waves'], v: ['BENCH', 'Park seat in a row'], hi: 0, vi: 0 },
    { h: ['PLANT', 'Grow it in a pot'], v: ['SLANT', 'Tilt or lean over'], hi: 1, vi: 1 },
    { h: ['STORM', 'Weather with thunder'], v: ['SWARM', 'A cloud of bees'], hi: 0, vi: 0 },
    { h: ['LIGHT', 'What lamps give'], v: ['MIGHT', 'Great strength'], hi: 2, vi: 2 },
    { h: ['CRANE', 'Bird or construction lift'], v: ['BRAVE', 'Full of courage'], hi: 1, vi: 1 },
    { h: ['WHALE', 'Ocean’s biggest singer'], v: ['WALTZ', 'Dance in three beats'], hi: 0, vi: 0 },
    { h: ['TRAIN', 'Railway ride'], v: ['GRAIN', 'Wheat, rice, or corn'], hi: 2, vi: 2 },
    { h: ['HAPPY', 'Feeling of joy'], v: ['HARPY', 'Winged myth monster'], hi: 0, vi: 0 },
  ];
  let starter = 1;
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  Game.init({
    id: 'crossword-clash',
    rules: [
      'Two five-letter words cross at one shared square. The across clue belongs to Player 1’s rail, the down clue to Player 2’s — but the crossing letter is fought over by both.',
      'On your turn you fill your next empty letter of your word: three options are shown. A wrong option strikes that attempt out (two strikes = you forfeit the puzzle, your rival completes it alone).',
      'Fill every letter correctly and the puzzle is yours (+3); finishing second still pays +1. The crossing cell must agree with BOTH words — pick it badly and both rails jam.',
      'Five puzzles; the higher word-rail wins the clash.',
    ],
    controls: { all: 'Tap the letter that fits the clue' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const bag = shuffle(PUZZ.slice()).slice(0, 5);
      let i = 0, cur = null, fill = { 1: 0, 2: 0 }, strike = { 1: 0, 2: 0 }, turn = 1, done = { 1: false, 2: false }, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const clueBox = h('div', { class: 'split' });
      const gridEl = h('div', { class: 'col', style: { alignItems: 'center', gap: '2px' } });
      const optRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, clueBox, gridEl, optRow, stat.el);
      function next() {
        if (i >= bag.length || over) return end();
        cur = bag[i];
        fill = { 1: 0, 2: 0 }; strike = { 1: 0, 2: 0 }; done = { 1: false, 2: false };
        turn = starter;
        draw();
        g.sfx('tick');
      }
      const wordOf = (p) => (p === 1 ? cur.h : cur.v);
      function cellState(r, c) {
        // value in grid at r,c from either rail
        if (c === cur.hi && r === cur.vi) {
          const crossed = wordOf(1)[r];
          return wordOf(2)[c] === crossed ? { v: crossed, lock: (fill[1] > r || fill[2] > c) } : { v: '!', lock: false };
        }
        if (r === cur.hi && fill[1] > c) return { v: wordOf(1)[c], lock: true };
        if (c === cur.vi && fill[2] > r) return { v: wordOf(2)[r], lock: true };
        if (r === cur.hi && c === fill[1]) return { v: null, me: 1 };
        if (c === cur.vi && r === fill[2]) return { v: null, me: 2 };
        return { v: null };
      }
      function draw() {
        if (over) return;
        const p = turn;
        info.innerHTML = `puzzle ${i + 1}/${bag.length} · rail <b class="pc${p}">${esc(g.name(p))}</b> — letter ${Math.min(fill[p] + 1, 5)}/5${strike[p] ? ` · strikes ${strike[p]}` : ''}`;
        clueBox.innerHTML = '';
        clueBox.appendChild(h('div', { class: 'side p1' }, h('h3', { text: 'Across (P1)' }), h('div', { text: `${cur.h[1]} → ${cur.h[0]}` })));
        clueBox.appendChild(h('div', { class: 'side p2' }, h('h3', { text: 'Down (P2)' }), h('div', { text: `${cur.v[1]} ↓ ${cur.v[0]}` })));
        gridEl.innerHTML = '';
        for (let r = 0; r < 5; r++) {
          const row = h('div', { class: 'row', style: { gap: '2px' } });
          for (let c = 0; c < 5; c++) {
            const st = cellState(r, c);
            const onCross = r === cur.hi && c === cur.vi;
            const isRail = onCross || (r === cur.hi && c < 5) || (c === cur.vi && r < 5);
            const cell = h('div', { class: 'sq' + (st.lock ? ' dim' : ''), style: { width: '34px', height: '34px', display: 'grid', placeItems: 'center', background: 'var(--panel, #fff)', borderRadius: 4, fontSize: '.95rem', fontWeight: 800, opacity: isRail ? 1 : .25, border: onCross ? '2px solid #e0a800' : '1px solid #999' } });
            if (st.lock) cell.textContent = st.v === '!' ? '✳' : st.v;
            row.appendChild(cell);
          }
          gridEl.appendChild(row);
        }
        optRow.innerHTML = '';
                if (!done[1] && !done[2]) {
          const want = wordOf(p)[fill[p]];
          const wrong = shuffle(alpha.split('').filter((l) => l !== want)).slice(0, 2);
          const opts = shuffle([want, ...wrong]);
          opts.forEach((L) => {
            const b = h('button', { class: 'btn primary', text: L, style: { minWidth: '64px', fontSize: '1.3rem' } });
            b.addEventListener('click', () => letter(p, L));
            optRow.appendChild(b);
          });
          g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> — next letter of the ${p === 1 ? 'ACROSS' : 'DOWN'} word · slot ${fill[p] + 1}`);
        }
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
      }
      function letter(p, L) {
        if (over || (p !== turn) || done[p]) return g.sfx('bad');
        const want = wordOf(p)[fill[p]];
        if (L === want) {
          fill[p]++;
          g.sfx('move');
          if (fill[p] === 5) {
            done[p] = true;
            pts[p] += done[3 - p] ? 1 : 3;
            if (!done[3 - p] && turn !== 3 - p) turn = 3 - p;
            g.toast(`${esc(g.name(p))} completes ${wordOf(p)[0]}${done[3 - p] ? ' (+1)' : ' (+3 first blood)'}`, 1400);
            if (done[1] && done[2]) { i++; setTimeout(next, 700); return draw(); }
            if (done[3 - p]) { i++; setTimeout(next, 600); return draw(); }
            turn = 3 - turn;
          } else turn = 3 - turn;
        } else {
          strike[p]++;
          g.sfx('bad');
          if (strike[p] >= 2) {
            done[p] = true;
            pts[3 - p] += 3;
            g.toast(`${esc(g.name(p))} strikes out — the rail is forfeit`, 1600);
            i++;
            setTimeout(next, 800);
            return draw();
          }
        }
        draw();
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Five puzzles, the rails tie at ${pts[1]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Crossword clash ends ${pts[1]}–${pts[2]}.`);
      }
      next();
    },
    onStop() { starter = 3 - starter; },
  });
})();
