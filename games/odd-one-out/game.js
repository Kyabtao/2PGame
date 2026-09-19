/* Odd One Out — a grid of identical emoji with one subtly different; shared board, tap it first; grids grow. */
(function () {
  const SETS = [['😀', '😃'], ['🐶', '🐕'], ['🍎', '🍏'], ['⭐', '🌟'], ['🙂', '🙃'], ['🐱', '🐈'], ['🌝', '🌚'], ['🔵', '🟦'], ['🍀', '☘️'], ['🐢', '🐊'], ['😺', '😸'], ['🌲', '🌳'], ['🚗', '🚙'], ['🔺', '🔻'], ['🟠', '🟧'], ['🥛', '🍶'], ['⚽', '🏐'], ['🌼', '🌻'], ['🐭', '🐹'], ['📕', '📙']];
  const TARGET = 7;
  Game.init({
    id: 'odd-one-out',
    rules: ['A grid of identical symbols hides exactly one that is different. Both players scan the same board.', 'Tap the odd one first to score. A wrong tap locks you out for that board. Grids grow as the score rises.', `First to ${TARGET} wins.`],
    controls: { p1: 'Tap the left half… or anywhere: whichever player\'s side of the screen is tapped answers. On desktop: <kbd>Shift</kbd>+click = P2', p2: 'Tap / <kbd>Shift</kbd>+click' },
    points: true,
    async onStart(g) {
      const score = { 1: 0, 2: 0 }; let odd = -1, locked = { 1: false, 2: false }, busy = false, n = 0, grid = null;
      const who = h('div', { class: 'row' }, h('span', { class: 'tag pc1' }, `${g.name(1)}: tap with LEFT half / plain click`), h('span', { class: 'tag pc2' }, `${g.name(2)}: RIGHT half / Shift+click`));
      const msg = h('div', { class: 'bigmsg', style: { fontSize: '1.1rem' } }); const holder = h('div', {});
      g.stage.append(who, msg, holder);
      const build = () => {
        n++; const lvl = score[1] + score[2]; const N = clamp(4 + Math.floor(lvl / 2), 4, 8); const [a, b] = pick(SETS); const flip = Math.random() < 0.5; odd = rnd(N * N);
        holder.innerHTML = ''; const size = UI.fit(N, N, 4);
        grid = UI.grid({ rows: N, cols: N, size, gap: 4, onClick: (r, c, cell, ev) => tap(r * N + c, ev) });
        grid.each((cell, r, c) => { cell.textContent = (r * N + c === odd) !== flip ? b : a; cell.style.fontSize = 'calc(var(--cell) * .62)'; cell.style.background = 'var(--surface2)'; });
        holder.appendChild(grid.el); locked = { 1: false, 2: false }; busy = false; msg.textContent = `Board ${n} · find the odd one`; g.points(score[1], score[2]);
      };
      const playerFromEvent = (ev) => { if (!ev) return 1; if (ev.shiftKey) return 2; const x = ev.clientX; if (x == null || !window.innerWidth) return 1; return x < window.innerWidth / 2 ? 1 : 2; };
      async function tap(i, ev) {
        if (busy || g.over) return; const p = playerFromEvent(ev); if (locked[p]) return;
        if (i !== odd) { locked[p] = true; g.sfx('bad'); msg.textContent = `${g.name(p)} locked out!`; if (locked[1] && locked[2]) { busy = true; grid.at(Math.floor(odd / grid.cols), odd % grid.cols).classList.add('hl'); await sleep(1000); if (g.over) return; build(); } return; }
        busy = true; score[p]++; g.sfx('score'); grid.at(Math.floor(odd / grid.cols), odd % grid.cols).classList.add('win'); msg.innerHTML = `<span class="pc${p}">${esc(g.name(p))}</span> found it!`; g.points(score[1], score[2]);
        if (score[p] >= TARGET) return g.win(p, `${score[p]} – ${score[3 - p]}.`);
        await sleep(900); if (g.over) return; build();
      }
      await g.countdown(3); build();
    },
  });
})();
