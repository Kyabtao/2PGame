/* Balut — five dice, three rolls, six categories. A compact version of the Gulf classic. */
(function () {
  const ROUNDS = 6;
  const CAT = [
    { name: 'Balut', hint: 'five alike', val: 40, kind: 'balut' },
    { name: 'Straight', hint: '1-2-3-4-5', val: 30, kind: 'straight' },
    { name: 'Full', hint: 'three + a pair', val: 20, kind: 'full' },
    { name: 'Tens', hint: 'sum of dice', val: 0, kind: 'sum' },
    { name: 'Fours', hint: 'each 4 rolled', val: 0, kind: 'fours' },
    { name: 'Sixes', hint: 'each 6 rolled', val: 0, kind: 'sixes' },
  ];
  let starter = 1;
  Game.init({
    id: 'balut',
    rules: [
      'Each turn: up to three rolls of five dice, keeping dice to one side as you go.',
      'Then write the result into ONE empty category — a Balut (five alike) is 40, a straight 30, a full house 20, and Tens counts the pips.',
      'Fours and Sixes pay 4 and 6 for every such die you have kept. A zero is a perfectly legal answer.',
      `Six turns each, one category per turn, and the highest card wins the game.`,
    ],
    controls: { all: 'Tap dice to hold them · <kbd>Space</kbd> rolls · tap a category to write it in' },
    points: true,
    onStart(g) {
      const dice = [1, 2, 3, 4, 5];
      const keep = [false, false, false, false, false];
      const sheet = { 1: {}, 2: {} };
      let turn = starter, rolls = 0, round = 0;
      const wrap = h('div', { class: 'col', style: { width: 'min(430px, 95vw)' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      const diceRow = h('div', { class: 'dice' });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll' });
      const tbl = h('div', { class: 'panel', style: { width: '100%' } });
      wrap.append(info, diceRow, rollBtn, tbl);
      const val = (dv, k) => {
        const c = [1, 2, 3, 4, 5, 6].map((v) => dv.filter((d) => d === v).length);
        const mx = Math.max(...c);
        switch (k) {
          case 'balut': return mx === 5 ? 40 : 0;
          case 'straight': { const s = new Set(dv); return [1, 2, 3, 4, 5].every((n) => s.has(n)) || [2, 3, 4, 5, 6].every((n) => s.has(n)) ? 30 : 0; }
          case 'full': return (mx === 3 && c.includes(2)) || mx === 5 ? 20 : 0;
          case 'sum': return dv.reduce((a, b) => a + b, 0);
          case 'fours': return c[3] * 4;
          case 'sixes': return c[5] * 6;
        }
        return 0;
      };
      const total = (p) => CAT.reduce((a, q) => a + (sheet[p][q.name] || 0), 0);
      function draw() {
        info.innerHTML = `round ${Math.min(ROUNDS, round + 1)}/${ROUNDS} · <b class="pc${turn}">${esc(g.name(turn))}</b> · ${rolls}/3 rolls — tap a category to write it in`;
        diceRow.innerHTML = '';
        dice.forEach((v, i) => diceRow.appendChild(UI.die(v, { cls: (keep[i] ? 'held p' + turn : ''), onClick: () => { if (rolls > 0 && rolls < 3) { keep[i] = !keep[i]; g.sfx('click'); draw(); } } })));
        rollBtn.disabled = rolls >= 3;
        rollBtn.textContent = rolls === 0 ? '🎲 Throw' : `🎲 Reroll ${5 - keep.filter(Boolean).length}`;
        tbl.innerHTML = '';
        tbl.appendChild(h('div', { class: 'spread', style: { fontWeight: 800 } }, h('span', { text: 'Category' }), h('span', { class: 'pc1', text: g.name(1) }), h('span', { class: 'pc2', text: g.name(2) })));
        CAT.forEach((q) => {
          const mine = rolls > 0 ? val(dice, q.kind) : null;
          const row = h('div', { class: 'spread', style: { padding: '.2rem 0', borderBottom: '1px dashed var(--line)' } },
            h('span', { html: `${q.name} <span class="muted" style="font-size:.78rem">${q.hint}</span>` }),
            h('span', { class: 'tag', text: sheet[1][q.name] == null ? (turn === 1 && mine != null ? `write ${mine}` : '—') : String(sheet[1][q.name]) }),
            h('span', { class: 'tag', text: sheet[2][q.name] == null ? (turn === 2 && mine != null ? `write ${mine}` : '—') : String(sheet[2][q.name]) }));
          if (mine != null && sheet[turn][q.name] == null) { row.classList.add('clickable'); row.onclick = () => write(q, mine); }
          tbl.appendChild(row);
        });
        tbl.appendChild(h('div', { class: 'spread', style: { fontWeight: 800, marginTop: '.3rem' } }, h('span', { text: 'Card' }), h('span', { class: 'pc1', text: String(total(1)) }), h('span', { class: 'pc2', text: String(total(2)) })));
        g.points(total(1), total(2));
      }
      function roll() {
        if (rolls >= 3 || g.over) return;
        for (let i = 0; i < 5; i++) if (!keep[i]) dice[i] = rnd(1, 6);
        rolls++; g.sfx('tick');
        if (val(dice, 'balut') === 40) { g.sfx('coin'); g.toast('BALUT!', 900); }
        draw();
      }
      function write(q, v) {
        if (rolls === 0) return g.sfx('bad');
        sheet[turn][q.name] = v;
        g.sfx(v ? 'score' : 'bad');
        rolls = 0; keep.fill(false); dice.forEach((_, i) => { dice[i] = i + 1; });
        round++;
        if (round >= ROUNDS * 2) return end();
        turn = 3 - turn; g.turn(turn); draw();
      }
      function end() {
        starter = 3 - starter;
        const a = total(1), b = total(2);
        if (a === b) return g.draw(`Both cards read ${a} after ${ROUNDS} rounds.`);
        g.win(a > b ? 1 : 2, `${Math.max(a, b)} to ${Math.min(a, b)} across ${ROUNDS} categories.`);
      }
      rollBtn.addEventListener('click', roll);
      g.key('Space', roll);
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
