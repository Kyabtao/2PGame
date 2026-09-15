/* Shuffleboard — slide four weights up the court; only discs beyond the rival's best count. */
(function () {
  const W = 300, H = 520, PUCKS = 4;
  const ZONES = [{ y0: 0, y1: 62, pts: 3 }, { y0: 62, y1: 140, pts: 2 }, { y0: 140, y1: 220, pts: 1 }];
  let starter = 1;
  Game.init({
    id: 'shuffleboard',
    rules: [
      'Four weights each, thrown alternately from the bottom of the court. One tap for the line, one for the length of the slide.',
      'The zones at the far end pay 3, 2 and 1. Anything that leaves the top of the court, or stays short of the 1-zone, scores nothing.',
      'Shuffleboard scoring: your weight only counts if it lies further up the court than the rival’s best weight. Knock theirs past yours and theirs stop counting.',
      'Highest total after eight weights wins.',
    ],
    controls: { all: 'Tap the court or press <kbd>Space</kbd>: line, then weight' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'SLIDE', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H + 200);
      g.stage.appendChild(canvas);
      const field = UI.field(W, H + 200, { friction: 1.25, wall: 0.5, min: 14 });
      let turn = starter, phase = 'aim', aim = 0.5, puck = null, wait = 0, thrown = { 1: 0, 2: 0 };
      const sc = { 1: 0, 2: 0 };
      const aimM = UI.meter({ speed: 0.95 }), powM = UI.meter({ speed: 1.15 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(320px, 92vw)' } }, note, aimM.el, powM.el));
      const Y0 = H - 40;
      function act() {
        if (g.over || puck || phase === 'fly') return;
        if (phase === 'aim') { phase = 'pow'; aim = aimM.v; return; }
        const v = powM.v;
        puck = field.add({ x: clamp(W / 2 + (aim - 0.5) * (W - 60), 24, W - 24), y: Y0, vx: (aim - 0.5) * 260, vy: -(360 + v * 900), r: 15, m: 1, tag: turn });
        phase = 'fly'; g.sfx('hit');
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      const zonePts = (d) => { const z = ZONES.find((q) => d.y >= q.y0 && d.y < q.y1); return z ? z.pts : 0; };
      function tally() {
        const live = field.discs.filter((d) => !d.dead && d.y < Y0 - 6);
        const b1 = Math.min(...live.filter((d) => d.tag === 1).map((d) => d.y), Infinity);
        const b2 = Math.min(...live.filter((d) => d.tag === 2).map((d) => d.y), Infinity);
        const tot = { 1: 0, 2: 0 };
        live.forEach((d) => { if (d.y < b2) tot[1] += zonePts(d); if (d.y < b1) tot[2] += zonePts(d); });
        return tot;
      }
      function finish() {
        thrown[turn]++;
        puck = null; phase = 'aim';
        const before = sc[turn];
        const t = tally();
        const gained = t[turn] - before;
        sc[1] = t[1]; sc[2] = t[2];
        g.points(sc[1], sc[2]);
        g.sfx(gained > 0 ? 'score' : gained < 0 ? 'bad' : 'move');
        if (gained) g.toast(gained > 0 ? `+${gained} on the tally` : `${gained} — the rival's weight now counts`, 1100);
        if (thrown[1] >= PUCKS && thrown[2] >= PUCKS) return end();
        turn = 3 - turn; g.turn(turn);
        aimM.set(0.5); aimM.dir = 1; powM.set(0); powM.dir = 1;
      }
      function end() {
        starter = 3 - starter;
        if (sc[1] === sc[2]) return g.draw(`Dead level at ${sc[1]} points after ${PUCKS * 2} weights.`);
        const w = sc[1] > sc[2] ? 1 : 2;
        g.win(w, `${sc[w]} points to ${sc[3 - w]}.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'pow') powM.step(dt); }
        if (puck) {
          field.step(dt);
          field.discs.forEach((d) => { if (d.y < -30 || d.y > H + 190) d.dead = true; });
          wait += dt;
          if (!field.moving() || wait > 1.1) { wait = 0; finish(); }
        }
        draw();
        note.textContent = `${g.name(turn)} · weight ${Math.min(PUCKS, thrown[turn] + 1)}/${PUCKS} · live tally ${sc[1]}–${sc[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H + 200, '#2b3550');
        UI.rect(ctx, 10, 0, W - 20, H - 14, '#c9915a');
        ctx.strokeStyle = '#8a5f2a'; ctx.lineWidth = 2;
        ZONES.forEach((z) => { UI.rect(ctx, 12, z.y0, W - 24, z.y1 - z.y0, z.pts === 3 ? '#e7a56b' : z.pts === 2 ? '#dda067' : '#d1935c'); ctx.strokeRect(12, z.y0, W - 24, z.y1 - z.y0); UI.text(ctx, String(z.pts), W / 2, (z.y0 + z.y1) / 2, { color: '#7a4f21', font: 'bold 18px system-ui' }); });
        ctx.beginPath(); ctx.moveTo(12, ZONES[2].y1); ctx.lineTo(W - 12, ZONES[2].y1); ctx.setLineDash([6, 6]); ctx.strokeStyle = '#fff8'; ctx.stroke(); ctx.setLineDash([]);
        UI.rect(ctx, 12, Y0 - 6, W - 24, 20, '#00000033');
        UI.text(ctx, '10 OFF', W / 2, -14, { color: '#ff8787', font: 'bold 11px system-ui' });
        field.discs.forEach((d) => {
          if (d.dead) return;
          UI.circle(ctx, d.x, d.y, d.r, g.color(d.tag));
          UI.circle(ctx, d.x, d.y, d.r - 5, '#ffffff2e');
          if (!puck) { const t = tally(); if (zonePts(d) && ((d.tag === 1 && d.y < Math.min(...field.discs.filter(x => !x.dead && x.tag === 2).map(x => x.y), Infinity)) || (d.tag === 2 && d.y < Math.min(...field.discs.filter(x => !x.dead && x.tag === 1).map(x => x.y), Infinity)))) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r + 4, 0, Math.PI * 2); ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 2; ctx.stroke(); } }
        });
        if (!puck) UI.circle(ctx, clamp(W / 2 + ((phase === 'pow' ? aim : aimM.v) - 0.5) * (W - 60), 24, W - 24), Y0, 15, g.color(turn));
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
