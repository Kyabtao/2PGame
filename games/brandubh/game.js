/* Brandubh — 7×7 tafl. King + 4 defenders vs 8 attackers. Custodial capture, corners escape. */
(function () {
  const N = 7;
  let attackerIs = 2;
  Game.init({
    id: 'brandubh',
    rules: ['Defenders (king + 4) start in the centre cross; 8 attackers surround them. Attackers move first.', 'All pieces move like rooks (any distance orthogonally). Only the king may stand on the centre throne or the four corners.', 'Capture by sandwiching an enemy piece between two of yours (or one of yours and a corner/empty throne). The king is captured the same way.', 'Defenders win when the king reaches a corner. Attackers win by capturing the king.'],
    controls: { all: 'Click / tap a piece, then a highlighted square' },
    onStart(g) {
      const A = attackerIs, D = 3 - attackerIs;
      // 0 empty, 1 attacker, 2 defender, 3 king
      const b = range(N).map(() => Array(N).fill(0));
      [[0, 3], [1, 3], [3, 0], [3, 1], [3, 5], [3, 6], [5, 3], [6, 3]].forEach(([r, c]) => { b[r][c] = 1; });
      [[2, 3], [4, 3], [3, 2], [3, 4]].forEach(([r, c]) => { b[r][c] = 2; });
      b[3][3] = 3;
      let turn = A, sel = null;
      const grid = UI.grid({ rows: N, cols: N, gap: 2, onClick: click });
      const special = (r, c) => (r === 3 && c === 3) || ((r === 0 || r === N - 1) && (c === 0 || c === N - 1));
      grid.each((cell, r, c) => { if (special(r, c)) { cell.style.background = '#3b2a5a'; cell.textContent = r === 3 ? '♜' : '⚑'; cell.style.color = '#ffffff55'; } });
      g.stage.appendChild(grid.el);
      g.stage.appendChild(h('div', { class: 'muted' }, `${g.name(A)} attacks (⚫) · ${g.name(D)} defends (⚪ + 👑)`));
      const side = (v) => v === 1 ? A : v ? D : 0;
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const movesOf = (r, c) => { const v = b[r][c]; const out = []; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let rr = r + dr, cc = c + dc; while (inb(rr, cc) && !b[rr][cc]) { if (!special(rr, cc) || v === 3) out.push([rr, cc]); rr += dr; cc += dc; } } return out; };
      const hostile = (r, c, me) => !inb(r, c) ? false : (b[r][c] && side(b[r][c]) === me) || (special(r, c) && b[r][c] !== 3 && !(b[r][c]));
      function render() {
        grid.each((cell, r, c) => {
          const keep = special(r, c) ? cell.textContent.replace(/[^♜⚑]/g, '') : '';
          cell.innerHTML = ''; cell.classList.remove('sel', 'dot');
          if (special(r, c) && !b[r][c]) cell.textContent = keep;
          const v = b[r][c];
          if (v) cell.appendChild(h('div', { class: 'piece p' + side(v), style: { background: v === 1 ? '#222' : '#f1f1f1', color: '#000', outline: `3px solid ${g.color(side(v))}` } }, v === 3 ? '👑' : ''));
        });
        if (sel) { grid.at(sel[0], sel[1]).classList.add('sel'); movesOf(sel[0], sel[1]).forEach(([r, c]) => grid.at(r, c).classList.add('dot')); }
      }
      function click(r, c) {
        if (g.over) return;
        if (sel && movesOf(sel[0], sel[1]).some(([rr, cc]) => rr === r && cc === c)) {
          const v = b[sel[0]][sel[1]]; b[sel[0]][sel[1]] = 0; b[r][c] = v; sel = null; g.sfx('move');
          // captures
          let caps = 0;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
            if (!inb(r1, c1) || !b[r1][c1] || side(b[r1][c1]) === turn) continue;
            if (b[r1][c1] === 3) {
              // king captured if surrounded on all 4 sides by attackers / hostile squares (2 sides if on edge? keep simple: 4 sides, edges count as hostile)
              const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([er, ec]) => { const rr = r1 + er, cc = c1 + ec; return !inb(rr, cc) || hostile(rr, cc, turn); });
              if (sides && turn === A) { render(); attackerIs = 3 - attackerIs; return g.win(A, 'The king has been captured!'); }
              continue;
            }
            if (hostile(r2, c2, turn)) { b[r1][c1] = 0; caps++; }
          }
          if (caps) g.sfx('capture');
          if (v === 3 && (r === 0 || r === N - 1) && (c === 0 || c === N - 1)) { render(); attackerIs = 3 - attackerIs; return g.win(D, 'The king escaped to a corner!'); }
          turn = 3 - turn; render();
          const any = b.some((row, rr) => row.some((val, cc) => val && side(val) === turn && movesOf(rr, cc).length));
          if (!any) { attackerIs = 3 - attackerIs; return g.win(3 - turn, `${esc(g.name(turn))} has no legal moves.`); }
          g.turn(turn); return;
        }
        if (b[r][c] && side(b[r][c]) === turn) { sel = [r, c]; g.sfx('click'); } else sel = null;
        render();
      }
      render(); g.turn(turn);
    },
  });
})();
