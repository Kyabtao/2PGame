/* Farkle — six dice, set aside scoring dice, hot dice, first to 4000. */
(function () {
  let starter = 1;
  const TARGET = 4000;
  function scoreDice(d) { // returns {score, used} best scoring of selection; used must equal all selected for a valid set-aside
    if (!d.length) return { score: 0, used: 0 };
    const c = [0, 0, 0, 0, 0, 0, 0]; d.forEach((x) => c[x]++);
    let score = 0, used = 0;
    if (d.length === 6 && [1, 2, 3, 4, 5, 6].every((f) => c[f] === 1)) return { score: 1500, used: 6 };
    if (d.length === 6 && [1, 2, 3, 4, 5, 6].filter((f) => c[f] === 2).length === 3) return { score: 1500, used: 6 };
    for (let f = 1; f <= 6; f++) {
      if (c[f] >= 3) { let base = f === 1 ? 1000 : f * 100; base *= Math.pow(2, c[f] - 3); score += base; used += c[f]; c[f] = 0; }
    }
    score += c[1] * 100 + c[5] * 50; used += c[1] + c[5];
    return { score, used };
  }
  Game.init({
    id: 'farkle',
    rules: ['Roll six dice. Set aside scoring dice: single 1 = 100, single 5 = 50, three of a kind = 100× face (1s = 1000), each extra matching die doubles it; a 1–6 straight or three pairs = 1500.', 'After setting aside, roll the rest or bank. If a roll has no scoring dice — <b>Farkle!</b> — you lose the turn\'s points. Score with all six dice and you get to roll all six again (hot dice).', `First to ${TARGET} wins (the other player gets one last turn).`],
    controls: { all: 'Click dice to select · <b>Set aside & roll</b> · <b>Bank</b> · <kbd>Space</kbd> roll / <kbd>B</kbd> bank' },
    points: true,
    onStart(g) {
      const total = { 1: 0, 2: 0 }; let turn = starter, live = 6, dice = [], sel = [], pot = 0, busy = false, rolled = false, finalTurnFor = null;
      const diceRow = h('div', { class: 'dice' }); const potEl = h('div', { class: 'bigmsg' }, 'Turn: 0');
      const info = h('div', { class: 'muted' });
      const rollBtn = h('button', { class: 'btn primary big', text: '🎲 Roll (Space)', onclick: roll }); const bankBtn = h('button', { class: 'btn big', text: '🏦 Bank (B)', onclick: bank });
      const stat = { 1: h('div', { class: 'stat' }), 2: h('div', { class: 'stat' }) };
      g.stage.append(h('div', { class: 'split' }, h('div', { class: 'side p1' }, h('h3', {}, g.name(1)), stat[1]), h('div', { class: 'side p2' }, h('h3', {}, g.name(2)), stat[2])), diceRow, potEl, info, h('div', { class: 'row' }, rollBtn, bankBtn));
      g.key('Space', roll); g.key('KeyB', bank);
      const selScore = () => scoreDice(sel.map((i) => dice[i]));
      const render = () => {
        for (const p of [1, 2]) stat[p].innerHTML = `<b style="font-size:2rem">${total[p]}</b>`;
        diceRow.innerHTML = ''; dice.forEach((v, i) => { const el = UI.die(v, { onClick: () => toggle(i) }); if (sel.includes(i)) el.classList.add('held'); diceRow.appendChild(el); });
        const s = selScore(); const valid = sel.length && s.used === sel.length;
        potEl.textContent = `Turn: ${pot}${valid ? ` + ${s.score}` : ''}`;
        info.textContent = !rolled ? `${live} dice to roll` : valid ? (sel.length === live ? 'Hot dice! Set aside and roll all six again' : `Set aside ${sel.length} and roll ${live - sel.length}`) : sel.length ? 'Selection is not a valid scoring set' : 'Select scoring dice';
        rollBtn.textContent = rolled ? '✅ Set aside & roll' : '🎲 Roll (Space)'; rollBtn.disabled = rolled && !valid; bankBtn.disabled = !(pot + (valid ? s.score : 0)) || (rolled && !valid) || (rolled && !sel.length);
        rollBtn.className = 'btn big primary p' + turn;
        g.points(total[1], total[2]); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>${finalTurnFor === turn ? ' · last turn!' : ''}`);
      };
      const toggle = (i) => { if (!rolled || busy || g.over) return; sel.includes(i) ? sel.splice(sel.indexOf(i), 1) : sel.push(i); g.sfx('click'); render(); };
      async function roll() {
        if (busy || g.over) return;
        if (rolled) { const s = selScore(); if (!sel.length || s.used !== sel.length) return; pot += s.score; live -= sel.length; if (live === 0) live = 6; sel = []; }
        busy = true; rolled = false; render();
        dice = range(live).map(() => rnd(1, 6));
        for (let k = 0; k < 6; k++) { diceRow.innerHTML = ''; dice.forEach(() => diceRow.appendChild(UI.die(rnd(1, 6), { cls: 'rolling' }))); await sleep(60); }
        rolled = true; busy = false; render();
        if (scoreDice(dice).score === 0) {
          g.sfx('bad'); info.textContent = 'FARKLE! No scoring dice.'; potEl.textContent = 'Farkle 💀'; busy = true; await sleep(1200); if (g.over) return; pot = 0; nextTurn(); return;
        }
      }
      function bank() {
        if (busy || g.over) return;
        let add = pot; if (rolled) { const s = selScore(); if (!sel.length || s.used !== sel.length) return; add += s.score; }
        if (!add) return;
        total[turn] += add; g.sfx('coin'); pot = 0; nextTurn();
      }
      function nextTurn() {
        if (finalTurnFor === turn) { render(); starter = 3 - starter; const a = total[1], b = total[2]; if (a === b) return g.draw(`Tied at ${a}.`); return g.win(a > b ? 1 : 2, `${Math.max(a, b)} – ${Math.min(a, b)}.`); }
        if (total[turn] >= TARGET && finalTurnFor === null) { finalTurnFor = 3 - turn; g.toast(`${g.name(turn)} reached ${TARGET}! ${g.name(3 - turn)} gets one last turn.`, 2000); }
        turn = 3 - turn; live = 6; dice = []; sel = []; pot = 0; rolled = false; busy = false; render();
      }
      render();
    },
  });
})();
