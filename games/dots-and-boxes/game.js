/* Dots & Boxes — 5×5 dots (4×4 boxes), SVG board. */
(function () {
  const D = 6; // dots per side -> 5x5 boxes
  let starter = 1;
  Game.init({
    id: 'dots-and-boxes',
    rules: ['Take turns drawing one line between two adjacent dots.', 'Completing the fourth side of a box claims it and gives you another turn.', 'When all boxes are claimed, whoever owns more wins.'],
    controls: { all: 'Click / tap the gap between two dots' },
    points: true,
    onStart(g) {
      const S = 64, PAD = 24, W = PAD * 2 + (D - 1) * S;
      const hl = range(D).map(() => Array(D - 1).fill(0)); // horizontal lines [r][c] between (r,c)-(r,c+1)
      const vl = range(D - 1).map(() => Array(D).fill(0)); // vertical [r][c] between (r,c)-(r+1,c)
      const box = range(D - 1).map(() => Array(D - 1).fill(0));
      let turn = starter; const score = { 1: 0, 2: 0 };
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${W}`); svg.setAttribute('class', 'gsvg'); svg.style.width = Math.min(W, window.innerWidth - 32) + 'px'; svg.style.background = '#1c2238';
      const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      const boxEls = [], lineEls = { h: [], v: [] };
      for (let r = 0; r < D - 1; r++) { boxEls.push([]); for (let c = 0; c < D - 1; c++) { const e = mk('rect', { x: PAD + c * S + 4, y: PAD + r * S + 4, width: S - 8, height: S - 8, rx: 6, fill: 'transparent' }); svg.appendChild(e); boxEls[r].push(e); } }
      const boxText = range(D - 1).map(() => []);
      const addLine = (kind, r, c) => {
        const x = PAD + c * S, y = PAD + r * S;
        const hit = kind === 'h' ? mk('rect', { x: x + 8, y: y - 10, width: S - 16, height: 20, fill: 'transparent', class: 'line' }) : mk('rect', { x: x - 10, y: y + 8, width: 20, height: S - 16, fill: 'transparent', class: 'line' });
        const vis = kind === 'h' ? mk('line', { x1: x + 4, y1: y, x2: x + S - 4, y2: y }) : mk('line', { x1: x, y1: y + 4, x2: x, y2: y + S - 4 });
        vis.setAttribute('stroke', '#2f3958'); vis.setAttribute('stroke-width', '6'); vis.setAttribute('stroke-linecap', 'round');
        hit.style.cursor = 'pointer';
        hit.addEventListener('pointerenter', () => { if (!(kind === 'h' ? hl : vl)[r][c]) vis.setAttribute('stroke', g.color(turn) + '88'); });
        hit.addEventListener('pointerleave', () => { if (!(kind === 'h' ? hl : vl)[r][c]) vis.setAttribute('stroke', '#2f3958'); });
        hit.addEventListener('click', () => play(kind, r, c));
        svg.appendChild(vis); svg.appendChild(hit);
        lineEls[kind][r] = lineEls[kind][r] || []; lineEls[kind][r][c] = vis;
      };
      for (let r = 0; r < D; r++) for (let c = 0; c < D - 1; c++) addLine('h', r, c);
      for (let r = 0; r < D - 1; r++) for (let c = 0; c < D; c++) addLine('v', r, c);
      for (let r = 0; r < D; r++) for (let c = 0; c < D; c++) svg.appendChild(mk('circle', { cx: PAD + c * S, cy: PAD + r * S, r: 6, fill: '#e8ecf8' }));
      g.stage.appendChild(svg);
      g.turn(turn);
      const closed = (r, c) => hl[r][c] && hl[r + 1][c] && vl[r][c] && vl[r][c + 1];
      function play(kind, r, c) {
        if (g.over) return;
        const arr = kind === 'h' ? hl : vl;
        if (arr[r][c]) return;
        arr[r][c] = turn;
        lineEls[kind][r][c].setAttribute('stroke', g.color(turn));
        let got = 0;
        const check = (br, bc) => { if (br < 0 || bc < 0 || br >= D - 1 || bc >= D - 1 || box[br][bc]) return; if (closed(br, bc)) { box[br][bc] = turn; got++; boxEls[br][bc].setAttribute('fill', g.color(turn) + '55'); const t = mk('text', { x: PAD + bc * S + S / 2, y: PAD + br * S + S / 2 + 8, 'text-anchor': 'middle', 'font-size': '24', 'font-weight': '800', fill: g.color(turn) }); t.textContent = g.name(turn)[0].toUpperCase(); svg.appendChild(t); } };
        if (kind === 'h') { check(r - 1, c); check(r, c); } else { check(r, c - 1); check(r, c); }
        if (got) { score[turn] += got; g.points(score[1], score[2]); g.sfx('score'); } else g.sfx('move');
        if (score[1] + score[2] === (D - 1) * (D - 1)) {
          starter = 3 - starter;
          if (score[1] === score[2]) return g.draw(`${score[1]} boxes each.`);
          const w = score[1] > score[2] ? 1 : 2; return g.win(w, `${score[w]} boxes to ${score[3 - w]}.`);
        }
        if (!got) turn = 3 - turn;
        g.turn(turn, got ? `<span class="pc${turn}">${esc(g.name(turn))}</span> goes again!` : undefined);
      }
    },
  });
})();
