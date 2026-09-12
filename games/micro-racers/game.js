/* Micro Racers — top-down oval/wiggly track, 3 laps, checkpoints, off-track slowdown. */
(function () {
  const W = 800, H = 520, LAPS = 3;
  Game.init({
    id: 'micro-racers',
    rules: ['Accelerate and steer around the track. Grass slows you down a lot, and the walls are hard.', `Pass every checkpoint and complete ${LAPS} laps first to win.`],
    controls: { p1: '<kbd>W</kbd> gas · <kbd>S</kbd> brake · <kbd>A</kbd>/<kbd>D</kbd> steer', p2: '<kbd>↑</kbd> gas · <kbd>↓</kbd> brake · <kbd>←</kbd>/<kbd>→</kbd> steer' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      // track: centreline polyline of a rounded rectangle with a kink
      const path = []; const cx = W / 2, cy = H / 2;
      for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; const rx = 300 + Math.sin(a * 2) * 40, ry = 180 + Math.cos(a * 3) * 25; path.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
      const TW = 70;
      const off = document.createElement('canvas'); off.width = W; off.height = H; const octx = off.getContext('2d') || UI.nullCtx();
      const paintTrack = (c) => { c.fillStyle = '#2f6b2f'; c.fillRect(0, 0, W, H); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#555'; c.lineWidth = TW; c.beginPath(); path.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke(); };
      paintTrack(octx);
      let trackData = null; try { trackData = octx.getImageData(0, 0, W, H).data; } catch (e) { trackData = null; }
      const onTrack = (x, y) => { if (!trackData) { const d = nearest(x, y); return d < TW / 2; } const i = ((y | 0) * W + (x | 0)) * 4; return trackData[i] === 0x55; };
      const nearest = (x, y) => Math.min(...path.map(([px, py]) => dist(x, y, px, py)));
      const CP = [0, 16, 32, 48]; // checkpoint indices along path
      const cars = { 1: { x: path[0][0], y: path[0][1] - 14, a: Math.atan2(path[1][1] - path[0][1], path[1][0] - path[0][0]), v: 0, cp: 0, lap: 0 }, 2: { x: path[0][0], y: path[0][1] + 14, a: Math.atan2(path[1][1] - path[0][1], path[1][0] - path[0][0]), v: 0, cp: 0, lap: 0 } };
      const ctl = { 1: { g: 'KeyW', b: 'KeyS', l: 'KeyA', r: 'KeyD' }, 2: { g: 'ArrowUp', b: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' } };
      draw();
      await g.countdown(3);
      let t = 0;
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) {
          const c = cars[p], k = ctl[p]; const grass = !onTrack(c.x, c.y);
          const max = grass ? 90 : 330;
          if (g.down(k.g)) c.v += 260 * dt; if (g.down(k.b)) c.v -= 300 * dt;
          c.v *= Math.pow(grass ? 0.2 : 0.55, dt); c.v = clamp(c.v, -80, max);
          const steer = (g.down(k.r) ? 1 : 0) - (g.down(k.l) ? 1 : 0);
          c.a += steer * 2.6 * dt * clamp(Math.abs(c.v) / 120, 0.2, 1) * Math.sign(c.v || 1);
          let nx = c.x + Math.cos(c.a) * c.v * dt, ny = c.y + Math.sin(c.a) * c.v * dt;
          if (nx < 6 || nx > W - 6 || ny < 6 || ny > H - 6) { c.v *= -0.4; nx = clamp(nx, 6, W - 6); ny = clamp(ny, 6, H - 6); g.sfx('hit'); }
          c.x = nx; c.y = ny;
          const nextIdx = CP[(c.cp + 1) % CP.length];
          if (dist(c.x, c.y, path[nextIdx][0], path[nextIdx][1]) < TW * 0.7) { c.cp = (c.cp + 1) % CP.length; if (c.cp === 0) { c.lap++; g.sfx('coin'); g.points(cars[1].lap, cars[2].lap); if (c.lap >= LAPS) { draw(); return g.win(p, `Finished ${LAPS} laps in ${t.toFixed(1)}s.`); } } }
        }
        const a = cars[1], b = cars[2]; const d = dist(a.x, a.y, b.x, b.y);
        if (d < 22 && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; a.x -= nx * (22 - d) / 2; a.y -= ny * (22 - d) / 2; b.x += nx * (22 - d) / 2; b.y += ny * (22 - d) / 2; const tmp = a.v; a.v = b.v * 0.8; b.v = tmp * 0.8; }
        draw();
      });
      function draw() {
        paintTrack(ctx);
        ctx.setLineDash([12, 12]); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; ctx.beginPath(); path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        const [sx, sy] = path[0]; ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.atan2(path[1][1] - sy, path[1][0] - sx)); for (let i = -3; i < 3; i++) for (let j = 0; j < 2; j++) UI.rect(ctx, j * 8 - 8, i * 12, 8, 12, (i + j) % 2 ? '#fff' : '#111'); ctx.restore();
        CP.slice(1).forEach((i) => UI.circle(ctx, path[i][0], path[i][1], 5, '#ffd43b88'));
        for (const p of [1, 2]) { const c = cars[p]; ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a); UI.roundRect(ctx, -12, -7, 24, 14, 4, g.color(p)); UI.rect(ctx, 2, -5, 6, 10, '#222'); ctx.restore(); }
        UI.text(ctx, `Lap ${Math.min(LAPS, cars[1].lap + 1)}/${LAPS}`, 50, 16, { color: g.color(1), font: 'bold 14px system-ui' }); UI.text(ctx, `Lap ${Math.min(LAPS, cars[2].lap + 1)}/${LAPS}`, W - 50, 16, { color: g.color(2), font: 'bold 14px system-ui' });
      }
    },
  });
})();
