/* Math Duel — Countdown numbers round, played as a spotting race: find the exact expression. */
(function () {
  const ROUNDS = 5;
  let starter = 1;
  function puzzle() {
    const big = [25, 50, 75, 100];
    const small = [];
    for (let i = 0; i < 2; i++) small.push(1 + Math.floor(Math.random() * 10));
    const nums = shuffle([...big.slice(0, 2), ...small, 1 + Math.floor(Math.random() * 10), 1 + Math.floor(Math.random() * 10)]);
    const target = 105 + Math.floor(Math.random() * 800);
    // enumerate 2- and 3-number expressions with readable texts
    const ops = (ta, tb, a, b) => [
      { v: a + b, txt: `${ta}+${tb}` }, { v: a - b, txt: `${ta}−${tb}` }, { v: b - a, txt: `${tb}−${ta}` }, { v: a * b, txt: `${ta}×${tb}` },
      ...(b && a % b === 0 ? [{ v: a / b, txt: `${ta}÷${tb}` }] : []),
      ...(a && b % a === 0 ? [{ v: b / a, txt: `${tb}÷${ta}` }] : []),
    ];
    const cands = [];
    for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) for (const e of ops(String(nums[i]), String(nums[j]), nums[i], nums[j])) if (e.v > 0) cands.push({ v: e.v, txt: e.txt, used: [i, j] });
    for (let i = 0; i < nums.length; i++) for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      for (let k = 0; k < nums.length; k++) {
        if (k === i || k === j) continue;
        for (const e1 of ops(String(nums[i]), String(nums[j]), nums[i], nums[j])) {
          for (const e2 of ops(`(${e1.txt})`, String(nums[k]), e1.v, nums[k])) if (e2.v > 0 && Number.isInteger(e2.v)) cands.push({ v: e2.v, txt: e2.txt, used: [i, j, k] });
        }
      }
    }
    const seen = new Set();
    for (let i = cands.length - 1; i >= 0; i--) { if (seen.has(cands[i].txt)) cands.splice(i, 1); else seen.add(cands[i].txt); }
    const exact = cands.filter((c) => c.v === target);
    const near = cands.filter((c) => c.v !== target).sort((a, b) => Math.abs(a.v - target) - Math.abs(b.v - target));
    const opts = [];
    if (exact.length) opts.push({ ...exact[0], hit: true });
    opts.push({ ...near[0], miss: true }, { ...near[1] });
    const decoys = shuffle(near.slice(2, 40)).slice(0, 2).map((c) => ({ ...c, miss: true }));
    const shown = shuffle([...opts, ...decoys].slice(0, 4).map((c) => ({ ...c, d: Math.abs(c.v - target) })));
    return { nums, target, shown, anyExact: exact.length > 0 };
  }
  Game.init({
    id: 'math-duel',
    rules: [
      'A Countdown board: six numbers, a three-figure target. The engine lays four candidate expressions on the table — secretly one may hit the target dead-on, none might.',
      'Alternating picks from the four: grab the exact expression and you take the round (+3). A near-miss shows its distance and burns your claim.',
      'If the board holds no exact expression at all, the closest distance wins the round (2 points, or 1-1 when tied).',
      'Five rounds; the arithmetician with more points takes the duel.',
    ],
    controls: { all: 'Tap an expression to claim it' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let r = 0, turn = starter, cur = null, claimed = {}, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const nums = h('div', { class: 'row' });
      const optRow = h('div', { class: 'col', style: { gap: '.35rem', alignItems: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'r', label: 'round', val: 1 }]);
      wrap.append(info, nums, optRow, stat.el);
      function next() {
        r++;
        if (r > ROUNDS) return end();
        cur = puzzle();
        claimed = { 1: null, 2: null };
        turn = starter;
        draw();
      }
      function draw() {
        if (over) return;
        info.innerHTML = `round ${r}/${ROUNDS} · target <b>${cur.target}</b> · <b class="pc${turn}">${esc(g.name(turn))}</b> to claim`;
        nums.innerHTML = '';
        cur.nums.forEach((n) => nums.appendChild(h('span', { class: 'tag', text: String(n), style: { fontSize: '1.1rem' } })));
        optRow.innerHTML = '';
        cur.shown.forEach((c, i) => {
          if (claimed[1] === i || claimed[2] === i) return;
          const b = h('button', { class: 'btn', text: `${c.txt} = ${c.v}`, style: { width: 'min(360px, 94%)', fontFamily: 'monospace' } });
          b.addEventListener('click', () => claim(i));
          optRow.appendChild(b);
        });
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('r', Math.min(r, ROUNDS));
        g.points(pts[1], pts[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — which one equals ${cur.target}?`);
      }
      function claim(i) {
        if (claimed[turn] !== null) return;
        const c = cur.shown[i];
        claimed[turn] = i;
        if (c.hit) {
          pts[turn] += 3;
          g.sfx('win'); g.toast(`EXACT — ${c.txt} pays +3 to ${esc(g.name(turn))}`, 1600);
          setTimeout(next, 1700); draw();
          return;
        }
        g.sfx(c.d <= 5 ? 'coin' : 'bad');
        g.toast(`${c.txt} misses by ${c.d}`, 1100);
        const other = 3 - turn;
        if (claimed[other] !== null) return resolve();
        turn = other;
        if (!cur.anyExact) { /* nearest-distance round decides itself below */ }
        draw();
      }
      function resolve() {
        const d1 = claimed[1] !== null ? cur.shown[claimed[1]].d : Infinity;
        const d2 = claimed[2] !== null ? cur.shown[claimed[2]].d : Infinity;
        if (d1 === d2) { g.toast('same distance — the round is split', 1400); setTimeout(next, 1500); return; }
        const w = d1 < d2 ? 1 : 2;
        pts[w] += cur.anyExact ? 0 : 2;
        if (cur.anyExact) g.toast('nobody found the exact line — no points', 1500);
        else g.toast(`closest by ${Math.min(d1, d2)} — +2 to ${esc(g.name(w))}`, 1500);
        setTimeout(next, 1600);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Five Countdown boards, no leader: ${pts[1]}–${pts[2]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Math duel verdict ${pts[1]}–${pts[2]}.`);
      }
      next();
    },
    onStop() { starter = 3 - starter; },
  });
})();
