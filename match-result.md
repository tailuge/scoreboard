# Match result upload: port from scoreboard (Vercel) to messaging (NJS)

Spec for moving the match-result **write** path out of this repo and into
`../messaging`, where it is served by NJS in `docker/matchresult.njs` (driven
from `docker/api.njs`) against the same Upstash KV the scoreboard uses. Happy
path only; the scoreboard keeps serving the reads (`GET /api/match-results`,
`/api/match-replay`) and the lobby/ELO pages.

Decisions taken: messaging owns the write and the client is repointed; the
handler lives in its own module so `api.njs` only grows by an import and a
dispatch line; ELO becomes plain Elo and both ranking readers rank on the raw
rating, dropping the `rating − 2×rd` key; replay blobs keep the
`match_replay:<id>` key and 5-day TTL; `ruleType` is passed through unvalidated;
messaging implements POST only.

## Part 1 — How it works today (scoreboard)

Flow:

1. Client (`../billiards`, `src/network/client/matchresult.ts` → `scorereporter.ts`)
   POSTs `https://scoreboard-tailuge.vercel.app/api/match-results` with
   `{winner, winnerId, loser?, loserId?, winnerScore, loserScore?, ruleType,
   replayData?, version?, userAgent?, bot?, freeaim?, tableSize?, arenaId?, berserk?}`.
   Retries up to 3 times with backoff; any 4xx other than 429 is treated as final.
2. `src/pages/api/match-results.ts` (edge): parses JSON, splits off `replayData`,
   requires `winner` + numeric `winnerScore` (else 400), then builds the stored
   record: `ruleType` defaults to `nineball`, `id = getUID()`, `timestamp = Date.now()`,
   plus Vercel geo headers (`x-vercel-ip-country/region/city`) and UA fields.
3. `MatchResultService.addMatchResult(result, replayData)` writes in **one pipeline**:
   - `SET match_replay:<id> <blob> EX 432000` (5 days) and `hasReplay = true` when a blob was sent
   - `ZADD match_results <timestamp> <JSON.stringify(result)>`
   - `ZREMRANGEBYRANK match_results 0 -33` (trim to the newest 32)
4. Two-player only (`loser` present): read both ratings, update, save (see ELO below).
5. Respond `201` with the stored record. Client only checks `response.ok`.

Storage (shared Upstash / Vercel KV instance):

| Key                 | Type           | Value                                                 |
| ------------------- | -------------- | ----------------------------------------------------- |
| `match_results`     | sorted set     | score = `timestamp`, member = full `MatchResult` JSON |
| `match_replay:<id>` | string, 5d TTL | replay blob                                           |
| `elo:<ruleType>`    | hash           | field = player name, value = rating JSON              |

ELO today (`RatingService` + `PlayerRatingStore`): Glicko-2 (`glicko2.ts`, tau 0.5,
start 1500/rD 350) with inactivity RD inflation, `DEFAULT_RATING` for unknown players,
`HSET elo:<rule>` per player plus an `elo-history:<rule>:<name>` hash of
`{YYYY-MM-DD: rating}` for the player page. Ranking reads (in `messaging/…/api.njs`
today and scoreboard `/api/elo`) sort on `conservativeRating = rating - 2*rd` after decay
— this sorting key is one of the things the port changes (see Part 2).

Consumers of the written data: lobby `recentMatches` (via `/api/summary` or
`messaging/api.njs` `readRecentMatches`), `GET /api/match-results`,
`/api/match-replay` (looks up the blob, then 307-redirects to `GAME_BASE_URL` with
`ruletype` + `state`), and the rankings tables. `locationCountry` drives the lobby
flag; `userAgent`/`browser`/`os` are stored but not rendered anywhere.

## Part 2 — How messaging reimplements it

### Route

New module `docker/matchresult.njs`, exporting its handler as
`export default { matchResult }`. `docker/api.njs` gains one import at the top
(`import matchresult from "./matchresult.njs";`) and one line in `router`,
alongside the existing entries (`/api/summary`, `/api/usage/*`, `/api/arena/*`):

```
if (r.uri === '/api/match-results' && r.method === 'POST')
    return await matchresult.matchResult(r);
```

