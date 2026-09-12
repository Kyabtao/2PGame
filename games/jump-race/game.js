/* Jump Race — two auto-running lanes with obstacles; trip and slow down; first to 100% wins. */
(function () {
  const W = 800, H = 360, LEN = 4200;
  Game.init({
    id: 'jump-race',
    rules: ['Both runners sprint automatically along their own lane. Press jump to hurdle rocks and cacti; hold for a higher jump.', 'Hitting an obstacle knocks you down and costs you time. Some gaps need a well-timed double jump (press again in the air).', 'First to the finish line wins.'],
    controls: { p1: '<kbd>W</kbd> or <kbd>Space</kbd>', p2: '<kbd>↑</kbd> or <kbd>Enter</kbd>' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyW', label: 'JUMP', huge: true }] }, { side: 2, buttons: [{ code: 'ArrowUp', label: 'JUMP', huge: true }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const obs = []; let x = 500; while (x < LEN - 300) { obs.push({ x, w: pick([26, 26, 40, 60]), h: pick([30, 30, 44]) }); x += rndf(220, 420); }
      const R = { 1: { x: 0, y: 0, vy: 0, jumps: 0, stun: 0, t: 0 }, 2: { x: 0, y: 0, vy: 0, jumps: 0, stun: 0, t: 0 } };
      const jump = (p) => { const r = R[p]; if (r.stun > 0 || g.over) return; if (r.jumps < 2) { r.vy = r.jumps === 0 ? -520 : -430; r.jumps++; g.sfx('pop'); } };
      g.key(['KeyW', 'Space'], () => jump(1)); g.key(['ArrowUp', 'Enter'], () => jump(2));
      UI.pointer(canvas, { down: (pt) => jump(pt.y < H / 2 ? 1 : 2) }, W, H);
      let t = 0;
      draw();
      await g.countdown(3);
      g.loop((dt) => {
        t += dt;
        for (const p of [1, 2]) {
          const r = R[p]; r.stun -= dt;
          const sp = r.stun > 0 ? 40 : 300; r.x += sp * dt;
          const hold = g.down(p === 1 ? 'KeyW' : 'ArrowUp') || g.down(p === 1 ? 'Space' : 'Enter');
          r.vy += (hold && r.vy < 0 ? 1100 : 1700) * dt; r.y += r.vy * dt; if (r.y > 0) { r.y = 0; r.vy = 0; r.jumps = 0; }
          if (r.stun <= 0) for (const o of obs) { if (r.x + 12 > o.x && r.x - 12 < o.x + o.w && -r.y < o.h - 4) { r.stun = 0.9; r.x = o.x - 20; r.y = 0; r.vy = 0; g.sfx('bad'); break; } }
          if (r.x >= LEN) { draw(); return g.win(p, `Finished in ${t.toFixed(2)}s.`); }
        }
        g.points(Math.round(R[1].x / LEN * 100), Math.round(R[2].x / LEN * 100));
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#87ceeb');
        for (const p of [1, 2]) {
          const r = R[p]; const oy = p === 1 ? 0 : H / 2; const gy = oy + H / 2 - 30; const cam = r.x - 200;
          UI.rect(ctx, 0, oy, W, H / 2, p === 1 ? '#8fd3f4' : '#7cc7ee'); UI.rect(ctx, 0, gy, W, 30, '#c8a15a'); UI.rect(ctx, 0, gy - 4, W, 4, '#6b9d3e');
          for (let k = 0; k < 6; k++) UI.circle(ctx, ((k * 190 - cam * 0.3) % (W + 80) + W + 80) % (W + 80) - 40, oy + 30 + (k % 2) * 20, 18, '#ffffffaa');
          obs.forEach((o) => { const sx = o.x - cam; if (sx < -80 || sx > W + 80) return; UI.roundRect(ctx, sx, gy - o.h, o.w, o.h, 4, o.h > 40 ? '#2e7d32' : '#6d4c41'); });
          UI.rect(ctx, LEN - cam, gy - 90, 6, 90, '#222'); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) UI.rect(ctx, LEN - cam + 6 + j * 12, gy - 90 + i * 12, 12, 12, (i + j) % 2 ? '#fff' : '#111');
          const rx = 200, ry = gy + r.y; if (r.stun > 0) { UI.roundRect(ctx, rx - 20, ry - 16, 40, 16, 6, g.color(p)); UI.text(ctx, '💫', rx, ry - 28, { font: '20px system-ui' }); } else { const leg = Math.sin(performance.now() / 50) * 8; UI.roundRect(ctx, rx - 10, ry - 40, 20, 28, 6, g.color(p)); UI.circle(ctx, rx, ry - 48, 9, '#ffe0b3'); UI.rect(ctx, rx - 7 + leg, ry - 12, 5, 12, '#333'); UI.rect(ctx, rx + 2 - leg, ry - 12, 5, 12, '#333'); }
          UI.text(ctx, `${Math.round(r.x / LEN * 100)}%`, W - 40, oy + 18, { color: g.color(p), font: 'bold 16px monospace' }); UI.text(ctx, g.name(p), 50, oy + 18, { color: g.color(p), font: 'bold 13px system-ui' });
        }
        UI.rect(ctx, 0, H / 2 - 1, W, 2, '#0e1020');
      }
    },
  });
})();
