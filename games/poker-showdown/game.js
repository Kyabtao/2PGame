/* Poker Showdown — five-card draw, one side pot, and a nerve test at the felt. */
(function () {
  const SU = ['♠', '♥', '♦', '♣'];
  let starter = 1;
  const NAME = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  function rank5(cards) {
    const rs = cards.map((c) => c.r).sort((a, b) => a - b);
    const cnt = {};
    rs.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; });
    const groups = Object.entries(cnt).sort((a, b) => b[1] - a[1] || b[0] - a[0]).map(([r, n]) => [n, +r]);
    const flush = cards.every((c) => c.s === cards[0].s);
    const uniq = [...new Set(rs.map((r) => (r === 1 ? 14 : r)))].sort((a, b) => a - b);
    const straight = uniq.length === 5 && (uniq[4] - uniq[0] === 4 || (uniq.join() === '2,3,4,5,14'));
    let cat;
    if (straight && flush) cat = 8;
    else if (groups[0][0] === 4) cat = 7;
    else if (groups[0][0] === 3 && groups[1][0] === 2) cat = 6;
    else if (flush) cat = 5;
    else if (straight) cat = 4;
    else if (groups[0][0] === 3) cat = 3;
    else if (groups[0][0] === 2 && groups[1][0] === 2) cat = 2;
    else if (groups[0][0] === 2) cat = 1;
    else cat = 0;
    const names = ['high card', 'one pair', 'two pair', 'three of a kind', 'a straight', 'a flush', 'a full house', 'four of a kind', 'straight flush'];
    return { cat, kick: groups.map((x) => x[1]).join('.'), names: names[cat] };
  }
  const HANDNAMES = ['high card', 'pair', 'two pair', 'trips', 'straight', 'flush', 'full house', 'quads', 'straight flush'];
  Game.init({
    id: 'poker-showdown',
    rules: [
      'Eight chips each, two-chip antes, five-card draw. Bet round one: check, bet up to three, one raise allowed, or fold.',
      'Draw phase: tap up to three cards to toss, then Deal — fresh cards from the deck, no peeking at what you discarded.',
      'Second betting round with the same limits, then the showdown. The best poker hand takes the pot; ties chop it evenly.',
      'Hands play until a stack breaks under the ante or six hands are done. Chips decide the session.',
    ],
    controls: { all: 'Bet/check/fold buttons · tap cards to mark for the draw' },
    points: true,
    onStart(g) {
      const chips = { 1: 8, 2: 8 };
      let deck, hand, face, pot, bets, actor, phase, raiseUsed, mark, hi, roundNo = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const rivalRow = h('div', { class: 'row' });
      const myRow = h('div', { class: 'row wrap', style: { maxWidth: '560px' } });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 8 }, { key: 'b', label: g.name(2), val: 8 }, { key: 'h', label: 'hand', val: 1 }]);
      wrap.append(info, rivalRow, myRow, btnRow, stat.el);
      function newHand() {
        roundNo++;
        if (roundNo > 6 || chips[1] < 2 || chips[2] < 2) return end();
        deck = [];
        for (const s of SU) for (let r = 1; r <= 13; r++) deck.push({ r, s });
        shuffle(deck);
        hand = { 1: deck.splice(0, 5), 2: deck.splice(0, 5) };
        face = { 1: [], 2: [] };
        chips[1] -= 2; chips[2] -= 2; pot = 4;
        bets = { 1: 2, 2: 2 };
        raiseUsed = false;
        mark = new Set();
        phase = 'bet1';
        actor = 1; hi = 1;
        g.sfx('coin');
        draw();
      }
      const L = (c) => `${NAME[c.r] || c.r}${c.s}`;
      function draw() {
        if (over) return;
        info.innerHTML = `hand ${roundNo}/6 · pot <b>${pot}</b> · ${phase.startsWith('bet') ? `bet round (${bets[1]} vs ${bets[2]})` : phase === 'draw' ? 'discard up to 3, then deal' : 'showdown'}`;
        rivalRow.innerHTML = '';
        rivalRow.appendChild(h('h3', { text: `${g.name(3 - hi)} holds ${hand[3 - hi].length}${phase === 'show' ? `: ${hand[3 - hi].map(L).join(' ')}` : ' face-down'}` }));
        myRow.innerHTML = '';
        hand[hi].forEach((c, i) => {
          const el = UI.card({ r: c.r, s: c.s, red: c.s === '♥' || c.s === '♦' }, { onClick: () => { if (phase === 'draw' && hand[hi].length === 5) { mark.has(i) ? mark.delete(i) : (mark.size < 3 && mark.add(i)); draw(); } } });
          if (mark.has(i)) { el.style.outline = '3px solid var(--gold)'; el.style.transform = 'translateY(-8px)'; }
          myRow.appendChild(el);
        });
        btnRow.innerHTML = '';
        if (phase === 'draw') {
          btnRow.appendChild(h('button', { class: 'btn primary', text: `🂠 deal ${5 - mark.size} new card${mark.size === 1 ? '' : 's'}`, onclick: doDraw }));
        } else if (phase === 'show') {
          const p = rank5(hand[1]).cat, q = rank5(hand[2]).cat;
          const w = p === q ? (rank5(hand[1]).kick > rank5(hand[2]).kick ? 1 : rank5(hand[1]).kick < rank5(hand[2]).kick ? 2 : 0) : p > q ? 1 : 2;
          if (w) chips[w] += pot; else { chips[1] += pot / 2; chips[2] += pot / 2; }
          g.sfx(w ? 'win' : 'coin');
          g.toast(w ? `${esc(g.name(w))} takes ${pot} with ${HANDNAMES[w === 1 ? p : q]}` : `chop — ${HANDNAMES[p]} vs same`, 1700);
          stat.set('a', chips[1]); stat.set('b', chips[2]); g.points(chips[1], chips[2]);
          setTimeout(newHand, 1800);
          return;
        } else {
          hi = actor;
          const toCall = bets[3 - actor] - bets[actor];
          if (toCall === 0) btnRow.appendChild(h('button', { class: 'btn', text: '✅ check', onclick: () => act('call') }));
          else btnRow.appendChild(h('button', { class: 'btn', text: `📞 call ${toCall}`, onclick: () => act('call') }));
          for (let b = 1; b <= 3; b++) {
            if (bets[actor] + b > chips[actor]) continue;
            btnRow.appendChild(h('button', { class: 'btn warn', text: `⬆️ bet ${b}`, onclick: () => act('bet', b) }));
          }
          btnRow.appendChild(h('button', { class: 'btn', text: '🏳️ fold', onclick: () => act('fold') }));
        }
        stat.set('a', chips[1]); stat.set('b', chips[2]); stat.set('h', Math.min(roundNo, 6) + '/6');
        g.points(chips[1], chips[2]);
        g.turn(actor, phase.startsWith('bet') ? `<span class="pc${actor}">${esc(g.name(actor))}</span> — your action (vs ${g.name(3 - actor)})` : '');
      }
      function act(kind, amt) {
        if (kind === 'fold') {
          chips[3 - actor] += pot;
          g.sfx('bad'); g.toast(`${esc(g.name(actor))} folds — pot to ${esc(g.name(3 - actor))}`, 1500);
          stat.set('a', chips[1]); stat.set('b', chips[2]); g.points(chips[1], chips[2]);
          setTimeout(newHand, 1600);
          return;
        }
        if (kind === 'call') {
          const pay = Math.min(bets[3 - actor] - bets[actor], chips[actor]);
          bets[actor] += pay;
          chips[actor] -= pay;
          pot += pay;
        } else {
          bets[actor] += amt;
          chips[actor] -= amt;
          pot += amt;
          raiseUsed = true;
        }
        g.sfx('click');
        if (bets[1] === bets[2]) {
          if (phase === 'bet1') { phase = 'draw'; hi = 1; mark = new Set(); } else phase = 'show';
        } else {
          actor = 3 - actor;
        }
        draw();
      }
      function doDraw() {
        const keep = hand[hi].filter((_, i) => !mark.has(i));
        const drawn = deck.splice(0, 5 - keep.length);
        hand[hi] = keep.concat(drawn);
        if (hi === 1) { hi = 2; mark = new Set(); g.sfx('move'); draw(); return; }
        phase = 'bet2'; hi = 1; actor = 1; bets = { 1: 0, 2: 0 }; raiseUsed = false;
        g.sfx('coin');
        draw();
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (chips[1] === chips[2]) return g.draw(`Six hands, felt even: ${chips[1]} chips apiece.`);
        g.win(chips[1] > chips[2] ? 1 : 2, `Showdown cash count ${chips[1]}–${chips[2]}.`);
      }
      newHand();
    },
    onStop() { starter = 3 - starter; },
  });
})();
