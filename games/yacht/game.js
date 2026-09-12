/* Yacht — 5 dice, 3 rolls, 13 categories, upper bonus. */
(function () {
  let starter = 1;
  const CATS = [
    ['ones', 'Ones', (d) => sum(d.filter((x) => x === 1))], ['twos', 'Twos', (d) => sum(d.filter((x) => x === 2))], ['threes', 'Threes', (d) => sum(d.filter((x) => x === 3))],
    ['fours', 'Fours', (d) => sum(d.filter((x) => x === 4))], ['fives', 'Fives', (d) => sum(d.filter((x) => x === 5))], ['sixes', 'Sixes', (d) => sum(d.filter((x) => x === 6))],
    ['3k', 'Three of a kind', (d) => maxCount(d) >= 3 ? sum(d) : 0], ['4k', 'Four of a kind', (d) => maxCount(d) >= 4 ? sum(d) : 0],
    ['fh', 'Full house', (d) => { const c = counts(d); return c.includes(3) && c.includes(2) ? 25 : 0; }],
    ['ss', 'Small straight', (d) => hasRun(d, 4) ? 30 : 0], ['ls', 'Large straight', (d) => hasRun(d, 5) ? 40 : 0],
    ['yacht', 'Yacht', (d) => maxCount(d) === 5 ? 50 : 0], ['chance', 'Chance', (d) => sum(d)],
  ];
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const counts = (d) => { const c = [0, 0, 0, 0, 0, 0, 0]; d.forEach((x) => c[x]++); return c; };
  const maxCount = (d) => Math.max(...counts(d));
  const hasRun = (d, n) => { const s = new Set(d); for (let st = 1; st + n - 1 <= 6; st++) if (range(n).every((i) => s.has(st + i))) return true; return false; };
  Game.init({
    id: 'yacht',
    rules: ['Roll five dice up to three times per turn, clicking dice to hold them between rolls.', 'Then score the roll in one of 13 categories — each can be used once. Scoring 63+ in the upper section (Ones–Sixes) earns a 35-point bonus.', 'After 13 turns each, the highest total wins.'],
    controls: { all: '<kbd>Space</kbd> roll · click dice to hold · click a category to score' },
    points: true,
    onStart(g) {
      const sheet = { 1: {}, 2: {} }; let turn = starter, dice = [1, 2, 3, 4, 5], held = [false, false, false, false, false], rolls = 0, busy = false;
      const diceRow = h('div', { class: 'dice' }); const dieEls = range(5).map((i) => { const el = UI.die(dice[i], { onClick: () => { if (rolls === 0 || busy || g.over) return; held[i] = !held[i]; el.classList.toggle('held', held[i]); g.sfx('click'); } }); diceRow.appendChild(el); return el; });
      const rollBtn = h('button', { class: 'btn primary big', text: '🎲 Roll (Space)', onclick: roll });
      const table = h('table', { class: 'sheet', style: { borderCollapse: 'collapse', fontSize: '.9rem', width: 'min(520px,100%)' } });
      g.stage.append(diceRow, h('div', { class: 'row' }, rollBtn, h('span', { class: 'tag', id: 'rolls' }, 'Rolls left: 3')), table);
      const upper = (p) => sum(CATS.slice(0, 6).map(([k]) => sheet[p][k] || 0));
      const total = (p) => sum(Object.values(sheet[p])) + (upper(p) >= 63 ? 35 : 0);
      const render = () => {
        const can = rolls > 0 && !busy;
        table.innerHTML = `<tr><th style="text-align:left">Category</th><th class="pc1">${esc(g.name(1))}</th><th class="pc2">${esc(g.name(2))}</th></tr>` +
          CATS.map(([k, label, fn], idx) => `<tr data-k="${k}" style="border-top:1px solid var(--border)${idx === 6 ? ';border-top:2px solid var(--muted)' : ''}"><td style="padding:.25rem .4rem">${label}</td>` + [1, 2].map((p) => { const used = k in sheet[p]; const me = p === turn && can && !used; return `<td style="text-align:center;padding:.25rem;${me ? 'cursor:pointer;color:var(--gold);font-weight:700' : ''}" ${me ? `class="opt" data-p="${p}" data-k="${k}"` : ''}>${used ? sheet[p][k] : me ? fn(dice) : ''}</td>`; }).join('') + '</tr>').join('') +
          `<tr style="border-top:1px solid var(--border)"><td class="muted" style="padding:.25rem .4rem">Upper bonus (63+)</td><td style="text-align:center">${upper(1)}/63 ${upper(1) >= 63 ? '+35' : ''}</td><td style="text-align:center">${upper(2)}/63 ${upper(2) >= 63 ? '+35' : ''}</td></tr>` +
          `<tr style="border-top:2px solid var(--muted);font-weight:800"><td style="padding:.3rem .4rem">Total</td><td style="text-align:center">${total(1)}</td><td style="text-align:center">${total(2)}</td></tr>`;
        table.querySelectorAll('td.opt').forEach((td) => td.addEventListener('click', () => score(+td.dataset.p, td.dataset.k)));
        table.querySelector('tr').style.color = '';
        document.getElementById('rolls').textContent = `Rolls left: ${3 - rolls}`; rollBtn.disabled = rolls >= 3; rollBtn.className = 'btn big primary p' + turn;
        g.points(total(1), total(2)); g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> · ${rolls ? (rolls < 3 ? 'roll again or score' : 'pick a category') : 'roll the dice'}`);
      };
      g.key('Space', roll);
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'], (c) => { const i = +c.slice(-1) - 1; dieEls[i].click(); });
      async function roll() {
        if (busy || g.over || rolls >= 3) return; busy = true; g.sfx('move');
        for (let k = 0; k < 6; k++) { dice.forEach((_, i) => { if (!held[i]) UI.setDie(dieEls[i], rnd(1, 6)); }); await sleep(50); }
        dice = dice.map((v, i) => held[i] ? v : rnd(1, 6)); dice.forEach((v, i) => UI.setDie(dieEls[i], v)); rolls++; busy = false; render();
      }
      function score(p, k) {
        if (busy || g.over || p !== turn || rolls === 0 || k in sheet[p]) return;
        sheet[p][k] = CATS.find((c) => c[0] === k)[2](dice); g.sfx(sheet[p][k] ? 'score' : 'bad');
        if (Object.keys(sheet[1]).length === 13 && Object.keys(sheet[2]).length === 13) { render(); starter = 3 - starter; const a = total(1), b = total(2); if (a === b) return g.draw(`Tied at ${a}.`); return g.win(a > b ? 1 : 2, `${Math.max(a, b)} – ${Math.min(a, b)}.`); }
        turn = 3 - turn; rolls = 0; held = held.map(() => false); dieEls.forEach((el) => el.classList.remove('held')); render();
      }
      render();
    },
  });
})();
