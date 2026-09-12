/* Shut the Box — tiles 1–9, roll two dice, shut tiles summing to the roll; lowest remaining wins. */
(function () {
  let starter = 1;
  Game.init({
    id: 'shut-the-box',
    rules: ['Nine tiles numbered 1–9. Roll two dice (one die once 7, 8 and 9 are shut), then flip down any tiles that add up exactly to the roll.', 'When no combination fits, your turn ends and the sum of the remaining tiles is your score. Shutting every tile is a perfect 0.', 'Both players take one turn; the lower score wins.'],
    controls: { all: 'Click tiles to select · <b>Shut</b> to confirm · <kbd>Space</kbd> roll' },
    points: true,
    onStart(g) {
      const scores = { 1: null, 2: null }; let turn = starter, tiles = range(9).map(() => true), roll = 0, sel = [], busy = false;
      const tileRow = h('div', { class: 'row', style: { gap: '.35rem', flexWrap: 'wrap' } });
      const d1 = UI.die(1), d2 = UI.die(1); const msg = h('div', { class: 'bigmsg', style: { fontSize: '1.2rem' } });
      const rollBtn = h('button', { class: 'btn primary big', text: '🎲 Roll (Space)', onclick: doRoll }); const shutBtn = h('button', { class: 'btn big', text: 'Shut tiles', onclick: shut });
      g.stage.append(tileRow, h('div', { class: 'dice' }, d1, d2), msg, h('div', { class: 'row' }, rollBtn, shutBtn));
      g.key('Space', doRoll); g.key('Enter', shut); g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'], (c) => toggle(+c.slice(-1) - 1));
      const remaining = () => tiles.reduce((s, up, i) => s + (up ? i + 1 : 0), 0);
      const oneDie = () => !tiles[6] && !tiles[7] && !tiles[8];
      const canMake = (target) => { const ups = tiles.map((u, i) => u ? i + 1 : 0).filter(Boolean); const rec = (i, t) => t === 0 ? true : i >= ups.length || t < 0 ? false : rec(i + 1, t - ups[i]) || rec(i + 1, t); return rec(0, target); };
      const render = () => {
        tileRow.innerHTML = ''; tiles.forEach((up, i) => { const el = h('button', { class: 'btn big tile' + (sel.includes(i) ? ' on' : '') + (up ? '' : ' ghost'), text: String(i + 1), disabled: !up || !roll, onclick: () => toggle(i) }); el.style.minWidth = '2.6rem'; if (!up) el.style.opacity = 0.25; tileRow.appendChild(el); });
        const sum = sel.reduce((s, i) => s + i + 1, 0);
        shutBtn.disabled = !roll || sum !== roll; rollBtn.disabled = !!roll;
        msg.textContent = roll ? `Rolled ${roll} — selected ${sum}` : `${g.name(turn)}: remaining ${remaining()}. Roll!`;
        g.points(scores[1] ?? '–', scores[2] ?? '–'); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${remaining()} showing`);
      };
      const toggle = (i) => { if (!roll || !tiles[i] || busy || g.over) return; sel.includes(i) ? sel.splice(sel.indexOf(i), 1) : sel.push(i); g.sfx('click'); render(); };
      async function doRoll() {
        if (roll || busy || g.over) return; busy = true;
        const two = !oneDie(); d2.style.visibility = two ? 'visible' : 'hidden';
        for (let k = 0; k < 6; k++) { UI.setDie(d1, rnd(1, 6)); if (two) UI.setDie(d2, rnd(1, 6)); await sleep(60); }
        const a = rnd(1, 6), b = two ? rnd(1, 6) : 0; UI.setDie(d1, a); if (two) UI.setDie(d2, b); roll = a + b; g.sfx('move'); busy = false; render();
        if (!canMake(roll)) { msg.textContent = `Rolled ${roll} — no combination fits!`; g.sfx('bad'); busy = true; await sleep(1300); if (g.over) return; busy = false; endTurn(); }
      }
      function shut() {
        if (!roll || busy || g.over) return; const sum = sel.reduce((s, i) => s + i + 1, 0); if (sum !== roll) return;
        sel.forEach((i) => { tiles[i] = false; }); sel = []; roll = 0; g.sfx('score'); render();
        if (remaining() === 0) { g.sfx('win'); g.toast('SHUT THE BOX! 🎉', 1500); endTurn(); }
      }
      function endTurn() {
        scores[turn] = remaining();
        if (scores[1] !== null && scores[2] !== null) { render(); starter = 3 - starter; if (scores[1] === scores[2]) return g.draw(`Both left ${scores[1]}.`); const w = scores[1] < scores[2] ? 1 : 2; return g.win(w, `${scores[w]} vs ${scores[3 - w]}${scores[w] === 0 ? ' — shut the box!' : ''}.`); }
        g.toast(`${g.name(turn)} scores ${scores[turn]}`, 1400);
        turn = 3 - turn; tiles = range(9).map(() => true); roll = 0; sel = []; d2.style.visibility = 'visible'; render();
      }
      render();
    },
  });
})();
