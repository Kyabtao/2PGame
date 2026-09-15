/* Twenty Questions — a creature in the mind, ten honest yes/no doors, then a guess. */
(function () {
  const Q = [
    ['flies?', (a) => a.fly], ['swims?', (a) => a.swim], ['kept as a pet?', (a) => a.pet],
    ['bigger than a human?', (a) => a.big], ['eats meat?', (a) => a.meat], ['lays eggs?', (a) => a.egg],
    ['has stripes?', (a) => a.stripe], ['lives in the jungle?', (a) => a.jungle], ['gives milk?', (a) => a.milk],
    ['covered in fur?', (a) => a.fur],
  ];
  const A = [
    { n: 'ANT', fly: 0, swim: 0, pet: 0, big: 0, meat: 0, egg: 1, stripe: 0, jungle: 1, milk: 0, fur: 0 },
    { n: 'BAT', fly: 1, swim: 0, pet: 0, big: 0, meat: 1, egg: 0, stripe: 0, jungle: 0, milk: 0, fur: 1 },
    { n: 'CAT', fly: 0, swim: 0, pet: 1, big: 0, meat: 1, egg: 0, stripe: 0, jungle: 0, milk: 0, fur: 1 },
    { n: 'COW', fly: 0, swim: 0, pet: 0, big: 1, meat: 0, egg: 0, stripe: 0, jungle: 0, milk: 1, fur: 1 },
    { n: 'DOG', fly: 0, swim: 1, pet: 1, big: 0, meat: 1, egg: 0, stripe: 0, jungle: 0, milk: 0, fur: 1 },
    { n: 'DUCK', fly: 1, swim: 1, pet: 1, big: 0, meat: 0, egg: 1, stripe: 0, jungle: 0, milk: 0, fur: 0 },
    { n: 'ELEPHANT', fly: 0, swim: 1, pet: 0, big: 1, meat: 0, egg: 0, stripe: 0, jungle: 1, milk: 0, fur: 0 },
    { n: 'FROG', fly: 0, swim: 1, pet: 1, big: 0, meat: 1, egg: 1, stripe: 0, jungle: 1, milk: 0, fur: 0 },
    { n: 'KANGAROO', fly: 0, swim: 1, pet: 0, big: 1, meat: 0, egg: 0, stripe: 0, jungle: 0, milk: 0, fur: 1 },
    { n: 'LION', fly: 0, swim: 1, pet: 0, big: 1, meat: 1, egg: 0, stripe: 0, jungle: 1, milk: 0, fur: 1 },
    { n: 'MONKEY', fly: 0, swim: 1, pet: 0, big: 0, meat: 1, egg: 0, stripe: 0, jungle: 1, milk: 0, fur: 1 },
    { n: 'OWL', fly: 1, swim: 0, pet: 0, big: 0, meat: 1, egg: 1, stripe: 0, jungle: 0, milk: 0, fur: 0 },
    { n: 'PENGUIN', fly: 0, swim: 1, pet: 0, big: 0, meat: 1, egg: 1, stripe: 0, jungle: 0, milk: 0, fur: 0 },
    { n: 'SHARK', fly: 0, swim: 1, pet: 0, big: 1, meat: 1, egg: 0, stripe: 0, jungle: 0, milk: 0, fur: 0 },
    { n: 'SNAKE', fly: 0, swim: 1, pet: 1, big: 0, meat: 1, egg: 1, stripe: 1, jungle: 1, milk: 0, fur: 0 },
    { n: 'TIGER', fly: 0, swim: 1, pet: 0, big: 1, meat: 1, egg: 0, stripe: 1, jungle: 1, milk: 0, fur: 1 },
  ];
  const MAXQ = 10;
  let starter = 1;
  Game.init({
    id: 'twenty-questions',
    rules: [
      'The answerer secretly picks one creature from sixteen. No lying allowed — the engine answers for them, from a hidden feature table.',
      'The questioner spends up to ten yes/no questions, then guesses from the pool of creatures still consistent with every answer.',
      'Correct guess: +3. Wrong guess (or ten questions exhausted): +2 to the answerer. Two matches, roles swapped — the better interrogator wins.',
    ],
    controls: { all: 'Secret pick → tap questions → 🎯 guess' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let match = 0, phase = 'pick', secret = null, asked = [], guessing = false, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const qRow = h('div', { class: 'row wrap', style: { justifyContent: 'center', maxWidth: '520px' } });
      const ansBox = h('div', { class: 'hint' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, qRow, ansBox, stat.el);
      const ans = () => (match % 2 ? g.other(starter) : starter);
      const askr = () => g.other(ans());
      const consistent = () => A.filter((a) => asked.every(([qi, yes]) => (Q[qi][1](a) ? 1 : 0) === yes));
      function matchStart() {
        match++;
        if (match > 2 || over) return end();
        phase = 'pick'; secret = null; asked = []; guessing = false;
        ansBox.innerHTML = '';
        draw();
        g.sfx('tick');
        g.toast(`${esc(g.name(ans()))} — hide a creature`, 1200);
      }
      function draw() {
        if (over) return;
        info.innerHTML = phase === 'pick'
          ? `match ${match}/2 · <b class="pc${ans()}">${esc(g.name(ans()))}</b> pick in secret`
          : `match ${match}/2 · ${asked.length}/${MAXQ} questions · <b class="pc${askr()}">${esc(g.name(askr()))}</b> interrogates`;
        qRow.innerHTML = '';
        if (phase === 'pick') {
          A.forEach((a) => {
            const b = h('button', { class: 'chip' + (secret === a.n ? ' on' : ''), text: a.n });
            b.addEventListener('click', () => { secret = a.n; g.sfx('click'); draw(); armGo(); });
            qRow.appendChild(b);
          });
          g.turn(ans(), `<span class="pc${ans()}">${esc(g.name(ans()))}</span> — choose your creature`);
        } else {
          Q.forEach(([t], qi) => {
            const used = asked.some(([q2]) => q2 === qi);
            const b = h('button', { class: 'chip', text: (used ? '✓ ' : '') + t, disabled: used });
            b.addEventListener('click', () => {
              const yesno = Q[qi][1](A.find((a) => a.n === secret)) ? 1 : 0;
              asked.push([qi, yesno]);
              g.sfx(yesno ? 'win' : 'move');
              if (asked.length >= MAXQ) return giveUp();
              draw();
              ansBox.innerHTML = `<b>${t.replace('?', '')} → ${yesno ? 'YES' : 'NO'}</b>`;
            });
            qRow.appendChild(b);
          });
          const gb = h('button', { class: 'btn primary', text: '🎯 guess the creature' });
          gb.addEventListener('click', () => { guessing = !guessing; draw(); });
          qRow.appendChild(gb);
          if (guessing) {
            const pool = shuffle(consistent().map((a) => a.n));
            (pool.length ? pool : shuffle(A.map((a) => a.n))).slice(0, 6).forEach((n) => {
              const b = h('button', { class: 'btn', text: n });
              b.addEventListener('click', () => settle(n));
              qRow.appendChild(b);
            });
            qRow.appendChild(h('span', { class: 'muted', text: `${consistent().length} still possible` }));
          }
          g.turn(askr(), `<span class="pc${askr()}">${esc(g.name(askr()))}</span> — narrow the field`);
        }
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
      }
      function armGo() {
        const b = h('button', { class: 'btn primary', text: '🔒 hide it & pass', onclick: () => { phase = 'ask'; g.pass(askr()).then(draw); } });
        qRow.appendChild(b);
      }
      function settle(n) {
        if (n === secret) { pts[askr()] += 3; g.sfx('win'); g.toast('GOT IT — +3 to the questioner', 1500); }
        else { pts[ans()] += 2; g.sfx('bad'); g.toast(`it was ${secret} — +2 to the answerer`, 1600); }
        stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
        phase = 'done';
        setTimeout(matchStart, 1600);
      }
      function giveUp() {
        pts[ans()] += 2;
        g.sfx('explode'); g.toast(`out of questions — it was ${secret}; +2 to ${esc(g.name(ans()))}`, 1700);
        stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
        phase = 'done';
        setTimeout(matchStart, 1600);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Both minds unreadable at ${pts[1]} apiece.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Interrogation final ${pts[1]}–${pts[2]}.`);
      }
      matchStart();
    },
    onStop() { starter = 3 - starter; },
  });
})();
