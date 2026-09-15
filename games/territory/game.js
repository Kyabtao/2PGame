/* Territory — 9×9 Go: liberties, captures, ko, passes and area scoring. */
(function () {
  const N = 9, KOMI = 3.5, CAP = 120;
  let starter = 1;
  Game.init({
    id: 'territory',
    rules: [
      'Black and White take turns putting a stone on an empty intersection. A stone or chain with no free neighbour (liberty) is captured and removed.',
      'You may not play a move that makes your own chain breathless, and you may not repeat the previous position (ko).',
      'A player with no legal move at all is forced to pass, so a filled board decides itself.',
      'Playing a move inside a fully surrounded empty region is suicide — pass instead. Two passes in a row end the game.',
      `Area scoring: your stones plus every empty region bordered only by your colour. The second player gets ${KOMI} compensation (komi), and the half point means no draws.`,
    ],
    controls: { all: 'Tap an intersection to play · ⏭ to pass · ↺ undoes the last move' },
    points: true,
    onStart(g) {
      let b = range(N).map(() => Array(N).fill(0));
      let turn = starter, passes = 0, plies = 0, prevKey = '', koKey = '';
      const taken = [];
      const grid = UI.grid({ rows: N, cols: N, gap: 1, onClick: play });
      grid.el.style.background = '#c8a15a'; grid.el.style.padding = '5px';
      grid.each((cell) => { cell.style.background = '#d9b46c'; cell.classList.add('static'); });
      const bar = h('div', { class: 'row' });
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(grid.el, bar, note);
      const keyOf = (bd, t) => bd.map((row) => row.join('')).join('/') + t;
      const groups = (bd) => {
        const seen = range(N).map(() => Array(N).fill(0)); const out = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          if (!bd[r][c] || seen[r][c]) continue;
          const col = bd[r][c]; const st = [[r, c]]; const cells = []; let libs = 0; const libSeen = range(N).map(() => Array(N).fill(0));
          seen[r][c] = 1;
          while (st.length) {
            const [cr, cc] = st.pop(); cells.push([cr, cc]);
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const rr = cr + dr, cc2 = cc + dc;
              if (rr < 0 || rr >= N || cc2 < 0 || cc2 >= N) continue;
              if (!bd[rr][cc2]) { if (!libSeen[rr][cc2]) { libSeen[rr][cc2] = 1; libs++; } continue; }
              if (bd[rr][cc2] === col && !seen[rr][cc2]) { seen[rr][cc2] = 1; st.push([rr, cc2]); }
            }
          }
          out.push({ col, cells, libs });
        }
        return out;
      };
      const stones = () => { const o = { 1: 0, 2: 0 }; b.forEach((row) => row.forEach((v) => { if (v) o[v]++; })); return o; };
      function areaScore() {
        const st = stones(); const terr = { 1: 0, 2: 0 };
        const seen = range(N).map(() => Array(N).fill(0));
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          if (b[r][c] || seen[r][c]) continue;
          const stack = [[r, c]], region = [];
          seen[r][c] = 1;
          while (stack.length) {
            const [cr, cc] = stack.pop(); region.push([cr, cc]);
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const rr = cr + dr, cc2 = cc + dc;
              if (rr < 0 || rr >= N || cc2 < 0 || cc2 >= N) continue;
              if (b[rr][cc2]) continue;                 // stones are not territory
              if (!seen[rr][cc2]) { seen[rr][cc2] = 1; stack.push([rr, cc2]); }
            }
          }
          const border1 = region.some(([cr, cc]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => { const rr = cr + dr, cc2 = cc + dc; return rr >= 0 && rr < N && cc2 >= 0 && cc2 < N && b[rr][cc2] === 1; }));
          const border2 = region.some(([cr, cc]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => { const rr = cr + dr, cc2 = cc + dc; return rr >= 0 && rr < N && cc2 >= 0 && cc2 < N && b[rr][cc2] === 2; }));
          if (border1 && !border2) terr[1] += region.length;
          else if (border2 && !border1) terr[2] += region.length;
        }
        return { total: { 1: st[1] + terr[1], 2: st[2] + terr[2] + KOMI }, st, terr };
      }
      function render() {
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell static';
          if (b[r][c]) cell.appendChild(h('div', { class: 'piece', style: { width: '92%', height: '92%', background: b[r][c] === 1 ? '#12121a' : '#fbfbf5', border: '1px solid #0003' } }));
        });
        const last = taken[taken.length - 1];
        if (last) grid.at(last[0], last[1]).classList.add('hl');
        const sc = areaScore();
        g.points(Math.floor(sc.total[1] * 10) / 10, sc.total[2]);
        note.textContent = `stones ${sc.st[1]}/${sc.st[2]} · territory ${sc.terr[1]}/${sc.terr[2]} · score ${sc.total[1].toFixed(1)}–${sc.total[2].toFixed(1)} · ply ${plies}/${CAP}`;
      }
      function tryPlace(r, c, p) {
        const nb = b.map((row) => row.slice());
        nb[r][c] = p;
        const enemy = 3 - p;
        let captured = 0;
        const gs = groups(nb);
        for (const grp of gs) if (grp.col === enemy && grp.libs === 0) { grp.cells.forEach(([rr, cc]) => { nb[rr][cc] = 0; captured++; }); }
        const mine = groups(nb).find((x) => x.col === p && x.cells.some(([rr, cc]) => rr === r && cc === c));
        if (!mine || mine.libs === 0) return null;   // suicide
        const k = keyOf(nb, enemy);
        if (k === koKey) return null;                 // ko
        return { nb, captured };
      }
      function play(r, c) {
        if (g.over || b[r][c]) return g.sfx('bad');
        const res = tryPlace(r, c, turn);
        if (!res) { g.sfx('bad'); g.toast('Illegal: no liberties or ko', 900); return; }
        koKey = keyOf(b, 3 - turn);
        b = res.nb; passes = 0; plies++;
        taken.push([r, c]);
        g.sfx(res.captured ? 'capture' : 'move');
        if (res.captured) g.toast(`${res.captured} stone${res.captured > 1 ? 's' : ''} captured`, 800);
        nextTurn();
      }
      function pass() {
        if (g.over) return;
        passes++; plies++; koKey = ''; g.sfx('click');
        g.toast(`${esc(g.name(turn))} passes`, 700);
        if (passes >= 2) return end();
        nextTurn();
      }
      function undo() {
        if (g.over || !history.length) return;
        const h0 = history.pop(); b = h0.b.map((row) => row.slice()); turn = h0.turn; plies = h0.plies; passes = h0.passes; koKey = h0.koKey; taken.length = h0.taken;
        g.turn(turn); render();
      }
      let history = [];
      const pushHist = () => history.push({ b: b.map((row) => row.slice()), turn, plies, passes, koKey, taken: taken.length });
      const anyLegal = (p) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!b[r][c] && tryPlace(r, c, p)) return true; return false; };
      function nextTurn() {
        pushHist();
        turn = 3 - turn;
        render();
        if (plies >= CAP) return end();
        if (!anyLegal(turn)) {                    // nowhere left to play: a forced pass keeps the game finite
          passes++;
          g.toast(`${esc(g.name(turn))} has no legal move — pass`, 900);
          if (passes >= 2 || !anyLegal(3 - turn)) return end();
          turn = 3 - turn;
        }
        g.turn(turn); render();
      }
      function end() {
        const sc = areaScore();
        const white = 3 - starter;                      // the player who received komi
        starter = 3 - starter;
        if (Math.abs(sc.total[1] - sc.total[2]) < 0.01) return g.draw(`Area score dead level at ${sc.total[1].toFixed(1)}.`);
        const w = sc.total[1] > sc.total[2] ? 1 : 2;
        g.win(w, `Area score ${sc.total[1].toFixed(1)} – ${sc.total[2].toFixed(1)} · stones ${sc.st[1]}/${sc.st[2]}, territory ${sc.terr[1]}/${sc.terr[2]}, komi ${KOMI} to ${esc(g.name(white))}.`);
      }
      const chips = UI.chips([{ label: '⏭ Pass', onClick: pass }, { label: '↶ Undo', onClick: undo }], { cls: 'row' });
      bar.appendChild(chips.el);
      g.key(['KeyP'], pass);
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
