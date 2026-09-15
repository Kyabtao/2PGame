/* Pattern Panic — find the next term. Spot the rule or hand the point away. */
(function () {
  const ROUNDS = 10;
  let starter = 1;
  const gens = [
    () => { const a = 2 + Math.floor(Math.random() * 4), d = 2 + Math.floor(Math.random() * 5); const s = range(4).map((i) => a + d * i); return { seq: s, next: a + d * 4, why: `+${d} each step` }; },
    () => { const a = 1 + Math.floor(Math.random() * 3), r = 2 + Math.floor(Math.random() * 2); const s = range(4).map((i) => a * Math.pow(r, i)); return { seq: s, next: a * Math.pow(r, 4), why: `×${r} each step` }; },
    () => { const s = range(4).map((i) => (i + 1) * (i + 2)); return { seq: s, next: 5 * 6, why: 'n·(n+1)' }; },
    () => { const fib = [1, 1]; for (let i = 2; i < 5; i++) fib.push(fib[i - 1] + fib[i - 2]); return { seq: fib.slice(0, 4), next: fib[4], why: 'Fibonacci sums' }; },
    () => { const s = [1, 4, 9, 16]; return { seq: s, next: 25, why: 'square numbers' }; },
    () => { const a = 30 + Math.floor(Math.random() * 20), d = 3 + Math.floor(Math.random() * 6); const s = range(4).map((i) => a - d * i); return { seq: s, next: a - d * 4, why: `−${d} each step` }; },
    () => { const s = [2, 3, 5, 7]; return { seq: s, next: 11, why: 'primes' }; },
    () => { const s = [1, 2, 6, 24]; return { seq: s, next: 120, why: '×2, ×3, ×4, ×5' }; },
  ];
  Game.init({
    id: 'pattern-panic',
    rules: [
      'Ten number sequences, alternating whose turn it is to crack them. Four answers are offered — one continues the hidden rule.',
      'A correct read scores 2 points — the rule is flashed after every answer.',
      'A wrong answer gives the rival the chance to answer the same sequence for the full 3 points.',
      'Highest score after all ten patterns wins; the rules are plain arithmetic families — differences, ratios, squares, primes, Fibonacci.',
    ],
    controls: { all: 'Tap the answer you believe continues the row' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let r = 0, turn = starter, puzzle = null, solved = false, challenger = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const seq = h('div', { class: 'bigmsg', style: { fontSize: '1.7rem', letterSpacing: '.1em' } });
      const info = h('div', { class: 'muted' });
      const optRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'p', label: 'pattern', val: 1 }]);
      wrap.append(info, seq, optRow, stat.el);
      function nextPuzzle() {
        r++;
        if (r > ROUNDS) return end();
        solved = false; challenger = 0;
        const gen = gens[Math.floor(Math.random() * gens.length)]();
        puzzle = { next: gen.next, why: gen.why, text: gen.seq.join(' , ') + ' , ?' };
        const bad = shuffle([gen.next + 1, gen.next - 2 - Math.floor(Math.random() * 3), gen.next + 4 + Math.floor(Math.random() * 5)]).slice(0, 3);
        puzzle.opts = shuffle([gen.next, ...bad.slice(0, 3)]).slice(0, 4);
        if (!puzzle.opts.includes(gen.next)) puzzle.opts[0] = gen.next;
        draw();
      }
      function draw() {
        seq.textContent = puzzle.text;
        info.innerHTML = `pattern ${r}/${ROUNDS} · <b class="pc${turn}">${esc(challenger ? g.name(challenger) + ' cleans up' : g.name(turn))}</b> to answer${solved ? ' · solved' : ''}`;
        optRow.innerHTML = '';
        puzzle.opts.forEach((v) => {
          const b = h('button', { class: 'btn', text: String(v), style: { minWidth: '76px', fontSize: '1.2rem' } });
          b.addEventListener('click', () => pick(v));
          optRow.appendChild(b);
        });
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('p', `${Math.min(r, ROUNDS)}/${ROUNDS}`);
        g.points(pts[1], pts[2]);
        g.turn(challenger || turn, `<span class="pc${challenger || turn}">${esc(g.name(challenger || turn))}</span> — what comes next?`);
      }
      function pick(v) {
        if (solved) return;
        const who = challenger || turn;
        if (v === puzzle.next) {
          pts[who] += challenger ? 3 : 2;
          solved = true;
          g.sfx('coin');
          g.toast(`${puzzle.why} — +${challenger ? 3 : 2}`, 450);
          challenger = 0;
          turn = 3 - turn;
          setTimeout(nextPuzzle, 500);
        } else if (!challenger) {
          challenger = 3 - turn;
          g.sfx('bad');
          g.toast(`not it — rival gets a shot at the same row`, 1300);
          draw();
        } else {
          challenger = 0;
          solved = true;
          g.sfx('explode');
          g.toast('both missed — the rule was ' + puzzle.why, 500);
          turn = 3 - turn;
          setTimeout(nextPuzzle, 500);
        }
      }
      function end() {
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Ten patterns, no leader — ${pts[1]} each.`);
        const w = pts[1] > pts[2] ? 1 : 2;
        g.win(w, `Pattern panic resolved: ${pts[1]}–${pts[2]}.`);
      }
      nextPuzzle();
    },
    onStop() { starter = 3 - starter; },
  });
})();
