/* Crazy Eights — match suit or rank, eights are wild. Hidden hands via pass. */
(function () {
  Game.init({
    id: 'crazy-eights',
    rules: ['Eight cards each. Play a card matching the top card\'s suit or rank. Eights are wild — play one and pick the new suit.', 'No playable card? Draw from the stock until you can play (or the stock runs out, then pass).', 'First to empty their hand wins. If the stock runs out and nobody can play, fewest cards wins.'],
    controls: { all: 'Tap a card to play it · <b>Draw</b> button when stuck' },
    points: true,
    async onStart(g) {
      let stock = UI.deck(); const hands = { 1: stock.splice(0, 8), 2: stock.splice(0, 8) }; const discard = []; let suit = null, turn = 1, busy = false, stuck = 0;
      do { discard.push(stock.pop()); } while (discard[discard.length - 1].r === '8');
      suit = discard[discard.length - 1].s;
      const wrap = h('div', { class: 'col', style: { width: 'min(760px,100%)' } }); g.stage.appendChild(wrap);
      const top = () => discard[discard.length - 1];
      const canPlay = (c) => c.r === '8' || c.s === suit || c.r === top().r;
      const reshuffle = () => { if (!stock.length && discard.length > 1) { const t = discard.pop(); stock = shuffle(discard.splice(0)); discard.push(t); } };
      const render = (p, msg) => {
        wrap.innerHTML = ''; hands[p].sort((a, b) => a.s === b.s ? a.v - b.v : a.s < b.s ? -1 : 1);
        const hand = h('div', { class: 'hand' }); hands[p].forEach((c) => hand.appendChild(UI.card(c, { onClick: () => play(p, c), sel: false })));
        hand.querySelectorAll('.card').forEach((el, i) => { if (!canPlay(hands[p][i])) el.style.opacity = 0.45; });
        const playable = hands[p].some(canPlay);
        wrap.append(
          h('div', { class: 'row spread' }, h('span', { class: 'tag pc1' }, `${g.name(1)}: ${hands[1].length} cards`), h('span', { class: 'tag' }, `Stock: ${stock.length}`), h('span', { class: 'tag pc2' }, `${g.name(2)}: ${hands[2].length} cards`)),
          h('div', { class: 'row', style: { alignItems: 'center', gap: '1.5rem' } }, UI.card(null, { back: true, onClick: () => drawCard(p) }), UI.card(top(), { large: true }), h('div', { class: 'bigmsg', style: { fontSize: '1.6rem', color: suit === '♥' || suit === '♦' ? '#ff6b6b' : '#fff' } }, `Suit: ${suit}`)),
          h('div', { class: 'muted' }, msg || (playable ? `${g.name(p)}: play a card` : `${g.name(p)}: no playable card — draw`)),
          hand,
          h('div', { class: 'row' }, h('button', { class: 'btn primary', text: stock.length ? 'Draw a card' : 'Pass (stock empty)', onclick: () => drawCard(p) }))
        );
        g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> · suit ${suit}`); g.points(hands[1].length, hands[2].length);
      };
      const endTurn = async (p) => { turn = 3 - p; await g.pass(turn); if (g.over) return; render(turn); busy = false; };
      async function play(p, c) {
        if (busy || g.over || p !== turn || !canPlay(c)) return; busy = true;
        hands[p].splice(hands[p].indexOf(c), 1); discard.push(c); g.sfx('move'); stuck = 0;
        if (!hands[p].length) { g.points(hands[1].length, hands[2].length); return g.win(p, `Emptied hand; ${g.name(3 - p)} held ${hands[3 - p].length}.`); }
        if (c.r === '8') { const s = await pickSuit(p); if (g.over) return; suit = s; g.sfx('coin'); } else suit = c.s;
        render(p, `Played ${c.r}${c.s}`); await sleep(600); if (g.over) return; endTurn(p);
      }
      function pickSuit(p) { return new Promise((res) => { g.modal({ title: 'Wild eight! Pick a suit', cls: 'p' + p, buttons: UI.SUITS.map((s) => ({ label: s, cls: 'big', onClick: () => res(s) })), dismiss: false }); }); }
      async function drawCard(p) {
        if (busy || g.over || p !== turn) return; busy = true;
        reshuffle();
        if (!stock.length) { if (!hands[p].some(canPlay)) { stuck++; if (stuck >= 2) { const a = hands[1].length, b = hands[2].length; if (a === b) return g.draw('Stock empty — same hand size.'); return g.win(a < b ? 1 : 2, `Stock empty — ${Math.min(a, b)} cards vs ${Math.max(a, b)}.`); } render(p, 'Nothing to draw — passing.'); await sleep(700); if (g.over) return; return endTurn(p); } busy = false; return; }
        const c = stock.pop(); hands[p].push(c); g.sfx('move'); render(p, `Drew ${c.r}${c.s}${canPlay(c) ? ' — you can play it!' : ''}`); busy = false;
      }
      await g.pass(1); if (g.over) return; render(1);
    },
  });
})();
