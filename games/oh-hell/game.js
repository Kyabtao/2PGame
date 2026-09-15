/* Oh Hell! — bid your tricks exactly, then fight for them. 7→3 cards, five hands. */
(function () {
  const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const RV = (r) => RANKS.indexOf(r);
  const SUITS = ['♠', '♥', '♦', '♣'];
  const SIZES = [9, 7, 5, 3, 1];
  let starter = 1;
  Game.init({
    id: 'oh-hell',
    rules: [
      'Five hands: you are dealt 9, then 7, 5, 3 and finally 1 card. Before play, each side declares how many tricks it will take.',
      'The flipped card sets trumps; trumps beat any other suit, otherwise the highest card of the suit led wins. You must follow suit — if you cannot, any card goes.',
      'Bid exactly right and you score 10 plus 2 per trick won. Miss the bid and you lose points for the difference (bid 2, take 4? −2).',
      'Every hand size is odd, so both players can never make the same bid — exactly one of you is doomed to miss. Highest total after the last hand wins.',
    ],
    controls: { all: 'Tap a bid chip · tap a card to play it' },
    points: true,
    onStart(g) {
      const tot = { 1: 0, 2: 0 };
      let round = 0, over = false, n = 0, hands = { 1: [], 2: [] }, trump = null;
      let phase = 'bid', turn = 1, bid = { 1: null, 2: null }, trick = [], leader = 1, won = { 1: 0, 2: 0 };
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const trickRow = h('div', { class: 'row', style: { gap: '1.4rem', minHeight: 96 } });
      const bidRow = h('div', { class: 'row wrap' });
      const handRow = h('div', { class: 'row wrap', style: { maxWidth: 640, minHeight: 96 } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'r', label: 'hand', val: 1 }, { key: 'w', label: 'tricks', val: '0–0' }]);
      wrap.append(info, trickRow, bidRow, handRow, stat.el);
      function newRound() {
        round++; if (over) return;
        n = SIZES[round - 1];
        const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s, red: s === '♥' || s === '♦' });
        const stock = shuffle(d);
        hands = { 1: stock.splice(0, n), 2: stock.splice(0, n) };
        trump = stock.pop().s;
        phase = 'bid'; bid = { 1: null, 2: null }; trick = []; won = { 1: 0, 2: 0 };
        leader = starter; turn = starter;
        g.sfx('capture');
        g.toast(`hand ${round}: ${n} cards · trumps are ${trump}`, 1600);
        draw();
      }
      function draw() {
        if (over) return;
        info.innerHTML = `hand ${round}/${SIZES.length} · ${n} cards · trumps <b style="color:${trump === '♥' || trump === '♦' ? '#c0392b' : '#222'}">${trump}</b> · tricks taken ${won[1]}–${won[2]} of ${n}`;
        trickRow.innerHTML = '';
        trick.forEach((t2) => { const box = h('div', { class: 'col', style: { textAlign: 'center' } }); box.appendChild(UI.card(t2.card, { large: true })); box.appendChild(h('div', { class: 'muted', text: g.name(t2.p) })); trickRow.appendChild(box); });
        bidRow.innerHTML = '';
        if (phase === 'bid') {
          for (let b = 0; b <= n; b++) {
            const btn = h('button', { class: 'chip' + (bid[turn] === b ? ' on' : ''), text: String(b) });
            btn.addEventListener('click', () => {
              if (bid[turn] !== null) return;
              bid[turn] = b; g.sfx('click');
              if (bid[1] !== null && bid[2] !== null) {
                phase = 'play'; turn = leader;
                g.turn(leader, `leader: <span class="pc${leader}">${esc(g.name(leader))}</span> plays to trick 1`);
              } else { turn = 3 - turn; }
              draw();
            });
            bidRow.appendChild(btn);
          }
          bidRow.appendChild(h('span', { class: 'muted', text: `bid how many tricks you will take (${bid[1] ?? '—'} vs ${bid[2] ?? '—'})` }));
        }
        handRow.innerHTML = '';
        if (phase === 'play') {
          hands[turn].forEach((c, i) => handRow.appendChild(UI.card(c, { large: true, onClick: () => play(i) })));
        } else if (phase === 'done') {
          [1, 2].forEach((p) => handRow.appendChild(h('span', { class: 'tag', text: `${g.name(p)}: bid ${bid[p]}, took ${won[p]} → ${delta(p)}` })));
        }
        stat.set('a', tot[1]); stat.set('b', tot[2]); stat.set('r', `${round}/${SIZES.length}`); stat.set('w', `${won[1]}–${won[2]}`);
        g.points(tot[1], tot[2]);
        if (phase === 'bid') g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — make your bid (0–${n})`);
        if (phase === 'play' && trick.length) g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — beat it or dump`);
      }
      const delta = (p) => (bid[p] === won[p] ? 10 + 2 * won[p] : -(Math.abs(bid[p] - won[p])));
      function play(i) {
        if (phase !== 'play') return g.sfx('bad');
        let idx = i;
        if (trick.length) {
          const led = trick[0].card.s;
          const can = hands[turn].some((c) => c.s === led);
          if (can && hands[turn][i].s !== led) {
            idx = hands[turn].findIndex((c) => c.s === led && RV(c.r) === Math.min(...hands[turn].filter((c2) => c2.s === led).map((c2) => RV(c2.r))));
            g.toast('you must follow suit', 900);
          }
        }
        const c = hands[turn].splice(idx, 1)[0];
        trick.push({ card: c, p: turn });
        g.sfx('move');
        if (trick.length === 2) return resolve();
        turn = 3 - turn;
        draw();
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — follow ${trick[0].card.s}`);
      }
      function resolve() {
        const [a, b] = trick;
        let w = a.p;
        const ta = a.card.s === trump, tb = b.card.s === trump;
        if (tb && !ta) w = b.p;
        else if (ta && !tb) w = a.p;
        else if (ta && tb) w = RV(b.card.r) > RV(a.card.r) ? b.p : a.p;
        else if (a.card.s === b.card.s) w = RV(b.card.r) > RV(a.card.r) ? b.p : a.p;
        won[w]++;
        g.toast(`${esc(g.name(w))} takes the trick`, 750);
        trick = [];
        if (won[1] + won[2] >= n) return endRound();
        turn = w; leader = w;
        g.sfx('capture');
        draw();
        g.turn(w, `<span class="pc${w}">${esc(g.name(w))}</span> leads trick ${won[1] + won[2] + 1}`);
      }
      function endRound() {
        [1, 2].forEach((p) => { tot[p] += delta(p); });
        phase = 'done';
        draw();
        if (round >= SIZES.length) return finish();
        starter = 3 - starter;
        g.toast(`${esc(g.name(1))} +${delta(1)}, ${esc(g.name(2))} +${delta(2)}`, 1800);
        setTimeout(newRound, 1900);
      }
      function finish() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (tot[1] === tot[2]) return g.draw(`Five hands and both on ${tot[1]} — nobody out-bid the other.`);
        const w = tot[1] > tot[2] ? 1 : 2;
        g.win(w, `Oh Hell! — final ${tot[1]}–${tot[2]}.`);
      }
      newRound();
    },
    onStop() { starter = 3 - starter; },
  });
})();
