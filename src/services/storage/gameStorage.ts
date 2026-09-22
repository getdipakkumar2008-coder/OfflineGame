import { gameConfig } from "../../game/config/gameConfig";

export interface GameStorage {
  getHighScore(): number;
  saveHighScore(score: number): void;
  resetHighScore(): void;
}

/**
 * Wraps localStorage so the rest of the app never touches it directly. Falls back to an
 * in-memory value if localStorage throws (private browsing, quota, disabled storage) so a
 * missing high score never crashes the game.
 */
class LocalStorageGameStorage implements GameStorage {
  private memoryFallback = 0;

  getHighScore(): number {
    try {
      const raw = window.localStorage.getItem(gameConfig.highScoreKey);
      const parsed = raw === null ? 0 : Number(raw);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return this.memoryFallback;
    }
  }

  saveHighScore(score: number): void {
    const safeScore = Number.isFinite(score) && score >= 0 ? Math.floor(score) : 0;
    try {
      window.localStorage.setItem(gameConfig.highScoreKey, String(safeScore));
    } catch {
      this.memoryFallback = safeScore;
    }
  }

  resetHighScore(): void {
    try {
      window.localStorage.removeItem(gameConfig.highScoreKey);
    } catch {
      this.memoryFallback = 0;
    }
  }
}

export const gameStorage: GameStorage = new LocalStorageGameStorage();
