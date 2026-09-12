/* Quick Draw — wait for DRAW!, first to press wins; early press loses the duel. Best of 5. */
(function () {
  Game.init({
    id: 'quick-draw',
    rules: ['Two gunslingers face off. Wait for the <b>DRAW!</b> signal, then press your key as fast as you can.', 'Press before the signal and you lose that duel. Fastest press after the signal wins.', 'First to 3 duels wins. Fake-out signals ("Wait…") may appear!'],
    controls: { p1: '<kbd>Q</kbd>', p2: '<kbd>P</kbd>' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyQ', label: 'DRAW', huge: true }] }, { side: 2, buttons: [{ code: 'KeyP', label: 'DRAW', huge: true }] }],
    onStart(g) {
      const score = { 1: 0, 2: 0 }; let phase = 'idle', t0 = 0;
      const scene = h('div', { class: 'panel col', style: { width: 'min(640px,100%)', minHeight: '260px', justifyContent: 'center', background: 'linear-gradient(#f7c66a, #d9863a)' } });
      const men = h('div', { class: 'spread', style: { fontSize: '4rem', padding: '0 2rem' } }, h('span', { style: { transform: 'scaleX(-1)', display: 'inline-block' } }, '🤠'), h('span', {}, '🤠'));
      const sign = h('div', { class: 'hugemsg', style: { color: '#3b1f0a', minHeight: '1.2em' } }, '…');
      const info = h('div', { style: { color: '#3b1f0a', fontWeight: 600 } });
      scene.append(men, sign, info); g.stage.appendChild(scene);
      g.key(['KeyQ', 'KeyP'], (code) => {
        const p = code === 'KeyQ' ? 1 : 2; if (g.over) return;
        if (phase === 'wait') { phase = 'idle'; sign.textContent = 'Too early!'; sign.style.color = g.color(p); g.sfx('bad'); point(3 - p, `${esc(g.name(p))} drew too early`); }
        else if (phase === 'draw') { phase = 'idle'; const ms = Math.round(performance.now() - t0); sign.textContent = `${ms} ms`; sign.style.color = g.color(p); g.sfx('hit'); men.children[p === 1 ? 1 : 0].textContent = '💀'; const pb = g.best('reaction', ms, p, true); point(p, `${esc(g.name(p))} fired in ${ms} ms${pb ? ' — new record!' : ''}`); }
      });
      function point(p, why) { score[p]++; g.points(score[1], score[2]); info.innerHTML = why; if (score[p] >= 3) return g.after(900, () => g.win(p, `${score[1]} – ${score[2]} duels. ${why}.`)); g.after(1800, duel); }
      function duel() {
        if (g.over) return; phase = 'wait'; men.children[0].textContent = '🤠'; men.children[1].textContent = '🤠'; sign.style.color = '#3b1f0a'; sign.textContent = 'Wait…'; info.textContent = `Duel ${score[1] + score[2] + 1}`; g.status(`Duel ${score[1] + score[2] + 1}`);
        const fake = Math.random() < 0.25;
        g.after(rndf(1500, 4500), () => { if (phase !== 'wait') return; if (fake) { sign.textContent = 'Steady…'; g.sfx('tick'); g.after(rndf(800, 2000), () => { if (phase !== 'wait') return; fire(); }); } else fire(); });
      }
      function fire() { phase = 'draw'; t0 = performance.now(); sign.textContent = 'DRAW!'; sign.style.color = '#c92a2a'; g.sfx('go'); }
      const best = g.getBest('reaction'); if (best) info.textContent = `Record: ${best.v} ms by ${g.name(best.p)}`;
      g.after(1200, duel);
    },
  });
})();
