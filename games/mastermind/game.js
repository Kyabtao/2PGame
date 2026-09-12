/* Mastermind Duel — each player sets a secret 4-colour code; fewer guesses to crack the other's code wins. */
(function () {
  const COLORS = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b'];
  const MAXG = 10;
  Game.init({
    id: 'mastermind',
    rules: ['Each player secretly sets a 4-peg colour code (repeats allowed) for the other to crack.', `Guess codes and read the feedback: ⚫ = right colour in the right spot, ⚪ = right colour, wrong spot. Up to ${MAXG} guesses.`, 'The player who cracks their code in fewer guesses wins.'],
    controls: { all: 'Tap colours to fill pegs · <kbd>1</kbd>–<kbd>6</kbd> colours · <kbd>Enter</kbd> submit · <kbd>Backspace</kbd> remove' },
    points: true,
    async onStart(g) {
      const codes = {}, res = {};
      const peg = (c, opts) => h('span', { class: 'peg' + (opts && opts.cls ? ' ' + opts.cls : ''), style: { display: 'inline-block', width: opts && opts.size || '34px', height: opts && opts.size || '34px', borderRadius: '50%', background: c == null ? 'var(--surface2)' : COLORS[c], border: '2px solid #0006', boxShadow: 'inset 0 -4px 0 #0003', verticalAlign: 'middle', cursor: opts && opts.onClick ? 'pointer' : 'default' }, onclick: opts && opts.onClick });
      function palette(onPick) { const row = h('div', { class: 'row' }); COLORS.forEach((c, i) => row.appendChild(peg(i, { onClick: () => onPick(i) }))); return row; }
      for (const p of [1, 2]) { await g.pass(p, `Set a secret code for ${g.name(3 - p)}.`); if (g.over) return; codes[3 - p] = await setCode(p); if (g.over) return; }
      for (const p of [1, 2]) { await g.pass(p, `Crack the code ${g.name(3 - p)} set for you.`); if (g.over) return; res[p] = await crack(p, codes[p]); if (g.over) return; }
      const d = (p) => `${g.name(p)}: ${res[p] ? res[p] + ' guesses' : 'failed'}`;
      const a = res[1] || 99, b = res[2] || 99;
      if (a === b) return g.draw(`${d(1)}; ${d(2)}.`);
      g.win(a < b ? 1 : 2, `${d(1)}; ${d(2)}.`);
      function setCode(p) {
        return new Promise((resolve) => {
          g.stage.innerHTML = ''; const code = [];
          const slots = h('div', { class: 'row', style: { gap: '.6rem' } }); const render = () => { slots.innerHTML = ''; for (let i = 0; i < 4; i++) slots.appendChild(peg(code[i] ?? null, { size: '42px' })); };
          const add = (i) => { if (code.length < 4) { code.push(i); g.sfx('click'); render(); } };
          const off = g.key('*', (c) => { if (/^Digit[1-6]$/.test(c)) add(+c.slice(-1) - 1); if (c === 'Backspace') { code.pop(); render(); } if (c === 'Enter' && code.length === 4) done(); });
          const done = () => { if (code.length < 4) return; off(); resolve(code.slice()); };
          g.stage.append(h('h3', { class: 'pc' + p }, `${g.name(p)}: set the secret code`), slots, palette(add), h('div', { class: 'row' }, h('button', { class: 'btn', text: '⌫', onclick: () => { code.pop(); render(); } }), h('button', { class: 'btn primary', text: 'Lock code', onclick: done }), h('button', { class: 'btn', text: '🎲 Random', onclick: () => { off(); resolve(range(4).map(() => rnd(6))); } })));
          g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> sets a code`); render();
        });
      }
      function crack(p, secret) {
        return new Promise((resolve) => {
          g.stage.innerHTML = ''; const board = h('div', { class: 'col', style: { gap: '.3rem' } }); let cur = [];
          const curRow = h('div', { class: 'row', style: { gap: '.6rem' } });
          const renderCur = () => { curRow.innerHTML = ''; for (let i = 0; i < 4; i++) curRow.appendChild(peg(cur[i] ?? null, { size: '42px', onClick: () => { if (cur.length > i) { cur.splice(i, 1); renderCur(); } } })); };
          const add = (i) => { if (cur.length < 4) { cur.push(i); g.sfx('click'); renderCur(); } };
          let n = 0;
          const off = g.key('*', (c) => { if (/^Digit[1-6]$/.test(c)) add(+c.slice(-1) - 1); if (c === 'Backspace') { cur.pop(); renderCur(); } if (c === 'Enter') submit(); });
          function submit() {
            if (cur.length < 4 || g.over) return; n++;
            let black = 0, white = 0; const s = secret.slice(), gq = cur.slice();
            for (let i = 0; i < 4; i++) if (gq[i] === s[i]) { black++; s[i] = gq[i] = -1; }
            for (let i = 0; i < 4; i++) if (gq[i] >= 0) { const j = s.indexOf(gq[i]); if (j >= 0) { white++; s[j] = -1; } }
            const row = h('div', { class: 'row', style: { gap: '.4rem' } }, h('span', { class: 'tag' }, String(n)), ...cur.map((c) => peg(c, { size: '26px' })), h('span', { style: { marginLeft: '.6rem', letterSpacing: '.15em' } }, '⚫'.repeat(black) + '⚪'.repeat(white)));
            board.prepend(row); cur = []; renderCur(); g.sfx(black === 4 ? 'win' : 'move');
            g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> · guess ${n + 1}/${MAXG}`);
            if (black === 4) { off(); g.toast(`Cracked in ${n}!`, 1500); return setTimeout(() => resolve(n), 1500); }
            if (n >= MAXG) { off(); g.stage.appendChild(h('div', { class: 'row' }, h('span', { class: 'muted' }, 'The code was:'), ...secret.map((c) => peg(c, { size: '26px' })))); g.toast('Out of guesses!', 1500); g.sfx('lose'); return setTimeout(() => resolve(0), 1800); }
          }
          g.stage.append(h('h3', { class: 'pc' + p }, `${g.name(p)} cracks the code`), curRow, palette(add), h('div', { class: 'row' }, h('button', { class: 'btn', text: '⌫', onclick: () => { cur.pop(); renderCur(); } }), h('button', { class: 'btn primary', text: 'Guess (Enter)', onclick: submit })), board);
          g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> · guess 1/${MAXG}`); g.points(res[1] ? res[1] || '✗' : '–', '–'); renderCur();
        });
      }
    },
  });
})();
