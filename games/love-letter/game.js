/* Love Letter — the official duel of wits: draw to two, play one, read the rival. First to four favours. */
(function () {
  const DECKDEF = { 1: 5, 2: 2, 3: 2, 4: 2, 5: 2, 6: 1, 7: 1, 8: 1 };
  const NAME = { 1: 'Guard', 2: 'Priest', 3: 'Baron', 4: 'Handmaid', 5: 'Prince', 6: 'King', 7: 'Countess', 8: 'Princess' };
  const LABEL = { 1: '💂', 2: '🔍', 3: '⚔️', 4: '🧤', 5: '🤴', 6: '👑', 7: '🎀', 8: '💌' };
  const TOKENS = 4, MAX_ROUNDS = 12;
  let starter = 1;
  Game.init({
    id: 'love-letter',
    rules: [
      'The complete sixteen-card deck. Each round you are dealt one card; at the start of your turn you draw to two and must play one face-up, resolving its effect. Holding two copies of a card means discarding both and drawing again, no effect.',
      'Guard: name a card 2–7 — caught holding it means elimination. Priest: look at the rival’s hand. Baron: reveal — lower card is out (a tie is safe). Handmaid: while protected every rival effect on you fizzles, until your next turn.',
      'Prince: its owner chooses who discards their hand and draws afresh. Discard the Princess and you are straight out and your rival takes a token. King: exchange hands. The Countess must go the moment she would sit beside a King or Prince.',
      'Last player standing takes a token. If the deck runs dry, the higher single card in hand takes it (ties: nobody). First to ' + TOKENS + ' tokens wins the princess’ favour.',
    ],
    controls: { all: 'Tap your card to play · Guard: tap a name chip · Prince: tap the victim' },
    points: true,
    onStart(g) {
      const toks = { 1: 0, 2: 0 };
      let roundNo = 0, over = false;
      let deck = [], played = [], hand = { 1: [], 2: [] }, alive = { 1: true, 2: true };
      let turn = 1, protect = { 1: false, 2: false }, peeked = 0, mode = null;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const fields = h('div', { class: 'split' });
      const handEls = {}, stateEls = {};
      [1, 2].forEach((p) => {
        const hd = h('div', { class: 'row wrap', style: { minHeight: 96 } });
        handEls[p] = hd;
        const st = h('div', { class: 'muted' });
        stateEls[p] = st;
        fields.appendChild(h('div', { class: 'side p' + p }, h('h3', { text: g.name(p) + ' 🌹×' }), hd, st));
      });
      const btnRow = h('div', { class: 'row wrap', style: { minHeight: 34 } });
      const logRow = h('div', { class: 'row wrap', style: { minHeight: 26 } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'r', label: 'round', val: 1 }]);
      wrap.append(info, fields, btnRow, h('h3', { text: 'On the floor', style: { fontSize: '.8rem' } }), logRow, stat.el);
      const lbl = (num) => LABEL[num] + ' ' + NAME[num];
      function newRound() {
        roundNo++;
        if (over) return;
        if (roundNo > MAX_ROUNDS) return finish();
        deck = [];
        for (const num in DECKDEF) for (let i = 0; i < DECKDEF[num]; i++) deck.push(+num);
        shuffle(deck);
        played = []; peeked = 0; mode = null;
        hand = { 1: [deck.pop()], 2: [deck.pop()] };
        alive = { 1: true, 2: true };
        protect = { 1: false, 2: false };
        turn = starter;
        draw();
        g.sfx('capture');
        g.toast(`round ${roundNo} — you hold the ${NAME[hand[turn][0]]}; draw`, 900);
        setTimeout(startTurnDraw, 250);
      }
      function startTurnDraw() {
        if (over || !alive[turn]) return;
        if (!deck.length) return revealDry();
        hand[turn].push(deck.pop());
        if (hand[turn][0] === hand[turn][1]) {              // official duplicate-draw rule
          const dup = hand[turn][0];
          hand[turn] = [];
          played.push(dup, dup);
          g.toast('two copies — both discarded, draw again (no effect)', 1500);
          g.sfx('click');
          if (!deck.length) { draw(); return revealDry(); }
          hand[turn].push(deck.pop());
        }
        if (countessStuck(turn)) return;                     // forced Countess discard, then turn passes
        draw();
      }
      function countessStuck(p) {
        const h2 = hand[p];
        if (h2.length === 2 && h2.includes(7) && (h2.includes(5) || h2.includes(6))) {
          const idx = h2.indexOf(7);
          h2.splice(idx, 1);
          played.push(7);
          g.sfx('bad'); g.toast('the Countess must be handed over immediately', 1500);
          if (h2.length === 1 && h2[0] === 8) { void 0; }  // holding princess alone is fine
          draw();
          passTurn();
          return true;
        }
        return false;
      }
      function draw() {
        if (over) return;
        info.innerHTML = `round ${roundNo}/${MAX_ROUNDS} · deck ${deck.length} · favours ${toks[1]}–${toks[2]}`;
        [1, 2].forEach((p) => {
          stateEls[p].innerHTML = '';
          stateEls[p].textContent = (alive[p] ? (protect[p] ? '🧤 protected · ' : '') : 'out · ') + '🌹 ' + toks[p];
          handEls[p].innerHTML = '';
          if (!alive[p]) return;
          hand[p].forEach((num, i) => {
            const actionable = p === turn && alive[p] && !mode;
            const el = h('button', { class: 'btn' + (actionable ? ' primary' : ''), style: { minWidth: '94px', padding: '.5rem', lineHeight: 1.25 }, html: `${LABEL[num]}<div style="font-size:.68rem;font-weight:800">${NAME[num]}</div>` });
            if (actionable) el.addEventListener('click', () => play(p, i));
            else if (p !== turn && !(peeked === p)) { el.innerHTML = '<div style="font-size:1.5rem">🂠</div>'; el.disabled = true; }
            else el.disabled = true;
            handEls[p].appendChild(el);
          });
        });
        if (peeked) { const p = peeked; handEls[p].querySelector('h3'); }
        btnRow.innerHTML = '';
        if (mode === 'guard') {
          for (let n = 2; n <= 7; n++) btnRow.appendChild(h('button', { class: 'chip', text: lbl(n), onclick: () => resolveGuess(n) }));
          btnRow.appendChild(h('span', { class: 'muted', text: 'name a card in their hand' }));
        } else if (mode === 'prince') {
          [1, 2].forEach((p) => { if (alive[p]) btnRow.appendChild(h('button', { class: 'chip', text: `discard ${g.name(p)}’s hand`, onclick: () => resolvePrince(p) })); });
          btnRow.appendChild(h('span', { class: 'muted', text: 'the Prince commands a fresh hand' }));
        }
        logRow.innerHTML = '';
        played.forEach((num) => logRow.appendChild(h('span', { class: 'tag', text: lbl(num) })));
        stat.set('a', toks[1]); stat.set('b', toks[2]); stat.set('r', roundNo);
        g.points(toks[1], toks[2]);
        g.turn(turn, mode ? `<span class="pc${turn}">${esc(g.name(turn))}</span> — choose` : `<span class="pc${turn}">${esc(g.name(turn))}</span> — play one of your two`);
      }
      function play(p, i) {
        if (p !== turn || !alive[p] || mode) return g.sfx('bad');
        const num = hand[p].splice(i, 1)[0];
        played.push(num);
        g.sfx('coin');
        const other = 3 - p;
        const canHit = alive[other] && !protect[other];
        if (num === 1) {
          if (!canHit) { g.toast(protect[other] ? 'the Handmaid turns the Guard away' : 'no target', 1100); return after(); }
          mode = 'guard'; return draw();
        }
        if (num === 2) {
          if (canHit) { peeked = other; g.toast(`they hold: ${hand[other].map((c) => NAME[c]).join(' & ') || '—'}`, 2400); setTimeout(() => { peeked = 0; draw(); }, 2400); }
          return after();
        }
        if (num === 3) {
          if (!canHit) { g.toast('shielded by the Handmaid', 1000); return after(); }
          const a = hand[p][0] || 0, b = hand[other][0] || 0;
          if (a === b) { g.toast(`both hold a ${NAME[a] || 'nothing'} — the Baron shrugs`, 1200); return after(); }
          const loser = a < b ? p : other;
          eliminate(loser, `Baron: ${NAME[a] || 'nil'} loses to ${NAME[b] || 'nil'}`);
          return after();
        }
        if (num === 4) { protect[p] = true; g.toast('you withdraw behind the handmaid', 1100); return after(); }
        if (num === 5) { mode = 'prince'; return draw(); }
        if (num === 6) {
          if (canHit && hand[other].length && hand[p].length) {
            const t = hand[p]; hand[p] = hand[other]; hand[other] = t;
            g.toast('the King exchanges your hands', 1300);
            if (countessStuck(p)) return;
          } else if (canHit) g.toast('nothing to exchange', 900);
          return after();
        }
        if (num === 7) { g.toast('the Countess glances about, doing nothing', 1000); return after(); }
        hand[p].push(num); played.pop();                      // Princess: never voluntarily played
        g.sfx('bad'); g.toast('the Princess is too precious to toss away yourself — play the other card', 1400);
        return draw();
      }
      function resolveGuess(n) {
        const p = turn, t = 3 - p;
        mode = null;
        if (hand[t].includes(n)) return eliminate(t, `caught with the ${NAME[n]}`), after();
        g.toast(`no ${NAME[n]} in hand — the Guard bows out`, 1200);
        after();
      }
      function resolvePrince(p) {
        const caller = turn; mode = null;
        if (!alive[p] || !hand[p].length) { g.toast('an empty hand offends no one', 900); void caller; return after(); }
        const num = hand[p].splice(0, 1)[0];
        played.push(num);
        g.sfx('click');
        if (num === 8) {                                    // Princess discarded to the Prince
          toks[3 - p]++;
          eliminate(p, 'handed the Princess to the Prince');
          g.toast('the Princess was exposed — a favour claimed, round over', 1700);
          return roundOver('princess-decided');
        }
        if (!deck.length) { g.toast(`${NAME[num]} discarded — but the deck is dry`, 1200); return revealDry(); }
        hand[p].push(deck.pop());
        g.toast(`${esc(g.name(p))} discards the ${NAME[num]} and draws`, 1200);
        draw();
        if (countessStuck(p)) return;
        after();
      }
      function eliminate(p, why) {
        if (!alive[p]) return;
        alive[p] = false;
        hand[p] = [];
        g.sfx('explode');
        g.toast(`${esc(g.name(p))} is out — ${why}`, 1500);
      }
      function after() {
        if (over) return;
        if (!alive[1] || !alive[2]) return roundOver();
        if (hand[1].length === 0 && hand[2].length === 0 && !deck.length) return revealDry();
        passTurn();
      }
      function passTurn() {
        const prev = turn;
        turn = 3 - turn;
        if (!alive[turn]) turn = prev;                       // skip a dead seat (single-player rounds can't happen, safety)
        protect[turn] = false;                                // protection lasts until YOUR next turn
        draw();
        startTurnDraw();
      }
      function revealDry() {
        const a = hand[1][0] || 0, b = hand[2][0] || 0;
        if (a === b) { g.toast('the deck is spent and the reveal is tied', 1500); return roundOver('dry'); }
        const w = a > b ? 1 : 2;
        toks[w]++;
        g.toast(`deck dry — ${NAME[a] || 'nil'} vs ${NAME[b] || 'nil'}: favour to ${esc(g.name(w))}`, 1800);
        roundOver('dry');
      }
      function roundOver(kind) {
        const winner = alive[1] && !alive[2] ? 1 : alive[2] && !alive[1] ? 2 : 0;
        if (winner && kind !== 'princess-decided' && kind !== 'dry') { toks[winner]++; g.toast(`🌹 a favour to ${esc(g.name(winner))}`, 1300); }
        mode = null;
        starter = 3 - starter;
        draw();
        if (toks[1] >= TOKENS || toks[2] >= TOKENS || roundNo >= MAX_ROUNDS) return finish();
        setTimeout(newRound, 800);
      }
      function finish() {
        over = true;
        starter = 3 - starter;
        g.turn();
        draw();
        if (toks[1] === toks[2]) return g.draw(`The princess stays coy at ${toks[1]}–${toks[2]}.`);
        const w = toks[1] > toks[2] ? 1 : 2;
        g.win(w, `${esc(g.name(w))} carries the day ${toks[1]}–${toks[2]}.`);
      }
      newRound();
    },
    onStop() { starter = 3 - starter; },
  });
})();
