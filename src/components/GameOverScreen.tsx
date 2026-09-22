function pad(score: number): string {
  return String(Math.max(0, Math.floor(score))).padStart(5, "0");
}

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

export function GameOverScreen({ score, highScore, onRestart }: GameOverScreenProps) {
  return (
    <div className="game-overlay" role="status">
      <p className="game-overlay__title">GAME OVER</p>
      <p className="game-overlay__score">SCORE {pad(score)}</p>
      <p className="game-overlay__best">BEST {pad(highScore)}</p>
      <button type="button" className="game-overlay__button" onClick={onRestart}>
        Press SPACE to Play Again
      </button>
    </div>
  );
}
