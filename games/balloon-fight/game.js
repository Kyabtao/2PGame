/* Balloon Fight — flap to fly; hit the opponent from above to pop a balloon; 2 balloons each; wrapping screen. */
(function () {
  const W = 800, H = 500, TARGET = 3;
  Game.init({
    id: 'balloon-fight',
    rules: ['Flap to stay airborne (the screen wraps left/right). Each fighter has two balloons.', 'Collide with the other player while you are <b>above</b> them to pop one of their balloons. Lose both balloons and you fall into the water.', `Each pop-out scores a round; first to ${TARGET} wins. Don't touch the water!`],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> steer · <kbd>W</kbd> flap', p2: '<kbd>←</kbd>/<kbd>→</kbd> steer · <kbd>↑</kbd> flap' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', left: 'KeyA', right: 'KeyD' } }, { side: 2, dpad: { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' } }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; let F, pause = 0, plats = [{ x: 120, y: 300, w: 140 }, { x: 540, y: 300, w: 140 }, { x: 330, y: 180, w: 140 }];
      const reset = () => { F = { 1: { x: 190, y: 270, vx: 0, vy: 0, b: 2, hit: 0 }, 2: { x: 610, y: 270, vx: 0, vy: 0, b: 2, hit: 0 } }; };
      reset();
      const flap = (p) => { const f = F[p]; if (pause > 0 || f.b <= 0) return; f.vy = Math.max(f.vy - 260, -300); f.flap = 0.15; g.sfx('click'); };
      g.key('KeyW', () => flap(1)); g.key('ArrowUp', () => flap(2));
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; if (pause <= 0) reset(); draw(); return; }
        for (const p of [1, 2]) {
          const f = F[p]; f.hit -= dt; f.flap = (f.flap || 0) - dt;
          const l = g.down(p === 1 ? 'KeyA' : 'ArrowLeft'), r = g.down(p === 1 ? 'KeyD' : 'ArrowRight');
          f.vx += ((r ? 1 : 0) - (l ? 1 : 0)) * 500 * dt; f.vx *= Math.pow(0.4, dt); f.vy += (f.b > 0 ? 520 : 900) * dt; f.vy = Math.min(f.vy, 420);
          f.x += f.vx * dt; f.y += f.vy * dt; if (f.x < 0) f.x += W; if (f.x > W) f.x -= W; if (f.y < 14) { f.y = 14; f.vy = Math.abs(f.vy) * 0.3; }
          for (const pl of plats) if (f.vy > 0 && f.x > pl.x - 10 && f.x < pl.x + pl.w + 10 && f.y + 16 > pl.y && f.y + 16 < pl.y + 14) { f.y = pl.y - 16; f.vy = 0; }
          if (f.y > H - 40) { score[3 - p]++; g.points(score[1], score[2]); g.sfx('explode'); if (score[3 - p] >= TARGET) { draw(); return g.win(3 - p, `${score[1]} – ${score[2]}`); } pause = 1.5; g.status(`${esc(g.name(p))} fell into the water!`); return; }
        }
        const a = F[1], b = F[2]; const d = dist(a.x, a.y, b.x, b.y);
        if (d < 30 && a.hit <= 0 && b.hit <= 0) {
          const upper = a.y < b.y - 8 ? 1 : b.y < a.y - 8 ? 2 : 0;
          if (upper) { const v = F[3 - upper]; v.b--; v.hit = 1; F[upper].vy = -200; g.sfx('pop'); g.status(`${esc(g.name(upper))} popped a balloon!`); if (v.b <= 0) g.sfx('bad'); }
          const nx = (b.x - a.x) / (d || 1), ny = (b.y - a.y) / (d || 1); a.vx -= nx * 200; b.vx += nx * 200; a.vy -= ny * 100; b.vy += ny * 100; a.hit = Math.max(a.hit, 0.4); b.hit = Math.max(b.hit, 0.4);
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#0d1b3a'); for (let i = 0; i < 30; i++) UI.circle(ctx, (i * 97) % W, (i * 53) % (H - 80), 1, '#fff8');
        UI.rect(ctx, 0, H - 40, W, 40, '#1e6fb8'); for (let x = 0; x < W; x += 40) UI.circle(ctx, x + (performance.now() / 30) % 40, H - 40, 6, '#1e6fb8');
        plats.forEach((pl) => UI.roundRect(ctx, pl.x, pl.y, pl.w, 14, 6, '#5a7a3a'));
        for (const p of [1, 2]) { const f = F[p]; ctx.globalAlpha = f.hit > 0 && Math.floor(f.hit * 10) % 2 ? 0.4 : 1; for (let i = 0; i < f.b; i++) { const bx = f.x + (i - (f.b - 1) / 2) * 16; UI.rect(ctx, bx - 1, f.y - 30, 2, 18, '#ddd'); UI.circle(ctx, bx, f.y - 38, 11, g.color(p)); } UI.roundRect(ctx, f.x - 9, f.y - 12, 18, 24, 6, '#ffe0b3'); UI.rect(ctx, f.x - 16 - (f.flap > 0 ? 3 : 0), f.y - 6, 8, 4, '#fff'); UI.rect(ctx, f.x + 8 + (f.flap > 0 ? 3 : 0), f.y - 6, 8, 4, '#fff'); ctx.globalAlpha = 1; }
      }
    },
  });
})();
