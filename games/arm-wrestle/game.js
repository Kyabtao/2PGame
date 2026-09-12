/* Arm Wrestle — mash to pull; power surge windows double your presses. */
(function () {
  Game.init({
    id: 'arm-wrestle',
    rules: ['Mash your key as fast as you can to pull the arm to your side.', 'Watch for ⚡ <b>POWER</b> moments: presses during a surge count triple — but mashing during your rival\'s surge does nothing.', 'Pull the meter all the way to your side to win. Best of 3 pulls.'],
    controls: { p1: '<kbd>Q</kbd> (mash)', p2: '<kbd>P</kbd> (mash)' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyQ', label: 'PULL!', huge: true }] }, { side: 2, buttons: [{ code: 'KeyP', label: 'PULL!', huge: true }] }],
    async onStart(g) {
      const wins = { 1: 0, 2: 0 }; let pos = 0, surge = 0, surgeT = 0, nextSurge = rndf(2, 4), live = false;
      const arena = h('div', { class: 'panel col', style: { width: 'min(640px, 100%)' } });
      const arm = h('div', { style: { fontSize: '4rem', transition: 'transform .1s' } }, '💪');
      const meter = h('div', { class: 'meter', style: { background: 'linear-gradient(90deg, var(--p1), #444 50%, var(--p2))', height: '28px' } }, h('i', { style: { width: '6px', background: '#fff', left: '50%' } }));
      const surgeEl = h('div', { class: 'bigmsg', style: { minHeight: '2.4rem' } });
      const pulls = h('div', { class: 'row' }, h('span', { class: 'tag pc1' }, `${g.name(1)}: 0`), h('span', { class: 'tag pc2' }, `${g.name(2)}: 0`));
      arena.append(arm, meter, surgeEl, pulls);
      g.stage.appendChild(arena);
      g.key(['KeyQ', 'KeyP'], (code) => { if (!live) return; const p = code === 'KeyQ' ? 1 : 2; if (surge && surge !== p) return; const amt = (surge === p ? 3 : 1) * 2.2; pos += p === 1 ? -amt : amt; g.sfx('tick'); });
      const startPull = async () => { pos = 0; surge = 0; surgeT = 0; nextSurge = rndf(2, 4); render(); await g.countdown(3, 'Grip…'); live = true; };
      const render = () => { meter.firstChild.style.left = `calc(50% + ${pos / 2}%)`; arm.style.transform = `rotate(${pos * 0.4}deg)`; surgeEl.innerHTML = surge ? `⚡ <span class="pc${surge}">${esc(g.name(surge))}</span> POWER!` : ''; surgeEl.style.color = surge ? g.color(surge) : ''; };
      await startPull();
      g.loop((dt) => {
        if (!live) return;
        pos *= Math.pow(0.85, dt);
        if (surge) { surgeT -= dt; if (surgeT <= 0) { surge = 0; nextSurge = rndf(2, 4); } }
        else { nextSurge -= dt; if (nextSurge <= 0) { surge = 1 + rnd(2); surgeT = 1.2; g.sfx('go'); } }
        render();
        if (Math.abs(pos) >= 100) {
          live = false; const w = pos < 0 ? 1 : 2; wins[w]++; g.points(wins[1], wins[2]); g.sfx('score'); pulls.children[0].textContent = `${g.name(1)}: ${wins[1]}`; pulls.children[1].textContent = `${g.name(2)}: ${wins[2]}`;
          if (wins[w] >= 2) return g.win(w, `Won ${wins[w]} pulls to ${wins[3 - w]}.`);
          g.toast(`${esc(g.name(w))} wins the pull!`, 1200); g.after(1300, startPull);
        }
      });
    },
  });
})();
