# Fluid Compute Optimisation

Working notes on reducing Vercel Fluid Compute for the scoreboard API routes.
Started 1 Oct 2026. Updated 1 Oct 2026 after reading the 30-day usage graphs and
inspecting the `glicko2.ts` internals. Updated again 1 Oct 2026 after reading the
Functions dashboard aggregates and auditing what `/api/summary` actually does.

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
3. **Expected user growth makes request volume a fixed constraint.** Optimise
   CPU and memory consumed by each request now; do not base the plan on fewer
   client calls or lower traffic.
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

**Correction (1 Oct 2026, second pass).** The "I/O-bound route" premise above
does not hold for `/api/summary`, whose active CPU is ~70% of its wall clock.
See the dashboard section below. This does *not* overturn the conclusion that
the column is Duration — summary's own numbers are internally consistent with
that reading — but it does mean these routes are far more CPU-heavy than the
framing suggests, and that KV round trips are not where their CPU goes.

### The routes in this table are at most ~6% of the CPU bill

Total across the table is ~22.56s of duration for ~176 invocations. Daily
active CPU is ~392s. Because active CPU can never exceed wall-clock duration,
these routes account for **≤ 22.56 / 392 ≈ 5.8% of daily active CPU**.

**Update (12h data).** The newer per-route table (260 invocations, 27.63s over
12 hours) projects to **~55s/day**, or **≤14% of daily active CPU** — double the
earlier estimate. If the two windows are not comparable, treat the 6–14% range
as the honest bracket rather than either figure alone.

The conclusion is unchanged in direction: the bulk of the meter is **not** in
the routes we have been looking at, and the fixed-cost floor above applies to
every route on the list.

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

## What `/api/summary` does per invocation

Audited because it is called externally from `../messaging/src/client/lobby.html`
(via `info-panel.js`, which fetches `${SCOREBOARD_URL}/api/summary`), and from
`public/lobby.js` (`motd-panel`) and `public/info.html`.

Query params: `limitElo` (default 10), `limitMatches` (default 32). No auth and
no method check — any verb runs the same body.

**Four KV operations, three of them concurrent:**

| # | Call | Command | Notes |
|---|---|---|---|
| 1 | `markUsageFromServer("lobby")` | `zincrby lobbyUsage 1 {date}` | **a write**, fired before the `Promise.all` and never awaited |
| 2 | `scoreTable.topTenMulti(4 rule types)` | pipeline of 4× `zrange hiscore:<type> 0 9` | 1 hop, 40 rows |
| 3 | `getCachedTopNBatch(limitElo)` | via `unstable_cache` revalidate 3600 | miss: 1 hop, 4× `hgetall elo:<type>`. hit: no KV |
| 4 | `getMatchResults(32)` | `zrange match_results 0 31 rev` | 1 hop, 32 full `MatchResult` objects |

Because 2–4 are in `Promise.all`, wall-clock I/O is roughly **one** round trip
(~15ms at the rate measured below), not three. With the hourly cache warm,
topPlayers costs nothing, leaving two parallel reads.

### Three things it does that are not KV reads

1. **A KV write on every request** (`zincrby`), plus an `unstable_cache` write
   on each hourly revalidation.
2. **`Response.json` over a ~20KB body.** This is the largest non-KV CPU item.
   The payload carries fields neither client renders:
   - `recentMatches` ships 32 objects including `userAgent`, `browser`, `os`,
     `version`, `locationRegion`. Both callers read only `id`, `winner`,
     `loser`, `winnerScore`, `loserScore`, `ruleType`, `timestamp`,
     `hasReplay`, `locationCountry`, `locationCity`, `arenaId`, `tableSize`,
     `freeaim`, `berserk`.
   - `hiscores` returns 40 rows; the lobby renders the top 4 per game.
3. **Module-scope init**: three service objects built at import. `RatingService`
   no longer drags in `glicko2.ts` (change C), so the graph is small — but see
   the cold-start finding below, which makes this non-trivial on 40% of
   invocations.

### The `waitUntil` branch is dead code

