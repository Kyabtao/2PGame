/* War · Bet Edition — flip the top card, but antes first. Blind hands, passed device, cold nerves. */
(function () {
  const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  let starter = 1;
  Game.init({
    id: 'war-pass',
    rules: [
      'Twenty-six cards each. Before every flip both players ante one coin from a ten-coin war chest (paid or forfeit the flip).',
      'Higher rank takes both antes. Equal ranks mean WAR: each side throws in a bonus coin and the next flip doubles the pot.',
      'Run out of coins? You fold the war. Most coins after the deck is dealt wins; equal coins at the end is a truce.',
    ],
    controls: { all: '⚔ flip the deck · deck auto-advances' },
    points: true,
    onStart(g) {
      const coins = { 1: 10, 2: 10 };
      let d = { 1: [], 2: [] }, pot = 0, warLevel = 0, over = false, fl1 = null, fl2 = null, flips = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const table = h('div', { class: 'split' });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1) + ' 💰', val: 10 }, { key: 'b', label: g.name(2) + ' 💰', val: 10 }, { key: 'd', label: 'deck', val: 26 }]);
      wrap.append(info, table, btnRow, stat.el);
      const val = (c) => RANKS.indexOf(typeof c === 'number' ? c : c.slice(0, -1)) + 2;
      function setup() {
        const deck = shuffle(RANKS.flatMap((r) => ['♠', '♥', '♦', '♣'].map((s) => `${r}${s}`))).slice(0, 52);
        d = { 1: deck.slice(0, 26), 2: deck.slice(26) };
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        info.innerHTML = `pot ${pot} · deck ${Math.min(d[1].length, d[2].length)} · ${warLevel ? '⚔️ WAR STAKES ×2' : 'one coin ante per flip'}`;
        table.innerHTML = '';
        [1, 2].forEach((p) => {
          const side = h('div', { class: 'side p' + p, style: { textAlign: 'center' } });
          side.appendChild(h('h3', { text: `${g.name(p)} — ${d[p].length} cards${fl1 !== null && (p === 1 ? fl1 : fl2) ? ` · shows ${(p === 1 ? fl1 : fl2)}` : ''}` }));
          side.appendChild(h('div', { text: `${coins[p]} 💰`, style: { fontSize: '1.4rem' } }));
          table.appendChild(side);
        });
        btnRow.innerHTML = '';
        btnRow.appendChild(h('button', { class: 'btn primary', text: warLevel ? '⚔️ go to war — flip' : '⚔️ ante & flip', onclick: flip }));
        stat.set('a', coins[1]); stat.set('b', coins[2]); stat.set('d', Math.min(d[1].length, d[2].length));
        g.points(coins[1], coins[2]);
        g.turn(1, 'Both pay the pot — flip when ready');
      }
      function flip() {
        if (over) return;
        for (const p of [1, 2]) {
          const ante = 1 + warLevel;
          if (coins[p] <= 0) return end();
          coins[p] = Math.max(0, coins[p] - ante);
          pot += ante;
        }
        flips++;
        fl1 = d[1].pop(); fl2 = d[2].pop();
        const a = val(fl1), b = val(fl2);
        draw();
        if (a === b) {
          warLevel = Math.min(2, warLevel + 1);
          g.sfx('explode'); g.toast(`war! cards ${fl1} vs ${fl2} — stakes rise`, 1400);
          if (!d[1].length || !d[2].length) return end();
          return;
        }
        warLevel = 0;
        const w = a > b ? 1 : 2;
        coins[w] += pot;
        g.sfx('coin'); g.toast(`${fl1} beats ${fl2} — ${g.name(w)} sweeps ${pot}`, 1200);
        pot = 0; fl1 = fl2 = null;
        draw();
        if (!d[1].length || !d[2].length || coins[1] === 0 || coins[2] === 0) return end();
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (coins[1] === coins[2]) return g.draw(`Truce at ${coins[1]} coins apiece.`);
        g.win(coins[1] > coins[2] ? 1 : 2, `War chest final tally ${coins[1]}–${coins[2]}.`);
      }
      setup();
    },
    onStop() { starter = 3 - starter; },
  });
})();
