/* Hangman Duel — each player sets a secret word for the other; fewer wrong guesses wins. */
(function () {
  const WORDS = ['javascript', 'elephant', 'pyramid', 'volcano', 'kangaroo', 'symphony', 'galaxy', 'oxygen', 'whisper', 'lantern', 'quartz', 'jigsaw', 'rhythm', 'zephyr', 'bicycle', 'harbor', 'meadow', 'compass'];
  const MAX = 6;
  Game.init({
    id: 'hangman-duel',
    rules: ['Each player secretly types a word (4–12 letters) for their opponent, or lets the game pick one.', `Guess letters with the keyboard or the on-screen keys. ${MAX} wrong guesses and you are hanged.`, 'Both play a round; solving your word beats failing, and fewer wrong guesses breaks the tie.'],
    controls: { all: 'Type letters or tap the on-screen keyboard' },
    points: true,
    async onStart(g) {
      const words = {}; const result = {};
      for (const p of [1, 2]) {
        await g.pass(p, `Enter a secret word for ${g.name(3 - p)} to guess.`); if (g.over) return;
        words[3 - p] = await askWord(p); if (g.over) return;
      }
      for (const p of [1, 2]) { await g.pass(p, `Your turn to guess the word ${g.name(3 - p)} chose.`); if (g.over) return; result[p] = await playRound(p, words[p]); if (g.over) return; }
      const a = result[1], b = result[2];
      const desc = (p) => `${g.name(p)}: ${result[p].solved ? 'solved' : 'failed'} "${words[p]}" with ${result[p].wrong} wrong`;
      if (a.solved !== b.solved) return g.win(a.solved ? 1 : 2, `${desc(1)}; ${desc(2)}.`);
      if (a.wrong !== b.wrong) return g.win(a.wrong < b.wrong ? 1 : 2, `${desc(1)}; ${desc(2)}.`);
      g.draw(`${desc(1)}; ${desc(2)}.`);
      function askWord(p) {
        return new Promise((resolve) => {
          g.stage.innerHTML = '';
          const inp = h('input', { type: 'password', autocomplete: 'off', style: { font: 'inherit', fontSize: '1.4rem', padding: '.5rem', width: 'min(320px, 80vw)', textAlign: 'center', borderRadius: '8px', border: `2px solid ${g.color(p)}`, background: 'var(--surface)', color: 'var(--text)' }, placeholder: '4–12 letters' });
          const err = h('div', { class: 'muted' });
          const ok = () => { const w = inp.value.trim().toLowerCase(); if (!/^[a-z]{4,12}$/.test(w)) { err.textContent = 'Letters only, 4–12 long.'; g.sfx('bad'); return; } g.sfx('click'); resolve(w); };
          inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); });
          g.stage.append(h('h3', { class: 'pc' + p }, `${g.name(p)}, choose a word for ${g.name(3 - p)}`), inp, err, h('div', { class: 'row' }, h('button', { class: 'btn primary', text: 'Lock it in', onclick: ok }), h('button', { class: 'btn', text: '🎲 Random word', onclick: () => resolve(pick(WORDS)) })));
          g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> sets a word`); inp.focus();
        });
      }
      function playRound(p, word) {
        return new Promise((resolve) => {
          const guessed = new Set(); let wrong = 0;
          g.stage.innerHTML = '';
          const fig = h('pre', { style: { fontFamily: 'var(--mono)', lineHeight: 1.1, fontSize: '1.1rem', margin: 0 } });
          const wordEl = h('div', { style: { fontFamily: 'var(--mono)', fontSize: 'clamp(1.4rem, 5vw, 2.4rem)', letterSpacing: '.3em' } });
          const kb = h('div', { class: 'row', style: { flexWrap: 'wrap', maxWidth: '560px' } });
          const keys = {};
          'abcdefghijklmnopqrstuvwxyz'.split('').forEach((ch) => { keys[ch] = h('button', { class: 'btn sm keycap', text: ch.toUpperCase(), onclick: () => guess(ch) }); kb.appendChild(keys[ch]); });
          g.stage.append(h('h3', { class: 'pc' + p }, `${g.name(p)} guesses`), fig, wordEl, kb);
          const off = g.key('*', (code) => { if (/^Key[A-Z]$/.test(code)) guess(code.slice(3).toLowerCase()); });
          const parts = ['  +---+', '  |   |', (w) => `  ${w > 0 ? 'O' : ' '}   |`, (w) => `  ${w > 2 ? '/' : ' '}${w > 1 ? '|' : ' '}${w > 3 ? '\\' : ' '}  |`, (w) => `  ${w > 4 ? '/' : ' '} ${w > 5 ? '\\' : ' '}  |`, '      |', '========='];
          const render = () => { fig.textContent = parts.map((l) => typeof l === 'function' ? l(wrong) : l).join('\n'); wordEl.textContent = [...word].map((c) => guessed.has(c) ? c : '_').join(' '); g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> · ${MAX - wrong} lives · ${[...guessed].filter((c) => !word.includes(c)).join(' ').toUpperCase() || 'no misses'}`); g.points(result[1] ? (result[1].solved ? '✓' : '✗') : '–', '–'); };
          function guess(ch) {
            if (guessed.has(ch) || g.over) return; guessed.add(ch); keys[ch].disabled = true;
            if (word.includes(ch)) { g.sfx('score'); keys[ch].classList.add('primary'); } else { wrong++; g.sfx('bad'); }
            render();
            const solved = [...word].every((c) => guessed.has(c));
            if (solved || wrong >= MAX) { off(); wordEl.textContent = word.split('').join(' '); g.sfx(solved ? 'win' : 'lose'); g.toast(solved ? `${g.name(p)} solved it!` : `Hanged! The word was "${word}".`, 1600); setTimeout(() => resolve({ solved, wrong }), 1700); }
          }
          render();
        });
      }
    },
  });
})();
