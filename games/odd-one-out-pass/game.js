/* Odd One Out — four cards, one traitor. Sixty seconds of sharp eyes per round, no timers, just nerve. */
(function () {
  const SETS = [
    { c: ['🐊', '🦎', '🐢', '🐘'], o: 3, w: 'elephant — the others are reptiles' },
    { c: ['🍓', '🍒', '🍉', '🥕'], o: 3, w: 'carrot — the others are fruits' },
    { c: ['⚽', '🏀', '🎳', '♟️'], o: 3, w: 'chess — no athletics' },
    { c: ['🚗', '🚌', '🚲', '🛸'], o: 3, w: 'ufo — not road traffic' },
    { c: ['🎸', '🎺', '🪕', '🔨'], o: 3, w: 'hammer — the rest are instruments' },
    { c: ['☀️', '🌙', '⭐', '🔥'], o: 3, w: 'fire — the others are in the sky' },
    { c: ['🍞', '🥐', '🥨', '🧀'], o: 3, w: 'cheese — the others are baked dough' },
    { c: ['👟', '🥾', '🩴', '🎩'], o: 3, w: 'hat — the others are footwear' },
    { c: ['🦈', '🐋', '🐬', '🦅'], o: 3, w: 'eagle — the others are sea life' },
    { c: ['🍦', '🍨', '🍰', '🥗'], o: 3, w: 'salad — the rest are sweets' },
    { c: ['🚀', '🛩️', '🎈', '⛵'], o: 3, w: 'boat — the others fly' },
    { c: ['🖊️', '✏️', '🖍️', '📏'], o: 3, w: 'ruler — the others write' },
    { c: ['🐝', '🦋', '🐞', '🕷️'], o: 3, w: 'spider — eight legs, zero wings' },
    { c: ['🏁', '🚦', '🎪', '🚧'], o: 2, w: 'circus tent — not a road sign' },
    { c: ['⛄', '🧊', '🍦', '🏀'], o: 3, w: 'basketball — nothing cold about it' },
    { c: ['🦇', '🦉', '🐱', '☀️'], o: 3, w: 'sun — the others own the night' },
  ];
  const ROUNDS = 10;
  let starter = 1;
  Game.init({
    id: 'odd-one-out-pass',
    rules: [
      'One row, four cards, three share a secret club. The round player studies the set, then locks the odd card out.',
      'Correct call: +2. Wrong card: +1 for the rival who points out your blunder.',
      'Both players answer the same card set in turn — if you both see it right the round is split; the rival gets their shot at the very same row you just judged.',
      'Ten sets; the sharpest eye wins.',
    ],
    controls: { all: 'Tap the odd card out' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const bag = shuffle(SETS.slice()).slice(0, ROUNDS);
      let i = 0, seat = 1, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const row = h('div', { class: 'row', style: { justifyContent: 'center', gap: '1rem' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, row, stat.el);
      function round() {
        if (i >= bag.length || over) return end();
        const S = bag[i];
        info.innerHTML = `set ${i + 1}/${ROUNDS} · <b class="pc${seat}">${esc(g.name(seat))}</b> hunts the odd card`;
        row.innerHTML = '';
        S.c.forEach((e, k) => {
          const b = h('button', { class: 'cardish', style: { fontSize: '2.6rem', padding: '.6rem .9rem', background: 'var(--panel, #fff)', border: '2px solid #999', borderRadius: 12, cursor: 'pointer' }, text: e });
          b.addEventListener('click', () => {
            if (k === S.o) { pts[seat] += 2; g.sfx('win'); g.toast(`right — ${S.w}`, 1300); }
            else { pts[g.other(seat)] += 1; g.sfx('bad'); g.toast(`not it — ${S.w}`, 1500); }
            stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
            seat = g.other(seat);
            if (seat === starter) i++;
            setTimeout(round, 1250);
          });
          row.appendChild(b);
        });
        g.turn(seat, `<span class="pc${seat}">${esc(g.name(seat))}</span> — find the intruder`);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Ten sets, perfectly matched at ${pts[1]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Odd-one-out final ${pts[1]}–${pts[2]}.`);
      }
      round();
    },
    onStop() { starter = 3 - starter; },
  });
})();
