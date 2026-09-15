/* Sushi Go! — draft three hands of three; sets, wasabi triples, chopsticks double-draft, pudding endgame. */
(function () {
  const CARDS = {
    cherry:   { n: 5,  label: '🍒', name: 'Cherries' },
    tempura:  { n: 14, label: '🍤', name: 'Tempura' },
    sashimi:  { n: 5,  label: '🍣', name: 'Sashimi' },
    dumpling: { n: 6,  label: '🥟', name: 'Dumpling' },
    maki:     { n: 6,  label: '🍥', name: 'Maki Roll' },
    salmon:   { n: 5,  label: '🐟', name: 'Salmon' },
    wasabi:   { n: 3,  label: '🟩', name: 'Wasabi' },
    sticks:   { n: 4,  label: '🥢', name: 'Chopsticks' },
    pudding:  { n: 5,  label: '🍮', name: 'Pudding' },
  };
  const SCORING = ['cherry', 'tempura', 'sashimi', 'dumpling', 'salmon'];
  /* marginal points for taking the (n+1)-th card of a type */
  const marginal = (k, n) => {
    const i = n + 1;                                        // 1-based count AFTER taking
    if (k === 'cherry') return 1;
    if (k === 'salmon') return 3;
    if (k === 'tempura') return i % 2 === 0 ? 2 : 0;
    if (k === 'sashimi') return i % 3 === 0 ? 5 : 0;
    if (k === 'dumpling') return [1, 2, 3, 4, 5, 0][Math.min(i, 6) - 1] || 0;
    return 0;
  };
  let starter = 1;
  Game.init({
    id: 'sushi-go',
    rules: [
      'Three hands. Every hand each player starts with three cards: pick one, the rival picks blind from their own three, and the remainders are swapped — until the hands run dry.',
      'Cherries 1 each · Tempura score 2 per complete pair · Sashimi 5 per three-of-a-kind · Dumplings 1/3/6/10/15 by count · Salmon 3 each · Maki: most rolls of the hand = 3, second = 1 (1 each if tied).',
      'Wasabi waits on your table and triples the NEXT scoring card you take (a wasabi’d first dumpling = 3, a wasabi’d completing tempura pair = 6…).',
      'Chopsticks: play it to take nothing this turn — then your next pick grabs TWO cards.',
      'After hand three: most puddings +6, fewest −1 (tied = +6 for both, nobody is punished). Highest overall total wins the feast.',
    ],
    controls: { all: 'Tap a card to take it (two taps when chopsticks are out)' },
    points: true,
    onStart(g) {
      let deck = [];
      const total = { 1: 0, 2: 0 };
      const puddings = { 1: 0, 2: 0 };
      const handPts = { 1: 0, 2: 0 };
      let hand = 0, over = false;
      let hands = { 1: [], 2: [] }, picks = { 1: 1, 2: 1 }, taken = { 1: [], 2: [] };
      let wasabi = { 1: false, 2: false };
      let turn = 1, selBuf = [], waiting = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const table = h('div', { class: 'split' });
      const sideEls = {};
      [1, 2].forEach((p) => {
        const body = h('div', { class: 'row wrap', style: { minHeight: 110 } });
        sideEls[p] = body;
        table.appendChild(h('div', { class: 'side p' + p }, h('h3', { text: g.name(p) }), body));
      });
      const pickRow = h('div', { class: 'row wrap', style: { minHeight: 100 } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'h', label: 'hand', val: 1 }]);
      wrap.append(info, table, h('h3', { text: 'Your pick', style: { fontSize: '.85rem' } }), pickRow, stat.el);
      function buildDeck() { const d = []; for (const k in CARDS) for (let i = 0; i < CARDS[k].n; i++) d.push(k); return shuffle(d); }
      function newHand() {
        hand++;
        picks = { 1: 1, 2: 1 };
        taken = { 1: [], 2: [] }; wasabi = { 1: false, 2: false }; handPts[1] = handPts[2] = 0;
        hands = { 1: deck.splice(0, 3), 2: deck.splice(0, 3) };
        hidden = { 1: 0, 2: 0 };
        roundTurn = starter; picked = { 1: false, 2: false };
        selBuf = [];
        sideEls[1].innerHTML = sideEls[2].innerHTML = '';
        g.sfx('capture');
        g.toast(`hand ${hand} — pass the leftovers every round`, 1300);
        beginPickRound();
      }
      let roundTurn = 1, picked = { 1: false, 2: false }, hidden = { 1: 0, 2: 0 };
      function beginPickRound() {
        turn = roundTurn; selBuf = [];
        const other = 3 - turn;
        if (!hands[turn].length) {                       // nothing to pick this round
          picked[turn] = true; turn = other;
          if (!hands[turn].length) return endRoundBoth();
        }
        draw();
      }
      function endRoundBoth() {                            // swap hands, start the next pick round
        if (!hands[1].length && !hands[2].length) return endHand();
        const t = hands[1]; hands[1] = hands[2]; hands[2] = t;
        hidden = { 1: 0, 2: 0 };
        picked = { 1: false, 2: false };
        roundTurn = 3 - roundTurn;
        g.sfx('click'); g.toast('hands swapped — pick again', 800);
        beginPickRound();
      }
      function renderTable(p) {
        sideEls[p].innerHTML = '';
        taken[p].slice(0, taken[p].length - (picked[p] ? hidden[p] : 0)).forEach((k) => sideEls[p].appendChild(h('span', { class: 'tag', text: CARDS[k].label })));
        for (let i = 0; i < (picked[p] ? hidden[p] : 0); i++) sideEls[p].appendChild(h('span', { class: 'tag', text: '🂠' }));
        if (wasabi[p]) sideEls[p].appendChild(h('span', { class: 'tag', text: '🟩 ready', style: { borderColor: '#2e7d32' } }));
        sideEls[p].appendChild(h('span', { class: 'muted', text: `${handPts[p]} pts · 🍮${puddings[p]}` }));
      }
      function draw() {
        if (over) return;
        const need = Math.min(picks[turn], hands[turn].length);
        info.innerHTML = `hand ${hand}/3 · deck ${deck.length} · pick ${need}${picks[turn] > 1 ? ' (chopsticks)' : ''}`;
        pickRow.innerHTML = '';
        if (!waiting) {
          hands[turn].forEach((k, i) => {
            const on = selBuf.includes(i);
            const el = h('button', { class: 'btn' + (on ? ' primary' : ''), style: { minWidth: '88px', padding: '.55rem .4rem', lineHeight: 1.2 }, html: `${CARDS[k].label}<div style="font-size:.66rem;font-weight:700">${CARDS[k].name}</div>` });
            el.addEventListener('click', () => tap(i));
            pickRow.appendChild(el);
          });
        }
        [1, 2].forEach(renderTable);
        stat.set('a', total[1]); stat.set('b', total[2]); stat.set('h', hand);
        g.points(total[1], total[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${hands[turn].length ? `choose ${need}` : 'watch the rival pick'}`);
      }
      function tap(i) {
        if (waiting || over || picked[turn] || hands[turn][i] === undefined) return g.sfx('bad');
        selBuf.push(i);
        g.sfx('move');
        const need = Math.min(picks[turn], hands[turn].length);
        if (selBuf.length < need) { draw(); return; }
        const p = turn;
        const grabbed = selBuf.slice().sort((a, b) => b - a).map((j) => hands[p].splice(j, 1)[0]).reverse();
        selBuf = [];
        let nextPick = 1;
        for (const k of grabbed) {
          taken[p].push(k);
          if (k === 'pudding') puddings[p]++;
          else if (k === 'wasabi') wasabi[p] = true;
          else if (k === 'sticks') nextPick = 2;
          else if (SCORING.includes(k)) {
            const cnt = taken[p].filter((x) => x === k).length - 1;
            let pts = marginal(k, cnt);
            if (wasabi[p] && pts > 0) { pts *= 3; wasabi[p] = false; }
            handPts[p] += pts;
            if (pts) g.sfx('coin');
          }
        }
        hidden[p] = grabbed.filter((k) => k !== 'sticks').length;
        picks[p] = nextPick;
        picked[p] = true;
        const other = 3 - p;
        if (picked[other] || !hands[other].length) { picked[other] = true; return endRoundBoth(); }
        waiting = true; draw();
        setTimeout(() => { waiting = false; turn = other; selBuf = []; draw(); }, 450);
      }
      function makiRank() {
        const m1 = taken[1].filter((k) => k === 'maki').length, m2 = taken[2].filter((k) => k === 'maki').length;
        if (!m1 && !m2) return;
        if (m1 === m2) { handPts[1] += 1; handPts[2] += 1; return; }
        const hi = m1 > m2 ? 1 : 2;
        handPts[hi] += 3;
        if (m1 && m2) handPts[3 - hi] += 1;
      }
      function endHand() {
        makiRank();
        [1, 2].forEach((p) => { total[p] += handPts[p]; });
        [1, 2].forEach(renderTable);
        draw();
        g.toast(`hand done — ${esc(g.name(1))} +${handPts[1]}, ${esc(g.name(2))} +${handPts[2]}`, 1600);
        starter = 3 - starter;
        if (hand >= 3) return finish();
        setTimeout(newHand, 1700);
      }
      function finish() {
        over = true;
        g.turn();
        let bonus = '';
        if (puddings[1] !== puddings[2]) {
          const hi = puddings[1] > puddings[2] ? 1 : 2;
          total[hi] += 6; total[3 - hi] -= 1;
          bonus = ` Puddings ${puddings[1]}–${puddings[2]}: +6 ${esc(g.name(hi))}, −1 ${esc(g.name(3 - hi))}.`;
        } else { total[1] += 6; total[2] += 6; bonus = ` Puddings tied: +6 each.`; }
        g.points(total[1], total[2]);
        if (total[1] === total[2]) return g.draw(`Equal appetites — ${total[1]} apiece.${bonus}`);
        const w = total[1] > total[2] ? 1 : 2;
        g.win(w, `The sushi train arrives: ${total[1]}–${total[2]}.${bonus}`);
      }
      deck = buildDeck();
      newHand();
    },
    onStop() { starter = 3 - starter; },
  });
})();