`summary.ts` is typed `(request: NextRequest, event?: NextFetchEvent)` — the
**App Router** signature. This is a **Pages Router** route, so Next passes
`(req: NextApiRequest, res: NextApiResponse)`. `event.waitUntil` is therefore
`undefined`, the `typeof === "function"` guard fails, and `waitUntil` is never
called.

Two consequences:

1. The `zincrby` is a floating promise the edge runtime may drop once the
   response is sent, so **`lobbyUsage` is probably undercounting**.
2. `waitUntil` would not help even if it fired — see Ruled out.

The usage metric is also redundant here: invocation count is visible directly in
the Vercel dashboard.

## Vercel dashboard aggregates (all functions)

Read 1 Oct 2026, Functions view, **last 12 hours** of the free-tier reporting
window. These are **estate-wide**, not per-route.

| metric | value |
|---|---|
| Compute model | Fluid |
| Active CPU | P75 **145ms** |
| Memory usage | avg **392 MB** / 2.05 GB |
| CPU throttle | P75 **14.7%** |
| Cold start | **40.5%** |

### Per-route breakdown (same 12h window)

| route | invocations | value | ms/invocation |
|---|---|---|---|
| `/api/match-results` | 111 | 11s | **99.1** |
| `/api/summary` | 85 | 10s | **117.6** |
| `/api/usage/[metric]` | 20 | 1.96s | **98.0** |
| `/api/rank` | 15 | 1.61s | **107.3** |
| `/api/replay/[id]` | 7 | 840ms | **120.0** |
| `/api/match-replay` | 12 | 840ms | **70.0** |
| `/player/[name]` | 2 | 440ms | **220.0** |
| `/api/speedrun-results` | 4 | 440ms | **110.0** |
| `/api/player/[name]` | 2 | 290ms | **145.0** |
| `/api/rank/[id]` | 2 | 210ms | **105.0** |
| **total** | **260** | **27.63s** | **106.3** |

The Cache Hit column reads **0% on every row** — see the cadence finding below.

### What they say

**Active CPU P75 145ms does not indict `/api/summary`.** Summary bills
**117.6ms/invocation** (10s / 85), which sits *below* the estate P75. The 145ms
is being set by heavier routes. Still true after the corrections below.

**Memory is a non-issue.** 392MB is ~19% of the per-invocation dimension and
memory overall is ~3% consumed. CPU at 82% binds first.

**CPU throttle 14.7% needs no correction factor.** At low throttle, invocations
run near full speed, so CPU removed translates roughly linearly to the meter.

**Cold start 40.5% is the one genuinely new and actionable signal.** It applies
to every edge route in the table, so **~40% of every route's invocations pay
full isolate boot + module-graph evaluation as billed CPU, before the handler
runs.** See the fixed-cost floor below — this is where it shows up.

### The fixed-cost floor is the real story

Sort the table by ms/invocation and the work each route does barely correlates:

| route | actual work | ms/inv |
|---|---|---|
| `/api/match-replay` | **one `kv.get`** | **70** |
| `/api/usage/[metric]` | **one `zincrby`** | **98** |
| `/api/rank` | one `zrange`, 10 rows | 107 |
| `/api/summary` | 2–3 parallel reads + ~20KB stringify | 118 |

`/api/match-replay` performs a **single KV read** and still bills 70ms.
`/api/usage/[metric]` performs a **single KV write** and bills 98ms. Summary
does three reads, a write, and serialises ~20KB of JSON — and bills only ~20–48ms
more than the one-write route.

**So roughly 70–100ms of every invocation is fixed overhead — isolate boot,
module evaluation, runtime warmup — and the handler's actual work is the
minority of the bill.** This is the 40.5% cold start showing through, averaged
over cold and warm invocations.

Consequences:

- **Micro-optimising handler bodies targets the small part.** Trimming summary's
  payload (Next steps) is worth doing because it is nearly free, but it is
  optimising the ~20–48ms slice, not the 70–100ms floor.
- **The floor makes per-request efficiency more important as traffic grows.**
  It is paid on every request, so the practical work is to establish how much
  is app-controlled and reduce that portion before growth compounds it.
