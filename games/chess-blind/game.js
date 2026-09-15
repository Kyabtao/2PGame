/* Blind Chess — full FIDE-ish rules on a phantom board: you only ever see your own army. */
(function () {
  const { GLYPH, newState, legalMoves, inCheck, findKing, makeMove, toSan } = globalThis.ChessRules;
  let whiteIs = 1;
  Game.init({
    id: 'chess-blind',
    rules: [
      'Real chess with a chessboard in the mind: the screen shows only the pieces of the side to move. Every enemy move is announced in algebraic notation when it lands.',
      'Selections, captures and check highlights still glow — a capture dot betrays an enemy body without showing what it is.',
      'Checkmate wins; stalemate, the 50-move rule or threefold repetition is a draw. Keep the phantom board in your head — or on paper.',
    ],
    controls: { all: 'Tap your piece, then a highlighted square' },
    onStart(g) {
      const CR = globalThis.ChessRules;
      const wp = whiteIs; const bp = 3 - whiteIs;
      const S = newState();
      let sel = null; let last = null; const history = []; const seen = {};
      const grid = UI.grid({ rows: 8, cols: 8, checker: true, gap: 0, onClick: click });
      grid.el.style.background = '#3a2e22';
      grid.each((cell, r, c) => { cell.style.background = (r + c) % 2 ? '#6b5232' : '#caa674'; cell.style.borderRadius = '0'; cell.style.fontSize = 'calc(var(--cell) * .8)'; });
      const cap = h('div', { class: 'row', style: { fontSize: '.9rem', minHeight: '1.4em' } });
      const log = h('div', { class: 'log', style: { maxWidth: '520px', maxHeight: '70px' } });
      const controls = h('div', { class: 'row' }, h('button', { class: 'btn sm', text: '↶ Undo last half-move', onclick: undo }), h('button', { class: 'btn sm', text: '🏳 Resign', onclick: () => { if (!g.over && confirm(g.name(playerOf(S.turn)) + ' loses the thread and resigns?')) reveal(g.other(playerOf(S.turn)), esc(g.name(playerOf(S.turn))) + ' resigned in the fog.'); } }));
      g.stage.append(cap, grid.el, controls, log);
      const playerOf = (col) => (col === 'w' ? wp : bp);
      let legalCache = null;
      const legal = () => legalCache || (legalCache = legalMoves(S));
      function render() {
        const me = S.turn;
        grid.each((cell, r, c) => {
          const pc = S.b[r][c];
          const mine = pc && pc[0] === me;
          cell.textContent = mine ? GLYPH[pc] : '';
          cell.style.color = pc && pc[0] === 'w' ? '#fff' : '#111';
          cell.style.textShadow = mine && pc[0] === 'w' ? '0 0 3px #000, 0 1px 2px #000' : '0 0 2px #fff8';
          cell.classList.remove('sel', 'dot', 'hl');
          if (last && !g.over && ((last.m.from[0] === r && last.m.from[1] === c) || (last.m.to[0] === r && last.m.to[1] === c))) cell.classList.add('hl');
        });
        if (sel) { grid.at(sel[0], sel[1]).classList.add('sel'); legal().filter((m) => m.from[0] === sel[0] && m.from[1] === sel[1]).forEach((m) => grid.at(m.to[0], m.to[1]).classList.add('dot')); }
        if (inCheck(S, S.turn)) { const k = findKing(S, S.turn); if (k && S.b[k[0]][k[1]][0] === me) grid.at(k[0], k[1]).classList.add('sel'); }
        const movtxt = last ? `${playerOf(S.turn === 'w' ? 'b' : 'w') === 1 ? esc(g.name(1)) : esc(g.name(2))} played ${last.san}${last.cap ? ' — something got eaten' : ''}` : 'no moves yet — the fog is total';
        cap.innerHTML = `${movtxt}`;
        log.innerHTML = history.map((x, i) => (i % 2 === 0 ? `<b>${i / 2 + 1}.</b> ` : '') + x.san).join(' ') || '';
        log.scrollTop = 1e6;
        g.turn(playerOf(S.turn), `<span class="pc${playerOf(S.turn)}">${esc(g.name(playerOf(S.turn)))}</span> (${S.turn === 'w' ? 'White' : 'Black'}) to move${inCheck(S, S.turn) ? ' — <b style="color:var(--gold)">check!</b>' : ''}`);
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
        g.modal({ title: 'Promote to', body: () => { const row = h('div', { class: 'row' }); ['Q', 'R', 'B', 'N'].forEach((p) => row.appendChild(h('button', { class: 'btn big', text: GLYPH[col + p], onclick: () => { g.closeOverlay(); play(ms.find((m) => m.promo === p)); } }))); return row; } });
      }
      function undo() {
        if (g.over || !history.length) return;
        const hst = history.pop();
        Object.assign(S, hst.prev); S.b = hst.prev.b.map((row) => row.slice());
        seen[CR.key(S)]--;
        last = history.length ? history[history.length - 1] : null;
        sel = null; legalCache = null; render();
      }
      function play(m) {
        const prev = { b: S.b.map((row) => row.slice()), turn: S.turn, castle: Object.assign({}, S.castle), ep: S.ep, half: S.half, full: S.full };
        const san = toSan(S, m, legal());
        const target = S.b[m.to[0]][m.to[1]];
        makeMove(S, m);
        legalCache = null;
        g.sfx(target || m.ep ? 'capture' : 'move');
        last = { san, cap: !!(target || m.ep), m }; sel = null;
        const k = CR.key(S); seen[k] = (seen[k] || 0) + 1;
        const L = legal();
        const check = inCheck(S, S.turn);
        history.push({ san: san + (!L.length && check ? '#' : L.length && check ? '+' : ''), m, prev });
        render();
        const mover = playerOf(prev.turn);
        if (!L.length) { if (check) return reveal(mover, 'Checkmate on the phantom board.'); return reveal(0, 'Stalemate — both minds saw the trap.'); }
        if (S.half >= 100) return reveal(0, 'Fifty quiet moves: the fog lifts on a draw.');
        if (seen[k] >= 3) return reveal(0, 'Threefold repetition through closed eyes.');
        if (CR.insufficient(S)) return reveal(0, 'Insufficient mating material.');
        if (history.length >= 60) {
          const m = CR.material(S) * (wp === 1 ? 1 : -1);
          if (!m) return reveal(0, 'Sixty foggy half-moves, material level — judges call it a draw.');
          return reveal(m > 0 ? 1 : 2, 'Sixty foggy half-moves — the material count decides it.');
        }
      }
      function reveal(winner, why) {
        g.turn();
        grid.each((cell, r, c) => { const pc = S.b[r][c]; cell.textContent = pc ? GLYPH[pc] : ''; cell.style.color = pc && pc[0] === 'w' ? '#fff' : '#111'; });
        if (!winner) return g.draw(`${why} The full board is revealed below.`);
        g.win(winner, `${why} ${esc(g.name(winner))} saw it all.`);
        whiteIs = 3 - whiteIs;
      }
      render();
    },
    onStop() { whiteIs = 3 - whiteIs; },
  });
})();
