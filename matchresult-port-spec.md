# Match result port

Port the match-result write path into `../messaging`: the handler lives in a new
`docker/matchresult.njs` module driven from `docker/api.njs`, writing to the same
Upstash KV the scoreboard already uses.

Backend write path only. The client repoint, the cutover, and any change to the
scoreboard's own routes are out of scope.

## Goal

Accept a POSTed match result in messaging, store it, and update player ratings —
with less code and fewer stored fields than the current Vercel implementation,
and without running on Vercel Fluid Compute at all.

The success condition is "match uploads no longer bill Vercel". The client does
block on the response: `../billiards` `src/controller/end.ts` awaits the upload,
and in the arena flow it then awaits the arena result with the "Back to Arena"
button disabled for the duration — so upload latency is visible to the player at
the end of a match. The requirement that follows is simply to keep the write to a
single round trip.

## Scope

**In scope**

- A `POST /api/match-results` handler in messaging, in its own module.
- The stored match record and its KV writes.
- Replay blob storage.
- Geo (country/city) for the stored record when known.
- Player rating updates, including which rating shape is written.

**Out of scope**

- Repointing the client (`../billiards`) at the messaging host.
- Cutover sequencing, dual writing, or retiring anything on the scoreboard.
- Deleting or editing the scoreboard's `src/pages/api/match-results.ts` — leave
  it untouched even though its POST becomes unused.
- Request-body size limits (nginx already caps at 1MB).
- Duplicate suppression — see Future work.
- The arena result flow (`/api/arena/<id>/result`), usage metrics, hiscores, and
  `GET /api/match-results`.

## Current flow (for reference)

The scoreboard builds the record, then `MatchResultService.addMatchResult` writes
`match_replay:<id>`, adds the record to the `match_results` sorted set scored by
timestamp, trims to the newest 32, and — for two-player uploads — updates both
players' Glicko-2 ratings plus an `elo-history` entry.

- The only caller of the scoreboard route is `../billiards`
  `src/network/client/scorereporter.ts`, and it only ever POSTs.
- `GET /api/match-results` has no callers anywhere in either repo.
- The lobby reads matches through `/api/summary`, so the stored field set is
  driven by the lobby's recent-matches row, not by the route's response.

## Route and wiring

- New module `docker/matchresult.njs`, exporting one handler (suggested name
  `matchResult`) via a default export, matching how `api.njs` and
  `nchan_meta.js` already export.
- `docker/api.njs` gains one import at the top and one dispatch line in its
  `router` for `POST /api/match-results`. Nothing else in `api.njs` changes; the
  file stays a dispatcher and does not grow a handler.
- `docker/Dockerfile` gains a `COPY` for the new file, beside the existing
  `COPY api.njs`. Only `api.njs` stays in `js_import`; `matchresult.njs` is
  reached by import from it.
- No `nginx.conf` change. The existing `location /api/` block
  (`docker/nchan.conf:195`) already routes to `api.router` and applies the same
  rate limiting as the other API routes.
- No logging. Nothing on the happy path, nothing on failure.
- Happy path only. No method handling beyond what the router already does, no
  input validation, no error-state design.

## Stored record

Store the POST body as received, minus `replayData`, plus `id`, `timestamp`,
`hasReplay`, and `locationCountry`/`locationCity` when they are known. No
allowlist. The lobby's recent-matches row is the authoritative consumer and it
keeps gaining fields (`club`, `card`), so anything the client sends is kept
rather than enumerated — that is also what the scoreboard does today, and it
means a new client field needs no change here or in the spec.

**Rules**

- `ruleType` is passed through **unvalidated**, defaulting to `nineball` only
  when absent. The client sends rule types outside the five game types —
  `reveal` is a live one that posts results — and the scoreboard stores whatever
  it is given. Validation must not be added.
- Every match type is stored: two-player, solo (no `loser`), bot games, reveal
  results. This matches today's behaviour exactly.
- `timestamp` is `Date.now()` at write; it is the sort score and the "Ago"
  column.
