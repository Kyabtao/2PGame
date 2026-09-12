/* Mancala (Kalah) — 6 pits per side, 4 seeds each, captures and free turns. */
(function () {
  let starter = 1;
  Game.init({
    id: 'mancala',
    rules: ['Each player owns the six pits on their side and the store on their right. Player 1 is the bottom row, Player 2 the top.', 'Pick one of your pits; sow its seeds counter-clockwise one per pit, including your own store but skipping the enemy store.', 'Last seed in your store: take another turn. Last seed in an empty pit on your side: capture it and the seeds opposite.', 'When one side is empty, the other player keeps their remaining seeds. Most seeds wins.'],
    controls: { all: 'Click / tap one of your pits' },
    points: true,
    onStart(g) {
      // indices: 0-5 P1 pits, 6 P1 store, 7-12 P2 pits, 13 P2 store
      const b = Array(14).fill(4); b[6] = 0; b[13] = 0;
      let turn = starter, busy = false;
      const pitEls = [];
      const mkPit = (i, cls) => { const e = h('div', { class: 'pit ' + cls, dataset: { i } }, h('b', { text: b[i] })); e.addEventListener('click', () => play(i)); pitEls[i] = e; return e; };
      const board = h('div', { style: { display: 'grid', gridTemplateColumns: '70px repeat(6, 64px) 70px', gridTemplateRows: '64px 64px', gap: '8px', background: '#6b4a2a', padding: '14px', borderRadius: '20px' } });
      const style = document.createElement('style');
      style.textContent = '.pit{background:#c8a15a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:#2b1a0a;cursor:pointer;box-shadow:inset 0 4px 10px #0006;transition:transform .1s}.pit.store{border-radius:30px;grid-row:1/3;cursor:default}.pit.mine{outline:3px solid var(--pc)}.pit.dis{opacity:.6;cursor:default}.pit.hot{transform:scale(1.1)}';
      document.head.appendChild(style);
      board.appendChild(Object.assign(mkPit(13, 'store'), { style: 'grid-column:1' }));
      for (let i = 12; i >= 7; i--) board.appendChild(mkPit(i, 'p2'));
      board.appendChild(Object.assign(mkPit(6, 'store'), { style: 'grid-column:8;grid-row:1/3' }));
      for (let i = 0; i <= 5; i++) board.appendChild(mkPit(i, 'p1'));
      const lbl2 = h('div', { class: 'pc2', style: { alignSelf: 'flex-start' }, text: `▲ ${g.name(2)} (top row, store on the left)` });
      const lbl1 = h('div', { class: 'pc1', style: { alignSelf: 'flex-end' }, text: `▼ ${g.name(1)} (bottom row, store on the right)` });
      g.stage.append(lbl2, board, lbl1);
      const mine = (i, p) => p === 1 ? i >= 0 && i <= 5 : i >= 7 && i <= 12;
      function render() {
        b.forEach((n, i) => { pitEls[i].querySelector('b').textContent = n; pitEls[i].classList.toggle('mine', mine(i, turn) && n > 0 && !busy); pitEls[i].style.setProperty('--pc', g.color(turn)); pitEls[i].classList.toggle('dis', !mine(i, turn) && i !== 6 && i !== 13); });
        g.points(b[6], b[13]);
      }
      async function play(i) {
        if (g.over || busy || !mine(i, turn) || b[i] === 0) return;
        busy = true; render();
        let seeds = b[i]; b[i] = 0; let pos = i;
        const skip = turn === 1 ? 13 : 6;
        while (seeds > 0) {
          pos = (pos + 1) % 14; if (pos === skip) continue;
          b[pos]++; seeds--;
          pitEls[pos].classList.add('hot'); g.sfx('tick'); render();
          await sleep(140); pitEls[pos].classList.remove('hot');
          if (g.over) return;
        }
        const store = turn === 1 ? 6 : 13;
        let again = false;
        if (pos === store) again = true;
        else if (mine(pos, turn) && b[pos] === 1 && b[12 - pos] > 0) { b[store] += b[pos] + b[12 - pos]; b[pos] = 0; b[12 - pos] = 0; g.sfx('capture'); g.toast('Capture!', 700); }
        const s1 = b.slice(0, 6).reduce((a, x) => a + x, 0), s2 = b.slice(7, 13).reduce((a, x) => a + x, 0);
        if (s1 === 0 || s2 === 0) {
          b[6] += s1; b[13] += s2; for (let k = 0; k < 6; k++) { b[k] = 0; b[7 + k] = 0; }
          busy = false; render(); starter = 3 - starter;
          if (b[6] === b[13]) return g.draw(`${b[6]} seeds each.`);
          const w = b[6] > b[13] ? 1 : 2; return g.win(w, `${b[w === 1 ? 6 : 13]} seeds to ${b[w === 1 ? 13 : 6]}.`);
        }
        if (!again) turn = 3 - turn; else g.sfx('score');
        busy = false; render(); g.turn(turn, again ? `<span class="pc${turn}">${esc(g.name(turn))}</span> goes again!` : undefined);
      }
      render(); g.turn(turn);
    },
  });
})();
