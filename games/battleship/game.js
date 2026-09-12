/* Battleship — pass-the-device. Place 5 ships (random or manual), take turns firing on a 10×10 grid. */
(function () {
  const N = 10; const SHIPS = [{ n: 'Carrier', s: 5 }, { n: 'Battleship', s: 4 }, { n: 'Cruiser', s: 3 }, { n: 'Submarine', s: 3 }, { n: 'Destroyer', s: 2 }];
  let starter = 1;
  Game.init({
    id: 'battleship',
    rules: ['Each player secretly places five ships (5, 4, 3, 3, 2 cells) on their 10×10 grid — tap cells to place, or use "Random fleet".', 'The device is passed between turns so nobody sees the other fleet. On your turn, fire at one cell of the enemy grid: 💥 hit or 〰️ miss.', 'Sink every enemy ship to win.'],
    controls: { all: 'Tap a cell to place ships / fire. <kbd>R</kbd> rotates a ship during placement.' },
    points: true,
    onStart(g) {
      const fleets = { 1: null, 2: null }; const shots = { 1: new Set(), 2: new Set() }; const hits = { 1: 0, 2: 0 };
      let turn = starter;
      const key = (r, c) => r * N + c;
      const randomFleet = () => { let f; do { f = tryPlace(); } while (!f); return f; };
      function tryPlace() {
        const occ = new Set(); const ships = [];
        for (const sh of SHIPS) { let ok = false; for (let t = 0; t < 100 && !ok; t++) { const hor = Math.random() < .5; const r = rnd(hor ? N : N - sh.s + 1), c = rnd(hor ? N - sh.s + 1 : N); const cells = range(sh.s).map((i) => key(hor ? r : r + i, hor ? c + i : c)); if (cells.some((k) => occ.has(k))) continue; cells.forEach((k) => occ.add(k)); ships.push({ n: sh.n, cells, hit: new Set() }); ok = true; } if (!ok) return null; }
        return { ships, occ };
      }
      const owns = (fleet, k) => fleet.ships.find((s) => s.cells.includes(k));
      // ---------- placement ----------
      async function placement(p) {
        await g.pass(p, 'Place your fleet in secret.');
        return new Promise((resolve) => {
          g.stage.innerHTML = '';
          let idx = 0, hor = true; const occ = new Set(); const ships = [];
          const grid = UI.grid({ rows: N, cols: N, gap: 2, size: Math.floor(clamp((Math.min(window.innerWidth, window.innerHeight - 300) - 40) / N, 24, 40)), onClick: (r, c) => { if (idx >= SHIPS.length) return; const sh = SHIPS[idx]; const cells = range(sh.s).map((i) => key(hor ? r : r + i, hor ? c + i : c)); const okb = hor ? c + sh.s <= N : r + sh.s <= N; if (!okb || cells.some((k) => occ.has(k))) return g.sfx('bad'); cells.forEach((k) => occ.add(k)); ships.push({ n: sh.n, cells, hit: new Set() }); idx++; g.sfx('move'); render(); } });
          grid.el.style.background = '#0e2a4a'; grid.each((cell) => { cell.style.background = '#164a7a'; cell.addEventListener('mouseenter', () => preview(cell, true)); cell.addEventListener('mouseleave', () => preview(cell, false)); });
          const title = h('div', { class: 'bigmsg pc' + p }); const rot = h('button', { class: 'btn', text: '⟳ Rotate (R)', onclick: () => { hor = !hor; } });
          const rand = h('button', { class: 'btn', text: '🎲 Random fleet', onclick: () => { const f = randomFleet(); occ.clear(); ships.length = 0; f.ships.forEach((s) => { ships.push(s); s.cells.forEach((k) => occ.add(k)); }); idx = SHIPS.length; render(); } });
          const clear = h('button', { class: 'btn ghost', text: 'Clear', onclick: () => { occ.clear(); ships.length = 0; idx = 0; render(); } });
          const done = h('button', { class: 'btn primary', text: 'Ready ✔', disabled: true, onclick: () => { fleets[p] = { ships, occ }; off(); resolve(); } });
          g.stage.append(title, grid.el, h('div', { class: 'row' }, rot, rand, clear, done));
          const off = g.key('KeyR', () => { hor = !hor; });
          function preview(cell, on) { if (idx >= SHIPS.length) return; const r = +cell.dataset.r, c = +cell.dataset.c; const sh = SHIPS[idx]; range(sh.s).forEach((i) => { const rr = hor ? r : r + i, cc = hor ? c + i : c; if (rr < N && cc < N && !occ.has(key(rr, cc))) grid.at(rr, cc).style.background = on ? '#3d8bd6' : '#164a7a'; }); }
          function render() { grid.each((cell, r, c) => { cell.style.background = occ.has(key(r, c)) ? '#9aa4c7' : '#164a7a'; }); title.textContent = idx < SHIPS.length ? `${g.name(p)}: place your ${SHIPS[idx].n} (${SHIPS[idx].s})` : `${g.name(p)}: fleet ready!`; done.disabled = idx < SHIPS.length; }
          render(); g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> places ships`);
        });
      }
      // ---------- firing ----------
      async function fireTurn() {
        if (g.over) return;
        const p = turn, e = 3 - turn;
        await g.pass(p, 'Your turn to fire.');
        if (g.over) return;
        g.stage.innerHTML = '';
        const size = Math.floor(clamp((Math.min(window.innerWidth, window.innerHeight - 320) - 40) / N, 22, 38));
        const enemy = UI.grid({ rows: N, cols: N, gap: 2, size, onClick: (r, c) => fire(r, c) });
        enemy.el.style.background = '#0e2a4a';
        const mine = UI.grid({ rows: N, cols: N, gap: 1, size: Math.floor(size * .55) }); mine.el.style.background = '#0e2a4a';
        const paint = () => {
          enemy.each((cell, r, c) => { const k = key(r, c); cell.style.background = '#164a7a'; cell.textContent = ''; cell.classList.add('static'); if (shots[p].has(k)) { const hit = fleets[e].occ.has(k); cell.textContent = hit ? '💥' : '〰️'; cell.style.background = hit ? '#7a1f1f' : '#0b1e33'; const sh = hit && owns(fleets[e], k); if (sh && sh.hit.size === sh.cells.length) cell.style.background = '#3a0a0a'; } });
          mine.each((cell, r, c) => { const k = key(r, c); cell.classList.add('static'); cell.style.fontSize = '10px'; cell.style.background = fleets[p].occ.has(k) ? '#9aa4c7' : '#164a7a'; cell.textContent = shots[e].has(k) ? (fleets[p].occ.has(k) ? '💥' : '·') : ''; });
        };
        const status = h('div', { class: 'bigmsg', style: { fontSize: '1.1rem' } }, `Fire at ${g.name(e)}'s waters`);
        const sunkList = h('div', { class: 'muted', style: { fontSize: '.85rem' } }, 'Sunk: ' + (fleets[e].ships.filter((s) => s.hit.size === s.cells.length).map((s) => s.n).join(', ') || 'none'));
        const nextBtn = h('button', { class: 'btn primary', text: 'End turn ▶', hidden: true, onclick: () => { turn = 3 - turn; fireTurn(); } });
        g.stage.append(status, h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '1.2rem' } }, h('div', { class: 'col' }, h('span', { class: 'tag' }, 'Enemy waters'), enemy.el), h('div', { class: 'col' }, h('span', { class: 'tag' }, 'Your fleet'), mine.el)), sunkList, nextBtn);
        paint(); g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> fires`); g.points(hits[1], hits[2]);
        let fired = false;
        function fire(r, c) {
          const k = key(r, c); if (fired || shots[p].has(k) || g.over) return g.sfx('bad');
          fired = true; shots[p].add(k);
          const sh = owns(fleets[e], k);
          if (sh) { sh.hit.add(k); hits[p]++; g.points(hits[1], hits[2]); const sunk = sh.hit.size === sh.cells.length; g.sfx(sunk ? 'explode' : 'hit'); status.innerHTML = sunk ? `💥 You sank the <b>${sh.n}</b>!` : '💥 Hit!'; if (fleets[e].ships.every((s) => s.hit.size === s.cells.length)) { paint(); starter = e; return g.win(p, `${esc(g.name(p))} sank the whole fleet in ${shots[p].size} shots.`); } }
          else { g.sfx('bounce'); status.textContent = '〰️ Miss.'; }
          paint(); sunkList.textContent = 'Sunk: ' + (fleets[e].ships.filter((s) => s.hit.size === s.cells.length).map((s) => s.n).join(', ') || 'none');
          nextBtn.hidden = false;
        }
      }
      (async () => { await placement(1); if (g.over) return; await placement(2); if (g.over) return; fireTurn(); })();
    },
  });
})();
