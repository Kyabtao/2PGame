/* Gin Rummy · Blind Deal — golf-rummy cousin: draw blind, discard a loser, keep deadwood tiny. */
(function () {
  const Suits = ['♠', '♥', '♦', '♣'];
  let starter = 1;
  Game.init({
    id: 'gin-rummy-pass',
    rules: [
      'Ten cards each; the deck is cut and every draw from the stock is BLIND — you never see the top card first, and the discard pile is one-way.',
      'On your turn take one: the blind stock or the rival’s face-up discard — then dump any card. No melds to lay; your hand is deadwood only, scored at face value (picture 10, ace 1).',
      'With ten cards of low enough junk (10 or fewer) you may KNOCK: the rival gets exactly one face-up swap to try to undercut, then hands are laid open. Knock win = deadwood difference (+5 if you hold GIN at zero); a successful undercut flips the difference plus 10 to the rival.',
      'Run out of stock and the last discard decides: whoever laid the lower deadwood hand wins by the gap. One deal, no mercy.',
    ],
    controls: { all: 'Draw from 🎴 or the discard · tap a card to dump · 🔔 knock' },
    points: true,
    onStart(g) {
      const deck = [];
      for (const s of Suits) for (let r = 1; r <= 13; r++) deck.push({ r, s });
      shuffle(deck);
      const hand = { 1: deck.splice(0, 10), 2: deck.splice(0, 10) };
      let pile = [deck.pop()];
      let turn = starter, drew = false, over = false, knockStage = 0;
      const dead = (p) => hand[p].reduce((a, c) => a + Math.min(c.r, 10), 0);
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const stockRow = h('div', { class: 'row' });
      const handRow = h('div', { class: 'row wrap', style: { maxWidth: '640px' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: '—' }, { key: 'b', label: g.name(2), val: '—' }, { key: 'd', label: 'your deadwood', val: 0 }]);
      wrap.append(info, stockRow, handRow, stat.el);
      const NAME = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
      const label = (c) => NAME[c.r] || String(c.r);
      function draw() {
        if (over) return;
        info.innerHTML = knockStage === 1
          ? `<b class="pc${turn}">${esc(g.name(turn))}</b> — one mercy swap after the knock (stock only), then the hands drop`
          : drew ? `discard anything — <b class="pc${turn}">${esc(g.name(turn))}</b>`
          : `<b class="pc${turn}">${esc(g.name(turn))}</b> take one: blind stock (${deck.length}) or the discard`;
        stockRow.innerHTML = '';
        if (!drew && knockStage === 0) {
          const s = h('button', { class: 'btn', text: `🎴 blind stock (${deck.length})`, disabled: !deck.length });
          s.addEventListener('click', () => { if (!deck.length) return g.sfx('bad'); blindTake(); });
          const p = h('button', { class: 'btn', text: `♻️ take discard ${label(pile[pile.length - 1])}${pile[pile.length - 1].s}` });
          stockRow.append(s, p);
          p.addEventListener('click', () => { hand[turn].push(pile.pop()); drew = true; g.sfx('move'); draw(); });
        } else if (knockStage === 1) {
          const s = h('button', { class: 'btn primary', text: `🎴 draw the mercy card (${deck.length})`, disabled: !deck.length });
          s.addEventListener('click', () => {
            if (!deck.length) return g.sfx('bad');
            hand[turn].push(deck.pop());
            draw();
            g.toast('now discard one, then the hands drop', 1100);
            drew = true;
          });
          stockRow.appendChild(s);
        }
        handRow.innerHTML = '';
        hand[turn].forEach((c, i) => {
          const el = UI.card({ r: c.r, s: c.s, red: c.s === '♥' || c.s === '♦' }, { onClick: () => dump(i) });
          handRow.appendChild(el);
        });
        handRow.appendChild(h('span', { class: 'muted', text: `rival holds ${hand[3 - turn].length} face-down` }));
        if (drew && knockStage === 0 && dead(turn) <= 10) {
          handRow.appendChild(h('button', { class: 'btn warn', text: `🔔 knock — ${dead(turn)} deadwood`, onclick: doKnock }));
        }
        stat.set('a', dead(1)); stat.set('b', dead(2)); stat.set('d', dead(turn));
        g.points(dead(1), dead(2));
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${drew ? 'discard a loser' : 'draw'}`);
      }
      function blindTake() {
        hand[turn].push(deck.pop());
        drew = true;
        g.sfx('tick');
        draw();
      }
      function dump(i) {
        if (!drew || over || (knockStage === 1 && !drew)) return g.sfx('bad');
        const c = hand[turn].splice(i, 1)[0];
        pile.push(c);
        g.sfx('move');
        drew = false;
        if (knockStage === 1) return finish(dead(1), dead(2), true);
        turn = 3 - turn;
        if (!deck.length) return finish(dead(1), dead(2), false);
        draw();
      }
      function doKnock() {
        knockStage = 1;
        turn = 3 - turn;
        g.sfx('coin');
        g.toast(`${esc(g.name(3 - turn))} was knocked — one mercy draw`, 1200);
        if (!deck.length) return finish(dead(1), dead(2), true);
        draw();
      }
      function finish(d1, d2, wasKnocked) {
        over = true;
        starter = 3 - starter;
        g.turn();
        const knocker = 3 - turn;
        let w, gap, why;
        const diff = Math.abs(d1 - d2);
        if (!wasKnocked) {
          w = d1 === d2 ? 0 : d1 < d2 ? 1 : 2;
          why = `stock ran dry — deadwood ${d1} vs ${d2}`;
          gap = Math.ceil(diff / 2);
        } else if (d1 === d2) {
          w = 0; why = `deadwood ties at ${d1} — gin rules call it a wash`; gap = 0;
        } else {
          const loser = d1 === Math.min(d1, d2) ? 3 - (d1 < d2 ? 1 : 2) : 0; void loser;
          const better = d1 < d2 ? 1 : 2;
          if (better !== knocker) { w = better; why = `UNDERCUT — ${esc(g.name(better))} came down to ${Math.min(d1, d2)} against the knock (${Math.max(d1, d2)} + 10)`; gap = diff + 10; }
          else { w = better; why = `knock holds: ${d1} vs ${d2}${Math.min(d1, d2) === 0 ? ' — GIN! +5' : ''}`; gap = diff + (Math.min(d1, d2) === 0 ? 5 : 0); }
        }
        stat.set('a', d1); stat.set('b', d2); stat.set('d', gap);
        if (!w) return g.draw(`${why}.`);
        g.points(w === 1 ? gap : 0, w === 2 ? gap : 0);
        g.win(w, `${why}. Score ${gap}.`);
      }
      draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
