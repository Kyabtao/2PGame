/* Light Cycles — grid based, walls of light. */
(function () {
  const COLS = 80, ROWS = 50, CELL = 10, W = COLS * CELL, H = ROWS * CELL;
  Game.init({
    id: 'tron',
    rules: ['Your cycle moves constantly and leaves a solid light wall behind it.', 'Crash into any wall, trail or the arena edge and you lose. Head-on collisions are a draw.', 'Tap <kbd>Boost</kbd> for a short burst of speed (3 per round).'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · boost <kbd>E</kbd>', p2: 'Arrows · boost <kbd>/</kbd>' },
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyE', label: 'Boost' }] }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'Slash', label: 'Boost' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const grid = new Uint8Array(COLS * ROWS);
      const bikes = { 1: { x: 10, y: ROWS / 2, dx: 1, dy: 0, nd: [1, 0], boosts: 3, boost: 0, alive: true }, 2: { x: COLS - 11, y: ROWS / 2, dx: -1, dy: 0, nd: [-1, 0], boosts: 3, boost: 0, alive: true } };
      const map = { KeyW: [1, 0, -1], KeyS: [1, 0, 1], KeyA: [1, -1, 0], KeyD: [1, 1, 0], ArrowUp: [2, 0, -1], ArrowDown: [2, 0, 1], ArrowLeft: [2, -1, 0], ArrowRight: [2, 1, 0] };
      g.key(Object.keys(map), (code) => { const [p, dx, dy] = map[code]; const b = bikes[p]; if (dx === -b.dx && dy === -b.dy) return; b.nd = [dx, dy]; });
      g.key(['KeyE', 'Slash'], (code) => { const b = bikes[code === 'KeyE' ? 1 : 2]; if (b.boosts > 0 && b.boost <= 0) { b.boosts--; b.boost = 0.7; g.sfx('go'); } });
      UI.pointer(canvas, { down: (pt) => { const p = pt.x < W / 2 ? 1 : 2; const b = bikes[p]; const cx = b.x * CELL, cy = b.y * CELL; const ax = pt.x - cx, ay = pt.y - cy; if (Math.abs(ax) > Math.abs(ay)) { if (Math.sign(ax) !== -b.dx) b.nd = [Math.sign(ax), 0]; } else if (Math.sign(ay) !== -b.dy) b.nd = [0, Math.sign(ay)]; } }, W, H);
      const mark = (p) => { grid[bikes[p].y * COLS + bikes[p].x] = p; };
      mark(1); mark(2);
      draw();
      await g.countdown(3);
      let acc = 0;
      g.loop((dt) => {
        acc += dt;
        const step = 1 / 22;
        while (acc >= step) {
          acc -= step;
          for (const p of [1, 2]) { const b = bikes[p]; b.dx = b.nd[0]; b.dy = b.nd[1]; }
          const moves = { 1: bikes[1].boost > 0 ? 2 : 1, 2: bikes[2].boost > 0 ? 2 : 1 };
          for (let k = 0; k < 2; k++) {
            const nxt = {};
            for (const p of [1, 2]) { if (moves[p] > k) { const b = bikes[p]; nxt[p] = [b.x + b.dx, b.y + b.dy]; } }
            const crash = { 1: false, 2: false };
            for (const p of [1, 2]) { if (!nxt[p]) continue; const [x, y] = nxt[p]; if (x < 0 || y < 0 || x >= COLS || y >= ROWS || grid[y * COLS + x]) crash[p] = true; }
            if (nxt[1] && nxt[2] && nxt[1][0] === nxt[2][0] && nxt[1][1] === nxt[2][1]) { crash[1] = crash[2] = true; }
            if (crash[1] || crash[2]) { g.sfx('explode'); draw(); if (crash[1] && crash[2]) return g.draw('Both riders crashed at the same moment.'); return g.win(crash[1] ? 2 : 1, `${esc(g.name(crash[1] ? 1 : 2))} crashed into a wall.`); }
            for (const p of [1, 2]) if (nxt[p]) { bikes[p].x = nxt[p][0]; bikes[p].y = nxt[p][1]; mark(p); }
          }
          for (const p of [1, 2]) if (bikes[p].boost > 0) bikes[p].boost -= step;
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0b0d18');
        ctx.strokeStyle = '#151a2e'; ctx.lineWidth = 1; for (let x = 0; x <= W; x += CELL * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y <= H; y += CELL * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        for (let i = 0; i < grid.length; i++) if (grid[i]) { ctx.fillStyle = g.color(grid[i]); ctx.fillRect((i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL, CELL); }
        for (const p of [1, 2]) { const b = bikes[p]; ctx.shadowColor = g.color(p); ctx.shadowBlur = 14; UI.rect(ctx, b.x * CELL - 2, b.y * CELL - 2, CELL + 4, CELL + 4, '#fff'); ctx.shadowBlur = 0; UI.text(ctx, '⚡'.repeat(b.boosts), p === 1 ? 40 : W - 40, 14, { font: '14px system-ui', color: g.color(p) }); }
      }
    },
  });
})();
