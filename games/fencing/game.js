/* Fencing — advance/retreat, lunge, parry; first to 5 touches. */
(function () {
  const W = 800, H = 300, TARGET = 5;
  Game.init({
    id: 'fencing',
    rules: ['Advance and retreat along the piste. A <b>lunge</b> extends your blade for a moment — if it reaches your rival, touché!', 'A <b>parry</b> at the right moment deflects a lunge and leaves the attacker open for a riposte. Both lunging at once: no touch.', `Step off the end of the piste and your rival gets the touch. First to ${TARGET} wins.`],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> move · <kbd>F</kbd> lunge · <kbd>S</kbd> parry', p2: '<kbd>←</kbd>/<kbd>→</kbd> move · <kbd>K</kbd> lunge · <kbd>↓</kbd> parry' },
    points: true,
    pad: [{ side: 1, dpad: { left: 'KeyA', right: 'KeyD', down: 'KeyS' }, labels: { down: '🛡' }, buttons: [{ code: 'KeyF', label: 'Lunge' }] }, { side: 2, dpad: { left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown' }, labels: { down: '🛡' }, buttons: [{ code: 'KeyK', label: 'Lunge' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; let F, pause = 0;
      const reset = () => { F = { 1: { x: 260, f: 1, lunge: 0, parry: 0, cd: 0, open: 0 }, 2: { x: 540, f: -1, lunge: 0, parry: 0, cd: 0, open: 0 } }; };
      reset();
      g.key(['KeyF', 'KeyK'], (code) => { const p = code === 'KeyF' ? 1 : 2; const f = F[p]; if (pause > 0 || f.cd > 0 || f.lunge > 0 || f.parry > 0) return; f.lunge = 0.3; f.cd = 0.6; g.sfx('click'); });
      g.key(['KeyS', 'ArrowDown'], (code) => { const p = code === 'KeyS' ? 1 : 2; const f = F[p]; if (pause > 0 || f.cd > 0 || f.lunge > 0) return; f.parry = 0.25; f.cd = 0.45; g.sfx('tick'); });
      const touch = (p, why) => { score[p]++; g.points(score[1], score[2]); g.sfx('score'); if (score[p] >= TARGET) { draw(); return g.win(p, `${score[1]} – ${score[2]} touches.`); } g.status(`Touché! ${why}`); pause = 1.2; };
      draw();
      await g.countdown(3, 'En garde!');
      g.loop((dt) => {
        if (pause > 0) { pause -= dt; if (pause <= 0) reset(); draw(); return; }
        for (const p of [1, 2]) {
          const f = F[p]; f.cd -= dt; f.open -= dt; f.lunge -= dt; f.parry -= dt;
          const l = g.down(p === 1 ? 'KeyA' : 'ArrowLeft'), r = g.down(p === 1 ? 'KeyD' : 'ArrowRight');
          if (f.lunge <= 0 && f.open <= 0) f.x += ((r ? 1 : 0) - (l ? 1 : 0)) * 180 * dt;
          if (f.lunge > 0) f.x += f.f * 260 * dt;
          if (f.x < 30 || f.x > W - 30) return touch(3 - p, `${esc(g.name(p))} stepped off the piste`);
        }
        const a = F[1], b = F[2];
        if (a.x > b.x - 40) { const m = (a.x + b.x) / 2; a.x = m - 20; b.x = m + 20; }
        const reachA = a.x + 30 + (a.lunge > 0 ? 70 : 0), reachB = b.x - 30 - (b.lunge > 0 ? 70 : 0);
        const hitA = a.lunge > 0 && reachA >= b.x - 10, hitB = b.lunge > 0 && reachB <= a.x + 10;
        if (hitA && hitB) { a.lunge = 0; b.lunge = 0; a.cd = 0.5; b.cd = 0.5; g.sfx('bounce'); g.status('Simultaneous — no touch'); }
        else if (hitA) { if (b.parry > 0) { a.lunge = 0; a.open = 0.6; a.cd = 0.8; b.cd = 0; g.sfx('hit'); g.status('Parried!'); } else return touch(1, `${esc(g.name(1))} lands the lunge`); }
        else if (hitB) { if (a.parry > 0) { b.lunge = 0; b.open = 0.6; b.cd = 0.8; a.cd = 0; g.sfx('hit'); g.status('Parried!'); } else return touch(2, `${esc(g.name(2))} lands the lunge`); }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1c2238'); UI.rect(ctx, 20, H - 60, W - 40, 12, '#8d8d9d'); UI.rect(ctx, 20, H - 60, 6, 12, '#ff6b6b'); UI.rect(ctx, W - 26, H - 60, 6, 12, '#4dabf7');
        for (const p of [1, 2]) {
          const f = F[p]; const y = H - 60; ctx.save(); ctx.translate(f.x, y); if (f.f < 0) ctx.scale(-1, 1);
          const lung = f.lunge > 0; UI.rect(ctx, -12, -50, 8, 50, '#333'); UI.rect(ctx, lung ? 14 : 4, -50, 8, 50, '#333'); UI.roundRect(ctx, -14, -120, 28, 72, 8, f.open > 0 ? '#888' : g.color(p)); UI.circle(ctx, 0, -135, 14, '#e8ecf8'); UI.rect(ctx, 2, -140, 14, 12, '#333');
          const bl = lung ? 100 : 60; ctx.strokeStyle = f.parry > 0 ? '#ffd43b' : '#ddd'; ctx.lineWidth = f.parry > 0 ? 5 : 3; ctx.beginPath(); ctx.moveTo(10, -95); ctx.lineTo(10 + bl, f.parry > 0 ? -130 : -95); ctx.stroke(); UI.circle(ctx, 14, -95, 6, '#999');
          ctx.restore();
        }
        UI.text(ctx, `${score[1]}   –   ${score[2]}`, W / 2, 30, { color: '#fff', font: 'bold 26px system-ui' });
      }
    },
  });
})();
