/* Tower Stacker — a sliding block, alternating turns. Miss the overlap and your tower topples. */
(function () {
  const W = 420, H = 460, BASE = 190, TARGET = 14, TOL = 5;
  let starter = 1;
  Game.init({
    id: 'tower-stacker',
    rules: [
      'A block slides back and forth above the tower. Tap (or press Space) to drop it.',
      'Whatever hangs over the edge is shaved off, so the tower gets narrower with every bad drop.',
      'Drop with nothing overlapping and the tower topples — that player loses the round.',
      `Land inside ${TOL}px of dead centre for a perfect drop: the block keeps its full width and you go again. First to place ${TARGET} blocks wins.`,
    ],
    controls: { all: 'Tap the tower or press <kbd>Space</kbd> to drop' },
    points: true,
    pad: [{ side: 0, buttons: [{ code: 'Space', label: 'DROP', huge: true, wide: true }] }],
    onStart(g) {
      const { canvas, ctx } = UI.canvas(W, H);
      g.stage.appendChild(canvas);
      const blocks = [{ x: (W - BASE) / 2, w: BASE, p: 0 }];
      let turn = starter, mv = { x: 0, w: BASE, dir: 1, speed: 95 }, dropped = 0, anim = true;
      const placed = { 1: 0, 2: 0 }, perfect = { 1: 0, 2: 0 };
      mv.x = -mv.w; mv.dir = 1;
      const label = h('div', { class: 'muted', style: { fontSize: '.85rem' } });
      g.stage.appendChild(label);
      g.turn(turn); g.points(0, 0);

      function reset() {
        mv.w = blocks[blocks.length - 1].w; mv.x = mv.w * (turn === 1 ? -1 : 1.6);
        mv.dir = mv.x < 0 ? 1 : -1;
        mv.speed = 85 + blocks.length * 7;
        anim = true;
      }
      function drop() {
        if (g.over || !anim) return;
        anim = false;
        const top = blocks[blocks.length - 1];
        const left = Math.max(mv.x, top.x), right = Math.min(mv.x + mv.w, top.x + top.w);
        const overlap = right - left;
        if (overlap <= 6) {
          g.sfx('explode');
          dropped = 1;
          render();
          starter = 3 - starter;
          return g.win(3 - turn, `${esc(g.name(turn))} missed the tower — ${blocks.length - 1} blocks up before the crash.`);
        }
        const off = Math.abs(mv.x - top.x);
        let w = overlap, x = left;
        if (off <= TOL) { w = top.w; x = top.x; perfect[turn]++; g.sfx('coin'); g.toast('Perfect!', 700); }
        else g.sfx('thud' in {} ? 'thud' : 'hit');
        blocks.push({ x, w, p: turn });
        placed[turn]++; dropped = 0;
        g.points(placed[1], placed[2]);
        render();
        if (placed[turn] >= Math.ceil(TARGET / 2) + (turn === 1 ? 1 : 0) && placed[1] + placed[2] >= TARGET) { starter = 3 - starter; return g.win(turn, `${TARGET} blocks stood · ${perfect[1]} vs ${perfect[2]} perfect drops.`); }
        if (off > TOL) turn = 3 - turn;   // perfect drops keep the block
        g.turn(turn); reset(); render();
      }
      g.key('Space', drop);
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); drop(); });
      g.loop((dt) => {
        if (anim) {
          mv.x += mv.dir * mv.speed * dt;
          const lim = W - mv.w;
          if (mv.x < -mv.w * 0.7) { mv.x = -mv.w * 0.7; mv.dir = 1; }
          if (mv.x > lim + mv.w * 0.7) { mv.x = lim + mv.w * 0.7; mv.dir = -1; }
        }
        render();
      });
      function render() {
        UI.rect(ctx, 0, 0, W, H, '#141a2e');
        const H0 = blocks.length * 26;
        const camY = Math.max(0, H0 - (H - 150));
        const yOf = (i) => H - 40 - i * 26 + camY;
        ctx.strokeStyle = '#ffffff10';
        for (let i = 0; i < 20; i++) { const y = yOf(-i); if (y < 0 || y > H) continue; }
        for (let i = 0; i < blocks.length; i++) {
          const b0 = blocks[i], y = yOf(i);
          if (y < -30 || y > H + 30) continue;
          UI.roundRect(ctx, b0.x, y - 22, b0.w, 22, 4, b0.p ? g.color(b0.p) : '#8a93b0');
        }
        if (!g.over && yOf(blocks.length) > -40) {
          UI.roundRect(ctx, mv.x, yOf(blocks.length) - 22, mv.w, 22, 4, '#ffffff');
          ctx.globalAlpha = .25; UI.rect(ctx, blocks[blocks.length - 1].x, yOf(blocks.length) - 22, blocks[blocks.length - 1].w, 22, g.color(turn)); ctx.globalAlpha = 1;
        }
        UI.rect(ctx, 0, H - 18, W, 18, '#2a3350');
        UI.text(ctx, `${blocks.length - 1} / ${TARGET}`, W / 2, 22, { color: '#8a93b0', font: 'bold 15px system-ui' });
        label.textContent = `${g.name(turn)} to drop · height ${blocks.length - 1} · perfect ${perfect[1]}–${perfect[2]}`;
      }
      reset();
    },
    onStop() { starter = 3 - starter; },
  });
})();
