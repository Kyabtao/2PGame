/* Pentago — 6×6 in four 3×3 quadrants; place a marble, rotate a quadrant, five in a row. */
(function () {
  let starter = 1;
  Game.init({
    id: 'pentago',
    rules: ['The 6×6 board is made of four 3×3 quadrants that rotate.', 'On your turn place a marble on an empty cell, then rotate any quadrant 90° clockwise or counter-clockwise.', 'Five in a row (in any direction) wins — checked after the rotation. If both players have five, or the board fills, it\'s a draw.'],
    controls: { all: 'Click / tap a cell, then use the ↻ / ↺ buttons around the board' },
    onStart(g) {
      const b = range(6).map(() => Array(6).fill(0));
      let turn = starter, phase = 'place', moves = 0;
      const size = Math.floor(clamp((Math.min(window.innerWidth, window.innerHeight - 260) - 120) / 6, 30, 60));
      const wrap = h('div', { style: { display: 'grid', gridTemplateColumns: 'auto auto auto', gridTemplateRows: 'auto auto auto', gap: '6px', alignItems: 'center', justifyItems: 'center' } });
      const board = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: '8px', background: '#0b0d18', padding: '8px', borderRadius: '14px', gridArea: '2 / 2' } });
      const quads = range(4).map((q) => { const gr = UI.grid({ rows: 3, cols: 3, size, gap: 4, onClick: (r, c) => place(Math.floor(q / 2) * 3 + r, (q % 2) * 3 + c) }); gr.el.style.transition = 'transform .35s'; board.appendChild(gr.el); return gr; });
      const rot = (q, dir) => { const btn = h('button', { class: 'btn sm', text: dir > 0 ? '↻' : '↺', title: `Rotate quadrant ${q + 1} ${dir > 0 ? 'clockwise' : 'counter-clockwise'}` }); btn.addEventListener('click', () => rotate(q, dir)); return btn; };
      const btnRow = (q, area) => { const d = h('div', { class: 'row', style: { gridArea: area } }, rot(q, -1), rot(q, 1)); return d; };
      wrap.append(btnRow(0, '1 / 2'), btnRow(1, '3 / 2'), btnRow(2, '2 / 1'), btnRow(3, '2 / 3'), board);
      // simpler layout: top row buttons for Q0 & Q1, bottom for Q2 & Q3
      wrap.innerHTML = '';
      wrap.style.gridTemplateColumns = '1fr 1fr'; wrap.style.gridTemplateRows = 'auto auto auto';
      wrap.append(Object.assign(h('div', { class: 'row' }, h('span', { class: 'tag', text: 'Q1' }), rot(0, -1), rot(0, 1)), { style: 'grid-area:1/1' }), Object.assign(h('div', { class: 'row' }, h('span', { class: 'tag', text: 'Q2' }), rot(1, -1), rot(1, 1)), { style: 'grid-area:1/2' }));
      board.style.gridArea = '2 / 1 / 3 / 3'; wrap.appendChild(board);
      wrap.append(Object.assign(h('div', { class: 'row' }, h('span', { class: 'tag', text: 'Q3' }), rot(2, -1), rot(2, 1)), { style: 'grid-area:3/1' }), Object.assign(h('div', { class: 'row' }, h('span', { class: 'tag', text: 'Q4' }), rot(3, -1), rot(3, 1)), { style: 'grid-area:3/2' }));
      g.stage.appendChild(wrap);
      const rotBtns = [...wrap.querySelectorAll('button')];
      function render() {
        for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) { const q = Math.floor(r / 3) * 2 + Math.floor(c / 3); const cell = quads[q].at(r % 3, c % 3); cell.innerHTML = ''; cell.classList.remove('win'); if (b[r][c]) cell.appendChild(h('div', { class: 'piece p' + b[r][c] })); }
        rotBtns.forEach((bt) => { bt.disabled = phase !== 'rotate'; });
        quads.forEach((q) => { q.el.style.opacity = phase === 'place' ? 1 : .9; });
      }
      const lines = (p) => { const out = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { const cells = []; for (let k = 0; k < 5; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= 6 || cc < 0 || cc >= 6 || b[rr][cc] !== p) break; cells.push([rr, cc]); } if (cells.length === 5) out.push(cells); } return out; };
      function check() {
        const l1 = lines(1), l2 = lines(2);
        const mark = (ls) => ls.forEach((cells) => cells.forEach(([r, c]) => quads[Math.floor(r / 3) * 2 + Math.floor(c / 3)].at(r % 3, c % 3).classList.add('win')));
        if (l1.length && l2.length) { mark(l1); mark(l2); starter = 3 - starter; g.draw('Both players made five in a row!'); return true; }
        if (l1.length || l2.length) { const w = l1.length ? 1 : 2; mark(l1.length ? l1 : l2); starter = 3 - w; g.win(w, `Five in a row after ${moves} marbles.`); return true; }
        if (moves === 36) { starter = 3 - starter; g.draw('The board is full.'); return true; }
        return false;
      }
      function place(r, c) {
        if (g.over || phase !== 'place' || b[r][c]) return g.sfx('bad');
        b[r][c] = turn; moves++; g.sfx('move'); phase = 'rotate'; render();
        if (check()) return;
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: rotate a quadrant`);
      }
      function rotate(q, dir) {
        if (g.over || phase !== 'rotate') return;
        const r0 = Math.floor(q / 2) * 3, c0 = (q % 2) * 3; const old = range(3).map((r) => range(3).map((c) => b[r0 + r][c0 + c]));
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) b[r0 + r][c0 + c] = dir > 0 ? old[2 - c][r] : old[c][2 - r];
        const el = quads[q].el; el.style.transform = `rotate(${dir * 90}deg)`; g.sfx('pop');
        g.after(350, () => { el.style.transition = 'none'; el.style.transform = 'none'; requestAnimationFrame(() => { el.style.transition = 'transform .35s'; }); phase = 'place'; render(); if (check()) return; turn = 3 - turn; g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: place a marble`); });
      }
      render(); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>: place a marble`);
    },
  });
})();
