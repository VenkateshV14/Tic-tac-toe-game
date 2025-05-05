let player1 = '';
let player2 = '';
let isSinglePlayer = true;
let currentPlayer = "X";
let botSymbol = "O";
let gameState = Array(9).fill("");
let gameActive = true;

let totalRounds = 1;
let currentRound = 0;
let wins = { X: 0, O: 0 };
let seriesMode = false;

import config from './config.js';
const { BOT } = config;
const { DB } = config;
const I18N_API = config.LANG;

async function updateLanguageUI(lang) {
  try {
    const res = await fetch(`${I18N_API}/translations?lang=${lang}`);
    const t = await res.json();
    document.getElementById('startGameLabel').textContent = t.startGame;
    document.getElementById('labelSingle').textContent = t.single;
    document.getElementById('labelTwo').textContent = t.two;
    document.getElementById('player1Name').placeholder = t.p1;
    document.getElementById('player2Name').placeholder = t.p2;
  } catch (err) {
    console.error("Translation fetch failed:", err);
  }
}

function updateNameFields() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const player2Container = document.getElementById('player2Container');
  const player2Input = document.getElementById('player2Name');
  if (mode === 'single') {
    player2Container.style.display = 'none';
    player2Input.required = false;
  } else {
    player2Container.style.display = 'block';
    player2Input.required = true;
  }
}

document.getElementById('startGameBtn').addEventListener('click', () => {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const name1 = document.getElementById('player1Name').value.trim();
  const name2 = document.getElementById('player2Name').value.trim();
  const roundValue = parseInt(document.getElementById('roundMode')?.value || '1');
  
  isSinglePlayer = (mode === 'single');

  if (!name1 || (!isSinglePlayer && !name2)) {
    alert("Please enter required player name(s)!");
    return;
  }

  player1 = name1;
  player2 = isSinglePlayer ? "Peter (Bot)" : name2;

  document.getElementById('player1Name').value = '';
  document.getElementById('player2Name').value = '';
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  document.getElementById("langContainer").style.display = "none";
  
  // Add this line to hide the heading
  document.querySelector('h1').style.display = 'none';
  document.body.classList.add('game-started');
  document.querySelector('h1').style.display = 'none';

  startGame();
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.body.classList.remove('game-started');
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
  document.getElementById("langContainer").style.display = "flex";
  document.getElementById('roundMode').value = "1";
  
  // Add this line to show the heading again
  document.querySelector('h1').style.display = 'block';
  resetGame();
});


document.getElementById('popupRestartBtn').addEventListener('click', () => {
  document.getElementById('popup').classList.add('hidden');
  wins = { X: 0, O: 0 };
  currentRound = 0;
  currentPlayer = "X";
  startGame();
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
  resetGame();
  document.getElementById('playAgainBtn').classList.add('hidden');
});

document.getElementById('languageSelect').addEventListener('change', (e) => {
  updateLanguageUI(e.target.value);
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', updateNameFields);
});

document.getElementById('roundMode').addEventListener('change', () => {
  wins = { X: 0, O: 0 };
  currentRound = 0;
  currentPlayer = "X";
  startGame();
});

function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  gameState.forEach((cell, index) => {
    const cellDiv = document.createElement("div");
    cellDiv.classList.add("cell");
    if (cell === "X") cellDiv.classList.add("x");
    if (cell === "O") cellDiv.classList.add("o");
    cellDiv.textContent = cell;

    if (gameActive && cell === "") {
      cellDiv.addEventListener("click", () => {
        handleCellClick(index);
        cellDiv.classList.add("clicked");
      });
    }

    board.appendChild(cellDiv);
  });

  updateGameStatus();
}

document.getElementById("clearHistoryBtn").addEventListener("click", async () => {
  if (confirm("Are you sure you want to clear all game history?")) {
    try {
      await fetch(`${DB}/clear-history`, {
        method: "DELETE"
      });
      document.getElementById("historyList").innerHTML = "<li>History cleared.</li>";
    } catch (err) {
      alert("Failed to clear history");
      console.error("Clear history failed:", err);
    }
  }
});

function updateGameStatus() {
  const status = document.getElementById("gameStatus");
  
  if (!seriesMode) {
    // Single game mode display
    status.textContent = `${player1} (X) vs ${player2} (O)`;
  } else {
    // Series mode display
    const roundDisplay = currentRound >= totalRounds ? 
      "Series Complete" : 
      `Round ${Math.min(currentRound + 1, totalRounds)} of ${totalRounds}`;
    
    status.textContent = 
      `${roundDisplay} — ${player1} (X): ${wins.X} | ${player2} (O): ${wins.O}`;
    
    // Debug output to verify in console
    console.log("Score Update:", {
      round: currentRound + 1,
      totalRounds: totalRounds,
      player1: wins.X,
      player2: wins.O
    });
  }
}

