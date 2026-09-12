/* Reaction Race — 7 rounds of "red → green"; fastest wins the round; early press forfeits the round. */
(function () {
  const ROUNDS = 7;
  Game.init({
    id: 'reaction-race',
    rules: ['The screen turns red, then — after a random delay — green. Press your key the instant it turns green.', 'The faster press wins the round; pressing on red forfeits it. Seven rounds; most rounds won takes it.', 'Your average reaction time is shown at the end and best times are saved.'],
    controls: { p1: '<kbd>Q</kbd> / tap left', p2: '<kbd>P</kbd> / tap right' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyQ', label: 'TAP', huge: true }] }, { side: 2, buttons: [{ code: 'KeyP', label: 'TAP', huge: true }] }],
    onStart(g) {
      const score = { 1: 0, 2: 0 }; const times = { 1: [], 2: [] }; let round = 0, phase = 'idle', t0 = 0, pressed = {};
      const box = h('div', { class: 'panel col', style: { width: 'min(640px,100%)', minHeight: '260px', justifyContent: 'center', transition: 'background .1s', background: '#333' } });
      const big = h('div', { class: 'hugemsg' }, 'Get ready'); const sub = h('div', { class: 'row', style: { gap: '2rem', fontSize: '1.1rem', fontWeight: 700 } }, h('span', { class: 'pc1' }, ''), h('span', { class: 'pc2' }, ''));
      box.append(big, sub); g.stage.appendChild(box);
      box.addEventListener('pointerdown', (e) => { const r = box.getBoundingClientRect(); press(e.clientX - r.left < r.width / 2 ? 1 : 2); });
      g.key(['KeyQ', 'KeyP'], (code) => press(code === 'KeyQ' ? 1 : 2));
      function press(p) {
        if (g.over || pressed[p]) return;
        if (phase === 'red') { pressed[p] = 'early'; sub.children[p - 1].textContent = 'Too early!'; g.sfx('bad'); if (pressed[3 - p]) return settle(); if (!pressed[3 - p]) { /* other may still win */ } }
        else if (phase === 'green') { const ms = Math.round(performance.now() - t0); pressed[p] = ms; times[p].push(ms); sub.children[p - 1].textContent = `${ms} ms`; g.sfx('tick'); g.best('reaction', ms, p, true); if (pressed[3 - p] || pressed[3 - p] === 'early') return settle(); g.after(1200, () => { if (phase === 'green') settle(); }); }
      }
      function settle() {
        if (phase === 'idle') return; phase = 'idle';
        const a = pressed[1], b = pressed[2]; let w = 0;
        if (typeof a === 'number' && typeof b === 'number') w = a < b ? 1 : b < a ? 2 : 0; else if (typeof a === 'number') w = 1; else if (typeof b === 'number') w = 2; else if (a === 'early' && !b) w = 2; else if (b === 'early' && !a) w = 1;
        if (w) { score[w]++; g.points(score[1], score[2]); big.textContent = `${g.name(w)} takes it`; big.style.color = g.color(w); } else { big.textContent = 'No winner'; big.style.color = '#fff'; }
        box.style.background = '#333';
        if (round >= ROUNDS || score[1] > ROUNDS / 2 || score[2] > ROUNDS / 2) {
          const avg = (p) => times[p].length ? Math.round(times[p].reduce((x, y) => x + y, 0) / times[p].length) + ' ms' : '—';
          const extra = `<p class="muted">Average: <span class="pc1">${avg(1)}</span> · <span class="pc2">${avg(2)}</span></p>`;
          return g.after(900, () => { if (score[1] === score[2]) return g.draw(`${score[1]} rounds each.`, extra); g.win(score[1] > score[2] ? 1 : 2, `${Math.max(score[1], score[2])} – ${Math.min(score[1], score[2])} rounds.`, extra); });
        }
        g.after(1500, next);
      }
      function next() {
        if (g.over) return; round++; pressed = {}; phase = 'red'; box.style.background = '#c92a2a'; big.textContent = `Round ${round}`; big.style.color = '#fff'; sub.children[0].textContent = '…'; sub.children[1].textContent = '…'; g.status(`Round ${round} of ${ROUNDS}`);
        g.after(rndf(1200, 4000), () => { if (phase !== 'red' || g.over) return; phase = 'green'; t0 = performance.now(); box.style.background = '#2b8a3e'; big.textContent = 'GO!'; g.sfx('go'); g.after(2500, () => { if (phase === 'green') { sub.children[0].textContent = pressed[1] ? sub.children[0].textContent : 'Missed'; sub.children[1].textContent = pressed[2] ? sub.children[1].textContent : 'Missed'; settle(); } }); });
      }
      g.after(1000, next);
    },
  });
})();
