import { describe, expect, it } from "vitest";
import { checkCollision, checkPlayerObstacleCollision, toHitbox } from "../src/game/physics/Collision";
import { createPlayer } from "../src/game/entities/Player";
import { createObstacle } from "../src/game/entities/Obstacle";
import { gameConfig } from "../src/game/config/gameConfig";

describe("AABB collision", () => {
  it("detects overlapping rectangles", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(checkCollision(a, b)).toBe(true);
  });

  it("detects non-overlapping rectangles (near miss)", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(checkCollision(a, b)).toBe(false);
  });

  it("shrinks a hitbox relative to its sprite rect", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const hitbox = toHitbox(rect, 0.1);
    expect(hitbox.x).toBe(10);
    expect(hitbox.width).toBe(80);
  });

  it("reports collision when a player and obstacle overlap on the ground", () => {
    const player = createPlayer();
    const obstacle = createObstacle({
      x: player.x,
      width: 30,
      height: 40,
      groundY: gameConfig.groundY,
      speed: gameConfig.speed.initial,
    });
    expect(checkPlayerObstacleCollision(player, obstacle)).toBe(true);
  });

  it("reports no collision when the obstacle is far away", () => {
    const player = createPlayer();
    const obstacle = createObstacle({
      x: player.x + 500,
      width: 30,
      height: 40,
      groundY: gameConfig.groundY,
      speed: gameConfig.speed.initial,
    });
    expect(checkPlayerObstacleCollision(player, obstacle)).toBe(false);
  });
});
