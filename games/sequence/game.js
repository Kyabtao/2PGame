/* Sequence 4 — the board game distilled: play the card the square shows, line up four. */
(function () {
  const R = 4;
  const KINDS = ['♠A', '♠5', '♥2', '♥7', '♦3', '♦K', '♣6', '♣Q'];
  let starter = 1;
  Game.init({
    id: 'sequence',
    rules: [
      'The 4×4 board prints eight card faces twice each, and the deck holds four copies of every face. Just tap an empty square — it plays the matching card from your two-card hand and your chip locks it in.',
      'Play a card onto the LAST free square of its face and it counts as the DEAD card — as in the board game — and you may immediately claim one extra square of your choice.',
      'Four of your chips in a straight row — across, down or diagonal — wins the sequence.',
      'If the board fills with no line, or the cards run out, the board is replayed; first to two sequences wins the match (six boards max, most sequences decides).',
    ],
    controls: { all: 'Tap a square to play that card · matching hand card is used automatically' },
    points: true,
    onStart(g) {
      const seqs = { 1: 0, 2: 0 };
      let deck = [], cells = [], board = new Array(R * R).fill(0), held = { 1: [], 2: [] };
      let picked = -1, wildFor = 0, turn = starter, round = 0, over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const grid = UI.grid({ rows: R, cols: R, onClick: (r, c, cell) => place(r * R + c) });
      const handRow = h('div', { class: 'row', style: { minHeight: 96 } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'd', label: 'deck', val: 0 }]);
      wrap.append(info, grid.el, handRow, stat.el);
      function newRound() {
        round++;
        if (round > 6) {
          over = true; starter = 3 - starter; g.turn();
          if (seqs[1] === seqs[2]) return g.draw(`Six boards, no sequence for either side — honours even.`);
          const w = seqs[1] > seqs[2] ? 1 : 2;
          return g.win(w, `${esc(g.name(w))} lines up ${seqs[w]} sequence${seqs[w] > 1 ? 's' : ''} to ${seqs[3 - w]} across the boards.`);
        }
        const faces = [];
        for (let rep = 0; rep < 4; rep++) KINDS.forEach((k) => faces.push(k));
        shuffle(faces);
        cells = faces.slice(0, 16).map((k) => ({ k, red: k[0] === '♥' || k[0] === '♦' }));
        deck = faces.slice(16);
        board = new Array(R * R).fill(0); picked = -1; wildFor = 0;
        held[1] = []; held[2] = [];
        refill(1); refill(2);
        turn = starter;
        g.sfx('capture');
        draw();
      }
      function refill(p) { while (held[p].length < 2 && deck.length) held[p].push(deck.pop()); }
      let replaying = false;
      function ensurePlayable() {
        if (replaying || over || wildFor) return;
        if (held[turn].some((k) => canPlace(k) >= 0) || wildFor) return;
        if (deck.length) { refill(turn); return; }
        replaying = true;
        g.toast('cards gone — replay the board', 1000);
        setTimeout(() => { replaying = false; newRound(); }, 600);
      }
      function draw() {
        if (over) return;
        ensurePlayable();
        info.innerHTML = `board ${round} · deck ${deck.length} · ${esc(g.name(turn))}${wildFor ? ' — wild square available' : ''}`;
        grid.each((cell, r, c) => {
          const i = r * R + c;
          cell.innerHTML = '';
          cell.className = 'cell' + (board[i] ? ' p' + board[i] : '');
          if (board[i]) { const chip = h('span', { class: 'chipchip', text: '●', style: { color: board[i] === 1 ? '#1565c0' : '#c62828', fontSize: '1.5rem' } }); cell.appendChild(chip); }
          else {
            cell.append(
              h('span', { text: cells[i].k[1], style: { fontSize: '1rem', fontWeight: 800, color: cells[i].red ? '#c0392b' : '#222' } }),
              h('span', { text: cells[i].k[0], style: { fontSize: '1rem', color: cells[i].red ? '#c0392b' : '#222' } })
            );
          }
        });
        handRow.innerHTML = '';
        handRow.appendChild(h('span', { class: 'muted', text: `${g.name(turn)} holds:` }));
        held[turn].forEach((k) => {
          const red = k[0] === '♥' || k[0] === '♦';
          handRow.appendChild(h('span', { class: 'tag', text: k, style: { color: red ? '#c0392b' : '#111', fontWeight: 800 } }));
        });
        if (!held[turn].length) handRow.appendChild(h('span', { class: 'tag', text: 'empty — waiting' }));
        stat.set('a', seqs[1]); stat.set('b', seqs[2]); stat.set('d', deck.length);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${wildFor ? 'claim any free square' : 'tap a square you can match'}`);
      }
      const lines = () => {
        const out = [];
        for (let i = 0; i < R; i++) { out.push([0, 1, 2, 3].map((j) => i * R + j)); out.push([0, 1, 2, 3].map((j) => j * R + i)); }
        out.push([0, 5, 10, 15]); out.push([3, 6, 9, 12]);
        return out;
      };
      const canPlace = (k) => cells.findIndex((cl, j) => cl.k === k && !board[j]);
      function place(i) {
        if (over) return;
        if (wildFor === turn) {
          if (board[i]) return g.sfx('bad');
          board[i] = turn; wildFor = 0; g.sfx('coin');
          if (checkLine(turn)) return;
          finishPlay();
          return;
        }
        if (board[i]) return g.sfx('bad');
        let at = held[turn].findIndex((k) => k === cells[i].k);
        let target = i;
        if (at < 0) {
          for (let hIdx = 0; hIdx < held[turn].length; hIdx++) {
            const free = canPlace(held[turn][hIdx]);
            if (free >= 0) { at = hIdx; target = free; g.toast('played your other card on its own square', 900); break; }
          }
        }
        if (at < 0) {                                  // rule: no legal play — draw one and pass
          if (deck.length) { held[turn].push(deck.pop()); g.toast('no card fits — drew and passed', 950); }
          else if (!held[3 - turn].some((k) => canPlace(k) >= 0)) { deadBoard(); return; }
          else { g.toast('no card fits and the deck is dry', 950); }
          g.sfx('click');
          finishPlay();
          return;
        }
        const k = held[turn][at];
        const alreadyPlayed = board.filter((v, j) => v && cells[j].k === k).length;
        board[target] = turn;
        held[turn].splice(at, 1);
        g.sfx('coin');
        if (checkLine(turn)) return;
        if (alreadyPlayed === 1) { picked = -1; wildFor = turn; refill(turn); g.toast('dead card! take one extra square', 1200); draw(); return; }
        finishPlay();
      }
      function deadBoard() {
        g.toast('no play possible — new board', 900);
        replaying = true;
        setTimeout(() => { replaying = false; newRound(); }, 500);
      }
      function finishPlay() {
        picked = -1;
        refill(turn);
        if (board.every((v) => v)) { g.toast('board full — no line, replay', 700); replaying = true; setTimeout(() => { replaying = false; newRound(); }, 600); draw(); return; }
        turn = 3 - turn;
        draw();
      }
      function checkLine(p) {
        const win = lines().find((ln) => ln.every((j) => board[j] === p));
        if (!win) return false;
        win.forEach((j) => { const cell = grid.cells[Math.floor(j / R)][j % R]; cell.classList.add('hl'); });
        seqs[p]++;
        g.points(seqs[1], seqs[2]);
        if (seqs[p] >= 2) { over = true; starter = 3 - starter; g.turn(); g.sfx('win'); return g.win(p, `Two sequences — ${esc(g.name(p))} owns the board.`), true; }
        starter = 3 - starter;
        g.sfx('capture'); g.toast(`${esc(g.name(p))} lines up four — new board`, 1500);
        setTimeout(newRound, 1500);
        return true;
      }
      newRound();
    },
    onStop() { starter = 3 - starter; },
  });
})();
