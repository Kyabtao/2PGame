/* Liar’s Dice — cup, roll, bid on what is under all the cups. Call liar or lose a die. */
(function () {
  const DICE0 = { 1: 5, 2: 5 };
  const WILD = 2;                                     // deuces are wild: they count as any called face
  let starter = 1;
  Game.init({
    id: 'liars-poker',
    rules: [
      'Both sides shake five dice under a cup. The bidder announces how many of the ten dice show a face — “three 4s”, “five 6s”. Deuces are wild and count for whatever face is called (a bid on 2s only counts the 2s themselves).',
      'Every new bid must top the last: more dice, or the same count on a higher face. You may roll your cup again before your rival answers.',
      'The rival either raises the bid or lifts the cup and cries LIAR. The dice are counted: if the bid was met, the challenger loses one die; if it was a bluff, the bidder loses one.',
      'Dice lost are gone for the match. Whoever runs the other’s cup empty wins — first side to reach zero dice loses the game.',
    ],
    controls: { all: '🎲 roll · chips set quantity and face · LIAR! to challenge' },
    points: true,
    onStart(g) {
      const dice = { 1: [], 2: [] };
      const alive = { 1: DICE0[1], 2: DICE0[2] };
      let turn = starter, bid = null, over = false, round = 0, canRR = true;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const cups = h('div', { class: 'row', style: { gap: '1.6rem' } });
      const qtyRow = h('div', { class: 'row wrap' });
      const faceRow = h('div', { class: 'row wrap' });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1) + ' dice', val: 5 }, { key: 'b', label: g.name(2) + ' dice', val: 5 }]);
      wrap.append(info, cups, qtyRow, faceRow, btnRow, stat.el);
      const cupEl = {}, dieRow = {};
      [1, 2].forEach((p) => {
        const dr = h('div', { class: 'row' });
        dieRow[p] = dr;
        cupEl[p] = h('div', { class: 'col', style: { alignItems: 'center', gap: '.3rem' } },
          h('h3', { text: g.name(p), style: { fontSize: '.85rem' } }), h('div', { class: 'bigcup', text: '🥤' }), dr);
        cups.appendChild(cupEl[p]);
      });
      const style = h('style', { html: '.bigcup{font-size:2.4rem;line-height:1.2;filter:drop-shadow(0 3px 4px rgba(0,0,0,.3))}' });
      document.head.appendChild(style);
      let q = 1, f = 1;
      function roll(p) { dice[p] = range(alive[p]).map(() => 1 + Math.floor(Math.random() * 6)); }
      function count(face) {
        let t = 0;
        for (const pp of [1, 2]) for (const d of dice[pp]) if (d === face || (d === WILD && face !== WILD)) t++;
        return t;
      }
      const legal = (qq, ff) => !bid || qq > bid.q || (qq === bid.q && ff > bid.f);
      function draw() {
        if (over) return;
        info.innerHTML = round === 0 ? 'roll to open the match' : bid ? `bid on the table: <b>${bid.q} × ${bid.f}${'⚀⚁⚂⚃⚄⚅'[bid.f - 1]}</b> · ${esc(g.name(turn))} to raise or challenge` : `${esc(g.name(turn))} to bid`;
        [1, 2].forEach((p) => {
          dieRow[p].innerHTML = '';
          dice[p].forEach((d) => dieRow[p].appendChild(UI.die(d, { small: true })));
          if (!dice[p].length) dieRow[p].appendChild(h('span', { class: 'muted', text: '—' }));
          cupEl[p].querySelector('.bigcup').textContent = p === turn && round > 0 ? '🥤' : '🫳';
        });
        qtyRow.innerHTML = ''; faceRow.innerHTML = ''; btnRow.innerHTML = '';
        if (round === 0) { btnRow.appendChild(h('button', { class: 'btn primary huge', text: '🎲 both cups roll', onclick: openRound })); }
        else {
          for (let qq = 1; qq <= 10; qq++) qtyRow.appendChild(h('button', { class: 'chip' + (qq === q ? ' on' : ''), text: String(qq), onclick: () => { q = qq; draw(); } }));
          for (let ff = 1; ff <= 6; ff++) faceRow.appendChild(h('button', { class: 'chip' + (ff === f ? ' on' : ''), text: '⚀⚁⚂⚃⚄⚅'[ff - 1] + (ff === WILD ? ' (wild)' : ''), onclick: () => { f = ff; draw(); } }));
          const ok = legal(q, f) && q >= 1;
          btnRow.appendChild(h('button', { class: 'btn' + (ok ? ' primary' : ''), text: ok ? `📢 bid ${q} × ${'⚀⚁⚂⚃⚄⚅'[f - 1]}` : 'illegal bid', onclick: doBid, disabled: !ok }));
          btnRow.appendChild(h('button', { class: 'btn', text: '🎲 reroll my cup', onclick: () => { if (!canRR) { g.sfx('bad'); g.toast('one reroll per turn', 800); return; } canRR = false; roll(turn); g.sfx('move'); g.toast('rolled under the cup', 700); draw(); } }));
          btnRow.appendChild(h('button', { class: 'btn warn', text: '🚨 LIAR!', onclick: challenge }));
          qtyRow.appendChild(h('span', { class: 'muted', text: 'quantity' }));
          faceRow.appendChild(h('span', { class: 'muted', text: 'face' }));
        }
        stat.set('a', alive[1]); stat.set('b', alive[2]);
        g.points(alive[1], alive[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${round ? 'your call' : 'open'}`);
      }
      function openRound() {
        roll(1); roll(2); round++;
        bid = null; turn = starter;
        g.sfx('capture'); draw();
      }
      function doBid() {
        if (!legal(q, f)) { g.sfx('bad'); g.toast('bid must beat the last one', 900); return; }
        bid = { q, f, by: turn };
        canRR = true;
        g.sfx('coin'); g.toast(`${esc(g.name(turn))} bids ${q} × ${f}`, 900);
        turn = 3 - turn;
        q = Math.max(q, bid.q); draw();
      }
      function challenge() {
        if (!bid) { g.sfx('bad'); return; }
        const real = count(bid.f);
        const met = real >= bid.q;
        const loser = met ? 3 - bid.by : bid.by;
        alive[loser] = Math.max(0, alive[loser] - 1);
        g.sfx(met ? 'explode' : 'coin');
        const revealed = `actual ${bid.f}s incl wild deuces: ${real} (your bid was ${bid.q})`;
        if (alive[1] === 0 || alive[2] === 0) { draw(); return finish(real, met, loser); }
        g.toast(`${met ? 'bid was TRUE — challenger loses a die' : 'BLUFF called — bidder loses a die'} · ${revealed}`, 2100);
        bid = null; turn = loser;
        round++;
        roll(1); roll(2);
        draw();
      }
      function finish(real, met, loser) {
        over = true;
        starter = 3 - starter;
        const w = alive[1] <= 0 ? 2 : 1;
        g.turn();
        g.win(w, `Last cup standing — ${esc(g.name(w))} kept dice in the cup while ${esc(g.name(loser))} ran dry (final challenge: actual ${real} of the bid ${bid ? bid.q : 0}, real count ${real}).`);
      }
      g.key(['KeyL'], challenge);
      draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
