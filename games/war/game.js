/* War — classic card flip, with wars. Capped at 300 flips to avoid endless loops. */
(function () {
  Game.init({
    id: 'war',
    rules: ['The deck is split evenly. Each flip, both reveal their top card — higher card takes both (Ace high).', 'A tie means <b>WAR</b>: each places three cards face down and one face up; the higher face-up card takes everything.', 'Win by taking all 52 cards. If the round passes 300 flips, the player with more cards wins.'],
    controls: { all: 'Click <b>Flip</b> or press <kbd>Space</kbd> · <b>Auto</b> plays quickly' },
    points: true,
    onStart(g) {
      const deck = UI.deck(); const hands = { 1: deck.slice(0, 26), 2: deck.slice(26) }; const won = { 1: [], 2: [] };
      let flips = 0, busy = false, auto = false;
      const table = h('div', { class: 'row', style: { gap: '2rem', minHeight: '140px', alignItems: 'center' } });
      const left = h('div', { class: 'col' }), right = h('div', { class: 'col' }), mid = h('div', { class: 'bigmsg', style: { minWidth: '120px' } }, 'WAR');
      table.append(left, mid, right);
      const flipBtn = h('button', { class: 'btn primary big', text: 'Flip (Space)', onclick: () => flip() });
      const autoBtn = h('button', { class: 'btn', text: '⏩ Auto', onclick: () => { auto = !auto; autoBtn.classList.toggle('on', auto); if (auto) flip(); } });
      g.stage.append(table, h('div', { class: 'row' }, flipBtn, autoBtn));
      g.key('Space', () => flip());
      const count = (p) => hands[p].length + won[p].length;
      const draw = (p) => { if (!hands[p].length) { hands[p] = shuffle(won[p]); won[p] = []; } return hands[p].shift(); };
      const render = (c1, c2, pile) => { left.innerHTML = ''; right.innerHTML = ''; left.append(h('span', { class: 'tag pc1' }, `${g.name(1)}: ${count(1)}`), c1 ? UI.card(c1, { large: true }) : UI.card(null, { back: true, large: true })); right.append(h('span', { class: 'tag pc2' }, `${g.name(2)}: ${count(2)}`), c2 ? UI.card(c2, { large: true }) : UI.card(null, { back: true, large: true })); if (pile) mid.innerHTML = `<div class="muted" style="font-size:.9rem">${pile} cards at stake</div>`; g.points(count(1), count(2)); };
      render(); g.status('Flip to begin');
      async function flip() {
        if (busy || g.over) return; busy = true;
        let pot = []; let warCount = 0;
        for (;;) {
          if (count(1) === 0 || count(2) === 0) break;
          const c1 = draw(1), c2 = draw(2); pot.push(c1, c2); flips++;
          render(c1, c2, pot.length); g.sfx('move');
          if (c1.v > c2.v) { won[1].push(...pot); mid.innerHTML = `<span class="pc1">${esc(g.name(1))}</span> takes ${pot.length}`; break; }
          if (c2.v > c1.v) { won[2].push(...pot); mid.innerHTML = `<span class="pc2">${esc(g.name(2))}</span> takes ${pot.length}`; break; }
          warCount++; mid.innerHTML = '<b style="color:var(--gold)">WAR!</b>'; g.sfx('go'); await sleep(auto ? 200 : 700); if (g.over) return;
          for (let i = 0; i < 3; i++) { if (count(1) > 1) pot.push(draw(1)); if (count(2) > 1) pot.push(draw(2)); }
          render(null, null, pot.length); await sleep(auto ? 150 : 500); if (g.over) return;
        }
        g.points(count(1), count(2)); g.status(`Flip ${flips}${warCount ? ' · war!' : ''}`);
        if (count(1) === 0 || count(2) === 0) { const w = count(1) ? 1 : 2; return g.win(w, `Took all 52 cards after ${flips} flips.`); }
        if (flips >= 300) { if (count(1) === count(2)) return g.draw('300 flips — equal cards.'); const w = count(1) > count(2) ? 1 : 2; return g.win(w, `300 flips — ${count(w)} cards to ${count(3 - w)}.`); }
        busy = false;
        if (auto) g.after(180, flip);
      }
    },
  });
})();
