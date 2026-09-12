/* Basketball Shootout — timing power bar; 10 shots each from varying distance; ball arc physics. */
(function () {
  const W = 700, H = 400, SHOTS = 10;
  Game.init({
    id: 'basketball-shootout',
    rules: ['Players alternate shots. Press once to stop the power bar — the sweet spot changes with distance (shown by the green band).', `Each player takes ${SHOTS} shots from varying distances: 2 points inside the arc, 3 points from beyond it.`, 'Highest score wins; ties go to sudden death.'],
    controls: { all: '<kbd>Space</kbd> / tap to stop the power bar' },
    points: true,
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }; const taken = { 1: 0, 2: 0 }; let turn = 1, power = 0, dir = 1, charging = true, ball = null, shooterX = 150, t = 0, sudden = false;
      const HOOP = { x: 600, y: 170 };
      const newSpot = () => { shooterX = rndf(90, 420); };
      const status = () => g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · shot ${Math.min(SHOTS, taken[turn] + 1)}${sudden ? ' (sudden death)' : ''}/${SHOTS} · ${HOOP.x - shooterX > 330 ? '3 pts' : '2 pts'}`);
      const ideal = () => clamp((HOOP.x - shooterX) / 520, 0.35, 0.95);
      const act = () => { if (!charging || g.over || ball) return; charging = false; const p = power; const d = HOOP.x - shooterX; const acc = 1 - Math.abs(p - ideal()) * 3; const v = 520 + (p - ideal()) * 900; const ang = -Math.PI / 3.6; ball = { x: shooterX, y: H - 110, vx: Math.cos(ang) * (d / 300) * v * 0.62, vy: Math.sin(ang) * v, scored: false, acc }; g.sfx('hit'); };
      g.key('Space', act); UI.pointer(canvas, { down: act }, W, H);
      newSpot(); status(); g.points(0, 0);
      g.loop((dt) => {
        t += dt;
        if (charging) { power += dir * dt * 1.4; if (power > 1) { power = 1; dir = -1; } if (power < 0) { power = 0; dir = 1; } }
        if (ball) {
          ball.vy += 900 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          // rim collisions
          for (const rx of [HOOP.x - 22, HOOP.x + 22]) { const d = dist(ball.x, ball.y, rx, HOOP.y); if (d < 12 + 3) { const nx = (ball.x - rx) / d, ny = (ball.y - HOOP.y) / d; const rel = ball.vx * nx + ball.vy * ny; if (rel < 0) { ball.vx -= 1.6 * rel * nx; ball.vy -= 1.6 * rel * ny; g.sfx('bounce'); } ball.x = rx + nx * 15; ball.y = HOOP.y + ny * 15; } }
          if (ball.x > HOOP.x + 40 && ball.x < HOOP.x + 48 && ball.y > HOOP.y - 90 && ball.y < HOOP.y + 10) { ball.vx = -Math.abs(ball.vx) * 0.6; g.sfx('bounce'); }
          if (!ball.scored && ball.vy > 0 && ball.y > HOOP.y && ball.y < HOOP.y + 20 && Math.abs(ball.x - HOOP.x) < 16) { ball.scored = true; const pts = HOOP.x - shooterX > 330 ? 3 : 2; score[turn] += pts; g.points(score[1], score[2]); g.sfx('score'); g.status(`Swish! +${pts}`); }
          if (ball.y > H - 20 || ball.x > W + 30 || ball.x < -30) { ball = null; taken[turn]++; finishShot(); }
        }
        draw();
      });
      function finishShot() {
        const a = taken[1], b = taken[2];
        if (a >= SHOTS && b >= SHOTS && a === b) { if (score[1] !== score[2]) { draw(); return g.win(score[1] > score[2] ? 1 : 2, `${score[1]} – ${score[2]}.`); } sudden = true; }
        turn = 3 - turn; charging = true; power = 0; dir = 1; newSpot(); status();
      }
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1f2340'); UI.rect(ctx, 0, H - 40, W, 40, '#b5732a'); ctx.strokeStyle = '#fff5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(HOOP.x, H - 40, 330, Math.PI, Math.PI * 1.5); ctx.stroke();
        UI.rect(ctx, HOOP.x + 40, HOOP.y - 90, 8, 100, '#eee'); UI.rect(ctx, HOOP.x + 44, HOOP.y - 40, 6, H - 40 - HOOP.y + 40, '#888'); UI.rect(ctx, HOOP.x - 22, HOOP.y - 2, 44, 4, '#ff6b1a'); UI.circle(ctx, HOOP.x - 22, HOOP.y, 3, '#ff6b1a'); UI.circle(ctx, HOOP.x + 22, HOOP.y, 3, '#ff6b1a');
        ctx.strokeStyle = '#fff8'; ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(HOOP.x + i * 10, HOOP.y); ctx.lineTo(HOOP.x + i * 6, HOOP.y + 40); ctx.stroke(); }
        const sy = H - 40; UI.roundRect(ctx, shooterX - 12, sy - 70, 24, 50, 8, g.color(turn)); UI.circle(ctx, shooterX, sy - 82, 11, '#ffe0b3'); UI.rect(ctx, shooterX - 8, sy - 20, 6, 20, '#333'); UI.rect(ctx, shooterX + 2, sy - 20, 6, 20, '#333');
        if (ball) { UI.circle(ctx, ball.x, ball.y, 12, '#ff8c42'); ctx.strokeStyle = '#7a3a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2); ctx.moveTo(ball.x - 12, ball.y); ctx.lineTo(ball.x + 12, ball.y); ctx.moveTo(ball.x, ball.y - 12); ctx.lineTo(ball.x, ball.y + 12); ctx.stroke(); } else if (!g.over) UI.circle(ctx, shooterX + 16, sy - 70, 12, '#ff8c42');
        // power bar
        UI.roundRect(ctx, 30, 30, 22, 200, 6, '#0e1020'); const id = ideal(); UI.rect(ctx, 30, 230 - (id + 0.08) * 200, 22, 32, '#2b8a3e'); UI.rect(ctx, 30, 230 - power * 200, 22, 4, '#fff');
        UI.text(ctx, `${g.name(1)} ${score[1]}`, 130, 20, { color: g.color(1), font: 'bold 14px system-ui' }); UI.text(ctx, `${g.name(2)} ${score[2]}`, W - 130, 20, { color: g.color(2), font: 'bold 14px system-ui' });
      }
    },
  });
})();
