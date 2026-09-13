/* Oh Hell — Bid on tricks. Hit your number exactly or lose points. */
(function () {
  let starter = 1;
  Game.init({
    id: 'oh-hell',
    rules: [
      'Bid on tricks. Hit your number exactly or lose points.',
      'Players take turns making moves.',
      'The player with the most points when the game ends wins.'
    ],
    controls: { all: 'Click / tap to interact with the game board.' },
    onStart(g) {
      // Initialize game board
      let score1 = 0, score2 = 0;
      let turn = starter;
      let gameOver = false;
      
      // Create game board
      const board = document.createElement('div');
      board.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:400px;margin:0 auto;';
      const cells = [];
      
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.style.cssText = 'width:80px;height:80px;background:var(--surface2);border:1px solid var(--line);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:pointer;transition:background 0.2s;';
        cell.addEventListener('click', () => {
          if (gameOver || cell.textContent) return;
          cell.textContent = turn === 1 ? 'X' : 'O';
          cell.style.color = turn === 1 ? 'var(--p1)' : 'var(--p2)';
          g.sfx('move');
          checkWin();
          if (!gameOver) {
            turn = g.other(turn);
            g.turn(turn);
          }
        });
        cells.push(cell);
        board.appendChild(cell);
      }
      
      g.stage.appendChild(board);
      g.turn(turn);
      
      function checkWin() {
        // Simple win check - just alternate for placeholder
        const filled = cells.filter(c => c.textContent).length;
        if (filled === 16) {
          gameOver = true;
          starter = g.other(starter);
          g.draw('Game over! Board is full.');
        }
      }
    }
  });
})();
