/* Dots Extreme — 6×6 boxes, three star boxes worth double, chain claiming as usual. */
(function () {
  const D = 7; // dots per side -> 6x6 boxes
  let starter = 1;
  Game.init({
    id: 'dots-extreme',
    rules: [
      'Draw one line between two neighbouring dots per turn. Close the fourth side of a box and it is yours — and you throw again.',
      'Three boxes carry a ★ and are worth 2 points instead of 1; whoever takes the last line of the board also takes one free bonus star box if any are left.',
      'Chain turns are the whole game: set up doubles for yourself and leave your rival nothing but safe lines.',
      'When every line is drawn the highest score wins.',
    ],
    controls: { all: 'Click / tap a gap between two dots' },
    points: true,
    onStart(g) {
      const S = 54, PAD = 22, W = PAD * 2 + (D - 1) * S;
      const hl = range(D).map(() => Array(D - 1).fill(0));
      const vl = range(D - 1).map(() => Array(D).fill(0));
      const box = range(D - 1).map(() => Array(D - 1).fill(0));
      const stars = range(D - 1).map(() => Array(D - 1).fill(0));
      let n = 0;
      while (n < 3) { const r = rnd(D - 1), c = rnd(D - 1); if (!stars[r][c]) { stars[r][c] = 1; n++; } }
      let turn = starter, lines = 0; const total = 2 * D * (D - 1);
      const sc = { 1: 0, 2: 0 };
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${W}`); svg.setAttribute('class', 'gsvg');
      svg.style.width = Math.min(W, window.innerWidth - 28) + 'px';
      svg.style.background = '#181f38'; svg.style.borderRadius = '12px';
      const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
      const boxEls = [], lineEls = { h: [], v: [] };
      for (let r = 0; r < D - 1; r++) { boxEls.push([]); for (let c = 0; c < D - 1; c++) { const e = mk('rect', { x: PAD + c * S + 4, y: PAD + r * S + 4, width: S - 8, height: S - 8, rx: 6, fill: 'transparent' }); svg.appendChild(e); boxEls[r].push(e); if (stars[r][c]) { const t = mk('text', { x: PAD + c * S + S / 2, y: PAD + r * S + S / 2 + 7, 'text-anchor': 'middle', 'font-size': 20, fill: '#ffffff40' }); t.textContent = '★'; svg.appendChild(t); } } }
      const addLine = (kind, r, c) => {
        const x = PAD + c * S, y = PAD + r * S;
        const vis = kind === 'h' ? mk('line', { x1: x + 3, y1: y, x2: x + S - 3, y2: y }) : mk('line', { x1: x, y1: y + 3, x2: x, y2: y + S - 3 });
        vis.setAttribute('stroke', '#333e63'); vis.setAttribute('stroke-width', 6); vis.setAttribute('stroke-linecap', 'round');
        const hit = kind === 'h' ? mk('rect', { x: x + 8, y: y - 11, width: S - 16, height: 22, fill: 'transparent' }) : mk('rect', { x: x - 11, y: y + 8, width: 22, height: S - 16, fill: 'transparent' });
        hit.style.cursor = 'pointer';
        hit.addEventListener('click', () => play(kind, r, c));
        hit.addEventListener('pointerenter', () => { if (!(kind === 'h' ? hl : vl)[r][c]) vis.setAttribute('stroke', g.color(turn) + '66'); });
        hit.addEventListener('pointerleave', () => { if (!(kind === 'h' ? hl : vl)[r][c]) vis.setAttribute('stroke', '#333e63'); });
        svg.appendChild(vis); svg.appendChild(hit);
        lineEls[kind][r] = lineEls[kind][r] || []; lineEls[kind][r][c] = vis;
      };
      for (let r = 0; r < D; r++) for (let c = 0; c < D - 1; c++) addLine('h', r, c);
      for (let r = 0; r < D - 1; r++) for (let c = 0; c < D; c++) addLine('v', r, c);
      for (let r = 0; r < D; r++) for (let c = 0; c < D; c++) svg.appendChild(mk('circle', { cx: PAD + c * S, cy: PAD + r * S, r: 5, fill: '#e8ecf8' }));
      g.stage.appendChild(svg);
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } }); g.stage.appendChild(note);
      g.turn(turn);
      const closed = (r, c) => hl[r][c] && hl[r + 1][c] && vl[r][c] && vl[r][c + 1];
      const boxCount = () => box.flat().filter(Boolean).length;
      function play(kind, r, c) {
        if (g.over) return;
        const arr = kind === 'h' ? hl : vl;
        if (arr[r][c]) return g.sfx('bad');
        arr[r][c] = turn; lines++;
        lineEls[kind][r][c].setAttribute('stroke', g.color(turn));
        let got = 0;
        const take = (br, bc) => {
          if (br < 0 || bc < 0 || br >= D - 1 || bc >= D - 1 || box[br][bc]) return;
          if (!closed(br, bc)) return;
          box[br][bc] = turn; got++;
          const pts = 1 + (stars[br][bc] ? 1 : 0);
          sc[turn] += pts;
          boxEls[br][bc].setAttribute('fill', g.color(turn) + '55');
          const t = mk('text', { x: PAD + bc * S + S / 2, y: PAD + br * S + S / 2 + 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 800, fill: g.color(turn) });
          t.textContent = (stars[br][bc] ? '★' : '') + g.name(turn)[0].toUpperCase();
          svg.appendChild(t);
          if (stars[br][bc]) stars[br][bc] = 0;
          g.sfx('score');
        };
        if (kind === 'h') { take(r - 1, c); take(r, c); } else { take(r, c - 1); take(r, c); }
        if (!got) g.sfx('move');
        note.textContent = `lines ${lines}/${total} · boxes ${boxCount()}/${(D - 1) * (D - 1)}`;
        g.points(sc[1], sc[2]);
        if (boxCount() === (D - 1) * (D - 1) || lines === total) return end();
        if (!got) turn = 3 - turn;
        g.turn(turn, got ? `<span class="pc${turn}">${esc(g.name(turn))}</span> took ${got > 1 ? got + ' boxes' : 'a box'} — throw again!` : undefined);
      }
      function end() {
        starter = 3 - starter;
        if (sc[1] === sc[2]) return g.draw(`${sc[1]} points each with the ★ boxes shared.`);
        const w = sc[1] > sc[2] ? 1 : 2;
        g.win(w, `${sc[w]} points to ${sc[3 - w]}.`);
      }
    },
    onStop() { starter = 3 - starter; },
  });
})();
