import { gameConfig } from "../config/gameConfig";

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  gravity: number;
  jumpStrength: number;
  grounded: boolean;
}

export function createPlayer(): Player {
  const { player, groundY } = gameConfig;
  return {
    x: player.x,
    y: groundY - player.height,
    width: player.width,
    height: player.height,
    velocityY: 0,
    gravity: player.gravity,
    jumpStrength: player.jumpStrength,
    grounded: true,
  };
}
