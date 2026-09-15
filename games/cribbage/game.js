/* Cribbage — the real game: 6-card hands, crib, pegging, show. First to 61 (or best after 14 hands). */
(function () {
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const VAL = (r) => (r === 'A' ? 1 : RANKS.indexOf(r) > 9 ? 10 : RANKS.indexOf(r) + 1);
  const SUITS = ['♠', '♥', '♦', '♣'];
  const GOAL = 61, MAX_HANDS = 14;
  let starter = 1;

  /* exact show count: four hand cards + starter */
  function showScore(cs, cutCard, isCrib) {
    const all = cs.concat([cutCard]);
    const vals = all.map((c) => VAL(c.r));
    let t = 0;
    for (let m = 1; m < 32; m++) { let s = 0; for (let i = 0; i < 5; i++) if (m & (1 << i)) s += vals[i]; if (s === 15) t += 2; }
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (vals[i] === vals[j]) t += 2;
    const cnt = {};
    vals.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1; });
    for (let lo = 1; lo <= 13; lo++) {
      if (!cnt[lo] || cnt[lo - 1]) continue;                      // only maximal run windows
      let len = 0, mult = 1;
      for (let v = lo; v <= 13 && cnt[v]; v++) { len++; mult *= cnt[v]; }
      if (len >= 3) t += len * mult;
    }
    const same5 = all.every((c) => c.s === all[0].s);
    if (same5) t += 5;
    else if (!isCrib && cs.every((c) => c.s === cs[0].s)) t += 4;
    if (cs.some((c) => c.r === 'J' && c.s === cutCard.s)) t += 1;  // his nobs
    return t;
  }

  Game.init({
    id: 'cribbage',
    rules: [
      'Six cards each; you discard two face-down into the crib, which the dealer counts on top of their own hand. The non-dealer keeps the crib boring.',
      'The cut card starts the game: a jack on the cut is two points for the dealer (“His Heels”).',
      'Pegging: alternate laying cards to a running count. 15 = 2, pair = 2, three alike = 6, four = 12, run of 3+ = its length, jack of the cut suit (“Nobs”) = 1, exactly 31 = 2, and a “Go” (opponent cannot answer) = 1. After a 31 or a Go the count resets and the rival leads again.',
      'Show: non-dealer counts their 4 + the cut first, then the dealer counts theirs and the crib. Ace counts as 1, faces as 10.',
      `First to ${GOAL} wins the game; if the hand cap is reached first, the higher score takes it.`,
    ],
    controls: { all: 'Tap two cards then ✔ to crib · tap to peg · ⏭ Go when stuck' },
    points: true,
    onStart(g) {
      const tot = { 1: 0, 2: 0 };
      let handNo = 0, over = false, dealer = 1;
      let hands = { 1: [], 2: [] }, crib = [], cut = null, showHand = null;
      let phase = 'crib', sel = new Set(), turn = 2, table = [], total = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const piles = h('div', { class: 'row wrap', style: { gap: '.5rem', minHeight: 34 } });
      const btnRow = h('div', { class: 'row' });
      const tableRow = h('div', { class: 'row wrap', style: { minHeight: 96 } });
      const handRow = h('div', { class: 'row wrap', style: { maxWidth: 620, minHeight: 96 } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'h', label: 'hand', val: 1 }]);
      wrap.append(info, piles, btnRow, h('h3', { text: 'The play', style: { fontSize: '.8rem' } }), tableRow, h('h3', { text: 'Your hand', style: { fontSize: '.8rem' } }), handRow, stat.el);
      function newHand() {
        handNo++; if (over) return;
        const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s, red: s === '♥' || s === '♦' });
        const stock = shuffle(d);
        hands = { 1: stock.splice(0, 6), 2: stock.splice(0, 6) };
        crib = []; showHand = null;
        cut = stock.pop();
        dealer = starter;
        phase = 'crib'; sel = new Set();
        if (cut.r === 'J') { tot[dealer] += 2; g.toast('His Heels — 2 to the dealer for a jack on the cut', 1600); }
        turn = 3 - dealer;
        table = []; total = 0;
        g.sfx('capture');
        g.toast(`hand ${handNo} · ${esc(g.name(dealer))} deals · cut ${cut.r}${cut.s}`, 1300);
        draw();
      }
      const line = (txt) => h('span', { class: 'tag', text: txt });
      function draw() {
        if (over) return;
        info.innerHTML = `cut <b>${cut.r}${cut.s}</b> · ${phase === 'crib' ? 'both players discard two to the crib' : phase === 'peg' ? 'pegging' : 'hand counted'}`;
        piles.innerHTML = '';
        piles.appendChild(line(`crib: ${crib.map((c) => c.r + c.s).join(' ') || '—'}`));
        if (phase === 'peg') piles.appendChild(line(`count ${total}`));
        btnRow.innerHTML = '';
        handRow.innerHTML = '';
        tableRow.innerHTML = '';
        table.forEach((t2) => tableRow.appendChild(UI.card(t2.card, { small: true })));
        if (phase === 'crib') {
          hands[turn].forEach((c, i) => {
            const el = UI.card(c, { large: true, onClick: () => { if (sel.has(i)) sel.delete(i); else { sel.add(i); if (sel.size > 2) sel.delete(Math.min(...sel)); } draw(); } });
            if (sel.has(i)) el.classList.add('hl');
            handRow.appendChild(el);
          });
          btnRow.appendChild(h('button', { class: 'btn primary', text: `✔ ${sel.size}/2 to crib`, onclick: toCrib }));
          g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — pick two cards for your crib`);
        } else if (phase === 'peg') {
          hands[turn].forEach((c, i) => handRow.appendChild(UI.card(c, { large: true, onClick: () => peg(i) })));
          if (!hands[turn].some((c) => total + VAL(c.r) <= 31)) btnRow.appendChild(h('button', { class: 'btn', text: '⏭ Go', onclick: go }));
          g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — lead to ${total}`);
        } else if (showHand) {
          [1, 2].forEach((p) => {
            const s = showScore(showHand[p], cut, false);
            piles.appendChild(line(`${g.name(p)}: ${showHand[p].map((c) => c.r + c.s).join(' ')} = ${s}`));
          });
          if (crib.length === 4) piles.appendChild(line(`crib ${crib.map((c) => c.r + c.s).join(' ')} = ${showScore(crib, cut, true)}`));
          g.turn();
        }
        stat.set('a', tot[1]); stat.set('b', tot[2]); stat.set('h', `${handNo}/${MAX_HANDS}`);
        g.points(tot[1], tot[2]);
      }
      function toCrib() {
        if (phase !== 'crib' || sel.size !== 2) { g.sfx('bad'); g.toast('pick exactly two cards', 900); return; }
        [...sel].sort((a, b) => b - a).forEach((i) => crib.push(hands[turn].splice(i, 1)[0]));
        sel = new Set(); g.sfx('coin');
        if (turn === 3 - dealer) { turn = dealer; draw(); return; }
        showHand = { 1: hands[1].slice(), 2: hands[2].slice() };
        phase = 'peg';
        g.toast('pegging — ponger leads', 1000);
        draw();
      }
      function peg(i) {
        if (phase !== 'peg') return g.sfx('bad');
        if (total + VAL(hands[turn][i].r) > 31) {
          if (!hands[turn].some((c) => total + VAL(c.r) <= 31)) return go();   // stuck anyway — the tap calls Go itself
          g.sfx('bad'); g.toast('that busts 31 — pick a card that keeps the count ≤ 31', 1000); return;
        }
        playCard(turn, hands[turn].splice(i, 1)[0]);
      }
      function playCard(p, c) {
        total += VAL(c.r);
        table.push({ card: c, p });
        let pts = 0;
        if (total === 15) pts += 2;
        if (total === 31) pts += 2;
        const n = table.length;
        const vals = table.map((t2) => VAL(t2.card.r));
        let pairs = 0;
        for (let k = 2; k <= Math.min(4, n); k++) if (vals.slice(n - k).every((v) => v === vals[n - 1])) pairs = k;
        if (pairs === 2) pts += 2; else if (pairs === 3) pts += 6; else if (pairs === 4) pts += 12;
        let run = 0;
        for (let back = 3; back <= Math.min(n, 8); back++) {
          const sv = table.slice(n - back).map((t2) => VAL(t2.card.r)).sort((a, b) => a - b);
          if (new Set(sv).size === sv.length && sv.every((v, i2) => i2 === 0 || v === sv[i2 - 1] + 1)) run = back; else break;
        }
        if (run) pts += run;
        if (c.r === 'J' && c.s === cut.s) pts += 1;
        if (pts) { tot[p] += pts; g.sfx('coin'); g.toast(`${esc(g.name(p))} pegs ${pts}`, 850); }
        nextUp(p);
        draw();
        if (phase !== 'over' && tot[1] >= GOAL) return finish();
        if (phase !== 'over' && tot[2] >= GOAL) return finish();
      }
      function nextUp(p) {
        const opp = 3 - p;
        if (phase !== 'peg') return;
        if (!hands[1].length && !hands[2].length) {
          if (total !== 31) { tot[p] += 1; g.toast('last card — one point', 800); }
          return show();
        }
        if (total === 31) { total = 0; table = []; turn = opp; return; }
        const oppCan = hands[opp].some((c) => total + VAL(c.r) <= 31);
        if (!oppCan) {
          tot[p] += 1; g.toast('one for the last card (Go)', 850);
          total = 0; table = [];
          if (!hands[opp].length) { turn = p; return; }        // rival is out; finish alone
          turn = opp; return;                                   // the go-caller leads afresh
        }
        turn = opp;
      }
      function go() {
        if (phase !== 'peg') return;
        if (hands[turn].some((c) => total + VAL(c.r) <= 31)) { g.sfx('bad'); g.toast('you have a legal card — no go', 900); return; }
        const p = 3 - turn;
        tot[p] += 1; g.toast('go to the other side', 850);
        total = 0; table = [];
        if (!hands[1].length && !hands[2].length) return show();
        turn = turn;                                     // the caller leads the fresh count
        draw();
      }
      function show() {
        phase = 'show';
        const s1 = showScore(showHand[1], cut, false), s2 = showScore(showHand[2], cut, false);
        tot[1] += s1; tot[2] += s2;
        let sc = 0;
        if (crib.length === 4) { sc = showScore(crib, cut, true); tot[dealer] += sc; }
        draw();
        g.toast(`show — P1 ${s1}, P2 ${s2}, crib ${sc}`, 1200);
        if (tot[1] >= GOAL || tot[2] >= GOAL || handNo >= MAX_HANDS) return finish();
        starter = 3 - starter;
        setTimeout(newHand, 1300);
      }
      function finish() {
        if (over) return;
        over = true; phase = 'over';
        starter = 3 - starter;
        g.turn();
        if (tot[1] === tot[2]) return g.draw(`Pegged level at ${tot[1]} — the board is split.`);
        const w = tot[1] > tot[2] ? 1 : 2;
        g.win(w, `Board says ${tot[1]}–${tot[2]}.`);
      }
      g.key(['KeyG'], go);
      newHand();
    },
    onStop() { starter = 3 - starter; },
  });
})();
