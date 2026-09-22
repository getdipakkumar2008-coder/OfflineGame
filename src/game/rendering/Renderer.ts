import type { Player } from "../entities/Player";
import type { Obstacle } from "../entities/Obstacle";
import { gameConfig } from "../config/gameConfig";

export interface RenderState {
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
}

/**
 * Draws original, geometric "digital landscape" art — no sprites borrowed from any
 * existing runner game. The player is a small rounded robot; obstacles are angular
 * "energy barrier" shapes.
 */
export class Renderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  render(state: RenderState): void {
    const { canvasWidth, canvasHeight, groundY } = gameConfig;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, "#0b0e14");
    sky.addColorStop(1, "#141a24");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvasWidth, groundY);

    this.drawParallaxDots(state.distance);

    // Ground
    ctx.fillStyle = "#1d2530";
    ctx.fillRect(0, groundY, canvasWidth, canvasHeight - groundY);
    ctx.strokeStyle = "#39d6c8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvasWidth, groundY);
    ctx.stroke();

    this.drawPlayer(state.player);
    for (const obstacle of state.obstacles) {
      this.drawObstacle(obstacle);
    }
  }

  private drawParallaxDots(distance: number): void {
    const ctx = this.ctx;
    const spacing = 90;
    const offset = distance % spacing;
    ctx.fillStyle = "rgba(57, 214, 200, 0.25)";
    for (let x = -offset; x < gameConfig.canvasWidth; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, 40, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPlayer(player: Player): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#39d6c8";
    const r = 6;
    this.roundedRect(player.x, player.y, player.width, player.height, r);
    ctx.fill();

    // "eye" — a small dark rounded panel gives it a robot identity distinct from the Dino.
    ctx.fillStyle = "#0b0e14";
    ctx.fillRect(player.x + player.width - 12, player.y + 8, 6, 6);
  }

  private drawObstacle(obstacle: Obstacle): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#ff5d73";
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
    ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
    ctx.closePath();
    ctx.fill();
  }

  private roundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}
