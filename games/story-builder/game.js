/* Story Builder — build a tall tale together, then prove you were listening. */
(function () {
  const LINKS = [
    { k: 'hero', q: 'Who was the hero?', o: ['a shy librarian', 'a retired pirate', 'a delivery robot'] },
    { k: 'place', q: 'Where did it happen?', o: ['a floating market', 'an abandoned mall', 'a lighthouse'] },
    { k: 'object', q: 'Which object mattered?', o: ['a brass key', 'a paper crane', 'a walkie-talkie'] },
    { k: 'trouble', q: 'What went wrong?', o: ['the tide came in', 'the power died', 'a parade blocked the road'] },
    { k: 'twist', q: 'What was the twist?', o: ['the villain was a child', 'it was all a dream', 'a twin showed up'] },
    { k: 'ending', q: 'How did it end?', o: ['everyone danced', 'the hero quit', 'a letter arrived'] },
  ];
  let starter = 1;
  Game.init({
    id: 'story-builder',
    rules: [
      'Six story beats, three choices each. Players alternate contributing links to one shared tall tale — each tap adds a sentence.',
      'When the story is told, the quiz begins: who built it, remembers it. Each beat is quizzed with two true options and one that was never chosen.',
      'Correct memory +2; wrong hands the point to the rival. After six links no plot can hide — the best listener wins.',
    ],
    controls: { all: 'Tap a story beat, then answer the recall quiz' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const story = [];
      const picked = {};
      let turn = starter, link = 0, quiz = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const storyBox = h('div', { class: 'hint', style: { maxWidth: '560px', lineHeight: 1.7 } });
      const optRow = h('div', { class: 'row wrap', style: { justifyContent: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, storyBox, optRow, stat.el);
      function render() {
        storyBox.innerHTML = story.length ? story.map((s, i) => `<b>${i + 1}.</b> ${esc(s)}`).join('<br>') : '<i>the page is blank…</i>';
      }
      function beat() {
        if (over) return;
        if (link >= LINKS.length) return startQuiz();
        const L = LINKS[link];
        info.innerHTML = `link ${link + 1}/${LINKS.length} · <b class="pc${turn}">${esc(g.name(turn))}</b> sets the ${L.k}`;
        optRow.innerHTML = '';
        const shuffled = shuffle(L.o.slice());
        shuffled.forEach((o) => {
          const b = h('button', { class: 'btn', text: o });
          b.addEventListener('click', () => {
            picked[L.k] = o;
            story.push(`${L.k[0].toUpperCase() + L.k.slice(1)}: ${o}.`);
            g.sfx('move');
            link++; turn = g.other(turn);
            render();
            beat();
          });
          optRow.appendChild(b);
        });
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — choose the ${L.k}`);
      }
      function startQuiz() {
        render();
        g.toast('story done — now prove you were listening', 1700);
        setTimeout(quizBeat, 1700);
      }
      function quizBeat() {
        if (over) return;
        if (quiz >= LINKS.length) return end();
        const L = LINKS[quiz];
        const truth = picked[L.k];
        const decoy = shuffle(L.o.filter((x) => x !== truth))[0];
        info.innerHTML = `quiz ${quiz + 1}/${LINKS.length} · <b class="pc${turn}">${esc(g.name(turn))}</b> answers`;
        optRow.innerHTML = '';
        shuffle([truth, decoy]).forEach((o) => {
          const b = h('button', { class: 'btn primary', text: o });
          b.addEventListener('click', () => {
            if (o === truth) { pts[turn] += 2; g.sfx('win'); g.toast('you were listening — +2', 1100); }
            else { pts[g.other(turn)] += 1; g.sfx('bad'); g.toast('never in the story — rival +1', 1200); }
            stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
            quiz++; turn = g.other(turn);
            setTimeout(quizBeat, 900);
          });
          optRow.appendChild(b);
        });
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${L.q}`);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Same story, same memory: ${pts[1]}–${pts[2]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `The listeners settle at ${pts[1]}–${pts[2]}.`);
      }
      beat();
    },
    onStop() { starter = 3 - starter; },
  });
})();
