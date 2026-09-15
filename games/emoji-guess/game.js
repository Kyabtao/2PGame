/* Emoji Guess — read the picture riddles. Correct calls pay, wrong calls gift the steal. */
(function () {
  const RIDES = [
    ['👑🤴💍', 'The Crown', ['The Crown', 'King Kong', 'Wedding Crashers'], 0],
    ['🦸🕷️', 'Spider-Man', ['Batman', 'Spider-Man', 'Ant-Man'], 1],
    ['⭐️🌌🚀', 'Star Wars', ['Star Trek', 'Gravity', 'Star Wars'], 2],
    ['🐠🔍🏠', 'Finding Nemo', ['Shark Tale', 'Finding Nemo', 'The Little Mermaid'], 1],
    ['😨👻🏚️', 'Ghostbusters', ['Casper', 'Paranormal Activity', 'Ghostbusters'], 2],
    ['🍫🏭🎫', 'Charlie and the Chocolate Factory', ['Wonka', 'Charlie and the Chocolate Factory', 'Matilda'], 1],
    ['🚢🧊💔', 'Titanic', ['Titanic', 'The Poseidon Adventure', 'Deep Impact'], 0],
    ['🦖🏝️🚙', 'Jurassic Park', ['Godzilla', 'The Lost World', 'Jurassic Park'], 2],
    ['🧙💍🌋', 'Lord of the Rings', ['Harry Potter', 'The Hobbit', 'Lord of the Rings'], 2],
    ['🏠👨‍👩‍👧🔪', 'Psycho', ['House of Wax', 'Psycho', 'Scream'], 1],
    ['🐭🎢🎫', 'Disneyland', ['Disneyland', 'Chuck E. Cheese', 'Universal'], 0],
    ['🌧️☂️🎤', 'Singin’ in the Rain', ['Umbrella Academy', 'Singin’ in the Rain', 'The Weather Man'], 1],
    ['👨‍🚀🌕👣', 'Moonwalk… no: First Man', ['Apollo 13', 'Gravity', 'First Man'], 2],
    ['🕶️💊🐇', 'The Matrix', ['Total Recall', 'The Matrix', 'Tron'], 1],
    ['🦁👑🌅', 'The Lion King', ['The Lion King', 'Tarzan', 'Zootopia'], 0],
    ['🚗⚡🏙️', 'Blade Runner', ['Speed', 'Run Lola Run', 'Blade Runner'], 2],
  ];
  const ROUNDS = 8;
  let starter = 1;
  Game.init({
    id: 'emoji-guess',
    rules: [
      'Eight emoji rebuses for films and shows. The picker answers first: 2 points for reading it right.',
      'A miss hands the same rebus to the rival to steal for 1.',
      'Three guesses are offered — no typing, pure deduction. After eight rebuses the sharper reader wins.',
    ],
    controls: { all: 'Tap the film you think the emojis spell' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const bag = shuffle(RIDES.slice()).slice(0, ROUNDS);
      let i = 0, turn = starter, phase = 'answer', owner = 1;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const art = h('div', { class: 'bigmsg', style: { fontSize: '2.6rem', letterSpacing: '.15em' } });
      const optRow = h('div', { class: 'col', style: { gap: '.4rem', alignItems: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, art, optRow, stat.el);
      function draw() {
        const q = bag[i];
        info.innerHTML = `rebus ${i + 1}/${ROUNDS} · <b class="pc${owner}">${esc(g.name(owner))}</b> ${phase === 'answer' ? 'guesses' : 'steals'}`;
        art.textContent = q[0];
        optRow.innerHTML = '';
        q[2].forEach((txt) => {
          const b = h('button', { class: 'btn' + (phase === 'answer' ? ' primary' : ''), text: txt, style: { width: 'min(330px, 92%)' } });
          b.addEventListener('click', () => pick(txt));
          optRow.appendChild(b);
        });
        if (phase === 'steal') optRow.appendChild(h('button', { class: 'btn', text: '🏳 pass the steal', style: { width: 'min(330px, 92%)' }, onclick: next }));
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
        g.turn(owner, `<span class="pc${owner}">${esc(g.name(owner))}</span> — what do they spell?`);
      }
      function pick(txt) {
        const q = bag[i];
        if (txt === q[1]) {
          pts[owner] += phase === 'answer' ? 2 : 1;
          g.sfx('coin'); g.toast('read it right', 1000);
          setTimeout(next, 1100);
        } else if (phase === 'answer') {
          phase = 'steal'; owner = 3 - owner; g.sfx('bad'); g.toast('nope — steal chance', 1100); draw();
        } else { g.sfx('explode'); g.toast(`it was “${q[1]}”`, 1300); setTimeout(next, 1200); }
      }
      function next() {
        i++;
        turn = 3 - turn; owner = turn; phase = 'answer';
        if (i >= ROUNDS) return end();
        draw();
      }
      function end() {
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Eight rebuses, even minds: ${pts[1]}–${pts[2]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `The emoji oracle crowns ${pts[1]}–${pts[2]}.`);
      }
      draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