- `hasReplay` is set true only when a replay blob was stored.
- `id` uses the same 8-random-hex-chars algorithm as the scoreboard's `getUID`
  so replay keys and URLs keep the same shape. Nothing bundles that TypeScript
  helper into the image, so the algorithm is inlined in `matchresult.njs`.
- `replayData` is never part of the record. It is split off the body before the
  record is built, exactly as the scoreboard route does.

## KV writes

One round trip. The replay blob write, the match write, and the trim are issued
together as a single pipelined request, reusing messaging's existing `redis` and
`redisPipeline` helpers — no new library, and no Next.js or KV client.

| Order | Operation | Key | Notes |
| --- | --- | --- | --- |
| 1 (only if a blob was sent) | `SET` with expiry 432000s (5 days) | `match_replay:<id>` | Skipped entirely for uploads without a replay |
| 2 | `ZADD` score = timestamp, member = the record as JSON | `match_results` | One member per match |
| 3 | `ZREMRANGEBYRANK` ranks 0 to −33 | `match_results` | Keeps the newest 32, unchanged from today |

Keep the keys, the member shape, the 5-day TTL and the 32-entry trim identical
to the current implementation: that is what lets the scoreboard's existing reads
(`/api/summary`, `/api/match-replay`) keep working without changes.

The window stays at 32. At roughly 89 uploads/day that spans about 8 hours,
comfortably inside the 5-day replay TTL, so a rendered replay button cannot
point at an expired blob.

## Replay blobs

- Stored under their own key as today, with a 5-day expiry, and `hasReplay` set
  true on the record only when a non-empty blob was stored.
- The scoreboard keeps serving `/api/match-replay`, which looks up the blob and
  redirects to the game. Nothing about that endpoint changes.
- The blob is never copied into the `match_results` member.

## Geo

Store `locationCountry` and `locationCity` when they are already known, so the
lobby's flag and City column keep working. They come from the shared IP cache if
presence traffic has filled an entry for that IP; on a miss, omit both and do not
call a geo-IP service from this route.

## Ratings

Plain Elo replaces Glicko-2 for the write path. This removes the `glicko2.ts`
dependency from the port entirely — no dependency, no bundling, no port of the
volatility iteration.

### Update rule

- Classic Elo, K = 32, no rating deviation, no volatility, no inactivity decay.
- Expected score for the winner is `1 / (1 + 10 ** ((loserRating − winnerRating) / 400))`.
- The winner gains `K × (1 − expected)` and the loser loses exactly the same
  amount, so a match is zero-sum.
- Ratings are updated only when `loser` is present. That includes bot games,
  which do carry a `loser` — unchanged from today.
- An unknown player starts at 1500. An existing rating is carried over as that
  player's Elo rating; nothing is reset.

### Storage

- Key `elo:<ruleType>`, a Redis hash whose field is the player name and whose
  value is that player's rating JSON. This is the existing structure and the key
  must not change — `/api/elo`, `/api/summary` and the player page all read it.
- The rating JSON keeps **all the existing keys**:
  `{rating, rd, volatility, lastUpdated, gamesPlayed, wins, losses}`, with
  `rd` and `volatility` written as `0`. Keeping the keys means no existing
  reader can break on a missing field; the two Glicko-only fields are simply
  inert.
- `gamesPlayed`, `wins` and `losses` are incremented per result as today.
- One round trip per two-player match: read both players' current values, then
  write both ratings and both `elo-history` entries together in a single
  pipeline.
- Keep writing `elo-history:<ruleType>:<name>` as `{date: roundedRating}`. It
  feeds the player page's rating graph and nothing else.
- Remove the only other Glicko remnant: there is no `applyInactivity` equivalent
  in this module. Decay was a Glicko concept and plain Elo has no RD to decay.

### What the rating payload must expose (compatibility note)

These changes are implied by writing plain Elo but are not files this spec
edits — they describe what the written values must support:

