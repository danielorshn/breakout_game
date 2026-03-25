// the  controller for game logic, state management, and rendering.
class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Core Game State
    this.state = "START"; // the kinds of game states are:  START, PLAYING, ROUND_OVER, GAME_OVER, PAUSED
    this.score = 0;
    this.lives = 3;
    this.roundNum = 0;

    // Entities
    this.paddle = new Paddle(canvas.width, canvas.height);
    this.balls = [];
    this.bricks = [];
    this.powerUps = [];
    this.lasers = [];

    // Mechanics
    this.brickRowCount = 4;
    this.brickColumnCount = 5;
    this.bricksLeft = 0;
    this.launchBall = false;

    // Timers
    this.stretchTimer = 0;
    this.laserTimer = 0;
    this.lastLaserTime = 0;

    // Inputs from the user
    this.keys = { right: false, left: false };
    this.audioCtx = null;

    this.initRound();
  }

  //  the audio for the game
  playNote(frequency, duration) {
    if (!this.audioCtx) return;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
    oscillator.stop(this.audioCtx.currentTime + duration);
  }

  // setup for the game
  initRound() {
    this.paddle = new Paddle(this.canvas.width, this.canvas.height);
    this.balls = [new Ball(this.canvas.width / 2, this.canvas.height - this.paddle.height - 30, 0, 0, "#ffffff")];
    this.powerUps = [];
    this.lasers = [];
    this.launchBall = false;
    this.laserTimer = 0;
    this.stretchTimer = 0;
    this.generateBricks();
  }

  generateBricks() {
    this.bricks = [];
    const brickWidth = 75,
      brickHeight = 20,
      padding = 10,
      offsetTop = 30;
    const totalArea = this.brickColumnCount * brickWidth + (this.brickColumnCount - 1) * padding;
    const offsetLeft = (this.canvas.width - totalArea) / 2;

    for (let c = 0; c < this.brickColumnCount; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < this.brickRowCount; r++) {
        const bx = c * (brickWidth + padding) + offsetLeft;
        const by = r * (brickHeight + padding) + offsetTop;
        this.bricks[c][r] = new Brick(bx, by, r);
      }
    }
    this.bricksLeft = this.brickColumnCount * this.brickRowCount;

    // Distribute Power-ups randomly by using math.random
    for (let i = 0; i < 4; i++) {
      let b = this.bricks[Math.floor(Math.random() * this.brickColumnCount)][Math.floor(Math.random() * this.brickRowCount)];
      if (!b.isHeart && !b.isPlus && !b.isStar && !b.isCircle) {
        let rand = Math.random();
        if (rand >= 0.9) b.isHeart = true;
        else if (rand >= 0.7) b.isStar = true;
        else if (rand >= 0.45) b.isPlus = true;
        else if (rand >= 0.2) b.isCircle = true;
      }
    }
  }

  getBallSpeed() {
    return Math.min(6 + this.roundNum / 2, 9);
  }

  // the game engine that updates everything so it becoms a game and not a simple drawings (math and collsions only) ---
  update() {
    if (this.state !== "PLAYING") return;

    // 1. Paddle Movement
    if (this.keys.right) this.paddle.move("right", this.canvas.width);
    if (this.keys.left) this.paddle.move("left", this.canvas.width);

    // 2. Paddle Stretch Power-up logic
    if (this.stretchTimer > 0 && this.paddle.width < 105) this.paddle.width++;
    if (this.stretchTimer > 0) this.stretchTimer--;
    if (this.stretchTimer === 0 && this.paddle.width > 75) this.paddle.width--;

    // 3. Laser Firing Logic
    if (this.laserTimer > 0) {
      this.laserTimer--;
      if (Date.now() - this.lastLaserTime > 1000) {
        this.lasers.push(new Laser(this.paddle.x, this.paddle.y - 5));
        this.lasers.push(new Laser(this.paddle.x + this.paddle.width, this.paddle.y - 5));
        this.lastLaserTime = Date.now();
        this.playNote(1200, 0.05);
      }
    }

    // 4. Update Projectiles & Powerups
    this.lasers.forEach((laser) => laser.update());
    this.powerUps.forEach((pUp) => pUp.update());

    // 5. Ball Physics & Collisions
    if (this.launchBall) {
      for (let i = this.balls.length - 1; i >= 0; i--) {
        let ball = this.balls[i];
        ball.move();

        // Walls collision with the ball
        if (ball.x + ball.dx > this.canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
          ball.dx = -ball.dx;
          this.playNote(200, 0.05);
        }
        if (ball.y + ball.dy < ball.radius) {
          ball.dy = -ball.dy;
          this.playNote(200, 0.05);
        }

        // Paddle Collision
        if (ball.y + ball.dy > this.canvas.height - ball.radius - this.paddle.height - 20) {
          if (ball.x > this.paddle.x && ball.x < this.paddle.x + this.paddle.width) {
            let hitPoint = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
            ball.dx = 8 * hitPoint;
            ball.dy = -Math.abs(ball.dy); // Force upward
            ball.y = this.canvas.height - this.paddle.height - ball.radius - 20;
            this.playNote(400, 0.1);
          } else if (ball.y + ball.dy > this.canvas.height) {
            this.balls.splice(i, 1); // Ball lost
          }
        }
      }

      // Life lost check
      if (this.balls.length === 0) {
        this.lives--;
        this.launchBall = false;
        this.laserTimer = 0;
        this.lasers = [];
        this.powerUps = [];

        if (this.lives <= 0) this.state = "GAME_OVER";
        else this.balls.push(new Ball(this.paddle.x + this.paddle.width / 2, this.canvas.height - 50, 0, 0, "#ffffff"));
      }
    } else if (this.balls.length > 0) {
      // Pin ball to paddle before launch
      this.balls[0].x = this.paddle.x + this.paddle.width / 2;
      this.balls[0].y = this.canvas.height - this.paddle.height - 31;
    }

    this.checkCollisions();
  }

  checkCollisions() {
    // Laser collisions with the bricks
    this.lasers.forEach((laser) => {
      if (!laser.active) return;
      for (let c = 0; c < this.brickColumnCount; c++) {
        for (let r = 0; r < this.brickRowCount; r++) {
          let b = this.bricks[c][r];
          if (b.status === 1 && laser.x > b.x && laser.x < b.x + b.width && laser.y > b.y && laser.y < b.y + b.height) {
            this.handleBrickBreak(b, c, r);
            laser.active = false;
            return;
          }
        }
      }
    });

    // Ball collisions with the bricks
    this.balls.forEach((ball) => {
      let hitThisFrame = false;
      for (let c = 0; c < this.brickColumnCount; c++) {
        for (let r = 0; r < this.brickRowCount; r++) {
          let b = this.bricks[c][r];
          if (b.status === 1 && ball.x + ball.radius > b.x && ball.x - ball.radius < b.x + b.width && ball.y + ball.radius > b.y && ball.y - ball.radius < b.y + b.height) {
            if (!hitThisFrame) {
              if (ball.y < b.y || ball.y > b.y + b.height) ball.dy = -ball.dy;
              else ball.dx = -ball.dx;
              hitThisFrame = true;
            }
            this.handleBrickBreak(b, c, r);
          }
        }
      }
    });

    // PowerUp collisions with the paddle
    this.powerUps.forEach((pUp) => {
      if (pUp.active && pUp.y + 20 >= this.paddle.y && pUp.y <= this.paddle.y + this.paddle.height && pUp.x + pUp.brickWidth / 2 > this.paddle.x && pUp.x + pUp.brickWidth / 2 < this.paddle.x + this.paddle.width) {
        if (pUp.type === "heart") this.lives++;
        if (pUp.type === "plus") this.stretchTimer = 60 * 10;
        pUp.active = false;
        this.playNote(600, 0.2);
      } else if (pUp.y > this.canvas.height) {
        pUp.active = false;
      }
    });

    // Cleanup inactive arrays safely
    this.lasers = this.lasers.filter((l) => l.active);
    this.powerUps = this.powerUps.filter((p) => p.active);

    // Round Win Condition
    if (this.bricksLeft <= 0) {
      this.state = "ROUND_OVER"; // Update state.
      this.roundNum++;
    }
  }

  handleBrickBreak(b, c, r) {
    b.status = 0;
    this.score++;
    this.bricksLeft--;
    this.playNote(800, 0.1);

    // Spawn powerups
    if (b.isCircle) {
      let ballDir = c <= 3 ? -3 : 3;
      this.balls.push(new Ball(b.x + b.width / 2, b.y + b.height / 2, ballDir, -this.getBallSpeed(), b.getColor()));
    }
    if (b.isHeart) this.powerUps.push(new PowerUp(b.x, b.y, "heart", b.getColor(), b.width, b.height));
    if (b.isPlus) this.powerUps.push(new PowerUp(b.x, b.y, "plus", b.getColor(), b.width, b.height));
    if (b.isStar) {
      this.laserTimer = 60 * 5;
      this.playNote(1000, 0.3);
    }
  }

  // rendering only
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const primaryColor = "#78c1f3";

    if (this.state === "START") {
      this.ctx.font = "25px Poppins";
      this.ctx.fillStyle = primaryColor;
      this.ctx.textAlign = "center";
      this.ctx.fillText("Press Space to Start the Game!", this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    if (this.state === "GAME_OVER") {
      this.ctx.font = "25px Poppins";
      this.ctx.fillStyle = primaryColor;
      this.ctx.textAlign = "center";
      this.ctx.fillText("Game Over! Press Space to Restart!", this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    if (this.state === "ROUND_OVER") {
      this.ctx.font = "20px Poppins";
      this.ctx.fillStyle = primaryColor;
      this.ctx.textAlign = "center";
      this.ctx.fillText(`Round ${this.roundNum} Completed! Press space to continue`, this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    if (this.state === "PAUSED") {
      this.ctx.font = "25px Poppins";
      this.ctx.fillStyle = primaryColor;
      this.ctx.textAlign = "center";
      this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    // Draw active game elements
    this.ctx.font = "16px Arial";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Score: ${this.score}`, 20, 20);
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Round ${this.roundNum + 1}`, this.canvas.width / 2, 20);
    this.ctx.textAlign = "right";
    this.ctx.fillText(`Lives: ${this.lives}`, this.canvas.width - 20, 20);

    for (let c = 0; c < this.brickColumnCount; c++) {
      for (let r = 0; r < this.brickRowCount; r++) {
        if (this.bricks[c][r]) this.bricks[c][r].draw(this.ctx);
      }
    }

    this.paddle.draw(this.ctx);
    this.balls.forEach((ball) => ball.draw(this.ctx));
    this.lasers.forEach((laser) => laser.draw(this.ctx));
    this.powerUps.forEach((pUp) => pUp.draw(this.ctx));

    // Laser timer bar
    if (this.laserTimer > 0) {
      this.ctx.fillStyle = "red";
      const barWidth = (this.laserTimer / (60 * 5)) * this.paddle.width;
      this.ctx.fillRect(this.paddle.x, this.canvas.height - this.paddle.height - 25, barWidth, 3);
    }
  }
}
