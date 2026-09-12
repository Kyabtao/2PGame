/* Simon Says Duel — shared growing sequence; players alternate; a miss lets the opponent steal the round. */
(function () {
  const COL = ['#ff6b6b', '#51cf66', '#4dabf7', '#ffd43b'];
  const NOTE = ['move', 'click', 'bounce', 'pop'];
  const ROUNDS_TO_WIN = 3;
  Game.init({
    id: 'simon-says',
    rules: ['Watch the sequence of lights, then repeat it in order. Each successful repeat adds one more step and hands the sequence to your opponent.', 'Make a mistake and your opponent gets one attempt at the same sequence to <b>steal</b> the round. If they also miss, nobody scores.', `First to ${ROUNDS_TO_WIN} rounds wins.`],
    controls: { all: 'Tap the pads or press <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>' },
    points: true,
    onStart(g) {
      const score = { 1: 0, 2: 0 }; let seq = [], turn = 1, input = [], accepting = false, mode = 'normal', longest = 0;
      const board = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: 'min(320px, 80vw)', aspectRatio: '1' } });
      const radii = ['100% 12px 12px 12px', '12px 100% 12px 12px', '12px 12px 12px 100%', '12px 12px 100% 12px'];
      const pads = COL.map((c, i) => { const el = h('button', { class: 'pad', style: { background: c, opacity: 0.45, border: 'none', borderRadius: radii[i], cursor: 'pointer', fontSize: '1.4rem', fontWeight: 800, color: '#0008', transition: 'opacity .1s, transform .1s' }, text: String(i + 1), onclick: () => press(i) }); board.appendChild(el); return el; });
      const msg = h('div', { class: 'bigmsg', style: { fontSize: '1.2rem' } });
      g.stage.append(msg, board);
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4'], (c) => press(+c.slice(-1) - 1));
      const light = async (i, ms) => { pads[i].style.opacity = 1; pads[i].style.transform = 'scale(1.05)'; g.sfx(NOTE[i]); await sleep(ms || 350); pads[i].style.opacity = 0.45; pads[i].style.transform = ''; };
      async function showSequence(p, label) {
        accepting = false; g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> · watch (${seq.length} steps)`); msg.textContent = label || `${g.name(p)}: watch…`;
        await sleep(700); if (g.over) return;
        const speed = clamp(450 - seq.length * 20, 180, 450);
        for (const i of seq) { await light(i, speed * 0.7); await sleep(speed * 0.3); if (g.over) return; }
        msg.textContent = `${g.name(p)}: your turn!`; g.turn(p, `<span class="pc${p}">${esc(g.name(p))}</span> · repeat ${seq.length} steps${mode === 'steal' ? ' to steal' : ''}`); input = []; accepting = true;
      }
      async function press(i) {
        if (!accepting || g.over) return; light(i, 200); input.push(i);
        const k = input.length - 1;
        if (input[k] !== seq[k]) { accepting = false; g.sfx('bad'); msg.textContent = `${g.name(turn)} slipped at step ${k + 1}!`; await sleep(900); if (g.over) return; return onMiss(); }
        if (input.length < seq.length) return;
        accepting = false; g.sfx('score'); longest = Math.max(longest, seq.length); await sleep(400); if (g.over) return;
        if (mode === 'steal') return roundWon(turn, `${g.name(turn)} steals the round!`);
        seq.push(rnd(4)); turn = 3 - turn; showSequence(turn);
      }
      function onMiss() {
        if (mode === 'steal') { msg.textContent = 'Both missed — no point.'; g.sfx('draw'); return g.after(1200, newRound); }
        mode = 'steal'; turn = 3 - turn; showSequence(turn, `${g.name(turn)}: repeat it to steal the round…`);
      }
      function roundWon(p, text) {
        score[p]++; g.points(score[1], score[2]); g.sfx('coin'); msg.textContent = text;
        if (score[p] >= ROUNDS_TO_WIN) return g.win(p, `${score[p]} – ${score[3 - p]} rounds; longest sequence ${longest}.`);
        g.after(1300, newRound);
      }
      function newRound() { if (g.over) return; mode = 'normal'; seq = [rnd(4), rnd(4)]; turn = (score[1] + score[2]) % 2 === 0 ? 1 : 2; showSequence(turn); }
      g.points(0, 0); newRound();
    },
  });
})();
