/* Curling — 4 stones each per end, 3 ends; aim with pointer drag or keys; closest stones to the button score. */
(function () {
  const W = 420, H = 760, BUTTON = { x: W / 2, y: 150 };
  Game.init({
    id: 'curling',
    rules: ['Each player throws 4 stones per end, alternating. Drag back from the stone (or use the sliders) to set direction and power, add curl for a bend.', 'After all 8 stones, the team with the stone closest to the button scores 1 point for each of their stones closer than the best opposing stone.', 'Three ends; highest total wins. Stones may knock others out of play.'],
    controls: { all: 'Drag from the stone and release to throw · or <kbd>←</kbd>/<kbd>→</kbd> aim, <kbd>↑</kbd>/<kbd>↓</kbd> power, <kbd>Space</kbd> throw' },
    points: true,
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const total = { 1: 0, 2: 0 }; let end = 1, thrown = 0, turn = 1, stones = [], moving = false, aim = { ang: 0, pow: 60, curl: 0 }, drag = null, hammer = 2;
      const curlEl = h('input', { type: 'range', min: -10, max: 10, value: 0, style: { width: '140px' } }); curlEl.addEventListener('input', () => { aim.curl = +curlEl.value; });
      const throwBtn = h('button', { class: 'btn primary', text: 'Throw (Space)', onclick: () => shoot() });
      g.stage.appendChild(h('div', { class: 'row' }, h('label', { class: 'row' }, 'Curl ', curlEl), throwBtn));
      const R = 14;
      UI.pointer(canvas, { down: (pt) => { if (moving) return; drag = pt; }, move: (pt) => { if (drag && pt.held) { const dx = pt.x - drag.x, dy = pt.y - drag.y; aim.ang = Math.atan2(-dx, dy); aim.pow = clamp(Math.hypot(dx, dy) / 2.2, 10, 100); } }, up: (pt) => { if (drag) { const dx = pt.x - drag.x, dy = pt.y - drag.y; if (Math.hypot(dx, dy) > 15) shoot(); drag = null; } } }, W, H);
      g.key(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], (c) => { if (c === 'ArrowLeft') aim.ang = clamp(aim.ang - 0.02, -0.5, 0.5); if (c === 'ArrowRight') aim.ang = clamp(aim.ang + 0.02, -0.5, 0.5); if (c === 'ArrowUp') aim.pow = clamp(aim.pow + 2, 10, 100); if (c === 'ArrowDown') aim.pow = clamp(aim.pow - 2, 10, 100); }, { repeat: true });
      g.key('Space', () => shoot());
      function shoot() { if (moving || g.over) return; const v = 200 + aim.pow * 6; stones.push({ p: turn, x: W / 2, y: H - 60, vx: Math.sin(aim.ang) * v, vy: -Math.cos(aim.ang) * v, curl: aim.curl }); moving = true; throwBtn.disabled = true; g.sfx('move'); }
      const status = () => g.turn(turn, `End ${end}/3 · <span class="pc${turn}">${esc(g.name(turn))}</span> throws stone ${Math.floor(thrown / 2) + 1}/4`);
      status(); g.points(0, 0);
      g.loop((dt) => {
        if (moving) {
          let any = false;
          for (const s of stones) {
            if (Math.abs(s.vx) + Math.abs(s.vy) < 1) { s.vx = s.vy = 0; continue; }
            any = true; const sp = Math.hypot(s.vx, s.vy); const dec = 55; const f = Math.max(0, sp - dec * dt) / sp; s.vx *= f; s.vy *= f;
            s.vx += s.curl * 0.9 * dt * (sp / 300); s.x += s.vx * dt; s.y += s.vy * dt;
            if (s.x < R || s.x > W - R) { s.vx = -s.vx * 0.5; s.x = clamp(s.x, R, W - R); }
          }
          for (let i = 0; i < stones.length; i++) for (let j = i + 1; j < stones.length; j++) { const a = stones[i], b = stones[j]; const d = dist(a.x, a.y, b.x, b.y); if (d < 2 * R && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rel > 0) { a.vx -= rel * nx; a.vy -= rel * ny; b.vx += rel * nx; b.vy += rel * ny; g.sfx('hit'); } const ov = (2 * R - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov; } }
          stones = stones.filter((s) => s.y > -R && s.y < H + R);
          if (!any) { moving = false; thrown++; throwBtn.disabled = false; if (thrown >= 8) return scoreEnd(); turn = 3 - turn; status(); }
        }
        draw();
      });
      function scoreEnd() {
        const inHouse = stones.filter((s) => dist(s.x, s.y, BUTTON.x, BUTTON.y) < 90 + R).map((s) => ({ p: s.p, d: dist(s.x, s.y, BUTTON.x, BUTTON.y) })).sort((a, b) => a.d - b.d);
        let pts = 0, who = 0; if (inHouse.length) { who = inHouse[0].p; for (const s of inHouse) { if (s.p === who) pts++; else break; } total[who] += pts; }
        g.points(total[1], total[2]); g.sfx(pts ? 'score' : 'tick');
        draw();
        if (end >= 3) { if (total[1] === total[2]) return g.draw(`Tied ${total[1]} – ${total[2]} after three ends.`); return g.win(total[1] > total[2] ? 1 : 2, `${total[1]} – ${total[2]} after three ends.`); }
        g.toast(pts ? `${esc(g.name(who))} scores ${pts} in end ${end}` : `Blank end ${end}`, 1600);
        end++; thrown = 0; stones = []; hammer = who ? 3 - who : hammer; turn = hammer === 1 ? 2 : 1; status();
      }
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#e7f1fb');
        [[90, '#4dabf7'], [60, '#fff'], [30, '#ff6b6b'], [8, '#fff']].forEach(([r, c]) => UI.circle(ctx, BUTTON.x, BUTTON.y, r, c));
        UI.rect(ctx, 0, BUTTON.y - 1, W, 2, '#8fb5d9'); UI.rect(ctx, 0, H - 120, W, 2, '#8fb5d9'); UI.rect(ctx, W / 2 - 1, 0, 2, H, '#8fb5d955');
        stones.forEach((s) => { UI.circle(ctx, s.x, s.y + 2, R, '#0003'); UI.circle(ctx, s.x, s.y, R, '#666'); UI.circle(ctx, s.x, s.y, R - 4, g.color(s.p)); });
        if (!moving && !g.over) { const x = W / 2, y = H - 60; UI.circle(ctx, x, y, R, '#666'); UI.circle(ctx, x, y, R - 4, g.color(turn)); const len = 40 + aim.pow * 2.4; ctx.strokeStyle = g.color(turn) + '99'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(aim.ang) * len, y - Math.cos(aim.ang) * len); ctx.stroke(); ctx.setLineDash([]); UI.text(ctx, `power ${aim.pow | 0}  curl ${aim.curl}`, W / 2, H - 20, { color: '#456', font: '12px monospace' }); }
        UI.text(ctx, `End ${end}/3`, W / 2, 18, { color: '#456', font: 'bold 13px system-ui' });
      }
    },
  });
})();
