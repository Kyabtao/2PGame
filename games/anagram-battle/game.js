/* Anagram Battle — unscramble for points, or sabotage the rival with a challenge. */
(function () {
  const WORDS = ['PLANET', 'BRIDGE', 'MARKET', 'JUNGLE', 'CASTLE', 'ROCKET', 'GARDEN', 'WINTER', 'MONKEY', 'FORTUNE', 'ORANGE', 'SILVER', 'TEMPLE', 'PUZZLE', 'WIZARD', 'BASKET', 'RESORT', 'VOLCANO', 'QUARTZ', 'PYRAMID'];
  const ROUNDS = 12;
  let starter = 1;
  const scramble = (w) => { for (let t = 0; t < 8; t++) { const s = shuffle(w.split('')).join(''); if (s !== w) return s; } return w.split('').reverse().join(''); };
  Game.init({
    id: 'anagram-battle',
    rules: [
      'Twelve scrambled words. The active player may UNSCRAMBLE by picking the right option — or claim a bonus: answer, then the rival sees your chosen spelling one letter at a time and gets a steal if you were wrong.',
      'Right unscramble: 2 points. Steal conversion: 1 point for the thief.',
      'A pass or a double-miss burns the word for nothing.',
      'Most points after the twelfth scramble wins the bout of letters.',
    ],
    controls: { all: 'Tap the word you think fits the letters' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let i = 0, turn = starter, phase = 'answer', owner = 1;
      const bag = shuffle(WORDS.slice()).slice(0, ROUNDS).map((w) => {
        const wrongs = shuffle(WORDS.filter((x) => x !== w)).slice(0, 2);
        return { w, scr: scramble(w), opts: shuffle([w, ...wrongs]) };
      });
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const scr = h('div', { class: 'bigmsg', style: { fontSize: '2rem', letterSpacing: '.25em', fontWeight: 900 } });
      const optRow = h('div', { class: 'row wrap', style: { justifyContent: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'w', label: 'word', val: 1 }]);
      wrap.append(info, scr, optRow, stat.el);
      function draw() {
        const q = bag[i];
        info.innerHTML = `scramble ${i + 1}/${ROUNDS} · <b class="pc${owner}">${esc(g.name(owner))}</b> ${phase === 'answer' ? 'to unscramble' : 'to steal'}`;
        scr.textContent = q.scr;
        optRow.innerHTML = '';
        q.opts.forEach((w) => {
          const b = h('button', { class: 'btn' + (phase === 'answer' ? ' primary' : ''), text: w, style: { minWidth: '120px' } });
          b.addEventListener('click', () => pick(w));
          optRow.appendChild(b);
        });
        if (phase === 'steal') optRow.appendChild(h('button', { class: 'chip', text: '🏳 pass', onclick: next }));
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('w', `${i + 1}/${ROUNDS}`);
        g.points(pts[1], pts[2]);
        g.turn(owner, `<span class="pc${owner}">${esc(g.name(owner))}</span> — the letters hide one of these`);
      }
      function pick(w) {
        const q = bag[i];
        if (w === q.w) {
          pts[owner] += phase === 'answer' ? 2 : 1;
          g.sfx('coin'); g.toast(`${q.w} ✓`, 1000);
          next();
        } else if (phase === 'answer') {
          g.sfx('bad'); phase = 'steal'; owner = 3 - owner; g.toast('wrong anagram — steal window open', 1100); draw();
        } else { g.sfx('explode'); g.toast(`it was ${q.w}`, 1200); next(); }
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
        if (pts[1] === pts[2]) return g.draw(`Both letter-banks sit at ${pts[1]} — a spelled draw.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Anagram battle over: ${pts[1]}–${pts[2]}.`);
      }
      draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
