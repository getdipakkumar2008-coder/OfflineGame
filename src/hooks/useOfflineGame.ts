import { useEffect, useRef, useState, type RefObject } from "react";
import { GameEngine } from "../game/engine/GameEngine";
import type { GameState } from "../game/engine/GameState";

export interface OfflineGameController {
  state: GameState;
  score: number;
  highScore: number;
  start(): void;
  restart(): void;
}

/**
 * Bridges the imperative GameEngine to React. Only integer score changes and state
 * transitions trigger re-renders — never a raw per-frame update.
 */
export function useOfflineGame(canvasRef: RefObject<HTMLCanvasElement>): OfflineGameController {
  const engineRef = useRef<GameEngine | null>(null);
  const [state, setState] = useState<GameState>("IDLE");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(
      {
        onStateChange: setState,
        onScoreChange: setScore,
        onHighScoreChange: setHighScore,
      },
      canvas
    );
    engineRef.current = engine;
    setHighScore(engine.getHighScore());

    const ctx = canvas.getContext("2d");
    if (ctx) engine.attachCanvas(ctx);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    score,
    highScore,
    start: () => engineRef.current?.start(),
    restart: () => engineRef.current?.restart(),
  };
}
