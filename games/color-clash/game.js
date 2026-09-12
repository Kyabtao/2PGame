/* Color Clash — Stroop test: a colour word printed in a different ink; answer the INK colour; first correct scores. */
(function () {
  const C = [['RED', '#ff6b6b'], ['GREEN', '#51cf66'], ['BLUE', '#4dabf7'], ['YELLOW', '#ffd43b']];
  const TARGET = 10;
  Game.init({
    id: 'color-clash',
    rules: ['A colour word flashes up in a mismatched ink colour. Press the button matching the <b>ink colour</b>, not the word!', 'First correct answer scores a point; a wrong answer costs one.', `First to ${TARGET} wins.`],
    controls: { p1: '<kbd>1</kbd> red · <kbd>2</kbd> green · <kbd>3</kbd> blue · <kbd>4</kbd> yellow', p2: '<kbd>7</kbd> red · <kbd>8</kbd> green · <kbd>9</kbd> blue · <kbd>0</kbd> yellow' },
    points: true,
    async onStart(g) {
      const score = { 1: 0, 2: 0 }; let q = null, busy = false, n = 0; const locked = { 1: false, 2: false };
      const word = h('div', { class: 'hugemsg', style: { minHeight: '1.2em', letterSpacing: '.05em' } }); const split = h('div', { class: 'split' }); const msg = h('div', { class: 'muted' });
      g.stage.append(word, msg, split);
      const render = () => { split.innerHTML = ''; for (const p of [1, 2]) { const side = h('div', { class: 'side p' + p, style: { opacity: locked[p] ? 0.4 : 1 } }, h('h3', {}, g.name(p))); const row = h('div', { class: 'row', style: { flexWrap: 'wrap' } }); C.forEach(([name, col], i) => row.appendChild(h('button', { class: 'btn big', style: { background: col, color: '#0009', minWidth: '3.4rem' }, html: `${['1', '2', '3', '4'][i] && p === 1 ? i + 1 : [7, 8, 9, 0][i]}`, title: name, onclick: () => answer(p, i) }))); side.appendChild(row); split.appendChild(side); } g.points(score[1], score[2]); };
      const ask = () => { n++; let w = rnd(4), ink = rnd(4); if (Math.random() < 0.8) while (ink === w) ink = rnd(4); q = { w, ink }; word.textContent = C[w][0]; word.style.color = C[ink][1]; locked[1] = locked[2] = false; busy = false; msg.textContent = `#${n} · name the INK colour`; render(); };
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit7', 'Digit8', 'Digit9', 'Digit0'], (c) => { const d = +c.slice(-1); if (d >= 1 && d <= 4) answer(1, d - 1); else answer(2, [7, 8, 9, 0].indexOf(d)); });
      async function answer(p, i) {
        if (busy || g.over || !q || locked[p]) return;
        if (i !== q.ink) { score[p] = Math.max(0, score[p] - 1); locked[p] = true; g.sfx('bad'); render(); msg.textContent = `${g.name(p)} wrong (−1)`; if (locked[1] && locked[2]) { busy = true; await sleep(700); if (g.over) return; ask(); } return; }
        busy = true; score[p]++; g.sfx('score'); render(); msg.innerHTML = `<span class="pc${p}">${esc(g.name(p))}</span> +1`; word.textContent = '✓';
        if (score[p] >= TARGET) return g.win(p, `${score[p]} – ${score[3 - p]}.`);
        await sleep(600); if (g.over) return; word.textContent = ''; await sleep(rndf(300, 900)); if (g.over) return; ask();
      }
      render(); await g.countdown(3); ask();
    },
  });
})();
