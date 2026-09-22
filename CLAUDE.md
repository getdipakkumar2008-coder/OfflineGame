# CLAUDE.md

Guidance for Claude Code sessions working in this repository.

## What this is

An offline-first browser game: the app shows a normal UI while online, and automatically
swaps in an original endless-runner mini-game when `navigator.onLine` goes false. See
`spec.md` for the full technical spec and current implementation status (what's done,
what's partial, what's not started) — read it before making non-trivial changes, and
update its §7/§8 status sections when you finish work that changes them.

`doc/MASTER_PROMPT.md`, `doc/Architecture.md`, and `doc/workflow.md` are the original
product/architecture/process briefs this project was built from. `doc/Rec.md` is a
superseded earlier draft — ignore it in favor of `MASTER_PROMPT.md`. `spec.md` at the
root is the up-to-date synthesis of all of them plus real repo state; when in doubt,
trust `spec.md`.

## Non-negotiable rule

> React manages the application. The game engine manages the game.

`GameEngine` (`src/game/engine/GameEngine.ts`) owns all per-frame state (player position,
obstacle positions, elapsed time) and runs its own `requestAnimationFrame` loop. React
components and hooks must never read or mutate that frame state directly, and must never
be re-rendered on every animation frame. The only way data crosses from the engine to
React is the three callbacks in `GameEngineCallbacks` (`onStateChange`, `onScoreChange`,
`onHighScoreChange`), and `onScoreChange` must stay throttled to integer-score changes,
not raw per-frame values. If you're tempted to add a `useState` that updates every frame,
stop — that's the mistake this rule exists to prevent.

## Original assets only

Never copy Chrome Dino (or any other existing game's) art, sounds, code, or branding.
The visual identity here is a small robot-like player and angular "energy barrier"
obstacles, drawn procedurally in `src/game/rendering/Renderer.ts` — no external sprite
assets. Keep it that way; if you add new visuals, draw them the same way or generate
clearly original SVG/canvas art, and say so if you're ever unsure whether something is
too close to an existing game's identity.

## Config, not hardcoding

All gameplay tuning (gravity, jump strength, speed ramp, obstacle sizing/spacing, score
rate, delta-time clamp, the high-score storage key) lives in
`src/game/config/gameConfig.ts`. Don't hardcode a tuning constant somewhere else — add or
change it there.

## Working style for this repo

- Follow `doc/workflow.md`'s phased approach: implement one capability, run
  `npx tsc --noEmit`, run `npx vitest run`, run `npm run build`, fix anything broken,
  then move on. Don't build several unrelated phases blind and debug them all at once.
- Movement/physics must always use delta time (`x += speed * deltaTime`), never a fixed
  per-frame increment — see `src/game/physics/Physics.ts` for the existing pattern.
- Obstacle spawn gaps are chosen in **seconds**, not pixels, so spacing stays playable as
  speed ramps up (see `ObstacleSpawner`). Don't switch this to fixed pixel gaps.
- Keep `localStorage` access inside `src/services/storage/gameStorage.ts` — don't call
  `window.localStorage` directly elsewhere, and don't let a storage failure (private
  browsing, quota, disabled storage) throw uncaught; it already fails soft to an in-memory
  fallback, follow that pattern for any new persisted value.
- A crash inside the game must not take down the whole app — `GameErrorBoundary` wraps
  the canvas/engine tree in `OfflineGame.tsx`; keep new game-related UI inside it.

## Commands

```bash
npm install        # install deps
npm run dev         # dev server (Vite)
npm run build        # tsc --noEmit && vite build (also generates the service worker)
npm run preview       # serve the production build locally
npx tsc --noEmit     # typecheck only
npx vitest run        # unit tests (jsdom)
npm run e2e          # Playwright e2e tests (e2e/offline-flow.spec.ts, real Chromium)
```

## Verifying UI changes

This environment did not have a connected browser-automation tool when the initial
implementation was built, so the running app has **not** been visually verified in a real
browser — only `tsc`, `vitest`, and `vite build` were used to confirm correctness. Before
claiming a UI-affecting change works, actually run `npm run dev` and check it in a
browser (toggle DevTools → Network → Offline to trigger the game), or say explicitly that
you could not.

## Testing conventions

Tests live in `tests/*.test.ts` (Vitest, jsdom environment, see `vite.config.ts` `test`
block). `GameEngine` tests stub `requestAnimationFrame`/`cancelAnimationFrame` to drive
the loop deterministically instead of relying on real timers — follow that pattern for
any new engine-level test rather than using real `setTimeout`/`sleep`.
