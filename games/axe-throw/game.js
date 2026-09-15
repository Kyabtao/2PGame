/* Axe Throw — spin the axe upright into the board; the bullseye pays 50, a Robin Hood 100. */
(function () {
  const W = 420, H = 420, AXES = 6, BX = 210, BY = 132;
  let starter = 1;
  Game.init({
    id: 'axe-throw',
    rules: [
      'Six axes each. Tap once to lock the sideways aim on the board, tap again to release the spin.',
      'The axe must land blade-first: stop the spin meter inside the white band or the axe bounces off the board.',
      'Zones pay 50 (bullseye), 30, 20 and 10. Landing on an axe already in the board is a Robin Hood: 100 points.',
      'Highest score after twelve axes wins.',
    ],
    controls: { all: 'Tap the board or press <kbd>Space</kbd>: first aim, then spin' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'THROW', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const sc = { 1: 0, 2: 0 }; let turn = starter, thrown = { 1: 0, 2: 0 };
      let phase = 'aim', aim = 0.5, spin = 0, fly = null, stuck = [];
      const aimM = UI.meter({ speed: 0.9 }), spinM = UI.meter({ speed: 1.5 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(420px, 92vw)' } }, note, aimM.el, spinM.el));
      const ZONES = [{ r: 22, pts: 50 }, { r: 48, pts: 30 }, { r: 78, pts: 20 }, { r: 112, pts: 10 }];
      function act() {
        if (g.over || fly) return;
        if (phase === 'aim') { phase = 'spin'; aim = aimM.v; return; }
        if (phase === 'spin') {
          phase = 'fly'; spin = spinM.v;
          const x = BX + (aim - 0.5) * 300;
          const err = Math.min(Math.abs(spin - 0.5), Math.abs(spin - 0.5 + 0.5), Math.abs(spin - 0.5 - 0.5));
          const clean = err < 0.075;                     // white band = axe upright
          fly = { t: 0, x0: W / 2, y0: H - 24, x, y: BY + (1 - clean) * 200 + rndf(-30, 30), clean, rot: 0 };
          g.sfx('go');
        }
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function land() {
        const f = fly; fly = null; phase = 'aim';
        let pts = 0, label = 'bounce';
        if (f.clean) {
          const d = Math.hypot(f.x - BX, f.y - BY);
          const z = ZONES.find((q) => d <= q.r);
          pts = z ? z.pts : 0;
          const onHead = stuck.some((s) => Math.hypot(s.x - f.x, s.y - f.y) < 15);
          if (onHead) { pts = 100; label = 'ROBIN HOOD!'; }
          else label = pts ? `+${pts}` : 'off the scoring zones';
          if (pts) stuck.push({ x: f.x, y: f.y, p: turn });
        }
        g.sfx(pts >= 50 ? 'coin' : pts ? 'score' : 'bad');
        if (label === 'ROBIN HOOD!') g.toast('Robin Hood — 100!', 1200);
        else if (!f.clean) g.toast('Handle landed first — it bounced', 900);
        else g.toast(label, 800);
        sc[turn] += pts; thrown[turn]++; g.points(sc[1], sc[2]);
        if (thrown[1] >= AXES && thrown[2] >= AXES) return end();
        turn = 3 - turn; g.turn(turn);
        aimM.set(0.5); aimM.dir = 1; spinM.set(0); spinM.dir = 1;
      }
      function end() {
        starter = 3 - starter;
        if (sc[1] === sc[2]) return g.draw(`${sc[1]} points apiece after ${AXES * 2} axes.`);
        g.win(sc[1] > sc[2] ? 1 : 2, `${Math.max(sc[1], sc[2])} to ${Math.min(sc[1], sc[2])} · ${stuck.length} axes in the board.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'spin') spinM.step(dt); }
        if (fly) { fly.t = Math.min(1, fly.t + dt * 3.2); fly.rot += dt * 14; if (fly.t >= 1) land(); }
        draw();
        note.textContent = `${g.name(turn)} · ${Math.max(0, AXES - thrown[turn])} axes left · ${sc[1]}–${sc[2]} · ${phase === 'aim' ? 'aim' : phase === 'spin' ? 'spin' : 'in the air'}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#20263c');
        UI.roundRect(ctx, 40, 40, W - 80, 200, 14, '#6b4a2b');
        for (let i = 0; i < 8; i++) UI.rect(ctx, 44, 44 + i * 25, W - 88, 12, i % 2 ? '#7a5731' : '#6b4a2b');
        ZONES.slice().reverse().forEach((z, i) => { ctx.beginPath(); ctx.arc(BX, BY, z.r, 0, Math.PI * 2); ctx.fillStyle = ['#ff6b6b', '#ffa94d', '#ffd43b', '#51cf66'][3 - i] + 'cc'; ctx.fill(); });
        UI.circle(ctx, BX, BY, 8, '#fff');
        UI.text(ctx, '50', BX, BY, { color: '#111418', font: 'bold 10px system-ui' });
        stuck.forEach((s) => axe(ctx, s.x, s.y, 0, g.color(s.p)));
        if (fly) {
          const e = fly.t, x = lerp(fly.x0, fly.x, e), y = lerp(fly.y0, fly.y, e) - Math.sin(e * Math.PI) * 120;
          axe(ctx, x, y, fly.clean ? 0 : fly.rot, g.color(turn));
        } else {
          const ax = (phase === 'spin' ? aim : aimM.v) - 0.5;
          UI.text(ctx, '⇕', W / 2 + ax * 300, 250, { color: g.color(turn), font: 'bold 22px system-ui' });
          axe(ctx, W / 2 + ax * 300, H - 30, phase === 'spin' ? 0 : spinM.v * Math.PI * 4, g.color(turn));
        }
      }
      function axe(ctx, x, y, rot, color) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        UI.rect(ctx, -2.5, -6, 5, 46, '#c99a63');
        ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-20, -22); ctx.lineTo(-2, -34); ctx.closePath();
        ctx.fillStyle = '#dee2e6'; ctx.fill();
        UI.rect(ctx, -3, -8, 6, 6, color);
        ctx.restore();
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
