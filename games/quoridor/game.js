/* Quoridor — 9×9, 10 walls each, jump rules, BFS path check. */
(function () {
  const N = 9;
  let starter = 1;
  Game.init({
    id: 'quoridor',
    rules: ['Player 1 starts at the bottom and must reach the top row; Player 2 starts at the top and must reach the bottom row.', 'On your turn either move your pawn one square orthogonally, or place one of your 10 walls (two squares long) to block paths.', 'You may jump straight over an adjacent pawn (or diagonally if a wall/edge blocks the jump).', 'A wall may never completely cut off a player from their goal row.'],
    controls: { all: 'Click a highlighted square to move. Click the gap between squares to place a wall; the <b>Rotate</b> button toggles horizontal / vertical.' },
    onStart(g) {
      const pos = { 1: [N - 1, 4], 2: [0, 4] }; const walls = { 1: 10, 2: 10 };
      const hw = new Set(), vw = new Set(); // "r,c": h-wall below row r covering cols c,c+1 ; v-wall right of col c covering rows r,r+1
      let turn = starter, orient = 'h';
      const CS = Math.floor(clamp((Math.min(window.innerWidth, window.innerHeight - 240) - 40) / N, 30, 56)), GAP = Math.max(8, Math.floor(CS * 0.22));
      const svgNS = 'http://www.w3.org/2000/svg';
      const W = N * CS + (N - 1) * GAP;
      const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${W}`); svg.setAttribute('class', 'gsvg'); svg.style.width = Math.min(W, window.innerWidth - 24) + 'px'; svg.style.background = '#1c2238';
      const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      const cellEls = [], layer = mk('g', {}), wallLayer = mk('g', {}), pawnLayer = mk('g', {}), ghost = mk('rect', { fill: '#ffd43b', opacity: 0.5, rx: 3 });
      for (let r = 0; r < N; r++) { cellEls.push([]); for (let c = 0; c < N; c++) { const e = mk('rect', { x: c * (CS + GAP), y: r * (CS + GAP), width: CS, height: CS, rx: 4, fill: '#2b3552', class: 'cell-sq' }); e.style.cursor = 'pointer'; e.addEventListener('click', () => move(r, c)); layer.appendChild(e); cellEls[r].push(e); } }
      svg.append(layer, wallLayer, ghost, pawnLayer);
      ghost.setAttribute('width', 0);
      // wall hit areas: for each (r,c) with r<N-1,c<N-1 a slot between cells
      for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) {
        const hz = mk('rect', { x: c * (CS + GAP), y: r * (CS + GAP) + CS, width: 2 * CS + GAP, height: GAP, fill: 'transparent' });
        const vt = mk('rect', { x: c * (CS + GAP) + CS, y: r * (CS + GAP), width: GAP, height: 2 * CS + GAP, fill: 'transparent' });
        [hz, vt].forEach((e, i) => { e.style.cursor = 'pointer'; e.addEventListener('pointerenter', () => showGhost(r, c)); e.addEventListener('pointerleave', () => ghost.setAttribute('width', 0)); e.addEventListener('click', () => place(r, c)); svg.appendChild(e); });
      }
      const pawns = { 1: mk('circle', { r: CS * 0.36, fill: g.color(1), stroke: '#0008', 'stroke-width': 3 }), 2: mk('circle', { r: CS * 0.36, fill: g.color(2), stroke: '#0008', 'stroke-width': 3 }) };
      pawnLayer.append(pawns[1], pawns[2]);
      const info = h('div', { class: 'row' }, h('span', { class: 'stat' }, h('b', { class: 'pc1', id: 'w1' }, '10'), h('span', {}, 'walls')), h('button', { class: 'btn', text: '⟳ Rotate wall (H)', onclick: () => { orient = orient === 'h' ? 'v' : 'h'; rotBtn.textContent = `⟳ Rotate wall (${orient.toUpperCase()})`; } }), h('span', { class: 'stat' }, h('b', { class: 'pc2', id: 'w2' }, '10'), h('span', {}, 'walls')));
      const rotBtn = info.querySelector('button');
      g.stage.append(svg, info);
      const blocked = (r, c, r2, c2) => { // moving from (r,c) to adjacent (r2,c2)
        if (r2 === r + 1) return hw.has(`${r},${c}`) || hw.has(`${r},${c - 1}`);
        if (r2 === r - 1) return hw.has(`${r - 1},${c}`) || hw.has(`${r - 1},${c - 1}`);
        if (c2 === c + 1) return vw.has(`${r},${c}`) || vw.has(`${r - 1},${c}`);
        if (c2 === c - 1) return vw.has(`${r},${c - 1}`) || vw.has(`${r - 1},${c - 1}`);
        return true;
      };
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      function movesOf(p) {
        const [r, c] = pos[p]; const [or, oc] = pos[3 - p]; const out = [];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const r2 = r + dr, c2 = c + dc; if (!inb(r2, c2) || blocked(r, c, r2, c2)) continue;
          if (r2 === or && c2 === oc) {
            const r3 = r2 + dr, c3 = c2 + dc;
            if (inb(r3, c3) && !blocked(r2, c2, r3, c3)) out.push([r3, c3]);
            else for (const [er, ec] of dr ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]) { const r4 = r2 + er, c4 = c2 + ec; if (inb(r4, c4) && !blocked(r2, c2, r4, c4) && !(r4 === r && c4 === c)) out.push([r4, c4]); }
          } else out.push([r2, c2]);
        }
        return out;
      }
      function pathExists(p) {
        const goal = p === 1 ? 0 : N - 1; const seen = new Set([pos[p].join(',')]); const q = [pos[p]];
        while (q.length) { const [r, c] = q.shift(); if (r === goal) return true; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r2 = r + dr, c2 = c + dc; if (inb(r2, c2) && !blocked(r, c, r2, c2) && !seen.has(`${r2},${c2}`)) { seen.add(`${r2},${c2}`); q.push([r2, c2]); } } }
        return false;
      }
      function canPlace(r, c, o) {
        if (r < 0 || c < 0 || r >= N - 1 || c >= N - 1) return false;
        if (o === 'h') { if (hw.has(`${r},${c}`) || hw.has(`${r},${c - 1}`) || hw.has(`${r},${c + 1}`) || vw.has(`${r},${c}`)) return false; hw.add(`${r},${c}`); const ok = pathExists(1) && pathExists(2); hw.delete(`${r},${c}`); return ok; }
        if (vw.has(`${r},${c}`) || vw.has(`${r - 1},${c}`) || vw.has(`${r + 1},${c}`) || hw.has(`${r},${c}`)) return false; vw.add(`${r},${c}`); const ok = pathExists(1) && pathExists(2); vw.delete(`${r},${c}`); return ok;
      }
      function showGhost(r, c) {
        if (g.over || !walls[turn]) return;
        const ok = canPlace(r, c, orient);
        ghost.setAttribute('fill', ok ? g.color(turn) : '#ff4d4d');
        if (orient === 'h') { ghost.setAttribute('x', c * (CS + GAP)); ghost.setAttribute('y', r * (CS + GAP) + CS + 1); ghost.setAttribute('width', 2 * CS + GAP); ghost.setAttribute('height', GAP - 2); }
        else { ghost.setAttribute('x', c * (CS + GAP) + CS + 1); ghost.setAttribute('y', r * (CS + GAP)); ghost.setAttribute('width', GAP - 2); ghost.setAttribute('height', 2 * CS + GAP); }
      }
      function render() {
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cellEls[r][c].setAttribute('fill', '#2b3552');
        movesOf(turn).forEach(([r, c]) => cellEls[r][c].setAttribute('fill', g.color(turn) + '55'));
        [1, 2].forEach((p) => { pawns[p].setAttribute('cx', pos[p][1] * (CS + GAP) + CS / 2); pawns[p].setAttribute('cy', pos[p][0] * (CS + GAP) + CS / 2); });
        info.querySelector('#w1').textContent = walls[1]; info.querySelector('#w2').textContent = walls[2];
        rotBtn.textContent = `⟳ Rotate wall (${orient.toUpperCase()})`;
      }
      function move(r, c) {
        if (g.over || !movesOf(turn).some(([rr, cc]) => rr === r && cc === c)) return;
        pos[turn] = [r, c]; g.sfx('move');
        if ((turn === 1 && r === 0) || (turn === 2 && r === N - 1)) { render(); starter = 3 - turn; return g.win(turn, `${esc(g.name(turn))} reached the far side.`); }
        turn = 3 - turn; render(); g.turn(turn);
      }
      function place(r, c) {
        if (g.over || !walls[turn] || !canPlace(r, c, orient)) return g.sfx('bad');
        (orient === 'h' ? hw : vw).add(`${r},${c}`); walls[turn]--;
        const w = orient === 'h' ? mk('rect', { x: c * (CS + GAP), y: r * (CS + GAP) + CS + 1, width: 2 * CS + GAP, height: GAP - 2, rx: 3, fill: g.color(turn) }) : mk('rect', { x: c * (CS + GAP) + CS + 1, y: r * (CS + GAP), width: GAP - 2, height: 2 * CS + GAP, rx: 3, fill: g.color(turn) });
        wallLayer.appendChild(w); ghost.setAttribute('width', 0); g.sfx('hit');
        turn = 3 - turn; render(); g.turn(turn);
      }
      g.key('KeyR', () => { orient = orient === 'h' ? 'v' : 'h'; render(); });
      render(); g.turn(turn);
    },
  });
})();
