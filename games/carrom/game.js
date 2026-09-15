/* Carrom — flick the striker into coins and drop them in a corner pocket. */
(function () {
  const W = 420, H = 420, COINS = 4, MAX_TURNS = 16;
  const POCKETS = [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]];
  let starter = 1;
  Game.init({
    id: 'carrom',
    rules: [
      'White coins for one player, black for the other, plus a red bonus coin in the middle. One striker per turn: tap once for the angle, once for the flick strength.',
      'Pot one of your own coins and you clear it and shoot again.',
      'Potting a rival coin clears it for you too — carrom is generous that way, so double-check whose coin is on the line.',
      'Sinking the striker is a foul: one of your own coins goes back on the board and the rival gets the shot. The red bonus coin is simply re-spotted.',
      `Clear all ${COINS} of your coins to win the board. After ${MAX_TURNS} strikes the player with fewer coins left takes it.`,
    ],
    controls: { all: 'Tap the board or press <kbd>Space</kbd>: angle, then strength' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'FLICK', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const field = UI.field(W, H, { friction: 2.7, wall: 0.62, min: 14 });
      let turn = starter, phase = 'aim', aim = 0.25, striker = null, wait = 0, turns = 0;
      const left = { 1: COINS, 2: COINS };
      const aimM = UI.meter({ speed: 1.1 }), powM = UI.meter({ speed: 1.4 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(420px, 92vw)' } }, note, aimM.el, powM.el));
      const baseY = (p) => (p === 1 ? H - 58 : 58);
      for (let i = 0; i < COINS * 2; i++) {
        const a = (i / (COINS * 2)) * Math.PI * 2;
        field.add({ x: W / 2 + Math.cos(a) * 38, y: H / 2 + Math.sin(a) * 38, r: 11, m: 1, tag: i % 2 ? 1 : 2 });
      }
      field.add({ x: W / 2, y: H / 2, r: 9, m: 0.7, tag: 'bonus' });
      g.points(left[1], left[2]);
      const angleNow = () => (-0.28 + (phase === 'pow' ? aim : aimM.v) * 0.56) * Math.PI + (turn === 1 ? 0 : Math.PI);
      function act() {
        if (g.over || striker || phase === 'fly') return;
        if (phase === 'aim') { phase = 'pow'; aim = aimM.v; return; }
        const v = powM.v, ang = angleNow();
        striker = field.add({ x: W / 2, y: baseY(turn), vx: Math.cos(ang) * (560 + v * 1250), vy: Math.sin(ang) * (560 + v * 1250), r: 14, m: 1.5, tag: 'striker' });
        phase = 'fly'; g.sfx('hit');
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function finishShot() {
        turns++;
        const sunk = field.discs.filter((d) => d.potted);
        const coins = sunk.filter((d) => d.tag === 1 || d.tag === 2);
        const foul = sunk.some((d) => d.tag === 'striker');
        let again = false;
        field.discs = field.discs.filter((d) => !d.potted);
        if (foul) {
          g.sfx('bad'); g.toast('Striker pocketed — foul, a coin goes back', 1200);
          left[turn] = Math.min(COINS, left[turn] + 1);
          if (coins.length) { coins.filter((d) => d.tag === turn).forEach(() => { left[turn] = Math.min(COINS, left[turn] + 1); }); }
        } else if (coins.length) {
          coins.forEach((d) => { left[d.tag] = Math.max(0, left[d.tag] - 1); });
          again = true; g.sfx('coin');
          g.toast(`${coins.length} coin${coins.length > 1 ? 's' : ''} down — shoot again`, 1000);
        } else if (sunk.some((d) => d.tag === 'bonus')) { g.sfx('pop'); g.toast('Bonus coin re-spotted', 900); field.add({ x: W / 2, y: H / 2, r: 9, m: 0.7, tag: 'bonus' }); }
        else g.sfx('move');
        striker = null; phase = 'aim';
        g.points(left[1], left[2]);
        if (left[1] <= 0 || left[2] <= 0) {
          const w = left[1] <= 0 ? 1 : 2; starter = 3 - starter;
          return g.win(w, `Board cleared — ${esc(g.name(w))} sank all ${COINS} coins in ${turns} strikes.`);
        }
        if (turns >= MAX_TURNS) {
          starter = 3 - starter;
          if (left[1] === left[2]) return g.draw(`${MAX_TURNS} strikes and ${left[1]} coins apiece still on the board.`);
          return g.win(left[1] < left[2] ? 1 : 2, `Strike limit — ${left[1]} coins left versus ${left[2]}.`);
        }
        if (!again) turn = 3 - turn;
        g.turn(turn);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'pow') powM.step(dt); }
        if (striker) {
          field.step(dt);
          field.discs.forEach((d) => {
            if (d.dead) return;
            if (POCKETS.some((p) => Math.hypot(d.x - p[0], d.y - p[1]) < 23)) { d.potted = true; d.dead = true; g.sfx('pop'); }
          });
          wait += dt;
          if (!field.moving() || wait > 0.6) { wait = 0; finishShot(); }
        }
        draw();
        note.textContent = `${g.name(turn)} to flick · coins left ${left[1]} vs ${left[2]} · strike ${turns}/${MAX_TURNS}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#b98548');
        UI.rect(ctx, 14, 14, W - 28, H - 28, '#e6c284');
        ctx.strokeStyle = '#8a5f2a'; ctx.lineWidth = 2;
        POCKETS.forEach((p) => { UI.circle(ctx, p[0], p[1], 22, '#2b1d10'); ctx.beginPath(); ctx.arc(p[0], p[1], 22, 0, Math.PI * 2); ctx.stroke(); });
        ctx.beginPath(); ctx.arc(W / 2, H / 2, 58, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(W / 2, H / 2, 26, 0, Math.PI * 2); ctx.stroke();
        [1, 2].forEach((p) => UI.rect(ctx, W / 2 - 90, baseY(p) - 2, 180, 4, '#8a5f2a'));
        field.discs.forEach((d) => {
          if (d.dead) return;
          const shell = d.tag === 'bonus' ? '#e03131' : d.tag === 'striker' ? '#f8f9fa' : g.color(d.tag);
          UI.circle(ctx, d.x, d.y, d.r, shell);
          UI.circle(ctx, d.x, d.y, d.r - 3.5, d.tag === 'striker' ? '#ffe066' : d.tag === 'bonus' ? '#ffc9c9' : d.tag === 1 ? '#fff8f0' : '#2b2b3a');
        });
        if (striker) {
          ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(striker.x, striker.y); ctx.lineTo(striker.x + striker.vx * 0.1, striker.y + striker.vy * 0.1); ctx.strokeStyle = '#ffffffcc'; ctx.stroke(); ctx.setLineDash([]);
        } else {
          const ang = angleNow(), x = W / 2, y = baseY(turn);
          ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * 160, y + Math.sin(ang) * 160);
          ctx.strokeStyle = g.color(turn); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
          UI.circle(ctx, x, y, 14, g.color(turn));
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
