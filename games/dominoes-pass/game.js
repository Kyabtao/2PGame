/* Dominoes · All Fives Blind — hands stay face-down, device gets passed, fives get paid. */
(function () {
  const HAND = 7;
  let starter = 1;
  Game.init({
    id: 'dominoes-pass',
    rules: [
      'Double-six set, seven tiles each, hands stay FACE-DOWN — pass the device at every turn marker and the rival sees only your chain.',
      'Muggins scoring: when your tile leaves the two open ends summing to 5, 10, 15 or 20, you bank that many points.',
      'Unplayable tiles? Draw from the boneyard; if it is dry you knock. Going out pays +5 over the rival’s leftover pips ÷ 2 (rounded); a blocked board pays that difference to the lighter hand.',
      'One hand decides it — count the fives, guard the ends.',
    ],
    controls: { all: 'Tap a tile, then the end · pass the device at the gate' },
    points: true,
    onStart(g) {
      const all = [];
      for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push([a, b]);
      const hand = { 1: [], 2: [] };
      let bone = shuffle(all.slice());
      for (let i = 0; i < HAND; i++) { hand[1].push(bone.pop()); hand[2].push(bone.pop()); }
      let turn = starter, chain = [], L = null, R = null, passed = 0, pts = { 1: 0, 2: 0 }, over = false;
      const pips = (t) => t[0] + t[1];
      let openIdx = -1;
      for (let i = 0; i < hand[turn].length; i++) if (hand[turn][i][0] === hand[turn][i][1]) { if (openIdx < 0 || pips(hand[turn][i]) > pips(hand[turn][openIdx])) openIdx = i; }
      if (openIdx < 0) hand[turn].forEach((t, i) => { if (openIdx < 0 || pips(t) > pips(hand[turn][openIdx])) openIdx = i; });
      const t0 = hand[turn].splice(openIdx, 1)[0];
      chain = [t0]; L = t0[0]; R = t0[1];
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const board = h('div', { class: 'row wrap', style: { maxWidth: '600px', padding: '.5rem', background: '#14532d', borderRadius: 14 } });
      const endRow = h('div', { class: 'row' });
      const myRow = h('div', { class: 'row wrap', style: { maxWidth: '560px' } });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, board, endRow, myRow, btnRow, stat.el);
      let sel = -1;
      const fits = (t, v) => t[0] === v || t[1] === v;
      const canPlay = (p) => hand[p].some((t) => fits(t, L) || fits(t, R));
      function muggins(l, r) { const s = l + r; return s % 5 === 0 ? s : 0; }
      function draw() {
        if (over) return;
        info.innerHTML = `boneyard ${bone.length} · ends <b>${L}</b>|<b>${R}</b> · hand size rival: ${hand[3 - turn].length}`;
        board.innerHTML = '';
        chain.slice(-13).forEach((t) => board.appendChild(h('span', { class: 'tag', text: `${t[0]}│${t[1]}`, style: { background: '#fdfdfd', color: '#111', fontWeight: 800 } })));
        if (chain.length > 13) board.insertBefore(h('span', { class: 'muted', text: `+${chain.length - 13} earlier ·` }), board.firstChild);
        myRow.innerHTML = '';
        hand[turn].forEach((t, i) => {
          const el = h('button', { class: 'chip', style: { padding: '2px' } });
          el.append(UI.die(t[0], { small: true }), UI.die(t[1], { small: true }));
          el.addEventListener('click', () => pick(i));
          if (sel === i) el.classList.add('on');
          myRow.appendChild(el);
        });
        endRow.innerHTML = '';
        btnRow.innerHTML = '';
        const d = h('button', { class: 'chip', text: `🎲 Draw (${bone.length})`, disabled: !bone.length || canPlay(turn) });
        d.addEventListener('click', draw1);
        const k = h('button', { class: 'chip', text: '🚪 Knock (pass)', disabled: canPlay(turn) && bone.length > 0 });
        k.addEventListener('click', knock);
        btnRow.append(d, k);
        stat.set('a', pts[1]); stat.set('b', pts[2]);
        g.points(pts[1], pts[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — play, draw, or knock`);
      }
      function pick(i) {
        const t = hand[turn][i];
        const okL = fits(t, L), okR = fits(t, R);
        if (!okL && !okR) { g.sfx('bad'); g.toast('That tile matches neither end', 900); return; }
        sel = -1;
        const side = okL && okR ? (L === R ? 'R' : 'L') : okL ? 'L' : 'R';
        place(side, i);
      }
      function place(side, idx) {
        const i = idx ?? sel;
        if (i < 0 || !hand[turn][i]) return;
        const t = hand[turn][i];
        const v = side === 'L' ? L : R;
        if (!fits(t, v)) { g.sfx('bad'); return; }
        const oriented = t[1] === v ? t : [t[1], t[0]];
        hand[turn].splice(i, 1);
        sel = -1; passed = 0;
        if (side === 'L') { chain.unshift(oriented); L = oriented[0]; } else { chain.push(oriented); R = oriented[1]; }
        const m = muggins(L, R);
        if (m) { pts[turn] += m; g.sfx('coin'); g.toast(`ends make ${L}+${R}=${L + R} — +${m}`, 1300); }
        else g.sfx('move');
        if (!hand[turn].length) return endHand(turn);
        turn = 3 - turn;
        draw();
        if (!canPlay(turn) && !bone.length) g.toast(`${esc(g.name(turn))} is stuck and dry — knock`, 900);
      }
      function draw1() {
        if (!bone.length || canPlay(turn)) return g.sfx('bad');
        hand[turn].push(bone.pop()); g.sfx('tick'); draw();
      }
      function knock() {
        if (canPlay(turn) && bone.length) return g.sfx('bad');
        passed++; g.sfx('bad'); g.toast(`${esc(g.name(turn))} knocks`, 900);
        if (passed >= 2) return endHand(0);
        turn = 3 - turn; draw();
      }
      function endHand(winner) {
        over = true;
        const p1 = hand[1].reduce((a, t) => a + pips(t), 0), p2 = hand[2].reduce((a, t) => a + pips(t), 0);
        if (winner) pts[winner] += 5 + Math.ceil((winner === 1 ? p2 : p1) / 2);
        else pts[p1 === p2 ? 0 : p1 < p2 ? 1 : 2] += Math.ceil(Math.abs(p1 - p2) / 2);
        stat.set('a', pts[1]); stat.set('b', pts[2]); g.points(pts[1], pts[2]);
        starter = 3 - starter;
        g.turn();
        const why = winner ? `${esc(g.name(winner))} played out — “domino!”` : `Board blocked — ${p1} vs ${p2} pips held`;
        if (pts[1] === pts[2]) return g.draw(`${why}, and the fives land level at ${pts[1]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `${why}. All-fives tally ${pts[1]}–${pts[2]}.`);
      }
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
