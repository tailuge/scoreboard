# Glicko-2 ELO Rating System — Implementation Plan

## Overview

Add a Glicko-2 rating system to the scoreboard app. Ratings update whenever a
match result is uploaded via the existing POST `/api/match-results` endpoint.
A new `/elo` page displays the leaderboard per game type.

## Storage Design

One hash key per game type:

```
elo:{ruleType}   →  hash { playerName: PlayerRating (JSON) }
```

e.g. `elo:nineball`, `elo:snooker`, `elo:threecushion`

All players for a game type live in a single key. No key scanning required.
`hgetall` returns all players; `hset` upserts a single player.

## Data Types

```ts
type PlayerRating = {
  rating: number      // default 1500
  rd: number          // rating deviation, default 350
  volatility: number  // default 0.06
  lastUpdated: number // Date.now()
  gamesPlayed: number // default 0
}
```

Conservative rating (used for leaderboard sort): `rating - 2 * rd`

## Inactivity Decay (critical)

Without RD decay, inactive players stay artificially certain and the leaderboard
goes stale. When loading a player, apply decay before use:

```ts
function applyInactivity(player: PlayerRating): PlayerRating {
  const daysInactive = (Date.now() - player.lastUpdated) / 86_400_000
  const c = 50 // tuning constant
  const newRd = Math.min(Math.sqrt(player.rd ** 2 + c ** 2 * daysInactive), 350)
  return { ...player, rd: newRd }
}
```

Called inside `getOrCreate` before returning — so every consumer gets a
decay-adjusted rating automatically.

## Tasks

### Task 1 — Install dependency

```bash
yarn add glicko2.ts
```

### Task 2 — `src/services/RatingService.ts`

Pure Glicko-2 computation, no I/O.

- Export `PlayerRating` type and `DEFAULT_RATING` constant
- Export `applyInactivity(player): PlayerRating` — RD decay based on `lastUpdated`
- Export `updateMatchRatings(winner, loser): [PlayerRating, PlayerRating]`
  - Applies inactivity decay to both inputs before computing
  - Sets `lastUpdated = Date.now()` and increments `gamesPlayed` on outputs

Tests: `src/tests/RatingService.test.ts`
- Winner gains rating, loser loses rating
- High-RD players change more than low-RD players
- `applyInactivity` increases RD for inactive players, caps at 350

### Task 3 — `src/services/PlayerRatingStore.ts`

KV persistence using one hash per game type.

- `getOrCreate(ruleType, name)` — `hget` from `elo:{ruleType}`, returns stored or DEFAULT_RATING
  - Does NOT apply inactivity here — `RatingService.updateMatchRatings` handles it
- `save(ruleType, name, rating)` — `hset` into `elo:{ruleType}`
- `getTopN(ruleType, n)` — `hgetall` from `elo:{ruleType}`, applies inactivity decay to each,
  sort by `rating - 2 * rd` desc, return top N with `conservativeRating` field

Tests: `src/tests/PlayerRatingStore.test.ts` using `mockKv`
- New player returns default rating
- Saved rating is retrievable
- `getTopN` returns correct order

### Task 4 — Wire into match-results POST

Modify `src/pages/api/match-results.ts`:

- After `addMatchResult`, if both `winner` and `loser` are present, update ratings
- Failures are caught and logged — must not affect the HTTP response

Tests: `src/tests/api.elo-match-results.test.ts`
- POST with winner+loser triggers rating update
- POST with winner only skips rating update
- Rating update failure does not cause 500

### Task 5 — `src/pages/api/elo.ts`

Edge runtime GET endpoint.

- Query params: `ruleType` (default `nineball`), `limit` (default `10`)
- Validates `ruleType` with `isValidGameType`
- Returns `[{ name, rating, rd, conservativeRating, gamesPlayed }]` sorted by `conservativeRating` desc
- Cache: `s-maxage=30`

Tests: `src/tests/api.elo.test.ts`
- Returns 400 for invalid ruleType
- Returns sorted list when data exists
- Returns empty array when no data

### Task 6 — `src/pages/elo.tsx`

Simple frontend page.

- `getServerSideProps` fetches `/api/elo` for each game type in `GAME_TYPES`
- Table per game type: rank, name, rating, RD, conservative rating, games played
- Dark Tailwind theme consistent with `leaderboard.tsx`
- Label conservative rating clearly (e.g. "Score (rating − 2×RD)")
