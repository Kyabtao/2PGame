/* Number Guess Duel — each picks a secret 1–100; alternate guesses with higher/lower hints; fewest guesses wins. */
(function () {
  let starter = 1;
  Game.init({
    id: 'number-guess',
    rules: ['Each player secretly picks a number from 1 to 100 for the other to find.', 'Players alternate guessing the opponent\'s number, getting "higher" or "lower" hints.', 'The first to hit their target wins. If the second player equalises on their very next guess it\'s a draw.'],
    controls: { all: 'Type a number and press <kbd>Enter</kbd>, or use the slider buttons' },
    points: true,
    async onStart(g) {
      const secret = {}; const guesses = { 1: [], 2: [] }; const range_ = { 1: [1, 100], 2: [1, 100] };
      for (const p of [1, 2]) { await g.pass(p, `Pick a secret number for ${g.name(3 - p)} to find.`); if (g.over) return; secret[3 - p] = await askNumber(p); if (g.over) return; }
      let turn = starter; let found = { 1: false, 2: false };
      const wrap = h('div', { class: 'col', style: { width: 'min(560px,100%)' } }); g.stage.innerHTML = ''; g.stage.appendChild(wrap);
      const render = (msg) => {
        wrap.innerHTML = ''; const p = turn; const [lo, hi] = range_[p];
        const inp = h('input', { type: 'number', min: lo, max: hi, value: Math.floor((lo + hi) / 2), style: { font: 'inherit', fontSize: '1.6rem', width: '7rem', textAlign: 'center', padding: '.4rem', borderRadius: '8px', border: `2px solid ${g.color(p)}`, background: 'var(--surface)', color: 'var(--text)' } });
        inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') submit(+inp.value); });
        const hist = h('div', { class: 'row', style: { flexWrap: 'wrap' } }, ...guesses[p].map((gs) => h('span', { class: 'tag' }, `${gs.v} ${gs.dir}`)));
        wrap.append(h('h3', { class: 'pc' + p }, `${g.name(p)}: guess ${g.name(3 - p)}'s number`), h('div', { class: 'muted' }, msg || `It's between ${lo} and ${hi}.`), h('div', { class: 'row' }, h('button', { class: 'btn', text: '−10', onclick: () => { inp.value = clamp(+inp.value - 10, lo, hi); } }), h('button', { class: 'btn', text: '−1', onclick: () => { inp.value = clamp(+inp.value - 1, lo, hi); } }), inp, h('button', { class: 'btn', text: '+1', onclick: () => { inp.value = clamp(+inp.value + 1, lo, hi); } }), h('button', { class: 'btn', text: '+10', onclick: () => { inp.value = clamp(+inp.value + 10, lo, hi); } })), h('div', { class: 'row' }, h('button', { class: 'btn primary big', text: 'Guess!', onclick: () => submit(+inp.value) })), hist);
        g.points(guesses[1].length, guesses[2].length); g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> · guess #${guesses[p].length + 1} · ${lo}–${hi}`); inp.focus();
      };
      async function submit(v) {
        if (g.over || !Number.isInteger(v) || v < 1 || v > 100) { g.sfx('bad'); return; }
        const p = turn, s = secret[p];
        if (v === s) {
          found[p] = true; guesses[p].push({ v, dir: '✓' }); g.sfx('win'); g.points(guesses[1].length, guesses[2].length);
          const o = 3 - p;
          if (found[o]) { return g.draw(`Both found their numbers in ${guesses[p].length} guesses.`); }
          if (guesses[o].length < guesses[p].length) { // opponent gets an equalising guess
            g.toast(`${g.name(p)} found it in ${guesses[p].length}! ${g.name(o)} gets one guess to tie.`, 2000); turn = o; await sleep(600); if (g.over) return; render(`Last chance: hit it now to draw. It's between ${range_[o][0]} and ${range_[o][1]}.`); return;
          }
          starter = 3 - starter; return g.win(p, `Found ${s} in ${guesses[p].length} guesses; ${g.name(o)} needed more.`);
        }
        if (found[3 - p]) { starter = 3 - starter; return g.win(3 - p, `Found their number in ${guesses[3 - p].length} guesses; ${g.name(p)} missed the equaliser.`); }
        const dir = v < s ? 'higher ↑' : 'lower ↓'; guesses[p].push({ v, dir }); g.sfx(v < s ? 'pop' : 'move');
        if (v < s) range_[p][0] = Math.max(range_[p][0], v + 1); else range_[p][1] = Math.min(range_[p][1], v - 1);
        g.toast(`${v} — ${dir}`, 900); turn = 3 - p; await sleep(700); if (g.over) return; render();
      }
      render();
      function askNumber(p) {
        return new Promise((resolve) => {
          g.stage.innerHTML = '';
          const inp = h('input', { type: 'password', inputmode: 'numeric', autocomplete: 'off', placeholder: '1–100', style: { font: 'inherit', fontSize: '1.6rem', width: '8rem', textAlign: 'center', padding: '.4rem', borderRadius: '8px', border: `2px solid ${g.color(p)}`, background: 'var(--surface)', color: 'var(--text)' } });
          const ok = () => { const v = parseInt(inp.value, 10); if (!(v >= 1 && v <= 100)) { g.sfx('bad'); return; } g.sfx('click'); resolve(v); };
          inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); });
          g.stage.append(h('h3', { class: 'pc' + p }, `${g.name(p)}: secret number for ${g.name(3 - p)}`), inp, h('div', { class: 'row' }, h('button', { class: 'btn primary', text: 'Lock it in', onclick: ok }), h('button', { class: 'btn', text: '🎲 Random', onclick: () => resolve(rnd(1, 100)) })));
          g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> picks a number`); inp.focus();
        });
      }
    },
  });
})();
