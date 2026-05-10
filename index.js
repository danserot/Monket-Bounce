"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const TOP_SCROLL_LIMIT = 220;

const GRAVITY = 0.35;
const JUMP_FORCE = -11.5;
const BANANA_SCORE = 50;

const PLAYER_START = {
  x: 180,
  y: 500,
  width: 36,
  height: 36,
  speed: 5
};

const PLATFORM = {
  width: 80,
  height: 14,
  firstX: 160,
  firstY: 560,
  minX: 20,
  maxX: GAME_WIDTH - 100,
  movingSpeed: 1.5
};

const BANANA = {
  width: 18,
  height: 18,
  offsetX: 30,
  offsetY: -25
};

const TEXT = {
  controls: "← → или A / D",
  restart: "Нажми SPACE для рестарта"
};

const PLATFORM_TYPES = {
  NORMAL: "normal",
  BREAKING: "breaking",
  MOVING: "moving"
};

const keys = {};
const trampolines = [];
const bananas = [];

const monkey = {
  x: PLAYER_START.x,
  y: PLAYER_START.y,
  width: PLAYER_START.width,
  height: PLAYER_START.height,
  vx: 0,
  vy: 0,
  speed: PLAYER_START.speed
};

let score = 0;
let bestScore = 0;
let gameOver = false;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function createTrampoline(x, y, type = PLATFORM_TYPES.NORMAL) {
  return {
    x,
    y,
    width: PLATFORM.width,
    height: PLATFORM.height,
    type,
    broken: false,
    dx: type === PLATFORM_TYPES.MOVING
      ? (Math.random() < 0.5 ? -PLATFORM.movingSpeed : PLATFORM.movingSpeed)
      : 0
  };
}

function createBanana(x, y) {
  return {
    x,
    y,
    width: BANANA.width,
    height: BANANA.height,
    collected: false
  };
}

function pickPlatformType(breakingChance, movingChance) {
  const value = Math.random();

  if (value < breakingChance) {
    return PLATFORM_TYPES.BREAKING;
  }

  if (value < movingChance) {
    return PLATFORM_TYPES.MOVING;
  }

  return PLATFORM_TYPES.NORMAL;
}

function resetMonkey() {
  monkey.x = PLAYER_START.x;
  monkey.y = PLAYER_START.y;
  monkey.vx = 0;
  monkey.vy = 0;
}

function addBananaNearPlatform(x, y) {
  bananas.push(createBanana(x + BANANA.offsetX, y + BANANA.offsetY));
}

function initGame() {
  trampolines.length = 0;
  bananas.length = 0;

  resetMonkey();

  score = 0;
  gameOver = false;

  trampolines.push(
    createTrampoline(PLATFORM.firstX, PLATFORM.firstY, PLATFORM_TYPES.NORMAL)
  );

  for (let i = 1; i < 10; i++) {
    const y = PLATFORM.firstY - i * 70;
    const x = random(PLATFORM.minX, PLATFORM.maxX);
    const type = pickPlatformType(0.15, 0.3);

    trampolines.push(createTrampoline(x, y, type));

    if (Math.random() < 0.25) {
      addBananaNearPlatform(x, y);
    }
  }
}

function spawnTrampolines() {
  let highestY = Math.min(...trampolines.map((trampoline) => trampoline.y));

  while (highestY > -100) {
    highestY -= random(55, 85);

    const x = random(PLATFORM.minX, PLATFORM.maxX);
    const type = pickPlatformType(0.12, 0.25);

    trampolines.push(createTrampoline(x, highestY, type));

    if (Math.random() < 0.22) {
      addBananaNearPlatform(x, highestY);
    }
  }
}

function handleInput() {
  if (keys.ArrowLeft || keys.a || keys.A) {
    monkey.vx = -monkey.speed;
    return;
  }

  if (keys.ArrowRight || keys.d || keys.D) {
    monkey.vx = monkey.speed;
    return;
  }

  monkey.vx = 0;
}

function wrapMonkeyAroundScreen() {
  if (monkey.x + monkey.width < 0) {
    monkey.x = GAME_WIDTH;
  } else if (monkey.x > GAME_WIDTH) {
    monkey.x = -monkey.width;
  }
}

function isMonkeyLandingOn(trampoline) {
  const monkeyBottom = monkey.y + monkey.height;
  const monkeyPrevBottom = monkeyBottom - monkey.vy;

  return (
    monkey.vy > 0 &&
    monkey.x + monkey.width > trampoline.x &&
    monkey.x < trampoline.x + trampoline.width &&
    monkeyBottom >= trampoline.y &&
    monkeyPrevBottom <= trampoline.y + trampoline.height
  );
}

function handleTrampolineCollisions() {
  for (const trampoline of trampolines) {
    if (trampoline.broken || !isMonkeyLandingOn(trampoline)) {
      continue;
    }

    monkey.vy = JUMP_FORCE;

    if (trampoline.type === PLATFORM_TYPES.BREAKING) {
      trampoline.broken = true;
    }
  }
}

function isMonkeyTouching(item) {
  return (
    monkey.x < item.x + item.width &&
    monkey.x + monkey.width > item.x &&
    monkey.y < item.y + item.height &&
    monkey.y + monkey.height > item.y
  );
}

function collectBananas() {
  for (const banana of bananas) {
    if (banana.collected || !isMonkeyTouching(banana)) {
      continue;
    }

    banana.collected = true;
    score += BANANA_SCORE;
  }
}

