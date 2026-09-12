/* Chess — full legal move generation, castling, en passant, promotion, mate/stalemate, 50-move, repetition. */
(function () {
  const GLYPH = { wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙', bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟' };
  const FILES = 'abcdefgh';
  const VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
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

  /* ---------- engine ---------- */
  function newState() {
    const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    const b = range(8).map(() => Array(8).fill(null));
    for (let c = 0; c < 8; c++) { b[0][c] = 'b' + back[c]; b[1][c] = 'bP'; b[6][c] = 'wP'; b[7][c] = 'w' + back[c]; }
    return { b, turn: 'w', castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: null, half: 0, full: 1 };
  }
  const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  function pseudo(S, col) {
    const out = []; const b = S.b; const dir = col === 'w' ? -1 : 1; const home = col === 'w' ? 6 : 1; const promoRow = col === 'w' ? 0 : 7;
    const add = (fr, fc, tr, tc, extra) => { const m = Object.assign({ from: [fr, fc], to: [tr, tc] }, extra || {}); if (tr === promoRow && b[fr][fc][1] === 'P') ['Q', 'R', 'B', 'N'].forEach((p) => out.push(Object.assign({}, m, { promo: p }))); else out.push(m); };
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const pc = b[r][c]; if (!pc || pc[0] !== col) continue; const t = pc[1];
      if (t === 'P') {
        if (inb(r + dir, c) && !b[r + dir][c]) { add(r, c, r + dir, c); if (r === home && !b[r + 2 * dir][c]) add(r, c, r + 2 * dir, c, { dbl: true }); }
        for (const dc of [-1, 1]) { const tr = r + dir, tc = c + dc; if (!inb(tr, tc)) continue; if (b[tr][tc] && b[tr][tc][0] !== col) add(r, c, tr, tc); else if (S.ep && S.ep[0] === tr && S.ep[1] === tc) add(r, c, tr, tc, { ep: true }); }
      } else if (t === 'N' || t === 'K') {
        const ds = t === 'N' ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of ds) { const tr = r + dr, tc = c + dc; if (inb(tr, tc) && (!b[tr][tc] || b[tr][tc][0] !== col)) add(r, c, tr, tc); }
        if (t === 'K') {
          const row = col === 'w' ? 7 : 0;
          if (r === row && c === 4) {
            if (S.castle[col + 'K'] && !b[row][5] && !b[row][6] && b[row][7] === col + 'R' && !attacked(S, row, 4, col) && !attacked(S, row, 5, col) && !attacked(S, row, 6, col)) add(r, c, row, 6, { castle: 'K' });
            if (S.castle[col + 'Q'] && !b[row][3] && !b[row][2] && !b[row][1] && b[row][0] === col + 'R' && !attacked(S, row, 4, col) && !attacked(S, row, 3, col) && !attacked(S, row, 2, col)) add(r, c, row, 2, { castle: 'Q' });
          }
        }
      } else {
        const ds = t === 'R' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : t === 'B' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of ds) { let tr = r + dr, tc = c + dc; while (inb(tr, tc)) { if (b[tr][tc]) { if (b[tr][tc][0] !== col) add(r, c, tr, tc); break; } add(r, c, tr, tc); tr += dr; tc += dc; } }
      }
    }
    return out;
  }
  function attacked(S, r, c, col) {
    // is square (r,c) attacked by the enemy of col?
    const b = S.b; const en = col === 'w' ? 'b' : 'w'; const dir = col === 'w' ? -1 : 1;
    for (const dc of [-1, 1]) { const rr = r + dir, cc = c + dc; if (inb(rr, cc) && b[rr][cc] === en + 'P') return true; }
    for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) { const rr = r + dr, cc = c + dc; if (inb(rr, cc) && b[rr][cc] === en + 'N') return true; }
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      let rr = r + dr, cc = c + dc, first = true;
      while (inb(rr, cc)) {
        const pc = b[rr][cc];
        if (pc) { if (pc[0] === en) { const t = pc[1]; const diag = dr && dc; if (t === 'Q' || (t === 'K' && first) || (diag && t === 'B') || (!diag && t === 'R')) return true; } break; }
        rr += dr; cc += dc; first = false;
      }
    }
    return false;
  }
  function findKing(S, col) { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (S.b[r][c] === col + 'K') return [r, c]; return null; }
  function inCheck(S, col) { const k = findKing(S, col); return k ? attacked(S, k[0], k[1], col) : false; }
  function makeMove(S, m) {
    const b = S.b; const pc = b[m.from[0]][m.from[1]]; const col = pc[0]; const target = b[m.to[0]][m.to[1]];
    b[m.from[0]][m.from[1]] = null; b[m.to[0]][m.to[1]] = m.promo ? col + m.promo : pc;
    if (m.ep) b[m.from[0]][m.to[1]] = null;
    if (m.castle === 'K') { b[m.to[0]][5] = b[m.to[0]][7]; b[m.to[0]][7] = null; }
    if (m.castle === 'Q') { b[m.to[0]][3] = b[m.to[0]][0]; b[m.to[0]][0] = null; }
    if (pc[1] === 'K') { S.castle[col + 'K'] = false; S.castle[col + 'Q'] = false; }
    if (pc[1] === 'R') { if (m.from[1] === 0) S.castle[col + 'Q'] = false; if (m.from[1] === 7) S.castle[col + 'K'] = false; }
    if (target && target[1] === 'R') { const oc = target[0]; if (m.to[1] === 0) S.castle[oc + 'Q'] = false; if (m.to[1] === 7) S.castle[oc + 'K'] = false; }
    S.ep = m.dbl ? [(m.from[0] + m.to[0]) / 2, m.from[1]] : null;
    S.half = (pc[1] === 'P' || target) ? 0 : S.half + 1;
    if (col === 'b') S.full++;
    S.turn = col === 'w' ? 'b' : 'w';
  }
  function legalMoves(S) {
    return pseudo(S, S.turn).filter((m) => { const T = { b: S.b.map((r) => r.slice()), turn: S.turn, castle: Object.assign({}, S.castle), ep: S.ep, half: 0, full: 0 }; makeMove(T, m); return !inCheck(T, S.turn); });
  }
  function key(S) { return S.b.map((r) => r.map((x) => x || '.').join('')).join('/') + S.turn + Object.values(S.castle).map((x) => +x).join('') + (S.ep ? S.ep.join('') : '-'); }
  function material(S) { let m = 0; S.b.forEach((row) => row.forEach((pc) => { if (pc) m += (pc[0] === 'w' ? 1 : -1) * VAL[pc[1]]; })); return m; }
  function insufficient(S) {
    const pcs = []; S.b.forEach((row, r) => row.forEach((pc, c) => { if (pc && pc[1] !== 'K') pcs.push({ pc, sq: (r + c) % 2 }); }));
    if (!pcs.length) return true;
    if (pcs.length === 1 && (pcs[0].pc[1] === 'B' || pcs[0].pc[1] === 'N')) return true;
    if (pcs.every((x) => x.pc[1] === 'B') && pcs.every((x) => x.sq === pcs[0].sq)) return true;
    return false;
  }
  function toSan(S, m, L) {
    const pc = S.b[m.from[0]][m.from[1]]; const t = pc[1]; const dst = FILES[m.to[1]] + (8 - m.to[0]);
    if (m.castle) return m.castle === 'K' ? 'O-O' : 'O-O-O';
    const capture = !!S.b[m.to[0]][m.to[1]] || m.ep;
    if (t === 'P') return (capture ? FILES[m.from[1]] + 'x' : '') + dst + (m.promo ? '=' + m.promo : '');
    const others = L.filter((x) => x !== m && S.b[x.from[0]][x.from[1]] === pc && x.to[0] === m.to[0] && x.to[1] === m.to[1]);
    let dis = '';
    if (others.length) { if (!others.some((x) => x.from[1] === m.from[1])) dis = FILES[m.from[1]]; else if (!others.some((x) => x.from[0] === m.from[0])) dis = String(8 - m.from[0]); else dis = FILES[m.from[1]] + (8 - m.from[0]); }
    return t + dis + (capture ? 'x' : '') + dst;
  }
})();
