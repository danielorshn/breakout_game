//  the game ball with movement and rendering capabilities.
class Ball {
  constructor(x, y, dx, dy, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.color = color;
    this.radius = 10;
  }

  move() {
    this.x += this.dx;
    this.y += this.dy;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

// the player-controlled paddle
class Paddle {
  constructor(canvasWidth, canvasHeight) {
    this.width = 75;
    this.height = 10;
    this.x = (canvasWidth - this.width) / 2;
    this.y = canvasHeight - this.height - 20;
    this.color = "#ffffff";
    this.isStretched = false;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 10);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  move(direction, canvasWidth) {
    const speed = 7;
    if (direction === "right") this.x = Math.min(this.x + speed, canvasWidth - this.width);
    else if (direction === "left") this.x = Math.max(this.x - speed, 0);
  }
}

// lasers fired from the paddle.
class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 3;
    this.height = 10;
    this.speed = 5;
    this.active = true;
  }

  update() {
    this.y -= this.speed;
    if (this.y < 0) this.active = false; // Flag for cleanup when off-screen
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#ff0000";
    ctx.fill();
    ctx.closePath();
  }
}

// The dropped powerups from the bricks Heart or Plus
class PowerUp {
  constructor(x, y, type, color, brickWidth, brickHeight) {
    this.x = x;
    this.y = y;
    this.type = type; // 'heart' or 'plus'
    this.color = color;
    this.active = true;
    this.brickWidth = brickWidth;
    this.brickHeight = brickHeight;
  }

  update() {
    this.y += 3;
  }

  draw(ctx) {
    if (this.type === "heart") this.drawHeart(ctx);
    if (this.type === "plus") this.drawPlus(ctx);
  }

  drawHeart(ctx) {
    const midX = this.x + this.brickWidth / 2;
    const tY = this.y + this.brickHeight / 2 - 10;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = this.color; // Takes the color of the broken brick
    ctx.beginPath();
    ctx.moveTo(midX, tY + 5);
    ctx.bezierCurveTo(midX, tY, midX - 12, tY, midX - 12, tY + 10);
    ctx.bezierCurveTo(midX - 12, tY + 15, midX, tY + 18, midX, tY + 22);
    ctx.bezierCurveTo(midX, tY + 18, midX + 12, tY + 15, midX + 12, tY + 10);
    ctx.bezierCurveTo(midX + 12, tY, midX, tY, midX, tY + 5);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  drawPlus(ctx) {
    const cx = this.x + this.brickWidth / 2;
    const cy = this.y + this.brickHeight / 2;
    const size = 6;
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}

// the brick class
class Brick {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.width = 75;
    this.height = 20;
    this.row = row;
    this.status = 1;
    this.isHeart = false;
    this.isStar = false;
    this.isPlus = false;
    this.isCircle = false;
  }

  getColor() {
    const colors = ["#6600cc", "green", "pink", "orange", "#78c1f3"];
    return colors[this.row] || "#ffffff";
  }

  draw(ctx) {
    if (this.status === 0) return;
    const color = this.getColor();

    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 7);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();

    // Static rendering of icons inside the brick
    if (this.isHeart) PowerUp.prototype.drawHeart.call({ x: this.x, y: this.y, brickWidth: this.width, brickHeight: this.height, color: color }, ctx);
    else if (this.isStar) this.drawStar(ctx);
    else if (this.isPlus) PowerUp.prototype.drawPlus.call({ x: this.x, y: this.y, brickWidth: this.width, brickHeight: this.height, color: color }, ctx);
    else if (this.isCircle) this.drawCircle(ctx);
  }

  drawStar(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + (this.height / 2 - 10) + 11;
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / 5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(cx + Math.cos(rot) * 8, cy + Math.sin(rot) * 8);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * 4, cy + Math.sin(rot) * 4);
      rot += step;
    }
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.restore();
  }

  drawCircle(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
