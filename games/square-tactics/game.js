/* Square Tactics — place 1×1 to 4×4 blocks with a clear margin; last player able to move wins. */
(function () {
  const N = 8, SIZES = [1, 2, 3, 4];
  let starter = 1;
  Game.init({
    id: 'square-tactics',
    rules: [
      `On your turn lay one square block — size 1×1, 2×2, 3×3 or 4×4 — anywhere on the ${N}×${N} field.`,
      'Blocks may not overlap and may not touch another block edge-to-edge (corner touching is fine).',
      'No size fits anywhere? You lose. Bigger blocks squeeze the board faster but box you in too.',
    ],
    controls: { all: 'Pick a size, then tap the top-left square of the block' },
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      let turn = starter, size = 1, placed = { 1: 0, 2: 0 };
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: click });
      const bar = h('div', { class: 'row' });
      const chips = UI.chips([], { cls: 'row' });
      bar.appendChild(chips.el);
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, bar, note);
      const fits = (r, c, s, p) => {
        if (r + s > N || c + s > N) return false;
        for (let rr = r - 1; rr <= r + s; rr++) for (let cc = c - 1; cc <= c + s; cc++) {
          if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
          const inside = rr >= r && rr < r + s && cc >= c && cc < c + s;
          if (b[rr][cc] && inside) return false;             // overlap
          if (b[rr][cc] && !inside && (rr === r - 1 || rr === r + s) && cc >= c && cc < c + s) return false; // edge touch
          if (b[rr][cc] && !inside && (cc === c - 1 || cc === c + s) && rr >= r && rr < r + s) return false;
        }
        return true;
      };
      const anyMove = (p) => { for (let s = 1; s <= 4; s++) for (let r = 0; r + s <= N; r++) for (let c = 0; c + s <= N; c++) if (fits(r, c, s, p)) return true; return false; };
      const canFitHere = (r, c) => fits(r, c, size, turn);
      function render() {
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          if (b[r][c]) { cell.style.background = `color-mix(in srgb, ${g.color(b[r][c])} 65%, #101425)`; cell.classList.add('static'); }
          else { cell.style.background = 'var(--surface2)'; if (canFitHere(r, c)) cell.classList.add('dot'); }
        });
        chips.set(SIZES.map((s) => ({ label: `${s}×${s}`, on: s === size, onClick: () => { size = s; render(); } })));
        note.textContent = `blocks laid ${placed[1]} vs ${placed[2]} · ${anyMove(turn) ? 'moves available' : 'no fit!'}`;
      }
      function click(r, c) {
        if (g.over) return;
        if (!fits(r, c, size, turn)) { g.sfx('bad'); g.toast('That square does not fit', 700); return; }
        for (let rr = r; rr < r + size; rr++) for (let cc = c; cc < c + size; cc++) b[rr][cc] = turn;
        placed[turn]++; g.sfx(size >= 3 ? 'capture' : 'move');
        render();
        turn = 3 - turn;
        if (!anyMove(turn)) { starter = 3 - starter; return g.win(3 - turn, `${esc(g.name(turn))} has no room left for any block.`); }
        g.turn(turn); render();
      }
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4'], (code) => { size = +code.slice(5); render(); });
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
