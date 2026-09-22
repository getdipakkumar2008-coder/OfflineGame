import { gameConfig } from "../config/gameConfig";
import { createObstacle, type Obstacle } from "../entities/Obstacle";

/**
 * Spawns obstacles at randomized but always-playable time gaps, and advances/removes
 * existing ones. Gap is chosen in seconds (not pixels) so it stays playable as speed ramps.
 */
export class ObstacleSpawner {
  private timeUntilNextSpawn: number;
  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.timeUntilNextSpawn = this.rollNextGap();
  }

  private rollNextGap(): number {
    const { minGapSeconds, maxGapSeconds } = gameConfig.obstacle;
    return minGapSeconds + this.random() * (maxGapSeconds - minGapSeconds);
  }

  reset(): void {
    this.timeUntilNextSpawn = this.rollNextGap();
  }

  update(obstacles: Obstacle[], deltaTime: number, speed: number): Obstacle[] {
    const next = obstacles
      .map((o) => ({ ...o, x: o.x - o.speed * deltaTime }))
      .filter((o) => o.x + o.width > -50);

    this.timeUntilNextSpawn -= deltaTime;
    if (this.timeUntilNextSpawn <= 0) {
      const { minWidth, maxWidth, minHeight, maxHeight } = gameConfig.obstacle;
      const width = minWidth + this.random() * (maxWidth - minWidth);
      const height = minHeight + this.random() * (maxHeight - minHeight);
      next.push(
        createObstacle({
          x: gameConfig.canvasWidth + width,
          width,
          height,
          groundY: gameConfig.groundY,
          speed,
        })
      );
      this.timeUntilNextSpawn = this.rollNextGap();
    }

    return next;
  }
}
