/* Path Finder — claim edges between dots; first to chain your two sides wins. */
(function () {
  const N = 6; // dots per side -> 5x5 cells of play
  let starter = 1;
  Game.init({
    id: 'path-finder',
    rules: [
      'The board is a grid of dots. On your turn claim one edge between two neighbouring dots — any edge that is still free.',
      `${starter === 1 ? 'Player 1' : 'Player 1'} (red) must join the LEFT side to the RIGHT side along their own edges; blue must join TOP to BOTTOM.`,
      'Both players may use the same dot, so paths can run side by side — but only the first to complete a link wins, because moves are taken one at a time.',
      'Every edge is fillable, so somebody always breaks the deadlock; if the whole lattice is used up it is a shared draw.',
    ],
    controls: { all: 'Click / tap a gap between two dots' },
    onStart(g) {
      const S = 62, PAD = 26, W = PAD * 2 + (N - 1) * S;
      const he = range(N).map(() => Array(N - 1).fill(0)); // horizontal edge [r][c] from (r,c) to (r,c+1)
      const ve = range(N - 1).map(() => Array(N).fill(0)); // vertical   edge [r][c] from (r,c) to (r+1,c)
      let turn = starter, taken = 0;
      const total = N * (N - 1) * 2;
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${W}`); svg.setAttribute('class', 'gsvg');
      svg.style.width = Math.min(W, window.innerWidth - 32) + 'px';
      svg.style.background = '#171d33'; svg.style.borderRadius = '12px';
      const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
      // goal bands
      svg.appendChild(mk('rect', { x: 0, y: 0, width: PAD - 8, height: W, fill: 'var(--p1)', opacity: .18 }));
      svg.appendChild(mk('rect', { x: W - PAD + 8, y: 0, width: PAD - 8, height: W, fill: 'var(--p1)', opacity: .18 }));
      svg.appendChild(mk('rect', { x: 0, y: 0, width: W, height: PAD - 8, fill: 'var(--p2)', opacity: .18 }));
      svg.appendChild(mk('rect', { x: 0, y: W - PAD + 8, width: W, height: PAD - 8, fill: 'var(--p2)', opacity: .18 }));
      const els = { h: [], v: [] };
      function add(kind, r, c) {
        const x = PAD + c * S, y = PAD + r * S;
        const vis = kind === 'h' ? mk('line', { x1: x, y1: y, x2: x + S, y2: y }) : mk('line', { x1: x, y1: y, x2: x, y2: y + S });
        vis.setAttribute('stroke', '#39435f'); vis.setAttribute('stroke-width', 7); vis.setAttribute('stroke-linecap', 'round');
        const hit = kind === 'h' ? mk('rect', { x: x + 6, y: y - 12, width: S - 12, height: 24, fill: 'transparent' }) : mk('rect', { x: x - 12, y: y + 6, width: 24, height: S - 12, fill: 'transparent' });
        hit.style.cursor = 'pointer';
        hit.addEventListener('click', () => play(kind, r, c));
        hit.addEventListener('pointerenter', () => { if (!(kind === 'h' ? he : ve)[r][c]) vis.setAttribute('stroke', g.color(turn) + '70'); });
        hit.addEventListener('pointerleave', () => { if (!(kind === 'h' ? he : ve)[r][c]) vis.setAttribute('stroke', '#39435f'); });
        svg.appendChild(vis); svg.appendChild(hit);
        els[kind][r] = els[kind][r] || []; els[kind][r][c] = vis;
      }
      for (let r = 0; r < N; r++) for (let c = 0; c < N - 1; c++) add('h', r, c);
      for (let r = 0; r < N - 1; r++) for (let c = 0; c < N; c++) add('v', r, c);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) svg.appendChild(mk('circle', { cx: PAD + c * S, cy: PAD + r * S, r: 5, fill: '#e8ecf8' }));
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } }, `${g.name(1)}: left → right · ${g.name(2)}: top → bottom`);
      g.stage.append(svg, note);
      g.turn(turn);

      const nbr = (r, c, p) => {
        const o = [];
        if (c < N - 1 && he[r][c] === p) o.push([r, c + 1]);
        if (c > 0 && he[r][c - 1] === p) o.push([r, c - 1]);
        if (r < N - 1 && ve[r][c] === p) o.push([r + 1, c]);
        if (r > 0 && ve[r - 1][c] === p) o.push([r - 1, c]);
        return o;
      };
      /** flood the player's own edges from their start band and look for the far band */
      function linked(p) {
        const seen = new Set(); const q = [];
        for (let i = 0; i < N; i++) { const s = p === 1 ? [i, 0] : [0, i]; seen.add(s.join(',')); q.push(s); }
        while (q.length) {
          const [r, c] = q.pop();
          if (p === 1 ? c === N - 1 : r === N - 1) return true;
          for (const [rr, cc] of nbr(r, c, p)) { const k = rr + ',' + cc; if (seen.has(k)) continue; seen.add(k); q.push([rr, cc]); }
        }
        return false;
      }
      function play(kind, r, c) {
        if (g.over) return;
        const arr = kind === 'h' ? he : ve;
        if (arr[r][c]) return g.sfx('bad');
        arr[r][c] = turn; taken++;
        g.sfx('move');
        svg.appendChild(mk('circle', { cx: PAD + c * S + (kind === 'h' ? S / 2 : 0), cy: PAD + r * S + (kind === 'h' ? 0 : S / 2), r: 4, fill: g.color(turn) }));
        els[kind][r][c].setAttribute('stroke', g.color(turn));
        if (linked(turn)) { starter = 3 - starter; return g.win(turn, `${esc(g.name(turn))} linked both sides in ${taken} edges.`); }
        if (taken === total) { starter = 3 - starter; return g.draw('Every edge is claimed and neither side broke through.'); }
        turn = 3 - turn; g.turn(turn);
      }
    },
    onStop() { starter = 3 - starter; },
  });
})();
