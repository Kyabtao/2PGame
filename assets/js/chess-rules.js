/* chess-rules.js — shared full-rules chess engine for the chess family (chess, chess-blind).
   Loaded as a library via the manifest `libs` entry; exposes window.ChessRules. */
(function (global) {
  'use strict';
  const GLYPH = { wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙', bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟' };
  const FILES = 'abcdefgh';
  const VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
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

  global.ChessRules = { GLYPH, FILES, VAL, newState, inb, pseudo, attacked, findKing, inCheck, makeMove, legalMoves, key, material, insufficient, toSan };
})(window);
