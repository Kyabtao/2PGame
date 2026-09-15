/* Gin Rummy — real 10-card gin: draw, discard, knock, gin, undercut; lay-offs auto-optimised. Game to 100. */
(function () {
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const VAL = (r) => RANKS.indexOf(r) + 1;
  const SUITS = ['♠', '♥', '♦', '♣'];
  let starter = 1;
  const deck52 = () => { const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s, red: s === '♥' || s === '♦' }); return shuffle(d); };
  const hdead = (h) => h.reduce((a, c) => a + (c.r === 'A' ? 1 : c.r === '10' || c.r === 'J' || c.r === 'Q' || c.r === 'K' ? 10 : +c.r), 0);

  // exact max-meld packing via bitmask DP → returns {pts, melds}
  function pack(hand) {
    const n = hand.length;
    if (n > 13) return { pts: 0, melds: [] };   // pathological size — bail out safely
    const key = (i) => VAL(hand[i].r) * 10 + SUITS.indexOf(hand[i].s);
    const melds = [];
    for (let m = 1; m < (1 << n); m++) {
      const sel = []; for (let i = 0; i < n; i++) if (m & (1 << i)) sel.push(i);
      if (sel.length < 3) continue;
      let ok = sel.every((i) => hand[i].r === hand[sel[0]].r);
      if (!ok && sel.every((i) => hand[i].s === hand[sel[0]].s)) {
        const v = sel.map((i) => VAL(hand[i].r)).sort((a, b) => a - b);
        ok = v.every((x, i2) => i2 === 0 || x === v[i2 - 1] + 1);
      }
      if (ok) melds.push({ mask: m, sel, pts: sel.reduce((a, i) => a + (VAL(hand[i].r) > 10 ? 10 : VAL(hand[i].r)), 0) });
    }
    const byBit = [];
    for (let b = 0; b < n; b++) byBit[b] = melds.filter((m) => m.mask & (1 << b));
    const memo = new Array(1 << n).fill(-1);
    const f = (mask) => {
      if (!mask) return 0;
      if (memo[mask] >= 0) return memo[mask];
      let low = 0; while (!(mask & (1 << low))) low++;
      let best = f(mask ^ (1 << low));                       // leave the card unmelded
      for (const m of byBit[low]) {
        if ((m.mask & mask) === m.mask) best = Math.max(best, m.pts + f(mask ^ m.mask));
      }
      return (memo[mask] = best);
    };
    // recover the chosen melds
    const chosen = [];
    (function recover(mask) {
      if (!mask) return;
      let low = 0; while (!(mask & (1 << low))) low++;
      let take = null;
      for (const m of byBit[low]) if ((m.mask & mask) === m.mask && m.pts + f(mask ^ m.mask) === f(mask)) { take = m; break; }
      if (take) { chosen.push(take.sel.map((i) => hand[i])); recover(mask ^ take.mask); } else recover(mask ^ (1 << low));
    })((1 << n) - 1);
    return { pts: f((1 << n) - 1), melds: chosen };
  }
  const wood = (hand) => hdead(hand) - pack(hand).pts;

  Game.init({
    id: 'gin-rummy',
    rules: [
      '10 cards each; the first player may take the turned-up card or decline (then the rival may have it). Draw, then discard one card — that is the whole of a turn.',
      'Melds are 3+ of a rank or 3+ running in one suit (aces only low) and stay hidden in your hand until the round ends.',
      'Knock after discarding when your own deadwood is 10 or fewer; declare Gin when it is nil.',
      'Round ends with a deadwood comparison: difference scored, Gin pays 25 plus the rival’s deadwood, and an undercut (rival at or below your deadwood) pays 25 plus the difference.',
      'Lay-offs onto the revealed melds are counted automatically for both sides. First to 100 wins.',
    ],
    controls: { all: 'Tap deck or discard to draw · tap a card to discard · 🎯 Knock / ★ Gin when offered' },
    points: true,
    onStart(g) {
      const score = { 1: 0, 2: 0 };
      let handNo = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const table = h('div', { class: 'row', style: { gap: '1rem' } });
      const btnRow = h('div', { class: 'row' });
      const handBox = h('div', { class: 'col' });
      const handRow = h('div', { class: 'row wrap', style: { maxWidth: 640 } });
      const reveal = h('div', { class: 'col' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'r', label: 'hand', val: 1 }]);
      handBox.append(h('h3', { text: 'Your hand', style: { fontSize: '.85rem' } }), handRow);
      wrap.append(info, table, btnRow, handBox, reveal, stat.el);
      let stock = [], disc = [], hands = { 1: [], 2: [] }, turn = 1, drew = false, frozen = null, phase = 'play', knockedBy = 0, passedUp = 0;
      function newHand() {
        handNo++; if (over) return;
        stock = deck52(); disc = []; frozen = null; passedUp = 0; knockedBy = 0; phase = 'play'; drew = false;
        hands[1] = stock.splice(0, 10); hands[2] = stock.splice(0, 10);
        disc.push(stock.pop());
        turn = starter;
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${turn === starter ? 'you may take the upcard' : 'draw: deck or discard'}`);
        g.sfx('capture'); draw();
      }
      function draw() {
        if (over) return;
        info.innerHTML = `stock <b>${stock.length}</b> · upcard <b>${disc.length ? disc[disc.length - 1].r + disc[disc.length - 1].s : '—'}</b> · hand ${handNo} · ${score[1]}–${score[2]}`;
        table.innerHTML = '';
        if (phase === 'play') {
          table.appendChild(h('button', { class: 'card', text: 'deck', style: { width: '64px', height: '90px', display: 'grid', placeItems: 'center', background: 'repeating-linear-gradient(45deg,#3b4dc2 0 6px,#2c3aa0 6px 12px)', border: '3px solid #fff', color: '#fff', fontWeight: 800 }, onclick: () => drawFrom('stock') }));
          const top = disc[disc.length - 1];
          if (top) {
            const el = UI.card(top, { large: true, onClick: () => drawFrom('disc') });
            el.appendChild(h('div', { class: 'muted', text: frozen === top ? 'frozen' : 'draw', style: { textAlign: 'center', fontSize: '.65rem' } }));
            table.appendChild(el);
          }
        }
        handRow.innerHTML = '';
        btnRow.innerHTML = '';
        reveal.innerHTML = '';
        if (phase === 'play') {
          hands[turn].forEach((c, i) => handRow.appendChild(UI.card(c, { large: true, onClick: () => discard(i) })));
          const w = wood(hands[turn]);
          if (drew && w <= 10) btnRow.appendChild(h('button', { class: 'btn ' + (w === 0 ? 'primary' : ''), text: w === 0 ? '★ GIN!' : `🎯 Knock (deadwood ${w})`, onclick: () => knock(w === 0) }));
          if (!drew) btnRow.appendChild(h('span', { class: 'muted', text: 'draw a card first' }));
        }
        stat.set('a', score[1]); stat.set('b', score[2]); stat.set('r', `${handNo}`);
        g.points(score[1], score[2]);
      }
      function drawFrom(src) {
        if (phase !== 'play' || drew) return g.sfx('bad');
        if (src === 'stock') {
          if (!stock.length) { abort(); return; }
          hands[turn].push(stock.pop());
        } else {
          const top = disc[disc.length - 1];
          if (!top || top === frozen) { g.sfx('bad'); g.toast('the upcard was declined — it is frozen', 1000); return; }
          hands[turn].push(disc.pop());
        }
        if (src === 'stock' && disc.length === 1 && passedUp < 1) { passedUp++; if (passedUp >= 2) frozen = disc[0]; }
        draw();
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — discard one card (you may knock: deadwood ${wood(hands[turn])})`);
      }
      function discard(i) {
        if (phase !== 'play') return g.sfx('bad');
        if (!drew) {                       // convenience used by every mobile gin app: tapping a card draws the stock then sheds it
          if (!stock.length) { abort(); return; }
          hands[turn].push(stock.pop()); drew = true;
        }
        const c = hands[turn].splice(i, 1)[0];
        if (!stock.length && turn !== starter) { /* last possible discard */ }
        disc.push(c);
        g.sfx('click'); drew = false; turn = 3 - turn;
        if (!stock.length) { abort(); return; }
        draw();
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — draw (deadwood in hand: ${wood(hands[turn])})`);
      }
      function knock(gin) {
        if (phase !== 'play' || !drew) return g.sfx('bad');
        phase = 'end'; knockedBy = turn;
        finish(gin);
      }
      function abort() {
        phase = 'end';
        const a = wood(hands[1]), b = wood(hands[2]);
        if (a === b) return endRound(0, 0, `Stock ran out — ${a} deadwood each, no score.`);
        endRound(a < b ? 1 : 2, Math.abs(a - b), `Stock ran out — deadwood ${a} vs ${b} scored by the tighter hand.`);
      }
      function finish(gin) {
        const k = knockedBy, o = 3 - k;
        const km = pack(hands[k]);
        // lay-offs: rival may shed cards that extend either side's melds (scored automatically, best deadwood first)
        let ow = wood(hands[o]);
        if (!gin) {
          const pool = hands[o].slice();
          let changed = true;
          while (changed) {
            changed = false;
            for (const meld of km.melds) {
              const isSet = meld.every((c) => c.r === meld[0].r);
              const vs = meld.map((c) => VAL(c.r));
              const lo = Math.min(...vs), hi = Math.max(...vs);
              const cand = pool.find((c) => (isSet ? c.r === meld[0].r : (c.s === meld[0].s && (VAL(c.r) === lo - 1 || VAL(c.r) === hi + 1))));
              if (cand) { pool.splice(pool.indexOf(cand), 1); changed = true; }
            }
            if (changed) ow = hdead(pool);
          }
        }
        let w, pts, why;
        const kw = hdead(hands[k]) - km.pts;
        if (gin) { w = k; pts = 25 + wood(hands[o]); why = `Gin — ${25} plus ${wood(hands[o])} of rival deadwood`; }
        else if (ow <= kw) { w = o; pts = 25 + kw - ow; why = `Undercut! rival counted ${ow} against your knock ${kw}`; }
        else { w = k; pts = kw - ow; why = `Knock ${kw} vs ${ow} deadwood`; }
        [1, 2].forEach((p) => {
          const box = h('div', { class: 'row wrap' });
          box.appendChild(h('span', { class: 'tag', text: `${g.name(p)} (${p === k ? 'knocker' : 'rival'}) — ${pack(hands[p]).melds.length} melds` }));
          hands[p].forEach((c) => box.appendChild(UI.card(c, { small: true })));
          reveal.appendChild(box);
        });
        endRound(w, pts, why);
      }
      function endRound(w, pts, why) {
        if (w) score[w] += pts;
        g.points(score[1], score[2]);
        draw();
        if (score[1] >= 100 || score[2] >= 100) {
          over = true; const win = score[1] >= 100 ? 1 : 2;
          starter = 3 - starter;
          return g.win(win, `${esc(g.name(win))} takes the game ${score[win]}–${score[3 - win]} — ${why}.`);
        }
        g.toast(`${why} · ${score[1]}–${score[2]}`, 1000);
        setTimeout(newHand, 1100);
      }
      g.key(['KeyK'], () => { if (phase === 'play' && drew && wood(hands[turn]) <= 10) knock(wood(hands[turn]) === 0); });
      newHand();
    },
    onStop() { starter = 3 - starter; },
  });
})();
