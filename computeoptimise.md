# Fluid Compute Optimisation

Working notes on reducing Vercel Fluid Compute for the scoreboard API routes.
Started 1 Oct 2026. Updated 1 Oct 2026 after reading the 30-day usage graphs and
inspecting the `glicko2.ts` internals.

## Current meters (30-day window, Sep 1 6am – Oct 1 6am)

Two graphs, two different Fluid meters. They are not interchangeable and they
are nowhere near equally loaded.

**Provisioned memory (GB-hrs), by runtime:**

| runtime | GB-hrs | share |
|---|---|---|
| edge | 9.9 | 85% |
| nodejs24.x | 1.8 | 15% |
| **total** | **11.7** | |

**Fluid Active CPU:** 3h 16m used of a **4h** allowance → **~82% consumed**.

Vercel Hobby includes **4 active-CPU hours** and **360 provisioned-memory
GB-hrs** per month; overage at **$0.128/CPU-hr** and **$0.0106/GB-hr**
($0.60/million invocations). Applying those:

| meter | used | allowance | % used | list cost |
|---|---|---|---|---|
| Active CPU | 3h16m (3.27h) | 4h | **~82%** | ~$0.42 |
| Provisioned memory | 11.7 GB-hrs | 360 GB-hrs | **~3%** | ~$0.12 |

### Conclusions

1. **Active CPU is the binding constraint.** ~82% of the allowance vs ~3% of
   the memory allowance. CPU is what hits a wall or starts costing money first.
   Memory-time is not scarce at current volume.
2. **On list pricing, CPU is ~77% of the Fluid cost** ($0.42 vs $0.12). Any
   optimisation that only reduces wall-clock/duration is working on the
   minority meter.
3. **Reducing invocations is the only lever that moves both meters at once.**
   Total CPU = invocations × CPU-per-invocation, and memory-time scales the
   same way.
4. Average daily active CPU is **~6.5 min/day (~392s/day)** (196 min / 30).

## The per-route table is Duration, not Active CPU

The per-route table is labelled `activeCPU` in one view and `Duration` in
another. The numbers say it is **Duration**:

| route | invocations | value | per-invocation |
|---|---|---|---|
| `/api/match-results` | 86–89 | 12s | ~140ms |
| `/api/summary` | 49–64 | 7–9s | ~140ms |
| `/api/replay/[id]` | 11 | 1.22s | ~111ms |
| `/api/usage/[metric]` | 12–16 | 0.98–1.69s | ~96ms |
| `/api/rank` | 5–10 | 0.72–1.38s | ~140ms |
| `/api/match-replay` | 9–10 | 0.47–0.67s | ~57ms |
| `/api/rank/[id]` | 1–3 | 0.17–0.38s | ~140ms |

`12s / 89 ≈ 135ms`, which matches the directly measured billed Execution
Duration (117ms in the trace below) almost exactly. Active CPU on an
I/O-bound route would be far *below* wall-clock, not equal to it. So this
column includes network and queueing, **not** billed CPU.

### The routes in this table are at most ~6% of the CPU bill

Total across the table is ~22.56s of duration for ~176 invocations. Daily
active CPU is ~392s. Because active CPU can never exceed wall-clock duration,
these routes account for **≤ 22.56 / 392 ≈ 5.8% of daily active CPU**.

That is an upper bound, and it is the single most important open question
below: the bulk of the CPU meter is *not* in the routes we have been looking
at. Do not spend more effort on `/api/match-results` until that is resolved.

## Landed changes

### A. Replay TTL + single-pipeline write — `MatchResultService`

`addMatchResult` used to run 5 sequential KV commands (`set`, `zadd`,
`zrange(0,-33)` probe, conditional `del`, `zremrangebyrank`). Replaced with:

- `set(match_replay:<id>, replayData, { ex: MATCH_REPLAY_TTL_SECONDS })` —
  `MATCH_REPLAY_TTL_SECONDS = 5 * 24 * 60 * 60`. Redis expires the replay; the
  probe and the `del` are gone.
- `set` + `zadd` + `zremrangebyrank` queued on one `pipeline()` → **single HTTP
  round trip**.

Before: 5 commands / 5 sequential hops. After: 3 commands / 1 hop. This is
old next-steps #1 and #2, done.

**Constraint to keep watching:** `N` must outlive how long a match stays in the
32-row window, or the lobby shows a replay button that 404s on
`/api/match-replay`. At the baseline ~89 uploads/day, 32 rows span ~8h, so 5
days is very safe. It breaks if uploads fall below ~6.4/day (32 / 5 days).
5 days was chosen without deriving it from actual match rate — revisit if
traffic drops.

### B. Hourly leaderboard cache — `src/pages/api/summary.ts`

`getTopNBatch` runs through `unstable_cache` with `revalidate: 3600`. Only that
call is cached; `hiscores` and `recentMatches` stay uncached so new matches
appear in the lobby immediately.

`limitElo` is passed as an argument so `unstable_cache` folds it into the cache
key — otherwise `?limitElo=5` and `?limitElo=10` collide on one entry.

