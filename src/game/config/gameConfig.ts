export const gameConfig = {
  // World
  groundY: 220,
  canvasWidth: 800,
  canvasHeight: 300,

  // Player
  player: {
    x: 60,
    width: 34,
    height: 42,
    gravity: 1800,
    jumpStrength: -650,
  },

  // Speed / difficulty ramp (seconds of survival -> horizontal speed)
  speed: {
    initial: 350,
    max: 700,
    rampDuration: 45, // seconds to reach max speed
  },

  // Obstacles
  obstacle: {
    minWidth: 20,
    maxWidth: 44,
    minHeight: 30,
    maxHeight: 60,
    minGapSeconds: 0.9, // minimum time-gap between obstacles at current speed
    maxGapSeconds: 1.8,
  },

  // Scoring
  scoreRate: 10, // points per second survived

  // Loop safety
  maxDeltaTime: 0.05, // seconds, clamps large jumps (tab suspend, slow frames)

  // Persistence
  highScoreKey: "offlineGameHighScore",
} as const;

export type GameConfig = typeof gameConfig;
