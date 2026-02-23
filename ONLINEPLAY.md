# Online Play Identity Flow

This document explains how player identity is loaded, overridden, and persisted in online play.

## TL;DR
- `test.html` now passes a `playerId` query param for each iframe.
- `lobby` now respects URL `playerId` (and `userId` alias) via `UserContext`.
- In single-window multi-iframe testing, each iframe can keep a distinct runtime `userId`.

## Identity Keys
- `userId`: stored in `localStorage` key `userId`.
- `userName`: stored in `localStorage` key `userName`.

Main implementation: `src/contexts/UserContext.tsx`.

## Load/Save Precedence
On first mount (`UserProvider`):
1. Read `localStorage.userId`.
2. If missing, generate one with `getUID()` and persist to `localStorage.userId`.
3. Read `localStorage.userName`.
4. If missing (or generic anonymous), use localized anonymous name in memory.

When router is ready:
1. Read URL `playerId` (preferred) or URL `userId` (alias).
2. If present, override current `userId` in state and persist to `localStorage.userId`.
3. Read URL `username`.
4. If present, override current `userName` in state and persist to `localStorage.userName`.

So URL values are the highest precedence once `router.isReady === true`.

## Where `userId` Is Used
- Table creation/join/spectate/delete APIs use `userId` as player identity.
- Presence events (`join`/`heartbeat`/`leave`) are keyed by `userId`.
- Game launch URL passes it as `clientId` to the billiards client.

Examples:
- `src/components/hooks/useLobbyTables.ts`
- `src/components/hooks/usePresenceList.ts`
- `src/utils/GameUrl.ts`

## `test.html` Behavior
`public/test.html` now:
- Uses local origin (`/lobby`) when opened from app host (for local dev).
- Falls back to `https://scoreboard-tailuge.vercel.app/lobby` when opened as `file://...`.
- Generates and passes both:
  - `username=<random name>`
  - `playerId=<random 8-char id>`

This fixes the prior issue where multiple iframes shared one `localStorage.userId` and appeared as the same player.

## Answer To The Original Question
- Was `playerId` passed from `test.html` before? **No.**
- Was `playerId` respected by app code before? **No.**
- Is it passed and respected now? **Yes.**

## Practical Testing Notes
- For one-window testing, use `http://localhost:3000/test.html`.
- Each iframe now has its own URL-level `playerId`, which is used by runtime state.
- `localStorage` is still shared by same-origin iframes, so the last iframe to write `userId` will win in storage, but URL override ensures each iframe runs with its own ID.

## Related Highscore ID (Different Flow)
`public/hiscore.html` uses query param `id` for leaderboard initials upload (`/api/hiscore?ruletype=...&id=...`).
This is separate from online lobby identity (`userId`/`playerId`).
