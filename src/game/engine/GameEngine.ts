import { gameConfig } from "../config/gameConfig";
import { createPlayer, type Player } from "../entities/Player";
import type { Obstacle } from "../entities/Obstacle";
import { applyGravity, computeSpeed, jump } from "../physics/Physics";
import { checkPlayerObstacleCollision } from "../physics/Collision";
import { ObstacleSpawner } from "./ObstacleSpawner";
import { GameLoop } from "./GameLoop";
import { InputManager } from "../input/InputManager";
import { Renderer } from "../rendering/Renderer";
import type { GameState } from "./GameState";
import { gameStorage } from "../../services/storage/gameStorage";

export interface GameEngineCallbacks {
  onStateChange?: (state: GameState) => void;
  onScoreChange?: (score: number) => void;
  onHighScoreChange?: (highScore: number) => void;
}

/**
 * Owns all per-frame game state and the requestAnimationFrame loop. React never reads
 * mutable frame state directly — it only receives throttled callbacks (state transitions,
 * integer score changes), per the "React manages the app, the engine manages the game" rule.
 */
export class GameEngine {
  private state: GameState = "IDLE";
  private player: Player = createPlayer();
  private obstacles: Obstacle[] = [];
  private spawner = new ObstacleSpawner();
  private loop = new GameLoop((dt) => this.update(dt));
  private input: InputManager;
  private renderer: Renderer | null = null;
  private elapsedSeconds = 0;
  private lastReportedScore = -1;
  private highScore: number;
  private wasPlayingBeforeHidden = false;

  constructor(private callbacks: GameEngineCallbacks = {}, canvasTarget: HTMLElement | Window = window) {
    this.highScore = gameStorage.getHighScore();
    this.input = new InputManager(canvasTarget);
    this.input.attach();
    this.input.onJump(() => this.handleJump());
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  attachCanvas(ctx: CanvasRenderingContext2D): void {
    this.renderer = new Renderer(ctx);
    this.renderer.render({ player: this.player, obstacles: this.obstacles, score: 0, distance: 0 });
  }

  getHighScore(): number {
    return this.highScore;
  }

  start(): void {
    if (this.state === "PLAYING") return;
    this.reset();
    this.setState("PLAYING");
    this.input.setActive(true);
    this.loop.start();
  }

  restart(): void {
    this.start();
  }

  pause(): void {
    if (this.state !== "PLAYING") return;
    this.loop.stop();
    this.setState("PAUSED");
  }

  resume(): void {
    if (this.state !== "PAUSED") return;
    this.setState("PLAYING");
    this.loop.start();
  }

  reset(): void {
    this.loop.stop();
    this.player = createPlayer();
    this.obstacles = [];
    this.spawner.reset();
    this.elapsedSeconds = 0;
    this.lastReportedScore = -1;
    this.reportScore(0);
  }

  destroy(): void {
    this.loop.stop();
    this.input.detach();
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private handleJump(): void {
    if (this.state === "IDLE" || this.state === "GAME_OVER") {
      this.start();
      return;
    }
    if (this.state === "PLAYING") {
      jump(this.player);
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.wasPlayingBeforeHidden = this.state === "PLAYING";
      if (this.state === "PLAYING") this.pause();
    } else if (this.wasPlayingBeforeHidden && this.state === "PAUSED") {
      this.resume();
    }
  };

  private update(deltaTime: number): void {
    this.elapsedSeconds += deltaTime;
    const speed = computeSpeed(this.elapsedSeconds);

    applyGravity(this.player, deltaTime);
    this.obstacles = this.spawner.update(this.obstacles, deltaTime, speed);

    for (const obstacle of this.obstacles) {
      if (checkPlayerObstacleCollision(this.player, obstacle)) {
        this.endGame();
        break;
      }
    }

    const score = Math.floor(this.elapsedSeconds * gameConfig.scoreRate);
    this.reportScore(score);

    this.renderer?.render({
      player: this.player,
      obstacles: this.obstacles,
      score,
      distance: this.elapsedSeconds * speed,
    });
  }

  private endGame(): void {
    this.loop.stop();
    this.input.setActive(false);
    const finalScore = Math.floor(this.elapsedSeconds * gameConfig.scoreRate);
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      gameStorage.saveHighScore(this.highScore);
      this.callbacks.onHighScoreChange?.(this.highScore);
    }
    this.setState("GAME_OVER");
  }

  private reportScore(score: number): void {
    if (score !== this.lastReportedScore) {
      this.lastReportedScore = score;
      this.callbacks.onScoreChange?.(score);
    }
  }

  private setState(state: GameState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }
}
