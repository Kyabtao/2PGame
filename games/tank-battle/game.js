/* Tank Battle — top-down tanks, bouncing shells, walls, 3 lives each. */
(function () {
  const W = 800, H = 520, LIVES = 3;
  Game.init({
    id: 'tank-battle',
    rules: ['Drive your tank around the arena and fire shells. Shells bounce off walls once.', `Each tank has ${LIVES} lives; after a hit both tanks respawn. Lose all lives and you lose the round.`, 'Up to 3 shells in flight at once. Watch out — your own ricochets can hit you!'],
    controls: { p1: '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · fire <kbd>E</kbd>', p2: 'Arrows · fire <kbd>/</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, buttons: [{ code: 'KeyE', label: 'Fire' }] }, { side: 2, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, buttons: [{ code: 'Slash', label: 'Fire' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const walls = [{ x: 380, y: 60, w: 40, h: 140 }, { x: 380, y: 320, w: 40, h: 140 }, { x: 150, y: 220, w: 120, h: 30 }, { x: 530, y: 270, w: 120, h: 30 }, { x: 150, y: 400, w: 30, h: 80 }, { x: 620, y: 40, w: 30, h: 80 }];
      const tanks = { 1: mkTank(1), 2: mkTank(2) };
      const lives = { 1: LIVES, 2: LIVES }; let shells = []; let particles = []; let respawn = 0;
      function mkTank(p) { return { p, x: p === 1 ? 70 : W - 70, y: p === 1 ? H - 70 : 70, a: p === 1 ? -Math.PI / 2 : Math.PI / 2, cd: 0, r: 16 }; }
      const ctl = { 1: { f: 'KeyW', b: 'KeyS', l: 'KeyA', r: 'KeyD', fire: 'KeyE' }, 2: { f: 'ArrowUp', b: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight', fire: 'Slash' } };
      g.key(['KeyE', 'Slash'], (code) => fire(code === 'KeyE' ? 1 : 2));
      const hitWall = (x, y, r) => x - r < 0 || x + r > W || y - r < 0 || y + r > H || walls.some((w) => x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h);
      function fire(p) { const t = tanks[p]; if (g.over || respawn > 0 || t.cd > 0 || shells.filter((s) => s.p === p).length >= 3) return; t.cd = 0.35; shells.push({ p, x: t.x + Math.cos(t.a) * 22, y: t.y + Math.sin(t.a) * 22, vx: Math.cos(t.a) * 380, vy: Math.sin(t.a) * 380, b: 1, life: 4 }); g.sfx('hit'); }
      g.points(lives[1], lives[2]);
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (respawn > 0) { respawn -= dt; if (respawn <= 0) { tanks[1] = mkTank(1); tanks[2] = mkTank(2); shells = []; } particles.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }); particles = particles.filter((q) => q.life > 0); draw(); return; }
        for (const p of [1, 2]) {
          const t = tanks[p], c = ctl[p]; t.cd -= dt;
          if (g.down(c.l)) t.a -= 3.2 * dt; if (g.down(c.r)) t.a += 3.2 * dt;
          const sp = (g.down(c.f) ? 170 : 0) - (g.down(c.b) ? 110 : 0);
          if (sp) { const nx = t.x + Math.cos(t.a) * sp * dt, ny = t.y + Math.sin(t.a) * sp * dt; if (!hitWall(nx, t.y, t.r)) t.x = nx; if (!hitWall(t.x, ny, t.r)) t.y = ny; }
        }
        for (const s of shells) {
          s.life -= dt; let nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
          if (nx < 4 || nx > W - 4 || walls.some((w) => nx > w.x && nx < w.x + w.w && s.y > w.y && s.y < w.y + w.h)) { s.vx = -s.vx; nx = s.x; s.b--; g.sfx('bounce'); }
          if (ny < 4 || ny > H - 4 || walls.some((w) => s.x > w.x && s.x < w.x + w.w && ny > w.y && ny < w.y + w.h)) { s.vy = -s.vy; ny = s.y; s.b--; g.sfx('bounce'); }
          s.x = nx; s.y = ny;
          for (const p of [1, 2]) { const t = tanks[p]; if (dist(s.x, s.y, t.x, t.y) < t.r + 4 && !(s.p === p && s.life > 3.85)) { s.life = 0; lives[p]--; g.points(lives[1], lives[2]); g.sfx('explode'); for (let i = 0; i < 24; i++) { const a = Math.random() * Math.PI * 2, v = rndf(40, 220); particles.push({ x: t.x, y: t.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rndf(.3, .8), c: g.color(p) }); } if (lives[p] <= 0) { draw(); return g.win(3 - p, `${esc(g.name(3 - p))} destroyed the last tank.`); } respawn = 1.2; } }
        }
        shells = shells.filter((s) => s.life > 0 && s.b >= 0);
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1b2a1b');
        ctx.fillStyle = '#20331f'; for (let x = 0; x < W; x += 40) for (let y = (x / 40) % 2 ? 0 : 40; y < H; y += 80) ctx.fillRect(x, y, 40, 40);
        walls.forEach((w) => UI.roundRect(ctx, w.x, w.y, w.w, w.h, 4, '#6b6b7b'));
        for (const p of [1, 2]) { const t = tanks[p]; if (respawn > 0 && lives[p] < LIVES && (Math.floor(respawn * 8) % 2)) continue; ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.a); UI.roundRect(ctx, -18, -14, 36, 28, 5, g.color(p)); UI.rect(ctx, -18, -16, 36, 6, '#0006'); UI.rect(ctx, -18, 10, 36, 6, '#0006'); UI.rect(ctx, 0, -4, 28, 8, '#ddd'); UI.circle(ctx, 0, 0, 9, '#fff9'); ctx.restore(); }
        shells.forEach((s) => UI.circle(ctx, s.x, s.y, 5, '#ffd43b'));
        particles.forEach((q) => UI.circle(ctx, q.x, q.y, 3, q.c));
        UI.text(ctx, '♥'.repeat(lives[1]), 40, 18, { color: g.color(1), font: 'bold 18px system-ui' }); UI.text(ctx, '♥'.repeat(lives[2]), W - 40, 18, { color: g.color(2), font: 'bold 18px system-ui' });
      }
    },
  });
})();
