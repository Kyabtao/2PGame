/* Cannon Duel — artillery over random hills with wind; 3 health each. */
(function () {
  const W = 800, H = 480;
  Game.init({
    id: 'cannon-duel',
    rules: ['Take turns firing over the hills. Adjust angle and power, then fire. Wind (shown at the top) pushes the shell.', 'A direct hit removes one health; near misses splash and crater the ground. Each cannon has 3 health.', 'Terrain and wind change every round.'],
    controls: { all: 'Adjust with the sliders or keys: <kbd>←</kbd>/<kbd>→</kbd> angle · <kbd>↑</kbd>/<kbd>↓</kbd> power · <kbd>Space</kbd> fire' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, labels: { up: 'Pwr+', down: 'Pwr−', left: 'Ang', right: 'Ang' } }, { side: 2, buttons: [{ code: 'Space', label: 'FIRE', huge: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H); g.stage.appendChild(canvas);
      const ground = new Float32Array(W + 1); { let y = rndf(300, 360); const a = rndf(40, 90), b = rndf(20, 50); for (let x = 0; x <= W; x++) ground[x] = clamp(y + Math.sin(x / 110) * a + Math.sin(x / 37 + 2) * b + Math.sin(x / 13) * 6, 180, H - 30); }
      const can = { 1: { x: 70, hp: 3, ang: 45, pow: 60 }, 2: { x: W - 70, hp: 3, ang: 135, pow: 60 } };
      let turn = 1 + rnd(2), wind = rndf(-40, 40), shell = null, particles = [];
      const angEl = h('input', { type: 'range', min: 0, max: 180, value: 45, style: { width: '160px' } }), powEl = h('input', { type: 'range', min: 20, max: 100, value: 60, style: { width: '160px' } });
      const angLbl = h('span', { class: 'tag' }), powLbl = h('span', { class: 'tag' });
      const fireBtn = h('button', { class: 'btn primary', text: '🔥 Fire (Space)', onclick: fire });
      g.stage.appendChild(h('div', { class: 'row' }, h('label', { class: 'row' }, 'Angle ', angEl, angLbl), h('label', { class: 'row' }, 'Power ', powEl, powLbl), fireBtn));
      angEl.addEventListener('input', () => { can[turn].ang = +angEl.value; sync(); }); powEl.addEventListener('input', () => { can[turn].pow = +powEl.value; sync(); });
      g.key(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], (code) => { if (shell) return; const c = can[turn]; if (code === 'ArrowLeft') c.ang = clamp(c.ang + 2, 0, 180); if (code === 'ArrowRight') c.ang = clamp(c.ang - 2, 0, 180); if (code === 'ArrowUp') c.pow = clamp(c.pow + 2, 20, 100); if (code === 'ArrowDown') c.pow = clamp(c.pow - 2, 20, 100); sync(); }, { repeat: true });
      g.key('Space', fire);
      function sync() { const c = can[turn]; angEl.value = c.ang; powEl.value = c.pow; angLbl.textContent = c.ang + '°'; powLbl.textContent = c.pow; draw(); }
      function fire() { if (g.over || shell) return; const c = can[turn]; const a = c.ang * Math.PI / 180; shell = { x: c.x + Math.cos(a) * 24, y: ground[c.x | 0] - 14 - Math.sin(a) * 24, vx: Math.cos(a) * c.pow * 9, vy: -Math.sin(a) * c.pow * 9, trail: [] }; fireBtn.disabled = true; g.sfx('hit'); }
      g.points(can[1].hp, can[2].hp); g.turn(turn); sync();
      g.loop((dt) => {
        particles.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; q.life -= dt; }); particles = particles.filter((q) => q.life > 0);
        if (shell) {
          for (let k = 0; k < 3; k++) {
            const s = dt / 3; shell.vy += 500 * s; shell.vx += wind * 0.6 * s; shell.x += shell.vx * s; shell.y += shell.vy * s;
            if (shell.trail.length < 400) shell.trail.push([shell.x, shell.y]);
            const gx = Math.round(shell.x);
            const hitP = [1, 2].find((p) => dist(shell.x, shell.y, can[p].x, ground[can[p].x | 0] - 12) < 20);
            if (hitP || (gx >= 0 && gx <= W && shell.y >= ground[gx]) || shell.y > H) { explode(shell.x, Math.min(shell.y, gx >= 0 && gx <= W ? ground[gx] : H), hitP); shell = null; break; }
            if (shell.x < -300 || shell.x > W + 300) { shell = null; endTurn('The shell flew away.'); break; }
          }
        }
        draw();
      });
      function explode(x, y, hitP) {
        g.sfx('explode');
        for (let i = 0; i < 30; i++) { const a = Math.random() * Math.PI * 2, v = rndf(50, 300); particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, life: rndf(.3, .9) }); }
        for (let gx = Math.max(0, x - 30 | 0); gx <= Math.min(W, x + 30 | 0); gx++) { const d = Math.sqrt(Math.max(0, 30 * 30 - (gx - x) ** 2)); if (ground[gx] < y + d) ground[gx] = Math.min(H - 20, Math.max(ground[gx], y + d)); }
        let hp = hitP || [1, 2].find((p) => dist(x, y, can[p].x, ground[can[p].x | 0] - 12) < 34);
        if (hp) { can[hp].hp--; g.points(can[1].hp, can[2].hp); if (can[hp].hp <= 0) { draw(); return g.win(3 - hp, `${esc(g.name(3 - hp))} destroyed the enemy cannon.`); } return endTurn(`Direct hit on ${esc(g.name(hp))}!`); }
        endTurn('Miss!');
      }
      function endTurn(msg) { if (g.over) return; turn = 3 - turn; wind = clamp(wind + rndf(-15, 15), -60, 60); fireBtn.disabled = false; g.turn(turn, `${msg} <span class="pc${turn}">${esc(g.name(turn))}</span> to fire`); sync(); }
      function draw() {
        UI.rect(ctx, 0, 0, W, H, '#1a2340'); UI.circle(ctx, 680, 70, 26, '#fff3b0');
        ctx.fillStyle = '#3f6b3a'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x++) ctx.lineTo(x, ground[x]); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        for (const p of [1, 2]) { const c = can[p]; const y = ground[c.x | 0] - 12; const a = c.ang * Math.PI / 180; ctx.save(); ctx.translate(c.x, y); ctx.rotate(-a); UI.roundRect(ctx, 0, -5, 28, 10, 3, '#333'); ctx.restore(); UI.circle(ctx, c.x, y, 14, g.color(p)); UI.rect(ctx, c.x - 14, y - 30, 28, 5, '#0006'); UI.rect(ctx, c.x - 14, y - 30, 28 * c.hp / 3, 5, '#51cf66'); if (p === turn && !shell) UI.text(ctx, '▼', c.x, y - 44, { color: '#fff' }); }
        if (shell) { shell.trail.forEach(([x, y]) => UI.circle(ctx, x, y, 1.5, '#ffffff66')); UI.circle(ctx, shell.x, shell.y, 5, '#ffd43b'); }
        particles.forEach((q) => UI.circle(ctx, q.x, q.y, 3, '#ffa94d'));
        UI.text(ctx, `wind ${wind < 0 ? '◀' : '▶'} ${Math.abs(wind).toFixed(0)}`, W / 2, 20, { color: '#fff', font: 'bold 16px monospace' });
      }
    },
  });
})();
