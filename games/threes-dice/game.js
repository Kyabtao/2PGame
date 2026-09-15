/* Threes — 3s are free. Everything else is a minus, and the lowest round total wins. */
(function () {
  const ROUNDS = 5, MAX_ROLLS = 4;
  let starter = 1;
  Game.init({
    id: 'threes-dice',
    rules: [
      'Five dice. Any 3 you throw is parked and off your back — it is free, and it pays 5 points of its own.',
      'Re-roll the rest up to four times a round trying to clear the junk. You choose when to stop.',
      'The round value is (number of 3s × 5) − the pip total of every die still loose. A round with no 3s at all costs you 5.',
      `Lowest total across ${ROUNDS} rounds wins — this one is played the other way round.`,
    ],
    controls: { all: '<kbd>Space</kbd> / ROLL to throw · 🧊 STOP to settle the round' },
    points: true,
    onStart(g) {
      let live = [1, 2, 3, 4, 5], threes = 0, rolls = 0, turn = starter, round = 0;
      const val = { 1: 0, 2: 0 };
      const wrap = h('div', { class: 'col', style: { width: 'min(420px, 94vw)' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const diceRow = h('div', { class: 'dice' });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll' });
      const stopBtn = h('button', { class: 'btn', text: '🧊 Stop' });
      wrap.append(info, diceRow, h('div', { class: 'row' }, rollBtn, stopBtn));
      const junk = () => live.reduce((a, b) => a + b, 0);
      const now = () => threes * 5 - junk();
      function draw() {
        info.innerHTML = `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${threes} three${threes === 1 ? '' : 's'} parked, junk ${junk()} → round <b>${now()}</b> · totals ${val[1]} vs ${val[2]}`;
        diceRow.innerHTML = '';
        for (let i = 0; i < threes; i++) diceRow.appendChild(UI.die(3, { cls: 'held p' + turn, small: true }));
        live.forEach((v) => diceRow.appendChild(UI.die(v, { cls: 'p' + turn })));
        rollBtn.disabled = rolls >= MAX_ROLLS || !live.length;
        rollBtn.textContent = rolls >= MAX_ROLLS ? '🎲 last roll used' : `🎲 Roll ${live.length} (${MAX_ROLLS - rolls} left)`;
        stopBtn.disabled = rolls === 0;
        g.points(val[1], val[2]);
      }
      function roll() {
        if (g.over || rolls >= MAX_ROLLS || !live.length) return;
        rolls++;
        live = live.map(() => rnd(1, 6));
        const got = live.filter((v) => v === 3).length;
        live = live.filter((v) => v !== 3); threes += got;
        g.sfx(got ? 'score' : 'tick');
        if (got) g.toast(`+${got} three${got > 1 ? 's' : ''}`, 700);
        if (!live.length || rolls >= MAX_ROLLS) { g.toast(live.length ? 'Out of rolls — round settles' : 'Board cleared!', 900); return settle(); }
        draw();
      }
      function settle() {
        val[turn] += now();
        g.points(val[1], val[2]);
        live = [1, 2, 3, 4, 5]; threes = 0; rolls = 0;
        round++;
        if (round >= ROUNDS * 2) return end();
        turn = 3 - turn; g.turn(turn); draw();
      }
      function end() {
        starter = 3 - starter;
        g.points(val[1], val[2]);
        if (val[1] === val[2]) return g.draw(`Both on ${val[1]} — a perfect dead heat of junk.`);
        const w = val[1] < val[2] ? 1 : 2;
        g.win(w, `Lower is better: ${val[w]} beats ${val[3 - w]}.`);
      }
      rollBtn.addEventListener('click', roll);
      stopBtn.addEventListener('click', () => { if (rolls) { g.sfx('click'); settle(); } else g.sfx('bad'); });
      g.key('Space', roll);
      g.key('KeyS', () => { if (rolls) settle(); });
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
