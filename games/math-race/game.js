/* Math Race — same arithmetic problem for both; four answer choices per side; first correct scores. */
(function () {
  const TARGET = 10;
  Game.init({
    id: 'math-race',
    rules: ['Both players see the same problem with four answer choices. Hit the correct answer first to score a point.', 'A wrong answer locks you out for that problem. Problems get harder as the score climbs.', `First to ${TARGET} points wins.`],
    controls: { p1: '<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> for choices A–D', p2: '<kbd>7</kbd> <kbd>8</kbd> <kbd>9</kbd> <kbd>0</kbd> for choices A–D' },
    points: true,
    async onStart(g) {
      const score = { 1: 0, 2: 0 }; let q = null, locked = { 1: false, 2: false }, busy = false, count = 0;
      const prob = h('div', { class: 'hugemsg', style: { fontSize: 'clamp(1.8rem, 7vw, 3.4rem)' } }); const split = h('div', { class: 'split' }); const msg = h('div', { class: 'muted' });
      g.stage.append(prob, msg, split);
      const gen = () => {
        const lvl = Math.floor((score[1] + score[2]) / 4); const op = pick(lvl > 0 ? ['+', '−', '×', '÷'] : ['+', '−', '×']);
        let a, b, ans;
        if (op === '+') { a = rnd(5 + lvl * 15, 30 + lvl * 40); b = rnd(5, 30 + lvl * 40); ans = a + b; }
        else if (op === '−') { a = rnd(20 + lvl * 20, 60 + lvl * 50); b = rnd(1, a - 1); ans = a - b; }
        else if (op === '×') { a = rnd(2, 6 + lvl * 4); b = rnd(2, 9 + lvl * 2); ans = a * b; }
        else { b = rnd(2, 9 + lvl); ans = rnd(2, 12 + lvl * 3); a = b * ans; }
        const set = new Set([ans]); while (set.size < 4) { const d = ans + pick([-10, -3, -2, -1, 1, 2, 3, 10, rnd(-20, 20)]); if (d >= 0 && d !== ans) set.add(d); }
        return { text: `${a} ${op} ${b} = ?`, ans, choices: shuffle([...set]) };
      };
      const render = () => {
        split.innerHTML = '';
        for (const p of [1, 2]) {
          const side = h('div', { class: 'side p' + p, style: { opacity: locked[p] ? 0.4 : 1 } }, h('h3', {}, g.name(p) + (locked[p] ? ' 🔒' : '')));
          const grid = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' } });
          q.choices.forEach((c, i) => grid.appendChild(h('button', { class: 'btn big', html: `${c}<br><small class="muted">${p === 1 ? i + 1 : [7, 8, 9, 0][i]}</small>`, onclick: () => answer(p, i) })));
          side.appendChild(grid); split.appendChild(side);
        }
        prob.textContent = q.text; g.points(score[1], score[2]); g.status(`Problem ${count} · first to ${TARGET}`);
      };
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit7', 'Digit8', 'Digit9', 'Digit0'], (c) => { const d = +c.slice(-1); if (d >= 1 && d <= 4) answer(1, d - 1); else answer(2, [7, 8, 9, 0].indexOf(d)); });
      async function answer(p, i) {
        if (busy || g.over || locked[p] || !q) return;
        if (q.choices[i] !== q.ans) { locked[p] = true; g.sfx('bad'); render(); msg.textContent = `${g.name(p)} locked out!`; if (locked[1] && locked[2]) { busy = true; msg.textContent = `Both wrong — it was ${q.ans}.`; await sleep(1200); if (g.over) return; return next(); } return; }
        busy = true; score[p]++; g.sfx('score'); render(); msg.innerHTML = `<span class="pc${p}">${esc(g.name(p))}</span> got it: ${q.ans}`;
        if (score[p] >= TARGET) return g.win(p, `${score[p]} – ${score[3 - p]}.`);
        await sleep(900); if (g.over) return; next();
      }
      function next() { q = gen(); count++; locked = { 1: false, 2: false }; busy = false; msg.textContent = ''; render(); }
      await g.countdown(3); next();
    },
  });
})();
