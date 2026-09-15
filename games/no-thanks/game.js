/* No Thanks! — take the card or pay a chip. Lowest total minus unspent chips wins. */
(function () {
  const LOW = 3, HIGH = 21, CHIPS = 11;
  let starter = 1;
  Game.init({
    id: 'no-thanks',
    rules: [
      'The cards run from 3 to 21 and are offered one at a time. On your turn you either take the card being offered (and keep any chips already on it) or drop one of your own chips on it and pass it along.',
      'Chips are precious: at the end every chip you did not spend cancels one point of card value.',
      'Consecutive numbers are free to collect — a run of 10, 11, 12 counts as just 12.',
      'Lowest score when the deck is gone wins. Pass with no chips left and you must take the card.',
    ],
    controls: { all: 'TAP TAKE grabs the card · NO THANKS puts a chip on it' },
    points: true,
    onStart(g) {
      const deck = range(HIGH - LOW + 1).map((i) => LOW + i);
      let idx = 0, onCard = 0;
      const chips = { 1: CHIPS, 2: CHIPS };
      const cards = { 1: [], 2: [] };
      let turn = starter;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const stage = h('div', { class: 'row', style: { minHeight: '130px' } });
      const btnRow = h('div', { class: 'row' });
      const hands = h('div', { class: 'split' });
      const handEl = {};
      [1, 2].forEach((p) => {
        const body = h('div', { class: 'row wrap', style: { minHeight: '46px' } });
        handEl[p] = body;
        hands.appendChild(h('div', { class: 'side p' + p }, h('h3', { text: g.name(p) }), body));
      });
      wrap.append(info, stage, btnRow, hands);
      const takeBtn = h('button', { class: 'btn primary', text: '🫳 Take it' });
      const passBtn = h('button', { class: 'btn', text: '🚫 No thanks' });
      btnRow.append(takeBtn, passBtn);
      function score(p) {
        const sorted = cards[p].slice().sort((a, b) => a - b);
        let s = 0;
        for (let i = 0; i < sorted.length; i++) {
          if (i > 0 && sorted[i] === sorted[i - 1] + 1) continue;      // part of a run
          s += sorted[i];
        }
        return s - chips[p];
      }
      function draw() {
        const over = idx >= deck.length;
        info.innerHTML = over ? 'deck finished — counting' : `card on the table: <b>${deck[idx]}</b> with <b>${onCard}</b> chip${onCard === 1 ? '' : 's'} on it`;
        stage.innerHTML = '';
        if (!over) {
          const c = { r: String(deck[idx]), s: '', red: false };
          const box = h('div', { class: 'col', style: { gap: '.3rem' } }, UI.card(c, { large: true }), h('div', { class: 'row', text: '🔴'.repeat(onCard) || '' }));
          stage.appendChild(box);
        }
        takeBtn.disabled = over;
        passBtn.disabled = over || chips[turn] <= 0;
        passBtn.textContent = over ? '—' : `🚫 No thanks (${chips[turn]})`;
        [1, 2].forEach((p) => {
          handEl[p].innerHTML = '';
          handEl[p].appendChild(h('span', { class: 'muted', text: `${cards[p].length} cards · ${chips[p]} chips · ${score(p)}` }));
          cards[p].slice().sort((a, b) => a - b).forEach((v) => handEl[p].appendChild(h('span', { class: 'tag', text: String(v) })));
        });
        g.points(score(1), score(2));
        g.turn(turn, over ? undefined : `<span class="pc${turn}">${esc(g.name(turn))}</span> — take ${deck[idx]} or say no thanks`);
      }
      function take() {
        if (idx >= deck.length) return;
        cards[turn].push(deck[idx]); chips[turn] += onCard; onCard = 0; idx++;
        g.sfx('coin'); g.toast(`took ${deck[idx - 1]}`, 700);
        after();
      }
      function pass() {
        if (idx >= deck.length) return;
        if (chips[turn] <= 0) { g.sfx('bad'); g.toast('no chips left — you must take it', 1000); return; }
        chips[turn]--; onCard++;
        g.sfx('click');
        turn = 3 - turn; after(true);
      }
      function after(kept) {
        if (idx >= deck.length) return end();
        if (!kept) turn = 3 - turn;
        if (chips[1] === 0 && chips[2] === 0) { /* forced taking handles itself */ }
        draw();
      }
      function end() {
        starter = 3 - starter;
        const a = score(1), b = score(2);
        draw();
        g.status('');
        if (a === b) return g.draw(`Both on ${a} after counting chips — no winner.`);
        const w = a < b ? 1 : 2;
        g.win(w, `${a} vs ${b}: fewer points takes it (${cards[w].length} cards, ${chips[w]} chips unspent).`);
      }
      takeBtn.addEventListener('click', take);
      passBtn.addEventListener('click', pass);
      g.key(['KeyT'], take);
      g.key(['KeyN', 'Space'], pass);
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
