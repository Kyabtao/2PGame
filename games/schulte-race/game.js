/* Schulte Race — identical shuffled 5×5 number grids; tap 1→25 in order; fastest wins. */
(function () {
  Game.init({
    id: 'schulte-race',
    rules: ['Both players get the same shuffled 5×5 grid of numbers 1–25. Tap the numbers in order, 1 → 25, as fast as you can.', 'A wrong tap adds a 1-second penalty.', 'First to reach 25 wins the round; best of 3.'],
    controls: { all: 'Tap / click your grid' },
    points: true,
    onStart(g) {
      const N = 5; const score = { 1: 0, 2: 0 }; let round = 0, live = false, t0 = 0, P = {};
      const split = h('div', { class: 'split' }); const timer = h('div', { class: 'bigmsg' }, '0.0s'); g.stage.append(timer, split);
      const size = Math.floor(clamp((Math.min(window.innerWidth, 720) / 2 - 40) / N, 34, 66));
      const build = () => {
        split.innerHTML = ''; const nums = shuffle(range(N * N).map((i) => i + 1)); P = {};
        for (const p of [1, 2]) {
          const grid = UI.grid({ rows: N, cols: N, size, gap: 4, onClick: (r, c, cell) => tap(p, r * N + c, cell) }); const label = h('div', { class: 'muted' }, `${g.name(p)} · next: 1`);
          grid.each((cell, r, c) => { cell.textContent = nums[r * N + c]; cell.style.fontWeight = 800; cell.style.fontSize = 'calc(var(--cell) * .42)'; cell.style.background = 'var(--surface2)'; });
          split.appendChild(h('div', { class: 'side p' + p }, label, grid.el)); P[p] = { grid, label, nums, next: 1, penalty: 0 };
        }
      };
      function tap(p, i, cell) {
        if (!live || g.over) return; const st = P[p];
        if (st.nums[i] !== st.next) { st.penalty += 1; g.sfx('bad'); cell.classList.add('shake'); setTimeout(() => cell.classList.remove('shake'), 300); st.label.textContent = `${g.name(p)} · next: ${st.next} · +${st.penalty}s penalty`; return; }
        cell.style.background = `color-mix(in srgb, ${g.color(p)} 45%, var(--surface2))`; cell.classList.add('static'); st.next++; g.sfx('tick'); st.label.textContent = `${g.name(p)} · next: ${st.next}${st.penalty ? ` · +${st.penalty}s` : ''}`;
        if (st.next > N * N) { st.time = (performance.now() - t0) / 1000 + st.penalty; st.label.textContent = `${g.name(p)} · ${st.time.toFixed(1)}s`; const o = 3 - p; if (P[o].time == null) { live = false; g.sfx('win'); score[p]++; g.points(score[1], score[2]); const pb = g.best('time', st.time, p, true); if (score[p] >= 2) return g.win(p, `${score[p]} – ${score[3 - p]} rounds; last grid in ${st.time.toFixed(1)}s${pb ? ' — new record!' : ''}.`); g.toast(`${g.name(p)} wins the grid in ${st.time.toFixed(1)}s!`, 1500); g.after(1800, start); } }
      }
      async function start() { if (g.over) return; round++; live = false; build(); g.status(`Grid ${round} · best of 3`); await g.countdown(3); live = true; t0 = performance.now(); g.every(100, () => { if (live) timer.textContent = ((performance.now() - t0) / 1000).toFixed(1) + 's'; }); }
      g.points(0, 0); start();
    },
  });
})();
