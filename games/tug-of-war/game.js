/* Tug of War — rhythm pulls: press when the marker is in the green zone for a strong pull; mashing is weak. */
(function () {
  const W = 800, H = 320;
  Game.init({
    id: 'tug-of-war',
    rules: ['Each player has a swinging rhythm bar. Press your key when the marker is in the <b>green zone</b> for a strong pull; presses outside the zone barely move the rope.', 'Pull the rope\'s centre flag past your line to win.', 'The zone shrinks the longer the tug goes on.'],
    controls: { p1: '<kbd>Q</kbd>', p2: '<kbd>P</kbd>' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyQ', label: 'PULL', huge: true }] }, { side: 2, buttons: [{ code: 'KeyP', label: 'PULL', huge: true }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      let pos = 0, t = 0, zone = 0.3, live = false; const ph = { 1: 0, 2: Math.PI / 2 }; const flash = { 1: 0, 2: 0 }; const pulls = { 1: 0, 2: 0 };
      const marker = (p) => Math.sin(t * 4 + ph[p]);
      g.key(['KeyQ', 'KeyP'], (code) => { if (!live) return; const p = code === 'KeyQ' ? 1 : 2; const m = Math.abs(marker(p)); const good = m < zone; const amt = good ? 6 : 0.6; pos += p === 1 ? -amt : amt; flash[p] = good ? 0.25 : -0.25; if (good) pulls[p]++; g.sfx(good ? 'pop' : 'tick'); g.points(pulls[1], pulls[2]); });
      draw();
      await g.countdown(3, 'Take the strain…');
      live = true;
      g.loop((dt) => {
        t += dt; zone = Math.max(0.12, 0.3 - t * 0.006); flash[1] = flash[1] > 0 ? Math.max(0, flash[1] - dt) : Math.min(0, flash[1] + dt); flash[2] = flash[2] > 0 ? Math.max(0, flash[2] - dt) : Math.min(0, flash[2] + dt);
        if (Math.abs(pos) >= 100) { draw(); const w = pos < 0 ? 1 : 2; return g.win(w, `Pulled them over the line in ${t.toFixed(1)}s.`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#87ceeb'); UI.rect(ctx, 0, 200, W, 120, '#5a8f3a'); UI.rect(ctx, W / 2 - 150, 200, 4, 40, g.color(1)); UI.rect(ctx, W / 2 + 146, 200, 4, 40, g.color(2)); UI.rect(ctx, W / 2 - 2, 200, 4, 40, '#fff8');
        const cx = W / 2 + pos * 1.5;
        UI.rect(ctx, cx - 300, 214, 600, 6, '#c9a56a'); UI.rect(ctx, cx - 2, 190, 4, 30, '#c92a2a'); ctx.beginPath(); ctx.moveTo(cx + 2, 190); ctx.lineTo(cx + 18, 196); ctx.lineTo(cx + 2, 202); ctx.fillStyle = '#c92a2a'; ctx.fill();
        for (const p of [1, 2]) { for (let i = 0; i < 3; i++) { const x = cx + (p === 1 ? -1 : 1) * (60 + i * 50); const lean = (p === 1 ? -1 : 1) * 12; UI.rect(ctx, x - 6 - lean, 200, 6, 26, '#333'); UI.rect(ctx, x + 2 - lean, 200, 6, 26, '#333'); UI.roundRect(ctx, x - 10 + lean / 2, 160, 20, 44, 6, g.color(p)); UI.circle(ctx, x + lean, 148, 10, '#ffe0b3'); } }
        for (const p of [1, 2]) {
          const bx = p === 1 ? 60 : W - 60 - 240, by = 40; UI.roundRect(ctx, bx, by, 240, 26, 8, '#1c2238'); const zw = zone * 120; UI.rect(ctx, bx + 120 - zw, by + 3, zw * 2, 20, flash[p] > 0 ? '#51cf66' : '#2b8a3e'); const mx = bx + 120 + marker(p) * 116; UI.rect(ctx, mx - 3, by - 4, 6, 34, flash[p] < 0 ? '#ff6b6b' : '#fff'); UI.text(ctx, g.name(p), bx + 120, by + 44, { color: g.color(p), font: 'bold 13px system-ui' });
        }
      }
    },
  });
})();
