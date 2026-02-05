# Findings: Lobby, Pairing, High Score, and Replay Review

## Critical / High
- **Replay links are broken for both leaderboard and short URLs.**
  - `src/pages/api/rank/[id].ts` reads `id` from query params, but the client uses a path param (`/api/rank/${item.id}?ruletype=...`). `id` ends up null, so replay redirects fail.
  - `public/leaderboard.html` generates the path‑based replay links.
  - Files: `src/pages/api/rank/[id].ts`, `public/leaderboard.html`

- **Shortener replay endpoint expects `?id=` even though URLs are generated as path segments.**
  - `Shortener.shortUrl` returns `/api/replay/<key>` but `src/pages/api/replay/[id].ts` only reads `id` from search params.
  - All short replay links return 400 unless `?id=` is appended.
  - Files: `src/pages/api/replay/[id].ts`, `src/services/shortener.ts`

- **Matchmaking isn’t atomic; join races can drop players or mis‑pair.**
  - `findOrCreate()` does a read‑then‑join without CAS/locking.
  - Two joiners can read the same 1‑player table and overwrite each other.
  - There’s also no duplicate‑player guard, so repeated joins can fill the table with the same user.
  - Files: `src/services/TableService.ts`

## Medium
- **“Seeking” timeout can eject matched players.**
  - Timeout redirects to `/game?error=timeout` after 45s even if a second player just joined.
  - The timeout is cleared on table updates, but the callback can race before the update effect runs.
  - File: `src/pages/lobby.tsx`

- **Replay lookup crashes on unknown IDs.**
  - `ScoreTable.get()` doesn’t handle missing entries; `item` can be `undefined` and `item.data` will throw.
  - File: `src/services/scoretable.ts`

- **High‑score submission can 500 on malformed input.**
  - `hiscore` assumes `state` exists and is valid JSONCrush payload; missing/invalid `state` throws before any response.
  - File: `src/pages/api/hiscore.ts`

## Open Question / Assumption
- **KV serialization for ZSET members.**
  - `ScoreTable.add()` stores an object as the ZSET `member`.
  - If `@vercel/kv` doesn’t serialize objects for ZSET members in production, leaderboards/likes could break silently.
  - File: `src/services/scoretable.ts`
