/* Fives — press your luck: keep every 5 you throw, bank before a blank roll wipes the round. */
(function () {
  const ROUNDS = 5, TARGET = 5;
  let starter = 1;
  Game.init({
    id: 'fives-dice',
    rules: [
      'Five dice, and every 5 you throw is parked to one side at 5 points each.',
      'Re-roll the rest as many times as you like — but a roll with no 5 in it wipes the round and you bank nothing.',
      'Bank early and you live to fight; bank late and you might lose 25 points in one throw.',
      `After ${ROUNDS} rounds each the biggest bank wins. Reaching ${TARGET * 5} in a single round is a clean sweep and cannot be wiped.`,
    ],
    controls: { all: '<kbd>Space</kbd> / ROLL to throw · 💰 banks the round' },
    points: true,
    onStart(g) {
      let bank = { 1: 0, 2: 0 }, round = 0, turn = starter;
      let live = [1, 2, 3, 4, 5], kept = 0, rolls = 0, locked = false;
      const wrap = h('div', { class: 'col', style: { width: 'min(420px, 94vw)' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const diceRow = h('div', { class: 'dice' });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll the dice' });
      const bankBtn = h('button', { class: 'btn', text: '💰 Bank' });
      wrap.append(info, diceRow, h('div', { class: 'row' }, rollBtn, bankBtn));
      function draw() {
        info.innerHTML = `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${kept} five${kept === 1 ? '' : 's'} parked = <b>${kept * 5}</b>${locked ? ' LOCKED' : ''} · banks ${bank[1]}–${bank[2]}`;
        diceRow.innerHTML = '';
        for (let i = 0; i < kept; i++) diceRow.appendChild(UI.die(5, { cls: 'held p' + turn, small: true }));
        if (!locked) live.forEach((v) => diceRow.appendChild(UI.die(v, { cls: 'p' + turn })));
        rollBtn.disabled = locked;
        bankBtn.disabled = locked || kept === 0;
        g.points(bank[1], bank[2]);
      }
      function roll() {
        if (locked || g.over) return;
        rolls++;
        live = live.map(() => rnd(1, 6));
        const fives = live.filter((v) => v === 5).length;
        live = live.filter((v) => v !== 5);
        if (fives) { kept += fives; g.sfx('score'); }
        if (kept >= TARGET) { locked = true; g.sfx('coin'); g.toast('Clean sweep — cannot be wiped!', 1100); return bankNow(); }
        if (!fives) { g.sfx('explode'); g.toast(rolls === 1 ? 'No 5 on the opening roll — round dead' : 'Blank roll! The round is wiped', 1200); kept = 0; return endRound(); }
        g.toast(`+${fives * 5} — ${kept * 5} on the table`, 800);
        draw();
      }
      function bankNow() { bank[turn] += kept * 5; g.sfx('coin'); endRound(); }
      function endRound() {
        kept = 0; rolls = 0; locked = false; live = [1, 2, 3, 4, 5];
        round++;
        g.points(bank[1], bank[2]);
        if (round >= ROUNDS * 2) return end();
        turn = 3 - turn; g.turn(turn); draw();
      }
      function end() {
        starter = 3 - starter;
        if (bank[1] === bank[2]) return g.draw(`Both banked ${bank[1]} after ${ROUNDS} rounds.`);
        const w = bank[1] > bank[2] ? 1 : 2;
        g.win(w, `${bank[w]} points to ${bank[3 - w]}.`);
      }
      rollBtn.addEventListener('click', roll);
      bankBtn.addEventListener('click', () => { if (kept) bankNow(); else g.sfx('bad'); });
      g.key('Space', roll);
      g.key('KeyB', () => { if (kept && !locked) bankNow(); });
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
