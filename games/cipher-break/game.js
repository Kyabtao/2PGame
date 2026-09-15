/* Cipher Break — Caesar words on the wire: encode to sting, decode to survive. */
(function () {
  const WORDS = ['CASTLE', 'DRAGON', 'MARKET', 'FOREST', 'WIZARD', 'ISLAND', 'MONKEY', 'PLANET', 'PUZZLE', 'ROCKET', 'SILVER', 'TEMPLE', 'VIOLET', 'GARDEN', 'ORANGE', 'FROZEN', 'SUNSET', 'HAMLET', 'PIRATE', 'MIRROR'];
  const ROUNDS = 4;
  let starter = 1;
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const caesar = (w, k) => w.split('').map((ch) => alpha[(alpha.indexOf(ch) + k) % 26]).join('');
  Game.init({
    id: 'cipher-break',
    rules: [
      'Four cipher cycles. In each half-round one player picks a word (secretly from five), the engine shifts it through a random Caesar key, and the rival sees only the scrambled letters.',
      'The breaker picks from four plain-word candidates: right call +2, and they see the key. If they fluff it, the encoder banks +2 and reveals the shift.',
      'Picking a word is safe: it can never be your own candidate list — the engine makes sure the decoys are other words.',
      'Eight half-boards in all; most points cracks the case.',
    ],
    controls: { all: 'Encoder: tap the word · Breaker: tap a candidate' },
    points: true,
    onStart(g) {
      const pts = { 1: 0, 2: 0 };
      let half = 0, phase = 'choose', word = null, key = 0, cands = [], over = false;
      const wrap = h('div', { class: 'col', style: { width: '100%' } }); g.stage.appendChild(wrap);
      const info = h('div', { class: 'bigmsg' });
      const cipher = h('div', { class: 'bigmsg', style: { fontSize: '1.6rem', letterSpacing: '.2em', fontFamily: 'monospace', wordBreak: 'break-all' } });
      const optRow = h('div', { class: 'row wrap', style: { justifyContent: 'center' } });
      const stat = UI.stats([{ key: 'a', label: g.name(1), val: 0 }, { key: 'b', label: g.name(2), val: 0 }, { key: 'h', label: 'half', val: 1 }]);
      wrap.append(info, cipher, optRow, stat.el);
      const enc = () => (half % 2 ? 3 - starter : starter);
      function nextHalf() {
        half++;
        if (half > ROUNDS * 2) return end();
        phase = 'choose'; word = null; cands = [];
        draw();
        g.sfx('tick');
      }
      function draw() {
        if (over) return;
        const e = enc(), b = 3 - e;
        info.innerHTML = `half ${half}/${ROUNDS * 2} · <b class="pc${e}">${esc(g.name(e))}</b> ${phase === 'choose' ? 'chooses the word' : `breaks · <b class="pc${b}">${esc(g.name(b))}</b> guesses`}`;
        optRow.innerHTML = '';
        if (phase === 'choose') {
          cipher.textContent = '— pick a plain word —';
          const pool = shuffle(WORDS.slice()).slice(0, 5);
          pool.forEach((w) => {
            const btn = h('button', { class: 'btn', text: w, style: { minWidth: '110px' } });
            btn.addEventListener('click', () => {
              word = w; key = 1 + Math.floor(Math.random() * 25);
              const decoys = shuffle(WORDS.filter((x) => x !== w)).slice(0, 3);
              cands = shuffle([w, ...decoys]);
              phase = 'break';
              g.sfx('coin');
              draw();
              g.turn(b, `<span class="pc${b}">${esc(g.name(b))}</span> — which word made this cipher?`);
            });
            optRow.appendChild(btn);
          });
        } else {
          cipher.textContent = caesar(word, key);
          cands.forEach((w) => {
            const btn = h('button', { class: 'btn primary', text: w, style: { minWidth: '110px' } });
            btn.addEventListener('click', () => guess(w));
            optRow.appendChild(btn);
          });
        }
        stat.set('a', pts[1]); stat.set('b', pts[2]); stat.set('h', `${Math.min(half, ROUNDS * 2)}/${ROUNDS * 2}`);
        g.points(pts[1], pts[2]);
        if (phase === 'choose') g.turn(enc(), `<span class="pc${enc()}">${esc(g.name(enc()))}</span> — feed a word to the machine`);
      }
      function guess(w) {
        const b = 3 - enc();
        if (w === word) {
          pts[b] += 2;
          g.sfx('coin'); g.toast(`cracked! shift ${key} — +2 to ${esc(g.name(b))}`, 1700);
        } else {
          pts[enc()] += 2;
          g.sfx('bad'); g.toast(`not it (${w}) — it was ${word} at shift ${key} · +2 to the encoder`, 2100);
        }
        draw();
        setTimeout(nextHalf, 1900);
      }
      function end() {
        over = true;
        starter = 3 - starter;
        g.turn();
        if (pts[1] === pts[2]) return g.draw(`Both ciphers stand unbroken at ${pts[1]}.`);
        g.win(pts[1] > pts[2] ? 1 : 2, `Case closed: ${pts[1]}–${pts[2]}.`);
      }
      nextHalf();
    },
    onStop() { starter = 3 - starter; },
  });
})();
