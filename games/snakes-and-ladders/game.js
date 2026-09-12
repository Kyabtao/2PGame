/* Snakes & Ladders — 100 squares, exact finish, 6 rolls again. */
(function () {
  let starter = 1;
  const SNAKES = { 99: 41, 95: 75, 92: 88, 89: 68, 74: 53, 64: 60, 62: 19, 49: 11, 46: 25, 16: 6 };
  const LADDERS = { 2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94 };
  Game.init({
    id: 'snakes-and-ladders',
    rules: ['Roll and move along the 100-square board. Ladders take you up, snakes slide you down.', 'A 6 gives you another roll. You need an exact roll to land on 100.', 'First to square 100 wins.'],
    controls: { all: '<kbd>Space</kbd> or click to roll' },
    points: true,
    onStart(g) {
      const pos = { 1: 0, 2: 0 }; let turn = starter, busy = false;
      const size = Math.floor(clamp((Math.min(window.innerWidth, 540) - 30) / 10, 28, 50));
      const grid = UI.grid({ rows: 10, cols: 10, size, gap: 2, cls: 'static' });
      grid.each((cell, r, c) => { const row = 9 - r; const n = row * 10 + (row % 2 === 0 ? c + 1 : 10 - c); cell.dataset.n = n; cell.style.fontSize = '.65rem'; cell.style.alignItems = 'flex-start'; cell.style.justifyContent = 'flex-start'; cell.style.padding = '2px'; cell.style.background = (r + c) % 2 ? 'var(--surface2)' : 'var(--surface)'; cell.innerHTML = `<span class="muted">${n}</span>`; if (SNAKES[n]) { cell.innerHTML += `<span style="position:absolute;right:2px;bottom:1px;font-size:.9rem" title="to ${SNAKES[n]}">🐍</span>`; cell.style.background = '#4a2020'; } if (LADDERS[n]) { cell.innerHTML += `<span style="position:absolute;right:2px;bottom:1px;font-size:.9rem" title="to ${LADDERS[n]}">🪜</span>`; cell.style.background = '#1f4a2a'; } cell.style.position = 'relative'; });
      const die = UI.die(1); const rollBtn = h('button', { class: 'btn primary big', text: '🎲 Roll (Space)', onclick: roll }); const msg = h('div', { class: 'muted' });
      g.stage.append(grid.el, h('div', { class: 'row' }, die, rollBtn), msg);
      const cellOf = (n) => grid.el.querySelector(`[data-n="${n}"]`);
      const render = () => { grid.el.querySelectorAll('.tokn').forEach((e) => e.remove()); for (const p of [1, 2]) { if (!pos[p]) continue; const c = cellOf(pos[p]); c.appendChild(h('span', { class: 'tokn', style: { position: 'absolute', left: p === 1 ? '2px' : 'auto', right: p === 2 ? '2px' : 'auto', top: '50%', transform: 'translateY(-40%)', width: '40%', aspectRatio: '1', borderRadius: '50%', background: g.color(p), boxShadow: '0 0 0 2px #111' } })); } g.points(pos[1], pos[2]); rollBtn.className = 'btn big primary p' + turn; g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> on ${pos[turn]}`); };
      g.key('Space', roll); grid.el.addEventListener('click', roll);
      async function roll() {
        if (busy || g.over) return; busy = true;
        for (let k = 0; k < 6; k++) { UI.setDie(die, rnd(1, 6)); await sleep(50); }
        const v = rnd(1, 6); UI.setDie(die, v); g.sfx('move');
        const p = turn; let target = pos[p] + v;
        if (target > 100) { msg.textContent = `${g.name(p)} needs exactly ${100 - pos[p]} — no move.`; g.sfx('bad'); await sleep(800); }
        else {
          for (let s = pos[p] + 1; s <= target; s++) { pos[p] = s; render(); g.sfx('tick'); await sleep(120); }
          if (SNAKES[target]) { msg.textContent = `🐍 Snake! ${target} → ${SNAKES[target]}`; g.sfx('bad'); await sleep(500); pos[p] = SNAKES[target]; render(); }
          else if (LADDERS[target]) { msg.textContent = `🪜 Ladder! ${target} → ${LADDERS[target]}`; g.sfx('coin'); await sleep(500); pos[p] = LADDERS[target]; render(); }
          else msg.textContent = `${g.name(p)} rolled ${v}.`;
          if (pos[p] === 100) { render(); starter = 3 - starter; return g.win(p, `Reached 100; ${g.name(3 - p)} was on ${pos[3 - p]}.`); }
        }
        if (g.over) return;
        if (v === 6) msg.textContent += ' Rolled a 6 — roll again!'; else turn = 3 - turn;
        busy = false; render();
      }
      render();
    },
  });
})();
