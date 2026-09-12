/* Blackjack Duel — both vs same dealer; chips; 5 hands; most chips wins. Hidden hands via pass. */
(function () {
  const HANDS = 5;
  const val = (hand) => { let s = 0, aces = 0; hand.forEach((c) => { if (c.r === 'A') { aces++; s += 11; } else if ('JQK'.includes(c.r)) s += 10; else s += +c.r; }); while (s > 21 && aces) { s -= 10; aces--; } return s; };
  Game.init({
    id: 'blackjack-duel',
    rules: ['Both players play against the same dealer, taking turns (pass the device so hands stay secret until showdown).', 'Bet 10–50 chips, then hit or stand. Blackjack pays 3:2. Dealer hits to 16 and stands on 17.', `Everyone starts with 200 chips. After ${HANDS} hands (or when someone busts out), the richer player wins.`],
    controls: { all: 'Buttons, or <kbd>H</kbd> hit · <kbd>S</kbd> stand · <kbd>D</kbd> double' },
    points: true,
    onStart(g) {
      const chips = { 1: 200, 2: 200 }; let hand = 1, deck = [];
      const ensure = () => { if (deck.length < 20) deck = UI.deck(); };
      g.points(chips[1], chips[2]);
      const wrap = h('div', { class: 'col', style: { width: 'min(720px,100%)' } });
      g.stage.appendChild(wrap);
      const showHand = (cards, hideFirst) => { const el = h('div', { class: 'hand' }); cards.forEach((c, i) => el.appendChild(UI.card(c, { back: hideFirst && i === 0 }))); return el; };
      async function playHand() {
        if (g.over) return;
        ensure();
        const dealer = [deck.pop(), deck.pop()]; const results = {};
        const bets = {}, hands = {};
        for (const p of [1, 2]) {
          if (chips[p] <= 0) { results[p] = { out: true }; continue; }
          await g.pass(p, `Hand ${hand} of ${HANDS}. You have ${chips[p]} chips.`); if (g.over) return;
          const bet = await askBet(p); bets[p] = bet; chips[p] -= bet; g.points(chips[1], chips[2]);
          hands[p] = [deck.pop(), deck.pop()];
          const outcome = await playerTurn(p, hands[p], dealer, bets); if (g.over) return;
          results[p] = outcome;
        }
        // dealer
        wrap.innerHTML = '';
        const dEl = h('div', { class: 'col' }, h('h3', {}, 'Dealer'), showHand(dealer)); wrap.appendChild(dEl);
        const anyLive = [1, 2].some((p) => results[p] && !results[p].bust && !results[p].out && !results[p].bj);
        if (anyLive) { while (val(dealer) < 17) { await sleep(600); dealer.push(deck.pop()); dEl.replaceChild(showHand(dealer), dEl.lastChild); g.sfx('move'); } }
        const dv = val(dealer);
        const rows = h('div', { class: 'split' });
        for (const p of [1, 2]) {
          const r = results[p]; if (!r || r.out) { rows.appendChild(h('div', { class: 'side p' + p }, h('h3', {}, g.name(p)), h('div', { class: 'muted' }, 'Out of chips'))); continue; }
          const pv = val(hands[p]); let payout = 0, txt;
          if (r.bj) { payout = bets[p] * 2.5; txt = 'Blackjack! +' + (payout - bets[p]); }
          else if (r.bust) txt = `Bust (${pv}) −${bets[p]}`;
          else if (dv > 21 || pv > dv) { payout = bets[p] * 2; txt = `Win ${pv} vs ${dv > 21 ? 'bust' : dv} +${bets[p]}`; }
          else if (pv === dv) { payout = bets[p]; txt = `Push (${pv})`; }
          else txt = `Lose ${pv} vs ${dv} −${bets[p]}`;
          chips[p] += payout;
          rows.appendChild(h('div', { class: 'side p' + p }, h('h3', {}, g.name(p)), showHand(hands[p]), h('div', { style: { fontWeight: 700 } }, txt), h('div', { class: 'muted' }, `${chips[p]} chips`)));
        }
        wrap.appendChild(rows); g.points(chips[1], chips[2]); g.sfx('score');
        const next = h('button', { class: 'btn primary', text: hand >= HANDS || chips[1] <= 0 || chips[2] <= 0 ? 'Final result' : 'Next hand ▶' });
        wrap.appendChild(h('div', { class: 'row' }, next));
        g.status(`Dealer ${dv > 21 ? 'busts' : 'has ' + dv}`);
        await new Promise((res) => { next.addEventListener('click', res); g.key('Enter', res); });
        if (g.over) return;
        if (hand >= HANDS || chips[1] <= 0 || chips[2] <= 0) { if (chips[1] === chips[2]) return g.draw(`${chips[1]} chips each.`); const w = chips[1] > chips[2] ? 1 : 2; return g.win(w, `${chips[w]} chips to ${chips[3 - w]}.`); }
        hand++; playHand();
      }
      function askBet(p) {
        return new Promise((resolve) => {
          wrap.innerHTML = '';
          const max = Math.min(50, chips[p]);
          const row = h('div', { class: 'row' }); [10, 20, 30, 50].filter((b) => b <= max).forEach((b) => row.appendChild(h('button', { class: 'btn big p' + p, text: `Bet ${b}`, onclick: () => { g.sfx('click'); resolve(b); } })));
          if (!row.children.length) row.appendChild(h('button', { class: 'btn big', text: `All in (${chips[p]})`, onclick: () => resolve(chips[p]) }));
          wrap.append(h('h3', { class: 'pc' + p }, `${g.name(p)} — place your bet`), h('div', { class: 'muted' }, `${chips[p]} chips`), row);
          g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> bets`);
        });
      }
      function playerTurn(p, cards, dealer, bets) {
        return new Promise((resolve) => {
          let doubled = false;
          const render = () => {
            wrap.innerHTML = '';
            const v = val(cards);
            const btns = h('div', { class: 'row' },
              h('button', { class: 'btn primary', text: 'Hit (H)', onclick: hit }),
              h('button', { class: 'btn', text: 'Stand (S)', onclick: stand }),
              cards.length === 2 && chips[p] >= bets[p] && !doubled ? h('button', { class: 'btn', text: 'Double (D)', onclick: dbl }) : null);
            wrap.append(h('div', { class: 'col' }, h('h3', {}, 'Dealer shows'), showHand(dealer, true)), h('div', { class: 'col' }, h('h3', { class: 'pc' + p }, `${g.name(p)} — ${v}${v > 21 ? ' BUST' : ''}`), showHand(cards)), btns);
          };
          const off1 = g.key('KeyH', hit), off2 = g.key('KeyS', stand), off3 = g.key('KeyD', dbl);
          const finish = (r) => { off1(); off2(); off3(); resolve(r); };
          function hit() { cards.push(deck.pop()); g.sfx('move'); render(); if (val(cards) > 21) { g.sfx('bad'); setTimeout(() => finish({ bust: true }), 700); } else if (doubled) setTimeout(() => finish({}), 500); }
          function stand() { finish({}); }
          function dbl() { if (cards.length !== 2 || chips[p] < bets[p] || doubled) return; chips[p] -= bets[p]; bets[p] *= 2; doubled = true; g.points(chips[1], chips[2]); hit(); }
          render(); g.turn(p);
          if (val(cards) === 21) { g.sfx('coin'); setTimeout(() => finish({ bj: true }), 900); }
        });
      }
      playHand();
    },
  });
})();
