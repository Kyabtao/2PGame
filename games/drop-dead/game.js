/* Drop Dead — fives and twos kill dice. Bank before the last die dies or lose the whole turn. */
(function () {
  const TURNS = 4;
  let starter = 1;
  Game.init({
    id: 'drop-dead',
    rules: [
      'Roll five dice. Every 2 and every 5 is dead: those dice are removed and you re-roll what is left.',
      'When a roll has no 2s or 5s, the surviving dice score their pip total. You may bank that and stop, or roll again and add to it.',
      'If a roll kills the last live dice you have DROP DEAD — the entire turn scores nothing, however much you had banked.',
      `Highest banked score after ${TURNS} turns each wins.`,
    ],
    controls: { all: '<kbd>Space</kbd> / tap ROLL to throw · 💰 banks the turn' },
    points: true,
    onStart(g) {
      let live = [1, 2, 3, 4, 5];
      let turn = starter, rolls = 0, banked = 0, t = { 1: 0, 2: 0 }, turns = 0, dead = 0;
      const wrap = h('div', { class: 'col', style: { width: 'min(420px, 94vw)' } });
      g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const diceRow = h('div', { class: 'dice' });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll' });
      const bankBtn = h('button', { class: 'btn', text: '💰 Bank' });
      wrap.append(info, diceRow, h('div', { class: 'row' }, rollBtn, bankBtn));
      const pile = h('div', { class: 'row' });
      wrap.appendChild(pile);
      const current = () => live.reduce((a, b) => a + b, 0);
      function draw() {
        info.innerHTML = `<span class="pc${turn}">${esc(g.name(turn))}</span> banked <b>${banked}</b> · on the table <b>${current()}</b> with ${live.length} live die${live.length === 1 ? '' : 's'}`;
        diceRow.innerHTML = '';
        live.forEach((v) => diceRow.appendChild(UI.die(v, { cls: 'p' + turn })));
        pile.innerHTML = dead ? `<span class="muted" style="font-size:.85rem">dead: ${'💀'.repeat(Math.min(dead, 10))}</span>` : '';
        rollBtn.disabled = !live.length;
        bankBtn.disabled = rolls === 0 || !live.length;
        g.points(t[1], t[2]);
      }
      function roll() {
        if (!live.length || g.over) return;
        rolls++;
        const before = live.length;
        live = live.map(() => rnd(1, 6));
        const killed = live.filter((v) => v === 2 || v === 5);
        dead += killed.length;
        live = live.filter((v) => v !== 2 && v !== 5);
        if (killed.length) g.sfx('bad');
        else g.sfx('score');
        draw();
        if (!live.length) {
          g.sfx('explode');
          g.toast(before === 5 ? 'DROP DEAD — turn wiped!' : 'Last die died — turn wiped!', 1400);
          return bank(0, true);
        }
      }
      function bank(pts, wiped) {
        if (!wiped) { t[turn] += pts || current(); g.sfx(pts || current() ? 'coin' : 'bad'); }
        turns++;
        live = [1, 2, 3, 4, 5]; rolls = 0; banked = 0; dead = 0;
        g.points(t[1], t[2]);
        if (turns >= TURNS * 2) return end();
        turn = 3 - turn; g.turn(turn); draw();
      }
      function end() {
        starter = 3 - starter;
        if (t[1] === t[2]) return g.draw(`Both survived to ${t[1]} points.`);
        const w = t[1] > t[2] ? 1 : 2;
        g.win(w, `${t[w]} to ${t[3 - w]} · ${turns} turns of dice.`);
      }
      rollBtn.addEventListener('click', roll);
      bankBtn.addEventListener('click', () => bank(current()));
      g.key('Space', roll);
      g.key('KeyB', () => { if (rolls && live.length) bank(current()); });
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
