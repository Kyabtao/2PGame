/* Charades — act it out across the table; the guess is four cards deep. */
(function () {
  const CARDS = [
    { w: 'SWIMMING', c: 'sport' }, { w: 'BOXING', c: 'sport' }, { w: 'SKIING', c: 'sport' }, { w: 'SURFING', c: 'sport' },
    { w: 'LION', c: 'animal' }, { w: 'PENGUIN', c: 'animal' }, { w: 'KANGAROO', c: 'animal' }, { w: 'OCTOPUS', c: 'animal' },
    { w: 'TOOTHBRUSH', c: 'object' }, { w: 'UMBRELLA', c: 'object' }, { w: 'SCISSORS', c: 'object' }, { w: 'TEAPOT', c: 'object' },
    { w: 'COOKING', c: 'job' }, { w: 'FIREWORKS', c: 'show' }, { w: 'CONCERT', c: 'show' }, { w: 'CHESS', c: 'game' },
  ];
  const ROUNDS = 8;
  let starter = 1;
  Game.init({
    id: 'charades',
    rules: [
      'The actor taps the card, reads the word over your shoulder, and acts it out — no sounds, no words, no pointing at objects in the room.',
      'The guesser then chooses between four cards: the right one pays the guesser +2 and the actor +1 for a legible performance.',
      'Missed? The actor banks +2 for the cruel mystery. Guesser role swaps every round; eight rounds decide the theatre.',
    ],
    controls: { all: 'Actor: tap card to peek · Guesser: tap a candidate' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const bag = shuffle(CARDS.slice());
      let r = 0, phase = 'peek', opts = [], over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const card = h('div', { class: 'bigmsg', style: { fontSize: '2rem', minHeight: '3rem' } });
      const optRow = h('div', { class: 'row wrap', style: { justifyContent: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, card, optRow, stat.el);
      const actor = () => (r % 2 ? g.other(starter) : starter);
      const guesser = () => g.other(actor());
      function round() {
        if (r >= ROUNDS || over) return end();
        phase = 'peek';
        const c = bag[r];
        card.innerHTML = '';
        optRow.innerHTML = '';
        const peek = h('button', { class: 'btn primary', text: `👁 ${esc(g.name(actor()))} — peek at the ${c.c} card` });
        peek.addEventListener('click', () => {
          card.textContent = `${c.w} (${c.c})`;
          g.sfx('coin');
          phase = 'guess';
          opts = shuffle([c.w, ...shuffle(CARDS.filter((x) => x.w !== c.w)).slice(0, 3).map((x) => x.w)]);
          optRow.innerHTML = '';
          opts.forEach((w) => {
            const b = h('button', { class: 'btn', text: w });
            b.addEventListener('click', () => judge(w === c.w));
            optRow.appendChild(b);
          });
          info.innerHTML = `<b class="pc${guesser()}">${esc(g.name(guesser()))}</b> — what on earth was that?`;
          g.turn(guesser(), `<span class="pc${guesser()}">${esc(g.name(guesser()))}</span> — name the act`);
        });
        optRow.appendChild(peek);
        info.innerHTML = `act ${r + 1}/${ROUNDS} · <b class="pc${actor()}">${esc(g.name(actor()))}</b> performs to <b class="pc${guesser()}">${esc(g.name(guesser()))}</b>`;
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
        g.turn(actor(), `<span class="pc${actor()}">${esc(g.name(actor()))}</span> — peek & perform`);
      }
      function judge(ok) {
        r++;
        if (ok) { pts[guesser()] += 2; pts[actor()] += 1; g.sfx('win'); g.toast('nailed it — 2 + 1', 1300); }
        else { pts[actor()] += 2; g.sfx('bad'); g.toast('the audience was lost — actor +2', 1500); }
        draw0();
        setTimeout(round, 1400);
      }
      function draw0() { stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]); }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Standing ovation for everyone: ${pts[1]}–${pts[2]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Charades curtain call: ${pts[1]}–${pts[2]}.`);
      }
      round();
    },
    onStop() { starter = 3 - starter; },
  });
})();
