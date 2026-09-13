#!/bin/bash
# Generate placeholder game pages for new games
GAMES_DIR="/home/user/2PGame/games"

# All new game IDs that need pages
NEW_GAMES=(
  # Extra turn-based board
  reversi-blitz tile-domination square-off four-corners leap-frog
  tower-stacker grid-lock arrow-maze gem-collector fortress
  star-battle slither path-finder sos dots-extreme square-tactics
  territory diagonals hex-a-gone quantum-tic-tac-toe
  # Extra turn-based sports
  ring-toss archery disc-golf horseshoes bean-bag-toss
  shuffleboard crokinole carrom golf-putt bocce-balls
  axe-throw slingshot frisbee-golf billiards-9ball
  # Extra turn-based cards
  dominoes yahtzee ship-captain-crew drop-dead beetle
  fives-dice threes-dice balut liars-poker rummy
  cribbage euchre oh-hell gin-rummy fifty-one sequence
  sushi-go love-letter coup no-thanks
  # Extra turn-based brain
  sudoku-duel crossword-clash word-chain math-duel cipher-break
  memory-maze pattern-panic trivia-clash word-search-race
  equation-builder quick-math anagram-battle odd-or-even
  higher-or-lower-showdown emoji-guess
  # Extra pass-the-device
  poker-showdown gin-rummy-pass spades hearts president
  war-pass memory-theft guess-the-number-pass odd-one-out-pass
  password twenty-questions charades pictionary-pass
  name-that-tune story-builder would-you-rather
  tic-tac-toe-blind connect-four-blind chess-blind dominoes-pass
)

for game_id in "${NEW_GAMES[@]}"; do
  dir="$GAMES_DIR/$game_id"
  mkdir -p "$dir"
  
  # Get game info from games.js
  info=$(grep "{ id: '$game_id'" /home/user/2PGame/assets/js/games.js)
  title=$(echo "$info" | grep -oP "title: '\K[^']*")
  emoji=$(echo "$info" | grep -oP "emoji: '\K[^']*")
  desc=$(echo "$info" | grep -oP "desc: '\K[^']*")
  mode=$(echo "$info" | grep -oP "mode: '\K[^']*")
  
  # Create index.html
  cat > "$dir/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="$desc — a local 2-player game from 2PGame.">
<meta name="theme-color" content="#0e1020">
<title>$title — 2PGame</title>
<link rel="stylesheet" href="../../assets/css/base.css">
</head>
<body>
<script src="../../assets/js/games.js"></script>
<script src="../../assets/js/core.js"></script>
<script src="game.js"></script>
</body>
</html>
EOF

  # Create game.js based on mode
  if [ "$mode" = "turn" ]; then
    cat > "$dir/game.js" << EOF
/* $title — $desc */
(function () {
  let starter = 1;
  Game.init({
    id: '$game_id',
    rules: [
      '$desc',
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
EOF
  elif [ "$mode" = "pass" ]; then
    cat > "$dir/game.js" << EOF
/* $title — $desc */
(function () {
  let starter = 1;
  Game.init({
    id: '$game_id',
    rules: [
      '$desc',
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
EOF
  else
    cat > "$dir/game.js" << EOF
/* $title — $desc */
(function () {
  Game.init({
    id: '$game_id',
    rules: [
      '$desc',
      'Race against your opponent!',
      'First to the goal wins.'
    ],
    controls: { all: 'Click / tap to interact.' },
    onStart(g) {
      // Simple race game placeholder
      const board = document.createElement('div');
      board.style.cssText = 'text-align:center;padding:2rem;';
      board.innerHTML = '<h2>$emoji $title</h2><p style="color:var(--muted)">$desc</p>';
      g.stage.appendChild(board);
    }
  });
})();
EOF
  fi
done

echo "Generated placeholder pages for ${#NEW_GAMES[@]} games"
