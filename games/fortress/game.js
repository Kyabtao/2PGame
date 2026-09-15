/* Fortress — march a warrior, lay walls, and batter the enemy keep four times. */
(function () {
  const N = 7, HP = 4, WALLS = 8, CAP = 70;
  let starter = 1;
  Game.init({
    id: 'fortress',
    rules: [
      `Each side holds a keep (🏰) with ${HP} health in an opposite corner of the ${N}×${N} field, plus one warrior.`,
      'On your turn do one of: march the warrior one square (never onto a keep, a wall or the enemy warrior), raise a wall on a free square next to your warrior (you have 8), or siege the enemy keep if you stand next to it.',
      'After a siege your warrior must march at least two more squares before it can attack again — battering ram cooldown.',
      `Raze the enemy keep to win. If ${CAP} turns go by, the keep with more health left wins.`,
    ],
    controls: { all: 'Tap the warrior to march · tap a free square beside it to wall · ⚔️ to assault' },
    points: true,
    onStart(g) {
      const keep = { 1: [N - 1, 0], 2: [0, N - 1] };
      const wall = range(N).map(() => Array(N).fill(0));
      const hp = { 1: HP, 2: HP };
      const pos = { 1: [N - 1, 1], 2: [0, N - 2] };
      let turn = starter, walls = { 1: WALLS, 2: WALLS }, cool = { 1: 0, 2: 0 }, plies = 0;
      wall[keep[1][0]][keep[1][1]] = 1; wall[keep[2][0]][keep[2][1]] = 2;
      const grid = UI.grid({ rows: N, cols: N, gap: 3, onClick: click });
      const bar = h('div', { class: 'row' }); g.stage.append(grid.el, bar);
      const chips = UI.chips([], { cls: 'row' }); bar.appendChild(chips.el);
      const note = h('div', { class: 'muted', style: { fontSize: '.85rem' } }); g.stage.append(note);
      let mode = 'move';
      const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
      const adj = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
      const march = () => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [pos[turn][0] + dr, pos[turn][1] + dc])
        .filter(([rr, cc]) => inb(rr, cc) && !wall[rr][cc] && !(pos[3 - turn][0] === rr && pos[3 - turn][1] === cc));
      const sites = () => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [pos[turn][0] + dr, pos[turn][1] + dc])
        .filter(([rr, cc]) => inb(rr, cc) && !wall[rr][cc] && !(pos[3 - turn][0] === rr && pos[3 - turn][1] === cc) && !adj([rr, cc], keep[turn]) && walls[turn] > 0);
      const canSiege = () => adj(pos[turn], keep[3 - turn]) && cool[turn] === 0;
      function render() {
        grid.each((cell, r, c) => {
          cell.innerHTML = ''; cell.className = 'cell';
          const isKeep = adj([r, c], [0, 0]);
          if (wall[r][c] === 1 || wall[r][c] === 2) {
            const isK = (keep[1][0] === r && keep[1][1] === c) || (keep[2][0] === r && keep[2][1] === c);
            if (isK) { const own = keep[1][0] === r && keep[1][1] === c ? 1 : 2; cell.style.background = `color-mix(in srgb, ${g.color(own)} 22%, var(--surface2))`; cell.appendChild(h('div', { text: '🏰', style: { fontSize: 'calc(var(--cell) * .7)' } })); cell.appendChild(h('div', { text: '❤'.repeat(hp[own]), style: { position: 'absolute', bottom: 2, fontSize: '.5rem', color: '#ff8787' } })); }
            else { cell.style.background = '#3b2f22'; cell.appendChild(h('div', { text: '🧱', style: { fontSize: 'calc(var(--cell) * .62)' } })); }
          }
          if (pos[turn][0] === r && pos[turn][1] === c) cell.classList.add('hl');
          if (mode === 'move' && march().some(([rr, cc]) => rr === r && cc === c)) cell.classList.add('dot');
          if (mode === 'wall' && sites().some(([rr, cc]) => rr === r && cc === c)) cell.classList.add('dot');
          [1, 2].forEach((p) => { if (pos[p][0] === r && pos[p][1] === c) cell.appendChild(h('div', { class: 'piece p' + p, text: '⚔️', style: { background: 'transparent', boxShadow: `0 0 0 2px ${g.color(p)}`, fontSize: 'calc(var(--cell) * .45)', borderRadius: 10 } })); });
        });
        chips.set([
          { label: '🚶 March', on: mode === 'move', onClick: () => { mode = 'move'; render(); } },
          { label: `🧱 Wall (${walls[turn]})`, on: mode === 'wall', dis: walls[turn] <= 0 || !sites().length, onClick: () => { mode = 'wall'; render(); } },
          { label: canSiege() ? '⚔️ Siege!' : `⚔️ Siege (cool ${cool[turn]})`, dis: !canSiege(), cls: canSiege() ? 'p1' : '', onClick: siege },
        ]);
        g.points(hp[1], hp[2]);
        note.textContent = `Keep health ${hp[1]} vs ${hp[2]} · walls ${walls[1]}/${walls[2]} · turn ${plies}/${CAP}`;
      }
      function click(r, c) {
        if (g.over) return;
        if (mode === 'wall') {
          if (!sites().some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
          wall[r][c] = 3; walls[turn]--; g.sfx('hit'); return afterTurn();
        }
        if (!march().some(([rr, cc]) => rr === r && cc === c)) return g.sfx('bad');
        pos[turn] = [r, c]; g.sfx('move'); if (cool[turn]) cool[turn]--;
        mode = 'move'; afterTurn();
      }
      function siege() {
        if (!canSiege()) return g.sfx('bad');
        hp[3 - turn]--; cool[turn] = 2; g.sfx('explode');
        grid.at(keep[3 - turn][0], keep[3 - turn][1]).classList.add('shake');
        if (hp[3 - turn] <= 0) { starter = 3 - starter; render(); return g.win(turn, `${esc(g.name(turn))} razed the keep after ${plies + 1} turns.`); }
        g.toast(`Keep down to ${hp[3 - turn]}!`, 800);
        afterTurn();
      }
      function afterTurn() {
        plies++; render();
        if (plies >= CAP) {
          starter = 3 - starter;
          if (hp[1] === hp[2]) return g.draw(`Siege called off after ${CAP} turns — keeps still ${hp[1]}–${hp[2]}.`);
          return g.win(hp[1] > hp[2] ? 1 : 2, `Turn limit — keeps standing ${hp[1]} vs ${hp[2]}.`);
        }
        turn = 3 - turn; mode = 'move'; g.turn(turn); render();
      }
      g.turn(turn); render();
    },
    onStop() { starter = 3 - starter; },
  });
})();
