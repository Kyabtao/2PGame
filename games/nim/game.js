/* Nim — misère: heaps of 1,3,5,7; take any number from one heap; taker of the last stick loses. */
(function () {
  let starter = 1;
  Game.init({
    id: 'nim',
    rules: ['Four heaps of 1, 3, 5 and 7 sticks.', 'On your turn choose one heap and remove as many sticks as you like from it (at least one).', 'Misère rule: whoever removes the <b>last</b> stick loses.'],
    controls: { all: 'Click a stick to take it and all sticks to its right in that heap, then confirm' },
    onStart(g) {
      const heaps = [1, 3, 5, 7];
      let turn = starter, pend = null; // {h, n}
      const wrap = h('div', { class: 'col', style: { width: '100%', maxWidth: '520px' } });
      const rows = heaps.map((n, hi) => { const row = h('div', { class: 'row', style: { minHeight: '56px', justifyContent: 'flex-start', width: '100%', gap: '6px' } }); wrap.appendChild(row); return row; });
      const btn = h('button', { class: 'btn primary', text: 'Take', disabled: true, onclick: commit });
      const info = h('div', { class: 'muted', text: 'Select sticks' });
      g.stage.append(wrap, h('div', { class: 'row' }, btn, h('button', { class: 'btn ghost', text: 'Clear', onclick: () => { pend = null; render(); } })), info);
      function render() {
        rows.forEach((row, hi) => {
          row.innerHTML = '';
          row.appendChild(h('span', { class: 'tag', text: `Heap ${hi + 1}`, style: { width: '70px', textAlign: 'center' } }));
          for (let i = 0; i < heaps[hi]; i++) {
            const sel = pend && pend.h === hi && i >= heaps[hi] - pend.n;
            const st = h('div', { class: 'tbtn', style: { width: '18px', height: '48px', borderRadius: '6px', background: sel ? g.color(turn) : '#b58a4a', border: '1px solid #0006', cursor: 'pointer' } });
            st.addEventListener('click', () => { pend = { h: hi, n: heaps[hi] - i }; g.sfx('click'); render(); });
            row.appendChild(st);
          }
        });
        btn.disabled = !pend; btn.textContent = pend ? `Take ${pend.n} from heap ${pend.h + 1}` : 'Take';
        info.textContent = `${heaps.reduce((a, b) => a + b, 0)} sticks left`;
      }
      function commit() {
        if (!pend || g.over) return;
        heaps[pend.h] -= pend.n; const took = pend.n; pend = null; g.sfx('move');
        const left = heaps.reduce((a, b) => a + b, 0);
        render();
        if (left === 0) { starter = turn; return g.win(3 - turn, `${esc(g.name(turn))} took the last stick.`); }
        turn = 3 - turn; g.turn(turn);
      }
      const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'];
      g.key(keys, (code) => { if (!pend) return; pend.n = Math.min(heaps[pend.h], +code.slice(-1)); render(); });
      g.key('Enter', commit);
      render(); g.turn(turn);
    },
  });
})();
