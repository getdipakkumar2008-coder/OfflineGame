import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameEngine } from "../src/game/engine/GameEngine";
import type { GameState } from "../src/game/engine/GameState";

/**
 * Drives GameEngine's internal GameLoop deterministically by stubbing
 * requestAnimationFrame/cancelAnimationFrame instead of relying on real timers.
 */
describe("GameEngine", () => {
  let pendingFrame: FrameRequestCallback | null = null;
  let clock = 0;

  beforeEach(() => {
    clock = 0;
    pendingFrame = null;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      pendingFrame = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      pendingFrame = null;
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function tick(deltaMs: number) {
    clock += deltaMs;
    const cb = pendingFrame;
    pendingFrame = null;
    cb?.(clock);
  }

  it("goes IDLE -> PLAYING on start() and reports a growing score", () => {
    const states: GameState[] = [];
    const scores: number[] = [];
    const engine = new GameEngine(
      { onStateChange: (s) => states.push(s), onScoreChange: (s) => scores.push(s) },
      document.createElement("div")
    );

    expect(states).toEqual([]);
    engine.start();
    expect(states).toEqual(["PLAYING"]);

    tick(0); // establishes the loop's timestamp baseline
    for (let i = 0; i < 20; i++) tick(50);

    expect(scores.length).toBeGreaterThan(0);
    expect(scores[scores.length - 1]).toBeGreaterThan(0);

    engine.destroy();
  });

  it("ends the game on collision and lets restart() reset score and state", () => {
    const states: GameState[] = [];
    const scores: number[] = [];
    const engine = new GameEngine(
      { onStateChange: (s) => states.push(s), onScoreChange: (s) => scores.push(s) },
      document.createElement("div")
    );

    engine.start();
    tick(0);
    // Player never jumps, so any spawned obstacle will eventually collide with it on the
    // ground. 400 frames at a 50ms clamped delta covers 20s of simulated survival time,
    // comfortably more than enough for at least one obstacle to cross the player.
    for (let i = 0; i < 400 && !states.includes("GAME_OVER"); i++) tick(50);

    expect(states).toContain("GAME_OVER");
    const scoreAtGameOver = scores[scores.length - 1];
    expect(scoreAtGameOver).toBeGreaterThan(0);

    engine.restart();
    expect(states[states.length - 1]).toBe("PLAYING");
    expect(scores[scores.length - 1]).toBe(0);

    engine.destroy();
  });
});