The module is reached through the existing `location /api/` block
(`docker/nchan.conf:195`), which already routes to `api.router` and applies the
same rate limiting as the other API routes; no `nginx.conf` change, and
`api.njs` stays the only entry in `js_import`. Add
`COPY matchresult.njs /etc/nginx/matchresult.njs` beside the existing
`COPY api.njs` in `docker/Dockerfile`. Keep the rest of the request handling
(the `router` try/catch, the `json` helper) as it is — `matchresult.njs` owns
only the match-result branch.

### Storage helpers

Reuse what is already in the file — `redis(...)` for single commands and
`redisPipeline(commands)` (`POST <url>/pipeline`) when a read must ride behind writes
in the same round trip. No new libraries, no Next.js/KV client.

### Write path

1. `readBody(r)`.
2. Build the stored record: `ruleType = body.ruleType || "nineball"`, passed
   through **unvalidated** — the scoreboard stores whatever the client sends
   and every reader tolerates it (`reveal` is a live rule type that posts
   results, and nothing lists it alongside the five game types). `id` is 8
   random hex chars, the same algorithm as `getUID()` in `src/utils/uid.ts` —
   inline it in `matchresult.njs` as `createMessageId()` in
   `docker/nchan_meta.js` already does, since nothing bundles the TS helper
   into the image. `timestamp = Date.now()`.
3. If `body.replayData` is a non-empty string, set `hasReplay = true`. The blob is
   **never** stored on the record — it goes to its own key. Do not copy `replayData`
   into the member (`{replayData, ...rest}` split, as the scoreboard route does).
4. Optional metadata: `bot`, `freeaim`, `tableSize`, `arenaId`, `berserk`, `version`
   are forwarded as-is; `userAgent` / `browser` / `os` come from the existing
   `reduceUA` / `parseUA` logic, and `locationCountry` / `locationCity` from
   `buildMeta` — both in `docker/nchan_meta.js`, the same source that feeds presence
   metadata. `buildMeta` reads `ngx.shared.ip_cache` first and only calls the geo-IP
   service on a miss, so a warm cache costs no extra round trip. To reach them from
   `matchresult.njs`, add the three helpers to `nchan_meta.js`'s `export default` and
   import that module — it is a separate NJS module today and `api.njs` currently has
   no imports at all.
5. One pipeline write:

```
const member = JSON.stringify(record);
const commands = [];
if (replayBlob) commands.push(["SET", `match_replay:${record.id}`, replayBlob, "EX", "432000"]);
commands.push(["ZADD", "match_results", String(record.timestamp), member]);
commands.push(["ZREMRANGEBYRANK", "match_results", "0", "-33"]);
await redisPipeline(commands);
```

Keys, member shape, trim (keep 32) and the 5-day TTL must match Part 1 exactly —
that is what makes the scoreboard's reads keep working unchanged.

6. Two-player only (`body.loser` present): update ratings (next section).
7. Respond `201` with the record JSON.

### ELO: simple Elo instead of Glicko-2

Classic Elo, K = 32, no rating deviation, no volatility, no inactivity decay:

```
Ew  = 1 / (1 + 10 ** ((Rl - Rw) / 400))
Rw' = Rw + K * (1 - Ew)
Rl' = Rl - K * (1 - Ew)
```

- Two reads, one write, one round trip: `HMGET elo:<ruleType> winner loser`, compute,
  then `HSET elo:<ruleType> winner <json>` + `HSET elo:<ruleType> loser <json>` in one
  pipeline. Default rating for an unknown player: `1500`.
- Keep the stored field shape so readers do not change:
  `{rating, rd, volatility, lastUpdated, gamesPlayed, wins, losses}` with counters
  incremented per result and `rd: 0`, `volatility: 0`.
- Keep the `elo-history:<ruleType>:<name>` `{date: roundedRating}` HSET only while the
  scoreboard's player page exists; it is one extra command in the same pipeline and can
  be dropped with that page.
- **Companion change in both readers: rank on the raw rating.** Drop the
  `rating − 2×rd` key from `parseTopPlayers` in `docker/api.njs:231-249`
  (`conservativeRating: Math.round(p.rating)`) and from `PlayerRatingStore.processEntries`
  in this repo (`src/services/PlayerRatingStore.ts`, backing the scoreboard's `/api/elo`
  and `/api/summary`). With `rd: 0` the two keys agree for plain-Elo records anyway;
  dropping the penalty is what stops a `rd` that decays from pushing a record's
  published score around (`decayedRd(0, …)` inflates to `sqrt(2500 * days)`, ~100 points
  on day 1 and ~265 by day 7). `decayedRd` is then unused in `api.njs`, and
  `applyInactivity` keeps its only other caller in `RatingService.updateMatchRatings`
  until the scoreboard POST retires, after which it is dead too.
