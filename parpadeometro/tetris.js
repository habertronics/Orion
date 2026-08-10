const COLS = 10;
const ROWS = 20;
const COLORS = {
  I: "#22d3ee",
  O: "#fbbf24",
  T: "#a78bfa",
  S: "#34d399",
  Z: "#fb7185",
  J: "#60a5fa",
  L: "#fb923c",
};

const SHAPES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

const TYPES = Object.keys(SHAPES);

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomType() {
  return TYPES[Math.floor(Math.random() * TYPES.length)];
}

export function createTetris(ui) {
  const {
    canvas,
    scoreEl,
    linesEl,
    statusEl,
    startBtn,
    pauseBtn,
    resetBtn,
    leftBtn,
    rightBtn,
    rotateBtn,
    downBtn,
    dropBtn,
  } = ui;

  const ctx = canvas.getContext("2d");
  let board = createEmptyBoard();
  let piece = null;
  let score = 0;
  let lines = 0;
  let running = false;
  let paused = false;
  let gameOver = false;
  let dropMs = 700;
  let lastDrop = 0;
  let rafId = 0;
  let cell = 24;
  let softAudio = null;

  function softBeep(freq, dur = 45, vol = 0.045) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!softAudio) softAudio = new AudioCtx();
      if (softAudio.state === "suspended") void softAudio.resume();
      const osc = softAudio.createOscillator();
      const gain = softAudio.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(softAudio.destination);
      const t0 = softAudio.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / 1000);
      osc.start(t0);
      osc.stop(t0 + dur / 1000 + 0.02);
    } catch {
      // ignore
    }
  }

  function resize() {
    const cssW = canvas.clientWidth || 260;
    cell = Math.floor(cssW / COLS);
    canvas.width = cell * COLS;
    canvas.height = cell * ROWS;
  }

  function spawn() {
    const type = randomType();
    const rotations = SHAPES[type];
    piece = {
      type,
      rotation: 0,
      matrix: rotations[0],
      x: Math.floor(COLS / 2) - Math.ceil(rotations[0][0].length / 2),
      y: 0,
    };
    if (collides(piece.x, piece.y, piece.matrix)) {
      running = false;
      gameOver = true;
      statusEl.textContent = "Game over";
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  }

  function collides(x, y, matrix) {
    for (let r = 0; r < matrix.length; r += 1) {
      for (let c = 0; c < matrix[r].length; c += 1) {
        if (!matrix[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge() {
    for (let r = 0; r < piece.matrix.length; r += 1) {
      for (let c = 0; c < piece.matrix[r].length; c += 1) {
        if (!piece.matrix[r][c]) continue;
        const ny = piece.y + r;
        const nx = piece.x + c;
        if (ny >= 0) board[ny][nx] = piece.type;
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r -= 1) {
      if (board[r].every((cellValue) => cellValue)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared += 1;
        r += 1;
      }
    }
    if (cleared) {
      lines += cleared;
      score += [0, 100, 300, 500, 800][cleared] || cleared * 200;
      dropMs = Math.max(180, 700 - lines * 18);
      linesEl.textContent = String(lines);
      scoreEl.textContent = String(score);
      softBeep(660 + cleared * 40, 70, 0.06);
    }
  }

  function hardDrop() {
    if (!piece || !running || paused || gameOver) return;
    while (!collides(piece.x, piece.y + 1, piece.matrix)) piece.y += 1;
    softBeep(380, 50, 0.04);
    lockPiece();
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
  }

  function move(dx, dy) {
    if (!piece || !running || paused || gameOver) return false;
    if (!collides(piece.x + dx, piece.y + dy, piece.matrix)) {
      piece.x += dx;
      piece.y += dy;
      if (dx !== 0) softBeep(420, 35, 0.035);
      return true;
    }
    return false;
  }

  function rotate() {
    if (!piece || !running || paused || gameOver) return;
    const rotations = SHAPES[piece.type];
    const next = (piece.rotation + 1) % rotations.length;
    const matrix = rotations[next];
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collides(piece.x + kick, piece.y, matrix)) {
        piece.rotation = next;
        piece.matrix = matrix;
        piece.x += kick;
        softBeep(520, 40, 0.04);
        return;
      }
    }
  }

  function drawCell(x, y, type, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS[type] || "#67e8f9";
    ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#083344";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(103, 232, 249, 0.08)";
    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, ROWS * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(COLS * cell, y * cell);
      ctx.stroke();
    }

    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        if (board[r][c]) drawCell(c, r, board[r][c]);
      }
    }

    if (piece) {
      for (let r = 0; r < piece.matrix.length; r += 1) {
        for (let c = 0; c < piece.matrix[r].length; c += 1) {
          if (!piece.matrix[r][c]) continue;
          const y = piece.y + r;
          const x = piece.x + c;
          if (y >= 0) drawCell(x, y, piece.type);
        }
      }
    }

    if (paused || gameOver) {
      ctx.fillStyle = "rgba(8, 51, 68, 0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ecfeff";
      ctx.font = `700 ${Math.max(16, cell)}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(gameOver ? "GAME OVER" : "PAUSA", canvas.width / 2, canvas.height / 2);
    }
  }

  function tick(now) {
    if (!running) return;
    rafId = requestAnimationFrame(tick);
    if (!paused && !gameOver && now - lastDrop >= dropMs) {
      lastDrop = now;
      if (!move(0, 1)) lockPiece();
    }
    draw();
  }

  function start() {
    resize();
    board = createEmptyBoard();
    score = 0;
    lines = 0;
    dropMs = 700;
    gameOver = false;
    paused = false;
    running = true;
    scoreEl.textContent = "0";
    linesEl.textContent = "0";
    statusEl.textContent = "Jugando";
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = "Pausa";
    spawn();
    lastDrop = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function togglePause() {
    if (!running || gameOver) return;
    paused = !paused;
    statusEl.textContent = paused ? "Pausa" : "Jugando";
    pauseBtn.textContent = paused ? "Continuar" : "Pausa";
  }

  function reset() {
    cancelAnimationFrame(rafId);
    running = false;
    paused = false;
    gameOver = false;
    board = createEmptyBoard();
    piece = null;
    score = 0;
    lines = 0;
    scoreEl.textContent = "0";
    linesEl.textContent = "0";
    statusEl.textContent = "Listo";
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = "Pausa";
    resize();
    draw();
  }

  function pauseForTabHide() {
    if (running && !paused && !gameOver) togglePause();
  }

  function onKey(event) {
    if (!running) return;
    const key = event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "p", "P"].includes(key)) {
      event.preventDefault();
    }
    if (key === "ArrowLeft") move(-1, 0);
    else if (key === "ArrowRight") move(1, 0);
    else if (key === "ArrowDown") {
      if (!move(0, 1)) lockPiece();
    } else if (key === "ArrowUp") rotate();
    else if (key === " ") hardDrop();
    else if (key === "p" || key === "P") togglePause();
  }

  function zoneFromPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    // Orilla inferior = bajar; laterales = izq/der; centro = girar.
    if (y > 0.7) return "down";
    if (x < 0.28) return "left";
    if (x > 0.72) return "right";
    return "rotate";
  }

  function applyZone(zone) {
    if (!running || paused || gameOver || !zone) return;
    if (zone === "left") move(-1, 0);
    else if (zone === "right") move(1, 0);
    else if (zone === "down") {
      if (!move(0, 1)) lockPiece();
    } else if (zone === "rotate") rotate();
  }

  let touchRepeatId = 0;
  let touchZone = null;

  function clearTouchRepeat() {
    if (touchRepeatId) {
      clearInterval(touchRepeatId);
      touchRepeatId = 0;
    }
    touchZone = null;
  }

  function onBoardPointerDown(event) {
    if (!running || paused || gameOver) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const zone = zoneFromPointer(event.clientX, event.clientY);
    if (!zone) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    touchZone = zone;
    applyZone(zone);
    // Mantener pulsado en orillas repite el movimiento; el giro es un toque.
    if (zone !== "rotate") {
      clearInterval(touchRepeatId);
      touchRepeatId = window.setInterval(() => applyZone(touchZone), 120);
    }
  }

  function onBoardPointerUp(event) {
    try {
      canvas.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
    clearTouchRepeat();
  }

  startBtn.addEventListener("click", start);
  pauseBtn.addEventListener("click", togglePause);
  resetBtn.addEventListener("click", reset);
  leftBtn.addEventListener("click", () => move(-1, 0));
  rightBtn.addEventListener("click", () => move(1, 0));
  rotateBtn.addEventListener("click", rotate);
  downBtn.addEventListener("click", () => {
    if (!move(0, 1)) lockPiece();
  });
  dropBtn.addEventListener("click", hardDrop);
  canvas.addEventListener("pointerdown", onBoardPointerDown);
  canvas.addEventListener("pointerup", onBoardPointerUp);
  canvas.addEventListener("pointercancel", onBoardPointerUp);
  canvas.addEventListener("lostpointercapture", clearTouchRepeat);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    resize();
    draw();
  });

  resize();
  draw();

  return {
    start,
    reset,
    pauseForTabHide,
    isRunning: () => running && !paused && !gameOver,
  };
}
