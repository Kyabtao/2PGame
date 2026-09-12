/* Sim — K6 graph; colour an edge; first to complete a monochromatic triangle loses. */
(function () {
  let starter = 1;
  Game.init({
    id: 'sim',
    rules: ['Six points are joined by 15 lines. Take turns colouring one uncoloured line in your colour.', 'If you complete a triangle whose three sides are all your colour, you <b>lose</b>.', 'Ramsey theory guarantees someone must eventually complete a triangle — there are no draws.'],
    controls: { all: 'Click / tap a grey line' },
    onStart(g) {
      const R = 150, C = 180, W = 360;
      const pts = range(6).map((i) => [C + R * Math.cos(-Math.PI / 2 + i * Math.PI / 3), C + R * Math.sin(-Math.PI / 2 + i * Math.PI / 3)]);
      const edges = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) edges.push({ a: i, b: j, owner: 0 });
      let turn = starter;
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${W}`); svg.setAttribute('class', 'gsvg'); svg.style.width = Math.min(W, window.innerWidth - 24) + 'px'; svg.style.background = '#1c2238';
      const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      const lines = edges.map((e, i) => {
        const [x1, y1] = pts[e.a], [x2, y2] = pts[e.b];
        const l = mk('line', { x1, y1, x2, y2, stroke: '#3a4569', 'stroke-width': 6, 'stroke-linecap': 'round' });
        const hit = mk('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 22, class: 'line' }); hit.style.cursor = 'pointer';
        hit.addEventListener('pointerenter', () => { if (!e.owner && !g.over) l.setAttribute('stroke', g.color(turn) + '88'); });
        hit.addEventListener('pointerleave', () => { if (!e.owner) l.setAttribute('stroke', '#3a4569'); });
        hit.addEventListener('click', () => play(i));
        svg.append(l, hit); return l;
      });
      pts.forEach(([x, y], i) => { svg.appendChild(mk('circle', { cx: x, cy: y, r: 12, fill: '#e8ecf8' })); const t = mk('text', { x, y: y + 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#0e1020' }); t.textContent = 'ABCDEF'[i]; svg.appendChild(t); });
      g.stage.appendChild(svg);
      const ownerOf = (a, b) => edges.find((e) => (e.a === Math.min(a, b) && e.b === Math.max(a, b))).owner;
      function play(i) {
        if (g.over || edges[i].owner) return g.sfx('bad');
        edges[i].owner = turn; lines[i].setAttribute('stroke', g.color(turn)); g.sfx('move');
        const { a, b } = edges[i];
        for (let k = 0; k < 6; k++) { if (k === a || k === b) continue; if (ownerOf(a, k) === turn && ownerOf(b, k) === turn) { [[a, b], [a, k], [b, k]].forEach(([x, y]) => { const idx = edges.findIndex((e) => e.a === Math.min(x, y) && e.b === Math.max(x, y)); lines[idx].setAttribute('stroke-width', 12); lines[idx].setAttribute('stroke', '#ffd43b'); }); starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} completed triangle ${'ABCDEF'[a]}${'ABCDEF'[b]}${'ABCDEF'[k]}.`); } }
        turn = 3 - turn; g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>'s turn · ${edges.filter((e) => !e.owner).length} lines left`);
      }
      g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span>'s turn · 15 lines left`);
    },
  });
})();
