/* Archery — wind blows each end; compensate with the aim meter, then hold steady. */
(function () {
  const W = 440, H = 440, ARROWS = 10, TR = 150, TC = 220;
  let starter = 1;
  Game.init({
    id: 'archery',
    rules: [
      'Ten arrows each at a 40 m face. Tap once to stop the windward aim, tap again to release — the second meter is your bow hold.',
      `Wind (shown above the butts) shunts the arrow sideways as it flies: aim ${'into'} the wind to correct it.`,
      'Rings score 10 down to 1. A ragged hold drops the arrow low or high, never sideways.',
      'Most points after twenty arrows wins; a tie goes to the archer with more golds (10s and Xs).',
    ],
    controls: { all: 'Tap the butts or press <kbd>Space</kbd>: first aim, then loose' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'LOOSE', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const sc = { 1: 0, 2: 0 }, golds = { 1: 0, 2: 0 };
      let turn = starter, shot = { 1: 0, 2: 0 };
      let wind = rndf(-1, 1), phase = 'aim', aim = 0.5, hold = 0.5, fly = null, hits = [];
      const aimM = UI.meter({ speed: 0.75 }), holdM = UI.meter({ speed: 1.35 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(440px, 92vw)' } }, note, aimM.el, holdM.el));
      function act() {
        if (g.over || fly) return;
        if (phase === 'aim') { phase = 'hold'; aim = aimM.v; return; }
        if (phase === 'hold') {
          phase = 'fly'; hold = holdM.v;
          const ax = (aim - 0.5) * 2 * TR;              // bow aim, px
          const drift = wind * 62;                       // wind pushes the arrow
          const drop = (hold - 0.5) * 2 * 96;            // vertical error
          fly = { t: 0, x0: W / 2 + ax * 0.2, y0: H - 26, tx: W / 2 + ax + drift, ty: TC + drop };
          g.sfx('go');
        }
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function score(v) { const r = Math.hypot(v.x - W / 2, v.y - TC); return r <= 12 ? 10 : r <= 30 ? 9 : r <= 48 ? 8 : r <= 66 ? 7 : r <= 84 ? 6 : r <= 102 ? 5 : r <= 120 ? 4 : r <= 138 ? 3 : r <= TR ? 2 : 0; }
      function land() {
        const p = { x: fly.tx, y: fly.ty };
        const pts = score(p);
        fly = null; phase = 'aim';
        hits.push(Object.assign({ p: turn, pts, life: 6 }, p));
        sc[turn] += pts; shot[turn]++;
        if (pts >= 9) golds[turn]++;
        g.sfx(pts >= 9 ? 'coin' : pts >= 5 ? 'score' : pts ? 'hit' : 'bad');
        g.toast(pts ? `Score ${pts}` : 'Outside the face', 800);
        g.points(sc[1], sc[2]);
        if (shot[1] >= ARROWS && shot[2] >= ARROWS) return end();
        turn = 3 - turn; g.turn(turn);
        wind = clamp(wind + rndf(-0.55, 0.55), -1, 1);
        aimM.set(0.5); aimM.dir = 1; holdM.set(0); holdM.dir = 1;
      }
      function end() {
        starter = 3 - starter;
        if (sc[1] === sc[2]) {
          if (golds[1] === golds[2]) return g.draw(`${sc[1]} points and ${golds[1]} golds each — the tie stands.`);
          return g.win(golds[1] > golds[2] ? 1 : 2, `${sc[1]}–${sc[2]} settled by golds: ${golds[1]} vs ${golds[2]}.`);
        }
        g.win(sc[1] > sc[2] ? 1 : 2, `${Math.max(sc[1], sc[2])} points to ${Math.min(sc[1], sc[2])} · golds ${golds[1]}/${golds[2]}.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'hold') holdM.step(dt); }
        if (fly) { fly.t = Math.min(1, fly.t + dt * 3.2); if (fly.t >= 1) land(); }
        hits.forEach((v) => { v.life -= dt; });
        hits = hits.filter((v) => v.life > 0);
        draw();
        note.innerHTML = `<b>${wind === 0 ? 'no wind' : (wind < 0 ? '◀' : '▶') + ' ' + Math.abs(wind * 12).toFixed(0) + ' mph'}</b> · ${g.name(turn)} arrow ${Math.min(ARROWS, shot[turn] + 1)}/${ARROWS} · ${sc[1]}–${sc[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#3c7a4d');
        UI.rect(ctx, 0, H - 60, W, 60, '#2e5f3c');
        const bands = ['#f8f9fa', '#f1f3f5', '#ffd43b', '#ffd43b', '#4dabf7', '#4dabf7', '#ff6b6b', '#ff6b6b', '#111418', '#111418'];
        for (let i = 9; i >= 0; i--) UI.circle(ctx, W / 2, TC, 18 + i * 15, bands[i]);
        ctx.beginPath(); ctx.arc(W / 2, TC, TR + 6, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff44'; ctx.stroke();
        hits.forEach((v) => { ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(0.5); UI.rect(ctx, -1.5, -16, 3, 22, g.color(v.p)); UI.rect(ctx, -5, -20, 10, 5, '#f1f3f5'); ctx.restore(); });
        if (fly) {
          const e = fly.t, x = lerp(fly.x0, fly.tx, e), y = lerp(fly.y0, fly.ty, e) - Math.sin(e * Math.PI) * 90;
          UI.circle(ctx, x, y, 4, '#ffd43b');
        } else if (phase !== 'fly') {
          const ax = (phase === 'hold' ? aim : aimM.v) - 0.5;
          UI.rect(ctx, W / 2 + ax * 90 - 1, H - 120, 2, 90, g.color(turn));
          UI.circle(ctx, W / 2 + ax * 90, H - 120, 6, g.color(turn));
        }
        UI.text(ctx, `wind ${(wind < 0 ? '← ' : '→ ') + Math.abs(wind * 12).toFixed(0)} mph`, W / 2, 24, { color: '#ffffffcc', font: 'bold 15px system-ui' });
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
