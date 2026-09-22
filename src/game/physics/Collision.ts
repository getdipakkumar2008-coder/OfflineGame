import type { Player } from "../entities/Player";
import type { Obstacle } from "../entities/Obstacle";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Axis-aligned bounding box intersection test. */
export function checkCollision(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Shrinks a hitbox slightly relative to its visual sprite so near-misses feel fair.
 * Padding is a fraction of width/height removed from each side.
 */
export function toHitbox(rect: Rect, paddingRatio = 0.15): Rect {
  const padX = rect.width * paddingRatio;
  const padY = rect.height * paddingRatio;
  return {
    x: rect.x + padX,
    y: rect.y + padY,
    width: rect.width - padX * 2,
    height: rect.height - padY * 2,
  };
}

export function checkPlayerObstacleCollision(player: Player, obstacle: Obstacle): boolean {
  return checkCollision(toHitbox(player), toHitbox(obstacle));
}
