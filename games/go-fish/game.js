/* Go Fish — 7 cards each, ask for ranks, collect books of four. Hidden hands via pass. */
(function () {
  Game.init({
    id: 'go-fish',
    rules: ['Seven cards each. On your turn, ask your opponent for a rank you hold. If they have any, they hand over all of them and you go again.', 'Otherwise, "Go fish!" — draw from the pond. If you draw the rank you asked for, go again.', 'Four of a kind is a book. When the pond and hands run out, the most books wins.'],
    controls: { all: 'Tap a card in your hand to ask for that rank · pass the device between turns' },
    points: true,
    async onStart(g) {
      const pond = UI.deck(); const hands = { 1: pond.splice(0, 7), 2: pond.splice(0, 7) }; const books = { 1: [], 2: [] };
      let turn = 1;
      const wrap = h('div', { class: 'col', style: { width: 'min(760px,100%)' } }); g.stage.appendChild(wrap);
      const sortHand = (p) => hands[p].sort((a, b) => a.v - b.v);
      const checkBooks = (p) => { const byR = {}; hands[p].forEach((c) => { (byR[c.r] = byR[c.r] || []).push(c); }); let made = false; for (const r in byR) if (byR[r].length === 4) { books[p].push(r); hands[p] = hands[p].filter((c) => c.r !== r); made = true; g.sfx('coin'); g.toast(`${g.name(p)} books ${r}s!`, 1200); } g.points(books[1].length, books[2].length); return made; };
      checkBooks(1); checkBooks(2);
      const refill = (p) => { if (!hands[p].length && pond.length) hands[p].push(...pond.splice(0, Math.min(5, pond.length))); };
      const isOver = () => books[1].length + books[2].length === 13 || (!pond.length && (!hands[1].length || !hands[2].length));
      const finish = () => { const a = books[1].length, b = books[2].length; if (a === b) return g.draw(`${a} books each.`); g.win(a > b ? 1 : 2, `${Math.max(a, b)} books to ${Math.min(a, b)}.`); };
      const render = (p, msg) => {
        wrap.innerHTML = ''; sortHand(p);
        const hand = h('div', { class: 'hand' });
        const ranks = [...new Set(hands[p].map((c) => c.r))];
        hands[p].forEach((c) => hand.appendChild(UI.card(c, { onClick: () => ask(p, c.r) })));
        wrap.append(
          h('div', { class: 'row spread' }, h('span', { class: 'tag pc1' }, `${g.name(1)}: ${books[1].length} books (${hands[1].length} cards)`), h('span', { class: 'tag' }, `Pond: ${pond.length}`), h('span', { class: 'tag pc2' }, `${g.name(2)}: ${books[2].length} books (${hands[2].length} cards)`)),
          h('div', { class: 'row', style: { flexWrap: 'wrap' } }, ...[...books[1].map((r) => h('span', { class: 'tag pc1' }, r + '×4')), ...books[2].map((r) => h('span', { class: 'tag pc2' }, r + '×4'))]),
          h('div', { class: 'bigmsg', style: { fontSize: '1.1rem' } }, msg || `${g.name(p)}, tap a rank to ask for it`),
          hand,
          h('div', { class: 'row', style: { flexWrap: 'wrap' } }, ...ranks.map((r) => h('button', { class: 'btn sm p' + p, text: `Ask for ${r}s`, onclick: () => ask(p, r) })))
        );
        g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> asks…`);
      };
      let busy = false;
      async function ask(p, r) {
        if (busy || g.over || p !== turn) return; busy = true;
        const o = 3 - p; const got = hands[o].filter((c) => c.r === r);
        if (got.length) {
          hands[o] = hands[o].filter((c) => c.r !== r); hands[p].push(...got); g.sfx('capture');
          render(p, `${g.name(o)} hands over ${got.length} ${r}${got.length > 1 ? 's' : ''}! Go again.`); checkBooks(p); refill(p); refill(o);
          if (isOver()) return finish();
          await sleep(900); if (g.over) return; render(p); busy = false; return;
        }
        g.sfx('bad'); render(p, `Go fish!`); await sleep(600); if (g.over) return;
        let again = false;
        if (pond.length) { const c = pond.pop(); hands[p].push(c); again = c.r === r; render(p, again ? `You fished the ${c.r}${c.s} you asked for — go again!` : `You fished ${c.r}${c.s}.`); checkBooks(p); }
        refill(p); refill(o);
        if (isOver()) return finish();
        await sleep(1100); if (g.over) return;
        if (again) { render(p); busy = false; return; }
        turn = o; await g.pass(o); if (g.over) return; render(o); busy = false;
      }
      await g.pass(1); if (g.over) return; render(1);
    },
  });
})();
