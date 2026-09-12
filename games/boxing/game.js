/* Boxing — jab/hook/block with stamina; 3 rounds of 60s or KO. */
(function () {
  const W = 700, H = 380;
  Game.init({
    id: 'boxing',
    rules: ['Move in and out of range. <b>Jab</b> is quick and light, <b>Hook</b> is slow and heavy. <b>Block</b> absorbs most damage but drains stamina.', 'Every punch costs stamina; with low stamina punches are weak. Stamina recovers when you are not attacking.', 'Three 60-second rounds. Knock your rival\'s health to zero for a KO, otherwise the higher health total after 3 rounds wins.'],
    controls: { p1: '<kbd>A</kbd>/<kbd>D</kbd> move · <kbd>F</kbd> jab · <kbd>G</kbd> hook · <kbd>S</kbd> block', p2: '<kbd>←</kbd>/<kbd>→</kbd> move · <kbd>K</kbd> jab · <kbd>L</kbd> hook · <kbd>↓</kbd> block' },
    points: true,
    pad: [{ side: 1, dpad: { left: 'KeyA', right: 'KeyD', down: 'KeyS' }, labels: { down: '🛡' }, buttons: [{ code: 'KeyF', label: 'Jab' }, { code: 'KeyG', label: 'Hook' }] }, { side: 2, dpad: { left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown' }, labels: { down: '🛡' }, buttons: [{ code: 'KeyK', label: 'Jab' }, { code: 'KeyL', label: 'Hook' }] }],
    async onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const B = { 1: mk(220, 1), 2: mk(480, -1) }; let round = 1, t = 60, between = 0;
      function mk(x, f) { return { x, f, hp: 100, st: 100, act: null, actT: 0, cd: 0, hitT: 0, block: false }; }
      const ctl = { 1: { l: 'KeyA', r: 'KeyD', jab: 'KeyF', hook: 'KeyG', block: 'KeyS' }, 2: { l: 'ArrowLeft', r: 'ArrowRight', jab: 'KeyK', hook: 'KeyL', block: 'ArrowDown' } };
      g.key(['KeyF', 'KeyG', 'KeyK', 'KeyL'], (code) => { const p = (code === 'KeyF' || code === 'KeyG') ? 1 : 2; const kind = (code === 'KeyF' || code === 'KeyK') ? 'jab' : 'hook'; punch(p, kind); });
      function punch(p, kind) { const b = B[p]; if (between > 0 || b.act || b.cd > 0 || b.block || b.st < 5) return; b.act = kind; b.actT = kind === 'jab' ? 0.18 : 0.42; b.st = Math.max(0, b.st - (kind === 'jab' ? 8 : 18)); b.landed = false; g.sfx('click'); }
      const status = () => g.status(`Round ${round}/3 · ${Math.ceil(t)}s`);
      status(); g.points(100, 100);
      draw();
      await g.countdown(3, 'Round 1');
      g.loop((dt) => {
        if (between > 0) { between -= dt; if (between <= 0) { round++; t = 60; B[1].st = B[2].st = 100; B[1].x = 220; B[2].x = 480; g.toast(`Round ${round}`, 1000); g.sfx('go'); } draw(); return; }
        t -= dt;
        for (const p of [1, 2]) {
          const b = B[p], c = ctl[p], o = B[3 - p]; b.cd -= dt; b.hitT -= dt;
          b.block = g.down(c.block) && b.st > 0;
          if (b.block) b.st = Math.max(0, b.st - 6 * dt); else if (!b.act) b.st = Math.min(100, b.st + 14 * dt);
          if (!b.act && !b.block) { if (g.down(c.l)) b.x -= 160 * dt; if (g.down(c.r)) b.x += 160 * dt; }
          b.x = clamp(b.x, 40, W - 40);
          if (b.act) {
            b.actT -= dt;
            const reach = b.act === 'jab' ? 70 : 90; const inRange = Math.abs(o.x - b.x) < reach && Math.sign(o.x - b.x) === b.f;
            if (!b.landed && b.actT < (b.act === 'jab' ? 0.1 : 0.2) && inRange) { b.landed = true; const power = (b.act === 'jab' ? 6 : 14) * (0.4 + 0.6 * b.st / 100); const dmg = o.block ? power * 0.2 : power; o.hp = Math.max(0, o.hp - dmg); o.hitT = 0.25; if (!o.block) o.x = clamp(o.x + b.f * 18, 40, W - 40); g.sfx(o.block ? 'bounce' : 'hit'); g.points(Math.round(B[1].hp), Math.round(B[2].hp)); }
            if (b.actT <= 0) { b.act = null; b.cd = 0.15; }
          }
        }
        if (B[1].x > B[2].x - 44) { const m = (B[1].x + B[2].x) / 2; B[1].x = m - 22; B[2].x = m + 22; }
        if (B[1].hp <= 0 || B[2].hp <= 0) { draw(); const w = B[1].hp > 0 ? 1 : 2; return g.win(w, `KO in round ${round}!`); }
        if (t <= 0) { if (round >= 3) { draw(); if (Math.round(B[1].hp) === Math.round(B[2].hp)) return g.draw('Judges score it even.'); const w = B[1].hp > B[2].hp ? 1 : 2; return g.win(w, `On points: ${Math.round(B[1].hp)} – ${Math.round(B[2].hp)} health.`); } between = 2; g.status('End of round'); g.sfx('go'); }
        else status();
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#2a2a3a'); UI.rect(ctx, 0, H - 80, W, 80, '#3a4a6a'); for (let i = 0; i < 3; i++) UI.rect(ctx, 0, 90 + i * 40, W, 4, ['#ff6b6b', '#fff', '#4dabf7'][i]);
        for (const p of [1, 2]) {
          const b = B[p]; const y = H - 80; const ext = b.act ? (b.act === 'jab' ? 40 : 55) * clamp(1 - Math.abs(b.actT - (b.act === 'jab' ? 0.09 : 0.21)) / (b.act === 'jab' ? 0.09 : 0.21), 0, 1) : 0;
          ctx.save(); ctx.translate(b.x, y); if (b.f < 0) ctx.scale(-1, 1);
          UI.rect(ctx, -10, -60, 8, 60, '#333'); UI.rect(ctx, 2, -60, 8, 60, '#333'); UI.roundRect(ctx, -18, -140, 36, 84, 10, b.hitT > 0 ? '#fff' : g.color(p)); UI.circle(ctx, 0, -158, 16, '#ffe0b3');
          if (b.block) { UI.circle(ctx, 14, -150, 12, '#c92a2a'); UI.circle(ctx, 22, -128, 12, '#c92a2a'); } else { UI.circle(ctx, 26 + ext, -120, 12, '#c92a2a'); UI.circle(ctx, 18 + (b.act ? 0 : 6), -95, 12, '#c92a2a'); }
          ctx.restore();
          const hx = p === 1 ? 20 : W - 220; UI.rect(ctx, hx, 14, 200, 14, '#0006'); UI.rect(ctx, hx, 14, 2 * b.hp, 14, b.hp > 30 ? '#51cf66' : '#ff6b6b'); UI.rect(ctx, hx, 32, 200, 6, '#0006'); UI.rect(ctx, hx, 32, 2 * b.st, 6, '#ffd43b'); UI.text(ctx, g.name(p), hx + 100, 21, { color: '#fff', font: 'bold 11px system-ui' });
        }
        UI.text(ctx, `R${round}  ${Math.ceil(Math.max(0, t))}`, W / 2, 24, { color: '#fff', font: 'bold 18px monospace' });
      }
    },
  });
})();