`src/tests/api.summary.test.ts` mocks `next/cache` to call through; the real
module pulls in web streams APIs jsdom does not provide (`TextEncoder is not
defined`).

Worth keeping even though it is not the 7s: it is the only part of any route
whose cost grows with the player base. `getTopNBatch` does an `hgetall` of the
entire `elo:<ruleType>` hash for every rule type, then decays, maps and sorts
every player in JS. At current size that is a few ms; it does not stay that way.

### C. Lazy Glicko2 load — `src/services/RatingService.ts`

Removed the module-scope `const glicko = new Glicko2(...)` (that top-level
instantiation is what forced `glicko2.ts` to be evaluated on import) and
replaced it with a cached lazy loader:

```ts
import type { Glicko2 as Glicko2Instance } from "glicko2.ts"  // type-only: erased
let glickoPromise: Promise<Glicko2Instance> | undefined
function getGlicko() {
  if (!glickoPromise) glickoPromise = import("glicko2.ts").then(...)
  return glickoPromise
}
```

`updateMatchRatings` is now `async`; its only caller awaits it. The `import
type` matters — a value import would defeat the whole thing.

Edge compatibility confirmed: Vercel/Next Edge disables `eval` and
`new Function`, not `import()` of a static specifier. `yarn build` compiles the
route cleanly.

**Expected impact: close to nil.** Per the Ruled out section, `glicko2.ts` is
14KB and the route's whole import graph is under 1MB against a 311–451MB
isolate. This only defers cold-start module evaluation, and only for
invocations that never reach the ELO block (GETs and solo uploads). Kept
because it is free and correct, not because it will move the meter.

### D. Dropped the payload re-serialisation

`match-results.ts` logged `payloadBytes: JSON.stringify(data).length` on every
POST — a full re-serialisation of the request body purely to measure it. Line
removed. The other `[mr-timing]` logs are kept; they only stringify the small
detail object.

## Measurements: `/api/match-results`

The only caller is `../billiards/src/network/client/scorereporter.ts:19`, and
it only ever POSTs. It retries up to 3 times with exponential backoff, but
there are no failures in practice, so invocations ≈ real match uploads.

One solo upload, function executing in `lhr1`:

```
[mr-timing] POST parsed {"parsedMs":1,"replayBytes":809,"isTwoPlayer":false}
[mr-timing] POST stored {"storeMs":73}
[mr-timing] POST done   {"totalMs":88,"parsedMs":1,"storeMs":73,"eloMs":null,"isTwoPlayer":false}
```

Matching Vercel log: Execution Duration 117ms, Memory 451MB, response 334ms.

| Stage | ms |
|---|---|
| parse body + replay | 1 |
| `addMatchResult` — 5 sequential commands | **73** |
| UA parse, object build, serialise, log lines | ~14 |
| **in-function total** | **88** |
| billed Execution Duration | 117 |
| **implied fixed overhead** | **~29** |

1. **Real work is ~75% of the billed invocation.** Overhead is ~29ms.
2. **`addMatchResult` was 83% of the function, and 3 of its 5 commands existed
   only to maintain a 32-row cap.** Those 3 are now gone (change A).

### Round trip cost

73ms across 5 sequential commands ≈ **~15ms per round trip**. That is very high
for Redis; same-region is normally 1-2ms. The function ran in `lhr1`, so the KV
instance is probably in a different region. The probe (`zrange(0,-33)`) was
likely the most expensive: it deserialised up to 33 full `MatchResult` objects —
including `userAgent`, `browser` and `os` strings — over the wire to read one
`id` per entry.

## Glicko2 internals

Motivated by change C, but the interesting finding is elsewhere.

**The heavy maths really does run for only 2 players.** `Player.update_rank()`
early-returns when `outcomes.length === 0`:

```js
update_rank() {
  if (!this.hasPlayed()) { this._preRatingRD(); return }
  ...full Glicko math...
}
```

`cleanPreviousMatches()` wipes `adv_ranks` / `adv_rds` / `outcomes` for every
player, and `addResult` repopulates them only for the two current players. So
on `calculatePlayersRatings()`, only those two take the expensive path; every
stale player does one `Math.sqrt`. **An earlier note here claiming "each ELO
update gets progressively more expensive" was wrong as stated.**

**But the iteration is quadratic, and the player set never shrinks.**
`makePlayer` creates a new id and stores the player in `this.players` on every
call, so N grows by 2 per two-player match for the life of the isolate. And:

```js
cleanPreviousMatches() {
  for (let i = 0; i < Object.keys(this.players).length; i++) {  // ← every iteration
    ...
  }
}
```

`Object.keys(this.players)` sits in the loop **condition**, so it rebuilds the
whole key array on every iteration — O(N²) per update. (`calculatePlayersRatings`
is the benign one; it hoists `const keys = Object.keys(...)` once and is O(N).)

**Practical impact today is small.** Most uploads are solo, so the ELO block
runs rarely and N likely stays in the single/low-double digits per isolate.
This is a latent scaling hazard, not the current fire — at 2× traffic with a
firmer two-player share it stops being negligible.

