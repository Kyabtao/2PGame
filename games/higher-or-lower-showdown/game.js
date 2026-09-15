/* Higher or Lower Showdown — call the next card, ride the streak, fold the losses. */
(function () {
  const TURNS = 14;
  let starter = 1;
  Game.init({
    id: 'higher-or-lower-showdown',
    rules: [
      'A 52-card deck, values ace-low to king-high. One card sits on the stage; on your turn call whether the next card is HIGHER or LOWER and turn it over.',
      'Right call banks your streak length (1, then 2, then 3… points) and you keep the same stage card, pushing deeper. A wrong call — or an equal value — busts the streak and flips a fresh card for the rival.',
      'Seven turns each. The bigger bank takes the showdown; ties go to the longest single streak.',
      'Same value counts against you — the house edge lives in that rule.',
    ],
    controls: { all: '⬆ higher · ⬇ lower' },
    points: true,
    onStart(g) {
      let deck = [];
      for (const s of ['♠', '♥', '♦', '♣']) for (let v = 1; v <= 13; v++) deck.push({ v, s, red: s === '♥' || s === '♦' });
      shuffle(deck);
      const bank = { 1: 0, 2: 0 }, streak = { 1: 0, 2: 0 }, best = { 1: 0, 2: 0 };
      let turn = starter, t = 0, stage = deck.pop(), lock = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const cardBox = h('div', { style: { display: 'grid', placeItems: 'center', padding: '.4rem 0' } });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'n', label: 'deck', val: deck.length }]);
      wrap.append(info, cardBox, btnRow, stat.el);
      const NAME = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
      function show() {
        info.innerHTML = `turn ${t + 1}/${TURNS} · <b class="pc${turn}">${esc(g.name(turn))}</b> · streak ${streak[turn]} (bank ${bank[turn]})`;
        cardBox.innerHTML = '';
        cardBox.appendChild(UI.card({ r: NAME[stage.v] || stage.v, s: stage.s, red: stage.red }, { large: true }));
        btnRow.innerHTML = '';
        if (!lock) {
          btnRow.appendChild(h('button', { class: 'btn primary', text: '⬆ HIGHER', style: { minWidth: 130 }, onclick: () => call(1) }));
          btnRow.appendChild(h('button', { class: 'btn primary', text: '⬇ LOWER', style: { minWidth: 130 }, onclick: () => call(-1) }));
        }
        stat.set('a', bank[1]); stat.set('b', bank[2]); stat.set('n', deck.length);
        g.points(bank[1], bank[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — higher or lower than the ${NAME[stage.v] || stage.v}?`);
      }
      function call(dir) {
        if (lock || !deck.length) return g.sfx('bad');
        lock = true;
        const next = deck.pop();
        g.sfx('move');
        cardBox.innerHTML = '';
        cardBox.appendChild(UI.card({ r: NAME[next.v] || next.v, s: next.s, red: next.red }, { large: true }));
        const ok = dir === 1 ? next.v > stage.v : next.v < stage.v;
        setTimeout(() => {
          if (ok) {
            streak[turn]++;
            best[turn] = Math.max(best[turn], streak[turn]);
            bank[turn] += streak[turn];
            stage = next;
            g.sfx('coin');
            g.toast(`right! +${streak[turn]}`, 900);
            lock = false;
            t++;
            if (t >= TURNS || !deck.length) return end();
            turn = 3 - turn;               // the hot seat passes after each right call, too
            show();
          } else {
            streak[turn] = 0;
            stage = deck.length ? deck.pop() : next;
            g.sfx('explode');
            g.toast('busted — equal or wrong, the deck takes it', 1200);
            lock = false;
            t++;
            if (t >= TURNS || !deck.length) return end();
            turn = 3 - turn;
            show();
          }
        }, 420);
      }
      function end() {
        starter = 3 - starter;
        g.turn();
        if (bank[1] === bank[2]) {
          if (best[1] === best[2]) return g.draw(`Both banks at ${bank[1]} and neither out-streaked the other.`);
          return g.win(best[1] > best[2] ? 1 : 2, `Tied banks at ${bank[1]} — tie-break: longest streak ${Math.max(best[1], best[2])}.`);
        }
        g.win(bank[1] > bank[2] ? 1 : 2, `Showdown tally ${bank[1]}–${bank[2]}.`);
      }
      g.key(['ArrowUp'], () => call(1));
      g.key(['ArrowDown'], () => call(-1));
      show();
    },
    onStop() { starter = 3 - starter; },
  });
})();
