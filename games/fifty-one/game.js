/* 51st State — build to exactly 51 from the market row. Bust and you are out. */
(function () {
  const DISPLAY = 4;
  let starter = 1;
  Game.init({
    id: 'fifty-one',
    rules: [
      'A row of four market cards, and a deck of aces (11) and the numbers 2–10 in four suits.',
      'On your turn take ONE card from the row — it is added to your total and the row refills from the deck.',
      'Press HOLD whenever you like to stop on your number. Exactly 51 wins the state on the spot.',
      'Bust past 51 and your total is wiped to zero for the round, so the last card you take matters most.',
      'When both players have stopped, or the deck is dry, the closer total to 51 wins.',
    ],
    controls: { all: 'Tap a market card to take it · ✋ HOLD to stop' },
    points: true,
    onStart(g) {
      const deck = [];
      for (let s = 0; s < 4; s++) { deck.push({ r: 'A', v: 11, s: '♠', red: false }); for (let v = 2; v <= 10; v++) deck.push({ r: String(v), v, s: ['♠', '♥', '♦', '♣'][s], red: s >= 2 }); }
      shuffle(deck);
      const row = deck.splice(0, DISPLAY);
      const tot = { 1: 0, 2: 0 }, done = { 1: false, 2: false };
      let turn = starter, picks = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const market = h('div', { class: 'row' });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'd', label: 'deck', val: deck.length }]);
      wrap.append(info, market, btnRow, stat.el);
      const holdBtn = h('button', { class: 'btn', text: '✋ Hold' });
      btnRow.appendChild(holdBtn);
      function draw() {
        info.innerHTML = `market · <b class="pc${turn}">${esc(g.name(turn))}</b> to take a card (total ${tot[turn]})`;
        market.innerHTML = '';
        row.forEach((c, i) => {
          const el = UI.card(c, { large: true, onClick: () => take(i) });
          el.appendChild(h('div', { text: c.v, style: { position: 'absolute', bottom: 2, right: 4, fontSize: '.7rem', color: '#666', fontWeight: 800 } }));
          market.appendChild(el);
        });
        stat.set('a', tot[1] + (done[1] ? ' ✓' : ''));
        stat.set('b', tot[2] + (done[2] ? ' ✓' : ''));
        stat.set('d', deck.length + row.length);
        g.points(tot[1], tot[2]);
        holdBtn.disabled = done[turn] || picks === 0;
      }
      function take(i) {
        if (g.over || done[turn]) return g.sfx('bad');
        const c = row.splice(i, 1)[0];
        row.push(deck.pop() || { r: '·', v: 0, s: '', red: false, blank: true });
        tot[turn] += c.v; picks++;
        g.sfx(c.v >= 10 ? 'coin' : 'move');
        if (tot[turn] > 51) { g.toast(`${tot[turn]} — bust! Total wiped`, 1100); tot[turn] = 0; done[turn] = true; g.sfx('explode'); }
        else if (tot[turn] === 51) { starter = 3 - starter; draw(); return g.win(turn, `Exactly 51 — the 51st state is claimed in ${picks} picks.`); }
        draw();
        if (done[1] && done[2]) return end();
        if (!deck.length && !row.some((c) => !c.blank)) return end();
        if (!done[3 - turn]) turn = 3 - turn;
        g.turn(turn); draw();
      }
      function hold() {
        if (done[turn] || !picks) return g.sfx('bad');
        done[turn] = true; g.sfx('click'); g.toast(`${esc(g.name(turn))} holds at ${tot[turn]}`, 900);
        if (done[1] && done[2]) return end();
        turn = 3 - turn; g.turn(turn); draw();
      }
      function end() {
        starter = 3 - starter;
        draw();
        if (tot[1] === tot[2]) return g.draw(`Both stopped on ${tot[1]} — nobody took the state.`);
        const w = tot[1] > tot[2] ? 1 : 2;
        g.win(w, `${tot[w]} towards 51 beats ${tot[3 - w]}.`);
      }
      holdBtn.addEventListener('click', hold);
      g.key(['KeyH'], hold);
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