**Fix:** `glicko.removePlayers()` at the end of `updateMatchRatings` caps N at
2 permanently, turning both loops into no-ops. Safe — `makePlayer` never looks
up existing ids, so nothing depends on the accumulated map. **Not yet applied.**

## Ruled out

Kept here so these are not re-investigated.

**"Cache headers on the GET will cut compute."** The GET has no callers at all.
`scorereporter.ts` only POSTs; the lobby reads matches via `/api/summary`, which
calls `MatchResultService.getMatchResults` directly. `s-maxage=15` on the GET is
caching a response nobody requests. POSTs are not cacheable regardless — this is
why the cache hit column reads 0%. Not a misconfiguration.

**"There is a ~100ms cold-start floor per invocation."** Wrong. Derived from
dividing table duration by invocation count. Direct measurement shows ~29ms.

**"Reduce memory by dropping heavy modules."** Still true. `glicko2.ts` ships
14KB of `index.js`; the 412K on disk is mostly source maps. Against a 311–451MB
isolate baseline this is a rounding error. Vendoring a minimal Glicko
implementation would be worse: hand-rolled rating maths on a player-facing
leaderboard to save ~0.3%. Change C does the lazy load anyway for init
deferral, with no expectation of a measurable win.

**"The replay payload is inflating memory."** Measured: 809 bytes of replay
data, 250 bytes of metadata. Not a factor.

**"`getTopNBatch` is the CPU hog."** Wrong about the mechanism. It is real work
that scales with player count, so the cache is still worth having, but at
current size it was never the 7s.

**"`CORS_HEADERS` is missing `Access-Control-Allow-Origin`."** Not an issue —
`src/proxy.ts:18` sets it for all `/api/*` requests.

**"`waitUntil` will cut ELO compute."** Rejected. `waitUntil` keeps the
invocation alive to finish background work — Vercel bills the extended
duration, so the work is still paid for. It improves p50 latency and nothing
else, and makes rating updates fire-and-forget: a failure after the response is
sent is silently lost.

## Next steps

### 1. Find the other ~94% of active CPU — highest value

The routes in the per-route table are ≤6% of daily active CPU (see above). The
3h16m meter is dominated by something we have not looked at. Until this is
resolved, further work on `/api/match-results` is optimising ~3% of the gap.

Check, in order: the CPU graph filtered to Functions vs Proxy vs pages; any
route not in the table; `/elo` and `/player/[name]` (both dynamic per the build
output); and `/viewlogs`. Confirm whether the per-route table itself is
filtered to "Functions" only.

### 2. Confirm the KV region

~15ms per round trip strongly implies the KV instance is not in the function's
execution region. The structural problem: **Edge runs nearest-to-user, so it
can never be co-located with a single-region KV.** This is the biggest lever on
the match-results duration, and it is a runtime/region decision, not a code one.

Note also that `next build` now warns: *"The Edge Runtime is deprecated. You can
use the nodejs runtime instead."* Moving this route to Node with a pinned
region would both kill the cross-region hop and align with the deprecation.

### 3. `removePlayers()` in `updateMatchRatings`

One line. See Glicko2 internals. Cheap insurance against the O(N²) loop; low
urgency at current traffic.

### 4. Batch writes (structural, only if 1-3 leave the bill unsatisfactory)

At ~89 uploads we pay ~89 isolate boots to append rows to a sorted set. Options:
drain a queue on a timer/cron (10 writes per invocation ≈ 10× reduction), or
make the POST a cheap append and let a separate process do eviction. The user
has said invocation count cannot be cut and is expected to double, so this may
be off the table — record the constraint rather than plan around it.

## Open questions

- **Where is the other ~94% of active CPU?** (see Next steps #1)
- Real solo vs two-player ratio in production — `eloMs` in the logs answers it,
  and it bounds how much the Glicko path matters at all.
- Is the per-route table Duration or Active CPU? All the evidence says Duration
  (see above), but the label disagreement is unresolved.
- Memory read 311MB in `sin1` and 451MB in `lhr1`. Probably region variance, but
  not established from single samples.
- ~~Whether Vercel bills Fluid on Execution Duration or wall-clock.~~
  **Answered:** Fluid bills Active CPU (actual CPU time) *plus* provisioned
  memory for the invocation's duration. Time spent awaiting I/O counts toward
  the memory meter but not the CPU meter. So round-trip reduction helps memory
  and latency; it does not help the CPU meter that is at 82%.

## Instrumentation currently in the tree

`src/pages/api/match-results.ts` carries temporary `[mr-timing]`
`console.log` lines: `POST parsed`, `POST stored`, `POST done`, `GET done`.
The `payloadBytes` field has been removed (change D); the rest remain.

Deliberately uses `console.log` rather than `logger.log` — `logger.enabled` is
derived from `typeof process` (`src/utils/logger.ts:47`), which is exactly the
Edge runtime condition, so `logger.log` would silently print nothing and waste a
deploy cycle. Uses `performance.now()` via `globalThis` because `Date.now()` has
too little resolution to measure a 12ms budget.

**Remove when done** — they count against Vercel log volume.
