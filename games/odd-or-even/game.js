/* Odd or Even — the schoolyard Morra duel: fingers hidden, parity called, exact sums bountied. */
(function () {
  const ROUNDS = 10;
  let starter = 1;
  Game.init({
    id: 'odd-or-even',
    rules: [
      'Both players hide 1–5 fingers behind the screen and lock them in. Odd sums score for Player 1’s camp, even sums for Player 2’s camp — the camps do not swap, so read the rival’s habits.',
      'Reading the rival is everything: predict their fingers (the 👁 bluff-read) and a bullseye pays +2 — but only if your side also wins the parity.',
      'Same-number throws (twins) cancel the round — nobody scores.',
      'Ten rounds; most points wins the yard.',
    ],
    controls: { all: 'Pick a number of fingers, then an exact-sum bet · 🔒 lock' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let pick = { 1: { f: null, bet: null }, 2: { f: null, bet: null } };
      let r = 0, stage = 'p1', over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const boards = h('div', { class: 'split' });
      const panel = {}, btnRow = h('div', { class: 'row' });
      const revealRow = h('div', { class: 'row', style: { gap: '1rem', minHeight: 60 } });
      const stat = UI.stats([{ key: 'a', label: 'P1 (odd)', val: 0 }, { key: 'b', label: 'P2 (even)', val: 0 }, { key: 'r', label: 'round', val: 1 }]);
      [1, 2].forEach((p) => {
        const fRow = h('div', { class: 'row' });
        const betRow = h('div', { class: 'row' });
        const readBtn = h('button', { class: 'chip', text: '👁 read the rival', disabled: stage !== `p${p}` });
        readBtn.addEventListener('click', () => { if (stage === `p${p}`) { pick[p].bet = pick[p].bet === 'read' ? null : 'read'; draw(); } });
        betRow.appendChild(readBtn);
        panel[p] = { fRow, betRow, state: h('div', { class: 'muted', text: 'choose fingers' }) };
        boards.appendChild(h('div', { class: 'side p' + p }, h('h3', { text: `${g.name(p)} · ${p === 1 ? 'ODD' : 'EVEN'}` }), fRow, betRow, panel[p].state));
        for (let f = 1; f <= 5; f++) {
          const b = h('button', { class: 'chip', text: '✊ ' + f, disabled: stage !== `p${p}` });
          b.addEventListener('click', () => { if (stage === `p${p}`) { pick[p].f = f; draw(); } });
          fRow.appendChild(b);
        }

      });
      wrap.append(info, boards, btnRow, revealRow, stat.el);
      function draw() {
        if (over) return;
        info.innerHTML = `round ${r + 1}/${ROUNDS} · <b class="pc${stage === 'p2' ? 2 : 1}">${esc(g.name(stage === 'p1' ? 1 : 2))}</b> — hide your throw`;
        [1, 2].forEach((p) => {
          panel[p].state.textContent = pick[p].f ? `fingers ✓ ${pick[p].bet ? '· reading' : ''}` : 'nothing locked';
          [...panel[p].fRow.children].forEach((b, i) => b.classList.toggle('on', pick[p].f === i + 1 && stage === `p${p}`));
          [...panel[p].betRow.children].forEach((b) => b.classList.toggle('on', pick[p].bet === 'read'));
        });
        btnRow.innerHTML = '';
        if (stage !== 'done') btnRow.appendChild(h('button', { class: 'btn', text: stage === 'p1' ? '🔒 lock P1' : '🔒 lock P2 & reveal', onclick: lockIn, disabled: pick[stage === 'p1' ? 1 : 2].f === null }));
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('r', `${Math.min(r + 1, ROUNDS)}/${ROUNDS}`);
        [1, 2].forEach((pp) => { [...panel[pp].fRow.children, ...panel[pp].betRow.children].forEach((b) => { b.disabled = stage !== `p${pp}`; }); });
        g.points(pts[1], pts[2]);
        g.turn(stage === 'p1' ? 1 : 2, stage === 'done' ? undefined : `<span class="pc${stage === 'p1' ? 1 : 2}">${esc(g.name(stage === 'p1' ? 1 : 2))}</span> — fingers, then optional exact sum`);
      }
      function lockIn() {
        if (stage === 'p1') { stage = 'p2'; g.sfx('click'); draw(); return; }
        stage = 'done';
        const a = pick[1].f, b = pick[2].f, sum = a + b;
        revealRow.innerHTML = '';
        revealRow.appendChild(h('span', { class: 'tag', text: `P1 threw ${a}` }));
        revealRow.appendChild(h('span', { class: 'tag', text: `P2 threw ${b}` }));
        revealRow.appendChild(h('span', { class: 'tag', text: 'sum ' + sum + ' · ' + (sum % 2 ? 'ODD' : 'EVEN') }));
        if (a === b) { g.toast(`twins — both threw ${a}; round scratched`, 1100); g.sfx('bad'); draw(); setTimeout(nextRound, 1000); return; }
        const side = sum % 2 ? 1 : 2;
        pts[side]++;
        let msg = `${side === 1 ? 'odd' : 'even'} — point to ${g.name(side)}`;
        for (const p of [1, 2]) {
          const pred = p === 1 ? pick[2].f : pick[1].f;
          if (pick[p].bet === 'read' && pred === (side === 1 ? undefined : undefined)) void 0;
          if (pick[p].bet === 'read' && p === side) { pts[p] += 2; msg += ` · read the throw, +2`; }
        }
        g.sfx('coin'); g.toast(msg, 1100);
        draw();
        setTimeout(nextRound, 950);
      }
      function nextRound() {
        r++;
        pick = { 1: { f: null, bet: null }, 2: { f: null, bet: null } };
        revealRow.innerHTML = '';
        stage = 'p1';
        if (r >= ROUNDS) return end();
        draw();
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Ten throws, dead even at ${pts[1]} apiece.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Yard rules: ${pts[1]}–${pts[2]}.`);
      }
      draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
