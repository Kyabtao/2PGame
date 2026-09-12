/* Sliding Puzzle Race — identical scrambled 3×3 (or 4×4) 15-puzzles; first to solve wins. */
(function () {
  Game.init({
    id: 'sliding-puzzle-race',
    rules: ['Both players get the same scrambled sliding puzzle. Slide tiles into the empty space to restore 1 → 8 (or 1 → 15) order.', 'Tap a tile next to the gap or use your keys to slide. Toggle 3×3 / 4×4 before starting.', 'First to solve wins the round; best of 3.'],
    controls: { all: 'Tap tiles · P1 <kbd>W A S D</kbd> (slide tile into the gap from that direction) · P2 arrows' },
    points: true,
    onStart(g) {
      let N = Store.settings().slideN || 3; const score = { 1: 0, 2: 0 }; let round = 0, live = false; let P = {};
      const sizeBtn = h('button', { class: 'btn sm', text: `Size: ${N}×${N}`, onclick: () => { N = N === 3 ? 4 : 3; Store.setSettings({ slideN: N }); sizeBtn.textContent = `Size: ${N}×${N}`; start(true); } });
      const split = h('div', { class: 'split' }); g.stage.append(h('div', { class: 'row' }, sizeBtn), split);
      const solvedArr = () => [...range(N * N - 1).map((i) => i + 1), 0];
      const scramble = () => { const a = solvedArr(); let gap = N * N - 1; let last = -1; for (let k = 0; k < 60 * N; k++) { const opts = []; const r = Math.floor(gap / N), c = gap % N; if (r > 0) opts.push(gap - N); if (r < N - 1) opts.push(gap + N); if (c > 0) opts.push(gap - 1); if (c < N - 1) opts.push(gap + 1); const pickI = pick(opts.filter((o) => o !== last)); a[gap] = a[pickI]; a[pickI] = 0; last = gap; gap = pickI; } return a; };
      const size = Math.floor(clamp((Math.min(window.innerWidth, 760) / 2 - 40) / N, 34, 80));
      const draw = (p) => { const b = P[p]; b.arr.forEach((v, i) => { const cell = b.grid.at(Math.floor(i / N), i % N); cell.textContent = v || ''; cell.style.background = v ? (v === i + 1 ? 'color-mix(in srgb, var(--p' + p + ') 40%, var(--surface2))' : 'var(--surface2)') : 'transparent'; cell.style.fontWeight = 800; cell.style.fontSize = 'calc(var(--cell) * .45)'; }); b.label.textContent = `${g.name(p)} · ${b.moves} moves`; };
      const slide = (p, i) => { if (!live || g.over) return; const b = P[p]; const gap = b.arr.indexOf(0); const r = Math.floor(i / N), c = i % N, gr = Math.floor(gap / N), gc = gap % N; if (Math.abs(r - gr) + Math.abs(c - gc) !== 1) return; b.arr[gap] = b.arr[i]; b.arr[i] = 0; b.moves++; g.sfx('move'); draw(p); if (b.arr.every((v, k) => v === solvedArr()[k])) solved(p); };
      const build = () => { split.innerHTML = ''; const arr = scramble(); P = {}; for (const p of [1, 2]) { const grid = UI.grid({ rows: N, cols: N, size, gap: 4, onClick: (r, c) => slide(p, r * N + c) }); const label = h('div', { class: 'muted' }); split.appendChild(h('div', { class: 'side p' + p }, label, grid.el)); P[p] = { grid, label, arr: arr.slice(), moves: 0 }; draw(p); } };
      // key: move the tile that is in direction D from the gap into the gap (i.e. gap moves toward D)
      const keys = { KeyW: [1, -1, 0], KeyS: [1, 1, 0], KeyA: [1, 0, -1], KeyD: [1, 0, 1], ArrowUp: [2, -1, 0], ArrowDown: [2, 1, 0], ArrowLeft: [2, 0, -1], ArrowRight: [2, 0, 1] };
      g.key(Object.keys(keys), (code) => { const [p, dr, dc] = keys[code]; if (!P[p]) return; const gap = P[p].arr.indexOf(0); const r = Math.floor(gap / N) - dr, c = gap % N - dc; if (r < 0 || r >= N || c < 0 || c >= N) return; slide(p, r * N + c); }, { repeat: true });
      function solved(p) {
        live = false; score[p]++; g.points(score[1], score[2]); g.sfx('win'); P[p].grid.each((cell) => cell.classList.add('win'));
        if (score[p] >= 2) return g.win(p, `${score[p]} – ${score[3 - p]} puzzles (${N}×${N}); last solved in ${P[p].moves} moves.`);
        g.toast(`${g.name(p)} solves it in ${P[p].moves} moves!`, 1500); g.after(1800, () => start());
      }
      async function start(reset) { if (g.over) return; if (reset) { score[1] = score[2] = 0; round = 0; g.points(0, 0); } round++; live = false; build(); g.status(`Puzzle ${round} · ${N}×${N} · best of 3`); await g.countdown(3); live = true; }
      g.points(0, 0); start();
    },
  });
})();
