import { describe, expect, it } from "vitest";
import { ObstacleSpawner } from "../src/game/engine/ObstacleSpawner";
import { gameConfig } from "../src/game/config/gameConfig";

describe("ObstacleSpawner", () => {
  it("spawns at least one obstacle within the configured max gap", () => {
    const spawner = new ObstacleSpawner(() => 0.999); // forces the longest configured gap
    let obstacles: ReturnType<ObstacleSpawner["update"]> = [];
    const dt = 0.1;
    const frames = Math.ceil(gameConfig.obstacle.maxGapSeconds / dt) + 1;

    for (let i = 0; i < frames; i++) {
      obstacles = spawner.update(obstacles, dt, gameConfig.speed.initial);
    }

    expect(obstacles.length).toBeGreaterThan(0);
  });

  it("moves obstacles left and removes them once fully off-screen", () => {
    // random() = 0 forces the shortest gap every time, so a single obstacle spawns
    // on the first update and no second one spawns before it leaves the screen.
    const spawner = new ObstacleSpawner(() => 0);
    let obstacles: ReturnType<ObstacleSpawner["update"]> = [];

    // Each obstacle keeps the speed it was spawned with, so spawn this one fast enough
    // to cross the whole screen in a single subsequent frame.
    const fastSpeed = gameConfig.canvasWidth * 20;
    obstacles = spawner.update(obstacles, gameConfig.obstacle.minGapSeconds, fastSpeed);
    expect(obstacles.length).toBe(1);
    const startX = obstacles[0].x;

    obstacles = spawner.update(obstacles, 0.1, fastSpeed);
    expect(obstacles.length).toBe(0);
    expect(startX).toBeGreaterThan(0);
  });
});
