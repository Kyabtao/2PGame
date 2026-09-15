/* Equation Builder — claim tiles, build a = target, misfires feed the rival. */
(function () {
  const ROUNDS = 6;
  let starter = 1;
  Game.init({
    id: 'equation-builder',
    rules: [
      'A shared centre holds nine number tiles (1–9) and four operators (+, −, ×, ÷). On your turn assemble `n op n op n` to hit the target — division only counts when it divides exactly.',
      'Correct equation: you bank points equal to the tiles used and every tile in it is consumed. A broken equation (wrong value or illegal) burns those tiles for the rival — they inherit them as free pick-ups on their next go.',
      'Both may keep trying; the target refreshes whenever it is hit. After six successful equations — or when 26 attempts are spent — the higher bank wins.',
      'You may also fold your turn (⟳) to reshuffle the centre at the cost of 1 point.',
    ],
    controls: { all: 'Tap tiles to place them in the frame · = to fire · ⟳ to reshuffle' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let nums = [], ops = [], sel = { n: [], o: [] }, target = 0, wins = 0, turn = starter, over = false, fires = 0;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const frame = h('div', { class: 'row', style: { minHeight: 64, alignItems: 'center' } });
      const trayN = h('div', { class: 'row wrap' });
      const trayO = h('div', { class: 'row' });
      const btnRow = h('div', { class: 'row' });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'w', label: 'solved', val: 0 }]);
      wrap.append(info, frame, trayN, trayO, btnRow, stat.el);
      const OPMAP = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => (b && a % b === 0 ? a / b : null) };
      function freshCenter() {
        nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        ops = ['+', '−', '×', '÷'];
      }
      function newTarget() { target = 3 + Math.floor(Math.random() * 40); sel = { n: [], o: [] }; }
      function startGame() { freshCenter(); newTarget(); draw(); }
      function fire() {
        if (sel.n.length !== 3 || sel.o.length !== 2) { g.sfx('bad'); g.toast('fill the frame: three numbers, two operators', 1100); return; }
        fires++;
        if (fires > 26) return end();
        let v = sel.n[0], ok = true;
        for (let i = 0; i < 2; i++) {
          const r = OPMAP[sel.o[i]](v, sel.n[i + 1]);
          if (r === null) { ok = false; break; }
          v = r;
        }
        const consumed = () => {
          sel.o.forEach((o) => { const k = ops.indexOf(o); if (k >= 0) ops.splice(k, 1); });
          sel.n.forEach((num) => { const k = nums.indexOf(num); if (k >= 0) nums.splice(k, 1); });
        };
        if (ok && v === target) {
          pts[turn] += 5;
          wins++;
          consumed();
          g.sfx('win'); g.toast(`solved — +5 for ${esc(g.name(turn))}`, 1400);
          if (ops.length < 2 || nums.length < 3) freshCenter();
          newTarget();
          if (wins >= ROUNDS) return end();
        } else {
          consumed();                                   // misfire feeds the rival the burnt tiles
          pts[turn] = Math.max(0, pts[turn] - 1);
          g.sfx('explode'); g.toast(`${v ?? 'illegal'} ≠ ${target} — tiles burned (−1)`, 1500);
          if (nums.length < 3 || ops.length < 2) freshCenter();
          turn = 3 - turn;
        }
        draw();
      }
      function reshuffle() {
        if (pts[turn] > 0) pts[turn]--;
        freshCenter(); newTarget();
        g.sfx('click'); g.toast('centre reshuffled at the cost of 1', 1100);
        turn = 3 - turn;
        if (!nums.length) return end();
        draw();
      }
      function draw() {
        if (over) return;
        info.innerHTML = `target <b style="font-size:1.5rem">${target}</b> · solved ${wins}/${ROUNDS} · <b class="pc${turn}">${esc(g.name(turn))}</b> building`;
        frame.innerHTML = '';
        const slot = (txt, hot) => h('span', { class: 'tag', text: txt, style: { fontSize: '1.5rem', minWidth: '2.2ch', textAlign: 'center', borderColor: hot ? 'var(--gold)' : 'transparent' } });
        frame.appendChild(slot(String(sel.n[0] ?? '?')));
        frame.appendChild(slot(String(sel.o[0] ?? '·'), true));
        frame.appendChild(slot(String(sel.n[1] ?? '?')));
        frame.appendChild(slot(String(sel.o[1] ?? '·'), true));
        frame.appendChild(slot(String(sel.n[2] ?? '?')));
        frame.appendChild(slot('= ' + target));
        trayN.innerHTML = ''; trayO.innerHTML = '';
        nums.forEach((num) => {
          const k = sel.n.filter((x) => x === num).length, have = nums.filter((x) => x === num).length;
          const b = h('button', { class: 'btn' + (sel.n.includes(num) ? ' primary' : ''), text: String(num), style: { minWidth: '52px', fontSize: '1.1rem' }, disabled: k >= have && !sel.n.includes(num) });
          b.addEventListener('click', () => {
            if (sel.n.length >= 3) return;
            sel.n.push(num); draw();
          });
          trayN.appendChild(b);
        });
        ops.forEach((o) => {
          const used = sel.o.includes(o);
          const b = h('button', { class: 'btn' + (used ? ' primary' : ''), text: o, style: { minWidth: '52px', fontSize: '1.1rem' } });
          b.addEventListener('click', () => {
            if (used) sel.o.splice(sel.o.indexOf(o), 1);
            else if (sel.o.length < 2) sel.o.push(o);
            draw();
          });
          trayO.appendChild(b);
        });
        btnRow.innerHTML = '';
        btnRow.appendChild(h('button', { class: 'btn primary', text: '= fire', onclick: fire }));
        btnRow.appendChild(h('button', { class: 'btn', text: '⟳ reshuffle (−1)', onclick: reshuffle }));
        btnRow.appendChild(h('button', { class: 'chip', text: '✖ clear frame', onclick: () => { sel = { n: [], o: [] }; draw(); } }));
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('w', `${wins}/${ROUNDS}`);
        g.points(pts[1], pts[2]);
        g.turn(turn, `<span class="pc${turn}">${esc(g.name(turn))}</span> — centre holds ${nums.length} numbers and ${ops.length} operators`);
      }
      function end() {
        if (over) return;
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Six equations and the banks tie at ${pts[1]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Equation builder: ${pts[1]}–${pts[2]}.`);
      }
      startGame();
    },
    onStop() { starter = 3 - starter; },
  });
})();
