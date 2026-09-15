/* Trivia Clash — ten questions, steals on the half-open. Bank of knowledge wins. */
(function () {
  const QS = [
    ['Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Mercury'], 1],
    ['How many continents are there?', ['5', '6', '7'], 2],
    ['What is the largest ocean?', ['Atlantic', 'Indian', 'Pacific'], 2],
    ['Which element has the symbol O?', ['Gold', 'Oxygen', 'Osmium'], 1],
    ['In which country is the Machu Picchu?', ['Brazil', 'Peru', 'Chile'], 1],
    ['How many strings does a violin have?', ['4', '5', '6'], 0],
    ['What gas do plants absorb?', ['Oxygen', 'Nitrogen', 'Carbon dioxide'], 2],
    ['Who painted the Mona Lisa?', ['Van Gogh', 'Da Vinci', 'Picasso'], 1],
    ['What is the smallest prime number?', ['0', '1', '2'], 2],
    ['Which is the world’s largest lake by area?', ['Caspian', 'Superior', 'Victoria'], 0],
    ['How many minutes in a full day?', ['1440', '1240', '1640'], 0],
    ['What is H₂O better known as?', ['Hydrogen', 'Water', 'Peroxide'], 1],
    ['Which continent has the most countries?', ['Africa', 'Asia', 'Europe'], 0],
    ['An animal with a backbone is called…?', ['Vertebrate', 'Mollusc', 'Arthropod'], 0],
    ['Mount Everest sits on the border of Nepal and…?', ['India', 'China', 'Bhutan'], 1],
    ['How many hearts does an octopus have?', ['1', '2', '3'], 2],
    ['What is the currency of Japan?', ['Won', 'Yuan', 'Yen'], 2],
    ['Which planet has the most moons?', ['Jupiter', 'Saturn', 'Neptune'], 1],
    ['What is the longest river in the world?', ['Amazon', 'Nile', 'Yangtze'], 1],
    ['How many bones in an adult human body?', ['106', '206', '306'], 1],
  ];
  const ROUNDS = 10;
  let starter = 1;
  Game.init({
    id: 'trivia-clash',
    rules: [
      'Ten questions drawn from the general-knowledge bank. The active player answers first: correct = 2 points.',
      'Miss it and the question is LIVE — the rival may steal it for 1 point.',
      'Both wrong scores nothing and the clash moves on. Whoever has banked more points after ten questions takes the round of the mind.',
    ],
    controls: { all: 'Tap an answer · the rival gets a steal shot on a miss' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const bag = shuffle(QS.slice()).slice(0, ROUNDS);
      let i = 0, turn = starter, phase = 'answer', owner = 1;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const qEl = h('div', { class: 'bigmsg', style: { fontSize: '1.15rem' } });
      const optRow = h('div', { class: 'col', style: { gap: '.4rem', alignItems: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'q', label: 'question', val: 1 }]);
      wrap.append(info, qEl, optRow, stat.el);
      function show() {
        i++;
        if (i > bag.length) return end();
        phase = 'answer'; owner = turn;
        draw();
      }
      function draw() {
        const q = bag[i - 1];
        info.innerHTML = `question ${i}/${bag.length} · <b class="pc${owner}">${esc(g.name(owner))}</b> ${phase === 'answer' ? 'answers' : 'steals'}`;
        qEl.textContent = q[0];
        optRow.innerHTML = '';
        q[1].forEach((txt, k) => {
          const b = h('button', { class: 'btn' + (phase === 'answer' ? ' primary' : ''), text: txt, style: { width: 'min(320px, 90%)' } });
          b.addEventListener('click', () => pick(k));
          optRow.appendChild(b);
        });
        if (phase === 'steal') optRow.appendChild(h('button', { class: 'btn', text: '🏳 pass on the steal', style: { width: 'min(320px, 90%)' }, onclick: () => nextQ(true) }));
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('q', `${i}/${bag.length}`);
        g.points(pts[1], pts[2]);
        g.turn(owner, `<span class="pc${owner}">${esc(g.name(owner))}</span> — ${phase === 'answer' ? 'your answer' : 'rival missed — steal it?'}`);
      }
      function pick(k) {
        const q = bag[i - 1];
        if (k === q[2]) {
          pts[owner] += phase === 'answer' ? 2 : 1;
          g.sfx('coin'); g.toast(`${phase === 'answer' ? 'correct, +2' : 'stolen, +1'}`, 1100);
          turn = 3 - owner;
          setTimeout(() => nextQ(), 1200);
        } else if (phase === 'answer') {
          g.sfx('bad');
          phase = 'steal'; owner = 3 - owner;
          g.toast('missed — live question for the rival', 1200);
          draw();
        } else {
          g.sfx('explode'); g.toast('both fluffed it', 1100);
          turn = 3 - owner; owner = turn;
          setTimeout(() => nextQ(), 1100);
        }
      }
      function nextQ() { if (i >= bag.length) return end(); turn = 3 - turn; show(); }
      function end() {
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Ten questions each banked ${pts[1]} — a scholastic draw.`);
        const w = pts[1] > pts[2] ? 1 : 2;
        g.win(w, `The knowledge bank closes ${pts[1]}–${pts[2]}.`);
      }
      show();
    },
    onStop() { starter = 3 - starter; },
  });
})();
