/* Ship, Captain & Crew — find the 6, the 5 and the 4, then load the cargo dice. */
(function () {
  const TURNS = 4;
  let starter = 1;
  Game.init({
    id: 'ship-captain-crew',
    rules: [
      'Three rolls per turn with five dice. You must find them in order: first a 6 (the ship), then a 5 (the captain), then a 4 (the crew).',
      'Once all three are aboard, every remaining die you keep counts as cargo and adds its face value to the hold.',
      'No ship by the end of your third roll means the turn is worth nothing.',
      `Highest cargo after ${TURNS} turns each wins the voyage.`,
    ],
    controls: { all: 'Tap dice to keep them · <kbd>Space</kbd> rolls · ⚓ to bank the hold' },
    points: true,
    onStart(g) {
      const dice = [1, 2, 3, 4, 5];
      const keep = [false, false, false, false, false];
      let turn = starter, rolls = 0, t = { 1: 0, 2: 0 }, turns = 0;
      const req = [6, 5, 4];
      const have = () => req.filter((n) => dice.some((d, i) => keep[i] && d === n)).length;
      const cargo = () => dice.reduce((a, d, i) => (keep[i] && !req.includes(d) ? a + d : a), 0);
      const wrap = h('div', { class: 'col', style: { width: 'min(420px, 94vw)' } });
      g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const diceRow = h('div', { class: 'dice' });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll' });
      const bankBtn = h('button', { class: 'btn', text: '⚓ Bank hold' });
      wrap.append(info, diceRow, h('div', { class: 'row' }, rollBtn, bankBtn));
      function draw() {
        const got = have();
        info.innerHTML = `<span class="pc${turn}">${esc(g.name(turn))}</span> · ship ${dice.includes(6) && keep[dice.indexOf(6)] ? '✅' : '⛵'} captain ${got >= 2 ? '✅' : '🧭'} crew ${got >= 3 ? '✅' : '👥'} · hold <b>${cargo()}</b>${got < 3 ? ' (not scored until the crew is aboard)' : ''}`;
        diceRow.innerHTML = '';
        dice.forEach((v, i) => {
          const needed = !keep[i] && v === req[got];
          const d = UI.die(v, { cls: (keep[i] ? 'held p' + turn : '') + (needed ? ' clickable' : ''), onClick: () => { if (rolls > 0 && rolls < 3 && (got >= 3 || v === req[got])) { keep[i] = !keep[i]; g.sfx('click'); draw(); } else g.sfx('bad'); } });
          if (keep[i] && req.includes(v)) d.appendChild(h('div', { text: v === 6 ? '⚓' : v === 5 ? '🎩' : '🧑‍✈️', style: { position: 'absolute', bottom: '-2px', right: '-2px', fontSize: '14px' } }));
          diceRow.appendChild(d);
        });
        rollBtn.disabled = rolls >= 3;
        rollBtn.textContent = rolls === 0 ? '🎲 Set sail (roll)' : `🎲 Roll again (${3 - rolls} left)`;
        bankBtn.disabled = got < 3 || rolls === 0;
        g.points(t[1], t[2]);
      }
      function roll() {
        if (rolls >= 3 || g.over) return;
        for (let i = 0; i < 5; i++) if (!keep[i]) dice[i] = rnd(1, 6);
        rolls++; g.sfx('tick');
        const got = have();
        if (got >= 3 && cargo() > 0) g.sfx('score');
        if (rolls === 3 && got < 3) { g.sfx('bad'); g.toast('No crew aboard — turn for nothing', 1100); return bank(0); }
        draw();
      }
      function bank(pts) {
        t[turn] += pts; turns++;
        rolls = 0; keep.fill(false); dice.forEach((_, i) => { dice[i] = i + 1; });
        g.points(t[1], t[2]);
        if (turns >= TURNS * 2) return end();
        turn = 3 - turn; g.turn(turn); draw();
      }
      function end() {
        starter = 3 - starter;
        if (t[1] === t[2]) return g.draw(`Both holds on ${t[1]} cargo points.`);
        const w = t[1] > t[2] ? 1 : 2;
        g.win(w, `${t[w]} cargo points to ${t[3 - w]}.`);
      }
      rollBtn.addEventListener('click', roll);
      bankBtn.addEventListener('click', () => { if (have() >= 3) { g.sfx('coin'); bank(cargo()); } else g.sfx('bad'); });
      g.key('Space', roll);
      g.key('KeyB', () => { if (have() >= 3) bank(cargo()); });
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
