import { beforeEach, describe, expect, it } from "vitest";
import { gameStorage } from "../src/services/storage/gameStorage";
import { gameConfig } from "../src/game/config/gameConfig";

describe("gameStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns 0 when nothing has been saved", () => {
    expect(gameStorage.getHighScore()).toBe(0);
  });

  it("persists and reads back a high score", () => {
    gameStorage.saveHighScore(250);
    expect(gameStorage.getHighScore()).toBe(250);
    expect(window.localStorage.getItem(gameConfig.highScoreKey)).toBe("250");
  });

  it("ignores negative or non-finite scores and stores 0 instead", () => {
    gameStorage.saveHighScore(-5);
    expect(gameStorage.getHighScore()).toBe(0);
  });

  it("resets the stored high score", () => {
    gameStorage.saveHighScore(99);
    gameStorage.resetHighScore();
    expect(gameStorage.getHighScore()).toBe(0);
  });

  it("ignores corrupted stored values", () => {
    window.localStorage.setItem(gameConfig.highScoreKey, "not-a-number");
    expect(gameStorage.getHighScore()).toBe(0);
  });
});
