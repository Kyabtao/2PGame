/* Rock Paper Scissors (Lizard Spock optional) — simultaneous hidden picks, best of 7. */
(function () {
  const OPT = [['rock', '✊'], ['paper', '✋'], ['scissors', '✌️'], ['lizard', '🤏'], ['spock', '🖖']];
  const BEATS = { rock: ['scissors', 'lizard'], paper: ['rock', 'spock'], scissors: ['paper', 'lizard'], lizard: ['spock', 'paper'], spock: ['scissors', 'rock'] };
  const TARGET = 4;
  Game.init({
    id: 'rock-paper-scissors',
    rules: ['Both players pick secretly with their own keys, then the hands are revealed together.', 'Rock beats scissors, scissors beat paper, paper beats rock. Toggle <b>Lizard–Spock</b> for five options.', `First to ${TARGET} round wins takes the match.`],
    controls: { p1: '<kbd>1</kbd> rock · <kbd>2</kbd> paper · <kbd>3</kbd> scissors · <kbd>4</kbd> lizard · <kbd>5</kbd> spock', p2: '<kbd>6</kbd>… <kbd>0</kbd> same order (or tap your buttons)' },
    points: true,
    onStart(g) {
      let five = !!(Store.settings().rpsFive); const score = { 1: 0, 2: 0 }; const picks = { 1: null, 2: null }; let busy = false;
      const toggle = h('button', { class: 'btn sm' + (five ? ' on' : ''), text: '🦎🖖 Lizard–Spock', onclick: () => { five = !five; toggle.classList.toggle('on', five); Store.setSettings({ rpsFive: five }); render(); } });
      const split = h('div', { class: 'split' }); const reveal = h('div', { class: 'hugemsg', style: { minHeight: '1.3em' } }); const msg = h('div', { class: 'bigmsg', style: { fontSize: '1.1rem' } });
      g.stage.append(h('div', { class: 'row' }, toggle), reveal, msg, split);
      const opts = () => OPT.slice(0, five ? 5 : 3);
      const render = () => {
        split.innerHTML = '';
        for (const p of [1, 2]) {
          const side = h('div', { class: 'side p' + p }, h('h3', {}, g.name(p) + (picks[p] ? ' ✓' : '')));
          const row = h('div', { class: 'row', style: { flexWrap: 'wrap' } });
          opts().forEach(([k, e], i) => row.appendChild(h('button', { class: 'btn big', title: k, html: `${e}<br><small class="muted">${p === 1 ? i + 1 : (i + 6) % 10}</small>`, onclick: () => pickIt(p, k) })));
          side.appendChild(row); split.appendChild(side);
        }
        g.points(score[1], score[2]); g.status(`Round ${score[1] + score[2] + 1} · first to ${TARGET}`);
      };
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'], (c) => { const d = +c.slice(-1); const p = d >= 1 && d <= 5 ? 1 : 2; const i = p === 1 ? d - 1 : (d + 4) % 10; if (i < opts().length) pickIt(p, opts()[i][0]); });
      async function pickIt(p, k) {
        if (busy || g.over || picks[p]) return; picks[p] = k; g.sfx('click'); render();
        if (!picks[1] || !picks[2]) return;
        busy = true; const a = picks[1], b = picks[2]; const ea = OPT.find((o) => o[0] === a)[1], eb = OPT.find((o) => o[0] === b)[1];
        for (const w of ['Rock…', 'Paper…', 'Scissors…']) { reveal.textContent = w; g.sfx('tick'); await sleep(350); if (g.over) return; }
        reveal.innerHTML = `<span class="pc1">${ea}</span> vs <span class="pc2">${eb}</span>`;
        let w = 0; if (BEATS[a].includes(b)) w = 1; else if (BEATS[b].includes(a)) w = 2;
        if (w) { score[w]++; g.sfx('score'); const wp = w === 1 ? a : b, lp = w === 1 ? b : a; msg.innerHTML = `<span class="pc${w}">${esc(g.name(w))}</span> wins the round — ${wp} beats ${lp}`; }
        else { g.sfx('draw'); msg.textContent = 'Tie!'; }
        g.points(score[1], score[2]);
        if (score[w] >= TARGET) { return g.win(w, `${score[w]} – ${score[3 - w]}${five ? ' (Lizard–Spock)' : ''}.`); }
        await sleep(1300); if (g.over) return; picks[1] = picks[2] = null; busy = false; reveal.textContent = ''; render();
      }
      render();
    },
  });
})();
