/* Golf Putt — alternate shot across four greens: bank off the walls, dodge the bumper, hole out. */
(function () {
  const W = 380, H = 420, HOLES = 3, LIMIT = 4;
  let starter = 1;
  Game.init({
    id: 'golf-putt',
    rules: [
      'Three greens, alternate shot: you and your rival take turns putting the same ball until it drops, then the next hole starts with a tap-in for par.',
      'One tap sets the line (±60° from straight up), the second sets how hard the putt is struck.',
      'The ball banks off the cushions and off the bumper. It only drops if it rolls over the cup under control — a scorcher lips out.',
      `A hole is capped at ${LIMIT} putts (that scores ${LIMIT + 1}). Fewest strokes over ${HOLES} holes wins.`,
    ],
    controls: { all: 'Tap the green or press <kbd>Space</kbd>: line, then stroke' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'PUTT', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const field = UI.field(W, H, { friction: 4.2, wall: 0.76, min: 18 });
      let hole = 0, turn = starter, phase = 'aim', aim = 0.5, strokes = 0, ball = null, wait = 0, bumpers = [], cup = { x: 0, y: 0, r: 13 };
      const card = { 1: 0, 2: 0 };
      const aimM = UI.meter({ speed: 0.85 }), strM = UI.meter({ speed: 1.2 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(380px, 92vw)' } }, note, aimM.el, strM.el));
      const WALL = { x0: 26, x1: W - 26, y0: 26, y1: H - 26 };
      function setup() {
        hole++;
        field.discs.length = 0;
        bumpers = [];
        const nb = rnd(1, 2);
        for (let i = 0; i < nb; i++) bumpers.push({ x: rndf(80, W - 80), y: rndf(120, H - 150), r: rndf(16, 26) });
        cup.x = rndf(70, W - 70); cup.y = rndf(50, 110);
        ball = field.add({ x: W / 2 + rndf(-40, 40), y: H - 60, r: 7, m: 1, tag: 'ball' });
        strokes = 0; phase = 'aim';
        g.turn(turn); g.sfx('click');
      }
      setup();
      function act() {
        if (g.over || phase === 'roll') return;
        if (phase === 'aim') { phase = 'str'; aim = aimM.v; return; }
        const v = strM.v;
        const a = -Math.PI / 2 + (aim - 0.5) * 2.1;
        ball.x = clamp(ball.x, WALL.x0 + 8, WALL.x1 - 8); ball.y = clamp(ball.y, WALL.y0 + 8, WALL.y1 - 8);
        ball.vx = Math.cos(a) * (330 + v * 1300); ball.vy = Math.sin(a) * (330 + v * 1300);
        ball.dead = false;
        phase = 'roll'; strokes++; wait = 0; g.sfx('hit');
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function done() {
        const d = Math.hypot(ball.x - cup.x, ball.y - cup.y);
        if (d < cup.r - 1) {
          ball.dead = true; g.sfx('coin');
          const name = strokes === 1 ? 'HOLE IN ONE!' : strokes <= 2 ? 'birdie or better' : 'holed out';
          g.toast(`${name} — ${strokes}`, 1100);
          return holeOut(strokes);
        }
        if (strokes >= LIMIT) { g.toast(`Cap reached — ${LIMIT + 1}`, 1000); return holeOut(LIMIT + 1); }
        phase = 'aim'; aimM.set(0.5); aimM.dir = 1; strM.set(0); strM.dir = 1;
        turn = 3 - turn; g.turn(turn);
      }
      function holeOut(strokesForHole) {
        const other = 3 - turn;
        card[turn] += strokesForHole;
        card[other] += strokesForHole;              // match play style: both players card the same hole score
        g.points(card[1], card[2]);
        if (hole >= HOLES) return end();
        turn = other; setup();
      }
      function end() {
        starter = 3 - starter;
        if (card[1] === card[2]) return g.draw(`All square on ${card[1]} strokes over ${HOLES} holes.`);
        const w = card[1] < card[2] ? 1 : 2;
        g.win(w, `${card[w]} strokes to ${card[3 - w]} across ${HOLES} holes.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'str') strM.step(dt); }
        if (phase === 'roll' && ball) {
          for (let k = 0; k < 2; k++) {
            field.step(dt / 2);
            bumpers.forEach((b) => {
              const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy), need = b.r + ball.r;
              if (d < need && d > 0) {
                const nx = dx / d, ny = dy / d;
                ball.x = b.x + nx * need; ball.y = b.y + ny * need;
                const rel = ball.vx * nx + ball.vy * ny;
                if (rel < 0) { ball.vx -= 2 * rel * nx * 0.86; ball.vy -= 2 * rel * ny * 0.86; g.sfx('bounce'); }
              }
            });
            ball.x = clamp(ball.x, WALL.x0 + ball.r, WALL.x1 - ball.r);
            ball.y = clamp(ball.y, WALL.y0 + ball.r, WALL.y1 - ball.r);
            const dc = Math.hypot(ball.x - cup.x, ball.y - cup.y);
            const sp = Math.hypot(ball.vx, ball.vy);
            if (dc < cup.r && sp < 520) { ball.vx = ball.vy = 0; ball.x = cup.x; ball.y = cup.y; phase = 'wait'; break; }
          }
          wait += dt;
          if (!field.moving() || wait > 0.9) { wait = 0; done(); }
        }
        draw();
        note.textContent = `hole ${hole}/${HOLES} · ${g.name(turn)} · putts this hole ${strokes} · strokes ${card[1]}–${card[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#232a44');
        UI.roundRect(ctx, WALL.x0, WALL.y0, WALL.x1 - WALL.x0, WALL.y1 - WALL.y0, 26, '#2f7d48');
        ctx.save(); ctx.globalAlpha = .25; for (let i = 0; i < 12; i++) UI.rect(ctx, WALL.x0, WALL.y0 + i * 33, WALL.x1 - WALL.x0, 16, '#1f5d36'); ctx.restore();
        bumpers.forEach((b) => { UI.circle(ctx, b.x, b.y, b.r, '#c99a53'); UI.circle(ctx, b.x, b.y, b.r - 4, '#a4762f'); });
        UI.circle(ctx, cup.x, cup.y, cup.r, '#11141a');
        UI.circle(ctx, cup.x, cup.y, cup.r - 4, '#0b0e14');
        UI.rect(ctx, cup.x - 1, cup.y - cup.r - 26, 2, 26, '#ffffff33');
        if (ball && !ball.dead) {
          UI.circle(ctx, ball.x, ball.y, ball.r, '#f8f9fa');
          UI.circle(ctx, ball.x - 2, ball.y - 2, 2, '#ced4da');
        }
        if (phase === 'aim' || phase === 'str') {
          const a = -Math.PI / 2 + (((phase === 'str' ? aim : aimM.v)) - 0.5) * 2.1;
          ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(ball.x, ball.y);
          ctx.lineTo(ball.x + Math.cos(a) * (60 + (phase === 'str' ? strM.v : 0) * 210), ball.y + Math.sin(a) * (60 + (phase === 'str' ? strM.v : 0) * 210));
          ctx.strokeStyle = g.color(turn); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        }
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
