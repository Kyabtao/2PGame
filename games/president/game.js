/* President — two-hand daihinmin: climb the ladder, dump your deck, nobody stays scrap for long. */
(function () {
  const SU = ['♠', '♥', '♦', '♣'];
  const NAME = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  const ORD = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1, 2];
  const pw = (r) => ORD.indexOf(r);
  let starter = 1;
  Game.init({
    id: 'president',
    rules: [
      'Twenty-six cards each. Ranks climb 3 → 2; the deuces are bombs, the 3♦ owns the very first lead.',
      'Lead one to four cards of one rank. To answer you must play the same count of strictly higher rank — or four of a kind, which flattens anything that isn’t a bigger bomb.',
      'Can’t (or won’t) beat it? Pass. One pass and the table clears to you — dump a new rank and keep the initiative.',
      'Empty your hand first and you are President (+2). Two deals decide who rules; a split is a draw.',
    ],
    controls: { all: 'Tap cards to select · Play / Pass' },
    points: true,
    onStart(g) {
      const wins = { 1: 0, 2: 0 };
      let hand, table, lastP, passCount, turn, leading, over = false, deal = 0, mustStart = null, opened = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const tableRow = h('div', { class: 'row' });
      const myRow = h('div', { class: 'row wrap', style: { maxWidth: '760px' } });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, tableRow, myRow, btnRow, stat.el);
      const sel = new Set();
      const L = (c) => `${NAME[c.r] || c.r}${c.s}`;
      function newDeal() {
        deal++;
        if (deal > 2 || over) return end();
        const deck = [];
        for (const s of SU) for (let r = 1; r <= 13; r++) deck.push({ r, s });
        shuffle(deck);
        hand = { 1: deck.slice(0, 26), 2: deck.slice(26) };
        for (const p of [1, 2]) hand[p].sort((a, b) => pw(a.r) - pw(b.r) || SU.indexOf(a.s) - SU.indexOf(b.s));
        table = []; lastP = null; passCount = 0; leading = true; opened = false;
        sel.clear();
        mustStart = { 1: hand[1].some((c) => c.r === 3 && c.s === '♦'), 2: hand[2].some((c) => c.r === 3 && c.s === '♦') };
        turn = deal === 1 ? (mustStart[1] ? 1 : 2) : (wonLast === 1 ? 1 : 2);
        g.sfx('tick');
        draw();
      }
      let wonLast = 1;
      function groupOf(p) { const m = {}; hand[p].forEach((c) => { (m[c.r] = m[c.r] || []).push(c); }); return m; }
      function chosen(p) { return [...sel].map((i) => hand[p][i]); }
      function canPlay(p, cards) {
        if (!cards.length || cards.some((c) => !c)) return false;
        if (!p) return false;
        if (cards.some((c) => c.r !== cards[0].r)) return false;
        if (leading) return true;
        const need = table.length;
        const bomb = cards.length === 4;
        const tableBomb = table.length === 4;
        if (bomb && !tableBomb) return true;
        if (tableBomb && !bomb) return false;
        return cards.length === need && pw(cards[0].r) > pw(table[0].r);
      }
      function firstDealRestrict(p, cards) { return deal === 1 && !canBeatAny(p, cards); }
      function canBeatAny(p, cards) { return canPlay(p, cards); }
      function draw() {
        if (over) return;
        info.innerHTML = `deal ${deal}/2 · ${hand[1].length}/${hand[2].length} cards · ${leading ? `<b class="pc${turn}">${esc(g.name(turn))}</b> leads fresh` : `must beat ${table.map(L).join(' ')} (${table.length} card${table.length > 1 ? 's' : ''}${table.length === 4 ? ' 💣' : ''}, rank ${NAME[table[0].r] || table[0].r})`}`;
        tableRow.innerHTML = '';
        table.forEach((c) => tableRow.appendChild(h('span', { class: 'tag', text: L(c), style: { fontSize: '1.1rem' } })));
        if (!table.length) tableRow.appendChild(h('span', { class: 'muted', text: 'open table' }));
        myRow.innerHTML = '';
        tableRow.appendChild(h('span', { class: 'muted', text: `rival holds ${hand[3 - turn].length}` }));
        const groups = groupOf(turn);
        btnRow.innerHTML = '';
        Object.keys(groups).map(Number).sort((a, b) => pw(a) - pw(b)).forEach((r) => {
          let cards = groups[r];
          if (!leading && table.length && cards.length > table.length) cards = cards.slice(0, table.length);
          const legal = canPlay(turn, cards) && !(deal === 1 && !opened && mustStart[turn] && !cards.some((c) => c.r === 3 && c.s === '♦'));
          const b = h('button', { class: 'chip', text: `${NAME[r] || r} ×${cards.length}`, disabled: !legal });
          b.addEventListener('click', () => { sel.clear(); cards.forEach((c) => sel.add(hand[turn].indexOf(c))); doPlay(); });
          btnRow.appendChild(b);
        });
        if (!leading) { const pb = h('button', { class: 'btn', text: '🏳 pass' }); pb.addEventListener('click', doPass); btnRow.appendChild(pb); }
        stat.set('a', wins[1]); stat.set('b', wins[2]);
        g.points(wins[1], wins[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${leading ? 'lead any rank' : 'beat or pass'}`);
      }
      function doPlay() {
        const cards = chosen(turn);
        if (!canPlay(turn, cards)) return g.sfx('bad');
        if (deal === 1 && !opened && mustStart[turn] && !cards.some((c) => c.r === 3 && c.s === '♦')) return g.sfx('bad');
        opened = true;
        cards.forEach((c) => hand[turn].splice(hand[turn].indexOf(c), 1));
        table = cards; lastP = turn; passCount = 0; leading = false;
        sel.clear();
        g.sfx(cards.length === 4 ? 'explode' : 'move');
        if (!hand[turn].length) { wins[turn] += 2; wonLast = turn; g.sfx('win'); g.toast(`${esc(g.name(turn))} is PRESIDENT — deck dumped`, 1700); stat.set('a', wins[1]); stat.set('b', wins[2]); g.points(wins[1], wins[2]); return setTimeout(newDeal, 1700); }
        turn = 3 - turn;
        draw();
      }
      function doPass() {
        if (leading) return g.sfx('bad');
        passCount++;
        sel.clear();
        g.sfx('bad');
        wonLast = lastP;
        if (passCount >= 1) {
          leading = true;
          table = [];
          turn = lastP;
          g.toast('table cleared — leader may dump anything', 1100);
        }
        draw();
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (wins[1] === wins[2]) return g.draw(`One republic each — ${wins[1]}–${wins[2]}.`);
        g.win(wins[1] > wins[2] ? 1 : 2, `The palace splits ${wins[1]}–${wins[2]}.`);
      }
      newDeal();
    },
    onStop() { starter = 3 - starter; },
  });
})();
