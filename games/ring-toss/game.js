/* Ring Toss — stop the aim meter, stop the power meter, hope the ring lands on a peg. */
(function () {
  const W = 420, H = 500, RINGS = 5;
  const PEGS = [{ y: 100, r: 16, pts: 30 }, { y: 200, r: 20, pts: 20 }, { y: 300, r: 25, pts: 10 }];
  let starter = 1;
  Game.init({
    id: 'ring-toss',
    rules: [
      'Five rings each, thrown alternately. Tap once to stop the left/right aim, tap again to stop the throw distance.',
      'The far peg is worth 30, the middle 20 and the near peg 10. A ring that lands beside a peg leans on it for half points.',
      'Over 93% power and the ring bounds clean over the pegs — nothing scored.',
      'Most points after ten rings wins; a tie is settled by who rang more 30-pegs.',
    ],
    controls: { all: 'Tap the lawn or press <kbd>Space</kbd> to stop each meter' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'THROW', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const sc = { 1: 0, 2: 0 }, ringers = { 1: 0, 2: 0 };
      let turn = starter, thrown = { 1: 0, 2: 0 };
      let phase = 'aim', aim = 0.5, pow = 0.5, flight = null, stuck = [];
      let jitter = PEGS.map(() => 0);
      const aimM = UI.meter({ speed: 0.8 }), powM = UI.meter({ speed: 1.15 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(420px, 92vw)' } }, note, aimM.el, powM.el));
      const pegX = (i) => W / 2 + jitter[i];
      function repick() { jitter = PEGS.map(() => rndf(-48, 48)); }
      repick();
      function act() {
        if (g.over || flight) return;
        if (phase === 'aim') { phase = 'power'; aim = aimM.v; return; }
        if (phase === 'power') {
          phase = 'fly'; pow = powM.v;
          const dx = (aim - 0.5) * 250, dy = (pow - 0.5) * 300;
          flight = { t: 0, over: pow > 0.93, from: { x: W / 2 + (aim - 0.5) * 40, y: H - 36 }, to: { x: W / 2 + dx, y: 400 - dy } };
          g.sfx('go'); return;
        }
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function land() {
        const { x, y } = flight.to, over = flight.over;
        flight = null; phase = 'aim'; stuck = stuck.filter((s) => s.life > 0);
        let pts = 0, kind = 'miss';
        if (!over) {
          let bestPts = 0;
          PEGS.forEach((p, i) => {
            const d = Math.hypot(x - pegX(i), y - p.y);
            if (d <= p.r) bestPts = Math.max(bestPts, p.pts);
            else if (d <= p.r + 24) bestPts = Math.max(bestPts, Math.floor(p.pts / 2));
          });
          pts = bestPts;
          kind = pts >= 10 ? 'peg' : pts ? 'lean' : 'miss';
        }
        if (over) kind = 'over';
        if (pts) { ringers[turn] += kind === 'peg' ? 1 : 0; g.sfx(kind === 'peg' ? 'coin' : 'score'); } else g.sfx('bad');
        stuck.push({ x, y, p: turn, life: 1, kind });
        g.toast(kind === 'peg' ? `Ringer! +${pts}` : kind === 'lean' ? `Leaner +${pts}` : kind === 'over' ? 'Over the pegs!' : 'Onto the grass', 900);
        sc[turn] += pts; thrown[turn]++;
        g.points(sc[1], sc[2]);
        if (thrown[1] >= RINGS && thrown[2] >= RINGS) return end();
        turn = 3 - turn; g.turn(turn); repick();
        aimM.set(0.5); aimM.dir = 1; powM.set(0.5); powM.dir = 1;
      }
      function end() {
        starter = 3 - starter;
        if (sc[1] === sc[2]) {
          if (ringers[1] === ringers[2]) return g.draw(`${sc[1]} points each, ${ringers[1]} ringers each.`);
          return g.win(ringers[1] > ringers[2] ? 1 : 2, `${sc[1]}–${sc[2]} on points — settled by ringers ${ringers[1]} vs ${ringers[2]}.`);
        }
        g.win(sc[1] > sc[2] ? 1 : 2, `${Math.max(sc[1], sc[2])} points to ${Math.min(sc[1], sc[2])} · ringers ${ringers[1]}/${ringers[2]}.`);
      }
      g.loop((dt) => {
        if (!g.over) {
          if (phase === 'aim') aimM.step(dt);
          else if (phase === 'power') powM.step(dt);
        }
        if (flight) { flight.t = Math.min(1, flight.t + dt * 3.4); if (flight.t >= 1) land(); }
        stuck.forEach((s) => { s.life -= dt * 0.25; });
        draw();
        note.textContent = `${g.name(turn)} · ${Math.max(0, RINGS - thrown[turn])} rings left · ${sc[1]}–${sc[2]}${phase === 'aim' ? ' · aim' : phase === 'power' ? ' · power' : ' …'}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#2f6b3c');
        for (let i = 0; i < 25; i++) UI.rect(ctx, 0, i * 21, W, 10, i % 2 ? '#357543' : '#2f6b3c');
        UI.rect(ctx, 0, H - 44, W, 44, '#255430');
        PEGS.forEach((p, i) => {
          const x = pegX(i);
          UI.circle(ctx, x, p.y + 9, p.r + 11, '#00000030');
          UI.roundRect(ctx, x - 5, p.y - 30, 10, 40, 4, '#e9ecef');
          UI.circle(ctx, x, p.y - 30, 7, '#ffd43b');
          UI.text(ctx, p.pts + ' pts', x, p.y + 44, { color: '#ffffff99', font: 'bold 12px system-ui' });
        });
        stuck.forEach((s) => {
          ctx.globalAlpha = clamp(s.life, 0, 1);
          ctx.beginPath(); ctx.arc(s.x, s.y, 15, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = g.color(s.p); ctx.stroke();
          ctx.globalAlpha = 1;
        });
        if (flight) {
          const e = 1 - Math.pow(1 - flight.t, 2);
          const x = lerp(flight.from.x, flight.to.x, e), y = lerp(flight.from.y, flight.to.y, e);
          const s = lerp(1.5, 0.6, e);
          ctx.save(); ctx.translate(x, y - Math.sin(e * Math.PI) * 70); ctx.scale(s, s * 0.55);
          ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.lineWidth = 9; ctx.strokeStyle = g.color(turn); ctx.stroke();
          ctx.restore();
        } else {
          ctx.save(); ctx.translate(W / 2, H - 26);
          ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = g.color(turn); ctx.stroke(); ctx.restore();
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
