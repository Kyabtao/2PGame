/* Hex-a-Gone — hexagonal Isolation: step to a neighbouring tile, the tile you leave is gone. */
(function () {
  const R = 3;
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  let starter = 1;
  Game.init({
    id: 'hex-a-gone',
    rules: [
      `A honeycomb of ${R * 6 + 1} tiles, one token on each of two opposite corners. On your turn step onto a neighbouring tile.`,
      'The tile you stand on collapses into a hole as you leave it, so the field only ever shrinks.',
      'Holes cannot be entered or jumped over — there is no jumping at all on a hex board.',
      'The first token with no free neighbour loses. Trap your rival before they trap you.',
    ],
    controls: { all: 'Tap a highlighted neighbouring tile' },
    onStart(g) {
      const cells = [];
      for (let q = -R; q <= R; q++) for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) cells.push([q, r]);
      const key = (q, r) => q + ',' + r;
      const tile = {}; cells.forEach(([q, r]) => { tile[key(q, r)] = 1; });
      const has = (q, r) => !!tile[key(q, r)];
      const corners = cells.map(([q, r]) => ({ q, r, s: Math.abs(q) === R && Math.abs(r) === R ? 1 : 0 })).filter((x) => x.s);
      const far = corners.find((c) => c.q === R && c.r === -R) || corners[0];
      const near = corners.find((c) => c.q === -R && c.r === R) || corners[corners.length - 1];
      const pos = { 1: [far.q, far.r], 2: [near.q, near.r] };
      let turn = starter, holes = 0;
      const SIZE = 26, NS = 'http://www.w3.org/2000/svg';
      const W = Math.ceil(SIZE * Math.sqrt(3) * (2 * R + 1.6)), H = Math.ceil(SIZE * 1.5 * 2 * R + SIZE * 2.4);
      const cx = (q, r) => SIZE * Math.sqrt(3) * (q + r / 2) + W / 2;
      const cy = (q, r) => SIZE * 1.5 * r + H / 2;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'gsvg');
      svg.style.width = Math.min(W, window.innerWidth - 28) + 'px';
      const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
      const poly = (q, r) => {
        const pts = [];
        for (let i = 0; i < 6; i++) { const a = (Math.PI / 180) * (60 * i - 30); pts.push((cx(q, r) + SIZE * 0.94 * Math.cos(a)).toFixed(1) + ',' + (cy(q, r) + SIZE * 0.94 * Math.sin(a)).toFixed(1)); }
        return pts.join(' ');
      };
      const el = {};
      cells.forEach(([q, r]) => {
        const p = mk('polygon', { points: poly(q, r), fill: '#2c3654', stroke: '#12172a', 'stroke-width': 3 });
        p.style.cursor = 'pointer';
        p.addEventListener('click', () => click(q, r));
        svg.appendChild(p); el[key(q, r)] = p;
      });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(svg, note);
      const opts = (p) => DIRS.map(([dq, dr]) => [pos[p][0] + dq, pos[p][1] + dr]).filter(([qq, rr]) => has(qq, rr) && !(pos[3 - p][0] === qq && pos[3 - p][1] === rr));
      function render() {
        const o = opts(turn);
        cells.forEach(([q, r]) => {
          const k = key(q, r);
          el[k].setAttribute('fill', has(q, r) ? '#2c3654' : '#0b0f1c');
          el[k].setAttribute('stroke', '#12172a');
        });
        o.forEach(([qq, rr]) => { el[key(qq, rr)].setAttribute('fill', g.color(turn) + '55'); el[key(qq, rr)].setAttribute('stroke', g.color(turn)); });
        // remove old tokens then redraw
        [...svg.querySelectorAll('circle.tok')].forEach((c) => c.remove());
        [1, 2].forEach((p) => { const t = mk('circle', { class: 'tok', cx: cx(pos[p][0], pos[p][1]), cy: cy(pos[p][0], pos[p][1]), r: SIZE * 0.46, fill: g.color(p), stroke: '#ffffffcc', 'stroke-width': 2 }); svg.appendChild(t); });
        note.textContent = `${holes} holes burned · ${o.length} legal steps for ${g.name(turn)}`;
      }
      function click(q, r) {
        if (g.over) return;
        if (!opts(turn).some(([qq, rr]) => qq === q && rr === r)) return g.sfx('bad');
        tile[key(pos[turn][0], pos[turn][1])] = 0; holes++;
        pos[turn] = [q, r];
        g.sfx('move');
        render();
        turn = 3 - turn;
        if (!opts(turn).length) { starter = 3 - starter; return g.win(3 - turn, `${esc(g.name(turn))} is walled in with ${holes} holes in the comb.`); }
        g.turn(turn); render();
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
