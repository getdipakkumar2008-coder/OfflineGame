import type { Player } from "../entities/Player";
import { gameConfig } from "../config/gameConfig";

/** Advances vertical physics for one frame. Mutates and returns the same player for perf. */
export function applyGravity(player: Player, deltaTime: number): Player {
  player.velocityY += player.gravity * deltaTime;
  player.y += player.velocityY * deltaTime;

  const groundLevel = gameConfig.groundY - player.height;
  if (player.y >= groundLevel) {
    player.y = groundLevel;
    player.velocityY = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  return player;
}

/** Applies an upward jump impulse. No-op if the player is airborne (no mid-air jump). */
export function jump(player: Player): Player {
  if (player.grounded) {
    player.velocityY = player.jumpStrength;
    player.grounded = false;
  }
  return player;
}

/** Computes the current horizontal speed given elapsed survival time, ramped up to a cap. */
export function computeSpeed(elapsedSeconds: number): number {
  const { initial, max, rampDuration } = gameConfig.speed;
  const t = Math.min(1, elapsedSeconds / rampDuration);
  return initial + (max - initial) * t;
}
