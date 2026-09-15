/* Memory Theft — pairs to remember, coins to steal. Every match picks a pocket. */
(function () {
  const EMOJI = ['🍕', '🚗', '🐙', '🎩', '🌵', '🛸'];
  let starter = 1;
  Game.init({
    id: 'memory-theft',
    rules: [
      'A 4×3 field of facedown pairs. On your turn flip two: a match banks the pair for you AND steals one coin from your rival’s stash.',
      'Mismatch? Both cards flip back and the turn passes — but the rival now knows something they didn’t.',
      'Match streaks keep your turn going; each new pair adds one more stolen coin to the take.',
      'When the field is cleared the richest pocket wins. Ties split the pot (a draw).',
    ],
    controls: { all: 'Flip two cards per turn' },
    points: true,
    onStart(g) {
      const coins = { 1: 6, 2: 6 };
      const pairs = { 1: 0, 2: 0 };
      let deck, turn = starter, open = [], lock = false, over = false, tries = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const grid = UI.grid({ rows: 4, cols: 3, size: 84, onClick: (r, c) => flip(r * 3 + c) });
      const stat = UI.stats([{ key: 'a', label: g.name(1) + ' 💰', val: 6 }, { key: 'b', label: g.name(2) + ' 💰', val: 6 }, { key: 'p', label: 'pairs', val: 0 }]);
      wrap.append(info, grid.el, stat.el);
      function setup() {
        deck = shuffle([...EMOJI, ...EMOJI]).map((e, i) => ({ e, i, up: false, gone: false }));
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        info.innerHTML = `<b class="pc${turn}">${esc(g.name(turn))}</b> flips${open.length ? ` — one card breathing (${deck[open[0]].e})` : ''}`;
        grid.each((cell, r, c) => {
          const d = deck[r * 3 + c];
          cell.innerHTML = '';
          cell.className = 'cell' + (d.gone ? ' dis' : '');
          cell.appendChild(h('div', { text: d.up || d.gone ? d.e : '❔', style: { fontSize: '1.7rem', opacity: d.up || d.gone ? 1 : .5 } }));
          if (d.gone && pairs[1] !== pairs[2]) cell.style.outline = `2px solid ${d.owner === 1 ? 'var(--p1)' : 'var(--p2)'}`;
          else cell.style.outline = '';
        });
        stat.set('a', coins[1]); stat.set('b', coins[2]); stat.set('p', pairs[1] + pairs[2] + '/6');
        g.points(coins[1], coins[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — pick two`);
      }
      function flip(i) {
        if (lock || over || deck[i].up || deck[i].gone) return g.sfx('bad');
        deck[i].up = true;
        open.push(i);
        g.sfx('click');
        draw();
        if (open.length < 2) return;
        tries++;
        lock = true;
        const [a, b] = open;
        if (deck[a].e === deck[b].e) {
          pairs[turn]++;
          deck[a].gone = deck[b].gone = true;
          deck[a].owner = deck[b].owner = turn;
          const take = Math.min(coins[3 - turn], pairs[turn]);
          coins[3 - turn] -= take; coins[turn] += take;
          g.sfx('coin'); g.toast(`pair claimed${take ? ` — ${take} coin${take > 1 ? 's' : ''} lifted from the pocket` : ' (rival is broke!)'}`, 1200);
          open = []; lock = false;
          if (pairs[1] + pairs[2] === 6) return end();
          draw();
        } else {
          setTimeout(() => {
            deck[a].up = deck[b].up = false;
            open = []; lock = false;
            turn = g.other(turn);
            g.sfx('move');
            draw();
          }, 140);
          if (tries >= 30) return end();
        }
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (coins[1] === coins[2]) return g.draw(`Full pockets even at ${coins[1]} each.`);
        g.win(coins[1] > coins[2] ? 1 : 2, `Memory theft counts ${coins[1]}–${coins[2]} coins.`);
      }
      setup();
    },
    onStop() { starter = 3 - starter; },
  });
})();
