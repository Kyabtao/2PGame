/* Password — one clue, four suspects. Answer it or let your rival steal. */
(function () {
  const WORDS = [
    { w: 'VOLCANO', c: 'angry mountain' }, { w: 'GUITAR', c: 'six-string serenade' }, { w: 'PIRATE', c: 'salty plunderer' },
    { w: 'TORNADO', c: 'spinning sky-finger' }, { w: 'BALLOON', c: 'birthday float' }, { w: 'WIZARD', c: 'pointy-hat spellcaster' },
    { w: 'MARKET', c: 'stalls and shouting' }, { w: 'ROBOT', c: 'beeping servant' }, { w: 'ISLAND', c: 'lonely sand ring' },
    { w: 'CAMERA', c: 'memory box' }, { w: 'MARATHON', c: '42 kilometres of legs' }, { w: 'KITCHEN', c: 'where dinner is born' },
    { w: 'LIBRARY', c: 'shush palace' }, { w: 'AURORA', c: 'northern night-light' }, { w: 'PUZZLE', c: 'pieces or problems' },
    { w: 'HURRICANE', c: 'named wind' }, { w: 'TREASURE', c: 'buried sparkle' }, { w: 'MONSOON', c: 'season of rain' },
  ];
  const ROUNDS = 8;
  let starter = 1;
  Game.init({
    id: 'password',
    rules: [
      'A clue appears; the active player picks the matching word from four. Right answer: +2 and the word retires.',
      'Wrong answer? The clue stays live and passes to the rival for the steal (+2). Missed steals kill the round.',
      'Every clue gets at most two shots, then next word — eight words per match, alternating first shooter.',
    ],
    controls: { all: 'Tap the word your clue points at' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const bag = shuffle(WORDS.slice());
      let i = 0, shots = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const clue = h('div', { class: 'bigmsg', style: { fontSize: '1.5rem' } });
      const info = h('div', { class: 'hint' });
      const optRow = h('div', { class: 'row wrap', style: { justifyContent: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, clue, optRow, stat.el);
      const shooter = () => (shots ? g.other(shooter0()) : shooter0());
      const shooter0 = () => (i % 2 ? g.other(starter) : starter);
      function round() {
        if (i >= ROUNDS || over) return end();
        shots = 0;
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        const W = bag[i];
        const decoys = shuffle(WORDS.filter((x) => x !== W)).slice(0, 3).map((x) => x.w);
        info.innerHTML = `word ${i + 1}/${ROUNDS} · shot ${shots + 1}/2 · <b class="pc${shooter()}">${esc(g.name(shooter()))}</b>${shots ? ' — STEAL WINDOW' : ''}`;
        clue.innerHTML = `clue: “${esc(W.c)}”`;
        optRow.innerHTML = '';
        shuffle([W.w, ...decoys]).forEach((w) => {
          const b = h('button', { class: 'btn primary', text: w, style: { minWidth: '130px' } });
          b.addEventListener('click', () => {
            if (w === W.w) {
              pts[shooter()] += 2;
              g.sfx('win'); g.toast(`${W.w}! ${shots ? 'steal snatched' : 'first-shot pay'} — +2`, 1400);
              i++;
            } else {
              shots++;
              g.sfx('bad');
              if (shots >= 2) { g.toast('both missed — the word walks away', 1300); i++; }
            }
            stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
            setTimeout(round, 1250);
          });
          optRow.appendChild(b);
        });
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
        g.turn(shooter(), `<span class="pc${shooter()}">${esc(g.name(shooter()))}</span> — what’s the password?`);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Every word and none of them: ${pts[1]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Password round tally ${pts[1]}–${pts[2]}.`);
      }
      round();
    },
    onStop() { starter = 3 - starter; },
  });
})();
