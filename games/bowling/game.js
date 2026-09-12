/* Bowling — 10 frames, aim + spin + power, full scoring with strikes/spares/10th frame bonus. */
(function () {
  const W = 300, H = 600;
  Game.init({
    id: 'bowling',
    rules: ['Ten frames each, alternating. Set your aim, spin and power (or drag from the ball), then roll.', 'Standard scoring: a strike scores 10 + the next two rolls, a spare 10 + the next roll. The 10th frame allows bonus rolls.', 'Highest total after ten frames wins.'],
    controls: { all: 'Drag from the ball & release · <kbd>←</kbd>/<kbd>→</kbd> aim · <kbd>Z</kbd>/<kbd>X</kbd> spin · <kbd>Space</kbd> roll' },
    points: true,
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); canvas.style.maxHeight = 'calc(100dvh - 250px)'; g.stage.appendChild(canvas);
      const P = { 1: mkPlayer(), 2: mkPlayer() }; let turn = 1, pins, ball = null, aim = { x: 0, spin: 0, pow: 70 }, drag = null;
      function mkPlayer() { return { rolls: [], frame: 0, sub: 0, standing: 10, done: false }; }
      const PIN = (() => { const out = []; const rows = [[0], [-1, 1], [-2, 0, 2], [-3, -1, 1, 3]]; rows.forEach((r, i) => r.forEach((x) => out.push({ x: W / 2 + x * 16, y: 90 - i * 24 }))); return out; })();
      const resetPins = () => { pins = PIN.map((p) => ({ x: p.x, y: p.y, up: true, vx: 0, vy: 0 })); };
      resetPins();
      const rollBtn = h('button', { class: 'btn primary', text: 'Roll (Space)', onclick: roll });
      const frames = h('div', { class: 'log', style: { fontFamily: 'var(--mono)', maxWidth: '520px', fontSize: '.8rem' } });
      g.stage.append(h('div', { class: 'row' }, rollBtn), frames);
      UI.pointer(canvas, { down: (pt) => { if (!ball) drag = pt; }, move: (pt) => { if (drag && pt.held) { aim.x = clamp((pt.x - drag.x) / 3, -40, 40); aim.spin = clamp(-(pt.x - drag.x) / 60, -1, 1); aim.pow = clamp((drag.y - pt.y) / 1.5 + 40, 30, 100); } }, up: (pt) => { if (drag) { if (dist(pt.x, pt.y, drag.x, drag.y) > 12) roll(); drag = null; } } }, W, H);
      g.key(['ArrowLeft', 'ArrowRight', 'KeyZ', 'KeyX', 'ArrowUp', 'ArrowDown'], (c) => { if (c === 'ArrowLeft') aim.x = clamp(aim.x - 3, -40, 40); if (c === 'ArrowRight') aim.x = clamp(aim.x + 3, -40, 40); if (c === 'KeyZ') aim.spin = clamp(aim.spin - 0.1, -1, 1); if (c === 'KeyX') aim.spin = clamp(aim.spin + 0.1, -1, 1); if (c === 'ArrowUp') aim.pow = clamp(aim.pow + 3, 30, 100); if (c === 'ArrowDown') aim.pow = clamp(aim.pow - 3, 30, 100); }, { repeat: true });
      g.key('Space', roll);
      function roll() { if (ball || g.over) return; ball = { x: W / 2 + aim.x, y: H - 60, vx: 0, vy: -(200 + aim.pow * 5), spin: aim.spin, r: 12 }; rollBtn.disabled = true; g.sfx('move'); }
      // --- scoring ---
      function scoreRolls(rolls) {
        let total = 0, i = 0; const perFrame = [];
        for (let f = 0; f < 10; f++) {
          if (i >= rolls.length) break;
          if (rolls[i] === 10) { if (i + 2 < rolls.length) { total += 10 + rolls[i + 1] + rolls[i + 2]; perFrame[f] = total; } i += 1; }
          else if (i + 1 < rolls.length && rolls[i] + rolls[i + 1] === 10) { if (i + 2 < rolls.length) { total += 10 + rolls[i + 2]; perFrame[f] = total; } i += 2; }
          else if (i + 1 < rolls.length) { total += rolls[i] + rolls[i + 1]; perFrame[f] = total; i += 2; }
          else break;
        }
        return { total, perFrame };
      }
      const marks = (pl) => { const r = pl.rolls; const out = []; let i = 0; for (let f = 0; f < 10; f++) { if (i >= r.length) break; if (f < 9) { if (r[i] === 10) { out.push('X '); i++; } else { const a = r[i], b = r[i + 1]; out.push(b == null ? `${a} ` : a + b === 10 ? `${a}/` : `${a}${b}`); i += 2; } } else { let s = ''; let prev = null; for (; i < r.length; i++) { const v = r[i]; s += v === 10 ? 'X' : (prev != null && prev + v === 10 && prev !== 10) ? '/' : v; prev = v === 10 ? null : v; } out.push(s.padEnd(3)); } } return out; };
      const renderFrames = () => { frames.innerHTML = [1, 2].map((p) => { const sc = scoreRolls(P[p].rolls); return `<div class="pc${p}">${esc(g.name(p).slice(0, 6).padEnd(6))} ${range(10).map((f) => (marks(P[p])[f] || '  ').padEnd(3)).join('|')} = ${sc.total}</div>`; }).join(''); g.points(scoreRolls(P[1].rolls).total, scoreRolls(P[2].rolls).total); };
      const status = () => g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · frame ${P[turn].frame + 1} · ${P[turn].standing} pins up`);
      renderFrames(); status();
      g.loop((dt) => {
        if (ball) {
          for (let k = 0; k < 3; k++) {
            const s = dt / 3; ball.vx += ball.spin * 90 * s * (1 - (H - 60 - ball.y) / (H - 60) * 0.5); ball.x += ball.vx * s; ball.y += ball.vy * s;
            if (ball.x < 30 || ball.x > W - 30) { ball.gutter = true; ball.x = clamp(ball.x, 20, W - 20); ball.vx = 0; }
            if (!ball.gutter) for (const p of pins) { if (!p.up) continue; const d = dist(ball.x, ball.y, p.x, p.y); if (d < ball.r + 6) { p.up = false; p.vx = (p.x - ball.x) / d * 260 + rndf(-40, 40); p.vy = (p.y - ball.y) / d * 260 - 60; g.sfx('hit'); ball.vx *= 0.9; } }
            for (const p of pins) { if (p.up || (!p.vx && !p.vy)) continue; p.x += p.vx * s; p.y += p.vy * s; p.vx *= 0.97; p.vy *= 0.97; for (const q of pins) { if (q === p || !q.up) continue; if (dist(p.x, p.y, q.x, q.y) < 14) { q.up = false; q.vx = (q.x - p.x) * 15 + p.vx * 0.6; q.vy = (q.y - p.y) * 15 + p.vy * 0.6; g.sfx('bounce'); } } }
          }
          if (ball.y < -40) { ball = null; g.after(500, endRoll); }
        }
        draw();
      });
      function endRoll() {
        const pl = P[turn]; const down = pins.filter((p) => !p.up).length;
        const thisRoll = clamp(down - (10 - pl.standing), 0, pl.standing); pl.rolls.push(thisRoll); pl.standing -= thisRoll;
        const strike = thisRoll === 10 && pl.sub === 0; const spare = pl.standing === 0 && !strike;
        g.sfx(strike ? 'win' : thisRoll ? 'score' : 'bad'); g.toast(strike ? '🎳 STRIKE!' : spare ? 'SPARE!' : `${thisRoll} pin${thisRoll === 1 ? '' : 's'}`, 800);
        let switchTurn = false;
        if (pl.frame < 9) {
          pl.sub++;
          if (strike || pl.sub === 2) { pl.frame++; pl.sub = 0; pl.standing = 10; switchTurn = true; }
        } else {
          pl.sub++;
          if (pl.sub === 1) { if (strike) pl.standing = 10; }
          else if (pl.sub === 2) { const r = pl.rolls.slice(-2); if (r[0] === 10 || r[0] + r[1] === 10) pl.standing = 10; else pl.done = true; }
          else pl.done = true;
          if (pl.done) switchTurn = true;
        }
        if (pl.standing === 10) resetPins();
        renderFrames();
        if (P[1].done && P[2].done) { const a = scoreRolls(P[1].rolls).total, b = scoreRolls(P[2].rolls).total; if (a === b) return g.draw(`Tied at ${a}.`); return g.win(a > b ? 1 : 2, `${Math.max(a, b)} – ${Math.min(a, b)}.`); }
        if (switchTurn) turn = P[3 - turn].done ? turn : 3 - turn;
        rollBtn.disabled = false; status();
      }
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1c2238'); UI.rect(ctx, 30, 0, W - 60, H, '#c9a56a'); for (let i = 0; i < 8; i++) UI.rect(ctx, 30 + i * ((W - 60) / 8), 0, 1, H, '#a9855a'); UI.rect(ctx, 0, 0, 30, H, '#222'); UI.rect(ctx, W - 30, 0, 30, H, '#222');
        for (let i = 0; i < 7; i++) UI.circle(ctx, 60 + i * 30, H - 200, 3, '#333');
        pins.forEach((p) => { if (p.up) { UI.circle(ctx, p.x, p.y, 7, '#fff'); UI.circle(ctx, p.x, p.y, 3, '#ff6b6b'); } else UI.circle(ctx, p.x, p.y, 5, '#fff8'); });
        if (ball) UI.circle(ctx, ball.x, ball.y, ball.r, g.color(turn)); else if (!g.over) { const x = W / 2 + aim.x; UI.circle(ctx, x, H - 60, 12, g.color(turn)); ctx.strokeStyle = '#ffffff88'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, H - 72); ctx.quadraticCurveTo(x + aim.spin * 60, H / 2, x + aim.spin * 40, 100); ctx.stroke(); ctx.setLineDash([]); UI.text(ctx, `power ${aim.pow | 0} · spin ${aim.spin.toFixed(1)}`, W / 2, H - 20, { color: '#3b2a14', font: '12px monospace' }); }
      }
    },
  });
})();
