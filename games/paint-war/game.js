/* Paint War — 45 seconds, paint tiles by walking; splash bombs. */
(function () {
  const COLS = 32, ROWS = 20, CELL = 24, W = COLS * CELL, H = ROWS * CELL, TIME = 45;
  Game.init({
    id: 'paint-war',
    rules: ['Walk over tiles to paint them your colour. You can repaint enemy tiles.', 'Press <kbd>Splash</kbd> to paint a 5×5 area around you (recharges over 4 seconds).', `After ${TIME} seconds, whoever covers more tiles wins.`],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · splash <kbd>E</kbd>', p2: 'Arrows · splash <kbd>/</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyE', label: 'Splash' }] }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'Slash', label: 'Splash' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const tiles = new Uint8Array(COLS * ROWS);
      const pl = { 1: { x: 3 * CELL, y: H / 2, cd: 0 }, 2: { x: W - 3 * CELL, y: H / 2, cd: 0 } };
      const walls = new Set(); for (let i = 0; i < 26; i++) { const r = rnd(ROWS), c = 4 + rnd(COLS - 8); walls.add(r * COLS + c); }
      let t = TIME;
      const ctl = { 1: { u: 'KeyW', d: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      g.key(['KeyE', 'Slash'], (code) => { const p = code === 'KeyE' ? 1 : 2; const s = pl[p]; if (s.cd > 0) return; s.cd = 4; const cr = Math.floor(s.y / CELL), cc = Math.floor(s.x / CELL); for (let r = cr - 2; r <= cr + 2; r++) for (let c = cc - 2; c <= cc + 2; c++) if (r >= 0 && c >= 0 && r < ROWS && c < COLS && !walls.has(r * COLS + c)) tiles[r * COLS + c] = p; g.sfx('pop'); });
      const blocked = (x, y) => { const r = Math.floor(y / CELL), c = Math.floor(x / CELL); return x < 8 || y < 8 || x > W - 8 || y > H - 8 || walls.has(r * COLS + c); };
      const count = () => { let a = 0, b = 0; for (let i = 0; i < tiles.length; i++) { if (tiles[i] === 1) a++; else if (tiles[i] === 2) b++; } return [a, b]; };
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t -= dt;
        for (const p of [1, 2]) {
          const s = pl[p], c = ctl[p]; s.cd -= dt;
          const dx = (g.down(c.r) ? 1 : 0) - (g.down(c.l) ? 1 : 0), dy = (g.down(c.d) ? 1 : 0) - (g.down(c.u) ? 1 : 0);
          const nx = s.x + dx * 200 * dt, ny = s.y + dy * 200 * dt;
          if (!blocked(nx, s.y)) s.x = nx; if (!blocked(s.x, ny)) s.y = ny;
          const i = Math.floor(s.y / CELL) * COLS + Math.floor(s.x / CELL); if (tiles[i] !== p) { tiles[i] = p; }
        }
        const [a, b] = count(); g.points(a, b);
        if (t <= 0) { draw(); if (a === b) return g.draw(`${a} tiles each.`); return g.win(a > b ? 1 : 2, `${Math.max(a, b)} tiles to ${Math.min(a, b)} (${Math.round(Math.max(a, b) / (COLS * ROWS - walls.size) * 100)}% coverage).`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#e9ecf5');
        for (let i = 0; i < tiles.length; i++) { const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL; if (walls.has(i)) UI.rect(ctx, x, y, CELL, CELL, '#2d3757'); else if (tiles[i]) UI.rect(ctx, x, y, CELL, CELL, g.color(tiles[i])); }
        for (const p of [1, 2]) { const s = pl[p]; UI.circle(ctx, s.x, s.y, 11, '#fff'); UI.circle(ctx, s.x, s.y, 8, g.color(p)); if (s.cd > 0) { ctx.strokeStyle = '#0008'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - s.cd / 4)); ctx.stroke(); } }
        UI.roundRect(ctx, W / 2 - 34, 4, 68, 24, 8, '#0e1020cc'); UI.text(ctx, Math.max(0, t).toFixed(1), W / 2, 16, { color: '#fff', font: 'bold 16px monospace' });
      }
    },
  });
})();
