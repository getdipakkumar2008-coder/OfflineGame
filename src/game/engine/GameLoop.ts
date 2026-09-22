import { gameConfig } from "../config/gameConfig";

type Tick = (deltaTime: number) => void;

/** Thin requestAnimationFrame wrapper: computes and clamps delta time, nothing else. */
export class GameLoop {
  private rafId: number | null = null;
  private lastTimestamp: number | null = null;

  constructor(private onTick: Tick) {}

  start(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = null;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
  }

  get isRunning(): boolean {
    return this.rafId !== null;
  }

  private frame = (timestamp: number): void => {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }
    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    const deltaTime = Math.min(rawDelta, gameConfig.maxDeltaTime);
    this.onTick(deltaTime);

    this.rafId = requestAnimationFrame(this.frame);
  };
}
