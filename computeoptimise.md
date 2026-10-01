# Fluid Compute Optimisation

Working notes on reducing Vercel Fluid Compute for the scoreboard API routes.
Started 1 Oct 2026. No code changes committed yet for anything in "Next steps".

## Baseline

Vercel's Fluid Compute table, one day of traffic:

| Route | Invocations | Duration | Cache hit |
|---|---|---|---|
| `/api/match-results` | 89 | 12s | 0% |
| `/api/summary` | 49 | 7s | 0% |
| `/api/replay/[id]` | 11 | 1.22s | 0% |
| `/api/usage/[metric]` | 12 | 980ms | 0% |
| `/api/rank` | 5 | 720ms | 0% |
| `/api/match-replay` | 9 | 470ms | 0% |
| `/api/rank/[id]` | 1 | 170ms | 0% |

Totals: ~22.56s across 176 invocations. Share of duration:

- `/api/match-results` — **53%**
- `/api/summary` — **31%**
- everything else — 16%

Note the table's "Duration" divided by invocations is *not* per-request
compute. It is close to wall-clock response time, which conflates network and
queueing with actual work. Per-invocation figures from this table led to two
wrong conclusions early on (see Ruled out).

## Landed change: hourly leaderboard cache

`src/pages/api/summary.ts` — `getTopNBatch` now runs through
`unstable_cache` with `revalidate: 3600`. Only that call is cached;
`hiscores` and `recentMatches` stay uncached so new matches appear in the lobby
immediately.

`limitElo` is passed as an argument so `unstable_cache` folds it into the cache
key — otherwise `?limitElo=5` and `?limitElo=10` collide on one entry.

`src/tests/api.summary.test.ts` mocks `next/cache` to call through; the real
module pulls in web streams APIs jsdom does not provide (`TextEncoder is not
defined`).

Why this is still worth keeping even though it is not the 7s: it is the only
part of any route whose cost grows with the player base. `getTopNBatch` does an
`hgetall` of the entire `elo:<ruleType>` hash for every rule type, then decays,
maps and sorts every player in JS. At current size that is a few ms; it does
not stay that way.

## Measurements: `/api/match-results`

The only caller is `../billiards/src/network/client/scorereporter.ts:19`, and
it only ever POSTs. It retries up to 3 times with exponential backoff, but
there are no failures in practice, so 89 invocations ≈ 89 real match uploads.

