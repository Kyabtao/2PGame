/* Guess the Number · Pass — one mind hides a number 1–12, the other narrows it down in four shots. */
(function () {
  const MAX = 12, SHOTS = 4;
  let starter = 1;
  Game.init({
    id: 'guess-the-number-pass',
    rules: [
      'The hider picks a number from the twelve tiles (1–12) and locks it behind a screen flip.',
      'The guesser has four shots at the same grid. After every try the hider taps 📈 “higher” or 📉 “lower” — the engine checks it honestly and refuses a lie.',
      'Guessed: guesser +3 minus the shot number. Survived four shots: hider +4. Two matches per player, roles swap after each.',
    ],
    controls: { all: 'Tap numbers · hider answers higher/lower' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let match = 0, secret = null, phase = 'hide', shots = 0, last = null, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const numRow = h('div', { class: 'row wrap', style: { justifyContent: 'center', maxWidth: '420px' } });
      const arrowRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, numRow, arrowRow, stat.el);
      const hider = () => (match % 2 ? g.other(starter) : starter);
      const guesser = () => g.other(hider());
      function startMatch() {
        match++;
        if (match > 4 || over) return end();
        secret = null; shots = 0; last = null; phase = 'hide';
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        info.innerHTML = `match ${match}/4 · <b class="pc${phase === 'hide' ? hider() : guesser()}">${esc(g.name(phase === 'hide' ? hider() : guesser()))}</b> ${phase === 'hide' ? 'hides a number' : phase === 'answer' ? '— hider, is it higher or lower?' : `shot ${shots + 1}/${SHOTS}`}`;
        numRow.innerHTML = '';
        arrowRow.innerHTML = '';
        if (phase !== 'answer') {
          for (let n = 1; n <= MAX; n++) {
            const used = shots && last === n;
            const b = h('button', { class: 'chip' + (secret === n ? ' on' : '') + (used ? ' dis' : ''), text: String(n), disabled: !!used });
            b.addEventListener('click', () => {
              if (phase === 'hide') { secret = n; g.sfx('click'); draw(); armLock(); return; }
              if (n === secret) {
                pts[guesser()] += Math.max(1, 4 - shots);
                g.sfx('win'); g.toast(`BULLSEYE on shot ${shots + 1}`, 1400);
                stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
                phase = 'done';
                setTimeout(startMatch, 1400);
                return;
              }
              shots++; last = n;
              g.sfx('move');
              phase = 'answer';
              draw();
            });
            numRow.appendChild(b);
          }
          g.turn(phase === 'hide' ? hider() : guesser());
        } else {
          info.innerHTML = `match ${match}/4 · <b class="pc${hider()}">${esc(g.name(hider()))}</b> — was ${last} ${last < secret ? 'too LOW' : 'too HIGH'}? Confirm honestly`;
          const up = h('button', { class: 'btn primary', text: '📈 higher' });
          const dn = h('button', { class: 'btn primary', text: '📉 lower' });
          const lie = () => { g.sfx('bad'); g.toast('the engine checked — that answer is a lie', 1300); };
          up.addEventListener('click', () => (last < secret ? afterShot() : lie()));
          dn.addEventListener('click', () => (last > secret ? afterShot() : lie()));
          arrowRow.append(up, dn);
          g.turn(hider(), `<span class="pc${hider()}">${esc(g.name(hider()))}</span> — answer the shot`);
        }
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
      }
      function afterShot() {
        if (shots >= SHOTS) {
          pts[hider()] += 4;
          g.sfx('coin'); g.toast(`${esc(g.name(hider()))} kept ${secret} hidden — +4`, 1500);
          stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
          phase = 'done';
          setTimeout(startMatch, 1400);
          return;
        }
        phase = 'guess';
        draw();
      }
      let lockBtn = null;
      function armLock() {
        if (!lockBtn) {
          lockBtn = h('button', { class: 'btn primary', text: '🔒 lock it in', onclick: () => { phase = 'guess'; g.pass(guesser()).then(draw); } });
          arrowRow.appendChild(lockBtn);
        }
        arrowRow.appendChild(lockBtn);
      }
      function end() {
        over = true;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Four matches, no advantage taken: ${pts[1]}–${pts[2]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Numbers locked and loaded ${pts[1]}–${pts[2]}.`);
      }
      startMatch();
    },
    onStop() { starter = 3 - starter; },
  });
})();
