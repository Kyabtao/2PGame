/* Hex — 11×11 rhombus, connect your two sides. Includes swap rule. */
(function () {
  const N = 11;
  let starter = 1;
  Game.init({
    id: 'hex',
    rules: ['Player 1 (red) connects the top and bottom edges; Player 2 (blue) connects left and right.', 'Take turns placing a stone on any empty hexagon. Stones never move.', 'Swap rule: after the very first stone, the second player may choose to swap colours instead of placing.', 'Hex can never end in a draw.'],
    controls: { all: 'Click / tap an empty hexagon' },
    onStart(g) {
      const b = range(N).map(() => Array(N).fill(0));
      let turn = starter, moves = 0;
      const R = Math.max(12, Math.min(22, Math.floor((window.innerWidth - 40) / (N * 1.5 * 1.732)))); // hex radius
      const w = Math.sqrt(3) * R, hh = 2 * R;
      const W = w * N + w * (N - 1) / 2 + 20, H = hh * 0.75 * (N - 1) + hh + 20;
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'gsvg'); svg.style.width = Math.min(W, window.innerWidth - 24) + 'px';
      const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      const center = (r, c) => [10 + w / 2 + c * w + r * w / 2, 10 + R + r * hh * 0.75];
      const hexPts = (cx, cy, rad) => range(6).map((i) => { const a = Math.PI / 180 * (60 * i - 30); return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`; }).join(' ');
      // edge borders
      const [tx0] = center(0, 0), [txn] = center(0, N - 1), [bx0, by] = center(N - 1, 0), [bxn] = center(N - 1, N - 1);
      svg.appendChild(mk('polygon', { points: `${tx0 - w / 2},${10 + R / 2} ${txn + w / 2},${10 + R / 2} ${txn},${10} ${tx0},10`, fill: g.color(1), opacity: .8 }));
      svg.appendChild(mk('polygon', { points: `${bx0 - w / 2},${by + R / 2} ${bxn + w / 2},${by + R / 2} ${bxn + w / 2},${H - 10} ${bx0 - w / 2},${H - 10}`, fill: g.color(1), opacity: .8 }));
      svg.appendChild(mk('polygon', { points: `${tx0 - w / 2 - 2},${10 + R / 2} ${bx0 - w / 2 - 2},${by + R / 2} ${bx0 - w / 2 - 12},${by + R / 2} ${tx0 - w / 2 - 12},${10 + R / 2}`, fill: g.color(2), opacity: .8 }));
      svg.appendChild(mk('polygon', { points: `${txn + w / 2 + 2},${10 + R / 2} ${bxn + w / 2 + 2},${by + R / 2} ${bxn + w / 2 + 12},${by + R / 2} ${txn + w / 2 + 12},${10 + R / 2}`, fill: g.color(2), opacity: .8 }));
      const cells = [];
      for (let r = 0; r < N; r++) { cells.push([]); for (let c = 0; c < N; c++) { const [cx, cy] = center(r, c); const p = mk('polygon', { points: hexPts(cx, cy, R - 1), fill: '#2b3552', stroke: '#0e1020', 'stroke-width': 2, class: 'cell-hex' }); p.style.cursor = 'pointer'; p.addEventListener('click', () => play(r, c)); p.addEventListener('pointerenter', () => { if (!b[r][c] && !g.over) p.setAttribute('fill', g.color(turn) + '66'); }); p.addEventListener('pointerleave', () => { if (!b[r][c]) p.setAttribute('fill', '#2b3552'); }); svg.appendChild(p); cells[r].push(p); } }
      const swapBtn = h('button', { class: 'btn sm', text: '⇄ Swap colours', hidden: true, onclick: swap });
      g.stage.append(svg, swapBtn);
      g.turn(turn);
      const NB = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]];
      function connected(p) {
        const seen = new Set(); const stack = [];
        for (let i = 0; i < N; i++) { const [r, c] = p === 1 ? [0, i] : [i, 0]; if (b[r][c] === p) { stack.push([r, c]); seen.add(r * N + c); } }
        while (stack.length) {
          const [r, c] = stack.pop();
          if ((p === 1 && r === N - 1) || (p === 2 && c === N - 1)) return true;
          for (const [dr, dc] of NB) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr][cc] === p && !seen.has(rr * N + cc)) { seen.add(rr * N + cc); stack.push([rr, cc]); } }
        }
        return false;
      }
      function play(r, c) {
        if (g.over || b[r][c]) return;
        b[r][c] = turn; moves++;
        cells[r][c].setAttribute('fill', g.color(turn)); g.sfx('move');
        swapBtn.hidden = moves !== 1;
        if (connected(turn)) { starter = 3 - turn; return g.win(turn, `${esc(g.name(turn))} connected ${turn === 1 ? 'top to bottom' : 'left to right'} in ${moves} stones.`); }
        turn = 3 - turn; g.turn(turn);
      }
      function swap() {
        if (moves !== 1) return;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c]) { const nr = c, nc = r; b[r][c] = 0; cells[r][c].setAttribute('fill', '#2b3552'); b[nr][nc] = turn; cells[nr][nc].setAttribute('fill', g.color(turn)); r = N; break; }
        swapBtn.hidden = true; g.toast('Swapped!', 700);
        turn = 3 - turn; g.turn(turn);
      }
    },
  });
})();