Temporary `[mr-timing]` instrumentation added to the handler (see "Remove when
done" below). One solo upload, function executing in `lhr1`:

```
[mr-timing] POST parsed {"parsedMs":1,"payloadBytes":250,"replayBytes":809,"isTwoPlayer":false}
[mr-timing] POST stored {"storeMs":73}
[mr-timing] POST done   {"totalMs":88,"parsedMs":1,"storeMs":73,"eloMs":null,"isTwoPlayer":false}
```

Matching Vercel log: Execution Duration 117ms, Memory 451MB, response 334ms.

| Stage | ms |
|---|---|
| parse body + replay | 1 |
| `addMatchResult` — `set` + `zadd` + 3 eviction commands | **73** |
| UA parse, object build, serialise, log lines | ~14 |
| **in-function total** | **88** |
| billed Execution Duration | 117 |
| **implied fixed overhead** | **~29** |

Two conclusions:

1. **Real work is ~75% of the billed invocation.** Overhead is ~29ms.
2. **`addMatchResult` is 83% of the function, and 3 of its 5 commands exist only
   to maintain a 32-row cap.**

### Round trip cost

73ms across 5 sequential commands ≈ **~15ms per round trip**. That is very high
for Redis; same-region is normally 1-2ms. The function ran in `lhr1`, so the KV
instance is probably in a different region. **Worth confirming** — if true,
every command removed is worth ~15ms, and reducing round trips matters far more
than any other optimisation on this route.

### Command inventory, `addMatchResult`

| # | Command | Sequential | Note |
|---|---|---|---|
| 1 | `set match_replay:<id>` | yes | only when `replayData` present |
| 2 | `zadd match_results` | yes | |
| 3 | `zrange(0, -33)` | yes | eviction probe |
| 4 | `del(match_replay:<id>...)` | yes | conditional on 3 |
| 5 | `zremrangebyrank` | yes | eviction trim |

All five are sequential. 3-5 cannot start before 2 completes.

The probe (3) is likely the single most expensive of the five: it
deserialises up to 33 full `MatchResult` objects — including `userAgent`,
`browser` and `os` strings — over the wire, purely to read one `id` per entry.
Heavier than `set`, `zadd`, or `del`.

### Two-player vs solo

`handlePost` skips the whole ELO block when there is no `loser`
(`src/pages/api/match-results.ts:97`). Solo uploads run ~5 commands,
two-player ~11. Most uploads in practice are solo. `eloMs` in the timing logs
gives the real production split — currently unmeasured.

## Ruled out

Kept here so these are not re-investigated.

**"Cache headers on the GET will cut compute."** The GET has no callers at all.
`scorereporter.ts` only POSTs; the lobby reads matches via `/api/summary`, which
calls `MatchResultService.getMatchResults` directly. `s-maxage=15` on the GET is
caching a response nobody requests. POSTs are not cacheable regardless — this
is why the cache hit column reads 0% here. Not a misconfiguration.

**"There is a ~100ms cold-start floor per invocation."** Wrong. Derived from
dividing table duration by invocation count. Direct measurement shows ~29ms.
The 135ms/invocation figure was wall-clock, not billed compute.

**"Reduce memory by dropping heavy modules."** The import graph for this route
is under 1MB of JS (`glicko2.ts` ships 14KB of `index.js`; the 412K on disk is
mostly source maps). Against a 311-451MB isolate baseline this is a rounding
error. Vendoring a minimal Glicko implementation would be worse: hand-rolled
rating maths on a player-facing leaderboard to save ~0.3%.

**"The replay payload is inflating memory."** Measured: 809 bytes of replay
data, 250 bytes of metadata. Not a factor.

**"`getTopNBatch` is the CPU hog."** Wrong about the mechanism. It is real work
that scales with player count, so the cache is still worth having, but at
current size it was never the 7s.

**"`CORS_HEADERS` is missing `Access-Control-Allow-Origin`."** Not an issue —
`src/proxy.ts:18` sets it for all `/api/*` requests.

## Next steps

Priority order. 1 and 2 are the whole ballgame on this route.

### 1. TTL on replay keys — highest value

`set(key, replayData, { ex: N })` removes the need for both the probe and the
`del`. Eviction collapses to `zremrangebyrank` alone: **5 commands → 2, 5
sequential hops → 2**, and the two heaviest commands disappear.

Estimate: `storeMs` 73 → ~25-30ms, billed ~117 → ~65-70ms. Roughly 40% off the
route.

**Constraint:** `N` must outlive how long a match stays in the 32-row window,
or the lobby shows a replay button that 404s on `/api/match-replay`. Derivable
from actual match rate — check before committing.

### 2. Pipeline `del` + `zremrangebyrank`

If TTL semantics are unwanted, this saves one round trip (~15ms) for about two
lines, using the `(store as any).pipeline()` pattern already in
`src/services/scoretable.ts:57` and `src/services/PlayerRatingStore.ts:65`.
Steps 4 and 5 are independent of each other; both only need step 3's result.

### 3. Confirm the KV region

If the instance is not near the function's execution region, ~15ms per command
is explained and round trips are worth far more than everything else combined.
Also worth checking whether a region-paired instance is available.

### 4. Reduce invocation count — the structural fix

At 89 uploads we pay 89 isolate boots to append 89 rows to a sorted set. That
is the remaining inefficiency and it does not respond to micro-optimisation.
Options, in rough order of payoff:

- Batch writes on a timer or cron, draining a queue. 10 writes per invocation
  is a ~10x reduction.
- Make the POST a single cheap append (Redis list) and let a separate process
  do eviction and normalisation.

Only worth doing if 1-3 leave the bill unsatisfactory.

### 5. Drop `waitUntil` idea for ELO

Investigated and rejected as a *compute* measure. `waitUntil` keeps the
invocation alive to finish background work — Vercel bills the extended
duration, so the round trips are still paid for. It improves p50 latency and
nothing else. It also makes rating updates fire-and-forget: a failure after the
response is sent is silently lost, where today it is caught and logged.

### Not planned

- `revalidateTag("elo")` from the match-results POST. Only refreshes the
  leaderboard early on an active site; the 3600s revalidate already covers it.
- Caching `/api/summary` as a whole. Would freeze `recentMatches` for an hour
  and read as a bug.

## Instrumentation currently in the tree

`src/pages/api/match-results.ts` carries temporary `[mr-timing]` `console.log`
lines: `POST parsed`, `POST stored`, `POST done`, `GET done`.

Deliberately uses `console.log` rather than `logger.log` — `logger.enabled` is
derived from `typeof process` (`src/utils/logger.ts:47`), which is exactly the
Edge runtime condition, so `logger.log` would silently print nothing and waste a
deploy cycle. Uses `performance.now()` via `globalThis` because `Date.now()`
has too little resolution to measure a 12ms budget.

**Remove when done** — they count against Vercel log volume.

## Open questions

- Real solo vs two-player ratio in production (`eloMs` from the logs answers it).
- Whether Vercel bills fluid compute on Execution Duration or wall-clock. If
  wall-clock, round trips matter more than measured; if CPU, less. The TTL
  change is worth doing under either answer, so this does not block.
- Memory read 311MB in `sin1` and 451MB in `lhr1`. Probably region variance, but
  not established from single samples.
