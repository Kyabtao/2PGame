/* SOS — classic pencil-and-paper game: write S or O, make SOS, score and go again. */
(function () {
  const ROWS = 4, COLS = 4;
  let starter = 1;
  Game.init({
    id: 'sos',
    rules: [
      'On your turn pick a letter (S or O) and write it in any empty square.',
      'Every new horizontal, vertical or diagonal run of three reading S-O-S scores 1 point.',
      'Scoring earns you another turn — chain three SOS from one letter if you can.',
      'When the grid is full the higher score wins; the 2-point bonus for a double score is already counted.',
    ],
    controls: { all: 'Choose <b>S</b> or <b>O</b>, then tap a square' },
    points: true,
    onStart(g) {
      const b = range(ROWS).map(() => Array(COLS).fill(''));
      let turn = starter, letter = 'S', scored = 0, filled = 0;
      const sc = { 1: 0, 2: 0 };
      // every length-3 window on the grid
      const WIN = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          const cells = [];
          for (let k = 0; k < 3; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) { cells.length = 0; break; } cells.push([rr, cc]); }
          if (cells.length === 3) WIN.push(cells);
        }
      }
      const done = new Set();
      const grid = UI.grid({ rows: ROWS, cols: COLS, size: 88, gap: 6, onClick: click });
      const bar = h('div', { class: 'row' });
      const chips = UI.chips([], { cls: 'row' });
      bar.appendChild(chips.el);
      const log = h('div', { class: 'log', style: { maxWidth: '360px' } });
      g.stage.append(grid.el, bar, log);
      const inWin = (r, c) => WIN.filter((w) => w.some(([rr, cc]) => rr === r && cc === c)).map((w) => w.map((x) => x.join(',')).join('|'));
      function render() {
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          if (b[r][c]) { cell.textContent = b[r][c]; cell.classList.add(b[r][c] === 'S' ? 'p1' : 'p2'); cell.style.fontWeight = 900; cell.style.fontSize = 'calc(var(--cell) * .55)'; }
          else cell.classList.add('clickable');
        });
        chips.set([
          { label: 'S', on: letter === 'S', onClick: () => { letter = 'S'; render(); } },
          { label: 'O', on: letter === 'O', onClick: () => { letter = 'O'; render(); } },
        ]);
        g.points(sc[1], sc[2]);
      }
      function click(r, c) {
        if (g.over || b[r][c]) return g.sfx('bad');
        b[r][c] = letter; filled++;
        let hits = 0;
        for (const w of WIN) {
          const txt = w.map(([rr, cc]) => b[rr][cc]).join('');
          const id = w.map((x) => x.join(',')).join('|');
          if (txt === 'SOS' && !done.has(id)) { done.add(id); hits++; w.forEach(([rr, cc]) => grid.at(rr, cc).classList.add('win')); }
        }
        if (hits) {
          sc[turn] += hits; scored += hits;
          g.sfx('score');
          log.prepend(h('div', { html: `<b class="pc${turn}">${esc(g.name(turn))}</b> spelled SOS ×${hits}` }));
        } else g.sfx('move');
        render();
        if (filled === ROWS * COLS) return end();
        if (!hits) { turn = 3 - turn; letter = 'S'; g.turn(turn); }
        else g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> scores — write again!`);
        render();
      }
      function end() {
        starter = 3 - starter;
        for (let i = 0; i < ROWS * COLS; i++) { /* nothing to unwind */ }
        if (sc[1] === sc[2]) return g.draw(`Grid full — ${sc[1]} SOS each.`);
        const w = sc[1] > sc[2] ? 1 : 2;
        g.win(w, `${sc[w]} SOS to ${sc[3 - w]}.`);
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
