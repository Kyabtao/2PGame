/* Classic Rummy — draw, meld face-up, lay off, discard. Shed every card to go out; lowest deadwood wins the game. */
(function () {
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const VAL = (r) => RANKS.indexOf(r) + 1;
  const PTS = (c) => (c.r === 'A' ? 1 : VAL(c.r) > 10 ? 10 : VAL(c.r));
  const SUITS = ['♠', '♥', '♦', '♣'];
  const HAND = 7, MAX_ROUNDS = 3, GOAL = 50;
  let starter = 1;
  Game.init({
    id: 'rummy',
    rules: [
      'Seven cards each from the full 52-card deck. A turn is draw one card (stock or the discard pile’s top) — lay as many melds and lay-offs as you like — then discard one card.',
      'Melds stay face-up on the table: 3+ cards of one rank, or 3+ running in a suit (aces only low). Once a meld is on the table you can LAY OFF extra matching cards onto it, yours or your rival’s.',
      'Going out means your hand is empty after a meld or lay-off (no final discard needed); if you never discarded all round that is RUMMY! and the deadwood penalty on your rival doubles.',
      'Otherwise the round ends when the stock is exhausted: each player counts the points of cards still in hand (10 for faces, ace 1) and the lower total scores the difference.',
      `Penalties accumulate; after ${MAX_ROUNDS} rounds (or when someone passes ${GOAL}) the lower score wins.`,
    ],
    controls: { all: 'Tap hand cards to select · ✨ Meld · ↩︎ Lay off · 🗑 Discard · 🎴 deck / ♻️ discard to draw' },
    points: true,
    onStart(g) {
      const score = { 1: 0, 2: 0 };
      let round = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const piles = h('div', { class: 'row', style: { gap: '1rem', alignItems: 'center' } });
      const btnRow = h('div', { class: 'row' });
      const table = h('div', { class: 'col', style: { gap: '.3rem' } });
      const handRow = h('div', { class: 'row wrap', style: { maxWidth: 640, minHeight: 96 } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'r', label: 'round', val: 1 }]);
      wrap.append(info, piles, btnRow, h('h3', { text: 'Table melds', style: { fontSize: '.8rem' } }), table, h('h3', { text: 'Your hand', style: { fontSize: '.8rem' } }), handRow, stat.el);
      let stock = [], disc = [], hands = { 1: [], 2: [] }, melds = [], turn = 1, drew = false, sel = new Set(), discarded = { 1: false, 2: false };
      function newRound() {
        round++; if (over) return;
        const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s, red: s === '♥' || s === '♦' });
        stock = shuffle(d); disc = []; melds = []; sel = new Set();
        hands[1] = stock.splice(0, HAND); hands[2] = stock.splice(0, HAND);
        disc.push(stock.pop());
        drew = false; discarded = { 1: false, 2: false };
        turn = starter;
        g.sfx('capture'); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — draw a card`);
        draw();
      }
      const valid = (cs) => {
        if (cs.length < 3) return false;
        if (cs.every((c) => c.r === cs[0].r)) return true;
        if (!cs.every((c) => c.s === cs[0].s)) return false;
        const v = cs.map((c) => VAL(c.r)).sort((a, b) => a - b);
        return v.every((x, i) => i === 0 || x === v[i - 1] + 1);
      };
      function draw() {
        if (over) return;
        info.innerHTML = `stock <b>${stock.length}</b> · top discard <b>${disc[disc.length - 1].r}${disc[disc.length - 1].s}</b> · round ${round}/${MAX_ROUNDS} · penalties ${score[1]}–${score[2]}`;
        piles.innerHTML = '';
        piles.appendChild(h('button', { class: 'card', text: `🎴 ${stock.length}`, style: { width: '70px', height: '94px', display: 'grid', placeItems: 'center', background: 'repeating-linear-gradient(45deg,#3b4dc2 0 6px,#2c3aa0 6px 12px)', border: '3px solid #fff', color: '#fff', fontWeight: 800 }, onclick: () => { if (!drew && stock.length) { hands[turn].push(stock.pop()); drew = true; g.sfx('coin'); draw(); } else g.sfx('bad'); } }));
        const top = disc[disc.length - 1];
        piles.appendChild(UI.card(top, { large: true, onClick: () => { if (!drew) { disc.pop(); hands[turn].push(top); drew = true; g.sfx('coin'); draw(); } else g.sfx('bad'); } }));
        btnRow.innerHTML = '';
        btnRow.appendChild(h('button', { class: 'btn', text: `✨ Meld ${sel.size ? '(' + sel.size + ')' : ''}`, onclick: doMeld }));
        btnRow.appendChild(h('button', { class: 'btn', text: '↩︎ Lay off', onclick: doLayoff }));
        btnRow.appendChild(h('button', { class: 'btn', text: '🗑 Discard', onclick: doDiscard }));
        table.innerHTML = '';
        melds.forEach((m) => { const row = h('div', { class: 'row' }); m.cards.forEach((c) => row.appendChild(UI.card(c, { small: true }))); table.appendChild(row); });
        if (!melds.length) table.appendChild(h('span', { class: 'muted', text: 'no melds yet' }));
        handRow.innerHTML = '';
        hands[turn].forEach((c, i) => {
          const el = UI.card(c, { large: true, onClick: () => { if (!drew && stock.length) { hands[turn].push(stock.pop()); drew = true; g.sfx('coin'); } sel.has(i) ? sel.delete(i) : sel.add(i); draw(); } });
          if (sel.has(i)) el.classList.add('hl');
          handRow.appendChild(el);
        });
        if (!hands[turn].length) handRow.appendChild(h('span', { class: 'muted', text: '— empty —' }));
        stat.set('a', score[1]); stat.set('b', score[2]); stat.set('r', round);
        g.points(GOAL - score[1], GOAL - score[2]);
      }
      const selCards = () => [...sel].map((i) => hands[turn][i]).filter(Boolean);
      function doMeld() {
        if (phaseEnd()) return;
        if (!drew) { g.sfx('bad'); g.toast('draw a card first', 900); return; }
        const cs = selCards();
        if (!valid(cs)) { g.sfx('bad'); g.toast('not a valid meld (3+ same rank, or a run in one suit)', 1300); return; }
        melds.push({ owner: turn, cards: cs.slice() });
        hands[turn] = hands[turn].filter((c, i) => !sel.has(i));
        sel = new Set(); g.sfx('coin');
        if (!hands[turn].length) return goOut();
        draw();
      }
      function doLayoff() {
        if (phaseEnd()) return;
        if (!drew || !sel.size || !melds.length) { g.sfx('bad'); return; }
        const cs = selCards();
        let moved = 0;
        for (const c of cs) {
          const fit = melds.find((mm) => fitsMeld(mm, c));
          if (fit) { fit.cards.push(c); moved++; }
        }
        if (!moved) { g.sfx('bad'); g.toast('nothing selected fits a table meld', 1100); return; }
        hands[turn] = hands[turn].filter((c, i) => !sel.has(i));
        sel = new Set(); g.sfx('coin');
        if (!hands[turn].length) return goOut();
        draw();
      }
      function fitsMeld(m, c) {
        const vs = m.cards.map((x) => VAL(x.r));
        if (new Set(m.cards.map((x) => x.r)).size === 1) return c.r === m.cards[0].r;               // set of a rank
        if (!m.cards.every((x) => x.s === c.s)) return false;                                        // run
        const lo = Math.min(...vs), hi = Math.max(...vs);
        return hi - lo === vs.length - 1 && (VAL(c.r) === lo - 1 || VAL(c.r) === hi + 1);
      }
      function doDiscard() {
        if (phaseEnd()) return;
        if (!drew) { if (!stock.length) return endStock(); hands[turn].push(stock.pop()); drew = true; g.sfx('coin'); }
        const pick = sel.size ? Math.max(...sel) : hands[turn].length - 1;
        const c = hands[turn].splice(pick, 1)[0];
        disc.push(c); discarded[turn] = true;
        sel = new Set(); drew = false; g.sfx('click');
        turn = 3 - turn;
        if (!stock.length) return endStock();
        draw();
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — draw`);
      }
      function phaseEnd() { return over; }
      function wood(p) { return hands[p].reduce((a, c) => a + PTS(c), 0); }
      function goOut() {
        const me = turn, rival = 3 - me;
        let pen = wood(rival);
        const rummy = !discarded[me];
        if (rummy) pen *= 2;
        score[rival] += pen;
        endRound(`${esc(g.name(me))} went out${rummy ? ' — RUMMY! double penalty' : ''} (${pen} against)`);
      }
      function endStock() {
        const a = wood(1), b = wood(2);
        if (a === b) return endRound('Stock gone — equal deadwood, no penalty');
        const loser = a < b ? 2 : 1;
        score[loser] += Math.abs(a - b);
        endRound(`Stock gone — ${Math.abs(a - b)} deadwood difference against ${esc(g.name(loser))}`);
      }
      function endRound(why) {
        g.points(GOAL - score[1], GOAL - score[2]);
        draw();
        if (score[1] >= GOAL || score[2] >= GOAL || round >= MAX_ROUNDS) return finish(why);
        starter = 3 - starter;
        g.toast(why, 1600);
        setTimeout(newRound, 1300);
      }
      function finish(why) {
        over = true;
        starter = 3 - starter;
        if (score[1] === score[2]) return g.draw(`Dead level on penalties at ${score[1]} — ${why}.`);
        const w = score[1] < score[2] ? 1 : 2;
        g.win(w, `${why} · penalties ${score[1]}–${score[2]}; fewer points wins.`);
      }
      g.key(['KeyD'], doDiscard);
      g.key(['KeyM'], doMeld);
      newRound();
    },
    onStop() { starter = 3 - starter; },
  });
})();
