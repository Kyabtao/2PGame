/* 9-Ball Pool — the lowest ball must be struck first; drop the 9 to take the rack. */
(function () {
  const W = 440, H = 250, MAX_SHOTS = 10;
  const R = 9;
  const POCKETS = [[12, 12], [W / 2, 6], [W - 12, 12], [12, H - 12], [W / 2, H - 6], [W - 12, H - 12]];
  let starter = 1;
  Game.init({
    id: 'billiards-9ball',
    rules: [
      'Nine balls are racked in a diamond. The legal target is always the lowest number on the table, and the cue ball must hit it first.',
      'Tap once for the aiming offset (the game lines you up on the legal ball, you fine-tune) and once for cue power.',
      'Any ball dropped on a legal shot stays down and you shoot again — including a combination that pots the 9 early, which wins the rack outright.',
      'Scratching the cue ball, or striking the wrong ball first, is a foul: the cue is respotted and your rival gets the shot. A foul on the 9 re-spots the 9.',
      `If ${MAX_SHOTS} shots do not clear the rack, whoever has potted more balls wins.`,
    ],
    controls: { all: 'Tap the table or press <kbd>Space</kbd>: aim, then power' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'SHOOT', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const field = UI.field(W, H, { friction: 1.7, wall: 0.8, min: 12 });
      // diamond rack, 1 at the apex and the 9 on the middle of the widest row
      const RACK = [[1], [2, 3], [4, 9, 5], [6, 7], [8]];
      const balls = {};
      RACK.forEach((row, col) => row.forEach((n, k) => {
        const x = W * 0.6 + col * R * 1.75;
        const y = H / 2 + (k - (row.length - 1) / 2) * R * 2.06;
        balls[n] = field.add({ x, y: clamp(y, 20, H - 20), r: R, m: 1, tag: n });
      }));
      const order = RACK.flat();
      const cue = field.add({ x: W * 0.2, y: H / 2, r: R, m: 1, tag: 'cue' });
      let turn = starter, phase = 'aim', aim = 0.5, shots = 0, wait = 0, first = null, potted = [], target = 1;
      const sunk = { 1: 0, 2: 0 };
      const aimM = UI.meter({ speed: 0.9 }), powM = UI.meter({ speed: 1.2 });
      const note = h('div', { class: 'muted', style: { fontSize: '.88rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(440px, 94vw)' } }, note, aimM.el, powM.el));
      const lowest = () => { for (let n = 1; n <= 9; n++) if (balls[n] && !balls[n].dead) return n; return 0; };
      function angle() {
        const t = balls[lowest()];
        const base = t ? Math.atan2(t.y - cue.y, t.x - cue.x) : 0;
        return base + (aim - 0.5) * 0.5;
      }
      function act() {
        if (g.over || phase === 'fly') return;
        if (phase === 'aim') { phase = 'pow'; aim = aimM.v; return; }
        const a = angle(), v = powM.v;
        target = lowest();
        cue.dead = false;
        cue.vx = Math.cos(a) * (520 + v * 1500); cue.vy = Math.sin(a) * (520 + v * 1500);
        first = null; potted = [];
        phase = 'fly'; g.sfx('hit');
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'pow') powM.step(dt); }
        if (phase === 'fly') {
          const hits = field.step(dt);
          if (first === null) {
            for (const [a, b] of hits) {
              const other = a === cue ? b : b === cue ? a : null;
              if (other && other.tag !== 'cue') { first = other.tag; break; }
            }
          }
          field.discs.forEach((d) => {
            if (d.dead) return;
            if (POCKETS.some((p) => Math.hypot(d.x - p[0], d.y - p[1]) < R + 5)) { d.dead = true; potted.push(d.tag); g.sfx('pop'); }
          });
          wait += dt;
          if (!field.moving() || wait > 0.85) { wait = 0; resolve(); }
        }
        draw();
        note.textContent = `${g.name(turn)} · balls down ${sunk[1]}–${sunk[2]} · shot ${shots}/${MAX_SHOTS}`;
      });
      function resolve() {
        shots++;
        const legal = first !== null && first === target;
        const scratch = potted.includes('cue');
        const nine = potted.includes(9);
        const pottedBalls = potted.filter((t) => t !== 'cue');
        if (nine && legal && !scratch) { starter = 3 - starter; phase = 'aim'; return g.win(turn, `The 9 dropped on a legal shot after ${shots} strokes.`); }
        if (nine) { balls[9].dead = false; balls[9].x = W * 0.66; balls[9].y = H / 2; g.toast('9-ball re-spotted after the foul', 1200); }
        pottedBalls.forEach((t) => { if (balls[t]) balls[t].pottedFor = turn; });
        let again = false;
        if (!legal) { g.sfx('bad'); g.toast(first === null ? 'No ball touched — foul' : `Wrong ball first (needed the ${target}) — foul`, 1300); }
        else if (scratch) { g.sfx('bad'); g.toast('Scratch! Cue ball respotted', 1100); }
        else if (pottedBalls.length) { again = true; sc_add(pottedBalls.length); g.sfx('coin'); g.toast(`${pottedBalls.length} down — shoot again`, 1000); }
        else g.sfx('move');
        cue.vx = cue.vy = 0; cue.dead = false; cue.x = W * 0.2; cue.y = H / 2;
        phase = 'aim';
        if (order.every((n) => balls[n].dead)) { starter = 3 - starter; return g.win(turn, 'Table cleaned — every ball down.'); }
        if (shots >= MAX_SHOTS) {
          starter = 3 - starter;
          if (sunk[1] === sunk[2]) return g.draw(`${MAX_SHOTS} shots and ${sunk[1]} balls apiece.`);
          return g.win(sunk[1] > sunk[2] ? 1 : 2, `Shot limit — ${Math.max(sunk[1], sunk[2])} balls potted vs ${Math.min(sunk[1], sunk[2])}.`);
        }
        if (!again) turn = 3 - turn;
        g.turn(turn);
      }
      function sc_add(n) { sunk[turn] += n; g.points(sunk[1], sunk[2]); }
      const COL = { 1: '#ffd43b', 2: '#4dabf7', 3: '#ff6b6b', 4: '#9775fa', 5: '#ff922b', 6: '#51cf66', 7: '#e64980', 8: '#212529', 9: '#ffd43b' };
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#4a2c18');
        UI.rect(ctx, 6, 6, W - 12, H - 12, '#1f6b46');
        POCKETS.forEach((p) => UI.circle(ctx, p[0], p[1], R + 6, '#0d0d12'));
        UI.rect(ctx, W * 0.2 - 1, 10, 2, H - 20, '#ffffff22');
        field.discs.forEach((d) => {
          if (d.dead) return;
          if (d.tag === 'cue') { UI.circle(ctx, d.x, d.y, R, '#f8f9fa'); UI.circle(ctx, d.x + 3, d.y - 2, 1.6, '#ff6b6b'); return; }
          const stripe = d.tag === 9;
          UI.circle(ctx, d.x, d.y, R, stripe ? '#f8f9fa' : COL[d.tag]);
          if (stripe) UI.rect(ctx, d.x - R, d.y - 4, R * 2, 8, COL[d.tag]);
          ctx.save(); ctx.beginPath(); ctx.arc(d.x, d.y, 4.4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
          UI.text(ctx, String(d.tag), d.x, d.y + 0.5, { color: '#14151a', font: 'bold 6px system-ui' });
        });
        if (phase !== 'fly') {
          const a = angle();
          ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(cue.x, cue.y);
          ctx.lineTo(cue.x + Math.cos(a) * 300, cue.y + Math.sin(a) * 300);
          ctx.strokeStyle = g.color(turn); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
          const t = balls[target];
          if (t && !t.dead) { ctx.beginPath(); ctx.arc(t.x, t.y, R + 4, 0, Math.PI * 2); ctx.strokeStyle = '#ffffff66'; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]); }
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
