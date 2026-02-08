document.addEventListener("DOMContentLoaded", () => {
  const menuScreen = document.getElementById("menuScreen");
  const gameScreen = document.getElementById("gameScreen");

  const startBtn = document.getElementById("startBtn");

  const boardElement = document.getElementById("board");
  const difficultyDisplay = document.getElementById("difficultyDisplay");
  const hintBtn = document.getElementById("hintBtn");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");
  const menuBtn = document.getElementById("menuBtn");

  const winOverlay = document.getElementById("winOverlay");
  const winNextBtn = document.getElementById("winNextBtn");
  const winMenuBtn = document.getElementById("winMenuBtn");

  if (!menuScreen || !gameScreen || !boardElement || !difficultyDisplay || !winOverlay) {
    alert("Missing required HTML elements. Make sure you pasted the full HTML.");
    return;
  }

  const Solutions = [
    "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    "168724593493586172725193648836459217957218364241637985374862859582971436619345728",
    "512493687364875219789216435435728961921564783876349152257681394198432576643957821",
    "265813974934765821817249356348972561592631748756184293183526749429357618671498325",
    "859627431172843965643591728237468159496152873581739642364975281928316547715284396",
    "417683925682579143953421768768915234521346879349867512175234689234198756896752341",
    "746258314138679528254136793976854215847219636129347854785123962314965789563782147",
    "827369541695487231413256789736895124524173968981624375251736894368942715149578623",
    "573964128469182375128375964836459217957218436241637985384526791719843652642791853",
    "217589364469317528853624791784263915926157843531849672648975231175432986392768415"
  ];

  const DIFFICULTY_BLANKS = { Easy: 40, Medium: 48, Hard: 54, Expert: 58 };

  let selectedDifficulty = "Easy";
  let puzzleCount = 0;
  let currentPuzzle = null;
  let selectedTile = null;
  let isSolved = false;

  function mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function difficultySeedBase(diff) {
    if (diff === "Easy") return 1000;
    if (diff === "Medium") return 2000;
    if (diff === "Hard") return 3000;
    return 4000;
  }

  function generatePuzzleFromSolution(solution, blanks, seed) {
    const rng = mulberry32(seed);
    const chars = solution.split("");

    const indices = Array.from({ length: 81 }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    indices.slice(0, Math.min(blanks, 81)).forEach(idx => {
      chars[idx] = "-";
    });

    return chars.join("");
  }

  function showMenu() {
    hideWinOverlay();
    gameScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
    selectedTile = null;
    isSolved = false;
  }

  function showGame() {
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
  }

  function getPickedDifficulty() {
    const checked = document.querySelector('input[name="difficulty"]:checked');
    return checked ? checked.value : "Easy";
  }

  function startGame() {
    selectedDifficulty = getPickedDifficulty();
    puzzleCount = 0;
    showGame();
    loadNextPuzzle();
  }

  function loadNextPuzzle() {
    hideWinOverlay();
    isSolved = false;
    selectedTile = null;

    puzzleCount += 1;

    const blanks = DIFFICULTY_BLANKS[selectedDifficulty] ?? 48;
    const solution = Solutions[(puzzleCount - 1) % Solutions.length];
    const seed = difficultySeedBase(selectedDifficulty) + puzzleCount * 999;

    currentPuzzle = {
      solution,
      puzzle: generatePuzzleFromSolution(solution, blanks, seed)
    };

    difficultyDisplay.textContent = `Difficulty: ${selectedDifficulty}`;
    initializeBoard();
  }

  function initializeBoard() {
    boardElement.innerHTML = "";

    const initialBoard = currentPuzzle.puzzle;
    if (!initialBoard || initialBoard.length !== 81) {
      alert("Puzzle failed to load (not 81).");
      return;
    }

    for (let i = 0; i < 81; i++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.dataset.index = String(i);

      if (initialBoard[i] !== "-") {
        tile.innerText = initialBoard[i];
        tile.classList.add("fixed");
      } else {
        tile.innerText = "";
      }

      tile.addEventListener("click", () => {
        if (isSolved) return;
        if (tile.classList.contains("fixed")) return;

        if (selectedTile) selectedTile.classList.remove("selected");
        selectedTile = tile;
        tile.classList.add("selected");
      });

      boardElement.appendChild(tile);
    }
  }

  function clearSelected() {
    if (isSolved) return;
    if (!selectedTile) return;
    if (selectedTile.classList.contains("fixed")) return;

    selectedTile.innerText = "";
    selectedTile.classList.remove("error");
  }

  function setSelectedValue(val) {
    if (isSolved) return;
    if (!selectedTile) return;
    if (selectedTile.classList.contains("fixed")) return;

    selectedTile.classList.remove("error");
    selectedTile.innerText = val;
  }

  function submitCheck() {
    if (isSolved) return;

    const tiles = document.querySelectorAll(".tile");
    let anyWrong = false;
    let anyEmpty = false;

    for (let i = 0; i < 81; i++) {
      const tile = tiles[i];
      if (tile.classList.contains("fixed")) continue;

      const val = tile.innerText.trim();
      tile.classList.remove("error");

      if (val === "") {
        anyEmpty = true;
        continue;
      }

      const correct = currentPuzzle.solution[i];
      if (val !== correct) {
        anyWrong = true;
        tile.classList.add("error");
        tile.innerText = "";
      }
    }

    if (!anyWrong && !anyEmpty) {
      isSolved = true;
      showWinOverlay();
    }
  }

  function showWinOverlay() {
    winOverlay.classList.remove("hidden");
  }

  function hideWinOverlay() {
    winOverlay.classList.add("hidden");
  }

  function showEasiest() {
    if (isSolved) return;

    document.querySelectorAll(".tile").forEach(t => t.classList.remove("hint"));

    const tiles = document.querySelectorAll(".tile");
    let maxNeighbors = -1;
    let easiestIndex = -1;

    for (let i = 0; i < 81; i++) {
      if (tiles[i].innerText !== "") continue;

      const row = Math.floor(i / 9);
      const col = i % 9;
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;

      const neighbors = new Set();

      for (let j = 0; j < 9; j++) {
        if (tiles[row * 9 + j].innerText !== "") neighbors.add(row * 9 + j);
        if (tiles[j * 9 + col].innerText !== "") neighbors.add(j * 9 + col);
      }

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = (boxRow + r) * 9 + (boxCol + c);
          if (tiles[idx].innerText !== "") neighbors.add(idx);
        }
      }

      if (neighbors.size > maxNeighbors) {
        maxNeighbors = neighbors.size;
        easiestIndex = i;
      }
    }

    if (easiestIndex !== -1) tiles[easiestIndex].classList.add("hint");
  }

  document.addEventListener("keydown", (e) => {
    if (gameScreen.classList.contains("hidden")) return;
    if (!winOverlay.classList.contains("hidden")) return;

    if (e.key >= "1" && e.key <= "9") setSelectedValue(e.key);
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") clearSelected();
    if (e.key === "Enter") submitCheck();
  });

  document.querySelectorAll(".pad-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (gameScreen.classList.contains("hidden")) return;
      if (!winOverlay.classList.contains("hidden")) return;

      const num = btn.dataset.num;
      const action = btn.dataset.action;

      if (action === "clear") clearSelected();
      if (num) setSelectedValue(num);
    });
  });

  startBtn.addEventListener("click", startGame);
  hintBtn.addEventListener("click", showEasiest);
  submitBtn.addEventListener("click", submitCheck);
  nextBtn.addEventListener("click", loadNextPuzzle);
  menuBtn.addEventListener("click", showMenu);

  winNextBtn.addEventListener("click", loadNextPuzzle);
  winMenuBtn.addEventListener("click", showMenu);

  showMenu();
});