- It also explains why the earlier "there is a ~100ms cold-start floor"
  hypothesis was dismissed as wrong: that note divided *table duration by
  invocation count* to get ~140ms, then compared it to a ~29ms measured overhead
  and concluded no floor existed. The 29ms was measured on a *warm* invocation.
  The floor is real, it is just invisible to warm-path instrumentation.

### Cache hit is 0% everywhere, and cannot be otherwise

Every row reads 0% cache hit. Given the request cadence, that is expected and
**not a misconfiguration**:

| route | cadence | `s-maxage` | can it hit? |
|---|---|---|---|
| `/api/summary` | one per **8.5 min** | 120s | no |
| `/api/usage/[metric]` | one per **36 min** | 86400s (GET) | no |

At 8.5-minute spacing in this dataset, a 120-second `s-maxage` window cannot
contain two origin-bound requests. **The measured 0% hit rate therefore does
not support the 120-second cache as the explanation for summary's lower
invocation count in this window.** It may still normally suppress summary
origin invocations when multiple users poll within the same window, which is a
plausible explanation for summary being below game-results traffic in a
different or busier window. Verify that hypothesis with CDN request count and
cache-hit data over a representative growth period before changing the TTL.

(Note `/api/usage/[metric]`'s 86400s header applies to `GET` only; its `PUT`
handler — the one being invoked — is uncacheable by definition.)

### The uncomfortable ratio

Summary bills **117.6ms/invocation** here, against ~140ms wall clock from the
earlier 30-day row. The gap between the two is small, and given the fixed-cost
floor above, most of it is per-invocation overhead rather than KV wait.

Only ~15ms of a summary invocation is I/O — the read branches run in
`Promise.all`, and with the hourly cache warm topPlayers costs nothing, leaving
two parallel reads. The rest is fixed overhead plus `JSON.parse` of the KV
responses and `JSON.stringify` of the ~20KB body. **KV round trips are not where
this route's CPU goes** — which also means the cross-region KV problem (Next
steps, KV region) is a latency and memory-meter fix for this route, not a
CPU-meter one.

### An instrumentation blind spot

`logTiming("start", ...)` fires at the **top of the handler**, which is *after*
the entire import graph and the three module-scope constructors have already
been evaluated. Therefore:

- `totalMs` measures handler-entry → response only.
- Module-init cost sits **outside** the measured window entirely — as does the
  ~29ms fixed overhead derived for match-results.
- On the 40% cold-start invocations, the largest single CPU block is one the
  `[summary-timing]` logs **cannot observe**.

The dashboard says module init is a first-class CPU cost and the current harness
is structurally blind to it. Change C already captures the one app-level
module-eval win; the remainder is framework/runtime baseline, which is not ours
to trim.

### Correction: 111 invocations / 11s is `/api/match-results`, not `/api/summary`

An earlier pass in this file quoted "11s / 111 invocations = ~99ms" as
`/api/summary`'s figure. That was a misreading of the per-route table: the
**111 / 11s row is `/api/match-results`**. Summary is **85 / 10s = 117.6ms**.

This does not overturn the conclusions above — summary at 117.6ms is still below
the 145ms estate P75 — but the specific numbers attributed to summary were wrong
and are corrected throughout. Note the coincidence that made this easy to get
wrong: summary is the route most likely to be *assumed* to be the expensive one.

Separately, the 30-day row in this file (49–64 invocations / 7–9s) versus 85
invocations / 10s over 12 hours is a large traffic difference. Either traffic has
grown substantially, or the two views are scoped differently (30-day average vs
12-hour window). **Unresolved — do not mix figures from the two windows.**

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

**"There is a ~100ms cold-start floor per invocation."** **Correct after
all — see the fixed-cost floor section.** The original rejection was wrong in its
reasoning: the ~29ms figure came from `[mr-timing]` on a *warm* invocation, and
`logTiming("start")` fires after module init, so warm-path instrumentation is
structurally blind to the floor. The 12h per-route table settles it:
`/api/match-replay` does one `kv.get` and bills 70ms; `/api/usage/[metric]` does
one `zincrby` and bills 98ms. The floor is real, and it is the single largest
component of every route in the table.

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

