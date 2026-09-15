/* Horseshoes — ringer 3, lean 2, shoe in the pit 1. Cancellation scoring, first to 21. */
(function () {
  const W = 380, H = 460, PER_END = 4, GOAL = 21, MAX_ENDS = 4;
  const STAKE = { x: W / 2, y: 96 };
  let starter = 1;
  Game.init({
    id: 'horseshoes',
    rules: [
      'Four shoes each per end. Tap once for the sideways aim, once for the length of the throw.',
      'A ringer around the stake is 3, a shoe leaning on the stake is 2, a shoe in the pit is 1, anything else is nothing.',
      'Cancellation scoring: at the end of each end only the difference is banked, so a 4–1 end is 3 points, not 5.',
      `First to ${GOAL} after a completed end wins. After ${MAX_ENDS} ends the leader wins.`,
    ],
    controls: { all: 'Tap the clay or press <kbd>Space</kbd>: aim, then throw' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'TOSS', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }, endPts = { 1: 0, 2: 0 };
      let turn = starter, end = 0, phase = 'aim', aim = 0.5, thrown = { 1: 0, 2: 0 };
      let shot = null, landed = [];
      const aimM = UI.meter({ speed: 0.95 }), lenM = UI.meter({ speed: 1.2 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(380px, 92vw)' } }, note, aimM.el, lenM.el));
      g.points(0, 0);
      const leader = () => (starter === 1 ? 1 : 2);
      function act() {
        if (g.over || shot) return;
        if (phase === 'aim') { phase = 'len'; aim = aimM.v; return; }
        if (phase === 'len') {
          const v = lenM.v;
          const spread = (aim - 0.5) * 210;
          const reach = 120 + v * 250;
          shot = { t: 0, x: STAKE.x + spread, y: STAKE.y + 134 - reach, spin: 0 };
          phase = 'fly'; g.sfx('go');
        }
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function grade(p) {
        const d = Math.hypot(p.x - STAKE.x, p.y - STAKE.y);
        if (d <= 14) return { pts: 3, name: 'RINGER!' };
        if (d <= 27) return { pts: 2, name: 'lean on the stake' };
        if (p.x > 86 && p.x < W - 86 && p.y > STAKE.y - 40 && p.y < STAKE.y + 104) return { pts: 1, name: 'in the pit' };
        return { pts: 0, name: 'wide of the clay' };
      }
      function land() {
        const p = { x: clamp(shot.x, 10, W - 10), y: clamp(shot.y, 20, H - 40) };
        const gr = grade(p);
        landed.push(Object.assign(p, { p: turn, pts: gr.pts }));
        endPts[turn] += gr.pts; thrown[turn]++;
        shot = null; phase = 'aim';
        g.sfx(gr.pts >= 3 ? 'coin' : gr.pts ? 'score' : 'bad');
        g.toast(gr.name + (gr.pts ? ` +${gr.pts}` : ''), 900);
        aimM.set(0.5); aimM.dir = 1; lenM.set(0); lenM.dir = 1;
        if (thrown[1] >= PER_END && thrown[2] >= PER_END) return closeEnd();
        turn = 3 - turn; g.turn(turn);
      }
      function closeEnd() {
        end++;
        const diff = endPts[1] - endPts[2];
        if (diff) { const w = diff > 0 ? 1 : 2; score[w] += Math.abs(diff); g.sfx('win'); g.toast(`${esc(g.name(w))} takes the end ${Math.abs(diff)}`, 1200); }
        else { g.sfx('draw'); g.toast('Even end — nothing banked', 1100); }
        endPts[1] = endPts[2] = 0; landed = []; thrown = { 1: 0, 2: 0 };
        g.points(score[1], score[2]);
        if (score[1] >= GOAL || score[2] >= GOAL || end >= MAX_ENDS) return endGame();
        turn = end % 2 ? 3 - starter : starter;
        g.turn(turn);
      }
      function endGame() {
        const other = 3 - (score[1] > score[2] ? 1 : 2);
        starter = 3 - starter;
        if (score[1] === score[2]) return g.draw(`${end} ends and the pits are level at ${score[1]}.`);
        const w = score[1] > score[2] ? 1 : 2;
        g.win(w, `${score[w]} to ${score[3 - w]} across ${end} end${end > 1 ? 's' : ''}.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'len') lenM.step(dt); }
        if (shot) { shot.t = Math.min(1, shot.t + dt * 3.2); shot.spin += dt * 8; if (shot.t >= 1) land(); }
        draw();
        note.textContent = `end ${end + 1}/${MAX_ENDS} · ${g.name(turn)} shoe ${Math.min(PER_END, thrown[turn] + 1)}/${PER_END} · this end ${endPts[1]}–${endPts[2]} · match ${score[1]}–${score[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#3a6b46');
        UI.roundRect(ctx, 66, STAKE.y - 56, W - 132, 186, 22, '#a4712f');
        UI.roundRect(ctx, 78, STAKE.y - 44, W - 156, 162, 16, '#b9803a');
        UI.rect(ctx, 78, STAKE.y + 118, W - 156, 0, '#8d6229');
        UI.rect(ctx, STAKE.x - 4, STAKE.y - 44, 8, 56, '#ced4da');
        UI.circle(ctx, STAKE.x, STAKE.y - 44, 6, '#ff6b6b');
        UI.rect(ctx, 0, H - 92, W, 92, '#2e5c39');
        landed.forEach((s) => shoe(ctx, s.x, s.y, g.color(s.p), s.pts, 1));
        if (shot) {
          const e = shot.t, y = lerp(H - 56, shot.y, e), x = lerp(W / 2 + (aim - 0.5) * 40, shot.x, e), k = 1 - 0.45 * Math.sin(e * Math.PI);
          shoe(ctx, x, y, g.color(turn), 0, k, shot.spin);
        } else shoe(ctx, W / 2 + ((phase === 'len' ? aim : aimM.v) - 0.5) * 210, H - 54, g.color(turn), 0, 1, 0);
      }
      function shoe(ctx, x, y, color, pts, k, rot) {
        ctx.save(); ctx.translate(x, y); ctx.scale(k, k); if (rot) ctx.rotate(rot);
        ctx.strokeStyle = pts >= 3 ? '#ffd43b' : color; ctx.lineWidth = 7; ctx.lineCap = 'round';
        for (const [a, b] of [[0.2, 0.8], [1.2, 1.8]]) { ctx.beginPath(); ctx.arc(0, 0, 15, Math.PI * a, Math.PI * b, true); ctx.stroke(); }
        ctx.restore();
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
