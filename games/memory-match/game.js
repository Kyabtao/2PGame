/* Memory Match — 6×6 emoji pairs, match keeps turn. */
(function () {
  const EMO = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🥝', '🍍', '🥑', '🌽', '🍄', '🥕', '🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐵', '🐧', '🦄', '🐙', '🦋', '🐢'];
  let starter = 1;
  Game.init({
    id: 'memory-match',
    rules: ['36 cards face down in 18 pairs. Flip two cards on your turn.', 'Match them and you keep the pair and go again; otherwise they flip back and the turn passes.', 'Most pairs when the board is cleared wins.'],
    controls: { all: 'Tap / click cards' },
    points: true,
    onStart(g) {
      const N = 6; const pool = shuffle(EMO).slice(0, N * N / 2); const cards = shuffle([...pool, ...pool]);
      const pairs = { 1: 0, 2: 0 }; let turn = starter, open = [], lock = false; const found = new Set();
      const grid = UI.grid({ rows: N, cols: N, size: Math.floor(clamp((Math.min(window.innerWidth, 560) - 40) / N, 44, 80)), gap: 6, onClick: (r, c, cell) => flip(r * N + c, cell) });
      grid.each((cell) => { cell.classList.add('tile'); cell.style.fontSize = 'calc(var(--cell) * .6)'; cell.style.background = 'var(--surface2)'; cell.textContent = '❔'; cell.style.color = 'var(--muted)'; });
      g.stage.appendChild(grid.el);
      const status = () => g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${18 - found.size / 2} pairs left`);
      status(); g.points(0, 0);
      function flip(i, cell) {
        if (lock || g.over || found.has(i) || open.some((o) => o.i === i)) return;
        cell.textContent = cards[i]; cell.style.color = ''; cell.style.background = 'var(--surface)'; cell.classList.add('flash'); g.sfx('click');
        open.push({ i, cell });
        if (open.length < 2) return;
        lock = true;
        const [a, b] = open;
        if (cards[a.i] === cards[b.i]) {
          found.add(a.i); found.add(b.i); pairs[turn]++; g.points(pairs[1], pairs[2]); g.sfx('score');
          [a, b].forEach((o) => { o.cell.classList.add('static'); o.cell.style.background = `color-mix(in srgb, ${g.color(turn)} 35%, var(--surface))`; });
          open = []; lock = false;
          if (found.size === N * N) { starter = 3 - starter; if (pairs[1] === pairs[2]) return g.draw('9 pairs each.'); return g.win(pairs[1] > pairs[2] ? 1 : 2, `${Math.max(pairs[1], pairs[2])} pairs to ${Math.min(pairs[1], pairs[2])}.`); }
          status(); return;
        }
        g.sfx('bad');
        g.after(900, () => { [a, b].forEach((o) => { o.cell.textContent = '❔'; o.cell.style.color = 'var(--muted)'; o.cell.style.background = 'var(--surface2)'; o.cell.classList.remove('flash'); }); open = []; lock = false; turn = 3 - turn; status(); });
      }
    },
  });
})();
