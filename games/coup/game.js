/* Coup — Duvalio in the hot seat: two face-down influences, seven coins, every block challengeable. */
(function () {
  const INFL = {
    Duke:       { label: '🎩', blurb: 'takes 3 instead of 1 · blocks Foreign Aid' },
    Assassin:   { label: '🗡', blurb: 'kills a hidden face' },
    Captain:    { label: '⚓', blurb: 'steals 2 · an Ambassador blocks it' },
    Ambassador: { label: '🍷', blurb: 'draws two, may swap one · blocks Captain' },
    Contessa:   { label: '🛡', blurb: 'denies the Assassin' },
  };
  const NAMES = Object.keys(INFL);
  let starter = 1;
  Game.init({
    id: 'coup',
    rules: [
      'Two face-down influence cards each and two coins. One action per turn: Income (+1), Foreign Aid (+2 to both), Captain (steal 2), Assassin (kill one of the rival’s faces), Ambassador (draw two new influences and optionally swap a dead or living one in), or Coup — pay 3 coins to force the rival to expose a face.',
      'A Duke blocks Foreign Aid, an Ambassador blocks the Captain, the Contessa denies the Assassin. Every block is a claim: the action’s owner may CHALLENGE it — a caught bluff costs the blocker an influence and the action resolves; a true block costs the challenger an influence and the action fizzles.',
      'Hold 7 coins and every money-making action is locked: you must spend it on a Coup. Lose both influences and you are out.',
      'If the 40-turn cap arrives with both houses standing, the player with more influences (then more coins) rules Duvalio.',
    ],
    controls: { all: 'Pick an action · answer blocks & challenges · 👁 peeks at your own faces' },
    points: true,
    onStart(g) {
      const coins = { 1: 2, 2: 0 };
      const inf = { 1: [], 2: [] };
      let deck = [], turn = starter, over = false, tcount = 0, pending = null, peek = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const rows = h('div', { class: 'split' });
      const infEls = {}, coinEls = {};
      [1, 2].forEach((p) => {
        const box = h('div', { class: 'row wrap' });
        infEls[p] = box;
        rows.appendChild(h('div', { class: 'side p' + p },
          h('h3', { text: g.name(p) }),
          (() => { coinEls[p] = h('div', { class: 'muted' }); return coinEls[p]; })(),
          box,
          (() => { const b = h('button', { class: 'chip', text: '👁' }); b.addEventListener('click', () => { peek = peek === p ? 0 : p; draw(); }); return b; })()));
      });
      const menu = h('div', { class: 'row wrap' });
      const hint = h('div', { class: 'muted', style: { fontSize: '.78rem', minHeight: '20px' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: '2🪙' }, { key: 'b', label: g.name(2), val: '2🪙' }, { key: 't', label: 'turn', val: 1 }]);
      wrap.append(info, rows, menu, hint, stat.el);
      const other = (p) => 3 - p;
      const alive = (p) => inf[p].filter((c) => c.alive).length;
      const has = (p, name) => inf[p].some((c) => c.alive && c.n === name);
      function loseInfl(p) {
        const c = inf[p].find((x) => x.alive);
        if (c) c.alive = false;
        g.sfx('explode');
        g.toast(`${esc(g.name(p))} exposes the ${c ? c.n : '?'}`, 1300);
        if (!alive(p)) { over = true; g.turn(); return g.win(other(p), `${esc(g.name(p))} has no faces left — ${esc(g.name(other(p)))} takes Duvalio.`); }
        return true;
      }
      function newMatch() {
        deck = [];
        for (const n of NAMES) for (let i = 0; i < 3; i++) deck.push(n);
        shuffle(deck);
        inf[1] = [{ n: deck.pop(), alive: true }, { n: deck.pop(), alive: true }];
        inf[2] = [{ n: deck.pop(), alive: true }, { n: deck.pop(), alive: true }];
        coins[1] = coins[2] = 2;
        turn = starter; tcount = 0; over = false; pending = null;
        g.toast('two houses, one princess, endless lies', 1200);
        draw();
      }
      function draw() {
        if (over) return;
        info.innerHTML = `turn ${tcount + 1}/40 · influence deck ${deck.length}`;
        [1, 2].forEach((p) => {
          coinEls[p].textContent = '🪙 ' + coins[p];
          infEls[p].innerHTML = '';
          inf[p].forEach((c) => infEls[p].appendChild(h('span', { class: 'tag', text: c.alive ? (peek === p ? INFL[c.n].label + ' ' + c.n : '🂠') : '✖ ' + c.n, style: c.alive ? {} : { opacity: .4, textDecoration: 'line-through' } })));
        });
        menu.innerHTML = ''; hint.textContent = '';
        if (pending) renderPending();
        else renderAction();
        stat.set('a', `${coins[1]}🪙/${alive(1)}i`); stat.set('b', `${coins[2]}🪙/${alive(2)}i`); stat.set('t', `${tcount + 1}/40`);
        g.points(alive(1) * 7 + coins[1], alive(2) * 7 + coins[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — ${pending ? 'answer' : 'your move'}`);
      }
      function renderAction() {
        const p = turn, rich = coins[p] >= 7;
        const B = (txt, dis, fn) => { const b = h('button', { class: 'btn', text: txt, style: {} }); if (!dis) b.addEventListener('click', fn); b.disabled = !!dis; menu.appendChild(b); return b; };
        B('💰 Income +1', rich, () => { coins[p]++; g.sfx('coin'); endTurn(); });
        B('🤝 Foreign Aid', rich, () => startAid());
        B(INFL.Captain.label + ' Steal 2', rich || !coins[other(p)], () => startCaptain());
        B(INFL.Assassin.label + ' Assassinate', rich || !alive(other(p)), () => startAssassin());
        B(INFL.Ambassador.label + ' Recruit', rich || !deck.length, () => startAmbassador());
        const cb = B('⚔ Coup — 3🪙', coins[p] < 3 || !alive(other(p)), () => { coins[p] -= 3; g.sfx('click'); loseInfl(other(p)); endTurn(); });
        cb.classList.add('primary');
        if (rich) hint.textContent = 'at 7 coins the taxman forbids small earnings — coup or bust';
      }
      /* --- multi-claim flows: each stage carries the seat that must answer --- */
      function stage(next) { pending = next; turn = next.seat; draw(); }
      function startAid() {
        const p = turn, o = other(p);
        stage({ stage: 'aid-block', actor: p, seat: o, msg: 'a Duke can smother the aid — block, or let it flow' });
      }
      function startCaptain() {
        const p = turn, o = other(p);
        stage({ stage: 'captain-block', actor: p, seat: o, msg: 'block the theft with an Ambassador, or pay 2' });
      }
      function startAssassin() {
        const p = turn, o = other(p);
        stage({ stage: 'assassin-block', actor: p, seat: o, msg: 'the Contessa can deny the blade — or a face drops' });
      }
      function startAmbassador() {
        const p = turn;
        const a = deck.pop(), b = deck.pop();
        stage({ stage: 'amb-keep', actor: p, seat: p, a, b, msg: 'swap one new influence in, or discard both' });
      }
      function renderPending() {
        const pd = pending, actor = pd.actor, o = other(actor);
        const btn = (txt, fn, cls) => { const b = h('button', { class: 'btn' + (cls ? ' ' + cls : ''), text: txt }); b.addEventListener('click', fn); menu.appendChild(b); };
        hint.textContent = pd.msg || '';
        if (turn !== pd.seat) { turn = pd.seat; draw(); return; }
        if (pd.stage === 'aid-block') {
          btn('🎩 Block with the Duke', () => stage({ stage: 'aid-challenge', actor, seat: actor, blocker: o, card: 'Duke', msg: `${g.name(o)} claims the Duke — challenge the bluff?` }));
          btn('🤝 Allow the aid', () => { pending = null; coins[actor] += 2; coins[o] += 2; g.sfx('coin'); g.toast('both banks +2', 900); endTurn(); });
          return;
        }
        if (pd.stage === 'aid-challenge') {
          btn('🤨 Challenge the Duke', () => challenge(actor, pd.blocker, 'Duke', () => { coins[actor] += 2; coins[o] += 2; g.sfx('coin'); g.toast('bluff caught — the aid pays out', 1000); }));
          btn('😔 Accept the block', () => { pending = null; g.toast('the Duke hoards the relief', 900); endTurn(); });
          return;
        }
        if (pd.stage === 'captain-block') {
          btn('🍷 Block with the Ambassador', () => stage({ stage: 'captain-challenge', actor, seat: actor, blocker: o, card: 'Ambassador', msg: `${g.name(o)} claims an Ambassador — challenge it?` }));
          btn('💸 Pay the Captain', () => { pending = null; const t = Math.min(2, coins[o]); coins[o] -= t; coins[actor] += t; g.sfx('coin'); g.toast(`the Captain lifts ${t} ducats`, 1000); endTurn(); });
          return;
        }
        if (pd.stage === 'captain-challenge') {
          btn('🤨 Challenge the Ambassador', () => challenge(actor, pd.blocker, 'Ambassador', () => { const t = Math.min(2, coins[o]); coins[o] -= t; coins[actor] += t; g.sfx('coin'); g.toast(`bluff caught — the Captain takes ${t}`, 1100); }));
          btn('😔 Accept the block', () => { pending = null; g.toast('the cellar stays locked', 900); endTurn(); });
          return;
        }
        if (pd.stage === 'assassin-block') {
          btn('🛡 Deny with the Contessa', () => stage({ stage: 'assassin-challenge', actor, seat: actor, blocker: o, card: 'Contessa', msg: `${g.name(o)} claims the Contessa — challenge it?` }));
          btn('💀 Take the blade', () => { pending = null; loseInfl(o); endTurn(); });
          return;
        }
        if (pd.stage === 'assassin-challenge') {
          btn('🤨 Challenge the Contessa', () => challenge(actor, pd.blocker, 'Contessa', () => loseInfl(o)));
          btn('😔 Back down', () => { pending = null; g.toast('the Contessa keeps her secret', 900); endTurn(); });
          return;
        }
        if (pd.stage === 'amb-keep') {
          const keep = (name) => {
            [pd.a, pd.b].forEach((x) => { if (x && x !== name) deck.push(x); });
            if (!name) { pending = null; g.sfx('click'); return endTurn(); }
            const dead = inf[actor].find((c) => !c.alive);
            if (dead) { dead.n = name; dead.alive = true; }
            else inf[actor].push({ n: name, alive: true });
            while (inf[actor].length > 2) { const gone = inf[actor].shift(); g.toast(`the ${gone.n} steps aside for the ${name}`, 1100); }
            pending = null; g.sfx('coin'); g.toast(`${esc(g.name(actor))} seats the ${name}`, 1000);
            endTurn();
          };
          btn(`🍷 take ${INFL[pd.a] ? INFL[pd.a].label + ' ' + pd.a : 'nothing'}`, () => keep(pd.a));
          if (pd.b) btn(`🍷 take ${INFL[pd.b].label} ${pd.b}`, () => keep(pd.b));
          btn('🗑 discard both', () => keep(null));
          return;
        }
        pending = null; draw();
      }
      /* challenger challenges blocker's claimed card */
      function challenge(by, blocker, card, onCatch) {
        const truth = has(blocker, card);
        pending = null;
        if (!truth) {
          g.toast(`no ${card}! the bluff costs ${esc(g.name(blocker))} a face`, 1400);
          const ok = loseInfl(blocker);
          if (ok) onCatch();
          endTurn();
          return;
        }
        g.toast(`the ${card} is real — the challenger bleeds`, 1400);
        g.sfx('explode');
        loseInfl(by);
        endTurn();
      }
      function endTurn() {
        pending = null;
        if (over) return;
        tcount++;
        if (tcount >= 40) {
          over = true;
          starter = 3 - starter;
          g.turn();
          const a1 = alive(1), a2 = alive(2);
          if (a1 !== a2) return g.win(a1 > a2 ? 1 : 2, `The clock runs out — ${a1 > a2 ? esc(g.name(1)) : esc(g.name(2))} still has ${Math.max(a1, a2)} face(s) in play.`);
          if (coins[1] !== coins[2]) return g.win(coins[1] > coins[2] ? 1 : 2, `Dead level at ${a1} faces — fortunes decided it ${coins[1]}🪙 vs ${coins[2]}🪙.`);
          return g.draw('Forty turns, two houses standing even — Duvalio keeps its secrets.');
        }
        turn = other(turn);
        draw();
      }
      newMatch();
    },
    onStop() { starter = 3 - starter; },
  });
})();
