/* Lights Out Race — identical 5×5 puzzles side by side; first to switch all lights off wins. */
(function () {
  Game.init({
    id: 'lights-out-race',
    rules: ['Both players get the same 5×5 puzzle. Tapping a light toggles it and its four neighbours.', 'Race to turn every light off. Every puzzle is generated solvable.', 'Fewest moves breaks nothing — speed is all that counts. Best of 3 puzzles.'],
    controls: { all: 'Tap / click your board · P1 <kbd>W A S D</kbd> + <kbd>E</kbd> · P2 arrows + <kbd>/</kbd>' },
    points: true,
    onStart(g) {
      const N = 5; const score = { 1: 0, 2: 0 }; let round = 0; let boards = {}; let moves = { 1: 0, 2: 0 }; let cursors = { 1: [2, 2], 2: [2, 2] }; let live = false;
      const split = h('div', { class: 'split' }); g.stage.appendChild(split);
      const size = Math.floor(clamp((Math.min(window.innerWidth, 720) / 2 - 40) / N, 30, 60));
      const gen = () => { const b = range(N).map(() => Array(N).fill(false)); for (let k = 0; k < 8; k++) toggle(b, rnd(N), rnd(N)); if (!b.flat().some(Boolean)) toggle(b, 2, 2); return b; };
      const toggle = (b, r, c) => { [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) b[rr][cc] = !b[rr][cc]; }); };
      const draw = (p) => { const b = boards[p]; b.grid.each((cell, r, c) => { cell.style.background = b.state[r][c] ? '#ffd43b' : 'var(--surface2)'; cell.style.boxShadow = b.state[r][c] ? '0 0 12px #ffd43b88' : 'none'; cell.classList.toggle('hl', cursors[p][0] === r && cursors[p][1] === c); }); b.label.textContent = `${g.name(p)} · ${moves[p]} moves · ${b.state.flat().filter(Boolean).length} on`; };
      const press = (p, r, c) => { if (!live || g.over) return; toggle(boards[p].state, r, c); moves[p]++; g.sfx('click'); cursors[p] = [r, c]; draw(p); if (!boards[p].state.flat().some(Boolean)) solved(p); };
      const build = () => {
        split.innerHTML = ''; const puzzle = gen(); boards = {};
        for (const p of [1, 2]) { const grid = UI.grid({ rows: N, cols: N, size, gap: 4, onClick: (r, c) => press(p, r, c) }); const label = h('div', { class: 'muted' }); split.appendChild(h('div', { class: 'side p' + p }, label, grid.el)); boards[p] = { grid, label, state: puzzle.map((row) => row.slice()) }; draw(p); }
      };
      const keys = { KeyW: [1, -1, 0], KeyS: [1, 1, 0], KeyA: [1, 0, -1], KeyD: [1, 0, 1], ArrowUp: [2, -1, 0], ArrowDown: [2, 1, 0], ArrowLeft: [2, 0, -1], ArrowRight: [2, 0, 1] };
      g.key(Object.keys(keys), (code) => { const [p, dr, dc] = keys[code]; cursors[p] = [clamp(cursors[p][0] + dr, 0, N - 1), clamp(cursors[p][1] + dc, 0, N - 1)]; draw(p); }, { repeat: true });
      g.key(['KeyE', 'Slash'], (code) => { const p = code === 'KeyE' ? 1 : 2; press(p, cursors[p][0], cursors[p][1]); });
      function solved(p) {
        live = false; score[p]++; g.points(score[1], score[2]); g.sfx('win'); boards[p].grid.each((cell) => cell.classList.add('win'));
        if (score[p] >= 2) return g.win(p, `${score[p]} – ${score[3 - p]} puzzles; last one in ${moves[p]} moves.`);
        g.toast(`${g.name(p)} clears it in ${moves[p]} moves!`, 1500); g.after(1800, start);
      }
      async function start() { if (g.over) return; round++; moves = { 1: 0, 2: 0 }; cursors = { 1: [2, 2], 2: [2, 2] }; build(); g.status(`Puzzle ${round} of 3 · best of 3`); await g.countdown(3); live = true; }
      g.points(0, 0); start();
    },
  });
})();
