/* Name That Tune — four notes hummed through the tin whistle, three titles to shoot. */
(function () {
  const TUNES = [
    { t: 'Happy Birthday', n: [523, 523, 587, 523, 698, 659] },
    { t: 'Twinkle Twinkle', n: [262, 262, 392, 392, 440, 440, 392] },
    { t: 'Ode to Joy', n: [330, 330, 349, 392, 392, 349, 330, 294] },
    { t: 'Mary Had a Lamb', n: [330, 294, 262, 294, 330, 330, 330] },
    { t: 'Jingle Bells', n: [659, 659, 659, 659, 659, 659, 659, 784] },
    { t: 'Row Your Boat', n: [392, 392, 392, 440, 494, 440, 392, 330] },
    { t: 'London Bridge', n: [659, 617, 587, 617, 659, 617, 587, 587] },
    { t: 'Three Blind Mice', n: [784, 659, 523, 784, 659, 523] },
  ];
  const ROUNDS = 6;
  let starter = 1, ac = null;
  Game.init({
    id: 'name-that-tune',
    rules: [
      'The engine pipes a tune through a synth whistle — tap ▶ to hear it (once per listen; you may listen twice).',
      'Name the melody from three titles: correct +2 for the guesser; a miss gives the tune to the rival for +2.',
      'Guesser role swaps every round across six rounds. (No audio on this device? The notes scroll on screen — read them like sheet music.)',
    ],
    controls: { all: '▶ plays the tune · tap a title' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      const bag = shuffle(TUNES.slice());
      let r = 0, listens = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const noteRow = h('div', { class: 'row', style: { justifyContent: 'center' } });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, noteRow, btnRow, stat.el);
      const guesser = () => (r % 2 ? g.other(starter) : starter);
      function tone(freqs) {
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return false;
          ac = ac || new Ctx();
          let t = ac.currentTime + 0.05;
          freqs.forEach((f) => {
            const o = ac.createOscillator(), gn = ac.createGain();
            o.type = 'triangle'; o.frequency.value = f;
            gn.gain.setValueAtTime(0.0001, t);
            gn.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
            gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
            o.connect(gn).connect(ac.destination);
            o.start(t); o.stop(t + 0.32);
            t += 0.34;
          });
          return true;
        } catch (e) { return false; }
      }
      function round() {
        if (r >= ROUNDS || over) return end();
        listens = 0;
        const T = bag[r % bag.length];
        info.innerHTML = `tune ${r + 1}/${ROUNDS} · <b class="pc${guesser()}">${esc(g.name(guesser()))}</b> is listening`;
        noteRow.innerHTML = '';
        noteRow.appendChild(h('span', { class: 'muted', text: T.n.map((f) => (f < 300 ? 'low' : f < 420 ? 'mid' : f < 560 ? 'high' : 'very high')).join(' → ') }));
        btnRow.innerHTML = '';
        const play = h('button', { class: 'btn primary', text: `▶ play the tune (${2 - listens} listens left)` });
        play.addEventListener('click', () => {
          if (listens >= 2) return g.sfx('bad');
          listens++;
          g.sfx('move');
          const ok = tone(T.n);
          if (!ok) g.toast('no synth here — read the note ladder', 1400);
          play.textContent = `▶ play the tune (${2 - listens} listens left)`;
          if (listens === 2) play.disabled = true;
          void g;
        });
        btnRow.appendChild(play);
        const decoys = shuffle(TUNES.filter((x) => x.t !== T.t)).slice(0, 2).map((x) => x.t);
        shuffle([T.t, ...decoys]).forEach((t) => {
          const b = h('button', { class: 'btn', text: t });
          b.addEventListener('click', () => {
            r++;
            if (t === T.t) { pts[guesser()] += 2; g.sfx('win'); g.toast('spot on — +2', 1200); }
            else { pts[g.other(guesser())] += 2; g.sfx('bad'); g.toast(`it was ${T.t} — rival +2`, 1600); }
            stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
            setTimeout(round, 1300);
          });
          btnRow.appendChild(b);
        });
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
        g.turn(guesser(), `<span class="pc${guesser()}">${esc(g.name(guesser()))}</span> — hum it back by title`);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Both humming at ${pts[1]} — the jukebox stays neutral.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Jukebox duel ends ${pts[1]}–${pts[2]}.`);
      }
      round();
    },
  });
})();
