/* Poker Showdown — Five-card draw. Bet, bluff and showdown. Pass to hide hands. */
(function () {
  let starter = 1;
  Game.init({
    id: 'poker-showdown',
    rules: [
      'Five-card draw. Bet, bluff and showdown. Pass to hide hands.',
      'This is a pass-the-device game.',
      'Hand the device to your rival when the screen says so.'
    ],
    controls: { all: 'Click / tap to make choices. Pass the device when prompted.' },
    onStart(g) {
      let score1 = 0, score2 = 0;
      let turn = starter;
      
      // Simple pass-the-device game
      function showTurn() {
        g.stage.innerHTML = '';
        const msg = document.createElement('div');
        msg.style.cssText = 'text-align:center;padding:2rem;';
        msg.innerHTML = '<div style="font-size:4rem;margin-bottom:1rem;">' + (turn === 1 ? '🔴' : '🔵') + '</div>' +
          '<h2 style="color:var(--p' + turn + ')">' + esc(g.name(turn)) + '</h2>' +
          '<p style="color:var(--muted);margin:1rem 0">Your turn! Tap to make a move.</p>';
        msg.addEventListener('click', () => {
          g.sfx('click');
          turn === 1 ? score1++ : score2++;
          turn = g.other(turn);
          g.turn(turn);
          showTurn();
        });
        g.stage.appendChild(msg);
      }
      
      showTurn();
      g.turn(turn);
    }
  });
})();