function handleCellClick(index) {
  if (!gameActive || gameState[index] !== "") return;

  gameState[index] = currentPlayer;
  renderBoard();

  if (checkWin()) return;
  if (!gameState.includes("")) return declareDraw();

  currentPlayer = currentPlayer === "X" ? "O" : "X";

  if (isSinglePlayer && currentPlayer === botSymbol && gameActive) {
    setTimeout(botMove, 300);
  }
}

function botMove() {
  fetch(`${BOT}/bot-move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ board: gameState })
  })
    .then(res => res.json())
    .then(data => {
      const move = data.move;
      if (move !== -1 && gameState[move] === "") {
        gameState[move] = botSymbol;
        renderBoard();

        if (checkWin()) return;
        if (!gameState.includes("")) {
          declareDraw();
          return;
        }

        currentPlayer = botSymbol === "X" ? "O" : "X";
      }
    })
    .catch(err => console.error("Bot move failed:", err));
}

function getHumanPlayerSymbol() {
  if (!isSinglePlayer) return null;
  return player1 === "Peter (Bot)" ? "O" : "X";
}

// Here's the corrected showSeriesResult function
function showSeriesResult() {
  const humanSymbol = isSinglePlayer ? getHumanPlayerSymbol() : null;
  let message;
  let winner;

  if (wins.X > wins.O) {
    message = isSinglePlayer
      ? (humanSymbol === "X" ? "You Won the Series!" : "You Lost the Series!")
      : `${player1} wins the series!`;
    winner = "X";
  } else if (wins.O > wins.X) {
    message = isSinglePlayer
      ? (humanSymbol === "O" ? "You Won the Series!" : "You Lost the Series!")
      : `${player2} wins the series!`;
    winner = "O";
  } else {
    message = "Series Ended in Draw!";
    winner = "Draw";
  }

  document.getElementById("popupMessage").textContent = message;
  document.getElementById("popup").classList.remove("hidden");
  saveResultToDB(winner === "X" ? player1 : (winner === "O" ? player2 : "Draw"));
  
  // Disable game controls
  gameActive = false;
  document.getElementById('swapBtn').disabled = true;
  document.getElementById('restartBtn').disabled = true;
}
function checkWin() {
  const patterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let [a,b,c] of patterns) {
    if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
      drawWinLine([a,b,c]);
      gameActive = false;
      launchConfetti();

      wins[currentPlayer]++;
      updateGameStatus();

      if (!seriesMode) {
        // Single game mode
        if (isSinglePlayer) {
          const humanSymbol = getHumanPlayerSymbol();
          document.getElementById("popupMessage").textContent = 
            currentPlayer === humanSymbol ? "Congratulations! You Won!" : "You Lost!";
        } else {
          document.getElementById("popupMessage").textContent = 
            `${currentPlayer === "X" ? player1 : player2} wins!`;
        }
        document.getElementById("popup").classList.remove("hidden");
        saveResultToDB(currentPlayer === "X" ? player1 : player2);
      } else {
        // Series mode
        currentRound++;
        const neededToWin = Math.ceil(totalRounds / 2);

        if (wins[currentPlayer] >= neededToWin || currentRound >= totalRounds) {
          showSeriesResult();
          return true;
        }

        setTimeout(() => nextRound(), 1200);
      }
      return true;
    }
  }
  return false;
}

function declareDraw() {
  gameActive = false;
  
  if (seriesMode) {
    currentRound++;
    if (currentRound >= totalRounds) {
      showSeriesResult();
    } else {
      setTimeout(() => nextRound(), 1200);
    }
  } else {
    document.getElementById("popupMessage").textContent = "It's a Draw!";
    document.getElementById("popup").classList.remove("hidden");
    saveResultToDB("Draw");
  }
}


function nextRound() {
  gameState = Array(9).fill("");
  currentPlayer = "X";
  gameActive = true;
  renderBoard();
  document.getElementById("winLine").innerHTML = "";
  updateGameStatus();

  if (isSinglePlayer && currentPlayer === botSymbol) {
    setTimeout(botMove, 300);
  }
}

function drawWinLine([start, , end]) {
  const board = document.getElementById("board");
  const cells = board.querySelectorAll(".cell");
  const winLineContainer = document.getElementById("winLine");

  // Clear any existing win line
  winLineContainer.innerHTML = "";

  const startCell = cells[start];
  const endCell = cells[end];

  // Get positions relative to the winLineContainer
  const containerRect = winLineContainer.getBoundingClientRect();
  const startRect = startCell.getBoundingClientRect();
  const endRect = endCell.getBoundingClientRect();

  // Calculate positions relative to the container
  const x1 = startRect.left - containerRect.left + startRect.width / 2;
  const y1 = startRect.top - containerRect.top + startRect.height / 2;
  const x2 = endRect.left - containerRect.left + endRect.width / 2;
  const y2 = endRect.top - containerRect.top + endRect.height / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  const line = document.createElement("div");
  line.classList.add("win-line");
  line.style.width = `${length}px`;
  line.style.left = `${x1}px`;
  line.style.top = `${y1}px`;
  line.style.transform = `rotate(${angle}deg)`;
  line.style.transformOrigin = "0 50%";

  winLineContainer.appendChild(line);
}

function launchConfetti() {
  if (window.confetti) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
}

function startGame() {
  const roundValue = parseInt(document.getElementById('roundMode')?.value || '1');
  
  seriesMode = roundValue > 1;
  totalRounds = roundValue;
  currentRound = 0;
  wins = { X: 0, O: 0 };
  currentPlayer = "X";
  gameState = Array(9).fill("");
  gameActive = true;

  // Re-enable all controls
  document.getElementById('swapBtn').disabled = false;
  document.getElementById('restartBtn').disabled = false;

  if (isSinglePlayer) {
    botSymbol = player1 === "Peter (Bot)" ? "X" : "O";
  }

  renderBoard();
  document.getElementById("winLine").innerHTML = "";
  document.getElementById("playAgainBtn").classList.add("hidden");
  document.getElementById("popup").classList.add("hidden");

  if (isSinglePlayer && currentPlayer === botSymbol) {
    setTimeout(botMove, 300);
  }
}

function resetGame() {
  startGame();
  document.getElementById("popup").classList.add("hidden");
  document.getElementById("winLine").innerHTML = "";
  document.getElementById("confetti")?.remove();
}

window.onload = function () {
  updateNameFields();
  updateLanguageUI(document.getElementById('languageSelect').value);
};

function isSeriesComplete() {
  return seriesMode && 
    (currentRound >= totalRounds || 
     wins.X > Math.floor(totalRounds / 2) || 
     wins.O > Math.floor(totalRounds / 2));
}

// Disable swap button when series is over
document.getElementById('swapBtn').disabled = seriesMode && currentRound >= totalRounds;
document.getElementById('swapBtn').addEventListener('click', () => {
  // Don't allow swap if series is complete
  if (isSeriesComplete()) {
    alert("Series is already completed! Click 'Play Again' to start new game.");
    return;
  }
  
  [player1, player2] = [player2, player1];
  [wins.X, wins.O] = [wins.O, wins.X];

  currentPlayer = "X";
  gameState = Array(9).fill("");
  gameActive = true;

  if (isSinglePlayer) {
    botSymbol = player1 === "Peter (Bot)" ? "X" : "O";
  }

  renderBoard();
  document.getElementById("winLine").innerHTML = "";
  updateGameStatus();

  if (isSinglePlayer && currentPlayer === botSymbol) {
    setTimeout(botMove, 300);
  }
});

document.getElementById('restartBtn').addEventListener('click', () => {
  wins = { X: 0, O: 0 };
  currentRound = 0;
  currentPlayer = "X";
  gameState = Array(9).fill("");
  gameActive = true;

  document.getElementById("popup").classList.add("hidden");
  document.getElementById("playAgainBtn").classList.add("hidden");
  document.getElementById("winLine").innerHTML = "";
  renderBoard();

  if (isSinglePlayer && currentPlayer === botSymbol) {
    setTimeout(botMove, 300);
  }
});

document.getElementById("historyBtn").addEventListener("click", async () => {
  try {
    const res = await fetch(`${DB}/history`);
    const data = await res.json();
    const historyList = document.getElementById("historyList");

    historyList.innerHTML = data.length
      ? data.map(entry => {
          const modeLabel = entry.series_mode === 1 ? "Normal Mode" : `Best of ${entry.series_mode}`;
          return `<li><strong>${entry.winner}</strong> (${modeLabel})</li>`;
        }).join("")
      : "<li>No results found.</li>";

    document.getElementById("historyPopup").classList.remove("hidden");
  } catch (err) {
    alert("Failed to load history.");
    console.error(err);
  }
});
document.getElementById('closeHistoryBtn').addEventListener('click', closeHistory);
function closeHistory() {
  document.getElementById("historyPopup").classList.add("hidden");
}

// Close popup when clicking outside the content
document.getElementById("historyPopup").addEventListener("click", function(e) {
  if (e.target === this) {
    closeHistory();
  }
});

async function saveResultToDB(winner) {
  const payload = {
    player1_name: player1,
    player2_name: player2,
    winner: winner,
    series_mode: seriesMode ? totalRounds : 1,
    rounds_played: currentRound,
    score_x: wins.X,
    score_o: wins.O
  };

  console.log("SAVING TO DB:", payload);  

  try {
    await fetch(`${DB}/save-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Failed to save result:", err);
  }
}