- The leaderboard payloads built from the rating hash must expose `rating`.
  `conservativeRating` is no longer produced.
- Ranking must use the emitted `rating` directly, not a value derived from
  decaying `rd`. With `rd` written as `0` the old decayed formula would inflate
  toward `sqrt(2500 × daysInactive)`, pulling an idle player's published score
  down by roughly 100 points after a day and 265 after a week, while a player who
  just played would show their raw rating. Ranking on the raw rating removes the
  whole class of problem and needs no guard anywhere.
- The already-deployed lobby bundle reads
  `conservativeRating ?? Math.round(rating)`, so it tolerates the field
  disappearing and needs no change.
- The `/elo` page renders an RD column, which will read `0` for every player
  written since the switch. That is expected, not a bug.

### Effect on existing ratings

Switching models re-ranks every player once, by `2 × rd` (up to +700 at the 350
cap), and for a provisional player that is a lasting jump rather than a cosmetic
one. Measured against the current library: a rookie (1500, rd 350) beating a
1600, rd 60 veteran moves from a displayed conservative 1225 to a raw 1732,
leapfrogging that veteran at 1591. Ranks settle as those players keep playing Elo
games. This is accepted.

## Verification

No NJS unit tests exist for `api.njs` or its siblings, and E2E is out of scope
for cloud agents. Verify manually against the container:

- `POST /api/match-results` with only `winner` and `winnerScore` succeeds, the
  newest `match_results` member carries `timestamp`, `id` and no `replayData`,
  and any other body field (`club`, `card`, `version`) is stored as sent.
- The same POST with `replayData` stores a blob under `match_replay:<id>`, the
  member carries `hasReplay: true`, and a read of that key returns the blob.
- A two-player POST leaves both names present in `elo:<ruleType>` with `rd: 0`,
  with the winner's rating up and the loser's down by the same amount, and an
  `elo-history` entry for both.
- A non-five `ruleType` such as `reveal` round-trips stored as sent.
- `/api/summary` still renders the new match and the rankings, and the lobby row
  shows the parseable fields (rule, both names, scores, city, flag).
- A match uploaded from an IP with no `ip_cache` entry stores no country or city
  and does not stall on an external request.

## Checks

- `../messaging`: `npm run lint` (currently `tsc --noEmit` plus oxlint over
  `src` and `test`) — note the new `.njs` module sits outside those paths, so it
  is not covered by that gate.
- `../scoreboard`: `yarn test` and `yarn lint`.
- Confirm the new module loads: a syntax error in an NJS module surfaces at
  nginx start, so a container start plus one successful POST is the real gate.

## Future work

- **Duplicate suppression.** Not part of this spec. The client retries up to 3
  times on 5xx and there is no dedupe anywhere on this route today, so a retry
  can record the same match twice in the lobby window. The cheapest fix is the
  pattern messaging already uses for arena results — a `ZADD ... NX` guard keyed
  on a value unique to the match, which would require the client to send a stable
  match identifier.
- Deleting the scoreboard's now-unused `GET /api/match-results`.

## Decisions taken

| Decision | Choice |
| --- | --- |
| Handler location | New `docker/matchresult.njs`, dispatched from `api.njs` |
| Record fields | Store the body as received minus `replayData`, plus `id`, `timestamp`, `hasReplay`, geo |
| Geo | Store country/city when the IP cache already knows them; omit on miss |
| Replays | Keep as today — separate key, 5-day TTL, `hasReplay` flag |
| History window | Keep the newest 32 |
| Match types | All, unchanged (two-player, solo, bot, reveal) |
| `ruleType` | Passed through unvalidated |
| Ratings | Plain Elo, K = 32, unknown players start at 1500 |
| Rating hash | Keep all existing keys, `rd` and `volatility` = 0 |
| `elo-history` | Keep writing it |
| Ranking field | Emit `rating`; stop emitting `conservativeRating` |
| Logging | None |
| Scoreboard route | Untouched |
| Client repoint / cutover | Out of scope |
