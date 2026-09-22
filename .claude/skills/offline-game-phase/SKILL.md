---
name: offline-game-phase
description: Resume phased implementation of this offline-runner game repo. Use when asked to "continue the game implementation", "do the next phase", "work through workflow.md", or when starting fresh work on this specific offline-game project and unsure what's already built.
---

# Offline Game — Phased Implementation

This repo builds an offline mini-game per `doc/MASTER_PROMPT.md` /
`doc/Architecture.md`, executed via the 20-phase plan in `doc/workflow.md`, with
`spec.md` as the living record of what's actually done vs. still open (see its §7
Definition-of-Done table and §8 Known gaps).

## Sequence to follow every time this skill runs

1. **Read state before acting.** Read `spec.md` §7 and §8 first — they say what's ✅,
   🚧, or ⬜. Don't re-derive this from scratch by re-reading all of `doc/*.md`; those
   are the original brief, `spec.md` is the current truth.
2. **Pick the next incomplete item.** Prefer the earliest ⬜/🚧 item in `spec.md` §7,
   unless the user asked for something specific — in which case do that, but still check
   whether it depends on an earlier unfinished phase first.
3. **Implement one phase/item at a time.** Do not batch multiple unrelated phases into
   one change before verifying. This mirrors `doc/workflow.md` §1's explicit instruction
   not to build the whole system blindly in one step.
4. **Verify after every phase, in this order:**
   ```bash
   npx tsc --noEmit
   npx vitest run
   npm run build
   ```
   Fix failures before moving to the next phase. Never move on with a red build or a
   failing test.
5. **UI-affecting changes need a real browser check**, not just the commands above —
   `npm run dev`, then toggle DevTools → Network → Offline to trigger the game, or use
   connected browser automation if available. If no browser is available in this
   environment, say so explicitly instead of claiming it was verified (see `CLAUDE.md`
   "Verifying UI changes").
6. **Update `spec.md`** — flip the item's status in §7 and adjust §8's gap list — as part
   of the same change, not as an afterthought later.
7. **Commit only if the user's workflow calls for it** (small, phase-scoped commits per
   `doc/workflow.md` §23's suggested message style: `feat: add <capability>`,
   `test: add <thing> tests`) — don't commit unless asked to, per standard git-safety
   rules.

## Hard constraints (see CLAUDE.md for the full list)

- React never owns per-frame game state; `GameEngine` does. Don't add a `useState` that
  updates on every animation frame.
- Delta-time movement only (`x += speed * deltaTime`), never fixed per-frame increments.
- All tuning constants go in `src/game/config/gameConfig.ts`, nowhere else.
- No Chrome Dino (or other existing game's) art/sounds/code/branding — original visuals
  only, drawn in `src/game/rendering/Renderer.ts`.
- `localStorage` access stays inside `src/services/storage/gameStorage.ts`.

## Where things live (quick index)

| Need to touch... | File |
|---|---|
| Gameplay tuning | `src/game/config/gameConfig.ts` |
| Player physics | `src/game/physics/Physics.ts`, `src/game/entities/Player.ts` |
| Obstacle spawn/difficulty | `src/game/engine/ObstacleSpawner.ts` |
| Collision rules | `src/game/physics/Collision.ts` |
| Visuals | `src/game/rendering/Renderer.ts` |
| Input (keyboard/touch) | `src/game/input/InputManager.ts` |
| Engine orchestration / state machine | `src/game/engine/GameEngine.ts`, `GameState.ts`, `GameLoop.ts` |
| Network detection | `src/services/network/networkMonitor.ts`, `src/hooks/useNetworkStatus.ts` |
| High score persistence | `src/services/storage/gameStorage.ts` |
| React ⇄ engine bridge | `src/hooks/useOfflineGame.ts` |
| Screens/overlays | `src/components/*.tsx` |
| Unit tests | `tests/*.test.ts` (Vitest, jsdom; stub rAF for engine tests — see existing tests for the pattern) |

## Currently open work (as of last spec.md update)

Check `spec.md` §8 for the live list — do not trust a cached copy of it here. As of the
Playwright E2E addition, the known gaps were: no headed-browser visual spot-check, no
manual "installed PWA works offline after refresh" check, no decision on
`OnlineApplication.tsx` real content, a lighter accessibility screen-reader pass, and the
E2E collision test relying on natural timing rather than a deterministic hook. Re-read
`spec.md` to confirm this is still accurate before starting.
