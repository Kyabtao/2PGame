/* Road Crossers — Frogger-style lanes; first across wins; getting hit sends you back to start. */
(function () {
  const COLS = 15, ROWS = 12, CELL = 44, W = COLS * CELL, H = ROWS * CELL;
  Game.init({
    id: 'road-crossers',
    rules: ['Hop across ten lanes of traffic. Cars move at different speeds in alternating directions.', 'Get hit and you restart at the bottom (3 crashes and you sit out until the round ends).', 'First to reach the top pavement wins.'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', p2: 'Arrows' },
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const lanes = range(ROWS - 2).map((i) => { const r = i + 1; const dir = i % 2 ? 1 : -1; const speed = rndf(60, 160) + i * 6; const cars = []; let x = rnd(200); while (x < W + 200) { const len = pick([1.2, 1.5, 2.2]) * CELL; cars.push({ x, len }); x += len + rndf(90, 220); } return { r, dir, speed, cars, color: pick(['#ffd43b', '#4dabf7', '#ff922b', '#e599f7', '#69db7c']) }; });
      const pl = { 1: { c: 5, r: ROWS - 1, hits: 0, cd: 0, out: false }, 2: { c: 9, r: ROWS - 1, hits: 0, cd: 0, out: false } };
      const map = { KeyW: [1, -1, 0], KeyS: [1, 1, 0], KeyA: [1, 0, -1], KeyD: [1, 0, 1], ArrowUp: [2, -1, 0], ArrowDown: [2, 1, 0], ArrowLeft: [2, 0, -1], ArrowRight: [2, 0, 1] };
      let t = 0;
      g.key(Object.keys(map), (code) => { const [p, dr, dc] = map[code]; const s = pl[p]; if (s.out || s.cd > 0) return; s.r = clamp(s.r + dr, 0, ROWS - 1); s.c = clamp(s.c + dc, 0, COLS - 1); s.cd = 0.08; g.sfx('click'); if (s.r === 0) { draw(); g.win(p, `Crossed in ${t.toFixed(1)}s with ${s.hits} crash${s.hits === 1 ? '' : 'es'}.`); } });
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt;
        lanes.forEach((l) => l.cars.forEach((car) => { car.x += l.dir * l.speed * dt; if (l.dir > 0 && car.x > W + 60) car.x = -car.len - rndf(0, 200); if (l.dir < 0 && car.x + car.len < -60) car.x = W + rndf(0, 200); }));
        for (const p of [1, 2]) {
          const s = pl[p]; s.cd -= dt; if (s.out) continue;
          const lane = lanes.find((l) => l.r === s.r); if (!lane) continue;
          const px = s.c * CELL + CELL / 2;
          if (lane.cars.some((car) => px > car.x - 6 && px < car.x + car.len + 6)) { s.hits++; g.sfx('explode'); s.r = ROWS - 1; s.c = p === 1 ? 5 : 9; if (s.hits >= 3) { s.out = true; g.status(`${esc(g.name(p))} is out!`); if (pl[3 - p].out) { draw(); return g.draw('Both crossers were run over three times.'); } } }
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#3b3b47');
        UI.rect(ctx, 0, 0, W, CELL, '#4caf50'); UI.rect(ctx, 0, H - CELL, W, CELL, '#4caf50');
        lanes.forEach((l) => { UI.rect(ctx, 0, l.r * CELL, W, 1, '#ffffff22'); l.cars.forEach((car) => { UI.roundRect(ctx, car.x, l.r * CELL + 8, car.len, CELL - 16, 6, l.color); UI.rect(ctx, l.dir > 0 ? car.x + car.len - 8 : car.x + 2, l.r * CELL + 12, 6, CELL - 24, '#0006'); }); });
        for (const p of [1, 2]) { const s = pl[p]; if (s.out) continue; const x = s.c * CELL + CELL / 2, y = s.r * CELL + CELL / 2; UI.circle(ctx, x, y, 15, g.color(p)); UI.circle(ctx, x - 5, y - 5, 3, '#fff'); UI.circle(ctx, x + 5, y - 5, 3, '#fff'); UI.text(ctx, '✕'.repeat(s.hits), x, y + 24, { color: '#fff', font: 'bold 10px system-ui' }); }
        UI.text(ctx, 'FINISH', W / 2, CELL / 2, { color: '#fff8', font: 'bold 18px system-ui' });
      }
    },
  });
})();
