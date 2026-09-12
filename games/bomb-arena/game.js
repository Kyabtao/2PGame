/* Bomb Arena — Bomberman-style grid, crates, power-ups, one life each. */
(function () {
  const COLS = 15, ROWS = 11, CELL = 44, W = COLS * CELL, H = ROWS * CELL;
  Game.init({
    id: 'bomb-arena',
    rules: ['Drop bombs to blast crates and your rival. Bombs explode after 2.5 seconds in a cross-shaped blast that stops at walls.', 'Crates may hide power-ups: 🔥 longer blast, 💣 extra bomb, 👟 speed.', 'Get caught in any blast (including your own) and you lose. After 2 minutes the arena starts closing in from the edges.'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · bomb <kbd>E</kbd>', p2: 'Arrows · bomb <kbd>/</kbd>' },
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyE', label: 'Bomb' }] }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'Slash', label: 'Bomb' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      // 0 floor, 1 wall, 2 crate
      const map = range(ROWS).map((r) => range(COLS).map((c) => (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 || (r % 2 === 0 && c % 2 === 0)) ? 1 : (Math.random() < 0.7 ? 2 : 0)));
      [[1, 1], [1, 2], [2, 1], [ROWS - 2, COLS - 2], [ROWS - 2, COLS - 3], [ROWS - 3, COLS - 2]].forEach(([r, c]) => { map[r][c] = 0; });
      const pw = {}; // powerups by key
      const pl = { 1: { x: 1.5 * CELL, y: 1.5 * CELL, range: 2, bombs: 1, speed: 120, alive: true }, 2: { x: (COLS - 1.5) * CELL, y: (ROWS - 1.5) * CELL, range: 2, bombs: 1, speed: 120, alive: true } };
      let bombs = [], fires = [], t = 0, shrink = 0;
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      g.key(['KeyE', 'Slash'], (code) => { const p = code === 'KeyE' ? 1 : 2; const s = pl[p]; if (!s.alive) return; const c = Math.floor(s.x / CELL), r = Math.floor(s.y / CELL); if (bombs.filter((b) => b.p === p).length >= s.bombs || bombs.some((b) => b.r === r && b.c === c)) return; bombs.push({ p, r, c, t: 2.5, range: s.range }); g.sfx('click'); });
      const solid = (r, c) => map[r][c] !== 0 || bombs.some((b) => b.r === r && b.c === c);
      const canStand = (x, y, p) => { const rad = CELL * 0.36; const cur = [Math.floor(pl[p].x / CELL), Math.floor(pl[p].y / CELL)]; for (const [dx, dy] of [[-rad, -rad], [rad, -rad], [-rad, rad], [rad, rad]]) { const c = Math.floor((x + dx) / CELL), r = Math.floor((y + dy) / CELL); if (map[r][c] !== 0) return false; if (bombs.some((b) => b.r === r && b.c === c) && !(r === cur[1] && c === cur[0])) return false; } return true; };
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt;
        if (t > 120) { shrink += dt; if (shrink > 0.5) { shrink = 0; closeIn(); } }
        for (const p of [1, 2]) {
          const s = pl[p], c = ctl[p]; if (!s.alive) continue;
          let dx = (g.down(c.r) ? 1 : 0) - (g.down(c.l) ? 1 : 0), dy = (g.down(c.d) ? 1 : 0) - (g.down(c.u) ? 1 : 0);
          if (dx && dy) dy = 0;
          if (dx || dy) {
            const nx = s.x + dx * s.speed * dt, ny = s.y + dy * s.speed * dt;
            if (canStand(nx, ny, p)) { s.x = nx; s.y = ny; }
            else { // corner assist: nudge toward lane centre
              const cx = (Math.floor(s.x / CELL) + 0.5) * CELL, cy = (Math.floor(s.y / CELL) + 0.5) * CELL;
              if (dx) { const ty = cy + Math.sign(s.y - cy) * 0; const ny2 = s.y + Math.sign(cy - s.y) * s.speed * dt; if (Math.abs(cy - s.y) > 2 && canStand(s.x, ny2, p)) s.y = ny2; }
              else { const nx2 = s.x + Math.sign(cx - s.x) * s.speed * dt; if (Math.abs(cx - s.x) > 2 && canStand(nx2, s.y, p)) s.x = nx2; }
            }
          }
          const k = Math.floor(s.y / CELL) + ',' + Math.floor(s.x / CELL);
          if (pw[k]) { const kind = pw[k]; delete pw[k]; if (kind === 'fire') s.range++; if (kind === 'bomb') s.bombs++; if (kind === 'speed') s.speed += 30; g.sfx('coin'); }
        }
        for (const b of bombs) { b.t -= dt; if (b.t <= 0) blast(b); }
        bombs = bombs.filter((b) => b.t > 0);
        fires.forEach((f) => { f.t -= dt; });
        fires = fires.filter((f) => f.t > 0);
        const dead = { 1: false, 2: false };
        for (const p of [1, 2]) { const s = pl[p]; const r = Math.floor(s.y / CELL), c = Math.floor(s.x / CELL); if (fires.some((f) => f.r === r && f.c === c)) dead[p] = true; if (map[r][c] === 1) dead[p] = true; }
        if (dead[1] || dead[2]) { g.sfx('explode'); pl[1].alive = !dead[1]; pl[2].alive = !dead[2]; draw(); if (dead[1] && dead[2]) return g.draw('Both players were caught in the blast.'); return g.win(dead[1] ? 2 : 1, `${esc(g.name(dead[1] ? 1 : 2))} was blown up.`); }
        draw();
      });
      function blast(b) {
        b.t = 0; g.sfx('explode');
        const add = (r, c) => { fires.push({ r, c, t: 0.5 }); };
        add(b.r, b.c);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let i = 1; i <= b.range; i++) { const r = b.r + dr * i, c = b.c + dc * i; if (map[r][c] === 1) break; add(r, c); if (map[r][c] === 2) { map[r][c] = 0; const roll = Math.random(); if (roll < 0.35) pw[r + ',' + c] = roll < 0.15 ? 'fire' : roll < 0.25 ? 'bomb' : 'speed'; break; } const other = bombs.find((o) => o !== b && o.r === r && o.c === c && o.t > 0); if (other) blast(other); delete pw[r + ',' + c]; }
      }
      let ring = 1;
      function closeIn() { // fill the outermost free ring progressively
        for (let c = ring; c < COLS - ring; c++) { for (const r of [ring, ROWS - 1 - ring]) if (map[r][c] !== 1) { map[r][c] = 1; return; } }
        for (let r = ring; r < ROWS - ring; r++) { for (const c of [ring, COLS - 1 - ring]) if (map[r][c] !== 1) { map[r][c] = 1; return; } }
        ring++;
      }
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#3d8b40');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const x = c * CELL, y = r * CELL; if (map[r][c] === 1) { UI.rect(ctx, x, y, CELL, CELL, '#6b7280'); UI.rect(ctx, x + 3, y + 3, CELL - 6, CELL - 6, '#8b93a3'); } else if (map[r][c] === 2) { UI.rect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, '#a0622d'); UI.rect(ctx, x + 6, y + 6, CELL - 12, CELL - 12, '#c27b3e'); } else if ((r + c) % 2) UI.rect(ctx, x, y, CELL, CELL, '#3a833d'); const k = r + ',' + c; if (pw[k]) UI.text(ctx, { fire: '🔥', bomb: '💣', speed: '👟' }[pw[k]], x + CELL / 2, y + CELL / 2, { font: '24px system-ui' }); }
        bombs.forEach((b) => { const s = 1 + Math.sin(b.t * 12) * 0.08; UI.circle(ctx, (b.c + .5) * CELL, (b.r + .5) * CELL, CELL * 0.34 * s, '#111'); UI.circle(ctx, (b.c + .5) * CELL - 4, (b.r + .5) * CELL - 5, 4, '#ffd43b'); });
        fires.forEach((f) => { UI.roundRect(ctx, f.c * CELL + 3, f.r * CELL + 3, CELL - 6, CELL - 6, 8, f.t > .25 ? '#ffa94d' : '#ff6b6b'); });
        for (const p of [1, 2]) { const s = pl[p]; if (!s.alive) continue; UI.circle(ctx, s.x, s.y + 8, CELL * .3, '#0004'); UI.roundRect(ctx, s.x - 13, s.y - 20, 26, 34, 9, g.color(p)); UI.circle(ctx, s.x - 5, s.y - 8, 3, '#fff'); UI.circle(ctx, s.x + 5, s.y - 8, 3, '#fff'); }
        UI.text(ctx, fmtTime(Math.max(0, 120 - t) * 1000), W / 2, 12, { color: '#fff', font: 'bold 13px monospace' });
      }
    },
  });
})();
