# Offline Runner — Technical Specification

This is the authoritative, implementation-level spec for this repository. It consolidates
and supersedes `doc/Rec.md` and `doc/MASTER_PROMPT.md` (kept for historical reference —
`MASTER_PROMPT.md` is the fuller of the two; `Rec.md` is an earlier, shorter draft) and
tracks actual repository state, not just intent. `doc/Architecture.md` and `doc/workflow.md`
remain the structural/process reference this spec follows; when they and this file
disagree, this file wins because it reflects what is actually built.

## 1. Product summary

A production-quality web app that behaves normally while online and automatically swaps
in an original offline mini-game the instant the browser reports no connectivity. Core
loop: connection lost → offline screen → SPACE/tap to play → endless runner (jump over
obstacles) → collision → game over → SPACE/tap to restart. No Chrome Dino assets, code,
or branding are reused — visual identity and mechanics here are original (geometric robot
runner avoiding "energy barrier" obstacles), even though the "runner avoids obstacle"
genre is intentionally the same.

## 2. Stack

| Concern | Choice |
|---|---|
| UI | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| Rendering | HTML Canvas 2D (no WebGL, no game framework) |
| Styling | Plain CSS (`src/styles/game.css`), no CSS-in-JS |
| Offline/PWA | `vite-plugin-pwa` (Workbox `generateSW`), cache id `offline-game-v1` |
| Persistence | `localStorage`, wrapped in `services/storage/gameStorage.ts` |
| Unit tests | Vitest + jsdom |
| E2E tests | Playwright, Chromium project, dev-server-backed (`e2e/offline-flow.spec.ts`) |

No state management library (Zustand, Redux) is used — app-level state fits in two React
hooks (`useNetworkStatus`, `useOfflineGame`) and does not warrant one.

## 3. Governing architectural rule

> React manages the application. The game engine manages the game.

Concretely:
- React (`src/app`, `src/components`, `src/hooks`) owns screens, overlays, and
  low-frequency state (`AppMode` via `useNetworkStatus`, `GameState`/score via
  `useOfflineGame`).
- `GameEngine` (`src/game/engine/GameEngine.ts`) owns every per-frame value — player
  position/velocity, obstacle positions, elapsed time — and the `requestAnimationFrame`
  loop. React never reads this mutable frame state directly.
- The only data crossing from engine to React is through three throttled callbacks:
  `onStateChange` (fires only on a state transition), `onScoreChange` (fires only when
  the *integer* displayed score changes, i.e. ~`scoreRate` times/sec, not 60 times/sec),
  and `onHighScoreChange` (fires once, on a new record). This is what keeps React from
  re-rendering every animation frame.

## 4. Module map (what exists today)

```text
src/
├── app/App.tsx                    — ONLINE/OFFLINE switch via useNetworkStatus
├── components/
│   ├── OnlineApplication.tsx       — placeholder for the real online product UI
│   ├── OfflineGame.tsx             — offline container: wires GameCanvas + overlays
│   ├── GameCanvas.tsx              — canvas element, devicePixelRatio + resize handling
│   ├── ScoreDisplay.tsx            — live SCORE/BEST HUD during PLAYING/PAUSED
│   ├── GameOverlay.tsx             — IDLE "Press SPACE to Play" intro overlay
│   ├── GameOverScreen.tsx          — GAME_OVER overlay with final/best score + restart
│   └── GameErrorBoundary.tsx       — isolates a game crash from the whole React tree
├── game/
│   ├── config/gameConfig.ts        — every tunable constant (see §5)
│   ├── entities/Player.ts          — Player interface + createPlayer()
│   ├── entities/Obstacle.ts        — Obstacle interface + createObstacle()
│   ├── physics/Physics.ts          — applyGravity, jump, computeSpeed(elapsed)
│   ├── physics/Collision.ts        — AABB checkCollision + padded hitbox helper
│   ├── rendering/Renderer.ts       — draws sky/ground/parallax/player/obstacles
│   ├── input/InputManager.ts       — normalizes Space/ArrowUp/pointer into "jump"
│   └── engine/
│       ├── GameState.ts            — IDLE | PLAYING | PAUSED | GAME_OVER
│       ├── GameLoop.ts             — rAF wrapper; computes + clamps delta time
│       ├── ObstacleSpawner.ts      — time-gap-based spawn/move/cull, difficulty-aware
│       └── GameEngine.ts           — orchestrates all of the above; the only class
│                                     React touches (via useOfflineGame)
├── services/
│   ├── network/networkMonitor.ts   — navigator.onLine + online/offline subscription
│   └── storage/gameStorage.ts      — localStorage-backed high score, fails soft
├── hooks/
│   ├── useNetworkStatus.ts         — boolean isOnline, subscribes to networkMonitor
│   └── useOfflineGame.ts           — creates/owns a GameEngine per canvas mount
├── styles/game.css
└── main.tsx                        — React root + PWA service worker registration

public/icons/icon-192.svg, icon-512.svg  — original geometric mark (no borrowed art)
tests/*.test.ts                          — Vitest unit + engine-integration tests
e2e/offline-flow.spec.ts                 — Playwright E2E: full online/offline/replay flow
playwright.config.ts                     — spins up `npm run dev` and drives real Chromium
```

This matches `doc/Architecture.md` §25 folder structure, with one deliberate deviation:
`GameEngine` also owns obstacle spawning (`ObstacleSpawner`) rather than a separate
top-level module, since spawn timing is tightly coupled to the engine's elapsed-time and
difficulty state.

## 5. Configuration (`src/game/config/gameConfig.ts`)

