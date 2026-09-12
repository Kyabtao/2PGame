/* High-Low — guess whether the next card is higher or lower; streaks bank points; steal on a miss. */
(function () {
  let starter = 1;
  const TARGET = 15;
  Game.init({
    id: 'high-low',
    rules: ['A card is shown. Guess whether the next card is higher or lower (Ace is high, equal cards count as a miss).', 'Each correct guess adds 1 to your streak. Bank your streak any time to add it to your score; a miss loses the streak and passes the turn.', `First to ${TARGET} points wins.`],
    controls: { all: '<kbd>↑</kbd> higher · <kbd>↓</kbd> lower · <kbd>B</kbd> bank' },
    points: true,
    onStart(g) {
      let deck = UI.deck(); let cur = deck.pop(); const score = { 1: 0, 2: 0 }; let turn = starter, streak = 0, busy = false;
      const cardBox = h('div', { class: 'row', style: { gap: '1.5rem', alignItems: 'center' } }); const msg = h('div', { class: 'bigmsg', style: { fontSize: '1.2rem' } });
      const hi = h('button', { class: 'btn big primary', text: '⬆ Higher', onclick: () => guess(1) }), lo = h('button', { class: 'btn big primary', text: '⬇ Lower', onclick: () => guess(-1) }), bank = h('button', { class: 'btn big', text: '🏦 Bank', onclick: doBank });
      g.stage.append(cardBox, msg, h('div', { class: 'row' }, hi, lo, bank));
      g.key('ArrowUp', () => guess(1)); g.key('ArrowDown', () => guess(-1)); g.key('KeyB', doBank);
      const render = (next) => { cardBox.innerHTML = ''; cardBox.append(UI.card(cur, { large: true }), h('span', { class: 'muted' }, '→'), next ? UI.card(next, { large: true }) : UI.card(null, { back: true, large: true })); msg.textContent = `${g.name(turn)} · streak ${streak}`; bank.disabled = !streak; hi.className = lo.className = 'btn big primary p' + turn; g.points(score[1], score[2]); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · streak ${streak} · ${deck.length} cards left`); };
      async function guess(d) {
        if (busy || g.over) return; busy = true;
        if (deck.length < 2) deck = UI.deck();
        const next = deck.pop(); render(next);
        const ok = d > 0 ? next.v > cur.v : next.v < cur.v;
        if (ok) { streak++; g.sfx('score'); msg.textContent = `Correct! Streak ${streak}`; } else { g.sfx('bad'); msg.textContent = next.v === cur.v ? `Equal — that's a miss. Streak lost.` : `Wrong! Streak of ${streak} lost.`; }
        await sleep(900); if (g.over) return;
        cur = next;
        if (!ok) { streak = 0; turn = 3 - turn; }
        busy = false; render();
      }
      function doBank() {
        if (busy || g.over || !streak) return; score[turn] += streak; g.sfx('coin');
        if (score[turn] >= TARGET) { render(); starter = 3 - starter; return g.win(turn, `${score[turn]} to ${score[3 - turn]}.`); }
        streak = 0; turn = 3 - turn; render();
      }
      render();
    },
  });
})();
