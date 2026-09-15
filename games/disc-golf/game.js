/* Disc Golf — three holes of straight-line throws: trees cost a stroke, water costs a drop. */
(function () {
  const W = 400, H = 520, HOLES = 3, LIMIT = 5;
  let starter = 1;
  Game.init({
    id: 'disc-golf',
    rules: [
      'Three holes, one throw per turn, players alternating on the same disc like real disc golf.',
      'One tap picks the line, the second picks how hard you throw — power decides how far the disc carries, so lay up short rather than fly past the basket.',
      'A throw that hits a tree stops dead where it hit and costs a penalty stroke. Splash into the blue water and it is a stroke and a drop, back to where you threw from.',
      `The disc must finish inside the basket ring. A hole is capped at ${LIMIT} throws (${LIMIT + 1} on the card). Fewest throws over ${HOLES} holes wins.`,
    ],
    controls: { all: 'Tap the fairway or press <kbd>Space</kbd>: line, then power' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'THROW', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      let turn = starter, hole = 0, phase = 'aim', aim = 0.5, disc = null, from = null, trees = [], water = null, basket = { x: 0, y: 0, r: 22 };
      const card = { 1: 0, 2: 0 };
      let throws = 0, flying = null;
      const aimM = UI.meter({ speed: 0.8 }), powM = UI.meter({ speed: 1.1 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(400px, 92vw)' } }, note, aimM.el, powM.el));
      function setup() {
        hole++;
        disc = { x: W / 2 + rndf(-60, 60), y: H - 60 };
        from = Object.assign({}, disc);
        trees = range(rnd(2, 4)).map(() => ({ x: rndf(60, W - 60), y: rndf(140, H - 150), r: rndf(16, 26) }));
        water = Math.random() < 0.7 ? { x: rndf(50, W - 140), y: rndf(120, 260), w: rndf(80, 150), h: rndf(50, 90) } : null;
        basket = { x: rndf(60, W - 60), y: rndf(46, 96), r: 22 };
        throws = 0; phase = 'aim'; g.turn(turn);
      }
      setup();
      function act() {
        if (g.over || flying) return;
        if (phase === 'aim') { phase = 'pow'; aim = aimM.v; return; }
        const v = powM.v;
        const a = -Math.PI / 2 + (aim - 0.5) * 1.9;
        from = Object.assign({}, disc);
        flying = { t: 0, x: disc.x, y: disc.y, dx: Math.cos(a), dy: Math.sin(a), reach: 60 + v * 430, travelled: 0, blocked: false };
        phase = 'fly'; throws++; g.sfx('go');
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      const inWater = (x, y) => water && x > water.x && x < water.x + water.w && y > water.y && y < water.y + water.h;
      function land() {
        const f = flying; flying = null; phase = 'aim';
        let pen = 0;
        if (f.blocked) { pen += 1; g.toast('Tree! Penalty stroke', 1000); g.sfx('bad'); }
        else if (inWater(disc.x, disc.y)) { disc = Object.assign({}, from); pen += 1; g.toast('Water — stroke and drop', 1100); g.sfx('bad'); }
        else {
          const d = Math.hypot(disc.x - basket.x, disc.y - basket.y);
          if (d <= basket.r) { g.sfx('coin'); return finish(throws); }
          if (d <= basket.r + 14) g.toast('Lipped out — just short', 900);
          else g.sfx('move');
        }
        if (throws + pen >= LIMIT) return finish(LIMIT + 1);
        throws += pen;
        if (throws >= LIMIT) return finish(LIMIT + 1);
        turn = 3 - turn; g.turn(turn);
        aimM.set(0.5); aimM.dir = 1; powM.set(0); powM.dir = 1;
      }
      function finish(score) {
        card[1] += score; card[2] += score;                 // alternate shot: both players card the hole
        g.points(card[1], card[2]);
        if (hole >= HOLES) return end();
        turn = 3 - turn; setup();
      }
      function end() {
        starter = 3 - starter;
        if (card[1] === card[2]) return g.draw(`Both carded ${card[1]} throws over ${HOLES} holes.`);
        const w = card[1] < card[2] ? 1 : 2;
        g.win(w, `${card[w]} throws to ${card[3 - w]} across ${HOLES} holes.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'pow') powM.step(dt); }
        if (flying) {
          const step = Math.max(6, flying.reach * dt * 3.4);
          const nx = flying.x + flying.dx * step, ny = flying.y + flying.dy * step;
          const hit = trees.find((t) => Math.hypot(t.x - nx, t.y - ny) < t.r + 8);
          flying.travelled += step;
          if (hit) { flying.blocked = true; disc = { x: clamp(nx, 24, W - 24), y: clamp(ny, 24, H - 24) }; land(); }
          else if (flying.travelled >= flying.reach || nx < 24 || nx > W - 24 || ny < 24 || ny > H - 24) { disc = { x: clamp(nx, 24, W - 24), y: clamp(ny, 24, H - 24) }; land(); }
          else { flying.x = nx; flying.y = ny; }
        }
        draw();
        note.textContent = `hole ${hole}/${HOLES} · ${g.name(turn)} throw ${Math.min(LIMIT, throws + 1)}/${LIMIT} · card ${card[1]}–${card[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#2a4a2f');
        ctx.save(); for (let i = 0; i < 26; i++) UI.rect(ctx, 0, i * 20, W, 10, i % 2 ? '#2f5436' : '#2a4a2f'); ctx.restore();
        if (water) { UI.roundRect(ctx, water.x, water.y, water.w, water.h, 12, '#1c5f8f'); UI.text(ctx, '~ ~ ~', water.x + water.w / 2, water.y + water.h / 2, { color: '#74c0e8', font: 'bold 14px system-ui' }); }
        UI.circle(ctx, basket.x, basket.y, basket.r, '#ffffff22');
        UI.circle(ctx, basket.x, basket.y, 9, '#e9ecef');
        UI.rect(ctx, basket.x - 1.5, basket.y - 22, 3, 22, '#adb5bd');
        UI.text(ctx, '🧺', basket.x, basket.y - 30, { font: '18px system-ui' });
        trees.forEach((t) => { UI.circle(ctx, t.x, t.y + 6, t.r, '#00000033'); UI.circle(ctx, t.x, t.y, t.r, '#2c5a34'); UI.circle(ctx, t.x - t.r * .3, t.y - t.r * .3, t.r * .45, '#3c7546'); });
        const p = flying || disc;
        UI.circle(ctx, p.x, p.y, 10, g.color(turn));
        UI.circle(ctx, p.x, p.y, 4.5, '#ffffff55');
        if (!flying && (phase === 'aim' || phase === 'pow')) {
          const a = -Math.PI / 2 + ((phase === 'pow' ? aim : aimM.v) - 0.5) * 1.9;
          const len = 40 + (phase === 'pow' ? powM.v : 0.25) * 220;
          ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len); ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
