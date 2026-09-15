/* Crokinole — flick discs into the rings or a hole; a shot must touch an enemy disc. */
(function () {
  const W = 420, H = 420, CX = W / 2, CY = H / 2, DISCS = 5, MAX_TURNS = 22;
  const RINGS = [{ r: 34, pts: 20 }, { r: 62, pts: 15 }, { r: 92, pts: 10 }, { r: 122, pts: 5 }];
  let starter = 1;
  Game.init({
    id: 'crokinole',
    rules: [
      'Five discs each. Tap once for the line, once for the strength; discs slide and knock each other around a real board.',
      'Rings pay 20 / 15 / 10 / 5 from the middle outwards, and a disc that drops into one of the eight peg holes is 20 as well.',
      'Crokinole rule: if the rival has a disc on the board your shot must touch one of theirs — a shot that touches nothing is removed.',
      'A disc on top of the centre peg is knocked back to your base. Highest total after all discs wins.',
    ],
    controls: { all: 'Tap the board or press <kbd>Space</kbd>: line, then strength' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'FLICK', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const field = UI.field(W, H, { friction: 3.1, wall: 0.6, min: 16 });
      const HOLES = range(8).map((i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; return { x: CX + Math.cos(a) * 128, y: CY + Math.sin(a) * 128 }; });
      let turn = starter, phase = 'aim', aim = 0.25, shot = null, wait = 0, turns = 0;
      const stock = { 1: DISCS, 2: DISCS };
      const sc = { 1: 0, 2: 0 };
      let touched = false;
      const aimM = UI.meter({ speed: 1.0 }), powM = UI.meter({ speed: 1.35 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(420px, 92vw)' } }, note, aimM.el, powM.el));
      field.discs = [];
      const base = (p) => ({ x: CX + (p === 1 ? -96 : 96), y: p === 1 ? H - 26 : 26 });
      function act() {
        if (g.over || shot || phase === 'fly') return;
        if (phase === 'aim') { phase = 'pow'; aim = aimM.v; return; }
        const v = powM.v;
        const b = base(turn);
        const ang = (turn === 1 ? -Math.PI / 2 : Math.PI / 2) + (aim - 0.5) * 1.5;
        touched = false;
        shot = field.add({ x: b.x + (aim - 0.5) * 90, y: b.y, vx: Math.cos(ang) * (520 + v * 1250), vy: Math.sin(ang) * (520 + v * 1250), r: 12, m: 1, tag: turn });
        phase = 'fly'; g.sfx('hit');
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      const onBoard = () => field.discs.filter((d) => !d.dead && d !== shot);
      function finish() {
        turns++;
        const enemyOn = onBoard().some((d) => d.tag === 3 - turn);
        let why = '';
        if (shot.dead) { /* potted, scored below */ }
        else if (enemyOn && !touched) { shot.dead = true; shot.holed = false; why = 'no enemy disc touched — shot removed'; g.sfx('bad'); }
        else if (dist(shot.x, shot.y, CX, CY) < 14) { const b = base(turn); shot.x = b.x; shot.y = b.y; shot.vx = shot.vy = 0; why = 'off the peg'; }
        if (!why) g.sfx(shot.holed ? 'coin' : 'move');
        if (shot.holed) { sc[turn] += 20; why = 'in the hole for 20'; }
        else {
          const d = dist(shot.x, shot.y, CX, CY);
          const ring = RINGS.find((q) => d <= q.r);
          if (d <= 122) { sc[turn] += ring.pts; if (!why) why = `${ring.pts} points`; }
          else { shot.dead = true; if (!why) why = 'over the edge — dead'; }
        }
        stock[turn]--;
        if (why) g.toast(why, 1000);
        shot = null; phase = 'aim';
        if (!stock[1] && !stock[2]) return endGame();
        if (turns >= MAX_TURNS) return endGame();
        if (stock[3 - turn] <= 0) { g.toast(`${esc(g.name(3 - turn))} is out of discs`, 800); }
        turn = 3 - turn; g.turn(turn); g.points(sc[1], sc[2]);
      }
      function endGame() {
        starter = 3 - starter;
        g.points(sc[1], sc[2]);
        if (sc[1] === sc[2]) return g.draw(`${turns} shots and both hands on ${sc[1]} points.`);
        const w = sc[1] > sc[2] ? 1 : 2;
        g.win(w, `${sc[w]} points to ${sc[3 - w]} over ${turns} shots.`);
      }
      const dist = (a, b, c, d) => Math.hypot(c - a, d - b);
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'pow') powM.step(dt); }
        if (shot) {
          const hits = field.step(dt);
          if (hits.some(([a, b]) => a === shot || b === shot)) { touched = true; g.sfx('bounce'); }
          HOLES.forEach((p) => { if (!shot.dead && !shot.holed && dist(shot.x, shot.y, p.x, p.y) < 13) shot.holed = true; });
          if (shot.holed) { shot.dead = true; }
          wait += dt;
          if (!field.moving() || wait > 0.95) { wait = 0; finish(); }
        }
        draw();
        note.textContent = `${g.name(turn)} · ${stock[turn]} discs left · ${sc[1]}–${sc[2]} · shot ${turns}/${MAX_TURNS}`;
      });
      function draw() {
        UI.circle(ctx, CX, CY, 176, '#e0b878');
        UI.circle(ctx, CX, CY, 168, '#f0d29a');
        RINGS.slice().reverse().forEach((q, i) => { ctx.beginPath(); ctx.arc(CX, CY, q.r, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#9c6f34'; ctx.stroke(); });
        UI.circle(ctx, CX, CY, 12, '#3f2a14');
        UI.circle(ctx, CX, CY, 5, '#c99a53');
        HOLES.forEach((p) => UI.circle(ctx, p.x, p.y, 13, '#2b1d10'));
        field.discs.forEach((d) => {
          if (d.dead) return;
          UI.circle(ctx, d.x, d.y, d.r, g.color(d.tag === 'striker' ? 1 : d.tag));
          UI.circle(ctx, d.x, d.y, d.r - 4, '#1a1a1a22');
        });
        if (!shot) {
          const b = base(turn);
          UI.circle(ctx, b.x + ((phase === 'pow' ? aim : aimM.v) - 0.5) * 90, b.y, 12, g.color(turn));
          const ang = (turn === 1 ? -Math.PI / 2 : Math.PI / 2) + ((phase === 'pow' ? aim : aimM.v) - 0.5) * 1.5;
          ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(ang) * 130, b.y + Math.sin(ang) * 130); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
