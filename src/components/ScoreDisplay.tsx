function pad(score: number): string {
  return String(Math.max(0, Math.floor(score))).padStart(5, "0");
}

interface ScoreDisplayProps {
  score: number;
  highScore: number;
}

export function ScoreDisplay({ score, highScore }: ScoreDisplayProps) {
  return (
    <div className="score-display" aria-live="off">
      <span className="score-display__current">SCORE {pad(score)}</span>
      <span className="score-display__best">BEST {pad(highScore)}</span>
    </div>
  );
}
