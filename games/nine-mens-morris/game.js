/* Nine Men's Morris — placing, moving, flying; mills remove enemy pieces. */
(function () {
  // 24 points, coordinates on a 7x7 grid
  const PTS = [[0, 0], [0, 3], [0, 6], [1, 1], [1, 3], [1, 5], [2, 2], [2, 3], [2, 4], [3, 0], [3, 1], [3, 2], [3, 4], [3, 5], [3, 6], [4, 2], [4, 3], [4, 4], [5, 1], [5, 3], [5, 5], [6, 0], [6, 3], [6, 6]];
  const MILLS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23], [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23]];
  const ADJ = {}; MILLS.forEach(([a, b, c]) => { (ADJ[a] = ADJ[a] || new Set()).add(b); (ADJ[b] = ADJ[b] || new Set()).add(a).add(c); (ADJ[c] = ADJ[c] || new Set()).add(b); });
  let starter = 1;
  Game.init({
    id: 'nine-mens-morris',
    rules: ['<b>Placing:</b> players alternately place their 9 men on empty points.', '<b>Moving:</b> once all men are placed, slide a man to an adjacent empty point. With only 3 men left you may "fly" to any empty point.', 'Forming a mill (three in a row along a line) lets you remove one enemy man (not one in a mill, unless all are).', 'Win by reducing the opponent to two men or leaving them with no legal move.'],
    controls: { all: 'Click / tap a point (or a man, then a highlighted point)' },
    points: true,
    onStart(g) {
      const b = Array(24).fill(0); const hand = { 1: 9, 2: 9 }; const onBoard = { 1: 0, 2: 0 };
      let turn = starter, sel = null, removing = false;
      const S = Math.floor(clamp((Math.min(window.innerWidth, window.innerHeight - 260) - 40) / 6, 40, 70)), PAD = 26, W = 6 * S + PAD * 2;
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${W}`); svg.setAttribute('class', 'gsvg'); svg.style.width = Math.min(W, window.innerWidth - 24) + 'px'; svg.style.background = '#c8a15a';
      const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      const xy = (i) => [PAD + PTS[i][1] * S, PAD + PTS[i][0] * S];
      MILLS.forEach(([a, , c]) => { const [x1, y1] = xy(a), [x2, y2] = xy(c); svg.appendChild(mk('line', { x1, y1, x2, y2, stroke: '#3b2a14', 'stroke-width': 4 })); });
      const nodes = PTS.map((_, i) => { const [cx, cy] = xy(i); const gEl = mk('g', {}); const base = mk('circle', { cx, cy, r: S * 0.16, fill: '#3b2a14' }); const man = mk('circle', { cx, cy, r: S * 0.3, fill: 'transparent', stroke: 'transparent', 'stroke-width': 3 }); const hit = mk('circle', { cx, cy, r: S * 0.45, fill: 'transparent' }); hit.style.cursor = 'pointer'; hit.addEventListener('click', () => click(i)); gEl.append(base, man, hit); svg.appendChild(gEl); return man; });
      const info = h('div', { class: 'row' }, h('span', { class: 'stat' }, h('b', { class: 'pc1', id: 'h1' }, '9'), h('span', {}, 'in hand')), h('span', { class: 'stat' }, h('b', { class: 'pc2', id: 'h2' }, '9'), h('span', {}, 'in hand')));
      g.stage.append(svg, info);
      const inMill = (i) => MILLS.some((m) => m.includes(i) && m.every((k) => b[k] === b[i]));
      const canFly = (p) => onBoard[p] === 3 && hand[p] === 0;
      const movesOf = (i) => canFly(b[i]) ? range(24).filter((k) => !b[k]) : [...ADJ[i]].filter((k) => !b[k]);
      const hasMove = (p) => hand[p] > 0 || range(24).some((i) => b[i] === p && movesOf(i).length);
      function render() {
        nodes.forEach((n, i) => { n.setAttribute('fill', b[i] ? g.color(b[i]) : 'transparent'); n.setAttribute('stroke', sel === i ? '#fff' : (removing && b[i] === 3 - turn && (!inMill(i) || range(24).filter((k) => b[k] === 3 - turn).every(inMill))) ? '#ffd43b' : 'transparent'); });
        if (sel !== null) movesOf(sel).forEach((k) => nodes[k].setAttribute('fill', g.color(turn) + '55'));
        else if (hand[turn] > 0 && !removing) range(24).forEach((k) => { if (!b[k]) nodes[k].setAttribute('fill', g.color(turn) + '33'); });
        info.querySelector('#h1').textContent = hand[1]; info.querySelector('#h2').textContent = hand[2];
        g.points(onBoard[1] + hand[1], onBoard[2] + hand[2]);
      }
      const phaseText = () => removing ? `<span class="pc${turn}">${esc(g.name(turn))}</span>: mill! remove an enemy man` : hand[turn] > 0 ? `<span class="pc${turn}">${esc(g.name(turn))}</span> places a man` : canFly(turn) ? `<span class="pc${turn}">${esc(g.name(turn))}</span> flies` : `<span class="pc${turn}">${esc(g.name(turn))}</span> moves a man`;
      function endTurn() {
        turn = 3 - turn; sel = null; removing = false; render();
        if (onBoard[turn] + hand[turn] <= 2) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} is down to two men.`); }
        if (!hasMove(turn)) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} cannot move.`); }
        g.turn(turn, phaseText());
      }
      function click(i) {
        if (g.over) return;
        if (removing) {
          if (b[i] !== 3 - turn) return g.sfx('bad');
          const all = range(24).filter((k) => b[k] === 3 - turn);
          if (inMill(i) && !all.every(inMill)) return g.sfx('bad');
          b[i] = 0; onBoard[3 - turn]--; g.sfx('capture'); return endTurn();
        }
        if (hand[turn] > 0) {
          if (b[i]) return g.sfx('bad');
          b[i] = turn; hand[turn]--; onBoard[turn]++; g.sfx('move');
          if (inMill(i)) { removing = true; render(); g.turn(turn, phaseText()); g.sfx('score'); return; }
          return endTurn();
        }
        if (sel !== null && movesOf(sel).includes(i)) { b[i] = turn; b[sel] = 0; sel = null; g.sfx('move'); if (inMill(i)) { removing = true; render(); g.turn(turn, phaseText()); g.sfx('score'); return; } return endTurn(); }
        if (b[i] === turn) { sel = sel === i ? null : i; g.sfx('click'); } else sel = null;
        render();
      }
      render(); g.turn(turn, phaseText());
    },
  });
})();
