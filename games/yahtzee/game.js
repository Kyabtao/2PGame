/* Yahtzee — five dice, three rolls, thirteen categories, bonus at 63. */
(function () {
  const UPPER = [['Aces', 1], ['Twos', 2], ['Threes', 3], ['Fours', 4], ['Fives', 5], ['Sixes', 6]];
  const LOWER = [['3 of a Kind', 'trips'], ['4 of a Kind', 'quad'], ['Full House', 'full'], ['Small Straight', 'small'], ['Large Straight', 'large'], ['Chance', 'chance'], ['Yahtzee', 'yahtzee']];
  let starter = 1;
  Game.init({
    id: 'yahtzee',
    rules: [
      'Thirteen turns each. Every turn you roll up to three times, keeping any dice aside, then must enter the result in one empty category.',
      'Upper sections score the face value × count. 63 or more in the upper half earns the 35 point bonus.',
      'Full house is 25, small straight 30, large straight 40, three/four of a kind and chance add the dice. Yahtzee is 50 — and a second Yahtzee pays a 100 point bonus.',
      'No room for a score? Cross it off for zero. Highest filled sheet wins.',
    ],
    controls: { all: 'Tap dice to keep them · <kbd>Space</kbd> rolls · tap a category row to score' },
    points: true,
    onStart(g) {
      const dice = [1, 1, 1, 1, 1];
      const keep = [false, false, false, false, false];
      let turn = starter, rolls = 0, turnNo = 0, yahtzees = { 1: 0, 2: 0 };
      const sheet = { 1: {}, 2: {} };
      const els = { 1: {}, 2: {} };
      const rowDefs = UPPER.concat(LOWER);
      const wrap = h('div', { class: 'col', style: { width: 'min(420px, 94vw)' } });
      g.stage.appendChild(wrap);
      const diceRow = h('div', { class: 'dice' });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll' });
      const info = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      wrap.append(info, diceRow, rollBtn);
      const tbl = h('div', { class: 'panel', style: { width: '100%', maxWidth: '420px' } });
      wrap.appendChild(tbl);
      function catScore(dv, def) {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        dv.forEach((v) => counts[v]++);
        const sum = dv.reduce((a, b) => a + b, 0);
        const kind = Object.values(counts).sort((a, b) => b - a);
        if (typeof def[1] === 'number') return counts[def[1]] * def[1];
        switch (def[1]) {
          case 'trips': return kind[0] >= 3 ? sum : 0;
          case 'quad': return kind[0] >= 4 ? sum : 0;
          case 'full': return (kind[0] === 3 && kind[1] === 2) ? 25 : 0;
          case 'small': { const s = new Set(dv); return ([1, 2, 3, 4, 5, 6].some((a) => s.has(a) && s.has(a + 1) && s.has(a + 2) && s.has(a + 3)) || (s.has(1) && s.has(2) && s.has(3) && s.has(4))) ? 30 : 0; }
          case 'large': { const s = new Set(dv); return (s.has(1) && s.has(2) && s.has(3) && s.has(4) && s.has(5)) || (s.has(2) && s.has(3) && s.has(4) && s.has(5) && s.has(6)) ? 40 : 0; }
          case 'chance': return sum;
          case 'yahtzee': return kind[0] === 5 ? 50 : 0;
        }
        return 0;
      }
      function upperTotal(p) { return UPPER.reduce((a, d) => a + (sheet[p][d[0]] || 0), 0); }
      function total(p) {
        const u = upperTotal(p);
        return rowDefs.reduce((a, d) => a + (sheet[p][d[0]] || 0), 0) + (u >= 63 ? 35 : 0) + yahtzees[p] * 100;
      }
      function buildTable() {
        tbl.innerHTML = '';
        const head = h('div', { class: 'spread', style: { fontWeight: 800, borderBottom: '1px solid var(--line)', paddingBottom: '.3rem' } },
          h('span', { text: 'Category' }), h('span', { class: 'pc1', text: g.name(1) }), h('span', { class: 'pc2', text: g.name(2) }));
        tbl.appendChild(head);
        rowDefs.forEach((def) => {
          const row = h('div', { class: 'spread clickable', style: { padding: '.18rem 0', borderBottom: '1px dashed var(--line)' } });
          row.appendChild(h('span', { text: def[0] }));
          const c1 = h('span', { class: 'tag', text: '—' }); const c2 = h('span', { class: 'tag', text: '—' });
          els[1][def[0]] = c1; els[2][def[0]] = c2;
          row.append(c1, c2);
          [1, 2].forEach((p) => {
            if (p === turn && sheet[p][def[0]] == null && rolls > 0) row.onclick = () => score(def, p);
          });
          tbl.appendChild(row);
        });
        const bonusRow = h('div', { class: 'spread muted', style: { paddingTop: '.3rem' } }, h('span', { text: `Upper bonus (need 63)` }), h('span', { text: `${upperTotal(1)}${upperTotal(1) >= 63 ? ' +35' : ''}` }), h('span', { text: `${upperTotal(2)}${upperTotal(2) >= 63 ? ' +35' : ''}` }));
        tbl.appendChild(bonusRow);
        const yRow = yahtzees[1] + yahtzees[2] ? h('div', { class: 'spread muted' }, h('span', { text: 'Yahtzee bonuses' }), h('span', { text: `+${yahtzees[1] * 100}` }), h('span', { text: `+${yahtzees[2] * 100}` })) : null;
        if (yRow) tbl.appendChild(yRow);
        const tot = h('div', { class: 'spread', style: { fontWeight: 800, borderTop: '1px solid var(--line)', marginTop: '.3rem', paddingTop: '.3rem' } }, h('span', { text: 'Total' }), h('span', { class: 'pc1', text: String(total(1)) }), h('span', { class: 'pc2', text: String(total(2)) }));
        tbl.appendChild(tot);
      }
      function draw() {
        diceRow.innerHTML = '';
        dice.forEach((v, i) => {
          const d = UI.die(v, { cls: keep[i] ? 'held p' + turn : '', onClick: () => { if (rolls > 0 && rolls < 3) { keep[i] = !keep[i]; g.sfx('click'); draw(); } } });
          diceRow.appendChild(d);
        });
        rollBtn.disabled = rolls >= 3 || g.over;
        rollBtn.textContent = rolls === 0 ? '🎲 Roll all' : rolls < 3 ? `🎲 Roll ${5 - keep.filter(Boolean).length}` : '—';
        info.innerHTML = `Turn ${Math.min(13, turnNo + 1)}/13 · <b class="pc${turn}">${esc(g.name(turn))}</b> · ${rolls}/3 rolls · tap a category row when the dice are right`;
        g.points(total(1), total(2));
        buildTable();
      }
      function roll() {
        if (rolls >= 3) return;
        for (let i = 0; i < 5; i++) if (!keep[i]) dice[i] = rnd(1, 6);
        rolls++; g.sfx('roll' in {} ? 'roll' : 'tick');
        const kind = [1, 2, 3, 4, 5, 6].map((v) => dice.filter((d) => d === v).length).sort((a, b) => b - a);
        if (kind[0] === 5) { g.sfx('coin'); g.toast('YAHTZEE!', 900); }
        draw();
      }
      function score(def, p) {
        if (rolls === 0 || g.over) return g.sfx('bad');
        const v = catScore(dice, def);
        const isYat = new Set(dice).size === 1;
        if (isYat && sheet[p]['Yahtzee'] != null && def[0] !== 'Yahtzee') { yahtzees[p]++; g.toast('Extra Yahtzee: +100 bonus', 1100); }
        sheet[p][def[0]] = v;
        g.sfx(v ? 'score' : 'bad');
        rolls = 0; keep.fill(false); turnNo++;
        if (turnNo >= 26) return end();
        turn = 3 - turn; g.turn(turn);
        draw();
      }
      function end() {
        starter = 3 - starter;
        const t1 = total(1), t2 = total(2);
        if (t1 === t2) return g.draw(`${t1} points each after thirteen turns.`);
        const w = t1 > t2 ? 1 : 2;
        g.win(w, `${w === 1 ? t1 : t2} to ${w === 1 ? t2 : t1}${upperTotal(w) >= 63 ? ' (upper bonus included)' : ''}.`);
      }
      rollBtn.addEventListener('click', roll);
      g.key('Space', roll);
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
