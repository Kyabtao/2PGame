/* Bean Bag Toss — cornhole: three in the hole, one on the board, cancellation to 21. */
(function () {
  const W = 400, H = 440, BAGS = 4, GOAL = 21, MAX_R = 4;
  const HOLE = { x: W / 2, y: 150, r: 30 };
  const BOARD = { x0: 78, x1: W - 78, y0: 92, y1: 282 };
  let starter = 1;
  Game.init({
    id: 'bean-bag-toss',
    rules: [
      'Four bags each per round. One tap sets the aim across the board, the second sets how hard you throw.',
      'In the hole is 3 points, on the platform is 1, on the ground is nothing.',
      'Rounds are scored with cancellation: only the difference goes on the board, and 21 wins it.',
      `If ${MAX_R} rounds do not settle the match, whoever is ahead wins.`,
    ],
    controls: { all: 'Tap the lawn or press <kbd>Space</kbd>: aim, then toss' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'TOSS', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const score = { 1: 0, 2: 0 }, rndPts = { 1: 0, 2: 0 };
      let turn = starter, round = 0, phase = 'aim', aim = 0.5, bag = null, bags = { 1: 0, 2: 0 };
      let landed = [];
      const aimM = UI.meter({ speed: 1.05 }), powM = UI.meter({ speed: 1.35 });
      const note = h('div', { class: 'muted', style: { fontSize: '.9rem' } });
      g.stage.append(h('div', { class: 'col', style: { width: 'min(400px, 92vw)' } }, note, aimM.el, powM.el));
      g.points(0, 0);
      function act() {
        if (g.over || bag) return;
        if (phase === 'aim') { phase = 'pow'; aim = aimM.v; return; }
        if (phase === 'pow') {
          const v = powM.v;
          const x = W / 2 + (aim - 0.5) * 250;
          const y = 300 - v * 260;                       // low power drops short, high power throws past
          bag = { t: 0, x, y };
          phase = 'fly'; g.sfx('go');
        }
      }
      g.key('Space', act);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
      function land() {
        const x = bag.x, y = bag.y;
        let pts = 0, name = 'hits the dirt';
        if (Math.hypot(x - HOLE.x, y - HOLE.y) <= HOLE.r) { pts = 3; name = 'IN THE HOLE'; }
        else if (x > BOARD.x0 && x < BOARD.x1 && y > BOARD.y0 && y < BOARD.y1) { pts = 1; name = 'on the board'; }
        else if (y < BOARD.y0 - 10) name = 'thrown over the top';
        landed.push({ x: clamp(x, 8, W - 8), y: clamp(y, 8, H - 8), p: turn, pts });
        rndPts[turn] += pts; bags[turn]++;
        bag = null; phase = 'aim';
        g.sfx(pts === 3 ? 'coin' : pts ? 'score' : 'bad');
        g.toast(name + (pts ? ` +${pts}` : ''), 900);
        aimM.set(0.5); aimM.dir = 1; powM.set(0); powM.dir = 1;
        if (bags[1] >= BAGS && bags[2] >= BAGS) return close();
        turn = 3 - turn; g.turn(turn);
      }
      function close() {
        round++;
        const diff = rndPts[1] - rndPts[2];
        if (diff) { const w = diff > 0 ? 1 : 2; score[w] += Math.abs(diff); g.sfx('win'); g.toast(`${esc(g.name(w))} +${Math.abs(diff)} on the round`, 1100); }
        else g.toast('Nothing split — no points', 1000);
        rndPts[1] = rndPts[2] = 0; bags = { 1: 0, 2: 0 }; landed = [];
        g.points(score[1], score[2]);
        if (score[1] >= GOAL || score[2] >= GOAL || round >= MAX_R) return endGame();
        turn = round % 2 ? 3 - starter : starter; g.turn(turn);
      }
      function endGame() {
        starter = 3 - starter;
        const skunk = Math.max(score[1], score[2]) >= GOAL && Math.min(score[1], score[2]) === 0;
        if (score[1] === score[2]) return g.draw(`${round} rounds, ${score[1]} apiece.`);
        const w = score[1] > score[2] ? 1 : 2;
        g.win(w, skunk ? `SKUNK! ${score[w]}–0 without reply.` : `${score[w]} to ${score[3 - w]} after ${round} rounds.`);
      }
      g.loop((dt) => {
        if (!g.over) { if (phase === 'aim') aimM.step(dt); else if (phase === 'pow') powM.step(dt); }
        if (bag) { bag.t = Math.min(1, bag.t + dt * 3.4); if (bag.t >= 1) land(); }
        draw();
        note.textContent = `round ${round + 1}/${MAX_R} · ${g.name(turn)} bag ${Math.min(BAGS, bags[turn] + 1)}/${BAGS} · round ${rndPts[1]}–${rndPts[2]} · match ${score[1]}–${score[2]}`;
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#356c48');
        for (let i = 0; i < 20; i++) UI.rect(ctx, 0, i * 23, W, 11, i % 2 ? '#3c784f' : '#356c48');
        ctx.save(); ctx.transform(1, 0, -0.12, 1, 24, 0);
        UI.roundRect(ctx, BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0, 10, turn === 1 ? '#8d5b2b' : '#96612f');
        UI.rect(ctx, BOARD.x0, BOARD.y1 - 26, BOARD.x1 - BOARD.x0, 26, '#7a4d22');
        ctx.restore();
        UI.circle(ctx, HOLE.x, HOLE.y, HOLE.r, '#141a2e');
        UI.rect(ctx, BOARD.x0, BOARD.y1 - 4, BOARD.x1 - BOARD.x0, 4, '#00000033');
        landed.forEach((s, i) => bagShape(ctx, s.x, s.y, g.color(s.p), s.pts));
        if (bag) {
          const e = bag.t, x = lerp(W / 2, bag.x, e), y = lerp(H - 46, bag.y, e) - Math.sin(e * Math.PI) * 110;
          const k = lerp(1.5, 0.8, e);
          bagShape(ctx, x, y, g.color(turn), 0, k);
        } else bagShape(ctx, W / 2 + ((phase === 'pow' ? aim : aimM.v) - 0.5) * 250, H - 44, g.color(turn), 0, 1);
      }
      function bagShape(ctx, x, y, color, pts, k) {
        ctx.save(); ctx.translate(x, y); if (k) ctx.scale(k, k);
        UI.roundRect(ctx, -16, -12, 32, 24, 7, pts === 3 ? '#ffd43b' : color);
        UI.roundRect(ctx, -12, -8, 24, 16, 5, '#ffffff22');
        ctx.restore();
      }
      g.turn(turn);
    },
    onStop() { starter = 3 - starter; },
  });
})();
