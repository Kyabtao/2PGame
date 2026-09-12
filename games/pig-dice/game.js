/* Pig — push-your-luck dice to 100. */
(function () {
  let starter = 1;
  const TARGET = 100;
  Game.init({
    id: 'pig-dice',
    rules: ['On your turn, roll as many times as you dare. Each roll adds to your turn total.', 'Roll a 1 and you lose the turn total. Hold to bank it.', `First to ${TARGET} wins.`],
    controls: { all: '<kbd>R</kbd> / <kbd>Space</kbd> roll · <kbd>H</kbd> hold' },
    points: true,
    onStart(g) {
      const total = { 1: 0, 2: 0 }; let turn = starter, pot = 0, busy = false;
      const die = UI.die(1, { cls: 'big' }); const potEl = h('div', { class: 'bigmsg' }, 'Turn: 0');
      const bar = h('div', { class: 'split' });
      const stat = { 1: h('div', { class: 'stat' }), 2: h('div', { class: 'stat' }) };
      bar.append(h('div', { class: 'side p1' }, h('h3', {}, g.name(1)), stat[1]), h('div', { class: 'side p2' }, h('h3', {}, g.name(2)), stat[2]));
      const rollBtn = h('button', { class: 'btn primary big', text: '🎲 Roll (R)', onclick: roll }); const holdBtn = h('button', { class: 'btn big', text: '🏦 Hold (H)', onclick: hold });
      g.stage.append(bar, h('div', { class: 'row', style: { gap: '2rem' } }, die, potEl), h('div', { class: 'row' }, rollBtn, holdBtn));
      g.key(['KeyR', 'Space'], roll); g.key('KeyH', hold);
      const render = () => { for (const p of [1, 2]) stat[p].innerHTML = `<b style="font-size:2rem">${total[p]}</b><br><span class="muted">${TARGET - total[p]} to go</span>`; potEl.textContent = 'Turn: ' + pot; g.points(total[1], total[2]); rollBtn.className = 'btn big primary p' + turn; g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · turn total ${pot}`); };
      render();
      async function roll() {
        if (busy || g.over) return; busy = true;
        for (let i = 0; i < 6; i++) { UI.setDie(die, rnd(1, 6)); await sleep(50); }
        const v = rnd(1, 6); UI.setDie(die, v);
        if (v === 1) { g.sfx('bad'); pot = 0; potEl.textContent = 'Bust! 🐷'; g.toast(`${g.name(turn)} rolled a 1`, 1000); await sleep(900); if (g.over) return; turn = 3 - turn; render(); busy = false; return; }
        pot += v; g.sfx('move'); render(); busy = false;
      }
      function hold() {
        if (busy || g.over || !pot) return;
        total[turn] += pot; g.sfx('coin'); pot = 0;
        if (total[turn] >= TARGET) { render(); starter = 3 - starter; return g.win(turn, `${total[turn]} to ${total[3 - turn]}.`); }
        turn = 3 - turn; render();
      }
    },
  });
})();
