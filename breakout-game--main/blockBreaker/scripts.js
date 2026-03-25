const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Initialize the game engine
const game = new Game(canvas, ctx);

// Main Game Loop
function loop() {
  game.update(); // 1. Calculate all math, collisions, and logic
  game.draw(); // 2. Paint the result to the screen
  requestAnimationFrame(loop);
}

// Input Handlers from the user
document.addEventListener("keydown", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") game.keys.right = true;
  else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") game.keys.left = true;

  if (e.key === "r" || e.key === "R") {
    if (game.state === "PLAYING") game.state = "PAUSED";
    else if (game.state === "PAUSED") game.state = "PLAYING";
  }

  if (e.key === " " || e.code === "Space") {
    if (game.state === "START" || game.state === "GAME_OVER") {
      game.score = 0;
      game.lives = 3;
      game.roundNum = 0;
      game.initRound();
      game.state = "PLAYING";
    } else if (game.state === "ROUND_OVER") {
      game.initRound();
      game.state = "PLAYING";
    } else if (game.state === "PLAYING" && !game.launchBall) {
      game.launchBall = true;
      game.balls[0].dy = -game.getBallSpeed();
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") game.keys.right = false;
  else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") game.keys.left = false;
});

document.addEventListener("mousemove", (e) => {
  if (game.state !== "PLAYING") return;
  const relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    let newX = relativeX - game.paddle.width / 2;
    game.paddle.x = Math.max(0, Math.min(canvas.width - game.paddle.width, newX));
  }
});

document.addEventListener("mousedown", (e) => {
  if (game.state === "PLAYING" && !game.launchBall && e.button === 0) {
    game.launchBall = true;
    game.balls[0].dy = -game.getBallSpeed();

    // Initialize Audio context securely on user gesture
    if (!game.audioCtx) game.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
});

// Start the engine
loop();
