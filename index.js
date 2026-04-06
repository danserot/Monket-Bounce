  
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const GAME_WIDTH = canvas.width;
    const GAME_HEIGHT = canvas.height;

    const keys = {};

    const monkey = {
      x: 180,
      y: 500,
      width: 36,
      height: 36,
      vx: 0,
      vy: 0,
      speed: 5
    };

    const gravity = 0.35;
    const jumpForce = -11.5;

    let score = 0;
    let bestScore = 0;
    let gameOver = false;

    const trampolines = [];
    const bananas = [];

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    function createTrampoline(x, y, type = "normal") {
      return {
        x,
        y,
        width: 80,
        height: 14,
        type,
        broken: false,
        dx: type === "moving" ? (Math.random() < 0.5 ? -1.5 : 1.5) : 0
      };
    }

    function createBanana(x, y) {
      return {
        x,
        y,
        width: 18,
        height: 18,
        collected: false
      };
    }

    function initGame() {
      trampolines.length = 0;
      bananas.length = 0;

      monkey.x = 180;
      monkey.y = 500;
      monkey.vx = 0;
      monkey.vy = 0;

      score = 0;
      gameOver = false;

      trampolines.push(createTrampoline(160, 560, "normal"));

      for (let i = 1; i < 10; i++) {
        const y = 560 - i * 70;
        const x = random(20, GAME_WIDTH - 100);

        let type = "normal";
        const r = Math.random();
        if (r < 0.15) type = "breaking";
        else if (r < 0.3) type = "moving";

        trampolines.push(createTrampoline(x, y, type));

        if (Math.random() < 0.25) {
          bananas.push(createBanana(x + 30, y - 25));
        }
      }
    }

    function spawnTrampolines() {
      let highestY = Math.min(...trampolines.map(t => t.y));

      while (highestY > -100) {
        highestY -= random(55, 85);
        const x = random(20, GAME_WIDTH - 100);

        let type = "normal";
        const r = Math.random();
        if (r < 0.12) type = "breaking";
        else if (r < 0.25) type = "moving";

        trampolines.push(createTrampoline(x, highestY, type));

        if (Math.random() < 0.22) {
          bananas.push(createBanana(x + 30, highestY - 25));
        }
      }
    }

    function handleInput() {
      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        monkey.vx = -monkey.speed;
      } else if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        monkey.vx = monkey.speed;
      } else {
        monkey.vx = 0;
      }
    }

    function updateMonkey() {
      handleInput();

      monkey.vy += gravity;
      monkey.x += monkey.vx;
      monkey.y += monkey.vy;

      if (monkey.x + monkey.width < 0) {
        monkey.x = GAME_WIDTH;
      } else if (monkey.x > GAME_WIDTH) {
        monkey.x = -monkey.width;
      }

      for (const t of trampolines) {
        if (t.broken) continue;

        const monkeyBottom = monkey.y + monkey.height;
        const monkeyPrevBottom = monkeyBottom - monkey.vy;

        const hitFromAbove =
          monkey.vy > 0 &&
          monkey.x + monkey.width > t.x &&
          monkey.x < t.x + t.width &&
          monkeyBottom >= t.y &&
          monkeyPrevBottom <= t.y + t.height;

        if (hitFromAbove) {
          monkey.vy = jumpForce;

          if (t.type === "breaking") {
            t.broken = true;
          }
        }
      }

      for (const banana of bananas) {
        if (banana.collected) continue;

        const hit =
          monkey.x < banana.x + banana.width &&
          monkey.x + monkey.width > banana.x &&
          monkey.y < banana.y + banana.height &&
          monkey.y + monkey.height > banana.y;

        if (hit) {
          banana.collected = true;
          score += 50;
        }
      }

      if (monkey.y > GAME_HEIGHT) {
        gameOver = true;
        if (score > bestScore) bestScore = score;
      }
    }

    function updatePlatforms() {
      for (const t of trampolines) {
        if (t.type === "moving" && !t.broken) {
          t.x += t.dx;

          if (t.x <= 0 || t.x + t.width >= GAME_WIDTH) {
            t.dx *= -1;
          }
        }
      }
    }

    function moveWorld() {
      const topLimit = 220;

      if (monkey.y < topLimit) {
        const offset = topLimit - monkey.y;
        monkey.y = topLimit;

        for (const t of trampolines) {
          t.y += offset;
        }

        for (const banana of bananas) {
          banana.y += offset;
        }

        score += Math.floor(offset);
      }

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

    function drawTrampolines() {
      for (const t of trampolines) {
        if (t.broken) continue;

        if (t.type === "normal") {
          ctx.fillStyle = "#2ecc71";
        } else if (t.type === "breaking") {
          ctx.fillStyle = "#f39c12";
        } else {
          ctx.fillStyle = "#3498db";
        }

        ctx.fillRect(t.x, t.y, t.width, t.height);

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        ctx.strokeRect(t.x, t.y, t.width, t.height);

        ctx.beginPath();
        ctx.moveTo(t.x + 8, t.y + t.height);
        ctx.lineTo(t.x + 18, t.y + t.height + 10);
        ctx.moveTo(t.x + 28, t.y + t.height);
        ctx.lineTo(t.x + 38, t.y + t.height + 10);
        ctx.moveTo(t.x + 48, t.y + t.height);
        ctx.lineTo(t.x + 58, t.y + t.height + 10);
        ctx.moveTo(t.x + 68, t.y + t.height);
        ctx.lineTo(t.x + 76, t.y + t.height + 10);
        ctx.stroke();
      }
    }

    function drawBananas() {
      for (const banana of bananas) {
        if (banana.collected) continue;

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
      ctx.fillText("Score: " + score, 15, 30);
      ctx.fillText("Best: " + bestScore, 15, 55);

      ctx.font = "14px Arial";
      ctx.fillText("← → или A / D", 15, 80);
    }

    function drawGameOver() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 34px Arial";
      ctx.fillText("Game Over", GAME_WIDTH / 2, 250);

      ctx.font = "22px Arial";
      ctx.fillText("Score: " + score, GAME_WIDTH / 2, 295);
      ctx.fillText("Best: " + bestScore, GAME_WIDTH / 2, 330);

      ctx.font = "18px Arial";
      ctx.fillText("Нажми SPACE для рестарта", GAME_WIDTH / 2, 380);

      ctx.textAlign = "start";
    }

    function drawBackgroundDetails() {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
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

    document.addEventListener("keydown", (e) => {
      keys[e.key] = true;

      if (gameOver && e.code === "Space") {
        initGame();
      }
    });

    document.addEventListener("keyup", (e) => {
      keys[e.key] = false;
    });

    initGame();
    update();
