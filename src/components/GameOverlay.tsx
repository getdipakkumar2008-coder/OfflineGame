interface GameOverlayProps {
  onStart: () => void;
}

/** IDLE-state intro overlay: "Press SPACE to Play". */
export function GameOverlay({ onStart }: GameOverlayProps) {
  return (
    <div className="game-overlay" role="status">
      <p className="game-overlay__title">OFFLINE MODE</p>
      <p className="game-overlay__subtitle">Connection unavailable</p>
      <button type="button" className="game-overlay__button" onClick={onStart}>
        Press SPACE to Play
      </button>
    </div>
  );
}
