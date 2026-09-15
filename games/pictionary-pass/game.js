/* Pictionary · Pixel Duel — paint the prompt on a 6×6 field; the engine measures your hand. */
(function () {
  const GLYPHS = {
    SUN: '001100011110111111011110001100' + '000000',
    HEART: '011010111111111111011110001100' + '000000',
    SMILE: '000000' + '010010' + '000000' + '101101' + '011110' + '000000',
    TREE: '011110' + '111111' + '111111' + '001100' + '001100' + '011110',
    STAR: '001100' + '011110' + '111111' + '011110' + '010010' + '000000',
    HOUSE: '001100' + '011110' + '111111' + '011110' + '010010' + '011110',
  };
  const N = 6, ROUNDS = 6;
  let starter = 1;
  Game.init({
    id: 'pictionary-pass',
    rules: [
      'Each round shows a subject. Paint it on the 6×6 pixel field — tap squares to ink them, tap again to clear.',
      '“Submit painting” scores you: every correct pixel is +1, every stray pixel −1, scaled to a 0–10 gallery mark. The template is revealed after you submit, so rival eyes are on your brush too.',
      'Three paintings each across six rounds. The gallery with more points owns the fridge door.',
    ],
    controls: { all: 'Tap pixels · Submit painting when done' },
    points: true,
    onStart(g) {
      const marks = { 1: '', 2: '' };
      let r = 0, painted = new Set(), word = null, over = false, showing = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const grid = UI.grid({ rows: N, cols: N, size: 46, onClick: (rr, cc) => toggle(rr * N + cc) });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }]);
      wrap.append(info, grid.el, btnRow, stat.el);
      const total = { 1: 0, 2: 0 };
      const who = () => (r % 2 ? g.other(starter) : starter);
      function round() {
        if (r >= ROUNDS || over) return end();
        painted = new Set();
        showing = false;
        const keys = Object.keys(GLYPHS);
        word = keys[r % keys.length];
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        info.innerHTML = showing ? `template vs yours — engine says <b>${marks[who()]}</b>/10` : `paint ${r}/${ROUNDS} · ink ${painted.size} px · <b class="pc${who()}">${esc(g.name(who()))}</b> — subject: <b>${word.toUpperCase()}</b>`;
        const tmpl = GLYPHS[word];
        grid.each((cell, rr, cc) => {
          const i = rr * N + cc;
          cell.innerHTML = '';
          cell.className = 'cell';
          const on = painted.has(i);
          const want = tmpl[i] === '1';
          cell.style.background = showing ? (on && want ? '#2e7d32' : on ? '#b71c1c' : want ? '#ffe082' : 'var(--cellb, #1c2340)') : (on ? '#111' : 'var(--cellb, #222a4a)');
        });
        btnRow.innerHTML = '';
        if (!showing) btnRow.appendChild(h('button', { class: 'btn primary', text: '🖌 submit painting', onclick: submit }));
        else btnRow.appendChild(h('span', { class: 'muted', text: 'template shown in gold — engine has the score' }));
        stat.set('a', total[1]); stat.set('b', total[2]);
        g.points(total[1], total[2]);
        g.turn(who(), `<span class="pc${who()}">${esc(g.name(who()))}</span> — ${showing ? 'review' : 'brush in hand'}`);
      }
      function toggle(i) {
        if (showing || over) return;
        if (painted.has(i)) painted.delete(i); else painted.add(i);
        g.sfx('click');
        draw();
      }
      function submit() {
        const tmpl = GLYPHS[word];
        let hit = 0, miss = 0;
        for (let i = 0; i < N * N; i++) {
          const want = tmpl[i] === '1', on = painted.has(i);
          if (want && on) hit++;
          else if (on || want) miss++;
        }
        const score = Math.max(0, Math.min(10, Math.round(hit - miss / 2)));
        marks[who()] = score;
        total[who()] += score;
        showing = true;
        r++;
        g.sfx(score >= 7 ? 'win' : 'coin');
        draw();
        setTimeout(round, 1400);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (total[1] === total[2]) return g.draw(`The gallery splits the prize ${total[1]}–${total[2]}.`);
        g.win(total[1] > total[2] ? 1 : 2, `Pixel duel verdict ${total[1]}–${total[2]}.`);
      }
      round();
    },
    onStop() { starter = 3 - starter; },
  });
})();
