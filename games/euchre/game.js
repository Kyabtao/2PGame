/* Euchre — 24-card deck, bower power, order up the suit, make 3 or get euchred. First to 10. */
(function () {
  const RANKS = [9, 10, 'J', 'Q', 'K', 'A'];
  const SUITS = ['♠', '♥', '♦', '♣'];
  const GOAL = 10, MAX_DEALS = 8;
  let starter = 1;
  const rankVal = (r) => RANKS.indexOf(r);
  Game.init({
    id: 'euchre',
    rules: [
      'Twenty-four cards (9 through ace) and five to each. The turned card is offered as trump: first the pone, then the dealer may “order it up” — the maker then adds it to their hand and discards one card face-down.',
      'If both pass, a second round lets either name any other suit. The jack of trumps (right bower) beats everything, then the jack of the other black/red pair (left bower), then A-K-Q-10-9.',
      'Follow suit if you can; highest trump wins, else highest of the suit led. First to 8 is “at the bake” but keep playing.',
      'Makers taking 3 or 4 tricks score 1; all five score 2. Failed (0–2) and the defence is euchred for 2. First to 10 wins the game.',
    ],
    controls: { all: 'Tap cards to select · ✔ discard · buttons for order up / name trump' },
    points: true,
    onStart(g) {
      const sc = { 1: 0, 2: 0 };
      let dealNo = 0, over = false, dealer = 1;
      let hands = { 1: [], 2: [] }, up = null, trump = null, maker = 0, phase = 'bid1', trick = [], leader = 0, won = { 1: 0, 2: 0 }, sel = -1, bidder = 2;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const trickRow = h('div', { class: 'row', style: { gap: '1.2rem', minHeight: 96 } });
      const btnRow = h('div', { class: 'row wrap' });
      const handRow = h('div', { class: 'row wrap', style: { maxWidth: 560, minHeight: 96 } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 't', label: 'tricks', val: '0–0' }]);
      wrap.append(info, trickRow, btnRow, handRow, stat.el);
      const power = (c) => {
        if (c.s === trump) return c.r === 'J' ? 100 : 60 + rankVal(c.r);
        if (c.r === 'J' && (c.s === '♠') === (trump === '♣')) return 90;         // left bower
        const led = trick.length ? trick[0].card.s : null;
        return rankVal(c.r) + (c.s === led ? 20 : 0);
      };
      function newDeal() {
        dealNo++; if (over) return;
        const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r: String(r), s, red: s === '♥' || s === '♦' });
        const stock = shuffle(d);
        hands = { 1: stock.splice(0, 5), 2: stock.splice(0, 5) };
        up = stock.pop();
        trump = null; maker = 0; phase = 'bid1'; bidder = 3 - dealer; trick = []; won = { 1: 0, 2: 0 }; leader = 3 - dealer; sel = -1;
        g.sfx('capture');
        g.toast(`deal ${dealNo} · ${esc(g.name(dealer))} deals · turned ${up.r}${up.s}`, 1500);
        draw();
      }
      function draw() {
        if (over) return;
        info.innerHTML = `deal ${dealNo}/${MAX_DEALS} · turned <b>${up ? up.r + up.s : '—'}</b>${trump ? ` · trumps <b>${trump}</b> (maker ${esc(g.name(maker))})` : ''} · score ${sc[1]}–${sc[2]}`;
        trickRow.innerHTML = '';
        trick.forEach((t2) => { const box = h('div', { class: 'col', style: { textAlign: 'center' } }); box.appendChild(UI.card(t2.card, { large: true })); box.appendChild(h('div', { class: 'muted', text: g.name(t2.p) })); trickRow.appendChild(box); });
        btnRow.innerHTML = '';
        handRow.innerHTML = '';
        if (phase === 'bid1') {
          btnRow.appendChild(h('button', { class: 'btn primary', text: `⬆ Order up ${up.s}`, onclick: accept }));
          btnRow.appendChild(h('button', { class: 'btn', text: '⏭ Pass', onclick: passFirst }));
          btnRow.appendChild(h('span', { class: 'muted', text: `${esc(g.name(bidder))} — take the turned suit or pass` }));
        } else if (phase === 'bid2') {
          SUITS.filter((s) => s !== up.s).forEach((s) => btnRow.appendChild(h('button', { class: 'btn', text: `🎩 ${s}`, onclick: () => nameTrump(s) })));
          btnRow.appendChild(h('button', { class: 'btn', text: '⏭ Pass hand', onclick: passSecond }));
          btnRow.appendChild(h('span', { class: 'muted', text: `${esc(g.name(bidder))} — call a suit (the turned ${up.s} is dead)` }));
        } else if (phase === 'discard') {
          btnRow.appendChild(h('button', { class: 'btn primary', text: sel >= 0 ? `✔ discard ${hands[maker][sel].r}${hands[maker][sel].s}` : '✔ pick a card to discard', onclick: doDiscard }));
        } else if (phase === 'play') {
          hands[leader].forEach((c, i) => handRow.appendChild(UI.card(c, { large: true, onClick: () => play(i) })));
        } else if (phase === 'count') {
          [1, 2].forEach((p) => btnRow.appendChild(h('span', { class: 'tag', text: `${g.name(p)} took ${won[p]}` })));
        }
        if (phase !== 'play' && phase !== 'discard') {
          // during bidding the hands are hidden to keep the pass honest but visible for hot-seat play
        }
        if (phase === 'bid1' || phase === 'bid2' || phase === 'discard') {
          const p = phase === 'discard' ? maker : bidder;
          hands[p].forEach((c, i) => {
            const el = UI.card(c, { large: true, onClick: () => { sel = sel === i ? -1 : i; draw(); } });
            if (sel === i) el.classList.add('hl');
            handRow.appendChild(el);
          });
        }
        stat.set('a', sc[1]); stat.set('b', sc[2]); stat.set('t', `${won[1]}–${won[2]}`);
        g.points(sc[1], sc[2]);
        const who = phase === 'play' ? leader : phase === 'discard' ? maker : bidder;
        g.turn(who, `<span class="pc${who}">${esc(g.name(who))}</span> — ${phase === 'play' ? `beat ${trick.length ? trick[0].card.r + trick[0].card.s : 'the lead'}` : phase === 'discard' ? 'add the turned card, then discard one' : 'your call'}`);
      }
      function accept() {
        if (phase !== 'bid1') return g.sfx('bad');
        maker = bidder; trump = up.s;
        hands[maker].push(up); up = null;
        phase = 'discard';
        g.sfx('coin'); g.toast(`${esc(g.name(maker))} orders it up — discard one`, 1100);
        draw();
      }
      function passFirst() {
        if (phase !== 'bid1') return;
        g.sfx('click');
        if (bidder === 3 - dealer) { bidder = dealer; draw(); return; }     // dealer gets first refusal
        phase = 'bid2'; bidder = 3 - dealer;
        g.toast('passed — second round, name any other suit', 900); draw();
      }
      function nameTrump(s) {
        if (phase !== 'bid2') return;
        maker = bidder; trump = s; phase = 'play'; leader = 3 - dealer;
        g.sfx('coin'); g.toast(`${esc(g.name(maker))} names ${s}`, 1100); draw();
      }
      function passSecond() {
        if (phase !== 'bid2') return;
        if (bidder === 3 - dealer) { bidder = dealer; draw(); return; }
        g.toast('both passed — misdeal', 1100);
        phase = 'count'; draw();
        if (dealNo >= MAX_DEALS) return finish();
        setTimeout(newDeal, 600);
      }
      function doDiscard() {
        if (phase !== 'discard' || sel < 0) return g.sfx('bad');
        hands[maker].splice(sel, 1); sel = -1;
        phase = 'play'; leader = 3 - dealer; g.sfx('click'); draw();
      }
      function play(i) {
        if (phase !== 'play') return g.sfx('bad');
        let idx = i;
        const opp = 3 - leader;
        if (trick.length) {
          const led = trick[0].card.s;
          if (hands[leader][i].s !== led && hands[leader].some((c) => c.s === led)) {
            const mine = hands[leader].map((c, k) => [c, k]).filter(([c]) => c.s === led).sort((a, b) => rankVal(a[0].r) - rankVal(b[0].r))[0];
            idx = mine[1];
            g.toast('must follow suit', 800);
          }
        }
        const c = hands[leader].splice(idx, 1)[0];
        trick.push({ card: c, p: leader });
        g.sfx('move');
        if (trick.length === 2) return resolve();
        leader = opp; draw();
      }
      function resolve() {
        const [a, b] = trick;
        let w = power(a.card) >= power(b.card) ? a.p : b.p;
        if (power(a.card) === power(b.card)) w = a.p;         // led wins ties
        won[w]++;
        trick = [];
        g.sfx(w === leader ? 'capture' : 'move');
        g.toast(`${esc(g.name(w))} takes the trick`, 700);
        if (won[1] + won[2] === 5) return scoreRound();
        leader = w;
        draw();
      }
      function scoreRound() {
        phase = 'count';
        const m = maker, d = 3 - m;
        let pts = 0, to = 0, why = '';
        if (won[m] >= 5) { pts = 2; to = m; why = `${esc(g.name(m))} marches — all five tricks`; }
        else if (won[m] >= 3) { pts = 1; to = m; why = `${esc(g.name(m))} makes ${won[m]} tricks`; }
        else { pts = 2; to = d; why = `Euchered! defence takes ${won[d]}`; }
        sc[to] += pts;
        draw();
        if (sc[1] >= GOAL || sc[2] >= GOAL || dealNo >= MAX_DEALS) return finish();
        dealer = 3 - dealer;
        g.toast(`${why} — ${pts} to ${esc(g.name(to))}`, 900);
        setTimeout(newDeal, 950);
      }
      function finish() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (sc[1] === sc[2]) return g.draw(`Eight deals, both pegged at ${sc[1]} — honours of euchre shared.`);
        g.win(sc[1] > sc[2] ? 1 : 2, `Euchre! final ${sc[1]}–${sc[2]}.`);
      }
      dealer = starter;
      newDeal();
    },
    onStop() { starter = 3 - starter; },
  });
})();
