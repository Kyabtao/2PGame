/* Liar's Dice — 5 dice each, hidden; bid quantity+face or call liar. Ones are wild. */
(function () {
  Game.init({
    id: 'liars-dice',
    rules: ['Each player secretly rolls five dice (pass the device to peek). Players alternate raising the bid: "there are at least N dice showing face F" among all ten dice. Ones are wild.', 'A bid must raise the quantity, or keep the quantity and raise the face.', 'Instead of bidding, call <b>Liar!</b> The dice are revealed: if the bid holds, the caller loses a die; otherwise the bidder does. Lose all five dice and you lose the game.'],
    controls: { all: 'Buttons for bids · pass the device to look at your dice' },
    points: true,
    async onStart(g) {
      const n = { 1: 5, 2: 5 }; let dice = {}, bid = null, turn = 1, roundStarter = 1;
      const wrap = h('div', { class: 'col', style: { width: 'min(640px,100%)' } }); g.stage.appendChild(wrap);
      const rollAll = () => { dice = { 1: range(n[1]).map(() => rnd(1, 6)), 2: range(n[2]).map(() => rnd(1, 6)) }; };
      const diceRow = (arr, hide) => { const row = h('div', { class: 'dice' }); arr.forEach((v) => row.appendChild(UI.die(hide ? 0 : v, { small: true }))); return row; };
      const showBoard = (p, msg) => {
        wrap.innerHTML = '';
        wrap.append(h('div', { class: 'row spread' }, h('span', { class: 'tag pc1' }, `${g.name(1)}: ${n[1]} dice`), h('span', { class: 'tag pc2' }, `${g.name(2)}: ${n[2]} dice`)),
          h('div', { class: 'muted' }, `Your dice, ${g.name(p)}:`), diceRow(dice[p]),
          h('div', { class: 'bigmsg', style: { fontSize: '1.3rem' } }, bid ? `Current bid: ${bid.q} × ${'⚀⚁⚂⚃⚄⚅'[bid.f - 1]} (${bid.f}s)` : 'No bid yet — open the bidding'),
          msg ? h('div', { class: 'muted' }, msg) : null);
        const total = n[1] + n[2];
        const options = [];
        for (let q = 1; q <= total; q++) for (let f = 2; f <= 6; f++) { if (!bid || q > bid.q || (q === bid.q && f > bid.f)) options.push([q, f]); }
        const qs = [...new Set(options.map((o) => o[0]))].slice(0, 4);
        const bidBox = h('div', { class: 'col' });
        qs.forEach((q) => { const row = h('div', { class: 'row' }, h('span', { class: 'tag', style: { minWidth: '3rem' } }, `${q} ×`)); options.filter((o) => o[0] === q).forEach(([, f]) => row.appendChild(h('button', { class: 'btn sm p' + p, text: '⚀⚁⚂⚃⚄⚅'[f - 1] + ' ' + f, onclick: () => makeBid(p, q, f) }))); bidBox.appendChild(row); });
        wrap.append(bidBox, h('div', { class: 'row' }, bid ? h('button', { class: 'btn primary big', text: '🤥 Liar!', onclick: () => callLiar(p) }) : null));
        g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> to bid${bid ? ' or call' : ''}`); g.points(n[1], n[2]);
      };
      async function makeBid(p, q, f) { if (g.over || p !== turn) return; bid = { q, f, by: p }; g.sfx('click'); turn = 3 - p; await g.pass(turn, `${g.name(p)} bids ${q} × ${f}s.`); if (g.over) return; showBoard(turn); }
      async function callLiar(p) {
        if (g.over || p !== turn || !bid) return;
        const all = [...dice[1], ...dice[2]]; const count = all.filter((v) => v === bid.f || v === 1).length; const holds = count >= bid.q;
        const loser = holds ? p : bid.by; n[loser]--; g.sfx(holds ? 'bad' : 'capture');
        wrap.innerHTML = '';
        wrap.append(h('h3', {}, `${g.name(p)} calls liar on ${bid.q} × ${bid.f}s`), h('div', { class: 'row' }, h('span', { class: 'tag pc1' }, g.name(1)), diceRow(dice[1])), h('div', { class: 'row' }, h('span', { class: 'tag pc2' }, g.name(2)), diceRow(dice[2])),
          h('div', { class: 'bigmsg' }, `${count} × ${bid.f}s (incl. wild 1s) — bid ${holds ? 'HOLDS' : 'FAILS'}`), h('div', { class: 'muted' }, `${g.name(loser)} loses a die.`));
        g.points(n[1], n[2]);
        if (n[loser] === 0) { return g.win(3 - loser, `${g.name(loser)} ran out of dice.`); }
        const next = h('button', { class: 'btn primary', text: 'Next round ▶' }); wrap.appendChild(h('div', { class: 'row' }, next));
        await new Promise((res) => { next.addEventListener('click', res); g.key('Enter', res); }); if (g.over) return;
        bid = null; turn = loser; rollAll(); await g.pass(turn); if (g.over) return; showBoard(turn);
      }
      rollAll(); await g.pass(1); if (g.over) return; showBoard(1);
    },
  });
})();
