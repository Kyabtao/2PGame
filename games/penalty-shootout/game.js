/* Penalty Shootout — hidden simultaneous picks (shooter picks a zone, keeper dives), 5 each + sudden death. */
(function () {
  const ZONES = ['↖', '↑', '↗', '↙', '↓', '↘'];
  const KEYS = { 1: ['KeyQ', 'KeyW', 'KeyE', 'KeyA', 'KeyS', 'KeyD'], 2: ['KeyU', 'KeyI', 'KeyO', 'KeyJ', 'KeyK', 'KeyL'] };
  let firstShooter = 1;
  Game.init({
    id: 'penalty-shootout',
    rules: ['Each kick: the shooter secretly picks one of six zones; the keeper secretly picks where to dive. Both press at the same time — only the first press counts.', 'If the keeper guesses the exact zone, it is a save. Top-corner shots (↖ ↗) have a 15% chance to miss the target.', 'Five kicks each, then sudden death. Players alternate shooting.'],
    controls: { p1: 'Zones: <kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd> / <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', p2: 'Zones: <kbd>U</kbd><kbd>I</kbd><kbd>O</kbd> / <kbd>J</kbd><kbd>K</kbd><kbd>L</kbd>' },
    points: true,
    pad: [{ side: 1, dpad: { up: 'KeyW', left: 'KeyA', down: 'KeyS', right: 'KeyD', center: 'KeyE' }, labels: { up: '↑', left: '↙', down: '↓', right: '↘', center: '↗' } }, { side: 2, dpad: { up: 'KeyI', left: 'KeyJ', down: 'KeyK', right: 'KeyL', center: 'KeyO' }, labels: { up: '↑', left: '↙', down: '↓', right: '↘', center: '↗' } }],
    onStart(g) {
      const score = { 1: 0, 2: 0 }; const taken = { 1: 0, 2: 0 }; const log = { 1: [], 2: [] };
      let shooter = firstShooter, picks = {}, resolving = false;
      const goal = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 90px)', gridTemplateRows: 'repeat(2, 70px)', gap: '6px', background: '#2e8b3a', padding: '12px', border: '6px solid #fff', borderBottom: 0, borderRadius: '12px 12px 0 0' } });
      const zoneEls = ZONES.map((z, i) => { const e = h('div', { class: 'cell static', style: { width: 'auto', height: 'auto', background: '#ffffff22', fontSize: '1.6rem' } }, z); goal.appendChild(e); return e; });
      const msg = h('div', { class: 'bigmsg' }); const sub = h('div', { class: 'muted' });
      const tally = h('div', { class: 'row', style: { gap: '2rem' } });
      const keeper = h('div', { style: { fontSize: '2.4rem', textAlign: 'center' } }, '🧤');
      g.stage.append(msg, sub, goal, keeper, tally);
      const renderTally = () => { tally.innerHTML = ''; for (const p of [1, 2]) tally.appendChild(h('div', { class: 'col', style: { gap: '2px' } }, h('b', { class: 'pc' + p }, g.name(p)), h('div', { class: 'row' }, ...range(Math.max(5, taken[p])).map((i) => h('span', { style: { fontSize: '1.2rem' } }, log[p][i] || '○'))))); };
      const prompt = () => { picks = {}; resolving = false; zoneEls.forEach((e) => { e.style.background = '#ffffff22'; e.textContent = ZONES[zoneEls.indexOf(e)]; }); keeper.textContent = '🧤'; msg.innerHTML = `<span class="pc${shooter}">${esc(g.name(shooter))}</span> shoots · <span class="pc${3 - shooter}">${esc(g.name(3 - shooter))}</span> keeps`; sub.textContent = `Kick ${taken[shooter] + 1}${taken[shooter] >= 5 ? ' (sudden death)' : ''} — both pick a zone now!`; g.turn(shooter, `Kick ${taken[shooter] + 1}`); renderTally(); };
      g.key([...KEYS[1], ...KEYS[2]], (code) => {
        if (resolving || g.over) return;
        const p = KEYS[1].includes(code) ? 1 : 2; if (picks[p] != null) return;
        picks[p] = KEYS[p].indexOf(code); g.sfx('click'); sub.textContent = `${esc(g.name(p))} locked in… ${picks[3 - p] != null ? '' : `waiting for ${g.name(3 - p)}`}`;
        if (picks[1] != null && picks[2] != null) resolve();
      });
      function resolve() {
        resolving = true; const shot = picks[shooter], dive = picks[3 - shooter];
        const miss = (shot === 0 || shot === 2) && Math.random() < 0.15;
        keeper.textContent = '🧤 ' + ZONES[dive]; zoneEls[dive].style.background = '#4dabf788'; zoneEls[shot].textContent = '⚽';
        let res;
        if (miss) { res = '❌'; msg.textContent = 'Off target!'; g.sfx('bad'); zoneEls[shot].style.background = '#ffa94d88'; }
        else if (shot === dive) { res = '🧤'; msg.textContent = 'SAVED!'; g.sfx('hit'); }
        else { res = '⚽'; msg.textContent = 'GOAL!'; score[shooter]++; g.sfx('score'); zoneEls[shot].style.background = '#51cf6688'; }
        log[shooter].push(res); taken[shooter]++; g.points(score[1], score[2]); renderTally();
        // decide
        const a = score[1], b = score[2], ta = taken[1], tb = taken[2];
        let winner = 0;
        if (ta <= 5 && tb <= 5) { if (a > b + (5 - tb)) winner = 1; if (b > a + (5 - ta)) winner = 2; }
        if (ta >= 5 && tb >= 5 && ta === tb && a !== b) winner = a > b ? 1 : 2;
        if (winner) { firstShooter = 3 - firstShooter; return g.win(winner, `${a} – ${b} on penalties.`); }
        shooter = 3 - shooter;
        g.after(1500, prompt);
      }
      prompt();
    },
  });
})();