- Ranking on the raw rating re-ranks everything once, by `2×rd` (up to +700 at the 350
  cap) — and for a provisional player that is a large, lasting jump rather than a
  cosmetic one. Measured against the current library, a rookie (1500/rd 350) beating a
  1600/rd 60 veteran goes from a conservative 1225 to a raw 1732, leapfrogging that
  veteran at 1591. Ranks settle as those players keep playing Elo games.
- User-visible copy still describes the old model: the header in `src/pages/elo.tsx:43`
  reads "Glicko-2 · Score = rating − 2×RD", and the page renders an RD column (`:97`)
  that is 0 for every player written since the switch. Update the header; the column can
  stay as-is or go.
- No Glicko-2 port means no new dependency and no bundling work in the NJS project.

### Client change (`../billiards`)

`ScoreReporter` builds the URL from its `baseURL` field (default
`scoreboard-tailuge.vercel.app`). Repoint that default at the messaging host, or pass
the host in at construction where the arena base URL is already configured. The payload
sent stays byte-identical, so no other client change is needed.

## Part 3 — Rollout

- Same KV instance, so no data migration; `match_results`, `match_replay:*` and
  `elo:*` are already shared with the scoreboard.
- Ship the reader change and the scoreboard POST retirement together, and not
  before it. Changing the ranking key while the scoreboard still writes Glicko would
  rank each player at their raw rating the instant they win (1732 in the example
  above), whereas retiring POST first is harmless because the readers are unchanged.
- Deploy messaging first (it accepts and writes), then ship the client repoint. Both
  writers can coexist briefly — duplicate uploads from retries are already possible
  today and there is no dedupe on this route. If wanted, the `arenaResult` pattern
  (`ZADD <scored-key> NX` on the client's `challengeId`) is the cheapest dedupe.
- After the client repoint is out, retire the POST branch of the scoreboard's
  `src/pages/api/match-results.ts` and keep the GET (its `Allow` header shrinks to
  `GET`). The POST cases in `src/tests/api.match-results.test.ts` and
  `src/tests/api.elo-match-results.test.ts`, and the ELO assertions in
  `src/tests/MatchResultService.test.ts`, retire with it; anything still worth
  asserting moves to the NJS route's checks below.

## Part 4 — Verification

- Manual, against a local/free-tier container (there are no NJS unit tests for
  `api.njs`, the suite is Jest/testcontainers around the library, and E2E is out of
  scope for cloud agents):
  - `curl -X POST .../api/match-results -d '{"winner":"a","winnerScore":5}'` → 201;
    `ZREVRANGE match_results 0 0` shows the member with `timestamp` and no `replayData`.
  - Same with `replayData` → `GET match_replay:<id>` returns the blob, member has
    `hasReplay: true`.
  - Two-player POST → `HGETALL elo:<ruleType>` shows both players with `rd: 0`; the
    winner's rating rose and the loser's fell by the same amount; `/api/summary` still
    renders the matches and the rankings.
  - Rankings sort on the raw rating: on `/api/elo` and the lobby leaderboard the sort
    key equals the displayed `rating`, and the RD column reads 0 for players written
    since the switch.
  - A `reveal` (or any other non-five) `ruleType` round-trips stored as sent, and
    appears in `/api/match-results`.
- Lobby checks: `recentMatches` shows the new match with its city/flag, and the replay
  button on a `hasReplay` row still redirects via the scoreboard's `/api/match-replay`.

## Non-goals

- Porting the Glicko-2 math, the replay/redirect endpoint, `GET /api/match-results`,
  hiscores, or `/api/summary` (it already reads `match_results`).
- Input validation and error-state handling beyond the happy path (including
  `ruleType` validation, which stays as permissive as the scoreboard's).
- Dedupe, rate-limit tuning, and integrity checks (the score was never validated
  against the replay and stays client-trusted).
