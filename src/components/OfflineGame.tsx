import { useRef } from "react";
import { GameCanvas } from "./GameCanvas";
import { ScoreDisplay } from "./ScoreDisplay";
import { GameOverlay } from "./GameOverlay";
import { GameOverScreen } from "./GameOverScreen";
import { GameErrorBoundary } from "./GameErrorBoundary";
import { useOfflineGame } from "../hooks/useOfflineGame";

export function OfflineGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, score, highScore, start, restart } = useOfflineGame(canvasRef);

  return (
    <div className="offline-game">
      <header className="offline-game__header">
        <p className="offline-game__status">OFFLINE — no connection</p>
      </header>

      <GameErrorBoundary>
        <div className="offline-game__stage">
          <GameCanvas canvasRef={canvasRef} />

          {state === "PLAYING" || state === "PAUSED" ? (
            <ScoreDisplay score={score} highScore={highScore} />
          ) : null}

          {state === "IDLE" ? <GameOverlay onStart={start} /> : null}
          {state === "GAME_OVER" ? (
            <GameOverScreen score={score} highScore={highScore} onRestart={restart} />
          ) : null}
        </div>
      </GameErrorBoundary>
    </div>
  );
}
