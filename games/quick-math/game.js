/* Quick Math — eight mental sums each, wagers on every answer. Fastest mind wins. */
(function () {
  const QUESTIONS = 8, MAXBET = 3;
  let starter = 1;
  Game.init({
    id: 'quick-math',
    rules: [
      'Eight sums each, alternating turns. Every question offers three answers and a wager: stake 1–3 of your 10 starting points on your own answer.',
      'Right answer: win the stake. Wrong answer: lose it and the rival collects half of it (rounded up).',
      'Answering “skip” costs 1 point and moves the board on.',
      'After all sixteen questions the higher pile of points wins — run out of points and you are eliminated immediately.',
    ],
    controls: { all: 'Bet with 1·2·3 then pick the answer · ⏭ skip costs 1' },
    points: true,
    onStart(g) {
      let q = 0, turn = starter, bet = 1;
      const pts = { 1: 10, 2: 10 };
      const cur = () => {
        const a = 2 + Math.floor(Math.random() * 12), b = 1 + Math.floor(Math.random() * 9);
        const op = ['+', '−', '×'][Math.floor(Math.random() * 3)];
        const ans = op === '+' ? a + b : op === '−' ? a - b : a * b;
        const wrong = [ans + 1 + Math.floor(Math.random() * 3), ans - 1 - Math.floor(Math.random() * 4)];
        const opts = shuffle([ans, ...wrong]);
        return { text: `${a} ${op} ${b}`, ans, opts };
      };
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const qBox = h('div', { class: 'bigmsg', style: { fontSize: '2rem', letterSpacing: '.06em' } });
      const betRow = h('div', { class: 'row' });
      const optRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 10 }, { key: 'b', label: g.name(2), val: 10 }, { key: 'q', label: 'question', val: 1 }]);
      wrap.append(info, qBox, betRow, optRow, stat.el);
      let problem = null;
      function draw() {
        if (q >= QUESTIONS * 2) return end();
        problem = cur();
        info.innerHTML = `question ${Math.floor(q / 2) + 1}/8 · <b class="pc${turn}">${esc(g.name(turn))}</b> to answer · stake <b>${bet}</b>`;
        qBox.textContent = problem.text + ' = ?';
        betRow.innerHTML = '';
        for (let b = 1; b <= MAXBET; b++) {
          const btn = h('button', { class: 'chip' + (b === bet ? ' on' : ''), text: 'bet ' + b, disabled: pts[turn] < b });
          btn.addEventListener('click', () => { bet = b; draw(); });
          betRow.appendChild(btn);
        }
        betRow.appendChild(h('button', { class: 'chip', text: '⏭ skip (−1)', onclick: () => { pts[turn] = Math.max(0, pts[turn] - 1); g.sfx('bad'); g.toast('skipped', 700); advance(); } }));
        optRow.innerHTML = '';
        problem.opts.forEach((v) => {
          const btn = h('button', { class: 'btn primary', text: String(v), style: { fontSize: '1.4rem', minWidth: '84px' } });
          btn.addEventListener('click', () => answer(v));
          optRow.appendChild(btn);
        });
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('q', `${q + 1}/16`);
        g.points(pts[1], pts[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — pick an answer`);
      }
      function answer(v) {
        if (pts[turn] <= 0) return;
        if (v === problem.ans) {
          pts[turn] += bet;
          g.sfx('coin'); g.toast(`right! +${bet}`, 1000);
        } else {
          pts[turn] = Math.max(0, pts[turn] - bet);
          pts[3 - turn] += Math.ceil(bet / 2);
          g.sfx('bad'); g.toast(`wrong — it was ${problem.ans}; rival steals ${Math.ceil(bet / 2)}`, 1300);
        }
        if (pts[1] <= 0 || pts[2] <= 0) return end();
        advance();
      }
      function advance() { q++; turn = 3 - turn; draw(); }
      function end() {
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Sixteen questions, both on ${pts[1]} points.`);
        const w = pts[1] > pts[2] ? 1 : 2;
        g.win(w, `Abacus closed: ${pts[1]}–${pts[2]}.`);
      }
      draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