All gameplay tuning lives here — nothing below is hardcoded elsewhere:

```ts
groundY: 220, canvasWidth: 800, canvasHeight: 300
player: { x: 60, width: 34, height: 42, gravity: 1800, jumpStrength: -650 }
speed:  { initial: 350, max: 700, rampDuration: 45 }   // seconds to reach max
obstacle: { minWidth: 20, maxWidth: 44, minHeight: 30, maxHeight: 60,
            minGapSeconds: 0.9, maxGapSeconds: 1.8 }
scoreRate: 10        // points per second survived
maxDeltaTime: 0.05   // seconds; clamps tab-suspend / slow-frame jumps
highScoreKey: "offlineGameHighScore"
```

Difficulty ramps continuously (not in discrete steps) via `computeSpeed(elapsedSeconds)`,
which lerps `initial → max` over `rampDuration` seconds and then holds at `max`. Obstacle
spawn gaps are chosen in **seconds**, not pixels, so spacing stays playable as speed
increases — this directly satisfies the "must be possible to avoid" / "no impossible
combinations" requirement from `MASTER_PROMPT.md`. Each obstacle keeps the speed it was
spawned with for its whole lifetime (deliberate: existing obstacles don't suddenly
accelerate mid-approach).

## 6. State machines

**App-level** (`useNetworkStatus`): `ONLINE ⇄ OFFLINE`, driven by `navigator.onLine` plus
`online`/`offline` events. `navigator.onLine` is treated as a connectivity signal, not
proof of internet reachability (per `Architecture.md` §6) — no stronger health check is
implemented yet (see §8, open items).

**Game-level** (`GameState` in `GameEngine`): `IDLE → PLAYING → GAME_OVER → PLAYING (via
restart) `, plus `PLAYING ⇄ PAUSED` driven by `document.visibilitychange` (tab hidden
pauses; tab visible resumes only if it was playing before hiding — implemented in
`GameEngine.handleVisibilityChange`).

## 7. Definition of done — status

Legend: ✅ done · 🚧 partial · ⬜ not started.

- ✅ Offline detection (`networkMonitor` + `useNetworkStatus`)
- ✅ Offline screen appears, SPACE/tap starts
- ✅ Player jumps (gravity + single jump, no mid-air double-jump)
- ✅ Obstacles spawn with playable, randomized, speed-aware spacing
- ✅ AABB collision (with padded hitbox for fair near-misses)
- ✅ Game over screen with final + best score, SPACE/tap restarts
- ✅ Score (time-based) + persisted high score (`localStorage`, fails soft)
- ✅ Mobile tap-to-jump (`InputManager` pointerdown)
- ✅ Tab-visibility pause/resume, delta-time clamping
- ✅ Service worker registered via `vite-plugin-pwa`; app shell + assets precached
  (`npm run build` confirmed: `dist/sw.js` generated, 10 entries precached)
- ✅ `npm run build` succeeds; `npx tsc --noEmit` clean; 19/19 Vitest tests pass
- ✅ Playwright E2E flow — `e2e/offline-flow.spec.ts` (5 tests, all passing against real
  Chromium via `npm run dev`): online-by-default, offline/online transitions via real
  `context.setOffline()`, full keyboard play-to-game-over-to-restart flow, tap/pointer
  equivalent flow, and high-score persistence across a restart. Run with `npm run e2e`.
- 🚧 Accessibility: keyboard + focus-visible + reduced-motion CSS are in; no
  screen-reader live-region status messaging beyond `role="status"`/`role="alert"` yet
- 🚧 Responsive/mobile manual QA across real device sizes — not yet performed
- 🚧 Live browser verification: covered indirectly through Playwright (real Chromium,
  real DOM, real `setOffline`), but no one has looked at it visually in a headed browser
  in this session — no `claude-in-chrome` connection was available. Playwright's
  `trace: "retain-on-failure"` would capture a trace on any future failure if you want to
  inspect one visually.
- ⬜ "App loads offline after refresh, post-install" — implemented via Workbox
  precaching but not manually verified end-to-end (disable network, refresh, confirm)
- ⬜ Lightweight reachability health check beyond `navigator.onLine` (optional per spec)
- ⬜ Object pooling for obstacles (explicitly deferred — only needed if profiling shows
  a problem; `Architecture.md` §22 calls this out as conditional)
- ⬜ Multi-game registry (`Architecture.md` §24) — out of scope for v1 by design

## 8. Known gaps / next work

1. Visually spot-check the app in a headed browser at least once (Playwright's headless
   Chromium run gives strong functional confidence, but no one has looked at the canvas
   rendering, animations, or overlay styling with human eyes yet).
2. Verify installed-PWA offline reload (build, serve `dist/`, disable network, refresh) —
   Workbox precaching is configured and `npm run build` confirms `dist/sw.js` is
   generated, but the actual "refresh with network off after install" sequence hasn't
   been run end-to-end.
3. Decide whether `OnlineApplication.tsx` should become real product UI or stay a
   placeholder — currently a stub per `Architecture.md` §7 intent.
4. Accessibility pass: confirm screen-reader announcements on state transitions, not just
   visual overlays.
5. `e2e/offline-flow.spec.ts` relies on natural (untriggered) collision timing rather than
   a deterministic test hook — reliable in practice (player never jumps, so a stationary
   grounded hitbox is virtually guaranteed to intersect an obstacle within a few seconds),
   but if this ever becomes flaky, consider adding a test-only "force collision" or
   "set speed" seam to `GameEngine` rather than lengthening timeouts further.
