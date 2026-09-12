/* Darts 301 — timing-based aim: horizontal then vertical oscillation. Double-out not required. */
(function () {
  const SIZE = 400, CX = 200, CY = 200; const NUMS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  Game.init({
    id: 'darts',
    rules: ['Start at 301. Each turn you throw three darts; subtract what you hit. Reach exactly zero to win.', 'Going below zero (a bust) resets your score to what it was at the start of the turn.', 'Aim is a two-step timing game: press once to lock the horizontal wobble, once more to lock the vertical. Scatter increases with fatigue over a turn.'],
    controls: { all: '<kbd>Space</kbd> / tap to lock aim (twice per dart)' },
    points: true,
    onStart(g) {
      const { canvas, ctx } = UI.canvas(SIZE, SIZE + 40); g.stage.appendChild(canvas);
      const score = { 1: 301, 2: 301 }; let turn = 1, dart = 0, startScore = 301, phase = 'x', t = 0, ax = 0, ay = 0, darts = [], busy = false, turnHits = [];
      g.points(score[1], score[2]);
      const status = () => g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · dart ${dart + 1}/3 · needs ${score[turn]}`);
      status();
      const act = () => { if (busy || g.over) return; if (phase === 'x') { ax = Math.sin(t * 5) * 110; phase = 'y'; g.sfx('tick'); } else { ay = Math.sin(t * 6.3) * 110; throwDart(); } };
      g.key('Space', act); UI.pointer(canvas, { down: act }, SIZE, SIZE + 40);
      function scoreAt(x, y) { const d = dist(x, y, CX, CY); if (d > 170) return { v: 0, txt: 'Miss' }; if (d < 7) return { v: 50, txt: 'Bull 50' }; if (d < 16) return { v: 25, txt: 'Outer bull 25' }; let ang = Math.atan2(y - CY, x - CX) + Math.PI / 2; if (ang < 0) ang += Math.PI * 2; const idx = Math.round(ang / (Math.PI * 2 / 20)) % 20; const n = NUMS[idx]; if (d > 160) return { v: n * 2, txt: `Double ${n}` }; if (d > 95 && d < 105) return { v: n * 3, txt: `Treble ${n}` }; return { v: n, txt: `${n}` }; }
      function throwDart() {
        busy = true; const fatigue = 1 + dart * 0.4; const x = CX + ax + rndf(-6, 6) * fatigue, y = CY + ay + rndf(-6, 6) * fatigue;
        darts.push({ x, y, p: turn }); const s = scoreAt(x, y); turnHits.push(s.v); g.sfx(s.v >= 40 ? 'score' : 'hit');
        const ns = score[turn] - s.v;
        g.status(`${s.txt}!`);
        if (ns === 0) { score[turn] = 0; g.points(score[1], score[2]); draw(); return g.win(turn, `Checked out with ${s.txt}.`); }
        g.after(700, () => {
          if (ns < 0) { score[turn] = startScore; g.toast('Bust! Score reset', 1000); g.sfx('bad'); endTurn(); return; }
          score[turn] = ns; g.points(score[1], score[2]); dart++;
          if (dart >= 3) { g.toast(`${esc(g.name(turn))} scored ${turnHits.reduce((a, b) => a + b, 0)}`, 1000); endTurn(); return; }
          phase = 'x'; busy = false; status();
        });
      }
      function endTurn() { turn = 3 - turn; dart = 0; startScore = score[turn]; turnHits = []; darts = []; phase = 'x'; busy = false; status(); }
      g.loop((dt) => { t += dt; draw(); });
      function draw() {
        UI.rect(ctx, 0, 0, SIZE, SIZE + 40, '#1c2238');
        UI.circle(ctx, CX, CY, 180, '#111');
        for (let i = 0; i < 20; i++) { const a0 = -Math.PI / 2 - Math.PI / 20 + i * Math.PI / 10, a1 = a0 + Math.PI / 10; const wedge = (r0, r1, col) => { ctx.beginPath(); ctx.arc(CX, CY, r1, a0, a1); ctx.arc(CX, CY, r0, a1, a0, true); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }; const dark = i % 2 === 0; wedge(16, 95, dark ? '#0f0f0f' : '#f0e6c8'); wedge(95, 105, dark ? '#c92a2a' : '#2b8a3e'); wedge(105, 160, dark ? '#0f0f0f' : '#f0e6c8'); wedge(160, 170, dark ? '#c92a2a' : '#2b8a3e'); const am = (a0 + a1) / 2; UI.text(ctx, NUMS[i], CX + Math.cos(am) * 182, CY + Math.sin(am) * 182, { color: '#fff', font: 'bold 12px system-ui' }); }
        UI.circle(ctx, CX, CY, 16, '#2b8a3e'); UI.circle(ctx, CX, CY, 7, '#c92a2a');
        darts.forEach((d) => { UI.circle(ctx, d.x, d.y, 4, g.color(d.p)); ctx.strokeStyle = g.color(d.p); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 14, d.y - 22); ctx.stroke(); });
        if (!busy && !g.over) { const px = phase === 'x' ? CX + Math.sin(t * 5) * 110 : CX + ax; const py = phase === 'y' ? CY + Math.sin(t * 6.3) * 110 : CY + ay; ctx.strokeStyle = g.color(turn); ctx.lineWidth = 2; if (phase === 'x') { ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, SIZE - 10); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, SIZE - 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(10, py); ctx.lineTo(SIZE - 10, py); ctx.stroke(); UI.circle(ctx, px, py, 6, g.color(turn)); } }
        UI.text(ctx, `${g.name(1)} ${score[1]}`, 90, SIZE + 20, { color: g.color(1), font: 'bold 16px system-ui' }); UI.text(ctx, `${g.name(2)} ${score[2]}`, SIZE - 90, SIZE + 20, { color: g.color(2), font: 'bold 16px system-ui' });
        UI.text(ctx, '🎯'.repeat(3 - dart), CX, SIZE + 20, { font: '16px system-ui' });
      }
    },
  });
})();
