/* Whack-a-Mole — split boards, 30-second clock, moles and bombs. */
(function () {
  const TIME = 30;
  Game.init({
    id: 'whack-a-mole',
    rules: ['Each player has a 3×3 patch of holes. Whack the 🐹 moles as they pop up: +1 point (golden moles +3).', 'Avoid the 💣 bombs — whacking one costs 2 points.', `${TIME} seconds on the clock; highest score wins.`],
    controls: { p1: 'Tap / click, or numpad-style keys <kbd>Q W E</kbd> <kbd>A S D</kbd> <kbd>Z X C</kbd>', p2: 'Tap / click, or <kbd>U I O</kbd> <kbd>J K L</kbd> <kbd>M , .</kbd>' },
    points: true,
    async onStart(g) {
      const score = { 1: 0, 2: 0 }; let t = TIME;
      const KEYS = { 1: ['KeyQ', 'KeyW', 'KeyE', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX', 'KeyC'], 2: ['KeyU', 'KeyI', 'KeyO', 'KeyJ', 'KeyK', 'KeyL', 'KeyM', 'Comma', 'Period'] };
      const split = h('div', { class: 'split' }); const timer = h('div', { class: 'bigmsg' }, TIME + 's');
      const boards = {};
      for (const p of [1, 2]) {
        const side = h('div', { class: 'side p' + p }, h('h3', {}, g.name(p)));
        const grid = UI.grid({ rows: 3, cols: 3, size: Math.floor(clamp((window.innerWidth / 2 - 60) / 3, 48, 84)), gap: 8, onClick: (r, c) => whack(p, r * 3 + c) });
        grid.each((cell) => { cell.classList.add('hole'); cell.style.background = '#3b2a14'; cell.style.borderRadius = '50%'; cell.style.fontSize = 'calc(var(--cell) * .6)'; cell.style.boxShadow = 'inset 0 6px 12px #0008'; });
        side.appendChild(grid.el); split.appendChild(side);
        boards[p] = { grid, moles: Array(9).fill(null) };
      }
      g.stage.append(timer, split);
      g.key([...KEYS[1], ...KEYS[2]], (code) => { const p = KEYS[1].includes(code) ? 1 : 2; whack(p, KEYS[p].indexOf(code)); });
      function whack(p, i) {
        if (g.over || t <= 0) return; const b = boards[p]; const m = b.moles[i]; const cell = b.grid.at(Math.floor(i / 3), i % 3);
        if (!m) { cell.classList.add('shake'); setTimeout(() => cell.classList.remove('shake'), 300); return; }
        if (m.kind === 'bomb') { score[p] = Math.max(0, score[p] - 2); g.sfx('explode'); cell.textContent = '💥'; } else { score[p] += m.kind === 'gold' ? 3 : 1; g.sfx('pop'); cell.textContent = '⭐'; }
        b.moles[i] = null; g.points(score[1], score[2]); g.after(250, () => { if (!b.moles[i]) cell.textContent = ''; });
      }
      const spawn = (p) => { const b = boards[p]; const free = range(9).filter((i) => !b.moles[i]); if (!free.length) return; const i = pick(free); const r = Math.random(); const kind = r < 0.15 ? 'bomb' : r < 0.25 ? 'gold' : 'mole'; b.moles[i] = { kind }; const cell = b.grid.at(Math.floor(i / 3), i % 3); cell.textContent = kind === 'bomb' ? '💣' : kind === 'gold' ? '🌟' : '🐹'; cell.classList.add('flash'); g.after(rndf(700, 1400) - (TIME - t) * 12, () => { if (b.moles[i] && b.moles[i].kind === kind) { b.moles[i] = null; cell.textContent = ''; } }); };
      await g.countdown(3);
      g.every(520, () => { spawn(1); spawn(2); if (t < 12) { spawn(1); spawn(2); } });
      g.every(100, () => { t -= 0.1; timer.textContent = Math.max(0, Math.ceil(t)) + 's'; if (t <= 0) { if (score[1] === score[2]) return g.draw(`${score[1]} moles each.`); g.win(score[1] > score[2] ? 1 : 2, `${Math.max(score[1], score[2])} – ${Math.min(score[1], score[2])} points.`); } });
    },
  });
})();
