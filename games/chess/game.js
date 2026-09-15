/* Chess — full legal move generation, castling, en passant, promotion, mate/stalemate, 50-move, repetition. */
(function () {
  const { GLYPH, newState, legalMoves, inCheck, findKing, makeMove, key, material, insufficient, toSan } = globalThis.ChessRules;
  let whiteIs = 1;
  Game.init({
    id: 'chess',
    rules: ['Standard chess. Player 1 starts as White, colours swap each round.', 'Legal moves are highlighted; the king can never be left in check. Castling, en passant and promotion (choose a piece) are supported.', 'Checkmate wins. Stalemate, 50 quiet moves, threefold repetition or insufficient material is a draw. You may also resign or agree a draw from the buttons.'],
    controls: { all: 'Click / tap a piece, then a highlighted square' },
    onStart(g) {
      const wp = whiteIs; const bp = 3 - whiteIs;
      const S = newState();
      let sel = null; let last = null; const history = []; const seen = {};
      const grid = UI.grid({ rows: 8, cols: 8, checker: true, gap: 0, onClick: click });
      grid.el.style.background = '#3a2e22';
      grid.each((cell, r, c) => { cell.classList.toggle('dark', (r + c) % 2 === 1); cell.classList.toggle('light', (r + c) % 2 === 0); cell.style.background = (r + c) % 2 ? '#7a5a3a' : '#e8d3ac'; cell.style.borderRadius = '0'; cell.style.fontSize = 'calc(var(--cell) * .8)'; });
      const cap = h('div', { class: 'row', style: { fontSize: '1.1rem', minHeight: '1.4em' } });
      const controls = h('div', { class: 'row' },
        h('button', { class: 'btn sm', text: '🏳️ Resign', onclick: () => { if (!g.over && confirm(`${g.name(playerOf(S.turn))} resigns?`)) g.win(g.other(playerOf(S.turn)), `${esc(g.name(playerOf(S.turn)))} resigned.`); } }),
        h('button', { class: 'btn sm', text: '🤝 Offer draw', onclick: () => { if (!g.over && confirm('Both players agree to a draw?')) g.draw('Draw by agreement.'); } }),
        h('button', { class: 'btn sm', text: '↶ Undo', onclick: undo }));
      const moveList = h('div', { class: 'log', style: { maxWidth: '520px', maxHeight: '90px' } });
      g.stage.append(grid.el, cap, controls, moveList);
      const playerOf = (col) => col === 'w' ? wp : bp;
      const colorName = (col) => col === 'w' ? 'White' : 'Black';
      let legalCache = null;
      const legal = () => legalCache || (legalCache = legalMoves(S));
      function render() {
        grid.each((cell, r, c) => {
          const pc = S.b[r][c];
          cell.textContent = pc ? GLYPH[pc] : '';
          cell.style.color = pc && pc[0] === 'w' ? '#fff' : '#111';
          cell.style.textShadow = pc && pc[0] === 'w' ? '0 0 3px #000, 0 1px 2px #000' : '0 0 2px #fff8';
          cell.classList.remove('sel', 'dot', 'hl', 'win');
          if (last && ((last.from[0] === r && last.from[1] === c) || (last.to[0] === r && last.to[1] === c))) cell.classList.add('hl');
        });
        if (sel) { grid.at(sel[0], sel[1]).classList.add('sel'); legal().filter((m) => m.from[0] === sel[0] && m.from[1] === sel[1]).forEach((m) => grid.at(m.to[0], m.to[1]).classList.add('dot')); }
        if (inCheck(S, S.turn)) { const k = findKing(S, S.turn); if (k) grid.at(k[0], k[1]).classList.add('win'); }
        const mat = material(S);
        cap.innerHTML = `<span class="pc${wp}">${esc(g.name(wp))} ♔ White</span> <span class="muted">${mat > 0 ? '+' + mat : ''}</span> &nbsp; <span class="pc${bp}">${esc(g.name(bp))} ♚ Black</span> <span class="muted">${mat < 0 ? '+' + -mat : ''}</span>`;
        moveList.innerHTML = history.map((x, i) => (i % 2 === 0 ? `<b>${i / 2 + 1}.</b> ` : '') + x.san).join(' ') || '<span class="muted">Moves appear here</span>';
        moveList.scrollTop = 1e6;
        const chk = inCheck(S, S.turn) ? ' — <b style="color:var(--gold)">check!</b>' : '';
        g.turn(playerOf(S.turn), `<span class="pc${playerOf(S.turn)}">${esc(g.name(playerOf(S.turn)))}</span> (${colorName(S.turn)}) to move${chk}`);
      }
      function click(r, c) {
        if (g.over) return;
        const pc = S.b[r][c];
        if (sel) {
          const ms = legal().filter((m) => m.from[0] === sel[0] && m.from[1] === sel[1] && m.to[0] === r && m.to[1] === c);
          if (ms.length) { if (ms[0].promo) return choosePromo(ms); return play(ms[0]); }
        }
        if (pc && pc[0] === S.turn) { sel = [r, c]; g.sfx('click'); } else sel = null;
        render();
      }
      function choosePromo(ms) {
        const col = S.turn;
        g.modal({ title: 'Promote to', body: (el) => { const row = h('div', { class: 'row' }); ['Q', 'R', 'B', 'N'].forEach((p) => row.appendChild(h('button', { class: 'btn big', text: GLYPH[col + p], onclick: () => { g.closeOverlay(); play(ms.find((m) => m.promo === p)); } }))); return row; } });
      }
      function undo() {
        if (g.over || history.length === 0) return;
        const hst = history.pop();
        Object.assign(S, hst.prev); S.b = hst.prev.b.map((row) => row.slice());
        seen[key(S)]--;
        last = history.length ? history[history.length - 1].m : null; sel = null; legalCache = null; render();
      }
      function play(m) {
        const prev = { b: S.b.map((row) => row.slice()), turn: S.turn, castle: Object.assign({}, S.castle), ep: S.ep, half: S.half, full: S.full };
        const san = toSan(S, m, legal());
        makeMove(S, m);
        legalCache = null;
        const capture = san.includes('x');
        g.sfx(capture ? 'capture' : 'move');
        last = m; sel = null;
        const k = key(S); seen[k] = (seen[k] || 0) + 1;
        const L = legal();
        const check = inCheck(S, S.turn);
        history.push({ san: san + (L.length === 0 ? (check ? '#' : '') : (check ? '+' : '')), m, prev });
        render();
        const mover = playerOf(prev.turn);
        if (!L.length) { if (check) return g.win(mover, `Checkmate in ${Math.ceil(history.length / 2)} moves.`); return g.draw('Stalemate.'); }
        if (S.half >= 100) return g.draw('Fifty-move rule.');
        if (seen[k] >= 3) return g.draw('Threefold repetition.');
        if (insufficient(S)) return g.draw('Insufficient material.');
        if (check) g.sfx('hit');
      }
      render();
    },
    onStop() { whiteIs = 3 - whiteIs; },
  });

})();
