/* Mini Golf — 9 procedurally arranged holes, drag to putt, stroke play. */
(function () {
  const W = 420, H = 600, HOLES = 9;
  const LAYOUTS = [
    { tee: [210, 540], cup: [210, 80], walls: [] },
    { tee: [80, 540], cup: [340, 80], walls: [[150, 250, 200, 20]] },
    { tee: [210, 540], cup: [210, 80], walls: [[60, 300, 140, 20], [220, 300, 140, 20]] },
    { tee: [70, 540], cup: [350, 90], walls: [[0, 200, 300, 20], [120, 380, 300, 20]] },
    { tee: [210, 540], cup: [80, 90], walls: [[180, 100, 20, 200], [300, 250, 20, 250]] },
    { tee: [340, 540], cup: [80, 80], walls: [[100, 150, 220, 20], [100, 420, 220, 20], [100, 150, 20, 120], [300, 320, 20, 120]] },
    { tee: [210, 540], cup: [210, 70], walls: [[140, 280, 140, 60]], bumpers: [[100, 180], [320, 180], [100, 400], [320, 400]] },
    { tee: [60, 540], cup: [360, 60], walls: [[0, 150, 340, 20], [80, 300, 340, 20], [0, 450, 340, 20]] },
    { tee: [210, 550], cup: [210, 60], walls: [[60, 120, 20, 360], [340, 120, 20, 360], [180, 200, 60, 20], [180, 380, 60, 20]], bumpers: [[210, 300]] },
  ];
  Game.init({
    id: 'mini-golf',
    rules: ['Nine holes. Drag back from your ball and release to putt (or use the sliders + Putt).', 'Both players play each hole; the fewer total strokes over nine holes wins. Maximum 8 strokes per hole.', 'Walls and round bumpers bounce the ball.'],
    controls: { all: 'Drag from the ball and release · <kbd>←</kbd>/<kbd>→</kbd> aim, <kbd>↑</kbd>/<kbd>↓</kbd> power, <kbd>Space</kbd> putt' },
    points: true,
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const strokes = { 1: 0, 2: 0 }; const card = { 1: [], 2: [] };
      let hole = 0, turn = 1, balls = { 1: null, 2: null }, moving = false, done = { 1: false, 2: false }, holeStrokes = { 1: 0, 2: 0 }, aim = { ang: -Math.PI / 2, pow: 40 }, drag = null;
      const cur = () => balls[turn];
      const scorecard = h('div', { class: 'log', style: { maxWidth: '420px', fontFamily: 'var(--mono)' } });
      const puttBtn = h('button', { class: 'btn primary', text: 'Putt (Space)', onclick: putt });
      g.stage.append(h('div', { class: 'row' }, puttBtn), scorecard);
      const L = () => LAYOUTS[hole];
      const start = (p) => { balls[p] = { x: L().tee[0], y: L().tee[1], vx: 0, vy: 0, p }; moving = false; };
      const status = () => { g.turn(turn, `Hole ${hole + 1}/${HOLES} · <span class="pc${turn}">${esc(g.name(turn))}</span> · stroke ${holeStrokes[turn] + 1}`); g.points(strokes[1], strokes[2]); scorecard.innerHTML = `<div>Hole&nbsp;&nbsp;&nbsp;${range(HOLES).map((i) => String(i + 1).padStart(2)).join(' ')}  Tot</div>` + [1, 2].map((p) => `<div class="pc${p}">${esc(g.name(p).slice(0, 6).padEnd(6))} ${range(HOLES).map((i) => String(card[p][i] == null ? '·' : card[p][i]).padStart(2)).join(' ')}  ${String(strokes[p]).padStart(3)}</div>`).join(''); };
      start(1); start(2); status();
      UI.pointer(canvas, { down: (pt) => { if (!moving) drag = pt; }, move: (pt) => { if (drag && pt.held) { const dx = pt.x - drag.x, dy = pt.y - drag.y; aim.ang = Math.atan2(-dy, -dx); aim.pow = clamp(Math.hypot(dx, dy) / 1.8, 5, 100); } }, up: (pt) => { if (drag) { const d = dist(pt.x, pt.y, drag.x, drag.y); if (d > 12) putt(); drag = null; } } }, W, H);
      g.key(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], (c) => { if (c === 'ArrowLeft') aim.ang -= 0.05; if (c === 'ArrowRight') aim.ang += 0.05; if (c === 'ArrowUp') aim.pow = clamp(aim.pow + 3, 5, 100); if (c === 'ArrowDown') aim.pow = clamp(aim.pow - 3, 5, 100); }, { repeat: true });
      g.key('Space', putt);
      function putt() { const ball = cur(); if (moving || g.over || !ball) return; ball.vx = Math.cos(aim.ang) * aim.pow * 7; ball.vy = Math.sin(aim.ang) * aim.pow * 7; moving = true; holeStrokes[turn]++; strokes[turn]++; puttBtn.disabled = true; g.sfx('hit'); status(); }
      function nextTurn(finished) {
        if (finished) { card[turn][hole] = holeStrokes[turn]; done[turn] = true; balls[turn] = null; }
        if (done[1] && done[2]) {
          if (hole + 1 >= HOLES) { status(); if (strokes[1] === strokes[2]) return g.draw(`Tied on ${strokes[1]} strokes.`); return g.win(strokes[1] < strokes[2] ? 1 : 2, `${Math.min(strokes[1], strokes[2])} strokes to ${Math.max(strokes[1], strokes[2])}.`); }
          hole++; done = { 1: false, 2: false }; holeStrokes = { 1: 0, 2: 0 }; turn = 1; g.toast(`Hole ${hole + 1}`, 900); start(1); start(2);
        } else if (!done[3 - turn]) turn = 3 - turn;
        moving = false; puttBtn.disabled = false; status();
      }
      g.loop((dt) => {
        const ball = cur();
        if (moving && ball) {
          for (let k = 0; k < 4; k++) {
            const s = dt / 4; const sp = Math.hypot(ball.vx, ball.vy); const f = Math.max(0, sp - 120 * s) / (sp || 1); ball.vx *= f; ball.vy *= f;
            let nx = ball.x + ball.vx * s, ny = ball.y + ball.vy * s;
            if (nx < 8 || nx > W - 8) { ball.vx = -ball.vx * 0.8; nx = clamp(nx, 8, W - 8); g.sfx('bounce'); } if (ny < 8 || ny > H - 8) { ball.vy = -ball.vy * 0.8; ny = clamp(ny, 8, H - 8); g.sfx('bounce'); }
            for (const [wx, wy, ww, wh] of L().walls) { if (nx + 7 > wx && nx - 7 < wx + ww && ny + 7 > wy && ny - 7 < wy + wh) { const ox = Math.min(nx + 7 - wx, wx + ww - (nx - 7)), oy = Math.min(ny + 7 - wy, wy + wh - (ny - 7)); if (ox < oy) { ball.vx = -ball.vx * 0.8; nx = ball.x; } else { ball.vy = -ball.vy * 0.8; ny = ball.y; } g.sfx('bounce'); } }
            for (const [bx, by] of (L().bumpers || [])) { const d = dist(nx, ny, bx, by); if (d < 22) { const n1 = (nx - bx) / d, n2 = (ny - by) / d; const rel = ball.vx * n1 + ball.vy * n2; if (rel < 0) { ball.vx -= 2.2 * rel * n1; ball.vy -= 2.2 * rel * n2; } nx = bx + n1 * 22; ny = by + n2 * 22; g.sfx('pop'); } }
            ball.x = nx; ball.y = ny;
            const dc = dist(ball.x, ball.y, L().cup[0], L().cup[1]);
            if (dc < 11 && Math.hypot(ball.vx, ball.vy) < 260) { moving = false; g.sfx('coin'); balls[turn] = null; g.toast(holeStrokes[turn] === 1 ? '⛳ Hole in one!' : `In for ${holeStrokes[turn]}`, 900); g.after(600, () => nextTurn(true)); draw(); return; }
          }
          if (Math.hypot(ball.vx, ball.vy) < 3) { ball.vx = ball.vy = 0; moving = false; if (holeStrokes[turn] >= 8) { g.toast('Max strokes — picking up', 900); return g.after(500, () => nextTurn(true)); } nextTurn(false); }
        }
        draw();
      });
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#3f9f4a'); for (let i = 0; i < 12; i++) if (i % 2) UI.rect(ctx, 0, i * 50, W, 50, '#3b964a');
        L().walls.forEach(([x, y, w, hh]) => UI.roundRect(ctx, x, y, w, hh, 4, '#7b5b3a')); (L().bumpers || []).forEach(([x, y]) => { UI.circle(ctx, x, y, 14, '#5b3b2a'); UI.circle(ctx, x, y, 9, '#ff922b'); });
        UI.circle(ctx, L().cup[0], L().cup[1], 11, '#111'); UI.rect(ctx, L().cup[0] - 1, L().cup[1] - 34, 2, 34, '#eee'); ctx.beginPath(); ctx.moveTo(L().cup[0] + 1, L().cup[1] - 34); ctx.lineTo(L().cup[0] + 16, L().cup[1] - 28); ctx.lineTo(L().cup[0] + 1, L().cup[1] - 22); ctx.fillStyle = '#ff6b6b'; ctx.fill();
        UI.rect(ctx, L().tee[0] - 12, L().tee[1] - 3, 24, 6, '#2f7a38');
        for (const p of [1, 2]) { const b = balls[p]; if (!b) continue; UI.circle(ctx, b.x, b.y + 2, 7, '#0004'); UI.circle(ctx, b.x, b.y, 7, '#fff'); UI.circle(ctx, b.x, b.y, 3, g.color(b.p)); }
        const ball = cur();
        if (!moving && ball && !g.over) { const len = 20 + aim.pow * 1.6; ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(aim.ang) * len, ball.y + Math.sin(aim.ang) * len); ctx.stroke(); ctx.setLineDash([]); }
        UI.text(ctx, `Hole ${hole + 1}`, W / 2, 14, { color: '#fff', font: 'bold 13px system-ui' });
      }
    },
  });
})();
