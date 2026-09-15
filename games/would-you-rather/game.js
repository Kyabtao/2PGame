/* Would You Rather — a duel of mind-reading: lock your taste, predict theirs. */
(function () {
  const DILEMMAS = [
    ['🌋 watch volcanoes up close', '🌊 dive with sharks'],
    ['never use the internet again', 'never watch a film again'],
    ['have wings', 'have gills'],
    ['live on a mountain', 'live on a boat'],
    ['always be 10 minutes late', 'always be 20 minutes early'],
    ['speak every language', 'play every instrument'],
    ['fight one horse-sized duck', 'fight a hundred duck-sized horses'],
    ['only eat pizza', 'only eat tacos'],
    ['time travel to the past', 'time travel to the future'],
    ['be famous', 'be rich'],
    ['no sugar ever', 'no salt ever'],
    ['swap hands for feet', 'swap ears for antennae'],
  ];
  const ROUNDS = 6;
  let starter = 1;
  Game.init({
    id: 'would-you-rather',
    rules: [
      'A dilemma shows two doors. The chooser locks one away in secret, then the screen flips to the rival.',
      'The guesser picks the door they think their rival chose: a mind-meld pays the guesser +2 and the chooser +1. A miss pays the chooser +2 — reading you like an open book.',
      'Roles swap every round; six rounds, three turns in each chair. Highest sync wins; mirrored scores stay a draw.',
    ],
    controls: { all: 'Tap a door · 🔒 to lock & flip screens' },
    points: true,
    onStart(g) {
      const sync = { 1: 0, 2: 0 };
      const bag = shuffle(DILEMMAS.slice());
      let d = 0, phase = 'choose', locked = null, chooser = starter, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const doorRow = h('div', { class: 'split' });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, doorRow, btnRow, stat.el);
      const who = () => (phase === 'choose' ? chooser : g.other(chooser));
      function round() {
        if (d >= ROUNDS || over) return end();
        phase = 'choose'; locked = null;
        chooser = d % 2 ? g.other(starter) : starter;
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        const Q = bag[d];
        info.innerHTML = `dilemma ${d + 1}/${ROUNDS} · <b class="pc${who()}">${esc(g.name(who()))}</b> ${phase === 'choose' ? (locked === null ? 'picks a door in secret' : 'about to lock the screen') : 'guesses — which door did ' + esc(g.name(chooser)) + ' choose?'}`;
        doorRow.innerHTML = '';
        Q.forEach((t, k) => {
          const side = h('div', { class: 'side p' + who(), style: { textAlign: 'center', padding: '1.2rem' } });
          const b = h('button', { class: 'btn' + (locked === k ? ' primary' : ''), text: (phase === 'choose' && locked === k ? '🔒 ' : '') + t, style: { maxWidth: '100%' } });
          b.addEventListener('click', () => {
            if (phase === 'choose') { locked = locked === k ? null : k; g.sfx('click'); draw(); } else judge(k);
          });
          side.appendChild(h('h3', { text: phase === 'choose' ? 'chooser decides' : 'guesser picks' }));
          side.appendChild(b);
          doorRow.appendChild(side);
        });
        btnRow.innerHTML = '';
        if (phase === 'choose' && locked !== null) {
          btnRow.appendChild(h('button', { class: 'btn primary', text: '🔒 lock & flip screens', onclick: () => { phase = 'guess'; g.pass(g.other(chooser)).then(draw); } }));
        }
        stat.set('a', sync[1]); stat.set('b', sync[2]);
        g.points(sync[1], sync[2]);
        g.turn(who(), `<span class="pc${who()}">${esc(g.name(who()))}</span> — ${phase === 'choose' ? 'choose, don’t announce' : 'read the mind'}`);
      }
      function judge(k) {
        if (k === locked) {
          sync[g.other(chooser)] += 2; sync[chooser] += 1;
          g.sfx('win'); g.toast(`MIND-MELD — ${esc(g.name(g.other(chooser)))} +2, chooser +1`, 1500);
        } else {
          sync[chooser] += 2;
          g.sfx('bad'); g.toast(`no read — the chooser banks +2 for opacity`, 1600);
        }
        d++;
        setTimeout(round, 1600);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (sync[1] === sync[2]) return g.draw(`Symmetric souls: ${sync[1]} sync all round.`);
        g.win(sync[1] > sync[2] ? 1 : 2, `Sync final ${sync[1]}–${sync[2]}.`);
      }
      round();
    },
    onStop() { starter = 3 - starter; },
  });
})();
