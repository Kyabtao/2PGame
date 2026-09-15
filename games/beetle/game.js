/* Beetle — roll the die to draw a beetle: body needs a 6, everything else stacks on it. */
(function () {
  const PARTS = [
    { key: 'body', need: 6, count: 1, label: 'body', req: [] },
    { key: 'head', need: 5, count: 1, label: 'head', req: ['body'] },
    { key: 'neck', need: 4, count: 1, label: 'neck', req: ['head'] },
    { key: 'feel', need: 3, count: 2, label: 'feelers', req: ['head'] },
    { key: 'legs', need: 2, count: 6, label: 'legs', req: ['body'] },
    { key: 'eyes', need: 1, count: 2, label: 'eyes', req: ['head'] },
  ];
  const TOTAL = PARTS.reduce((a, p) => a + p.count, 0);
  const CAP = 90;
  let starter = 1;
  Game.init({
    id: 'beetle',
    rules: [
      'Each roll of the die buys one part with that many pips: 6 = body, 5 = head, 4 = neck, 3 = feelers, 2 = legs, 1 = eyes.',
      'A part can only be bolted on when its base exists — no head without a body, no feelers without a head.',
      `Build all ${TOTAL} parts to finish your beetle first and you win the round.`,
      `Rolls are capped at ${CAP}: the more complete bug wins if nobody finishes.`,
    ],
    controls: { all: '<kbd>Space</kbd> or tap the dice to roll · you cannot choose the number' },
    onStart(g) {
      const bug = { 1: {}, 2: {} };
      PARTS.forEach((p) => { bug[1][p.key] = 0; bug[2][p.key] = 0; });
      let turn = starter, rolls = 0;
      const row = h('div', { class: 'split' });
      const view = {};
      [1, 2].forEach((p) => {
        const { canvas, ctx } = UI.canvas(210, 190);
        const cap = h('div', { class: 'muted', style: { fontSize: '.75rem', textAlign: 'center' } });
        view[p] = { canvas, ctx, cap };
        row.appendChild(h('div', { class: 'side p' + p }, h('h3', { text: g.name(p) }), canvas, cap));
      });
      g.stage.append(row);
      const dieRow = h('div', { class: 'dice' });
      const rollBtn = h('button', { class: 'btn primary', text: '🎲 Roll' });
      const info = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.append(info, dieRow, rollBtn);
      const partsOf = (p) => PARTS.reduce((a, q) => a + bug[p][q.key], 0);
      function legalFor(p, v) {
        const part = PARTS.find((q) => q.need === v);
        if (!part || bug[p][part.key] >= part.count) return null;
        if (part.req.some((r) => !bug[p][r])) return null;
        return part;
      }
      function roll() {
        if (g.over) return;
        const v = rnd(1, 6); rolls++;
        dieRow.innerHTML = ''; dieRow.appendChild(UI.die(v, { cls: 'p' + turn }));
        const part = legalFor(turn, v);
        if (part) { bug[turn][part.key]++; g.sfx('score'); g.toast(`+${part.label}`, 700); }
        else { g.sfx('bad'); g.toast(part ? `${part.label} complete already` : 'that part will not fit yet', 900); }
        if (partsOf(turn) >= TOTAL) { starter = 3 - starter; return g.win(turn, `A complete beetle in ${rolls} rolls.`); }
        if (rolls >= CAP) {
          const a = partsOf(1), b = partsOf(2); starter = 3 - starter;
          if (a === b) return g.draw(`${CAP} rolls and both bugs on ${a} parts.`);
          return g.win(a > b ? 1 : 2, `Roll limit — ${Math.max(a, b)} parts to ${Math.min(a, b)}.`);
        }
        turn = 3 - turn; g.turn(turn); draw();
      }
      function draw() {
        info.textContent = `roll ${rolls + 1}/${CAP} · ${g.name(1)} ${partsOf(1)}/${TOTAL} parts · ${g.name(2)} ${partsOf(2)}/${TOTAL} parts`;
        [1, 2].forEach((p) => {
          const { ctx } = view[p];
          const col = g.color(p);
          UI.rect(ctx, 0, 0, 210, 190, '#191f36');
          const b = bug[p];
          ctx.lineCap = 'round';
          if (b.body) { ctx.beginPath(); ctx.ellipse(105, 126, 32, 42, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#00000044'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(105, 88); ctx.lineTo(105, 166); ctx.strokeStyle = '#00000055'; ctx.stroke(); }
          if (b.neck) { UI.rect(ctx, 100, 82, 10, 20, col); }
          if (b.head) { UI.circle(ctx, 105, 70, 17, col); }
          for (let i = 0; i < b.feel; i++) { const d = i ? 1 : -1; ctx.beginPath(); ctx.moveTo(105 + d * 9, 58); ctx.quadraticCurveTo(105 + d * 26, 34, 105 + d * 34, 26); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke(); UI.circle(ctx, 105 + d * 34, 26, 3.5, col); }
          for (let i = 0; i < b.eyes; i++) { const d = i ? 1 : -1; UI.circle(ctx, 105 + d * 7, 68, 3.4, '#fff'); UI.circle(ctx, 105 + d * 7, 68, 1.5, '#111'); }
          for (let i = 0; i < b.legs; i++) { const d = i % 2 ? 1 : -1, y = 100 + Math.floor(i / 2) * 22; ctx.beginPath(); ctx.moveTo(105 + d * 26, y); ctx.lineTo(105 + d * 58, y + 16); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke(); }
          view[p].cap.textContent = PARTS.map((q) => `${q.label} ${b[q.key]}/${q.count}`).join(' · ');
        });
      }
      rollBtn.addEventListener('click', roll);
      dieRow.addEventListener('click', roll);
      g.key('Space', roll);
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