Ordered by value against the CPU meter, not by effort.

**Framing shift (1 Oct 2026).** The 12h per-route table shows a **70–100ms
fixed-cost floor per invocation** that is independent of handler work, against
an estate P75 of 145ms. Two implications reorder this list:

- Handler-body micro-optimisation targets the **minority** slice of each
  invocation. Items 3 and 4 are still worth doing because they are nearly free,
  but they are not where the bill is.
- **Request volume will grow and is not an optimisation lever.** The plan must
  reduce the app-controlled CPU and payload work on each request, while treating
  the fixed floor as capacity to budget for.

### 1. Find the other ~86% of active CPU — highest value

These routes are ≤14% of daily active CPU (6–14% depending on window), and
summary at 117.6ms/inv sits below the 145ms estate P75 — so the P75 is set by
routes not on the list. Until this is resolved, work on any listed route is
optimising a small share.

Check, in order: the CPU graph filtered to Functions vs Proxy vs pages; any
route not in the table (note `/elo` and `/viewlogs` are absent from it, and
`/player/[name]` appears at 220ms/inv — the worst per-invocation figure
observed); and whether the per-route table is filtered to "Functions" only.
Start from the 145ms P75 cohort.

### 2. Confirm whether the fixed-cost floor is reducible

The floor is 70–100ms/inv and paid on 100% of invocations (40.5% of them at full
cold start). Before optimising anything else, establish what it is made of:
- How much is isolate boot vs module-graph evaluation vs runtime warmup?
- Is it the Next.js Edge runtime baseline (not ours to fix), or our import graph?

Levers, in order of promise: move to the **Node runtime** (also resolves the
deprecation warning) and re-measure; shrink the import graph per route; and check
whether the routes share isolates at all at this traffic level — at ~1
invocation per 8.5 minutes there is no reuse to be had, so **every invocation
may be paying full boot regardless of the cold-start percentage.**

This is the highest-leverage diagnostic in the document. It is also the one
that could make items 3–6 irrelevant if the floor turns out to be irreducible
framework cost.

### 3. Make the floor measurable

`[summary-timing]` and `[mr-timing]` both log at handler entry, so they cannot
see module init or boot. Add a module-init timestamp, or compare Vercel's
per-invocation reported CPU against in-handler `totalMs`. Without this, none of
the above can be validated. Do it before 4–6.

### 4. Trim the `/api/summary` response payload

Drop `userAgent`, `browser`, `os`, `version`, `locationRegion` from
`recentMatches`, and cap hiscores at the 4 rows per game the lobby actually
renders. Nearly free, and it also cuts response bytes for three callers
(`../messaging/src/client/info-panel.js`, `public/lobby.js`, `public/info.html`),
all of which read only the retained fields. Expect a small win — this is the
~20–48ms slice, not the floor.

### 5. Drop the summary usage write

Remove the `zincrby` and the dead `waitUntil` branch; correct the handler
signature to the Pages Router one. Saves a write per invocation and stops
`lobbyUsage` from under-reporting. Note `/api/usage/[metric]` is itself billed
98ms/inv for a single `zincrby` — so this route is paying full boot to record
a metric the dashboard already provides.

### 6. Confirm the KV region

~15ms per round trip strongly implies the KV instance is not in the function's
execution region. The structural problem: **Edge runs nearest-to-user, so it
can never be co-located with a single-region KV.**

Downgraded from the original #2: for `/api/summary` this is a **latency and
memory-meter** fix, not a CPU-meter one, since KV waits are only ~15ms of a
~118ms CPU-dominated invocation. Still the biggest lever on match-results
*latency*, where the KV write is a larger share of the work.

`next build` also warns: *"The Edge Runtime is deprecated. You can use the nodejs
runtime instead."* Note this now overlaps with #2 — if the Node move happens,
pin the region in the same change and get both.

