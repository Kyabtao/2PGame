/* Spades · Two-Hand Duel — bid your tricks, break nothing, and never get nil-burned. */
(function () {
  const SU = ['♠', '♥', '♦', '♣'];
  const NAME = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  const GOAL = 150, MAXH = 4;
  let starter = 1;
  Game.init({
    id: 'spades',
    rules: [
      'Thirteen-card hands (half the deck stays in the box). Bid your tricks first — 10 × bid if you make it, +1 per overtrick, −10 × bid if you come up short.',
      'A NIL bid pays +40 when you win zero tricks and costs −40 if you sneeze one. Spades are always trump: you must follow suit; a spade beats any non-spade, the bigger spade wins.',
      'Four hands to 150, or straight to the tally when the last deal lands — higher score takes the table.',
    ],
    controls: { all: 'Bid stepper → Confirm · tap a card each trick' },
    points: true,
    onStart(g) {
      const tot = { 1: 0, 2: 0 };
      let hands, bid, tricks, turn, led, table, handNo = 0, phase = 'bid', over = false, broke = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const tableRow = h('div', { class: 'row' });
      const myRow = h('div', { class: 'row wrap', style: { maxWidth: '760px' } });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'h', label: 'hand', val: 1 }]);
      wrap.append(info, tableRow, myRow, btnRow, stat.el);
      const L = (c) => `${NAME[c.r] || c.r}${c.s}`;
      const rv = (c) => (c.r === 1 ? 14 : c.r);
      function dealHand() {
        handNo++;
        if (handNo > MAXH || tot[1] >= GOAL || tot[2] >= GOAL || over) return end();
        const deck = [];
        for (const s of SU) for (let r = 1; r <= 13; r++) deck.push({ r, s });
        shuffle(deck);
        hands = { 1: deck.slice(0, 13), 2: deck.slice(13, 26) };
        for (const p of [1, 2]) hands[p].sort((a, b) => (a.s === '♠' ? 1 : 0) - (b.s === '♠' ? 1 : 0) || SU.indexOf(a.s) - SU.indexOf(b.s) || a.r - b.r);
        bid = { 1: 4, 2: 4 };
        tricks = { 1: 0, 2: 0 };
        phase = 'bid';
        turn = starter;
        broke = handNo > 1 && (broke || false);
        g.sfx('tick');
        draw();
      }
      function playable(p) {
        if (!led) return hands[p];
        const f = hands[p].filter((c) => c.s === led);
        if (f.length) return f;
        const sp = hands[p].filter((c) => c.s === '♠');
        return sp.length ? sp : hands[p];
      }
      function draw() {
        if (over) return;
        if (phase === 'bid') {
          info.innerHTML = `hand ${handNo}/${MAXH} · <b class="pc${turn}">${esc(g.name(turn))}</b> bids tricks (0 = nil, +40/−40)`;
          tableRow.innerHTML = '';
          myRow.innerHTML = '';
          hands[turn].forEach((c) => myRow.appendChild(UI.card({ r: c.r, s: c.s, red: c.s === '♥' || c.s === '♦' }, {})));
          btnRow.innerHTML = '';
          const dn = h('button', { class: 'chip', text: '⬇', onclick: () => { bid[turn] = Math.max(0, bid[turn] - 1); g.sfx('click'); draw(); } });
          const up = h('button', { class: 'chip', text: '⬆', onclick: () => { bid[turn] = Math.min(13, bid[turn] + 1); g.sfx('click'); draw(); } });
          const ok = h('button', { class: 'btn primary', text: `📢 announce ${bid[turn] === 0 ? 'NIL' : bid[turn]}`, onclick: confirmBid });
          btnRow.append(dn, h('span', { class: 'tag', text: `bid: ${bid[turn]}` }), up, ok);
          g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — set the contract`);
          stat.set('a', tot[1]); stat.set('b', tot[2]); g.points(tot[1], tot[2]); stat.set('h', handNo + '/' + MAXH);
          return;
        }
        info.innerHTML = `hand ${handNo} · tricks ${tricks[1]}(${bid[1]})–${tricks[2]}(${bid[2]}) · ${table.length ? `table ${table.map((t) => L(t.c)).join(' vs ')}` : `<b class="pc${turn}">${esc(g.name(turn))}</b> leads`}`;
        tableRow.innerHTML = '';
        table.forEach((t) => tableRow.appendChild(h('span', { class: 'tag', text: L(t.c), style: { fontSize: '1.1rem' } })));
        myRow.innerHTML = '';
        const ok = playable(turn);
        hands[turn].forEach((c) => {
          const legal = ok.includes(c);
          if (!legal) { myRow.appendChild(h('span', { class: 'tag', text: L(c), style: { opacity: .4, margin: '0 .15rem' } })); return; }
          myRow.appendChild(UI.card({ r: c.r, s: c.s, red: c.s === '♥' || c.s === '♦' }, { onClick: () => playCard(c) }));
        });
        myRow.appendChild(h('span', { class: 'muted', text: `rival has ${hands[3 - turn].length}` }));
        btnRow.innerHTML = '';
        stat.set('a', tot[1]); stat.set('b', tot[2]); stat.set('h', handNo + '/' + MAXH);
        g.points(tot[1], tot[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${led ? `follow ${led}` : 'lead anything'}`);
      }
      function confirmBid() {
        if (turn === starter) { turn = 3 - starter; draw(); g.toast(`${esc(g.name(3 - starter))} — your bid`, 900); return; }
        phase = 'play';
        turn = starter;
        led = null; table = [];
        g.sfx('coin');
        draw();
      }
      function playCard(c) {
        hands[turn].splice(hands[turn].indexOf(c), 1);
        if (!led) led = c.s;
        table.push({ p: turn, c });
        g.sfx('move');
        if (table.length === 1) { turn = 3 - turn; led = c.s; return draw(); }
        const [a, b] = table;
        const trumpA = a.c.s === '♠', trumpB = b.c.s === '♠';
        const w = trumpB && !trumpA ? b : trumpA && !trumpB ? a : a.c.s === led && b.c.s === led ? (rv(a.c) >= rv(b.c) ? a : b) : trumpA && trumpB ? (rv(a.c) >= rv(b.c) ? a : b) : a;
        tricks[w.p]++;
        g.toast(`${g.name(w.p)} takes it`, 800);
        table = []; led = null; turn = w.p;
        if (!hands[1].length && !hands[2].length) return scoreHand();
        draw();
      }
      function scoreHand() {
        let msg = '';
        for (const p of [1, 2]) {
          if (bid[p] === 0) {
            if (tricks[p] === 0) { tot[p] += 40; msg += `${g.name(p)} nil +40 · `; }
            else { tot[p] -= 40; broke = true; msg += `${g.name(p)} nil BUSTED −40 (bag: ${tricks[p]}) · `; }
          } else if (tricks[p] >= bid[p]) {
            tot[p] += 10 * bid[p] + (tricks[p] - bid[p]);
            msg += `${g.name(p)} ${tricks[p]}/${bid[p]} +${10 * bid[p] + (tricks[p] - bid[p])} · `;
          } else {
            tot[p] -= 10 * bid[p];
            msg += `${g.name(p)} set −${10 * bid[p]} · `;
          }
        }
        g.sfx('coin'); g.toast(msg.slice(0, 70) || 'hand scored', 2000);
        stat.set('a', tot[1]); stat.set('b', tot[2]); g.points(tot[1], tot[2]);
        starter = 3 - starter;
        setTimeout(dealHand, 2000);
      }
      function end() {
        over = true;
        g.turn();
        if (tot[1] === tot[2]) return g.draw(`Spades end dead even at ${tot[1]}.`);
        g.win(tot[1] > tot[2] ? 1 : 2, `Spades book closes ${tot[1]}–${tot[2]}.`);
      }
      dealHand();
    },
    onStop() { starter = 3 - starter; },
  });
})();
