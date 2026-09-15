/* Hearts — two-handed duel: dodge the pigs, dump the queen, or dare the moon. */
(function () {
  const SU = ['♠', '♥', '♦', '♣'];
  const NAME = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  let starter = 1;
  Game.init({
    id: 'hearts',
    rules: [
      'Thirteen cards each from the full deck. Each trick: leader throws any card, the rival must follow the led suit if holding any; the higher card of that suit wins the trick and leads next. No trumps in two-hand hearts.',
      'Every heart taken is −1; the queen of spades is −13. You may pass the 2♥ before the first trick (tap it to flip your choice, opponent passes too).',
      'Take ALL thirteen hearts plus the queen and you shoot the moon: the rival eats −26 while yours goes clean.',
      'One hand decides the duel — whoever ends with fewer penalty points wins; equal misery is a draw.',
    ],
    controls: { all: 'Tap a card to play · 2♥ pre-hand pass button' },
    points: true,
    onStart(g) {
      const penalty = { 1: 0, 2: 0 };
      const tricks = { 1: 0, 2: 0 };
      const got = { 1: { h: 0, q: false }, 2: { h: 0, q: false } };
      let hands, turn, led, table, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const trickBox = h('div', { class: 'row' });
      const myRow = h('div', { class: 'row wrap', style: { maxWidth: '720px' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 't', label: 'tricks', val: 0 }]);
      wrap.append(info, trickBox, myRow, stat.el);
      const L = (c) => `${NAME[c.r] || c.r}${c.s}`;
      const val = (c) => (c.r === 1 ? 14 : c.r);
      const playable = (p) => {
        if (!led) return hands[p];
        const f = hands[p].filter((c) => c.s === led);
        return f.length ? f : hands[p];
      };
      function setup() {
        const deck = [];
        for (const s of SU) for (let r = 1; r <= 13; r++) deck.push({ r, s });
        shuffle(deck);
        hands = { 1: deck.slice(0, 13), 2: deck.slice(13) };
        for (const p of [1, 2]) hands[p].sort((a, b) => SU.indexOf(a.s) - SU.indexOf(b.s) || a.r - b.r);
        turn = whoStarts();
        led = null; table = [];
        g.sfx('tick');
        draw();
      }
      function whoStarts() { return hands[1].some((c) => c.s === '♥' && c.r === 2) ? 1 : 2; }
      function draw() {
        if (over) return;
        info.innerHTML = `trick ${tricks[1] + tricks[2] + (table.length ? 1 : 0)}/13 · ${table.length ? `table ${table.map((t) => L(t.c)).join(' vs ')}` : '<b class="pc' + turn + '">' + esc(g.name(turn)) + '</b> leads any card'}`;
        trickBox.innerHTML = '';
        table.forEach((t) => trickBox.appendChild(UI.card({ r: t.c.r, s: t.c.s, red: t.c.s === '♥' || t.c.s === '♦' }, {})));
        myRow.innerHTML = '';
        const ok = playable(turn);
        hands[turn].forEach((c) => {
          const legal = ok.includes(c);
          const el = UI.card({ r: c.r, s: c.s, red: c.s === '♥' || c.s === '♦' }, { onClick: () => legal && playCard(turn, c) });
          if (!legal) { el.style.opacity = .35; el.style.pointerEvents = 'none'; }
          myRow.appendChild(el);
        });
        stat.set('a', -penalty[1]); stat.set('b', -penalty[2]); stat.set('t', `${tricks[1] + tricks[2]}/13`);
        g.points(100 - penalty[1], 100 - penalty[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${led ? `must follow ${led}` : 'lead anything'}`);
      }
      function playCard(p, c) {
        const i = hands[p].indexOf(c);
        hands[p].splice(i, 1);
        if (!led) led = c.s;
        table.push({ p, c });
        g.sfx('move');
        if (table.length === 1) { turn = 3 - turn; return draw(); }
        const follow = table[1].c.s === led;
        const w = follow && val(table[1].c) > val(table[0].c) ? table[1] : table[0];
        const winner = w.p;
        table.forEach((t) => {
          if (t.c.s === '♥') { got[winner].h++; penalty[winner] += 1; }
          if (t.c.s === '♠' && t.c.r === 12) { got[winner].q = true; penalty[winner] += 13; }
        });
        tricks[winner]++;
        g.toast(`${g.name(winner)} takes the trick${penalty[winner] ? ` — ${got[winner].h}♥${got[winner].q ? ' +Q♠' : ''}` : ''}`, 1000);
        table = []; led = null; turn = winner;
        if (hands[1].length === 0) return finish();
        draw();
      }
      function finish() {
        if (got[1].h === 13 && got[1].q) { penalty[1] = 0; penalty[2] += 26; g.sfx('win'); g.toast(`${esc(g.name(1))} SHOOT THE MOON — rival eats 26!`, 2500); }
        else if (got[2].h === 13 && got[2].q) { penalty[2] = 0; penalty[1] += 26; g.sfx('win'); g.toast(`${esc(g.name(2))} SHOOT THE MOON — rival eats 26!`, 2500); }
        over = true;
        starter = 3 - starter;
        g.turn();
        stat.set('a', -penalty[1]); stat.set('b', -penalty[2]);
        g.points(100 - penalty[1], 100 - penalty[2]);
        if (penalty[1] === penalty[2]) return g.draw(`Equal misery — ${penalty[1]} penalty points each.`);
        g.win(penalty[1] < penalty[2] ? 1 : 2, `Hearts settle at −${penalty[1]} vs −${penalty[2]}.`);
      }
      setup();
    },
    onStop() { starter = 3 - starter; },
  });
})();
