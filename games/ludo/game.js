/* Ludo (2-player) — 4 tokens each on a 52-square track, 6 to leave base, captures, safe squares, 6 rolls again. */
(function () {
  let starter = 1;
  const TRACK = 52, HOME = 6;
  const START = { 1: 0, 2: 26 };
  const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
  Game.init({
    id: 'ludo',
    rules: ['Four tokens each. Roll a 6 to bring a token out of base; a 6 also grants another roll.', 'Move tokens clockwise around the track. Landing on a lone enemy token (not on a ★ safe square) sends it back to base.', 'After a full lap, tokens turn into the home column and need an exact roll to finish. First to get all four tokens home wins.'],
    controls: { all: '<kbd>Space</kbd> roll · tap a token to move it' },
    points: true,
    onStart(g) {
      // token positions: -1 = base, 0..51 = steps taken along track from own START, 52..57 = home column, 58 = finished
      const tok = { 1: [-1, -1, -1, -1], 2: [-1, -1, -1, -1] }; let turn = starter, roll = 0, busy = false, sixes = 0;
      const S = 15; const N = 15;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', `0 0 ${N * S} ${N * S}`); svg.setAttribute('class', 'gsvg'); svg.style.maxWidth = '520px';
      g.stage.appendChild(svg);
      const die = UI.die(1); const rollBtn = h('button', { class: 'btn primary big', text: '🎲 Roll (Space)', onclick: doRoll });
      g.stage.appendChild(h('div', { class: 'row' }, die, rollBtn));
      // board coordinates for the 52-square track (standard ludo cross), starting at P1's start square (left arm, going right on the middle-top row)
      const cells = [];
      (function build() {
        const push = (c, r) => cells.push([c, r]);
        for (let c = 1; c <= 5; c++) push(c, 6); // 0..4
        for (let r = 5; r >= 0; r--) push(6, r); // 5..10
        push(7, 0); // 11
        for (let r = 0; r <= 5; r++) push(8, r); // 12..17
        for (let c = 9; c <= 14; c++) push(c, 6); // 18..23
        push(14, 7); // 24
        for (let c = 14; c >= 9; c--) push(c, 8); // 25..30
        for (let r = 9; r <= 14; r++) push(8, r); // 31..36
        push(7, 14); // 37
        for (let r = 14; r >= 9; r--) push(6, r); // 38..43
        for (let c = 5; c >= 0; c--) push(c, 8); // 44..49
        push(0, 7); // 50
        push(0, 6); // 51
      })();
      const homeCol = { 1: range(6).map((i) => [1 + i, 7]), 2: range(6).map((i) => [13 - i, 7]) };
      const baseSpots = { 1: [[1.5, 1.5], [3.5, 1.5], [1.5, 3.5], [3.5, 3.5]], 2: [[10.5, 10.5], [12.5, 10.5], [10.5, 12.5], [12.5, 12.5]] };
      const NS = 'http://www.w3.org/2000/svg';
      const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
      const posOf = (p, s) => { if (s < 0) return null; if (s >= 52 && s < 58) return homeCol[p][s - 52]; if (s >= 58) return [7, 7]; return cells[(START[p] + s) % TRACK]; };
      const render = () => {
        svg.innerHTML = '';
        svg.appendChild(el('rect', { x: 0, y: 0, width: N * S, height: N * S, fill: '#1a1d2e', rx: 8 }));
        svg.appendChild(el('rect', { x: 0, y: 0, width: 6 * S, height: 6 * S, fill: g.color(1), opacity: 0.25 }));
        svg.appendChild(el('rect', { x: 9 * S, y: 9 * S, width: 6 * S, height: 6 * S, fill: g.color(2), opacity: 0.25 }));
        cells.forEach(([c, r], i) => { const trackIdx = i; const owner = trackIdx === START[1] ? 1 : trackIdx === START[2] ? 2 : 0; svg.appendChild(el('rect', { x: c * S + 0.5, y: r * S + 0.5, width: S - 1, height: S - 1, fill: owner ? g.color(owner) : '#f1f3f5', opacity: owner ? 0.8 : 0.9, rx: 2 })); if (SAFE.has(trackIdx)) { const t = el('text', { x: c * S + S / 2, y: r * S + S / 2 + 3.5, 'text-anchor': 'middle', 'font-size': 9, fill: '#555' }); t.textContent = '★'; svg.appendChild(t); } });
        for (const p of [1, 2]) homeCol[p].forEach(([c, r]) => svg.appendChild(el('rect', { x: c * S + 0.5, y: r * S + 0.5, width: S - 1, height: S - 1, fill: g.color(p), opacity: 0.6, rx: 2 })));
        svg.appendChild(el('rect', { x: 6 * S, y: 6 * S, width: 3 * S, height: 3 * S, fill: '#ffd43b', rx: 3 }));
        const tt = el('text', { x: 7.5 * S, y: 7.5 * S + 4, 'text-anchor': 'middle', 'font-size': 12 }); tt.textContent = '🏠'; svg.appendChild(tt);
        const legal = roll ? legalMoves(turn) : [];
        for (const p of [1, 2]) tok[p].forEach((s, i) => {
          let [cx, cy] = s < 0 ? baseSpots[p][i] : posOf(p, s).map((v) => v + 0.5);
          if (s >= 58) { cx = 7.5 + (p === 1 ? -0.5 : 0.5); cy = 7.5 + (i - 1.5) * 0.4; }
          const stack = s >= 0 && s < 58 ? tok[p].filter((x) => x === s).length : 1; const k = s >= 0 && s < 58 ? tok[p].filter((x, j) => x === s && j < i).length : 0; const off = stack > 1 ? (k - (stack - 1) / 2) * 4 : 0;
          const c = el('circle', { cx: cx * S + off, cy: cy * S, r: S * 0.36, fill: g.color(p), stroke: legal.includes(i) && p === turn ? '#ffd43b' : '#111', 'stroke-width': legal.includes(i) && p === turn ? 2.5 : 1.2, class: legal.includes(i) && p === turn ? 'clickable' : '' });
          c.style.cursor = legal.includes(i) && p === turn ? 'pointer' : 'default';
          if (legal.includes(i) && p === turn) c.addEventListener('click', () => move(i));
          svg.appendChild(c);
        });
        g.points(tok[1].filter((s) => s >= 58).length, tok[2].filter((s) => s >= 58).length);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${roll ? `rolled ${roll} — pick a token` : 'roll the die'}`);
        rollBtn.disabled = !!roll; rollBtn.className = 'btn big primary p' + turn;
      };
      const legalMoves = (p) => tok[p].map((s, i) => { if (s >= 58) return -1; if (s < 0) return roll === 6 ? i : -1; const n = s + roll; if (n > 58) return -1; if (n < 52 && tok[p].some((x, j) => j !== i && x === n)) return -1; return i; }).filter((i) => i >= 0);
      async function doRoll() {
        if (roll || busy || g.over) return; busy = true;
        for (let k = 0; k < 6; k++) { UI.setDie(die, rnd(1, 6)); await sleep(50); }
        roll = rnd(1, 6); UI.setDie(die, roll); g.sfx('move'); busy = false;
        if (roll === 6) { sixes++; if (sixes === 3) { g.toast('Three sixes — turn lost!', 1200); roll = 0; sixes = 0; turn = 3 - turn; render(); return; } } else sixes = 0;
        render();
        const legal = legalMoves(turn);
        if (!legal.length) { g.toast('No legal move', 900); await sleep(900); if (g.over) return; const again = roll === 6; roll = 0; if (!again) { turn = 3 - turn; sixes = 0; } render(); }
        else if (legal.length === 1 && tok[turn][legal[0]] >= 0) { await sleep(400); if (g.over) return; move(legal[0]); }
      }
      function move(i) {
        if (!roll || busy || g.over) return; const p = turn; const s = tok[p][i]; const n = s < 0 ? 0 : s + roll; tok[p][i] = n; g.sfx('click');
        let captured = false;
        if (n < 52) { const abs = (START[p] + n) % TRACK; const o = 3 - p; if (!SAFE.has(abs)) tok[o].forEach((x, j) => { if (x >= 0 && x < 52 && (START[o] + x) % TRACK === abs) { tok[o][j] = -1; captured = true; } }); }
        if (captured) { g.sfx('capture'); g.toast('Captured!', 800); }
        if (n === 58) g.sfx('coin');
        if (tok[p].every((x) => x >= 58)) { render(); starter = 3 - starter; return g.win(p, `All four tokens home; ${g.name(3 - p)} had ${tok[3 - p].filter((x) => x >= 58).length}.`); }
        const again = roll === 6 || captured || n === 58; roll = 0; if (!again) { turn = 3 - turn; sixes = 0; } render();
      }
      render();
      g.key('Space', doRoll);
    },
  });
})();
