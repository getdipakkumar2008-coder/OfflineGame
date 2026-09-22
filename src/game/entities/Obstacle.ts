export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

let nextId = 1;

export function createObstacle(params: {
  x: number;
  width: number;
  height: number;
  groundY: number;
  speed: number;
}): Obstacle {
  return {
    id: nextId++,
    x: params.x,
    y: params.groundY - params.height,
    width: params.width,
    height: params.height,
    speed: params.speed,
  };
}

/** Test-only: reset the shared id counter so obstacle ids are deterministic across test files. */
export function __resetObstacleIdForTests(): void {
  nextId = 1;
}