function updateMonkey() {
  handleInput();

  monkey.vy += GRAVITY;
  monkey.x += monkey.vx;
  monkey.y += monkey.vy;

  wrapMonkeyAroundScreen();
  handleTrampolineCollisions();
  collectBananas();

  if (monkey.y > GAME_HEIGHT) {
    gameOver = true;
    bestScore = Math.max(bestScore, score);
  }
}

function updatePlatforms() {
  for (const trampoline of trampolines) {
    if (trampoline.type !== PLATFORM_TYPES.MOVING || trampoline.broken) {
      continue;
    }

    trampoline.x += trampoline.dx;

    if (trampoline.x <= 0 || trampoline.x + trampoline.width >= GAME_WIDTH) {
      trampoline.dx *= -1;
    }
  }
}

function scrollWorldIfNeeded() {
  if (monkey.y >= TOP_SCROLL_LIMIT) {
    return;
  }

  const offset = TOP_SCROLL_LIMIT - monkey.y;
  monkey.y = TOP_SCROLL_LIMIT;

  for (const trampoline of trampolines) {
    trampoline.y += offset;
  }

  for (const banana of bananas) {
    banana.y += offset;
  }

  score += Math.floor(offset);
}

function removeOffscreenObjects() {
  for (let i = trampolines.length - 1; i >= 0; i--) {
    if (trampolines[i].y > GAME_HEIGHT + 40) {
      trampolines.splice(i, 1);
    }
  }

  for (let i = bananas.length - 1; i >= 0; i--) {
    if (bananas[i].y > GAME_HEIGHT + 40 || bananas[i].collected) {
      bananas.splice(i, 1);
    }
  }
}

function moveWorld() {
  scrollWorldIfNeeded();
  removeOffscreenObjects();
  spawnTrampolines();
}

function drawMonkey() {
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(monkey.x, monkey.y, monkey.width, monkey.height);

  ctx.fillStyle = "#f5d7a1";
  ctx.fillRect(monkey.x + 8, monkey.y + 10, 20, 16);

  ctx.fillStyle = "#000";
  ctx.fillRect(monkey.x + 11, monkey.y + 14, 3, 3);
  ctx.fillRect(monkey.x + 22, monkey.y + 14, 3, 3);

  ctx.strokeStyle = "#5c3b1e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(monkey.x + monkey.width - 2, monkey.y + 20);
  ctx.quadraticCurveTo(monkey.x + 48, monkey.y + 30, monkey.x + 30, monkey.y + 42);
  ctx.stroke();
}

function getTrampolineColor(type) {
  if (type === PLATFORM_TYPES.BREAKING) {
    return "#f39c12";
  }

  if (type === PLATFORM_TYPES.MOVING) {
    return "#3498db";
  }

  return "#2ecc71";
}

function drawTrampolineSprings(trampoline) {
  ctx.beginPath();
  ctx.moveTo(trampoline.x + 8, trampoline.y + trampoline.height);
  ctx.lineTo(trampoline.x + 18, trampoline.y + trampoline.height + 10);
  ctx.moveTo(trampoline.x + 28, trampoline.y + trampoline.height);
  ctx.lineTo(trampoline.x + 38, trampoline.y + trampoline.height + 10);
  ctx.moveTo(trampoline.x + 48, trampoline.y + trampoline.height);
  ctx.lineTo(trampoline.x + 58, trampoline.y + trampoline.height + 10);
  ctx.moveTo(trampoline.x + 68, trampoline.y + trampoline.height);
  ctx.lineTo(trampoline.x + 76, trampoline.y + trampoline.height + 10);
  ctx.stroke();
}

function drawTrampolines() {
  for (const trampoline of trampolines) {
    if (trampoline.broken) {
      continue;
    }

    ctx.fillStyle = getTrampolineColor(trampoline.type);
    ctx.fillRect(trampoline.x, trampoline.y, trampoline.width, trampoline.height);

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.strokeRect(trampoline.x, trampoline.y, trampoline.width, trampoline.height);

    drawTrampolineSprings(trampoline);
  }
}

function drawBananas() {
  for (const banana of bananas) {
    if (banana.collected) {
      continue;
    }

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.ellipse(
      banana.x + 9,
      banana.y + 9,
      8,
      5,
      -0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = "#c9a000";
    ctx.stroke();
  }
}

function drawUI() {
  ctx.fillStyle = "#222";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 15, 30);
  ctx.fillText(`Best: ${bestScore}`, 15, 55);

  ctx.font = "14px Arial";
  ctx.fillText(TEXT.controls, 15, 80);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 34px Arial";
  ctx.fillText("Game Over", GAME_WIDTH / 2, 250);

  ctx.font = "22px Arial";
  ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2, 295);
  ctx.fillText(`Best: ${bestScore}`, GAME_WIDTH / 2, 330);

  ctx.font = "18px Arial";
  ctx.fillText(TEXT.restart, GAME_WIDTH / 2, 380);

  ctx.textAlign = "start";
}

function drawBackgroundDetails() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(60, 80, 25, 0, Math.PI * 2);
  ctx.arc(85, 80, 20, 0, Math.PI * 2);
  ctx.arc(105, 80, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(280, 130, 20, 0, Math.PI * 2);
  ctx.arc(300, 130, 16, 0, Math.PI * 2);
  ctx.arc(318, 130, 20, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBackgroundDetails();
  drawTrampolines();
  drawBananas();
  drawMonkey();
  drawUI();

  if (gameOver) {
    drawGameOver();
  }
}

function update() {
  if (!gameOver) {
    updateMonkey();
    updatePlatforms();
    moveWorld();
  }

  draw();
  requestAnimationFrame(update);
}

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;

  if (gameOver && event.code === "Space") {
    initGame();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

initGame();
update();
