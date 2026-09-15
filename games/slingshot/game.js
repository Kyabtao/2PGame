/* Slingshot — band, angle and release. Still targets pay 10, the bobbing one pays 25. */
(function () {
  const W = 440, H = 360, SHOTS = 4;
  let starter = 1;
  Game.init({
    id: 'slingshot',
    rules: [
      'Six stones each. One tap sets the release angle, the second sets how hard the band is stretched.',
      'The stone flies a real arc with gravity, so a flat shot drops short and a lofted one hangs long.',
      'Hitting a hanging target is 10 points, clipping the small bobbing prize is 25, and the stone only counts once — bounce-offs are nothing.',
      'Most points after eight stones wins. Ties are broken by how many 25s were banked.',
    ],
    controls: { all: 'Tap the range or press <kbd>Space</kbd>: angle, then draw' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'RELEASE', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const ANCHOR = { x: 66, y: H - 66 };
      let turn = starter, phase = 'aim', angle = 0.5, fired = { 1: 0, 2: 0 };
      const sc = { 1: 0, 2: 0 }, big = { 1: 0, 2: 0 };
      let stone = null, t = 0, targets = [];
      const angM = UI.meter({ speed: 0.8 }), powM = UI.meter({ speed: 1.25 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(440px, 92vw)' } }, note, angM.el, powM.el));
      function build() {
        targets = [
          { x: W - 90, y: 96, r: 20, pts: 10, hit: false, sway: 26, sp: 0.8, ph: rndf(0, 6) },
          { x: W - 180, y: 150, r: 17, pts: 10, hit: false, sway: 20, sp: 1.2, ph: rndf(0, 6) },
          { x: W - 138, y: 52, r: 12, pts: 25, hit: false, sway: 40, sp: 1.7, ph: rndf(0, 6) },
        ];
      }
      build();
      function act() {
        if (g.over || stone) return;
        if (phase === 'aim') { phase = 'pow'; angle = angM.v; return; }
        const v = powM.v;
        const a = (0.18 + angle * 0.62) * Math.PI;              // 32°–144°, mostly forward-up
        const sp = 380 + v * 620;
        stone = { x: ANCHOR.x, y: ANCHOR.y, vx: Math.cos(a) * sp, vy: -Math.sin(a) * sp };
        phase = 'fly'; g.sfx('go');
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function end() {
        starter = 3 - starter;
        if (sc[1] === sc[2]) {
          if (big[1] === big[2]) return g.draw(`${sc[1]} points each, ${big[1]} prize hits each.`);
          return g.win(big[1] > big[2] ? 1 : 2, `${sc[1]}–${sc[2]} on points, settled by prize hits ${big[1]} vs ${big[2]}.`);
        }
        g.win(sc[1] > sc[2] ? 1 : 2, `${Math.max(sc[1], sc[2])} points to ${Math.min(sc[1], sc[2])} · ${big[1]}/${big[2]} prize hits.`);
      }
      g.loop((dt) => {
        t += dt;
        if (!g.over) { if (phase === 'aim') angM.step(dt); else if (phase === 'pow') powM.step(dt); }
        if (stone) {
          stone.age = (stone.age || 0) + dt;
          if (stone.age > 1.0) { stone = null; g.sfx('bad'); g.toast('Stone gone', 700); }
          for (let k = 0; k < 3 && stone; k++) {
            const s = dt / 3;
            stone.vy += 620 * s; stone.x += stone.vx * s; stone.y += stone.vy * s;
            const hitT = targets.find((q) => !q.hit && Math.hypot(q.x + Math.sin(t * q.sp + q.ph) * q.sway - stone.x, q.y - stone.y) < q.r + 5);
            if (hitT) {
              hitT.hit = true; sc[turn] += hitT.pts; if (hitT.pts === 25) big[turn]++;
              g.sfx('coin'); g.toast(`+${hitT.pts}`, 900);
              stone = null; break;
            }
            if (stone && (stone.x > W + 30 || stone.y > H - 40)) { stone = null; g.sfx('bad'); g.toast('Into the dirt', 800); break; }
          }
          if (!stone) {
            fired[turn]++; g.points(sc[1], sc[2]);
            if (fired[1] >= SHOTS && fired[2] >= SHOTS) return end();
            if (targets.every((q) => q.hit)) { g.toast('All targets down — new rack', 1000); build(); }
            turn = 3 - turn; phase = 'aim'; g.turn(turn);
            angM.set(0.5); angM.dir = 1; powM.set(0); powM.dir = 1;
          }
        }
        draw();
        note.textContent = `${g.name(turn)} · stone ${Math.min(SHOTS, fired[turn] + 1)}/${SHOTS} · ${sc[1]}–${sc[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1d2740');
        UI.rect(ctx, 0, H - 34, W, 34, '#3a2f22');
        UI.rect(ctx, ANCHOR.x - 4, ANCHOR.y - 44, 5, 78, '#6b4a2b');
        UI.rect(ctx, ANCHOR.x + 34, ANCHOR.y - 30, 5, 64, '#6b4a2b');
        targets.forEach((q) => {
          const x = q.x + Math.sin(t * q.sp + q.ph) * q.sway;
          ctx.strokeStyle = '#ffffff33'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, q.y - q.r); ctx.stroke();
          UI.circle(ctx, x, q.y, q.r, q.hit ? '#495057' : q.pts === 25 ? '#ffd43b' : g.color(2));
          UI.text(ctx, q.hit ? '·' : String(q.pts), x, q.y, { color: q.pts === 25 ? '#5c3d00' : '#fff', font: 'bold 12px system-ui' });
        });
        if (stone) {
          UI.circle(ctx, stone.x, stone.y, 6, '#dee2e6');
          ctx.strokeStyle = '#adb5bd66'; ctx.beginPath(); ctx.moveTo(ANCHOR.x, ANCHOR.y - 30); ctx.lineTo(stone.x, stone.y); ctx.stroke();
        } else {
          const a = phase === 'pow' ? (0.18 + angle * 0.62) * Math.PI : (0.18 + angM.v * 0.62) * Math.PI;
          const pull = phase === 'pow' ? 26 : 12;
          UI.circle(ctx, ANCHOR.x, ANCHOR.y - 30, 6, g.color(turn));
          ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(ANCHOR.x, ANCHOR.y - 30);
          ctx.lineTo(ANCHOR.x + Math.cos(a) * 130, ANCHOR.y - 30 - Math.sin(a) * 130);
          ctx.strokeStyle = g.color(turn); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
