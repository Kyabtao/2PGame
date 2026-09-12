/* Typing Race — same sentence, two text fields; live progress bars; fastest accurate typist wins. */
(function () {
  const TEXTS = [
    'the quick brown fox jumps over the lazy dog', 'pack my box with five dozen liquor jugs', 'sphinx of black quartz judge my vow', 'how vexingly quick daft zebras jump',
    'two players one keyboard endless rivalry', 'a journey of a thousand miles begins with a single step', 'practice makes perfect so keep on typing', 'bright vixens jump dozy fowl quack',
    'never underestimate the power of a good nap', 'crazy frederick bought many very exquisite opal jewels', 'jackdaws love my big sphinx of quartz', 'the five boxing wizards jump quickly',
  ];
  Game.init({
    id: 'typing-race',
    rules: ['Both players get the same sentence. Type it exactly — the progress bar only advances while your text is correct.', 'Best of 3 sentences. On phones, take turns: each player types the sentence and the faster time wins.', 'Backspace to fix mistakes; the timer for each player starts at their first keystroke.'],
    controls: { all: 'Click into your box and type · <kbd>Tab</kbd> switches boxes' },
    points: true,
    onStart(g) {
      const score = { 1: 0, 2: 0 }; let text = '', round = 0, start = { 1: 0, 2: 0 }, done = { 1: 0, 2: 0 }, used = [];
      const target = h('div', { class: 'panel', style: { fontSize: '1.2rem', fontFamily: 'var(--mono)', letterSpacing: '.02em', maxWidth: '720px' } });
      const split = h('div', { class: 'split', style: { width: 'min(760px,100%)' } });
      const boxes = {}, bars = {}, times = {};
      for (const p of [1, 2]) {
        boxes[p] = h('input', { type: 'text', class: 'typebox', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', style: { width: '100%', font: 'inherit', fontFamily: 'var(--mono)', padding: '.6rem', borderRadius: '8px', border: `2px solid ${g.color(p)}`, background: 'var(--surface)', color: 'var(--text)' } });
        boxes[p].setAttribute('autocorrect', 'off');
        bars[p] = h('div', { class: 'bar' }, h('i', { style: { width: '0%', background: g.color(p) } }));
        times[p] = h('div', { class: 'muted' }, '—');
        split.appendChild(h('div', { class: 'side p' + p }, h('h3', {}, g.name(p)), boxes[p], bars[p], times[p]));
        boxes[p].addEventListener('input', () => onInput(p));
        boxes[p].addEventListener('keydown', (e) => { e.stopPropagation(); });
      }
      g.stage.append(target, split);
      const renderTarget = (p) => { const typed = boxes[1].value; target.innerHTML = [...text].map((ch, i) => { const t1 = boxes[1].value[i], t2 = boxes[2].value[i]; const c1 = t1 == null ? '' : t1 === ch ? 'pc1' : 'bad'; return `<span style="border-bottom:3px solid ${t1 == null ? 'transparent' : t1 === ch ? g.color(1) : '#f00'};box-shadow:0 3px 0 ${t2 == null ? 'transparent' : t2 === ch ? g.color(2) : '#f00'}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`; }).join(''); };
      function onInput(p) {
        if (g.over || done[p]) return; if (!start[p]) start[p] = performance.now();
        const v = boxes[p].value; let ok = 0; while (ok < v.length && v[ok] === text[ok]) ok++;
        bars[p].firstChild.style.width = (ok / text.length * 100).toFixed(1) + '%'; boxes[p].style.background = ok === v.length ? 'var(--surface)' : '#4a2020';
        renderTarget();
        if (v === text) { done[p] = (performance.now() - start[p]) / 1000; boxes[p].disabled = true; times[p].textContent = `${done[p].toFixed(2)}s · ${Math.round(text.split(' ').length / (done[p] / 60))} wpm`; g.sfx('score'); if (!done[3 - p]) { score[p]++; g.points(score[1], score[2]); g.toast(`${g.name(p)} finishes first!`, 1200); const best = g.best('time', done[p], p, true); if (best) g.toast('New fastest time!', 1500); g.after(1500, next); } }
      }
      function next() {
        if (g.over) return;
        if (score[1] === 2 || score[2] === 2 || round >= 3) { const w = score[1] > score[2] ? 1 : 2; return g.win(w, `${score[w]} – ${score[3 - w]} sentences.`); }
        round++; let pool = TEXTS.filter((t) => !used.includes(t)); if (!pool.length) pool = TEXTS; text = pick(pool); used.push(text); start = { 1: 0, 2: 0 }; done = { 1: 0, 2: 0 };
        for (const p of [1, 2]) { boxes[p].value = ''; boxes[p].disabled = false; bars[p].firstChild.style.width = '0%'; times[p].textContent = '—'; boxes[p].style.background = 'var(--surface)'; }
        renderTarget(); g.status(`Sentence ${round} of 3 · ${text.split(' ').length} words`); boxes[1].focus();
      }
      g.key('Escape', () => boxes[1].blur());
      g.status('Get ready…'); g.after(400, next);
    },
  });
})();
