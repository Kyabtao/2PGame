/* Backgammon — full movement rules: bar entry, hitting, bearing off, doubles, must-play-maximum dice. */
(function () {
  let starter = 1;
  Game.init({
    id: 'backgammon',
    rules: ['Move your 15 checkers around the board into your home (bottom-right for Red, top-right for Blue) and bear them off. Roll two dice; each die is a separate move (doubles = four moves).', 'You can\'t land on a point with two or more enemy checkers. Landing on a single enemy checker hits it to the bar; a player with checkers on the bar must re-enter them first.', 'You must play as many dice as possible. First to bear off all 15 wins — a gammon (opponent bore off none) counts double in the detail.'],
    controls: { all: '<kbd>Space</kbd> roll · tap a checker, then a highlighted point · <b>Undo</b> within a turn' },
    points: true,
    onStart(g) {
      const u = 40, W = 14 * u, H = 10 * u;
      let state = { board: Array(24).fill(0), bar: { 1: 0, 2: 0 }, off: { 1: 0, 2: 0 } };
      [[23, 2], [12, 5], [7, 3], [5, 5]].forEach(([i, n]) => { state.board[i] = n; }); [[0, 2], [11, 5], [16, 3], [18, 5]].forEach(([i, n]) => { state.board[i] = -n; });
      let turn = starter, dice = [], sel = null, busy = false, history = [];
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'gsvg'); svg.style.maxWidth = '720px'; g.stage.appendChild(svg);
      const d1 = UI.die(1, { small: true }), d2 = UI.die(1, { small: true });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll (Space)', onclick: roll }); const undoBtn = h('button', { class: 'btn', text: '↶ Undo', onclick: undo });
      g.stage.appendChild(h('div', { class: 'row' }, h('div', { class: 'dice' }, d1, d2), rollBtn, undoBtn));
      const NS = 'http://www.w3.org/2000/svg'; const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
      const sg = (p) => p === 1 ? 1 : -1; const dir = (p) => p === 1 ? -1 : 1;
      const own = (s, i, p) => p === 1 ? s.board[i] > 0 : s.board[i] < 0;
      const clone = (s) => ({ board: s.board.slice(), bar: { ...s.bar }, off: { ...s.off } });
      const homeOk = (s, p) => { if (s.bar[p]) return false; for (let i = 0; i < 24; i++) if (own(s, i, p) && (p === 1 ? i > 5 : i < 18)) return false; return true; };
      const canLand = (s, to, p) => p === 1 ? s.board[to] >= -1 : s.board[to] <= 1;
      const movesFor = (s, p, d) => {
        const out = [];
        if (s.bar[p]) { const to = p === 1 ? 24 - d : d - 1; if (canLand(s, to, p)) out.push({ from: 'bar', to, d }); return out; }
        const home = homeOk(s, p);
        for (let i = 0; i < 24; i++) {
          if (!own(s, i, p)) continue; const to = i + dir(p) * d;
          if (to >= 0 && to < 24) { if (canLand(s, to, p)) out.push({ from: i, to, d }); }
          else if (home) { const need = p === 1 ? i + 1 : 24 - i; if (d === need) out.push({ from: i, to: 'off', d }); else if (d > need) { let further = false; for (let j = 0; j < 24; j++) if (own(s, j, p) && (p === 1 ? j > i : j < i)) further = true; if (!further) out.push({ from: i, to: 'off', d }); } }
        }
        return out;
      };
      const applyMove = (s, m, p) => { const n = clone(s); let hit = false; if (m.from === 'bar') n.bar[p]--; else n.board[m.from] -= sg(p); if (m.to === 'off') n.off[p]++; else { if (n.board[m.to] === -sg(p)) { n.board[m.to] = 0; n.bar[3 - p]++; hit = true; } n.board[m.to] += sg(p); } return { n, hit }; };
      const bestLen = (s, p, ds) => { if (!ds.length) return 0; let best = 0; const tried = new Set(); for (let k = 0; k < ds.length; k++) { if (tried.has(ds[k])) continue; tried.add(ds[k]); for (const m of movesFor(s, p, ds[k])) { const rest = ds.slice(); rest.splice(k, 1); best = Math.max(best, 1 + bestLen(applyMove(s, m, p).n, p, rest)); if (best === ds.length) return best; } } return best; };
      const allowed = () => { if (!dice.length) return []; const L = bestLen(state, turn, dice); if (!L) return []; const out = []; const tried = new Set(); for (let k = 0; k < dice.length; k++) { const d = dice[k]; if (tried.has(d)) continue; tried.add(d); for (const m of movesFor(state, turn, d)) { const rest = dice.slice(); rest.splice(k, 1); if (1 + bestLen(applyMove(state, m, turn).n, turn, rest) === L) out.push(m); } } if (L === 1 && dice.length === 2 && dice[0] !== dice[1]) { const hi = Math.max(...dice); if (out.some((m) => m.d === hi)) return out.filter((m) => m.d === hi); } return out; };
      const pip = (p) => { let t = state.bar[p] * 25; for (let i = 0; i < 24; i++) if (own(state, i, p)) t += Math.abs(state.board[i]) * (p === 1 ? i + 1 : 24 - i); return t; };
      const colX = (i) => { const col = i < 12 ? 11 - i : i - 12; return (col < 6 ? col : col + 1) * u; };
      const top = (i) => i >= 12;
      function render() {
        svg.innerHTML = '';
        svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#5c3d1e', rx: 6 }));
        svg.appendChild(el('rect', { x: 6 * u, y: 0, width: u, height: H, fill: '#3b2712' }));
        svg.appendChild(el('rect', { x: 13 * u, y: 0, width: u, height: H, fill: '#2a1c0d' }));
        const moves = allowed(); const fromSet = new Set(moves.map((m) => m.from)); const dests = sel === null ? [] : moves.filter((m) => m.from === sel).map((m) => m.to);
        for (let i = 0; i < 24; i++) {
          const x = colX(i); const isTop = top(i); const y0 = isTop ? 0 : H, y1 = isTop ? 4.3 * u : H - 4.3 * u;
          const tri = el('polygon', { points: `${x},${y0} ${x + u},${y0} ${x + u / 2},${y1}`, fill: i % 2 ? '#d9b382' : '#8b4b2b', opacity: dests.includes(i) ? 1 : 0.9, stroke: dests.includes(i) ? '#ffd43b' : 'none', 'stroke-width': 3 }); svg.appendChild(tri);
          const n = Math.abs(state.board[i]); const p = state.board[i] > 0 ? 1 : 2;
          for (let k = 0; k < Math.min(n, 5); k++) { const cy = isTop ? (k + 0.5) * 0.8 * u + 2 : H - (k + 0.5) * 0.8 * u - 2; const c = el('circle', { cx: x + u / 2, cy, r: u * 0.38, fill: g.color(p), stroke: sel === i && k === Math.min(n, 5) - 1 ? '#ffd43b' : '#111', 'stroke-width': sel === i && k === Math.min(n, 5) - 1 ? 3 : 1.5 }); svg.appendChild(c); }
          if (n > 5) { const t = el('text', { x: x + u / 2, y: isTop ? 4.5 * 0.8 * u : H - 4.3 * 0.8 * u, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#fff' }); t.textContent = n; svg.appendChild(t); }
          const hit = el('rect', { x, y: isTop ? 0 : H / 2, width: u, height: H / 2, fill: 'transparent' }); hit.style.cursor = fromSet.has(i) || dests.includes(i) ? 'pointer' : 'default'; hit.addEventListener('click', () => click(i)); svg.appendChild(hit);
        }
        // bar checkers
        for (const p of [1, 2]) for (let k = 0; k < state.bar[p]; k++) { const cy = p === 1 ? H / 2 + u * 0.5 + k * 10 : H / 2 - u * 0.5 - k * 10; svg.appendChild(el('circle', { cx: 6.5 * u, cy, r: u * 0.38, fill: g.color(p), stroke: sel === 'bar' && p === turn ? '#ffd43b' : '#111', 'stroke-width': 2 })); }
        const barHit = el('rect', { x: 6 * u, y: 0, width: u, height: H, fill: 'transparent' }); barHit.addEventListener('click', () => click('bar')); svg.appendChild(barHit);
        // off trays
        for (const p of [1, 2]) { for (let k = 0; k < state.off[p]; k++) { const y = p === 1 ? H - 6 - k * 5.5 : 6 + k * 5.5; svg.appendChild(el('rect', { x: 13.1 * u, y: y - (p === 1 ? 4 : 0), width: 0.8 * u, height: 4, fill: g.color(p) })); } const t = el('text', { x: 13.5 * u, y: p === 1 ? H / 2 + 24 : H / 2 - 12, 'text-anchor': 'middle', 'font-size': 12, fill: '#fff' }); t.textContent = `${state.off[p]}/15`; svg.appendChild(t); }
        if (dests.includes('off')) svg.appendChild(el('rect', { x: 13 * u, y: turn === 1 ? H / 2 : 0, width: u, height: H / 2, fill: 'none', stroke: '#ffd43b', 'stroke-width': 3 }));
        const offHit = el('rect', { x: 13 * u, y: 0, width: u, height: H, fill: 'transparent' }); offHit.addEventListener('click', () => click('off')); svg.appendChild(offHit);
        const lbl = el('text', { x: 6.5 * u, y: H / 2 + 4, 'text-anchor': 'middle', 'font-size': 10, fill: '#a98' }); lbl.textContent = 'BAR'; svg.appendChild(lbl);
        g.points(state.off[1], state.off[2]); rollBtn.disabled = !!dice.length; undoBtn.disabled = !history.length; rollBtn.className = 'btn primary p' + turn;
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${dice.length ? `dice left: ${dice.join(' ')}` : 'roll'} · pips ${pip(1)} : ${pip(2)}`);
      }
      function click(where) {
        if (busy || g.over || !dice.length) return;
        const moves = allowed();
        if (sel !== null) {
          const opts = moves.filter((m) => m.from === sel && m.to === where);
          if (opts.length) { const m = opts.sort((a, b) => a.d - b.d)[0]; return doMove(m); }
          if (where === sel) { sel = null; return render(); }
        }
        if (moves.some((m) => m.from === where)) { sel = where; g.sfx('click'); return render(); }
      }
      function doMove(m) {
        history.push({ state, dice: dice.slice() });
        const { n, hit } = applyMove(state, m, turn); state = n; dice.splice(dice.indexOf(m.d), 1); sel = null; g.sfx(hit ? 'capture' : m.to === 'off' ? 'coin' : 'move');
        if (hit) g.toast('Hit!', 600);
        if (state.off[turn] === 15) { render(); starter = 3 - starter; const gammon = state.off[3 - turn] === 0; return g.win(turn, `Bore off all 15${gammon ? ' — gammon (double)!' : ''}. ${g.name(3 - turn)} had ${state.off[3 - turn]} off.`); }
        render();
        if (!dice.length || !allowed().length) { if (dice.length) g.toast(`Can't use remaining ${dice.join(' ')}`, 1000); busy = true; g.after(600, () => { busy = false; endTurn(); }); }
        else if (state.bar[turn]) { sel = 'bar'; render(); }
      }
      function undo() { if (busy || g.over || !history.length) return; const hst = history.pop(); state = hst.state; dice = hst.dice; sel = null; g.sfx('click'); render(); }
      function endTurn() { dice = []; history = []; sel = null; turn = 3 - turn; render(); }
      async function roll() {
        if (busy || g.over || dice.length) return; busy = true;
        for (let k = 0; k < 6; k++) { UI.setDie(d1, rnd(1, 6)); UI.setDie(d2, rnd(1, 6)); await sleep(50); }
        const a = rnd(1, 6), b = rnd(1, 6); UI.setDie(d1, a); UI.setDie(d2, b); g.sfx('move');
        dice = a === b ? [a, a, a, a] : [a, b]; history = []; busy = false; sel = state.bar[turn] ? 'bar' : null; render();
        if (!allowed().length) { g.toast('No legal moves', 1000); busy = true; g.after(1000, () => { busy = false; endTurn(); }); }
      }
      g.key('Space', roll); g.key('KeyZ', undo);
      render();
    },
  });
})();
