import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end coverage of the core product flow from doc/workflow.md Phase 17 and
 * doc/MASTER_PROMPT.md's "Final Product Flow":
 *
 *   online app -> connection lost -> offline intro -> SPACE/tap -> play ->
 *   collision -> game over -> SPACE/tap -> play again -> connection restored -> online app
 *
 * `page.context().setOffline(true/false)` drives Chromium's real online/offline
 * network state, which fires the browser's `online`/`offline` events and flips
 * `navigator.onLine` — exactly the signal `networkMonitor` listens for. No app code is
 * mocked; this exercises the real detection path.
 *
 * The player is never made to jump in these tests, so on a stationary, always-grounded
 * player an obstacle is effectively guaranteed to collide with it within a few seconds —
 * that's how "wait for game over" is triggered deterministically without a test-only hook.
 */

async function goOffline(page: Page) {
  await page.context().setOffline(true);
  await expect(page.getByText("OFFLINE MODE")).toBeVisible();
}

async function goOnline(page: Page) {
  await page.context().setOffline(false);
  await expect(page.getByRole("heading", { name: "You're online" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "You're online" })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  // Always leave the shared browser context back online for the next test.
  await page.context().setOffline(false);
});

test("shows the normal application while online", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "You're online" })).toBeVisible();
  await expect(page.getByText("OFFLINE MODE")).not.toBeVisible();
});

test("switches to the offline game when connectivity drops, and back when it returns", async ({
  page,
}) => {
  await goOffline(page);
  await expect(page.getByText("OFFLINE — no connection")).toBeVisible();
  await expect(page.getByText("Connection unavailable")).toBeVisible();

  await goOnline(page);
  await expect(page.getByText("OFFLINE MODE")).not.toBeVisible();
});

test("keyboard flow: Space starts the game, survives to game over, Space restarts", async ({
  page,
}) => {
  test.setTimeout(45_000);

  await goOffline(page);
  await expect(page.getByText("Press SPACE to Play")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByText(/^SCORE \d{5}$/)).toBeVisible();
  await expect(page.getByText("Press SPACE to Play")).not.toBeVisible();

  // Score should be increasing over time (time/distance-based, not frame-based).
  const firstScoreText = await page.getByText(/^SCORE \d{5}$/).textContent();
  await page.waitForTimeout(1000);
  const laterScoreText = await page.getByText(/^SCORE \d{5}$/).textContent();
  expect(laterScoreText).not.toBe(firstScoreText);

  // Player never jumps, so a collision with a spawned obstacle is expected soon.
  await expect(page.getByText("GAME OVER")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^SCORE \d{5}$/)).toBeVisible();
  await expect(page.getByText(/^BEST \d{5}$/)).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByText("GAME OVER")).not.toBeVisible();
  await expect(page.getByText(/^SCORE \d{5}$/)).toBeVisible();
});

test("touch/pointer flow: tapping the overlay buttons starts and restarts the game", async ({
  page,
}) => {
  test.setTimeout(45_000);

  await goOffline(page);
  await page.getByRole("button", { name: "Press SPACE to Play" }).click();
  await expect(page.getByText(/^SCORE \d{5}$/)).toBeVisible();

  await expect(page.getByText("GAME OVER")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Press SPACE to Play Again" }).click();
  await expect(page.getByText("GAME OVER")).not.toBeVisible();
  await expect(page.getByText(/^SCORE \d{5}$/)).toBeVisible();
});

test("persists the high score across a restart", async ({ page }) => {
  test.setTimeout(60_000);

  await goOffline(page);
  await page.keyboard.press("Space");
  await expect(page.getByText("GAME OVER")).toBeVisible({ timeout: 20_000 });

  const bestAfterFirstRun = await page.getByText(/^BEST \d{5}$/).textContent();
  expect(bestAfterFirstRun).not.toBe("BEST 00000");

  await page.keyboard.press("Space");
  await expect(page.getByText(/^SCORE \d{5}$/)).toBeVisible();
  await expect(page.getByText("GAME OVER")).toBeVisible({ timeout: 20_000 });

  const bestAfterSecondRun = await page.getByText(/^BEST \d{5}$/).textContent();
  // The best score is monotonic: a second, independent run should never lower it.
  const parseScore = (text: string | null) => Number(text?.replace(/\D/g, "") ?? 0);
  expect(parseScore(bestAfterSecondRun)).toBeGreaterThanOrEqual(parseScore(bestAfterFirstRun));
});
