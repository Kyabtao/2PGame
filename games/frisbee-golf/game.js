/* Frisbee Golf — three holes where the disc curves: line, power and the flick of the wrist. */
(function () {
  const W = 400, H = 520, HOLES = 3, LIMIT = 5;
  let starter = 1;
  Game.init({
    id: 'frisbee-golf',
    rules: [
      'Three holes, alternate shot with one disc. Three taps per throw: the line, the arm, then the curl (fade left or flex right).',
      'A frisbee floats further than a disc — the same power carries about a third more distance, but the wind still shoves it sideways in flight.',
      'Out of bounds along the side walls is a stroke and a re-drop from where it went out. Landing in the pond costs a stroke too.',
      `The disc has to stop in the gate circle. After ${LIMIT} throws the hole is scored ${LIMIT + 1}. Fewest throws over ${HOLES} holes wins.`,
    ],
    controls: { all: 'Tap or press <kbd>Space</kbd>: line · arm · curl' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'THROW', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      let turn = starter, hole = 0, phase = 'aim', aim = 0.5, pow = 0.5, curl = 0.5, step = 0;
      let disc = { x: W / 2, y: H - 60 }, fly = null, gate = { x: 0, y: 0, r: 20 }, pond = null, wind = 0, throws = 0;
      const card = { 1: 0, 2: 0 };
      const m1 = UI.meter({ speed: 0.78 }), m2 = UI.meter({ speed: 1.05 }), m3 = UI.meter({ speed: 1.3 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(400px, 92vw)' } }, note, m1.el, m2.el, m3.el));
      function setup() {
        hole++;
        disc = { x: W / 2 + rndf(-70, 70), y: H - 56 };
        gate = { x: rndf(70, W - 70), y: rndf(48, 100), r: 20 };
        pond = Math.random() < 0.65 ? { x: rndf(60, W - 150), y: rndf(140, 300), w: rndf(90, 140), h: rndf(56, 90) } : null;
        wind = rndf(-1, 1);
        throws = 0; phase = 'aim'; step = 0;
        g.turn(turn);
      }
      setup();
      function act() {
        if (g.over || fly) return;
        if (phase === 'aim') { phase = 'pow'; aim = m1.v; return; }
        if (phase === 'pow') { phase = 'curl'; pow = m2.v; return; }
        if (phase === 'curl') {
          curl = m3.v;
          const a = -Math.PI / 2 + (aim - 0.5) * 1.7;
          fly = { x: disc.x, y: disc.y, vx: Math.cos(a), vy: Math.sin(a), left: (90 + pow * 400) * 1.32, curve: (curl - 0.5) * 3.4, t: 0 };
          phase = 'fly'; throws++; g.sfx('go');
        }
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      const inPond = (x, y) => pond && x > pond.x && x < pond.x + pond.w && y > pond.y && y < pond.y + pond.h;
      function land() {
        const f = fly; fly = null; phase = 'aim';
        let pen = 0;
        if (f.oob) { disc = { x: clamp(f.px, 30, W - 30), y: clamp(f.py, 30, H - 30) }; pen++; g.toast('Out of bounds — stroke and re-drop', 1100); g.sfx('bad'); }
        else if (inPond(disc.x, disc.y)) { disc = { x: f.px, y: f.py }; pen++; g.toast('In the pond — stroke', 1100); g.sfx('bad'); }
        else if (Math.hypot(disc.x - gate.x, disc.y - gate.y) <= gate.r) { g.sfx('coin'); g.toast('In the gate!', 1000); return finish(throws); }
        else g.sfx('move');
        if (throws + pen >= LIMIT) return finish(LIMIT + 1);
        throws += pen;
        turn = 3 - turn; g.turn(turn);
        [m1, m2, m3].forEach((m) => { m.set(m === m1 ? 0.5 : 0); m.dir = 1; });
        step = phase === 'aim' ? 0 : step;
        draw();
      }
      function finish(score) {
        card[1] += score; card[2] += score;
        g.points(card[1], card[2]);
        if (hole >= HOLES) return end();
        turn = 3 - turn; setup();
      }
      function end() {
        starter = 3 - starter;
        if (card[1] === card[2]) return g.draw(`${card[1]} throws each over ${HOLES} holes.`);
        const w = card[1] < card[2] ? 1 : 2;
        g.win(w, `${card[w]} throws to ${card[3 - w]}.`);
      }
      g.loop((dt) => {
        if (!g.over) {
          if (phase === 'aim') m1.step(dt); else if (phase === 'pow') m2.step(dt); else if (phase === 'curl') m3.step(dt);
        }
        if (fly) {
          const step2 = Math.min(fly.left, 340 * dt);
          const a = Math.atan2(fly.vy, fly.vx) + fly.curve * dt * 0.9;
          const sp = Math.hypot(fly.vy, fly.vx);
          fly.vx = Math.cos(a) * sp; fly.vy = Math.sin(a) * sp;
          fly.px = fly.x; fly.py = fly.y;
          fly.x += fly.vx * step2 + wind * 26 * dt;
          fly.y += fly.vy * step2;
          fly.left -= step2;
          if (fly.x < 22 || fly.x > W - 22) fly.oob = true;
          if (fly.oob || fly.left <= 0 || fly.y < 22 || fly.y > H - 22) { if (!fly.oob) disc = { x: clamp(fly.x, 26, W - 26), y: clamp(fly.y, 26, H - 26) }; land(); }
        }
        draw();
        note.textContent = `hole ${hole}/${HOLES} · wind ${wind < 0 ? '←' : '→'} ${Math.abs(wind * 10).toFixed(0)} · ${g.name(turn)} throw ${Math.min(LIMIT, throws + 1)}/${LIMIT} · card ${card[1]}–${card[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#2f4d2a');
        ctx.save(); for (let i = 0; i < 24; i++) UI.rect(ctx, 0, i * 22, W, 11, i % 2 ? '#375932' : '#2f4d2a'); ctx.restore();
        UI.rect(ctx, 0, 0, 22, H, '#1f2b1c'); UI.rect(ctx, W - 22, 0, 22, H, '#1f2b1c');
        if (pond) { UI.roundRect(ctx, pond.x, pond.y, pond.w, pond.h, 14, '#1c5f8f'); UI.text(ctx, '~ ~', pond.x + pond.w / 2, pond.y + pond.h / 2, { color: '#74c0e8', font: 'bold 13px system-ui' }); }
        UI.circle(ctx, gate.x, gate.y, gate.r, '#ffffff22');
        UI.circle(ctx, gate.x, gate.y, 10, '#e9ecef');
        UI.text(ctx, '🧺', gate.x, gate.y - 20, { font: '17px system-ui' });
        const p = fly || disc;
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.62);
        UI.circle(ctx, 0, 0, 12, g.color(turn)); ctx.restore();
        UI.circle(ctx, p.x, p.y, 4, '#ffffff66');
        if (!fly && phase !== 'fly') {
          const a = -Math.PI / 2 + ((phase === 'aim' ? m1.v : aim) - 0.5) * 1.7;
          const len = 40 + (phase === 'aim' ? 0.2 : pow) * 240;
          ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(p.x, p.y);
          ctx.quadraticCurveTo(p.x + Math.cos(a) * len * 0.6 - wind * 10, p.y + Math.sin(a) * len * 0.6, p.x + Math.cos(a) * len + wind * 12, p.y + Math.sin(a) * len);
          ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
