/* Bocce Balls — roll for the pallino, count the shots inside, knock to displace. */
(function () {
  const W = 420, H = 520, BALLS = 2, GOAL = 6, MAX_ENDS = 3;
  let starter = 1;
  Game.init({
    id: 'bocce-balls',
    rules: [
      'The pallino (white jack) is tossed to a random spot each end, then players alternate rolling their bocce balls.',
      'Tap once for the line, once for the weight. Your ball nudges any ball it hits — that includes the jack, so a "spocc" moves the target.',
      `At the end of an end the closest player scores one point for every ball nearer the jack than the rival's best ball.`,
      `First to ${GOAL} after a completed end wins; after ${MAX_ENDS} ends the leader wins.`,
    ],
    controls: { all: 'Tap the court or press <kbd>Space</kbd>: line, then weight' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'ROLL', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const field = UI.field(W, H, { friction: 4.5, wall: 0.6, min: 22 });
      const R = 13;
      const score = { 1: 0, 2: 0 };
      let turn = starter, end = 0, phase = 'aim', aim = 0.5, thrown = { 1: 0, 2: 0 };
      let shot = null, pallino = null;
      const aimM = UI.meter({ speed: 0.8 }), powM = UI.meter({ speed: 1.1 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(420px, 92vw)' } }, note, aimM.el, powM.el));
      const place = () => {
        pallino = field.add({ x: rndf(70, W - 70), y: rndf(70, 190), r: 8, m: 0.5, tag: 'jack' });
        pallino.x = rndf(70, W - 70); pallino.y = rndf(70, 190);
      };
      place();
      function dist(d) { return Math.hypot(d.x - pallino.x, d.y - pallino.y); }
      function balls(p) { return field.discs.filter((d) => d.tag === p && !d.dead); }
      function best(p) { const b = balls(p); return b.length ? Math.min(...b.map(dist)) : Infinity; }
      function act() {
        if (g.over || shot || field.moving()) return;
        if (phase === 'aim') { phase = 'pow'; aim = aimM.v; return; }
        if (phase === 'pow') {
          const v = powM.v;
          const x = W / 2 + (aim - 0.5) * 300;
          shot = field.add({ x: clamp(x, 20, W - 20), y: H - 34, vx: (x - W / 2) * 2.2, vy: -(620 + v * 1500), r: R, m: 1, tag: turn });
          phase = 'roll'; g.sfx('go');
        }
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function settle() {
        shot = null; phase = 'aim'; thrown[turn]++;
        g.sfx('move');
        aimM.set(0.5); aimM.dir = 1; powM.set(0); powM.dir = 1;
        if (thrown[1] >= BALLS && thrown[2] >= BALLS) return closeEnd();
        turn = 3 - turn;
        if (thrown[turn] >= BALLS) turn = 3 - turn;      // rival is out of balls: shoot again
        g.turn(turn);
      }
      function closeEnd() {
        const b1 = best(1), b2 = best(2);
        let pts = 0, w = 0;
        if (b1 !== b2) { w = b1 < b2 ? 1 : 2; pts = balls(w).filter((d) => dist(d) < best(3 - w)).length; }
        if (w) { score[w] += pts; g.sfx('win'); g.toast(`${esc(g.name(w))} +${pts} on the end`, 1200); }
        else g.toast('Dead even end', 1000);
        end++;
        field.discs.length = 0;
        g.points(score[1], score[2]);
        if (score[1] >= GOAL || score[2] >= GOAL || end >= MAX_ENDS) return endGame();
        thrown = { 1: 0, 2: 0 }; place();
        turn = end % 2 ? 3 - starter : starter; g.turn(turn);
      }
      function endGame() {
        starter = 3 - starter;
        if (score[1] === score[2]) return g.draw(`${end} ends, ${score[1]} apiece.`);
        const w = score[1] > score[2] ? 1 : 2;
        g.win(w, `${score[w]} to ${score[3 - w]} over ${end} end${end > 1 ? 's' : ''}.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'pow') powM.step(dt); }
        field.step(dt);
        if (shot) { shot.wait = (shot.wait || 0) + dt; if (!field.moving() || shot.wait > 0.9) settle(); }
        draw();
        const b1 = best(1), b2 = best(2);
        note.textContent = `end ${end + 1}/${MAX_ENDS} · ${g.name(turn)} ball ${Math.min(BALLS, thrown[turn] + 1)}/${BALLS} · nearest jack ${isFinite(b1) ? b1.toFixed(0) : '—'} vs ${isFinite(b2) ? b2.toFixed(0) : '—'} · ${score[1]}–${score[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#7a5a34');
        for (let i = 0; i < 16; i++) UI.rect(ctx, i * 27, 0, 13, H, i % 2 ? '#846137' : '#7a5a34');
        UI.rect(ctx, 0, H - 54, W, 54, '#6a4d2b');
        UI.rect(ctx, 0, 0, W, 8, '#00000033');
        field.discs.forEach((d) => {
          if (d.dead) return;
          if (d.tag === 'jack') { UI.circle(ctx, d.x, d.y, d.r, '#f8f9fa'); UI.circle(ctx, d.x - 2, d.y - 2, 2, '#adb5bd'); return; }
          UI.circle(ctx, d.x, d.y, d.r, g.color(d.tag));
          UI.circle(ctx, d.x - 3, d.y - 4, d.r * 0.35, '#ffffff44');
          if (shot !== d) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r + 2, 0, Math.PI * 2); ctx.strokeStyle = '#00000033'; ctx.lineWidth = 1; ctx.stroke(); }
        });
        if (shot) { ctx.beginPath(); ctx.moveTo(pallino.x, pallino.y); ctx.lineTo(shot.x, shot.y); ctx.setLineDash([4, 6]); ctx.strokeStyle = '#ffffff33'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); }
        if (!shot && phase !== 'roll') {
          const x = W / 2 + ((phase === 'pow' ? aim : aimM.v) - 0.5) * 300;
          UI.circle(ctx, clamp(x, 20, W - 20), H - 34, R, g.color(turn));
          ctx.globalAlpha = .5; UI.rect(ctx, clamp(x, 20, W - 20) - 1, 40, 2, H - 80, g.color(turn)); ctx.globalAlpha = 1;
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
