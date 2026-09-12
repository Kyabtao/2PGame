/* 2048 Race — two boards side by side; first to make 512 (or highest score when both stall) wins. */
(function () {
  const GOAL = 512, LIMIT = 180;
  Game.init({
    id: '2048-race',
    rules: ['Two independent 4×4 boards. Slide tiles; equal tiles merge and double.', `First to build a ${GOAL} tile wins instantly. If a board fills up with no moves, that player is stuck and the other keeps going.`, `If both get stuck, or when the ${LIMIT / 60}-minute clock runs out, the higher score wins.`],
    controls: { p1: '<kbd>W A S D</kbd> or swipe left board', p2: '<kbd>↑ ← ↓ →</kbd> or swipe right board' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    onStart(g) {
      const N = 4; const P = {};
      const split = h('div', { class: 'split' }); g.stage.appendChild(split);
      const size = Math.floor(clamp((Math.min(window.innerWidth, 760) / 2 - 40) / N, 44, 84));
      const BG = { 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' };
      for (const p of [1, 2]) {
        const grid = UI.grid({ rows: N, cols: N, size, gap: 6, cls: 'static' }); const label = h('div', { class: 'muted' });
        split.appendChild(h('div', { class: 'side p' + p }, label, grid.el));
        P[p] = { grid, label, b: range(N).map(() => Array(N).fill(0)), score: 0, stuck: false };
        spawn(p); spawn(p);
        // swipe
        let sx = 0, sy = 0; grid.el.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; }); grid.el.addEventListener('pointerup', (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; move(p, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); });
        grid.el.style.touchAction = 'none';
      }
      function spawn(p) { const b = P[p].b; const free = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!b[r][c]) free.push([r, c]); if (!free.length) return; const [r, c] = pick(free); b[r][c] = Math.random() < 0.9 ? 2 : 4; }
      const draw = (p) => { const { grid, b, label, score, stuck } = P[p]; grid.each((cell, r, c) => { const v = b[r][c]; cell.textContent = v || ''; cell.style.background = v ? BG[v] || '#3c3a32' : 'var(--surface2)'; cell.style.color = v <= 4 ? '#776e65' : '#f9f6f2'; cell.style.fontWeight = 800; cell.style.fontSize = v >= 1000 ? 'calc(var(--cell) * .32)' : v >= 100 ? 'calc(var(--cell) * .4)' : 'calc(var(--cell) * .5)'; }); label.textContent = `${g.name(p)} · ${score}${stuck ? ' · STUCK' : ''}`; g.points(P[1].score, P[2].score); };
      const slideRow = (row) => { const a = row.filter(Boolean); let gain = 0; for (let i = 0; i < a.length - 1; i++) if (a[i] === a[i + 1]) { a[i] *= 2; gain += a[i]; a.splice(i + 1, 1); } while (a.length < N) a.push(0); return { a, gain }; };
      const canMove = (b) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (!b[r][c]) return true; if (c < N - 1 && b[r][c] === b[r][c + 1]) return true; if (r < N - 1 && b[r][c] === b[r + 1][c]) return true; } return false; };
      function move(p, dir) {
        if (g.over || P[p].stuck) return; const st = P[p]; const b = st.b; let moved = false, gain = 0;
        const lines = []; for (let i = 0; i < N; i++) { const line = []; for (let j = 0; j < N; j++) { const [r, c] = dir === 'left' ? [i, j] : dir === 'right' ? [i, N - 1 - j] : dir === 'up' ? [j, i] : [N - 1 - j, i]; line.push([r, c]); } lines.push(line); }
        for (const line of lines) { const vals = line.map(([r, c]) => b[r][c]); const { a, gain: gn } = slideRow(vals); gain += gn; line.forEach(([r, c], k) => { if (b[r][c] !== a[k]) moved = true; b[r][c] = a[k]; }); }
        if (!moved) return; st.score += gain; spawn(p); g.sfx(gain ? 'score' : 'move'); draw(p);
        if (b.flat().some((v) => v >= GOAL)) { return g.win(p, `Built ${GOAL} first · ${st.score} vs ${P[3 - p].score} points.`); }
        if (!canMove(b)) { st.stuck = true; draw(p); g.toast(`${g.name(p)} is stuck!`, 1200); g.sfx('bad'); if (P[3 - p].stuck) { const a = P[1].score, c = P[2].score; if (a === c) return g.draw(`Both stuck at ${a}.`); return g.win(a > c ? 1 : 2, `Both stuck — ${Math.max(a, c)} vs ${Math.min(a, c)} points.`); } }
      }
      const keys = { KeyW: [1, 'up'], KeyS: [1, 'down'], KeyA: [1, 'left'], KeyD: [1, 'right'], ArrowUp: [2, 'up'], ArrowDown: [2, 'down'], ArrowLeft: [2, 'left'], ArrowRight: [2, 'right'] };
      g.key(Object.keys(keys), (c) => move(...keys[c]), { repeat: true });
      draw(1); draw(2); let left = LIMIT; g.status(`Race to ${GOAL} · ${fmtTime(left * 1000)}`);
      g.every(1000, () => { left--; g.status(`Race to ${GOAL} · ${fmtTime(left * 1000)}`); if (left <= 0) { const a = P[1].score, c = P[2].score; if (a === c) return g.draw(`Time up — ${a} points each.`); g.win(a > c ? 1 : 2, `Time up — ${Math.max(a, c)} vs ${Math.min(a, c)} points.`); } });
    },
  });
})();