### 7. `removePlayers()` in `updateMatchRatings`

One line. See Glicko2 internals. Cheap insurance against the O(N²) loop; low
urgency at current traffic.

## Open questions

- **Where is the other ~86% of active CPU?** (see Next steps #1). The 145ms P75
  cohort is the place to start; `/elo` and `/viewlogs` are absent from the table
  entirely.
- **What is the 70–100ms fixed-cost floor made of, and is any of it ours?**
  (Next steps #2.) This now gates every other decision on this page.
- **Do these isolates share at all?** At ~1 invocation per 8.5 minutes, warm
  reuse may be negligible, in which case the 40.5% cold-start figure understates
  how much boot is paid overall.
- **Is the per-route column Duration or Active CPU?** Better supported than
  before — a 70ms bill for a single `kv.get` is Duration-like, not CPU-like —
  but the label disagreement is still unresolved.
- **Why does 30-day data show 49–64 summary invocations where 12h shows 85?**
  Traffic growth or different scoping. **Do not mix figures across the two
  windows.**
- Real solo vs two-player ratio in production — `eloMs` in the logs answers it,
  and it bounds how much the Glicko path matters at all.
- Memory read 311MB in `sin1` and 451MB in `lhr1`; dashboard now reports 392MB
  avg. Probably region variance, but not established from single samples.
- ~~Whether Vercel bills Fluid on Execution Duration or wall-clock.~~
  **Answered:** Fluid bills Active CPU (actual CPU time) *plus* provisioned
  memory for the invocation's duration. Time spent awaiting I/O counts toward
  the memory meter but not the CPU meter. So round-trip reduction helps memory
  and latency; it does not help the CPU meter that is at 82%.

## Instrumentation currently in the tree

`src/pages/api/match-results.ts` carries temporary `[mr-timing]`
`console.log` lines: `POST parsed`, `POST stored`, `POST done`, `GET done`.

`src/pages/api/summary.ts` carries `[summary-timing]` lines: `start` and `done`,
recording `hiscoresMs`, `topPlayersMs`, `recentMatchesMs`, `usageMs` and
`totalMs`. **Known limitation:** `start` is logged at handler entry, so module
init and cold-start cost are outside every number it reports. See the blind-spot
section above.
The `payloadBytes` field has been removed (change D); the rest remain.

Deliberately uses `console.log` rather than `logger.log` — `logger.enabled` is
derived from `typeof process` (`src/utils/logger.ts:47`), which is exactly the
Edge runtime condition, so `logger.log` would silently print nothing and waste a
deploy cycle. Uses `performance.now()` via `globalThis` because `Date.now()` has
too little resolution to measure a 12ms budget.

**Remove when done** — they count against Vercel log volume.

## Recommended approach for expected growth

Treat growth in API calls as non-negotiable. The immediate goal is to lower
active CPU per request and prevent the per-request work from growing with the
player base:

1. **Attribute the missing CPU and measure the fixed floor first.** Use the
   Functions/Proxy/page breakdown and per-invocation dashboard data to find the
   unaccounted CPU, then compare billed CPU with in-handler timings. This tells
   us whether a Node-runtime/region move or route import-graph work can reduce
   the 70–100ms floor.
2. **Apply the safe per-request work reductions.** Trim the summary payload,
   remove its redundant usage write and dead `waitUntil` path, and add
   `removePlayers()` to keep rating work bounded. These lower CPU or response
   work without relying on reduced traffic.
3. **Preserve and verify summary caching for growth.** `/api/summary` would
   normally be a high-frequency route; its 120-second CDN cache is a plausible
   reason it appears below game-results in origin invocations. The current
   0%-hit, 8.5-minute-cadence sample cannot prove that explanation, so measure
   CDN requests and hits during a representative busy period before tuning the
   TTL. A cache hit avoids origin compute while keeping the same client demand.
4. **Re-measure after each deployed change.** Compare CPU per request, cold
   starts, response size and cache-hit rate over like-for-like windows. Success
   is a lower per-request CPU baseline that can absorb expected growth, not a
   lower call count.
