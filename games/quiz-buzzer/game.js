/* Quiz Buzzer — trivia; buzz in first, then answer; wrong answer hands it to the opponent. */
(function () {
  const Q = [
    ['What is the largest planet in our solar system?', ['Jupiter', 'Saturn', 'Neptune', 'Earth'], 0],
    ['How many sides does a hexagon have?', ['5', '6', '7', '8'], 1],
    ['Which element has the chemical symbol O?', ['Gold', 'Osmium', 'Oxygen', 'Iron'], 2],
    ['What is the capital of Japan?', ['Kyoto', 'Osaka', 'Seoul', 'Tokyo'], 3],
    ['How many minutes are in a full day?', ['1440', '1200', '3600', '2400'], 0],
    ['Which ocean is the largest?', ['Atlantic', 'Pacific', 'Indian', 'Arctic'], 1],
    ['What gas do plants absorb from the air?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], 2],
    ['Who painted the Mona Lisa?', ['Michelangelo', 'Raphael', 'Donatello', 'Leonardo da Vinci'], 3],
    ['What is 12 × 12?', ['144', '124', '132', '148'], 0],
    ['Which is the smallest prime number?', ['1', '2', '3', '0'], 1],
    ['What is the hardest natural substance?', ['Steel', 'Quartz', 'Diamond', 'Granite'], 2],
    ['How many continents are there?', ['5', '6', '8', '7'], 3],
    ['What is H2O commonly called?', ['Water', 'Salt', 'Sugar', 'Acid'], 0],
    ['Which animal is the largest mammal?', ['Elephant', 'Blue whale', 'Giraffe', 'Hippo'], 1],
    ['In which sport is "love" a score?', ['Golf', 'Cricket', 'Tennis', 'Rugby'], 2],
    ['How many bones are in the adult human body?', ['186', '256', '212', '206'], 3],
    ['What is the square root of 81?', ['9', '8', '7', '11'], 0],
    ['Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Mercury', 'Jupiter'], 1],
    ['How many strings does a standard guitar have?', ['4', '5', '6', '7'], 2],
    ['What is the longest river in Africa?', ['Congo', 'Niger', 'Zambezi', 'Nile'], 3],
    ['Which language has the most native speakers?', ['Mandarin Chinese', 'English', 'Spanish', 'Hindi'], 0],
    ['What is the boiling point of water at sea level in °C?', ['90', '100', '110', '120'], 1],
    ['Which instrument has 88 keys?', ['Organ', 'Accordion', 'Piano', 'Harp'], 2],
    ['How many players are on a soccer team on the field?', ['9', '10', '12', '11'], 3],
    ['What is the currency of the United Kingdom?', ['Pound', 'Euro', 'Dollar', 'Franc'], 0],
    ['Which shape has all sides equal and all angles 90°?', ['Rectangle', 'Square', 'Rhombus', 'Trapezoid'], 1],
    ['What year did the first human land on the Moon?', ['1959', '1965', '1969', '1972'], 2],
    ['Which bird is the fastest in a dive?', ['Eagle', 'Swift', 'Albatross', 'Peregrine falcon'], 3],
    ['How many degrees are in a triangle\'s angles combined?', ['180', '360', '90', '270'], 0],
    ['What is the chemical symbol for gold?', ['Gd', 'Au', 'Ag', 'Go'], 1],
  ];
  const ROUNDS = 10;
  Game.init({
    id: 'quiz-buzzer',
    rules: ['A question appears with four answers. Buzz in first to answer!', 'Correct: +1. Wrong: −1 and the other player may answer. If the timer runs out, nobody scores.', `${ROUNDS} questions; highest score wins.`],
    controls: { p1: '<kbd>Q</kbd> buzz · <kbd>1</kbd>–<kbd>4</kbd> answer', p2: '<kbd>P</kbd> buzz · <kbd>7 8 9 0</kbd> answer' },
    points: true,
    pad: [{ side: 1, buttons: [{ code: 'KeyQ', label: 'BUZZ', huge: true }] }, { side: 2, buttons: [{ code: 'KeyP', label: 'BUZZ', huge: true }] }],
    onStart(g) {
      const score = { 1: 0, 2: 0 }; const qs = shuffle(Q.slice()).slice(0, ROUNDS); let i = -1, buzzer = 0, tried = {}, timer = null, tleft = 0, phase = 'idle';
      const qEl = h('div', { class: 'panel', style: { fontSize: '1.25rem', maxWidth: '680px', textAlign: 'center', fontWeight: 600 } });
      const ans = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: '.5rem', width: 'min(640px,100%)' } });
      const bar = h('div', { class: 'bar' }, h('i', { style: { width: '100%' } })); const msg = h('div', { class: 'bigmsg', style: { fontSize: '1.1rem' } });
      const buzzRow = h('div', { class: 'row' }, h('button', { class: 'btn big p1', text: `🔔 ${g.name(1)} (Q)`, onclick: () => buzz(1) }), h('button', { class: 'btn big p2', text: `🔔 ${g.name(2)} (P)`, onclick: () => buzz(2) }));
      g.stage.append(qEl, ans, bar, msg, buzzRow);
      g.key('KeyQ', () => buzz(1)); g.key('KeyP', () => buzz(2));
      g.key(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit7', 'Digit8', 'Digit9', 'Digit0'], (c) => { const d = +c.slice(-1); if (d >= 1 && d <= 4) answer(1, d - 1); else answer(2, [7, 8, 9, 0].indexOf(d)); });
      const renderAns = () => { ans.innerHTML = ''; qs[i][1].forEach((a, k) => ans.appendChild(h('button', { class: 'btn big', html: `${'ABCD'[k]}. ${esc(a)} <small class="muted">${k + 1}/${[7, 8, 9, 0][k]}</small>`, disabled: phase !== 'answer', onclick: () => buzzer && answer(buzzer, k) }))); };
      function next() {
        if (g.over) return; i++; if (i >= ROUNDS) return finish();
        buzzer = 0; tried = {}; phase = 'buzz'; qEl.textContent = `Q${i + 1}. ${qs[i][0]}`; msg.textContent = 'Buzz in!'; renderAns(); g.status(`Question ${i + 1}/${ROUNDS}`);
        startTimer(8, () => { msg.textContent = `Time! It was ${qs[i][1][qs[i][2]]}.`; phase = 'idle'; g.sfx('bad'); g.after(1400, next); });
      }
      function startTimer(sec, onEnd) { g.cancel(timer); tleft = sec; bar.firstChild.style.width = '100%'; timer = g.every(100, () => { tleft -= 0.1; bar.firstChild.style.width = Math.max(0, tleft / sec * 100) + '%'; if (tleft <= 0) { g.cancel(timer); onEnd(); } }); }
      function buzz(p) {
        if (phase !== 'buzz' || tried[p] || g.over) return; buzzer = p; phase = 'answer'; g.sfx('go'); msg.innerHTML = `<span class="pc${p}">${esc(g.name(p))}</span> buzzed — answer!`; renderAns();
        startTimer(5, () => { msg.textContent = `Too slow!`; score[p]--; g.points(score[1], score[2]); passOn(p); });
      }
      function answer(p, k) {
        if (phase !== 'answer' || p !== buzzer || g.over) return; g.cancel(timer);
        if (k === qs[i][2]) { score[p]++; g.sfx('score'); msg.innerHTML = `✅ Correct! <span class="pc${p}">${esc(g.name(p))}</span> +1`; phase = 'idle'; g.points(score[1], score[2]); renderAns(); g.after(1300, next); }
        else { score[p]--; g.sfx('bad'); msg.innerHTML = `❌ Wrong, <span class="pc${p}">${esc(g.name(p))}</span> −1`; g.points(score[1], score[2]); passOn(p); }
      }
      function passOn(p) {
        tried[p] = true; buzzer = 0; const o = 3 - p;
        if (tried[o]) { phase = 'idle'; renderAns(); msg.textContent += ` It was ${qs[i][1][qs[i][2]]}.`; return g.after(1400, next); }
        phase = 'buzz'; renderAns(); msg.innerHTML += ` — <span class="pc${o}">${esc(g.name(o))}</span> may buzz.`;
        startTimer(6, () => { msg.textContent = `No buzz. It was ${qs[i][1][qs[i][2]]}.`; phase = 'idle'; g.after(1400, next); });
      }
      function finish() { if (score[1] === score[2]) return g.draw(`${score[1]} points each.`); const w = score[1] > score[2] ? 1 : 2; g.win(w, `${score[w]} – ${score[3 - w]}.`); }
      g.points(0, 0); g.after(500, next);
    },
  });
})();
