import { useEffect, useRef, type RefObject } from "react";
import { gameConfig } from "../game/config/gameConfig";

interface GameCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
}

/**
 * Renders the backing canvas at devicePixelRatio resolution while keeping its CSS size
 * fixed to the configured game dimensions, so gameplay coordinates never need to know
 * about pixel density. Re-applies scaling on resize/orientation change.
 */
export function GameCanvas({ canvasRef }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const applyScale = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = gameConfig.canvasWidth * ratio;
      canvas.height = gameConfig.canvasHeight * ratio;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    applyScale();
    window.addEventListener("resize", applyScale);
    window.addEventListener("orientationchange", applyScale);
    return () => {
      window.removeEventListener("resize", applyScale);
      window.removeEventListener("orientationchange", applyScale);
    };
  }, [canvasRef]);

  return (
    <div className="game-canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{ width: gameConfig.canvasWidth, height: gameConfig.canvasHeight }}
        role="img"
        aria-label="Offline runner game"
      />
    </div>
  );
}
