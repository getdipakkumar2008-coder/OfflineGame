import { describe, expect, it } from "vitest";
import { createPlayer } from "../src/game/entities/Player";
import { applyGravity, computeSpeed, jump } from "../src/game/physics/Physics";
import { gameConfig } from "../src/game/config/gameConfig";

describe("player physics", () => {
  it("falls and lands back on the ground", () => {
    const player = createPlayer();
    jump(player);
    expect(player.grounded).toBe(false);
    expect(player.velocityY).toBe(gameConfig.player.jumpStrength);

    // Simulate enough frames for gravity to bring the player back down.
    for (let i = 0; i < 200; i++) {
      applyGravity(player, 1 / 60);
    }

    expect(player.grounded).toBe(true);
    expect(player.velocityY).toBe(0);
    expect(player.y).toBe(gameConfig.groundY - player.height);
  });

  it("does not allow a second jump mid-air", () => {
    const player = createPlayer();
    jump(player);
    const velocityAfterFirstJump = player.velocityY;
    jump(player); // should be a no-op while airborne
    expect(player.velocityY).toBe(velocityAfterFirstJump);
  });

  it("ramps speed up to the configured max and clamps there", () => {
    const { initial, max, rampDuration } = gameConfig.speed;
    expect(computeSpeed(0)).toBe(initial);
    expect(computeSpeed(rampDuration)).toBe(max);
    expect(computeSpeed(rampDuration * 10)).toBe(max);
    expect(computeSpeed(rampDuration / 2)).toBeGreaterThan(initial);
    expect(computeSpeed(rampDuration / 2)).toBeLessThan(max);
  });
});
