/* Dominoes — double-six block game: match the pips, empty your hand, or squeeze the lowest count. */
(function () {
  const HAND = 7, GOAL = 30, MAX_HANDS = 4;
  let starter = 1;
  Game.init({
    id: 'dominoes',
    rules: [
      'Seven tiles each from the double-six set, the rest is the boneyard. The highest double opens.',
      'A tile must match the open end it touches: 4-2 goes on any 4 or any 2. Doubles sit crosswise but still count once at each end.',
      'No tile fits? Draw from the boneyard. Empty boneyard and no fit means you knock (pass).',
      'Going out ("domino!") scores every pip still in your rival’s hand. A blocked board scores the difference to whoever holds fewer pips. First to 30 pips wins the match.',
    ],
    controls: { all: 'Tap one of your tiles, then the end to play it on' },
    points: true,
    onStart(g) {
      const all = [];
      for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push([a, b]);
      const hand = { 1: [], 2: [] };
      const clear = () => { hand[1].length = 0; hand[2].length = 0; };
      let bone = shuffle(all.slice());
      for (let i = 0; i < HAND; i++) { hand[1].push(bone.pop()); hand[2].push(bone.pop()); }
      let turn = starter, chain = [], L = null, R = null, passed = 0, match = { 1: 0, 2: 0 }, handNo = 0;
      const pips = (t) => t[0] + t[1];
      // find the highest double to open, else the heaviest tile
      let openIdx = -1;
      for (let i = 0; i < hand[turn].length; i++) if (hand[turn][i][0] === hand[turn][i][1]) { if (openIdx < 0 || pips(hand[turn][i]) > pips(hand[turn][openIdx])) openIdx = i; }
      if (openIdx < 0) hand[turn].forEach((t, i) => { if (openIdx < 0 || pips(t) > pips(hand[turn][openIdx])) openIdx = i; });
      const t0 = hand[turn].splice(openIdx, 1)[0];
      chain = [{ t: t0, turn }]; L = t0[0]; R = t0[1];
      const wrap = h('div', { class: 'col', style: { width: '100%' } });
      g.stage.appendChild(wrap);
      const info = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      const board = h('div', { class: 'row wrap', style: { maxWidth: '560px', padding: '.5rem', background: '#14532d', borderRadius: 14 } });
      const endRow = h('div', { class: 'row' });
      const myRow = h('div', { class: 'row wrap', style: { maxWidth: '560px' } });
      const btnRow = h('div', { class: 'row' });
      wrap.append(info, board, endRow, h('h3', { text: 'Your tiles', style: { fontSize: '.9rem' } }), myRow, btnRow);
      let sel = -1, awaitingEnd = false;
      const tileEl = (t, opts) => {
        const el = h('button', { class: 'row', role: 'button', style: { appearance: 'none', border: '0', background: '#fdfdfd', borderRadius: 8, padding: '2px', gap: 1, boxShadow: '0 2px 5px rgba(0,0,0,.35)', border: opts && opts.sel ? '2px solid var(--gold)' : '2px solid transparent', cursor: opts && opts.onClick ? 'pointer' : 'default', transform: opts && opts.dbl ? 'rotate(90deg)' : '' } });
        el.append(UI.die(t[0], { small: true }), UI.die(t[1], { small: true }));
        if (opts && opts.onClick) el.addEventListener('click', opts.onClick);
        return el;
      };
      const fits = (t, v) => t[0] === v || t[1] === v;
      const canPlay = (p) => hand[p].some((t) => fits(t, L) || fits(t, R));
      function draw() {
        info.innerHTML = `boneyard ${bone.length} · ends <b>${L}</b>|<b>${R}</b> · hand ${handNo + 1}/${MAX_HANDS} · match ${match[1]}–${match[2]} pips`;
        board.innerHTML = '';
        chain.slice(-13).forEach((q) => board.appendChild(h('span', { class: 'tag', text: `${q.t[0]}│${q.t[1]}`, style: { background: '#fdfdfd', color: '#111', fontWeight: 800 } })));
        if (chain.length > 13) board.insertBefore(h('span', { class: 'muted', text: `+${chain.length - 13} earlier ·` }), board.firstChild);
        myRow.innerHTML = '';
        hand[turn].forEach((t, i) => myRow.appendChild(tileEl(t, { sel: sel === i, onClick: () => pick(i) })));
        if (!hand[turn].length) myRow.appendChild(h('span', { class: 'muted', text: 'hand empty' }));
        endRow.innerHTML = '';
        if (awaitingEnd) {
          endRow.appendChild(h('button', { class: 'chip', text: `◀ play on ${L}`, onclick: () => place('L') }));
          endRow.appendChild(h('button', { class: 'chip', text: `play on ${R} ▶`, onclick: () => place('R') }));
          endRow.appendChild(h('button', { class: 'chip', text: 'cancel', onclick: () => { awaitingEnd = false; sel = -1; draw(); } }));
        }
        btnRow.innerHTML = '';
        btnRow.appendChild(h('button', { class: 'chip', text: `🎲 Draw (${bone.length})`, onclick: draw1, dis: !bone.length || canPlay(turn) }));
        btnRow.appendChild(h('button', { class: 'chip', text: '🚪 Knock (pass)', onclick: knock, dis: canPlay(turn) && bone.length > 0 }));
        g.points(match[1], match[2]);
      }
      function pick(i) {
        const t = hand[turn][i];
        const okL = fits(t, L), okR = fits(t, R);
        if (!okL && !okR) { g.sfx('bad'); g.toast('That tile matches neither end', 900); return; }
        if (okL === okR) { sel = i; awaitingEnd = true; g.sfx('click'); return draw(); }
        sel = i; awaitingEnd = false; place(okL ? 'L' : 'R');
      }
      function place(side) {
        if (sel < 0) return;
        const t = hand[turn][sel];
        const v = side === 'L' ? L : R;
        if (!fits(t, v)) { g.sfx('bad'); return; }
        const oriented = t[1] === v ? t : [t[1], t[0]];
        hand[turn].splice(sel, 1);
        if (side === 'L') { chain.unshift({ t: oriented, turn }); L = oriented[0]; } else { chain.push({ t: oriented, turn }); R = oriented[1]; }
        sel = -1; awaitingEnd = false; passed = 0;
        g.sfx(t[0] === t[1] ? 'capture' : 'move');
        if (!hand[turn].length) return endHand(turn);
        if (!canPlay(turn) && !bone.length) { } // opponent's turn next
        turn = 3 - turn; g.turn(turn); draw();
        if (!canPlay(turn) && !bone.length) { g.toast(`${esc(g.name(turn))} must knock`, 900); }
      }
      function draw1() {
        if (!bone.length || canPlay(turn)) return g.sfx('bad');
        hand[turn].push(bone.pop()); g.sfx('tick'); draw();
      }
      function knock() {
        if (canPlay(turn) && bone.length) return g.sfx('bad');
        passed++; g.sfx('bad'); g.toast(`${esc(g.name(turn))} knocks`, 900);
        if (passed >= 2) return endHand(0);
        turn = 3 - turn; g.turn(turn); draw();
      }
      function endHand(winner) {
        handNo++;
        const p1 = hand[1].reduce((a, t) => a + pips(t), 0), p2 = hand[2].reduce((a, t) => a + pips(t), 0);
        if (winner) { const w = winner; match[w] += (w === 1 ? p2 : p1); }
        else { const w = p1 === p2 ? 0 : (p1 < p2 ? 2 : 1); if (w) match[w] += Math.abs(p1 - p2); }
        g.points(match[1], match[2]);
        const why = winner ? `${esc(g.name(winner))} played the last tile — ${winner === 1 ? p2 : p1} pips scored` : `Blocked board — ${p1} vs ${p2} pips in hand`;
        if (match[1] >= GOAL || match[2] >= GOAL || handNo >= MAX_HANDS) return end(why);
        g.toast(`${why}. Next hand`, 1400);
        // redeal
        bone = shuffle(all.slice()); clear();
        for (let i = 0; i < HAND; i++) { hand[1].push(bone.pop()); hand[2].push(bone.pop()); }
        passed = 0;
        turn = handNo % 2 ? 3 - starter : starter;   // alternate who opens each hand
        let oi = -1;
        for (let i = 0; i < hand[turn].length; i++) if (hand[turn][i][0] === hand[turn][i][1]) { if (oi < 0 || pips(hand[turn][i]) > pips(hand[turn][oi])) oi = i; }
        if (oi < 0) hand[turn].forEach((t, i) => { if (oi < 0 || pips(t) > pips(hand[turn][oi])) oi = i; });
        const nt = hand[turn].splice(oi, 1)[0];
        chain = [{ t: nt, turn }]; L = nt[0]; R = nt[1];
        g.turn(turn); draw();
      }
      function end(why) {
        starter = 3 - starter;
        g.points(match[1], match[2]);
        if (match[1] === match[2]) return g.draw(`${why} — the match is level at ${match[1]} pips.`);
        const w = match[1] > match[2] ? 1 : 2;
        g.win(w, `${match[w]} pips to ${match[3 - w]} over ${handNo} hand${handNo > 1 ? 's' : ''}.`);
      }
      g.turn(turn); draw();
    },
    onStop() { starter = 3 - starter; },
  });
})();
