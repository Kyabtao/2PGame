/* Eight-Ball Pool — simplified rules: groups assigned on first pot, 8-ball last, scratch = ball in hand. */
(function () {
  const W = 800, H = 440, R = 10, RAIL = 24;
  Game.init({
    id: 'eight-ball',
    rules: ['Aim by dragging from the cue ball (or use the sliders) and release to shoot.', 'The first ball potted assigns groups: solids (1–7) or stripes (9–15). Pot all of your group, then the 8-ball to win.', 'Potting the 8-ball early, or scratching while shooting the 8, loses. A scratch (cue ball potted) gives the opponent ball-in-hand: click to place it.', 'Pot one of your own balls and you shoot again.'],
    controls: { all: 'Drag from the cue ball & release · <kbd>←</kbd>/<kbd>→</kbd> aim, <kbd>↑</kbd>/<kbd>↓</kbd> power, <kbd>Space</kbd> shoot' },
    points: true,
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const COLORS = ['#fff', '#ffd43b', '#4dabf7', '#ff6b6b', '#845ef7', '#ff922b', '#51cf66', '#c92a2a', '#111', '#ffd43b', '#4dabf7', '#ff6b6b', '#845ef7', '#ff922b', '#51cf66', '#c92a2a'];
      const balls = [];
      balls.push({ n: 0, x: 200, y: H / 2, vx: 0, vy: 0, on: true });
      const order = shuffle([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
      let k = 0; for (let row = 0; row < 5; row++) for (let i = 0; i <= row; i++) { const n = (row === 2 && i === 1) ? 8 : order[k++]; balls.push({ n, x: 560 + row * R * 1.75, y: H / 2 + (i - row / 2) * R * 2.05, vx: 0, vy: 0, on: true }); }
      const pockets = [[RAIL, RAIL], [W / 2, RAIL - 6], [W - RAIL, RAIL], [RAIL, H - RAIL], [W / 2, H - RAIL + 6], [W - RAIL, H - RAIL]];
      let turn = 1, groups = { 1: null, 2: null }, moving = false, aim = { ang: 0, pow: 50 }, drag = null, inHand = false, pottedThisShot = [], scratched = false, firstHit = null;
      const shootBtn = h('button', { class: 'btn primary', text: 'Shoot (Space)', onclick: shoot });
      g.stage.appendChild(h('div', { class: 'row' }, shootBtn));
      const cue = () => balls[0];
      const mine = (p) => groups[p] == null ? [] : balls.filter((b) => b.on && b.n !== 8 && b.n !== 0 && ((groups[p] === 'solid') === (b.n < 8)));
      const status = () => { const gname = groups[turn] ? (groups[turn] === 'solid' ? 'solids ●' : 'stripes ◐') : 'open table'; g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${gname}${inHand ? ' · ball in hand — click to place' : ''}`); const left = (p) => groups[p] ? mine(p).length : 7; g.points(left(1), left(2)); };
      status();
      UI.pointer(canvas, { down: (pt) => { if (moving) return; if (inHand) { const c = cue(); if (pt.x > RAIL + R && pt.x < W - RAIL - R && pt.y > RAIL + R && pt.y < H - RAIL - R && !balls.some((b) => b.on && b.n && dist(b.x, b.y, pt.x, pt.y) < 2 * R)) { c.x = pt.x; c.y = pt.y; c.on = true; inHand = false; status(); } return; } drag = pt; }, move: (pt) => { if (drag && pt.held) { const c = cue(); aim.ang = Math.atan2(drag.y - pt.y, drag.x - pt.x); aim.pow = clamp(dist(pt.x, pt.y, drag.x, drag.y) / 1.6, 5, 100); if (dist(drag.x, drag.y, c.x, c.y) > 60) aim.ang = Math.atan2(pt.y - c.y, pt.x - c.x); } }, up: (pt) => { if (drag) { if (dist(pt.x, pt.y, drag.x, drag.y) > 12) shoot(); drag = null; } } }, W, H);
      g.key(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], (c) => { if (c === 'ArrowLeft') aim.ang -= 0.03; if (c === 'ArrowRight') aim.ang += 0.03; if (c === 'ArrowUp') aim.pow = clamp(aim.pow + 3, 5, 100); if (c === 'ArrowDown') aim.pow = clamp(aim.pow - 3, 5, 100); }, { repeat: true });
      g.key('Space', shoot);
      function shoot() { if (moving || g.over || inHand) return; const c = cue(); c.vx = Math.cos(aim.ang) * aim.pow * 11; c.vy = Math.sin(aim.ang) * aim.pow * 11; moving = true; pottedThisShot = []; scratched = false; firstHit = null; shootBtn.disabled = true; g.sfx('hit'); }
      g.loop((dt) => {
        if (moving) {
          let any = false;
          for (let step = 0; step < 3; step++) {
            const s = dt / 3;
            for (const b of balls) { if (!b.on) continue; const sp = Math.hypot(b.vx, b.vy); if (sp < 2) { b.vx = b.vy = 0; continue; } any = true; const f = Math.max(0, sp - 70 * s) / sp; b.vx *= f; b.vy *= f; b.x += b.vx * s; b.y += b.vy * s; if (b.x < RAIL + R) { b.x = RAIL + R; b.vx = Math.abs(b.vx) * .7; } if (b.x > W - RAIL - R) { b.x = W - RAIL - R; b.vx = -Math.abs(b.vx) * .7; } if (b.y < RAIL + R) { b.y = RAIL + R; b.vy = Math.abs(b.vy) * .7; } if (b.y > H - RAIL - R) { b.y = H - RAIL - R; b.vy = -Math.abs(b.vy) * .7; } for (const [px, py] of pockets) if (dist(b.x, b.y, px, py) < 17) { b.on = false; b.vx = b.vy = 0; if (b.n === 0) scratched = true; else pottedThisShot.push(b.n); g.sfx('coin'); } }
            for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) { const a = balls[i], b = balls[j]; if (!a.on || !b.on) continue; const d = dist(a.x, a.y, b.x, b.y); if (d < 2 * R && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d; const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny; if (rel > 0) { a.vx -= rel * nx; a.vy -= rel * ny; b.vx += rel * nx; b.vy += rel * ny; if (rel > 30) g.sfx('bounce'); if (firstHit == null && (a.n === 0 || b.n === 0)) firstHit = a.n === 0 ? b.n : a.n; } const ov = (2 * R - d) / 2 + 0.1; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov; } }
          }
          if (!any) { moving = false; shootBtn.disabled = false; resolve(); }
        }
        draw();
      });
      function resolve() {
        const me = turn, opp = 3 - turn;
        // assign groups
        if (groups[me] == null) { const first = pottedThisShot.find((n) => n !== 8); if (first != null) { groups[me] = first < 8 ? 'solid' : 'stripe'; groups[opp] = first < 8 ? 'stripe' : 'solid'; g.toast(`${esc(g.name(me))} has ${groups[me]}s`, 1200); } }
        if (pottedThisShot.includes(8)) { const cleared = groups[me] && mine(me).length === 0; if (cleared && !scratched) { status(); return g.win(me, 'Sank the 8-ball to finish.'); } status(); return g.win(opp, `${esc(g.name(me))} sank the 8-ball ${scratched ? 'and scratched' : 'too early'}.`); }
        if (scratched) { inHand = true; cue().x = 200; cue().y = H / 2; cue().on = false; turn = opp; g.sfx('bad'); status(); return; }
        const ownPot = groups[me] && pottedThisShot.some((n) => (groups[me] === 'solid') === (n < 8));
        if (ownPot || (groups[me] == null && pottedThisShot.length)) { status(); g.sfx('score'); return; }
        turn = opp; status();
      }
      function draw() {
        UI.roundRect(ctx, 0, 0, W, H, 14, '#5b3a1e'); UI.rect(ctx, RAIL, RAIL, W - 2 * RAIL, H - 2 * RAIL, '#1f8a4c');
        pockets.forEach(([x, y]) => UI.circle(ctx, x, y, 17, '#111'));
        for (const b of balls) { if (!b.on) continue; UI.circle(ctx, b.x, b.y + 2, R, '#0005'); UI.circle(ctx, b.x, b.y, R, b.n > 8 ? '#fff' : COLORS[b.n]); if (b.n > 8) { ctx.save(); ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, Math.PI * 2); ctx.clip(); UI.rect(ctx, b.x - R, b.y - R * .5, 2 * R, R, COLORS[b.n]); ctx.restore(); } if (b.n) { UI.circle(ctx, b.x, b.y, 4.5, '#fff'); UI.text(ctx, b.n, b.x, b.y + 0.5, { color: '#111', font: 'bold 7px system-ui' }); } }
        const c = cue();
        if (inHand) UI.text(ctx, 'Ball in hand — click to place the cue ball', W / 2, H / 2 - 60, { color: '#fff', font: 'bold 16px system-ui' });
        else if (!moving && c.on && !g.over) { ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + Math.cos(aim.ang) * 300, c.y + Math.sin(aim.ang) * 300); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#deb887'; ctx.lineWidth = 5; ctx.beginPath(); const back = 14 + aim.pow * 0.6; ctx.moveTo(c.x - Math.cos(aim.ang) * back, c.y - Math.sin(aim.ang) * back); ctx.lineTo(c.x - Math.cos(aim.ang) * (back + 140), c.y - Math.sin(aim.ang) * (back + 140)); ctx.stroke(); }
        // group indicators
        const rack = (p, x) => { const left = mine(p); UI.text(ctx, groups[p] ? `${g.name(p)}: ${left.length} left` : g.name(p), x, 12, { color: g.color(p), font: 'bold 11px system-ui' }); };
        rack(1, 90); rack(2, W - 90);
      }
    },
  });
})();
